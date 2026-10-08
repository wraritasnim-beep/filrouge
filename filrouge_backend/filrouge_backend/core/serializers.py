from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import User, Project, Sprint, Task, Message, Evaluation


# ─────────────────────────────────────────────
# UTILISATEUR
# ─────────────────────────────────────────────
class UserSerializer(serializers.ModelSerializer):
    initials = serializers.ReadOnlyField()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role', 'initials']
        read_only_fields = ['id']


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)
    password2 = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'first_name', 'last_name', 'role', 'password', 'password2']

    def validate(self, data):
        if data['password'] != data['password2']:
            raise serializers.ValidationError({'password': 'Les mots de passe ne correspondent pas.'})
        return data

    def create(self, validated_data):
        validated_data.pop('password2')
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        user = authenticate(**data)
        if not user:
            raise serializers.ValidationError('Identifiants invalides.')
        data['user'] = user
        return data


# ─────────────────────────────────────────────
# TÂCHE
# ─────────────────────────────────────────────
class TaskSerializer(serializers.ModelSerializer):
    assignee_detail = UserSerializer(source='assignee', read_only=True)
    sprint_name = serializers.CharField(source='sprint.name', read_only=True)

    class Meta:
        model = Task
        fields = [
            'id', 'project', 'sprint', 'sprint_name',
            'title', 'description',
            'assignee', 'assignee_detail',
            'status', 'priority',
            'estimated_time', 'real_time',
            'order', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
        extra_kwargs = {
            'project': {'required': False},
        }


class TaskStatusUpdateSerializer(serializers.ModelSerializer):
    """Sérialiseur léger pour le drag & drop (juste le statut)"""
    class Meta:
        model = Task
        fields = ['status', 'order']


# ─────────────────────────────────────────────
# SPRINT
# ─────────────────────────────────────────────
class SprintSerializer(serializers.ModelSerializer):
    tasks = TaskSerializer(many=True, read_only=True)
    is_active = serializers.ReadOnlyField()

    class Meta:
        model = Sprint
        fields = ['id', 'project', 'name', 'start_date', 'end_date', 'goal', 'tasks', 'is_active', 'created_at']
        read_only_fields = ['id', 'created_at']
        extra_kwargs = {
            'project': {'required': False},
        }


class SprintListSerializer(serializers.ModelSerializer):
    """Version légère sans tâches, pour les listes"""
    tasks_count = serializers.SerializerMethodField()
    is_active = serializers.ReadOnlyField()

    def get_tasks_count(self, obj):
        return obj.tasks.count()

    class Meta:
        model = Sprint
        fields = ['id', 'project', 'name', 'start_date', 'end_date', 'goal', 'tasks_count', 'is_active']


# ─────────────────────────────────────────────
# PROJET
# ─────────────────────────────────────────────
class ProjectSerializer(serializers.ModelSerializer):
    members_detail = UserSerializer(source='members', many=True, read_only=True)
    created_by_detail = UserSerializer(source='created_by', read_only=True)
    progress = serializers.ReadOnlyField()
    is_overdue = serializers.ReadOnlyField()
    tasks_count = serializers.SerializerMethodField()
    tasks_done = serializers.SerializerMethodField()
    tasks_in_progress = serializers.SerializerMethodField()

    def get_tasks_count(self, obj):
        return obj.tasks.count()

    def get_tasks_done(self, obj):
        return obj.tasks.filter(status='done').count()

    def get_tasks_in_progress(self, obj):
        return obj.tasks.filter(status='in_progress').count()

    class Meta:
        model = Project
        fields = [
            'id', 'name', 'description', 'deadline',
            'created_by', 'created_by_detail',
            'members', 'members_detail',
            'progress', 'is_overdue',
            'tasks_count', 'tasks_done', 'tasks_in_progress',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at']


# ─────────────────────────────────────────────
# MESSAGE (Chat)
# ─────────────────────────────────────────────
class MessageSerializer(serializers.ModelSerializer):
    author_detail = UserSerializer(source='author', read_only=True)

    class Meta:
        model = Message
        fields = ['id', 'project', 'author', 'author_detail', 'content', 'created_at']
        read_only_fields = ['id', 'author', 'created_at']
        extra_kwargs = {
            'project': {'required': False},
        }


# ─────────────────────────────────────────────
# ÉVALUATION
# ─────────────────────────────────────────────
class EvaluationSerializer(serializers.ModelSerializer):
    student_detail = UserSerializer(source='student', read_only=True)
    teacher_detail = UserSerializer(source='teacher', read_only=True)

    class Meta:
        model = Evaluation
        fields = [
            'id', 'project',
            'student', 'student_detail',
            'teacher', 'teacher_detail',
            'grade', 'comment',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'teacher', 'created_at', 'updated_at']
        extra_kwargs = {
            'project': {'required': False},
        }
