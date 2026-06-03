import os
from dotenv import load_dotenv
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

load_dotenv()

SMTP_HOST = os.getenv("SMTP_HOST") or ""
SMTP_PORT = os.getenv("SMTP_PORT") or ""
SMTP_USERNAME = os.getenv("SMTP_USERNAME") or ""
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD") or ""
EMAIL_FROM = os.getenv("EMAIL_FROM") or ""
VERIFY_EMAIL_URL = os.getenv("VERIFY_EMAIL_URL") or ""


def send_verification_email(to_email, token):
    verification_link = f"{VERIFY_EMAIL_URL}?token={token}"
    print(verification_link)

    plain_body = f"Verify your account by visiting this link:\n{verification_link}"

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

    message = MIMEMultipart("alternative")
    message["Subject"] = "Verify your account"
    message["From"] = EMAIL_FROM
    message["To"] = to_email

    message.attach(MIMEText(plain_body, "plain"))
    message.attach(MIMEText(html_body, "html"))

    server = None
    try:
        server = smtplib.SMTP(SMTP_HOST, int(SMTP_PORT))
        server.starttls()
        server.login(
            SMTP_USERNAME,
            SMTP_PASSWORD
        )
        server.sendmail(
            EMAIL_FROM,
            to_email,
            message.as_string()
        )
        print("EMAIL SENT SUCCESSFULLY")
    except Exception as e:
        print("EMAIL ERROR:", e)
        raise
    finally:
        if server:
            server.quit()
