from django.urls import path
from core.views import EvaluationListCreateView, EvaluationDetailView

urlpatterns = [
    path('projects/<int:project_pk>/evaluations/', EvaluationListCreateView.as_view(), name='evaluation-list'),
    path('evaluations/<int:pk>/', EvaluationDetailView.as_view(), name='evaluation-detail'),
]
