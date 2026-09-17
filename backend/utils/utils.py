import re
import time
from collections import defaultdict

import gradio as gr

EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$")

def is_valid_email(email: str) -> bool:
    if not email or not isinstance(email, str):
        return False
    email = email.strip()
    if len(email) > 254:
        return False
    return bool(EMAIL_REGEX.match(email))

def get_client_ip(request: gr.Request | None) -> str:
    if not request:
        return "127.0.0.1"
    headers = getattr(request, "headers", {}) or {}
    cf_ip = headers.get("cf-connecting-ip")
    if cf_ip:
        return cf_ip.strip()
    x_forwarded = headers.get("x-forwarded-for")
    if x_forwarded:
        return x_forwarded.split(",")[0].strip()
    x_real_ip = headers.get("x-real-ip")
    if x_real_ip:
        return x_real_ip.strip()
    if hasattr(request, "client") and request.client and getattr(request.client, "host", None):
        return request.client.host
    return "unknown"
