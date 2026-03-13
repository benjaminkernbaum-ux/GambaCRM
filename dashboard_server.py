#!/usr/bin/env python3
"""
GambaCRM Dashboard Server  —  v2
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Serves the built React dashboard at http://localhost:8080/
• Manages real automation scripts as sub-processes (start / stop / restart)
• Opens Chrome on launch_suite
• Falls back to status-file data when available

Run (one command):
  python dashboard_server.py

Then open http://localhost:8080/ in Chrome.

If dist/ does not exist yet, run once:
  npm run build
"""

import json, time, os, sys, subprocess, threading, signal, datetime, mimetypes
from http.server        import BaseHTTPRequestHandler, HTTPServer
from urllib.parse       import urlparse
from pathlib            import Path

PORT       = int(os.environ.get("PORT", 8080))
HERE       = Path(__file__).parent.resolve()
DIST       = HERE / "dist"
START_TIME = time.time()

# ── Script registry ────────────────────────────────────────────────────────────
# Point SCRIPTS_DIR to wherever your automation .py files live.
# Default: same folder as this file.  Override with env var SCRIPTS_DIR.

SCRIPTS_DIR = Path(os.environ.get("SCRIPTS_DIR", HERE))

AGENT_SCRIPTS = {
    "crm_sync":       "live_crm_email_sync.py",
    "whatsapp_sync":  "live_crm_whatsapp_sync.py",
    "wa_reply":       "wa_reply_agent.py",
    "lead_ai":        "lead_scoring_ai.py",
}

# CRM URL opened in Chrome when Launch Suite is clicked
CRM_URL = "https://crmbeta.gambacrm.com/clients"

# ── Process registry ───────────────────────────────────────────────────────────

_procs: dict[str, subprocess.Popen] = {}
_start_times: dict[str, float]      = {}
_last_logs: dict[str, str]          = {}
_lock = threading.Lock()

def _script_path(agent_id: str) -> Path | None:
    name = AGENT_SCRIPTS.get(agent_id)
    if not name:
        return None
    p = SCRIPTS_DIR / name
    return p if p.exists() else None

def _uptime(agent_id: str) -> str | None:
    t = _start_times.get(agent_id)
    if t is None:
        return None
    s = int(time.time() - t)
    return f"{s // 3600}h {(s % 3600) // 60}m"

def _is_running(agent_id: str) -> bool:
    with _lock:
        p = _procs.get(agent_id)
        return p is not None and p.poll() is None

def _stream_output(agent_id: str, proc: subprocess.Popen):
    """Read stdout/stderr from a subprocess and store last line."""
    try:
        for line in proc.stdout:
            line = line.rstrip()
            if line:
                _last_logs[agent_id] = line
                print(f"[{agent_id}] {line}")
    except Exception:
        pass

def _start_agent(agent_id: str) -> dict:
    if _is_running(agent_id):
        return {"ok": True, "message": f"{agent_id} already running", "pid": _procs[agent_id].pid}

    script = _script_path(agent_id)
    if script is None:
        # Script not found — return ok but mark as simulated
        _last_logs[agent_id] = f"[sim] {agent_id} started (script not found in {SCRIPTS_DIR})"
        _start_times[agent_id] = time.time()
        return {"ok": True, "message": f"{agent_id} started (simulation — place {AGENT_SCRIPTS[agent_id]} in {SCRIPTS_DIR})", "simulated": True}

    try:
        proc = subprocess.Popen(
            [sys.executable, str(script)],
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1,
            cwd=str(SCRIPTS_DIR),
        )
        with _lock:
            _procs[agent_id]       = proc
            _start_times[agent_id] = time.time()
            _last_logs[agent_id]   = f"{AGENT_SCRIPTS[agent_id]} started (PID {proc.pid})"
        t = threading.Thread(target=_stream_output, args=(agent_id, proc), daemon=True)
        t.start()
        return {"ok": True, "message": f"{agent_id} started", "pid": proc.pid}
    except Exception as e:
        return {"ok": False, "message": str(e)}

def _stop_agent(agent_id: str) -> dict:
    with _lock:
        proc = _procs.pop(agent_id, None)
        _start_times.pop(agent_id, None)
    if proc and proc.poll() is None:
        proc.terminate()
        try: proc.wait(timeout=5)
        except subprocess.TimeoutExpired: proc.kill()
    _last_logs[agent_id] = f"{agent_id} stopped"
    return {"ok": True, "message": f"{agent_id} stopped"}

def _restart_agent(agent_id: str) -> dict:
    _stop_agent(agent_id)
    time.sleep(0.5)
    return _start_agent(agent_id)

# ── Status-file helpers (read .json files written by real scripts) ─────────────

def _read_status_file(name: str) -> dict | None:
    for p in [HERE / f"{name}.json", HERE / "status" / f"{name}.json"]:
        if p.exists():
            try:
                return json.loads(p.read_text())
            except Exception:
                pass
    return None

# ── API data builders ──────────────────────────────────────────────────────────

