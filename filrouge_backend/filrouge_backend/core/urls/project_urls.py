from django.urls import path
from core.views import (
    ProjectListCreateView, ProjectDetailView,
    ProjectAddMemberView, ProjectDashboardView,
    TeacherDashboardView
)

urlpatterns = [
    path('projects/', ProjectListCreateView.as_view(), name='project-list'),
    path('projects/<int:pk>/', ProjectDetailView.as_view(), name='project-detail'),
    path('projects/<int:pk>/members/', ProjectAddMemberView.as_view(), name='project-members'),
    path('projects/<int:pk>/dashboard/', ProjectDashboardView.as_view(), name='project-dashboard'),
    path('teacher/dashboard/', TeacherDashboardView.as_view(), name='teacher-dashboard'),
]
