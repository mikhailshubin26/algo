from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsAdmin(BasePermission):
    """Доступ только для пользователей с ролью ``admin``."""

    def has_permission(self, request, view) -> bool:
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role == request.user.Role.ADMIN
        )


class IsPremium(BasePermission):
    """Доступ только для премиум-пользователей и администраторов
    (используется, например, для ИИ-ассистента)."""

    def has_permission(self, request, view) -> bool:
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.is_premium
        )


class IsAuthorOrReadOnly(BasePermission):
    """Изменять и удалять объект может только его автор или администратор."""

    def has_object_permission(self, request, view, obj) -> bool:
        if request.method in SAFE_METHODS:
            return True
        if request.user.role == request.user.Role.ADMIN:
            return True
        return getattr(obj, "author_id", None) == request.user.id
