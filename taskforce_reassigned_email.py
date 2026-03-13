#!/usr/bin/env python3
"""
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  TASK FORCE  —  Reassigned Leads  →  Black Arrow Email
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Reads REASSIGNED + REASSIGNED_2 from the CRM API
  Sends every lead the Black Arrow unlock email
  Same .env as your other scripts — just run it.

  Usage:
    python taskforce_reassigned_email.py
    python taskforce_reassigned_email.py --dry-run   (preview, no emails sent)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"""

import os, sys, smtplib, time, json, urllib.request, urllib.parse
from email.mime.multipart import MIMEMultipart
from email.mime.text      import MIMEText
from datetime             import datetime
from pathlib              import Path

# ── Load .env from same folder ─────────────────────────────────────────────────

def load_env():
    env_path = Path(__file__).parent / ".env"
    if not env_path.exists():
        return
    for line in env_path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, val = line.partition("=")
        os.environ.setdefault(key.strip(), val.strip().strip('"').strip("'"))

load_env()

# ── Config (all from .env) ─────────────────────────────────────────────────────

SMTP_HOST    = os.environ.get("SMTP_HOST",    "smtp.gmail.com")
SMTP_PORT    = int(os.environ.get("SMTP_PORT", "587"))
SMTP_USER    = os.environ.get("SMTP_USER",    "")
SMTP_PASS    = os.environ.get("SMTP_PASSWORD", os.environ.get("SMTP_PASS", ""))
FROM_NAME    = os.environ.get("FROM_NAME",    "Benjamin | FXGlobe")
FROM_EMAIL   = os.environ.get("FROM_EMAIL",   SMTP_USER)
CRM_TOKEN    = os.environ.get("CRM_TOKEN",    os.environ.get("CRM_API_KEY", ""))
CRM_BASE     = os.environ.get("CRM_BASE_URL", "https://crmbeta.gambacrm.com")
BLACK_ARROW_LINK = os.environ.get("BLACK_ARROW_LINK", "https://fxglobe.com/black-arrow")

DRY_RUN = "--dry-run" in sys.argv

# ── Helpers ────────────────────────────────────────────────────────────────────

def log(msg):
    ts = datetime.now().strftime("%H:%M:%S")
    print(f"[{ts}] {msg}")

def crm_get(path: str) -> dict | list:
    url = CRM_BASE.rstrip("/") + path
    req = urllib.request.Request(url, headers={
        "Authorization": f"Bearer {CRM_TOKEN}",
        "Content-Type":  "application/json",
        "Accept":        "application/json",
    })
    with urllib.request.urlopen(req, timeout=15) as r:
        return json.loads(r.read().decode())

# ── Fetch reassigned leads from CRM ───────────────────────────────────────────

def fetch_reassigned_leads() -> list[dict]:
    """
    Tries common CRM API patterns to get reassigned leads.
    Adjust the endpoint/filter to match your CRM's actual API.
    """
    leads = []
    for segment in ("REASSIGNED", "REASSIGNED_2"):
        try:
            # Try query-param style first
            data = crm_get(f"/api/clients?segment={segment}&limit=500")
            rows = data if isinstance(data, list) else data.get("data", data.get("clients", data.get("results", [])))
            leads.extend(rows)
            log(f"  CRM ✓  {segment}: {len(rows)} leads fetched")
        except Exception as e:
            log(f"  CRM ✗  {segment}: {e}")

    # Deduplicate by id/email
    seen = set()
    unique = []
    for lead in leads:
        key = lead.get("id") or lead.get("email") or lead.get("crmId")
        if key and key not in seen:
            seen.add(key)
            unique.append(lead)
    return unique

# ── HTML Email Template ────────────────────────────────────────────────────────

