from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsTeacher(BasePermission):
    """Seuls les enseignants peuvent accéder."""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'teacher'


class IsStudent(BasePermission):
    """Seuls les étudiants peuvent accéder."""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'student'


class IsProjectMemberOrTeacher(BasePermission):
    """
    Accès si :
    - l'utilisateur est enseignant (voit tout)
    - l'utilisateur est membre du projet
    - l'utilisateur a créé le projet
    """
    def has_object_permission(self, request, view, obj):
        user = request.user
        if user.role == 'teacher':
            return True
        # obj peut être Project, Task, Sprint, Message
        project = getattr(obj, 'project', obj)
        return (
            project.created_by == user or
            project.members.filter(id=user.id).exists()
        )


class IsOwnerOrTeacher(BasePermission):
    """Modification réservée au propriétaire ou à un enseignant."""
    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
        user = request.user
        if user.role == 'teacher':
            return True
        return getattr(obj, 'author', getattr(obj, 'assignee', None)) == user
