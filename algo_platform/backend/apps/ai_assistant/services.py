import requests
from django.conf import settings

SYSTEM_PROMPT = (
    "Ты — ассистент по подготовке к олимпиадам по программированию. "
    "Направляй пользователя к решению задачи наводящими вопросами и "
    "подсказками, не приводя готовый код и не раскрывая решение напрямую. "
    "Если пользователь прислал свой код, проанализируй его и дай "
    "рекомендации по корректности и эффективности."
)


def ask_assistant(problem_description: str, user_code: str | None, question: str) -> str:
    """Отправляет запрос к DeepSeek API и возвращает ответ ассистента.

    Премиум-пользователям доступен чат-ассистент на странице задачи
    (см. главу 2 пояснительной записки): ассистент видит условие задачи
    и, при наличии, текущий код пользователя.
    """

    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    context = f"Условие задачи:\n{problem_description}"
    if user_code:
        context += f"\n\nТекущий код пользователя:\n{user_code}"
    messages.append({"role": "user", "content": context})
    messages.append({"role": "user", "content": question})

    response = requests.post(
        settings.DEEPSEEK_API_URL,
        headers={"Authorization": f"Bearer {settings.DEEPSEEK_API_KEY}"},
        json={"model": "deepseek-chat", "messages": messages},
        timeout=30,
    )
    response.raise_for_status()
    return response.json()["choices"][0]["message"]["content"]