def get_agents():
    result = {}
    for aid in AGENT_SCRIPTS:
        running  = _is_running(aid)
        pid_val  = _procs[aid].pid if running and aid in _procs else None
        result[aid] = {
            "id":      aid,
            "running": running,
            "uptime":  _uptime(aid) if running else None,
            "pid":     pid_val,
            "lastLog": _last_logs.get(aid),
        }
    return result

def get_status():
    # Try real status file first
    data = _read_status_file("crm_status") or _read_status_file("status")
    if data:
        return {**data, "source": "live"}
    return {
        "total_leads": 719,
        "today_processed": _count_processed(),
        "segments": {
            "DOCS_VERIFIED": 128, "PIX_READY": 21, "HIGH_INTENT_DEPOSIT": 22,
            "NEW_LEAD": 58, "WELCOME_NEW_REG": 38, "SUCCESSFUL_CONTACT": 31,
            "NO_ANSWER": 25, "DOCS_PENDING": 27, "DOCS_UNDER_REVIEW": 24,
            "FAILED_DEPOSIT": 14, "MARGIN_CALL": 10, "STOP_OUT": 6,
            "SKIP_COOLDOWN": 22, "SKIP_CLOSED": 16, "SKIP_ACTIVE": 76,
            "REASSIGNED": 45, "REASSIGNED_2": 85,
            "REJECT_SCREENSHOT": 19, "REJECT_MISSING_SIDE": 15,
            "REJECT_BW": 13, "REJECT_NAME_MISMATCH": 13, "REJECT_EXPIRED": 11,
        },
        "last_sync": datetime.datetime.utcnow().isoformat() + "Z",
        "source": "mock",
    }

def _count_processed() -> int:
    data = _read_status_file("session")
    return data.get("count", 0) if data else 0

def get_whatsapp_stats():
    data = _read_status_file("whatsapp_stats")
    if data:
        return {**data, "source": "live"}
    return {
        "messages_sent_today": 287, "messages_delivered": 271,
        "messages_read": 198, "replies_received": 43,
        "templates": {
            "PIX_PAYMENT_NUDGE": {"sent": 98, "delivered": 94, "read": 72},
            "DOCS_REQUEST":      {"sent": 87, "delivered": 81, "read": 59},
            "WELCOME_MSG":       {"sent": 66, "delivered": 64, "read": 51},
            "FOLLOW_UP":         {"sent": 36, "delivered": 32, "read": 16},
        },
        "active_sessions": 12, "queued": 34, "source": "mock",
    }

def get_wa_inbox():
    data = _read_status_file("wa_inbox")
    if data:
        return data if isinstance(data, list) else data.get("messages", [])
    t = int(time.time() * 1000)
    return [
        {"id":"msg_001","from":"+55 11 99123-4567","name":"Carlos Silva", "text":"Boa tarde, já enviei os documentos","ts":t-3*60_000,"read":False},
        {"id":"msg_002","from":"+55 21 98765-4321","name":"Ana Souza",    "text":"Quando vou receber o retorno?",       "ts":t-11*60_000,"read":False},
        {"id":"msg_003","from":"+55 31 97654-3210","name":"Marcos Lima",  "text":"Quero fazer um depósito, me ajuda?", "ts":t-22*60_000,"read":True},
        {"id":"msg_004","from":"+55 41 96543-2109","name":"Julia Costa",  "text":"Meu documento foi aprovado?",        "ts":t-45*60_000,"read":True},
    ]

def get_wa_reply_status():
    data = _read_status_file("wa_reply_status")
    return data or {"running": _is_running("wa_reply"), "auto_reply_enabled": False, "pending_replies": 7, "replied_today": 19, "last_reply_at": None}

def get_session():
    data = _read_status_file("session")
    return data or {"count": _count_processed() or 312, "source": "mock"}

def get_dialer_stats():
    data = _read_status_file("dialer_stats")
    return data or {"calls_today": 87, "connected": 54, "voicemail": 18, "no_answer": 15, "avg_duration_sec": 142, "conversion_rate": 0.14}

def do_launch_suite():
    """Start CRM sync + WhatsApp sync, then open Chrome to CRM."""
    results = {}
    for aid in ("crm_sync", "whatsapp_sync", "lead_ai"):
        results[aid] = _start_agent(aid)

    # Open Chrome to CRM
    try:
        import webbrowser
        webbrowser.open(CRM_URL)
        chrome_msg = f"Chrome opened → {CRM_URL}"
    except Exception as e:
        chrome_msg = f"Could not open browser: {e}"

    return {
        "ok": True,
        "message": f"Suite launched — CRM Sync + WhatsApp + Lead AI started. {chrome_msg}",
        "agents": results,
    }

# ── Static file server ─────────────────────────────────────────────────────────

MIME = {
    ".html": "text/html", ".js": "application/javascript",
    ".css": "text/css",   ".json": "application/json",
    ".ico": "image/x-icon", ".png": "image/png",
    ".svg": "image/svg+xml", ".woff2": "font/woff2",
    ".woff": "font/woff",   ".ttf": "font/ttf",
}

