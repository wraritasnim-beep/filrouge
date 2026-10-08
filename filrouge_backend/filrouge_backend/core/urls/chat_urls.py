from django.urls import path
from core.views import MessageListCreateView

urlpatterns = [
    path('projects/<int:project_pk>/messages/', MessageListCreateView.as_view(), name='message-list'),
]
