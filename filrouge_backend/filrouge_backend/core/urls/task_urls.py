from django.urls import path
from core.views import (
    TaskListCreateView, TaskDetailView,
    TaskStatusUpdateView, MyTasksView
)

urlpatterns = [
    path('projects/<int:project_pk>/tasks/', TaskListCreateView.as_view(), name='task-list'),
    path('tasks/<int:pk>/', TaskDetailView.as_view(), name='task-detail'),
    path('tasks/<int:pk>/status/', TaskStatusUpdateView.as_view(), name='task-status'),
    path('my-tasks/', MyTasksView.as_view(), name='my-tasks'),
]
