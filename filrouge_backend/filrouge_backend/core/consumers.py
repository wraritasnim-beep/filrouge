import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models import Message, Project, User


class ChatConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer pour le chat en temps réel par projet.
    URL: ws://localhost:8000/ws/chat/<project_id>/
    """

    async def connect(self):
        self.project_id = self.scope['url_route']['kwargs']['project_id']
        self.room_group_name = f'chat_{self.project_id}'

        # Rejoindre le groupe du projet
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        """Réception d'un message depuis le client."""
        data = json.loads(text_data)
        content = data.get('content', '').strip()
        user_id = data.get('user_id')

        if not content or not user_id:
            return

        # Sauvegarder en base
        message = await self.save_message(user_id, content)
        if not message:
            return

        # Diffuser à tout le groupe
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'id': message['id'],
                'content': message['content'],
                'author_id': message['author_id'],
                'author_name': message['author_name'],
                'author_initials': message['author_initials'],
                'created_at': message['created_at'],
            }
        )

    async def chat_message(self, event):
        """Envoyer le message au client WebSocket."""
        await self.send(text_data=json.dumps(event))

    @database_sync_to_async
    def save_message(self, user_id, content):
        try:
            user = User.objects.get(pk=user_id)
            project = Project.objects.get(pk=self.project_id)
            msg = Message.objects.create(
                project=project,
                author=user,
                content=content
            )
            return {
                'id': msg.id,
                'content': msg.content,
                'author_id': user.id,
                'author_name': user.get_full_name() or user.username,
                'author_initials': user.initials,
                'created_at': msg.created_at.isoformat(),
            }
        except (User.DoesNotExist, Project.DoesNotExist):
            return None
