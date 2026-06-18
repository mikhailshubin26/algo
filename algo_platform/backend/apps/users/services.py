from datetime import date, timedelta

from apps.users.models import User


def register_activity(user: User, today: date | None = None) -> User:
    """Обновляет серию активных дней пользователя (поле ``streak``).

    Правило (см. главу 2 пояснительной записки): если пользователь был
    активен ровно сутки назад, серия увеличивается на 1; если разрыв больше
    суток, серия сбрасывается до 1; если пользователь уже был активен
    сегодня, поле не изменяется.
    """

    today = today or date.today()
    last_active = user.last_active_date

    if last_active == today:
        return user

    if last_active == today - timedelta(days=1):
        user.streak += 1
    else:
        user.streak = 1

    user.last_active_date = today
    user.save(update_fields=["streak", "last_active_date"])
    return user
