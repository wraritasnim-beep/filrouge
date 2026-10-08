from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, Project, Sprint, Task, Message, Evaluation


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ['username', 'email', 'first_name', 'last_name', 'role']
    list_filter = ['role']
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Fil Rouge', {'fields': ('role',)}),
    )


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ['name', 'created_by', 'deadline', 'progress']
    list_filter = ['created_at']
    filter_horizontal = ['members']


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ['title', 'project', 'status', 'priority', 'assignee']
    list_filter = ['status', 'priority']
    list_editable = ['status']


@admin.register(Sprint)
class SprintAdmin(admin.ModelAdmin):
    list_display = ['name', 'project', 'start_date', 'end_date', 'is_active']


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ['author', 'project', 'content', 'created_at']


@admin.register(Evaluation)
class EvaluationAdmin(admin.ModelAdmin):
    list_display = ['student', 'project', 'teacher', 'grade']
