import os
from dotenv import load_dotenv

load_dotenv()

SMTP_HOST = os.getenv("SMTP_HOST") or ""
SMTP_PORT = os.getenv("SMTP_PORT") or ""
SMTP_USERNAME = os.getenv("SMTP_USERNAME") or ""
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD") or ""
EMAIL_FROM = os.getenv("EMAIL_FROM") or ""
VERIFY_EMAIL_URL = os.getenv("VERIFY_EMAIL_URL") or ""


import json
import urllib.request

def send_verification_email(to_email, token):
    verification_link = f"{VERIFY_EMAIL_URL}?token={token}"

    html_body = f"""
    <html>
    <body>
        <h2>Verify your account</h2>
        <p>
            Click the button below:
        </p>
        <a href="{verification_link}"
           style="display:inline-block;padding:12px 24px;background:#4F46E5;
                  color:#ffffff;text-decoration:none;border-radius:6px;font-weight:bold;">
            Verify Email
        </a>
        <p style="margin-top:16px;color:#666666;font-size:13px;">
            If the button doesn't work, copy and paste this link into your browser:<br>
            <span style="color:#4F46E5;">{verification_link}</span>
        </p>
    </body>
    </html>
    """

    print(f"VERIFICATION LINK FOR {to_email}: {verification_link}", flush=True)

    resend_api_key = os.getenv("RESEND_API_KEY")
    
    if not resend_api_key:
        print("Warning: RESEND_API_KEY is not set. Cannot send email.")
        return

    req = urllib.request.Request("https://api.resend.com/emails", method="POST")
    req.add_header("Authorization", f"Bearer {resend_api_key}")
    req.add_header("Content-Type", "application/json")
    
    # NOTE: Resend requires a verified domain to send from any address other than onboarding@resend.dev
    # And onboarding@resend.dev can only send TO the email address you registered your Resend account with!
    data = {
        "from": "Auralis <onboarding@resend.dev>", 
        "to": [to_email],
        "subject": "Verify your Auralis account",
        "html": html_body
    }
    
    try:
        with urllib.request.urlopen(req, data=json.dumps(data).encode("utf-8"), timeout=10) as response:
            print(f"Resend success: {response.status}")
    except Exception as e:
        if hasattr(e, 'read'):
            print(f"Resend API Error: {e.read().decode('utf-8')}")
        print(f"Failed to send email via Resend: {e}")
        raise
