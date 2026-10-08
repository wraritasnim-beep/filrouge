from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path('admin/', admin.site.urls),

    # Auth JWT
    path('api/auth/', include('core.urls.auth_urls')),

    # API principale
    path('api/', include('core.urls.project_urls')),
    path('api/', include('core.urls.task_urls')),
    path('api/', include('core.urls.sprint_urls')),
    path('api/', include('core.urls.chat_urls')),
    path('api/', include('core.urls.evaluation_urls')),

    # Refresh du token JWT
    path('api/auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]
