from __future__ import annotations

import smtplib
from email.mime.text import MIMEText
from typing import Optional

from ..config import settings


def is_configured() -> bool:
    return bool(settings.SMTP_HOST and settings.SMTP_PORT and settings.SMTP_FROM)


def send_text(to: str, subject: str, body: str) -> Optional[str]:
    if not is_configured():
        return None
    msg = MIMEText(body, _charset='utf-8')
    msg['Subject'] = subject
    msg['From'] = settings.SMTP_FROM or ''
    msg['To'] = to
    try:
        with smtplib.SMTP(settings.SMTP_HOST, int(settings.SMTP_PORT or 25)) as s:
            s.starttls()
            if settings.SMTP_USER and settings.SMTP_PASSWORD:
                s.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            s.sendmail(settings.SMTP_FROM, [to], msg.as_string())
        return 'sent'
    except Exception:
        return None

