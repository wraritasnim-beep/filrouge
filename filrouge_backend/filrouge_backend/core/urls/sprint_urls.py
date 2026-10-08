from django.urls import path
from core.views import SprintListCreateView, SprintDetailView, BacklogView

urlpatterns = [
    path('projects/<int:project_pk>/sprints/', SprintListCreateView.as_view(), name='sprint-list'),
    path('sprints/<int:pk>/', SprintDetailView.as_view(), name='sprint-detail'),
    path('projects/<int:project_pk>/backlog/', BacklogView.as_view(), name='backlog'),
]
