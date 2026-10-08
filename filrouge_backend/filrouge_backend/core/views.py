from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.shortcuts import get_object_or_404
from django.db.models import Q
 
from .models import User, Project, Sprint, Task, Message, Evaluation
from .serializers import (
    UserSerializer, RegisterSerializer, LoginSerializer,
    ProjectSerializer, SprintSerializer, SprintListSerializer,
    TaskSerializer, TaskStatusUpdateSerializer,
    MessageSerializer, EvaluationSerializer
)
from .permissions import IsTeacher, IsProjectMemberOrTeacher
 
 
# ═════════════════════════════════════════════
# AUTH VIEWS
# ═════════════════════════════════════════════
 
class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]
 
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            refresh = RefreshToken.for_user(user)
            return Response({
                'user': UserSerializer(user).data,
                'access': str(refresh.access_token),
                'refresh': str(refresh),
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
 
 
class LoginView(APIView):
    permission_classes = [permissions.AllowAny]
 
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            refresh = RefreshToken.for_user(user)
            return Response({
                'user': UserSerializer(user).data,
                'access': str(refresh.access_token),
                'refresh': str(refresh),
            })
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
 
 
class MeView(APIView):
    """Retourne le profil de l'utilisateur connecté."""
    def get(self, request):
        return Response(UserSerializer(request.user).data)
 
 
class UserListView(generics.ListAPIView):
    """Liste de tous les utilisateurs (pour ajouter des membres)."""
    queryset = User.objects.all()
    serializer_class = UserSerializer
 
 
# ═════════════════════════════════════════════
# PROJECT VIEWS
# ═════════════════════════════════════════════
 
class ProjectListCreateView(generics.ListCreateAPIView):
    serializer_class = ProjectSerializer
 
    def get_queryset(self):
        user = self.request.user
        if user.role == 'teacher':
            return Project.objects.all()
        return Project.objects.filter(
            Q(members=user) | Q(created_by=user)
        ).distinct()
 
    def perform_create(self, serializer):
        project = serializer.save(created_by=self.request.user)
        project.members.add(self.request.user)
 
 
class ProjectDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ProjectSerializer
 
    def get_queryset(self):
        user = self.request.user
        if user.role == 'teacher':
            return Project.objects.all()
        return Project.objects.filter(
            Q(members=user) | Q(created_by=user)
        ).distinct()
 
 
class ProjectAddMemberView(APIView):
    """Ajouter un membre à un projet."""
    def post(self, request, pk):
        project = get_object_or_404(Project, pk=pk)
        user_id = request.data.get('user_id')
        user = get_object_or_404(User, pk=user_id)
        project.members.add(user)
        return Response({'message': f'{user.get_full_name()} ajouté au projet.'})
 
    def delete(self, request, pk):
        project = get_object_or_404(Project, pk=pk)
        user_id = request.data.get('user_id')
        user = get_object_or_404(User, pk=user_id)
        project.members.remove(user)
        return Response({'message': f'{user.get_full_name()} retiré du projet.'})
 
 
class ProjectDashboardView(APIView):
    """Dashboard complet d'un projet (pour enseignant)."""
    def get(self, request, pk):
        project = get_object_or_404(Project, pk=pk)
        tasks = project.tasks.all()
 
        members_data = []
        for member in project.members.all():
            member_tasks = tasks.filter(assignee=member)
            members_data.append({
                'user': UserSerializer(member).data,
                'tasks_total': member_tasks.count(),
                'tasks_done': member_tasks.filter(status='done').count(),
                'tasks_in_progress': member_tasks.filter(status='in_progress').count(),
            })
 
        return Response({
            'project': ProjectSerializer(project).data,
            'tasks_by_status': {
                'todo': tasks.filter(status='todo').count(),
                'in_progress': tasks.filter(status='in_progress').count(),
                'done': tasks.filter(status='done').count(),
            },
            'members': members_data,
        })
 
 
# ═════════════════════════════════════════════
# TASK VIEWS
# ═════════════════════════════════════════════
 
class TaskListCreateView(generics.ListCreateAPIView):
    serializer_class = TaskSerializer
 
    def get_queryset(self):
        project_id = self.kwargs['project_pk']
        qs = Task.objects.filter(project_id=project_id)
 
        status_filter = self.request.query_params.get('status')
        sprint_filter = self.request.query_params.get('sprint')
        assignee_filter = self.request.query_params.get('assignee')
 
        if status_filter:
            qs = qs.filter(status=status_filter)
        if sprint_filter == 'backlog':
            qs = qs.filter(sprint__isnull=True)
        elif sprint_filter:
            qs = qs.filter(sprint_id=sprint_filter)
        if assignee_filter:
            qs = qs.filter(assignee_id=assignee_filter)
 
        return qs
 
    def perform_create(self, serializer):
     project_id = self.kwargs['project_pk']
     project = get_object_or_404(Project, pk=project_id)
     serializer.save(project=project)
 
 
class TaskDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Task.objects.all()
    serializer_class = TaskSerializer
 
 
class TaskStatusUpdateView(APIView):
    """Mise à jour rapide du statut (drag & drop)."""
    def patch(self, request, pk):
        task = get_object_or_404(Task, pk=pk)
        serializer = TaskStatusUpdateSerializer(task, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(TaskSerializer(task).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
 
 
class MyTasksView(APIView):
    """Tâches de l'utilisateur connecté (dashboard étudiant)."""
    def get(self, request):
        tasks = Task.objects.filter(assignee=request.user)
        return Response({
            'todo': TaskSerializer(tasks.filter(status='todo'), many=True).data,
            'in_progress': TaskSerializer(tasks.filter(status='in_progress'), many=True).data,
            'done': TaskSerializer(tasks.filter(status='done'), many=True).data,
        })
 
 
# ═════════════════════════════════════════════
# SPRINT VIEWS
# ═════════════════════════════════════════════
 
class SprintListCreateView(generics.ListCreateAPIView):
    def get_serializer_class(self):
        if self.request.method == 'GET':
            return SprintListSerializer
        return SprintSerializer
 
    def get_queryset(self):
        return Sprint.objects.filter(project_id=self.kwargs['project_pk'])
 
    def perform_create(self, serializer):
        project = get_object_or_404(Project, pk=self.kwargs['project_pk'])
        serializer.save(project=project)
 
 
class SprintDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Sprint.objects.all()
    serializer_class = SprintSerializer
 
 
class BacklogView(APIView):
    """Tâches sans sprint (backlog du projet)."""
    def get(self, request, project_pk):
        tasks = Task.objects.filter(project_id=project_pk, sprint__isnull=True)
        return Response(TaskSerializer(tasks, many=True).data)
 
 
# ═════════════════════════════════════════════
# CHAT VIEWS
# ═════════════════════════════════════════════
 
class MessageListCreateView(generics.ListCreateAPIView):
    serializer_class = MessageSerializer
 
    def get_queryset(self):
        return Message.objects.filter(project_id=self.kwargs['project_pk'])
 
    def perform_create(self, serializer):
        project = get_object_or_404(Project, pk=self.kwargs['project_pk'])
        serializer.save(author=self.request.user, project=project)
 
 
# ═════════════════════════════════════════════
# EVALUATION VIEWS
# ═════════════════════════════════════════════
 
class EvaluationListCreateView(generics.ListCreateAPIView):
    serializer_class = EvaluationSerializer
    permission_classes = [permissions.IsAuthenticated, IsTeacher]
 
    def get_queryset(self):
        return Evaluation.objects.filter(project_id=self.kwargs['project_pk'])
 
    def perform_create(self, serializer):
        project = get_object_or_404(Project, pk=self.kwargs['project_pk'])
        serializer.save(teacher=self.request.user, project=project)
 
 
class EvaluationDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Evaluation.objects.all()
    serializer_class = EvaluationSerializer
    permission_classes = [permissions.IsAuthenticated, IsTeacher]
 
 
# ═════════════════════════════════════════════
# DASHBOARD GLOBAL (enseignant)
# ═════════════════════════════════════════════
 
class TeacherDashboardView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsTeacher]
 
    def get(self, request):
        projects = Project.objects.all()
        data = []
        for p in projects:
            tasks = p.tasks.all()
            data.append({
                'id': p.id,
                'name': p.name,
                'progress': p.progress,
                'deadline': p.deadline,
                'is_overdue': p.is_overdue,
                'members_count': p.members.count(),
                'tasks': {
                    'total': tasks.count(),
                    'done': tasks.filter(status='done').count(),
                    'in_progress': tasks.filter(status='in_progress').count(),
                    'todo': tasks.filter(status='todo').count(),
                }
            })
        return Response(data)