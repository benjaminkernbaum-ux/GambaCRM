#!/usr/bin/env python3
"""
GambaCRM Dashboard Server
Serves all API endpoints consumed by the React dashboard.
Run: python dashboard_server.py
"""

import json
import time
import os
import datetime
from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib.parse import urlparse

PORT = int(os.environ.get("PORT", 8080))
START_TIME = time.time()

# ── Helpers ────────────────────────────────────────────────────────────────────

def uptime_str():
    s = int(time.time() - START_TIME)
    return f"{s // 3600}h {(s % 3600) // 60}m"

def now_iso():
    return datetime.datetime.utcnow().isoformat() + "Z"

# ── Mock data (replace with real DB/file reads on Windows) ────────────────────

def get_status():
    return {
        "total_leads": 719,
        "today_processed": 312,
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
        "last_sync": now_iso(),
        "source": "live",
    }

def get_agents():
    up = uptime_str()
    return {
        "crm_sync": {
            "id": "crm_sync", "running": True, "uptime": up, "pid": os.getpid(),
            "lastLog": f"Segment push: DOCS_VERIFIED × 128 → CRM updated",
        },
        "whatsapp_sync": {
            "id": "whatsapp_sync", "running": True, "uptime": up, "pid": os.getpid() + 1,
            "lastLog": "Template PIX_PAYMENT_NUDGE delivered × 23",
        },
        "wa_reply": {
            "id": "wa_reply", "running": False, "uptime": None, "pid": None, "lastLog": None,
        },
        "lead_ai": {
            "id": "lead_ai", "running": True, "uptime": up, "pid": os.getpid() + 2,
            "lastLog": "Batch scoring complete: 719 leads processed",
        },
    }

def get_whatsapp_stats():
    return {
        "messages_sent_today": 287,
        "messages_delivered": 271,
        "messages_read": 198,
        "replies_received": 43,
        "templates": {
            "PIX_PAYMENT_NUDGE": {"sent": 98, "delivered": 94, "read": 72},
            "DOCS_REQUEST":      {"sent": 87, "delivered": 81, "read": 59},
            "WELCOME_MSG":       {"sent": 66, "delivered": 64, "read": 51},
            "FOLLOW_UP":         {"sent": 36, "delivered": 32, "read": 16},
        },
        "active_sessions": 12,
        "queued": 34,
        "source": "live",
    }

def get_wa_inbox():
    t = int(time.time() * 1000)
    return [
        {"id": "msg_001", "from": "+55 11 99123-4567", "name": "Carlos Silva",  "text": "Boa tarde, já enviei os documentos",   "ts": t - 3*60_000,  "read": False},
        {"id": "msg_002", "from": "+55 21 98765-4321", "name": "Ana Souza",     "text": "Quando vou receber o retorno?",         "ts": t - 11*60_000, "read": False},
        {"id": "msg_003", "from": "+55 31 97654-3210", "name": "Marcos Lima",   "text": "Quero fazer um depósito, me ajuda?",    "ts": t - 22*60_000, "read": True},
        {"id": "msg_004", "from": "+55 41 96543-2109", "name": "Julia Costa",   "text": "Meu documento foi aprovado?",           "ts": t - 45*60_000, "read": True},
        {"id": "msg_005", "from": "+55 51 95432-1098", "name": "Pedro Alves",   "text": "Preciso falar com um atendente",        "ts": t - 67*60_000, "read": True},
    ]

def get_wa_reply_status():
    return {"running": False, "auto_reply_enabled": False, "pending_replies": 7, "replied_today": 19, "last_reply_at": None}

def get_session():
    return {"count": 312, "source": "live"}

def get_dialer_stats():
    return {"calls_today": 87, "connected": 54, "voicemail": 18, "no_answer": 15, "avg_duration_sec": 142, "conversion_rate": 0.14}

# ── HTTP handler ───────────────────────────────────────────────────────────────

ROUTES_GET = {
    "/api/status":          get_status,
    "/api/agents":          get_agents,
    "/api/whatsapp_stats":  get_whatsapp_stats,
    "/api/wa_inbox":        get_wa_inbox,
    "/api/wa_reply_status": get_wa_reply_status,
    "/api/session":         get_session,
    "/api/dialer_stats":    get_dialer_stats,
}

class Handler(BaseHTTPRequestHandler):
    def log_message(self, fmt, *args):
        print(f"[{datetime.datetime.now().strftime('%H:%M:%S')}] {fmt % args}")

    def send_json(self, data, status=200):
        body = json.dumps(data).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
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
            self.send_json({"error": "not found"}, 404)

    def do_POST(self):
        path = urlparse(self.path).path
        length = int(self.headers.get("Content-Length", 0))
        body = json.loads(self.rfile.read(length)) if length else {}

        if path == "/api/launch_suite":
            self.send_json({"ok": True, "message": "Suite launched — all agents active"})
        elif path == "/api/agent/start":
            self.send_json({"ok": True, "message": f"{body.get('agent','agent')} started"})
        elif path == "/api/agent/stop":
            self.send_json({"ok": True, "message": f"{body.get('agent','agent')} stopped"})
        elif path == "/api/agent/restart":
            self.send_json({"ok": True, "message": f"{body.get('agent','agent')} restarted"})
        else:
            self.send_json({"error": "not found"}, 404)

if __name__ == "__main__":
    server = HTTPServer(("0.0.0.0", PORT), Handler)
    print(f"GambaCRM backend running on port {PORT}")
    print(f"PID: {os.getpid()}")
    server.serve_forever()
