import json
import os
from pathlib import Path

from fastapi import FastAPI
import gradio as gr
from openai import OpenAI
import uvicorn

from context.context import SYSTEM_PROMPT
from settings import SETTINGS
from tools.tools import format_llm_message, handle_tool_calls, tools
from utils.ip_rate_limiter import IPRateLimiter
from utils.utils import get_client_ip

BACKEND_DIR = Path(__file__).resolve().parent

openai = OpenAI(api_key=SETTINGS.open_router.api_key, base_url=SETTINGS.open_router.path)

DEFAULT_ALLOWED_ORIGINS = (
    "http://localhost:5500,"
    "http://127.0.0.1:5500,"
    "http://localhost:8080,"
    "http://127.0.0.1:8080,"
    "http://localhost:5173,"
    "http://127.0.0.1:5173,"
    "http://localhost:3000,"
    "http://127.0.0.1:3000,"
    "http://localhost:7860,"
    "http://127.0.0.1:7860,"
    "https://thais.dev,"
    "https://www.thais.dev,"
    "https://thaisnl.pages.dev,"
    "https://thaisnl.thaistnl10.workers.dev,"
    "https://thaisnl.vercel.app"
)

rate_limiter = IPRateLimiter(max_requests=10, window_seconds=60.0)

def load_embed_js() -> str:
    allowed_origins = [
        origin.strip()
        for origin in os.environ.get("ALLOWED_PARENT_ORIGINS", DEFAULT_ALLOWED_ORIGINS).split(",")
        if origin.strip()
    ]
    embed_js = (BACKEND_DIR / "embed.js").read_text(encoding="utf-8")
    return embed_js.replace("__ALLOWED_ORIGINS__", json.dumps(allowed_origins))


def load_embed_css() -> str:
    return (BACKEND_DIR / "embed.css").read_text(encoding="utf-8")


def chat(message: str, history: list[dict], request: gr.Request):
    client_ip = get_client_ip(request)
    if rate_limiter.is_rate_limited(client_ip):
        return (
            "⏳ **Limite de mensagens atingido.** Você enviou muitas perguntas em um curto intervalo "
            "(máximo de 10 por minuto). Por favor, aguarde alguns instantes antes de continuar."
        )

    extra_body = {}
    if SETTINGS.open_router.provider:
        extra_body["provider"] = {
            "order": [SETTINGS.open_router.provider],
            "allow_fallbacks": True,
        }

    messages = [format_llm_message("system", SYSTEM_PROMPT)] + history + [format_llm_message("user", message)]
    response = openai.chat.completions.create(
        model=SETTINGS.open_router.model,
        messages=messages,
        tools=tools,
        extra_body=extra_body if extra_body else None,
    )
    while response.choices[0].finish_reason == "tool_calls":
        message = response.choices[0].message
        tool_calls = message.tool_calls
        called_tools_results = handle_tool_calls(tool_calls=tool_calls)
        messages.append(message)
        messages.extend(called_tools_results)
        response = openai.chat.completions.create(
            model=SETTINGS.open_router.model,
            messages=messages,
            tools=tools,
            extra_body=extra_body if extra_body else None,
        )
    return response.choices[0].message.content


demo = gr.ChatInterface(
    chat,
    chatbot=gr.Chatbot(show_label=False),
)
demo.queue(default_concurrency_limit=5)

app = FastAPI(title="Thaís Digital Twin API", version="0.1.0")


@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "digital-twin-backend"}


embed_css = load_embed_css()
embed_js = load_embed_js()

app = gr.mount_gradio_app(
    app=app,
    blocks=demo,
    path="/",
    head=f"<style>{embed_css}</style><script>{embed_js}</script>",
    js=embed_js,
    css=embed_css,
)

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 7860))
    uvicorn.run("app:app", host="0.0.0.0", port=port, reload=False)