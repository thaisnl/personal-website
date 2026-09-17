from utils.utils import is_valid_email
import json
from functools import partial
from openai.types.chat import ChatCompletionMessageToolCallUnion

from context.context import RECORD_UNKNOWN_QUESTION_JSON, RECORD_USER_DETAILS_JSON
from services.notification import (
    NotificationService,
    NotificationServiceFactory,
    NotificationServiceTypes,
)
from utils.cooldown_cache import CooldownCache

user_cooldown = CooldownCache(ttl_seconds=600.0)
question_cooldown = CooldownCache(ttl_seconds=600.0)


def record_user_details(
    notification_service: NotificationService,
    email: str,
    name: str = "Name not provided",
    notes: str = "Not provided",
):
    clean_email = email.strip() if isinstance(email, str) else ""
    if not is_valid_email(clean_email):
        return (
            "Erro: O formato do e-mail informado é inválido. "
            "Por favor, solicite ao usuário um endereço de e-mail válido (ex: nome@dominio.com)."
        )

    clean_name = (name.strip() if isinstance(name, str) else "Name not provided")[:100]
    clean_notes = (notes.strip() if isinstance(notes, str) else "Not provided")[:500]

    email_key = clean_email.lower()
    if not user_cooldown.is_on_cooldown(email_key):
        notification_service.send_notification(
            message=f"New user wants to get in touch! Email: {clean_email}, Name: {clean_name}, Notes: {clean_notes}"
        )
    return "OK"


def record_unknown_question(notification_service: NotificationService, question: str):
    clean_question = (question.strip() if isinstance(question, str) else "")[:500]
    if not clean_question:
        return "OK"

    question_key = clean_question.lower()
    if not question_cooldown.is_on_cooldown(question_key):
        notification_service.send_notification(
            message=f"Someone asked you a question you don't know the answer to. Question: {clean_question}"
        )
    return "OK"


tools = [
    {"type": "function", "function": RECORD_USER_DETAILS_JSON},
    {"type": "function", "function": RECORD_UNKNOWN_QUESTION_JSON},
]

notification_service = NotificationServiceFactory.factory_method(
    NotificationServiceTypes.TELEGRAM
)

TOOL_MAPPINGS = {
    "record_user_details": partial(record_user_details, notification_service),
    "record_unknown_question": partial(record_unknown_question, notification_service),
}


def format_llm_message(role: str, content: str, extra: dict | None = None) -> dict:
    return {"role": role, "content": content, **(extra or {})}


def handle_tool_calls(tool_calls: list[ChatCompletionMessageToolCallUnion]):
    results = []
    for tool_call in tool_calls:
        tool_name = tool_call.function.name
        # deserializar os argumentos em json
        arguments = json.loads(tool_call.function.arguments)
        tool = TOOL_MAPPINGS.get(tool_name)
        if not tool:
            continue
        result = tool(**arguments)
        results.append(
            format_llm_message(
                role="tool",
                content=json.dumps(result),
                extra={"tool_call_id": tool_call.id},
            )
        )
    return results