def serve_static(handler, url_path: str):
    """Serve a file from dist/, falling back to index.html for SPA routing."""
    if not DIST.exists():
        body = (
            b"<h2>Dashboard not built yet.</h2>"
            b"<p>Run <code>npm run build</code> in the GambaCRM folder, then restart the server.</p>"
        )
        handler.send_response(200)
        handler.send_header("Content-Type", "text/html")
        handler.send_header("Content-Length", str(len(body)))
        handler.end_headers()
        handler.wfile.write(body)
        return

    # Map URL path to file
    rel = url_path.lstrip("/") or "index.html"
    file_path = DIST / rel

    # SPA fallback — any unknown path serves index.html
    if not file_path.exists() or not file_path.is_file():
        file_path = DIST / "index.html"

    suffix = file_path.suffix.lower()
    content_type = MIME.get(suffix, "application/octet-stream")

    try:
        data = file_path.read_bytes()
        handler.send_response(200)
        handler.send_header("Content-Type", content_type)
        handler.send_header("Content-Length", str(len(data)))
        # Cache assets forever, never cache index.html
        if suffix in (".js", ".css", ".woff2", ".woff", ".ttf", ".png", ".ico", ".svg"):
            handler.send_header("Cache-Control", "public, max-age=31536000, immutable")
        else:
            handler.send_header("Cache-Control", "no-cache")
        handler.end_headers()
        handler.wfile.write(data)
    except Exception as e:
        handler.send_response(500)
        handler.end_headers()

# ── HTTP handler ───────────────────────────────────────────────────────────────

ROUTES_GET = {
    "/api/agents":          get_agents,
    "/api/status":          get_status,
    "/api/whatsapp_stats":  get_whatsapp_stats,
    "/api/wa_inbox":        get_wa_inbox,
    "/api/wa_reply_status": get_wa_reply_status,
    "/api/session":         get_session,
    "/api/dialer_stats":    get_dialer_stats,
}

class Handler(BaseHTTPRequestHandler):
    def log_message(self, fmt, *args):
        # Suppress noisy asset requests
        path = self.path.split("?")[0]
        if any(path.endswith(x) for x in (".js", ".css", ".woff2", ".ico", ".png", ".svg")):
            return
        print(f"[{datetime.datetime.now().strftime('%H:%M:%S')}] {fmt % args}")

    def send_json(self, data, status=200):
        body = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_GET(self):
        path = urlparse(self.path).path
        if path in ROUTES_GET:
            self.send_json(ROUTES_GET[path]())
        else:
            serve_static(self, path)

    def do_POST(self):
        path = urlparse(self.path).path
        length = int(self.headers.get("Content-Length", 0))
        body   = json.loads(self.rfile.read(length)) if length else {}

        if path == "/api/launch_suite":
            self.send_json(do_launch_suite())
        elif path == "/api/agent/start":
            agent = body.get("agent", "")
            self.send_json(_start_agent(agent) if agent in AGENT_SCRIPTS else {"ok": False, "message": "unknown agent"})
        elif path == "/api/agent/stop":
            agent = body.get("agent", "")
            self.send_json(_stop_agent(agent) if agent in AGENT_SCRIPTS else {"ok": False, "message": "unknown agent"})
        elif path == "/api/agent/restart":
            agent = body.get("agent", "")
            self.send_json(_restart_agent(agent) if agent in AGENT_SCRIPTS else {"ok": False, "message": "unknown agent"})
        else:
            self.send_json({"error": "not found"}, 404)

# ── Startup ────────────────────────────────────────────────────────────────────

def _print_banner():
    built = "✓ dist/ found — dashboard ready" if DIST.exists() else "✗ dist/ NOT found — run: npm run build"
    scripts_found = [k for k, v in AGENT_SCRIPTS.items() if (SCRIPTS_DIR / v).exists()]
    scripts_missing = [v for k, v in AGENT_SCRIPTS.items() if not (SCRIPTS_DIR / v).exists()]

    print("━" * 60)
    print(f"  GambaCRM Dashboard Server  (port {PORT})")
    print("━" * 60)
    print(f"  {built}")
    print(f"  Scripts dir : {SCRIPTS_DIR}")
    if scripts_found:
        print(f"  Scripts ✓   : {', '.join(scripts_found)}")
    if scripts_missing:
        print(f"  Scripts ✗   : {', '.join(scripts_missing)} (will simulate)")
    print("━" * 60)
    print(f"  → Open in Chrome: http://localhost:{PORT}/")
    print("━" * 60)

def _shutdown(sig, frame):
    print("\nShutting down — stopping all agents…")
    for aid in list(_procs.keys()):
        _stop_agent(aid)
    sys.exit(0)

if __name__ == "__main__":
    signal.signal(signal.SIGINT,  _shutdown)
    signal.signal(signal.SIGTERM, _shutdown)
    _print_banner()

    server = HTTPServer(("0.0.0.0", PORT), Handler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        _shutdown(None, None)