def build_email_html(first_name: str) -> str:
    return f"""<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Documentação aprovada</title>
</head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#111117;border-radius:12px;overflow:hidden;max-width:600px;">

          <!-- HEADER -->
          <tr>
            <td style="padding:32px 40px 24px;text-align:center;border-bottom:1px solid #1e1e2e;">
              <div style="font-size:22px;font-weight:800;color:#ffffff;letter-spacing:2px;">FXGlobe</div>
              <div style="font-size:11px;color:#6b7280;letter-spacing:4px;margin-top:6px;">ACCOUNT MANAGER · BENJAMIN</div>
            </td>
          </tr>

          <!-- KYC BADGE -->
          <tr>
            <td style="padding:32px 40px 8px;text-align:center;">
              <span style="display:inline-block;background:#1a2e1a;border:1px solid #22c55e;border-radius:20px;padding:6px 16px;font-size:12px;color:#22c55e;font-weight:600;letter-spacing:2px;">
                ✅ KYC VERIFICADO
              </span>
            </td>
          </tr>

          <!-- HEADLINE -->
          <tr>
            <td style="padding:16px 40px 8px;">
              <h1 style="margin:0;font-size:32px;font-weight:800;color:#ffffff;line-height:1.2;">
                Documentação aprovada.
              </h1>
              <h1 style="margin:4px 0 0;font-size:32px;font-weight:800;color:#ef4444;line-height:1.2;">
                Agora é hora de operar.
              </h1>
            </td>
          </tr>

          <!-- BODY TEXT -->
          <tr>
            <td style="padding:20px 40px 8px;">
              <p style="margin:0;font-size:16px;color:#9ca3af;line-height:1.7;">
                Parabéns <strong style="color:#ffffff;">{first_name}</strong>! Sua identidade foi confirmada
                e sua conta está <strong style="color:#ffffff;">100% liberada</strong>.
                Agora só falta ativar sua <strong style="color:#ffffff;">Black Arrow</strong> —
                plataforma exclusiva FXGlobe, <strong style="color:#ffffff;">completamente gratuita</strong>:
              </p>
            </td>
          </tr>

          <!-- SECTION TITLE -->
          <tr>
            <td style="padding:28px 40px 4px;text-align:center;">
              <div style="font-size:11px;color:#6b7280;letter-spacing:4px;">INCLUÍDO NA SUA CONTA</div>
              <div style="margin-top:8px;font-size:24px;font-weight:800;color:#ffffff;">
                ⚡ Black Arrow <span style="color:#ef4444;">100% Gratuita</span>
              </div>
              <div style="font-size:13px;color:#6b7280;margin-top:4px;">Sem mensalidade · Sem mínimo operado</div>
            </td>
          </tr>

          <!-- FEATURES GRID -->
          <tr>
            <td style="padding:24px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="50%" style="padding:10px 12px 10px 0;vertical-align:top;">
                    <div style="font-size:20px;">🎙️</div>
                    <div style="font-size:14px;font-weight:700;color:#ffffff;margin-top:4px;">Sala ao Vivo</div>
                    <div style="font-size:12px;color:#6b7280;margin-top:2px;">Análises e calls em tempo real</div>
                  </td>
                  <td width="50%" style="padding:10px 0 10px 12px;vertical-align:top;">
                    <div style="font-size:20px;">📚</div>
                    <div style="font-size:14px;font-weight:700;color:#ffffff;margin-top:4px;">Educação Premium</div>
                    <div style="font-size:12px;color:#6b7280;margin-top:2px;">Conteúdo exclusivo para traders</div>
                  </td>
                </tr>
                <tr>
                  <td width="50%" style="padding:10px 12px 10px 0;vertical-align:top;">
                    <div style="font-size:20px;">🔄</div>
                    <div style="font-size:14px;font-weight:700;color:#ffffff;margin-top:4px;">Copy Trading</div>
                    <div style="font-size:12px;color:#6b7280;margin-top:2px;">Copie os melhores automaticamente</div>
                  </td>
                  <td width="50%" style="padding:10px 0 10px 12px;vertical-align:top;">
                    <div style="font-size:20px;">📊</div>
                    <div style="font-size:14px;font-weight:700;color:#ffffff;margin-top:4px;">Indicadores</div>
                    <div style="font-size:12px;color:#6b7280;margin-top:2px;">Ferramentas personalizadas</div>
                  </td>
                </tr>
                <tr>
                  <td width="50%" style="padding:10px 12px 10px 0;vertical-align:top;">
                    <div style="font-size:20px;">📉</div>
                    <div style="font-size:14px;font-weight:700;color:#ffffff;margin-top:4px;">Spreads Baixos</div>
                    <div style="font-size:12px;color:#6b7280;margin-top:2px;">O menor custo do mercado</div>
                  </td>
                  <td width="50%" style="padding:10px 0 10px 12px;vertical-align:top;">
                    <div style="font-size:20px;">🎁</div>
                    <div style="font-size:14px;font-weight:700;color:#ffffff;margin-top:4px;">Bônus 100%</div>
                    <div style="font-size:12px;color:#6b7280;margin-top:2px;">Dobra seu capital no 1º depósito</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA BUTTON -->
          <tr>
            <td style="padding:8px 40px 40px;text-align:center;">
              <a href="{BLACK_ARROW_LINK}"
                 style="display:inline-block;background:linear-gradient(135deg,#b91c1c,#dc2626);color:#ffffff;
                        font-size:16px;font-weight:700;padding:18px 40px;border-radius:10px;
                        text-decoration:none;letter-spacing:0.5px;">
                Desbloquear Black Arrow Agora &rsaquo;
              </a>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="padding:20px 40px;text-align:center;border-top:1px solid #1e1e2e;">
              <p style="margin:0;font-size:12px;color:#374151;">
                FXGlobe · Account Manager Benjamin<br>
                <a href="#" style="color:#6b7280;font-size:11px;">Cancelar inscrição</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""

# ── Send one email ─────────────────────────────────────────────────────────────

def send_email(to_email: str, to_name: str, smtp: smtplib.SMTP) -> bool:
    first_name = to_name.split()[0] if to_name else to_email.split("@")[0]

    msg = MIMEMultipart("alternative")
    msg["Subject"] = f"✅ {first_name}, sua documentação foi aprovada — ative seu Black Arrow"
    msg["From"]    = f"{FROM_NAME} <{FROM_EMAIL}>"
    msg["To"]      = f"{to_name} <{to_email}>" if to_name else to_email

    text_body = (
        f"Parabéns {first_name}!\n\n"
        "Sua identidade foi confirmada e sua conta está 100% liberada.\n"
        "Agora só falta ativar sua Black Arrow — plataforma exclusiva FXGlobe, completamente gratuita.\n\n"
        f"Acesse agora: {BLACK_ARROW_LINK}\n\n"
        "— Benjamin | FXGlobe Account Manager"
    )

    msg.attach(MIMEText(text_body, "plain", "utf-8"))
    msg.attach(MIMEText(build_email_html(first_name), "html", "utf-8"))

    smtp.sendmail(FROM_EMAIL, to_email, msg.as_string())
    return True

# ── Main ───────────────────────────────────────────────────────────────────────

def main():
    print("━" * 58)
    print("  TASK FORCE — Black Arrow Email — Reassigned Leads")
    print("━" * 58)

    if DRY_RUN:
        log("DRY RUN mode — no emails will be sent")

    # Validate config
    if not SMTP_USER or not SMTP_PASS:
        log("ERROR: SMTP_USER and SMTP_PASSWORD must be set in .env")
        sys.exit(1)
    if not CRM_TOKEN:
        log("WARNING: CRM_TOKEN not set — fetching will likely fail")

    # Fetch leads
    log("Fetching reassigned leads from CRM…")
    leads = fetch_reassigned_leads()

    if not leads:
        log("No leads found. Check CRM_TOKEN and CRM_BASE_URL in .env")
        sys.exit(0)

    # Filter leads that have an email
    sendable = [l for l in leads if l.get("email")]
    skipped  = len(leads) - len(sendable)
    log(f"Found {len(leads)} leads | {len(sendable)} have email | {skipped} skipped (no email)")

    if not sendable:
        log("Nothing to send.")
        sys.exit(0)

    if DRY_RUN:
        log("─" * 40)
        for lead in sendable:
            log(f"  [DRY] Would send → {lead.get('name','?')} <{lead['email']}>")
        log("─" * 40)
        log(f"DRY RUN complete — {len(sendable)} emails would be sent")
        return

    # Connect SMTP
    log(f"Connecting to SMTP {SMTP_HOST}:{SMTP_PORT}…")
    try:
        smtp = smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=15)
        smtp.ehlo()
        smtp.starttls()
        smtp.login(SMTP_USER, SMTP_PASS)
        log("SMTP connected ✓")
    except Exception as e:
        log(f"SMTP connection failed: {e}")
        sys.exit(1)

    # Send emails
    sent = 0
    failed = 0
    log(f"Sending to {len(sendable)} leads…")
    log("─" * 40)

    for i, lead in enumerate(sendable, 1):
        email = lead.get("email", "")
        name  = lead.get("name", lead.get("full_name", ""))

        try:
            send_email(email, name, smtp)
            log(f"  [{i}/{len(sendable)}] ✓  {name} <{email}>")
            sent += 1
            time.sleep(0.4)   # ~2.5 emails/sec — safe for most SMTP limits
        except Exception as e:
            log(f"  [{i}/{len(sendable)}] ✗  {name} <{email}> — {e}")
            failed += 1
            time.sleep(1)

    smtp.quit()

    log("─" * 40)
    log(f"DONE — {sent} sent | {failed} failed | {skipped} skipped (no email)")
    print("━" * 58)

    # Write result log
    result = {
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "task": "taskforce_reassigned_black_arrow",
        "total_leads": len(leads),
        "sent": sent,
        "failed": failed,
        "skipped_no_email": skipped,
    }
    log_path = Path(__file__).parent / "taskforce_result.json"
    log_path.write_text(json.dumps(result, indent=2))
    log(f"Result saved → {log_path.name}")

if __name__ == "__main__":
    main()
