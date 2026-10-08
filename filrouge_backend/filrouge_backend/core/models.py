from django.contrib.auth.models import AbstractUser
from django.db import models


# ─────────────────────────────────────────────
# UTILISATEUR
# ─────────────────────────────────────────────
class User(AbstractUser):
    ROLES = [
        ('student', 'Étudiant'),
        ('teacher', 'Enseignant'),
    ]
    role = models.CharField(max_length=10, choices=ROLES, default='student')
    avatar = models.CharField(max_length=10, blank=True)  # initiales ex: "AS"

    def __str__(self):
        return f"{self.get_full_name()} ({self.role})"

    @property
    def initials(self):
        parts = self.get_full_name().split()
        if len(parts) >= 2:
            return (parts[0][0] + parts[-1][0]).upper()
        return self.username[:2].upper()


# ─────────────────────────────────────────────
# PROJET
# ─────────────────────────────────────────────
class Project(models.Model):
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    deadline = models.DateField(null=True, blank=True)
    created_by = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='created_projects'
    )
    members = models.ManyToManyField(
        User,
        related_name='member_projects',
        blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

    @property
    def progress(self):
        total = self.tasks.count()
        if total == 0:
            return 0
        done = self.tasks.filter(status='done').count()
        return round((done / total) * 100)

    @property
    def is_overdue(self):
        from django.utils import timezone
        if self.deadline:
            return self.deadline < timezone.now().date()
        return False

    class Meta:
        ordering = ['-created_at']


# ─────────────────────────────────────────────
# SPRINT
# ─────────────────────────────────────────────
class Sprint(models.Model):
    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name='sprints'
    )
    name = models.CharField(max_length=100)
    start_date = models.DateField()
    end_date = models.DateField()
    goal = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.project.name} — {self.name}"

    @property
    def is_active(self):
        from django.utils import timezone
        today = timezone.now().date()
        return self.start_date <= today <= self.end_date

    class Meta:
        ordering = ['start_date']


# ─────────────────────────────────────────────
# TÂCHE
# ─────────────────────────────────────────────
class Task(models.Model):
    STATUS_CHOICES = [
        ('todo', 'To Do'),
        ('in_progress', 'In Progress'),
        ('done', 'Done'),
    ]
    PRIORITY_CHOICES = [
        ('low', 'Faible'),
        ('medium', 'Moyenne'),
        ('high', 'Haute'),
    ]

    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name='tasks'
    )
    sprint = models.ForeignKey(
        Sprint,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='tasks'
    )
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    assignee = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_tasks'
    )
    status = models.CharField(
        max_length=15,
        choices=STATUS_CHOICES,
        default='todo'
    )
    priority = models.CharField(
        max_length=10,
        choices=PRIORITY_CHOICES,
        default='medium'
    )
    estimated_time = models.FloatField(null=True, blank=True)  # en heures
    real_time = models.FloatField(null=True, blank=True)
    order = models.IntegerField(default=0)  # pour l'ordre dans la colonne
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"[{self.status}] {self.title}"

    class Meta:
        ordering = ['order', '-created_at']


# ─────────────────────────────────────────────
# MESSAGE (Chat par projet)
# ─────────────────────────────────────────────
class Message(models.Model):
    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name='messages'
    )
    author = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='messages'
    )
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.author.username}: {self.content[:50]}"

    class Meta:
        ordering = ['created_at']


# ─────────────────────────────────────────────
# ÉVALUATION (par l'enseignant)
# ─────────────────────────────────────────────
class Evaluation(models.Model):
    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name='evaluations'
    )
    student = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='received_evaluations'
    )
    teacher = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='given_evaluations'
    )
    grade = models.FloatField(null=True, blank=True)  # sur 20
    comment = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.student.get_full_name()} — {self.grade}/20"

    class Meta:
        unique_together = ['project', 'student', 'teacher']
        ordering = ['-created_at']
