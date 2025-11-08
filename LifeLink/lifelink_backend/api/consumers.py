"""
Real-time notification system with WebSocket support for LifeLink
"""

import json
import asyncio
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from django.core.serializers.json import DjangoJSONEncoder
from core.models import Notification
import logging

logger = logging.getLogger(__name__)

User = get_user_model()

class NotificationConsumer(AsyncWebsocketConsumer):
    """WebSocket consumer for real-time notifications"""
    
    async def connect(self):
        """Connect to WebSocket"""
        self.user_id = self.scope['url_route']['kwargs']['user_id']
        self.room_group_name = f'notifications_{self.user_id}'
        
        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        
        await self.accept()
        
        # Send unread notifications count
        unread_count = await self.get_unread_count()
        await self.send(text_data=json.dumps({
            'type': 'unread_count',
            'count': unread_count
        }))
    
    async def disconnect(self, close_code):
        """Disconnect from WebSocket"""
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
    
    async def receive(self, text_data):
        """Receive message from WebSocket"""
        try:
            text_data_json = json.loads(text_data)
            message_type = text_data_json.get('type')
            
            if message_type == 'mark_read':
                notification_id = text_data_json.get('notification_id')
                await self.mark_notification_read(notification_id)
                
            elif message_type == 'mark_all_read':
                await self.mark_all_notifications_read()
                
        except json.JSONDecodeError:
            logger.error("Invalid JSON received")
    
    async def notification_message(self, event):
        """Send notification to WebSocket"""
        await self.send(text_data=json.dumps({
            'type': 'notification',
            'notification': event['notification']
        }))
        
        # Update unread count
        unread_count = await self.get_unread_count()
        await self.send(text_data=json.dumps({
            'type': 'unread_count',
            'count': unread_count
        }))
    
    async def match_update(self, event):
        """Send match update to WebSocket"""
        await self.send(text_data=json.dumps({
            'type': 'match_update',
            'match': event['match']
        }))
    
    async def request_update(self, event):
        """Send request update to WebSocket"""
        await self.send(text_data=json.dumps({
            'type': 'request_update',
            'request': event['request']
        }))
    
    @database_sync_to_async
    def get_unread_count(self):
        """Get unread notifications count"""
        try:
            user = User.objects.get(id=self.user_id)
            return Notification.objects.filter(user=user, is_read=False).count()
        except User.DoesNotExist:
            return 0
    
    @database_sync_to_async
    def mark_notification_read(self, notification_id):
        """Mark specific notification as read"""
        try:
            notification = Notification.objects.get(id=notification_id)
            notification.is_read = True
            notification.save()
        except Notification.DoesNotExist:
            pass
    
    @database_sync_to_async
    def mark_all_notifications_read(self):
        """Mark all notifications as read"""
        try:
            user = User.objects.get(id=self.user_id)
            Notification.objects.filter(user=user, is_read=False).update(is_read=True)
        except User.DoesNotExist:
            pass

class NotificationService:
    """Service class for managing notifications"""
    
    @staticmethod
    async def send_notification_to_user(user_id, notification_data):
        """Send notification to specific user via WebSocket"""
        from channels.layers import get_channel_layer
        channel_layer = get_channel_layer()
        
        room_group_name = f'notifications_{user_id}'
        
        await channel_layer.group_send(
            room_group_name,
            {
                'type': 'notification_message',
                'notification': notification_data
            }
        )
    
    @staticmethod
    async def send_match_update(user_id, match_data):
        """Send match update to user"""
        from channels.layers import get_channel_layer
        channel_layer = get_channel_layer()
        
        room_group_name = f'notifications_{user_id}'
        
        await channel_layer.group_send(
            room_group_name,
            {
                'type': 'match_update',
                'match': match_data
            }
        )
    
    @staticmethod
    async def send_request_update(user_id, request_data):
        """Send request update to user"""
        from channels.layers import get_channel_layer
        channel_layer = get_channel_layer()
        
        room_group_name = f'notifications_{user_id}'
        
        await channel_layer.group_send(
            room_group_name,
            {
                'type': 'request_update',
                'request': request_data
            }
        )
    
    @staticmethod
    def create_notification(user, notification_type, title, message, 
                          related_request=None, related_match=None):
        """Create notification and send via WebSocket"""
        notification = Notification.objects.create(
            user=user,
            notification_type=notification_type,
            title=title,
            message=message,
            related_request=related_request,
            related_match=related_match
        )
        
        # Send via WebSocket
        notification_data = {
            'id': notification.id,
            'type': notification.notification_type,
            'title': notification.title,
            'message': notification.message,
            'created_at': notification.created_at.isoformat(),
            'is_read': notification.is_read
        }
        
        # Use asyncio to send notification
        try:
            loop = asyncio.get_event_loop()
            loop.create_task(
                NotificationService.send_notification_to_user(user.id, notification_data)
            )
        except RuntimeError:
            # If no event loop is running, create a new one
            asyncio.run(
                NotificationService.send_notification_to_user(user.id, notification_data)
            )
        
        return notification

# Notification templates
NOTIFICATION_TEMPLATES = {
    'MATCH_FOUND': {
        'title': 'New Blood Request Match',
        'message_template': 'You have been matched with a blood request for {patient_name}. Match Score: {score:.1%}'
    },
    'REQUEST_ACCEPTED': {
        'title': 'Request Accepted',
        'message_template': 'Your blood request has been accepted by {donor_name}'
    },
    'REQUEST_REJECTED': {
        'title': 'Request Rejected',
        'message_template': 'Your blood request was rejected by {donor_name}'
    },
    'DONATION_REMINDER': {
        'title': 'Donation Reminder',
        'message_template': 'You are eligible to donate again. Consider helping someone in need!'
    },
    'SYSTEM_UPDATE': {
        'title': 'System Update',
        'message_template': '{message}'
    },
    'URGENT_REQUEST': {
        'title': 'Urgent Blood Request',
        'message_template': 'URGENT: Critical blood request in your area for {blood_group}'
    },
    'DONATION_COMPLETED': {
        'title': 'Donation Completed',
        'message_template': 'Thank you! Your donation has been completed successfully.'
    }
}
