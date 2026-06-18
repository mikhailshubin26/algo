from django.urls import path

from apps.users.views import MeView, RegisterView, UserSearchView

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("me/", MeView.as_view(), name="me"),
    path("search/", UserSearchView.as_view(), name="user-search"),
]
