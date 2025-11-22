import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { notificationAPI } from '../services/api';

export default function RealTimeNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  useEffect(() => {
    // Get user ID from localStorage or context
    const userId = localStorage.getItem('user_id') || '1'; // Fallback for demo
    
    connectWebSocket(userId);
    fetchInitialNotifications();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  const connectWebSocket = (userId) => {
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws/notifications/${userId}/`;
      
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
      };

      wsRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        handleWebSocketMessage(data);
      };

      wsRef.current.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
        // Attempt to reconnect after 3 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          connectWebSocket(userId);
        }, 3000);
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnected(false);
      };
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
      setIsConnected(false);
    }
  };

  const handleWebSocketMessage = (data) => {
    switch (data.type) {
      case 'notification':
        setNotifications(prev => [data.notification, ...prev]);
        setUnreadCount(prev => prev + 1);
        showBrowserNotification(data.notification);
        // Also show toast notification
        showToastNotification(data.notification);
        break;
      case 'unread_count':
        setUnreadCount(data.count);
        break;
      case 'match_update':
        console.log('Match update:', data.match);
        toast.success('New match update received!', {
          icon: '🔔',
        });
        break;
      case 'request_update':
        console.log('Request update:', data.request);
        toast.info('Blood request updated', {
          icon: '📝',
        });
        break;
      default:
        console.log('Unknown message type:', data.type);
    }
  };

  const showBrowserNotification = (notification) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        tag: notification.id
      });
    }
  };

  const showToastNotification = (notification) => {
    const notificationIcons = {
      'MATCH_FOUND': '🔗',
      'REQUEST_ACCEPTED': '✅',
      'REQUEST_REJECTED': '❌',
      'DONATION_REMINDER': '⏰',
      'SYSTEM_UPDATE': '📢',
      'URGENT_REQUEST': '🚨',
      'DONATION_COMPLETED': '🎉'
    };

    toast.success(notification.message, {
      icon: notificationIcons[notification.type] || '🔔',
      duration: 5000,
    });
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  };

  const fetchInitialNotifications = async () => {
    try {
      const response = await notificationAPI.getNotifications({ limit: 20 });
      setNotifications(response.data.results || response.data);
      
      // Count unread notifications
      const unreadCount = (response.data.results || response.data).filter(n => !n.is_read).length;
      setUnreadCount(unreadCount);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await notificationAPI.markAsRead(notificationId);
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  const getNotificationIcon = (type) => {
    const icons = {
      'MATCH_FOUND': '🔗',
      'REQUEST_ACCEPTED': '✅',
      'REQUEST_REJECTED': '❌',
      'DONATION_REMINDER': '⏰',
      'SYSTEM_UPDATE': '📢',
      'URGENT_REQUEST': '🚨',
      'DONATION_COMPLETED': '🎉'
    };
    return icons[type] || '📢';
  };

  const getNotificationColor = (type) => {
    const colors = {
      'MATCH_FOUND': 'bg-green-50 border-green-200',
      'REQUEST_ACCEPTED': 'bg-blue-50 border-blue-200',
      'REQUEST_REJECTED': 'bg-red-50 border-red-200',
      'DONATION_REMINDER': 'bg-yellow-50 border-yellow-200',
      'SYSTEM_UPDATE': 'bg-gray-50 border-gray-200',
      'URGENT_REQUEST': 'bg-red-50 border-red-200',
      'DONATION_COMPLETED': 'bg-green-50 border-green-200'
    };
    return colors[type] || 'bg-gray-50 border-gray-200';
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          requestNotificationPermission();
        }}
        className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 rounded-full"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        
        {/* Unread Count Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
        
        {/* Connection Status */}
        <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full ${
          isConnected ? 'bg-green-500' : 'bg-red-500'
        }`} title={isConnected ? 'Connected' : 'Disconnected'} />
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-500">
                <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <p>No notifications yet</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`px-4 py-3 border-l-4 cursor-pointer hover:bg-gray-50 ${
                    notification.is_read ? 'bg-white' : 'bg-blue-50'
                  } ${getNotificationColor(notification.type)}`}
                  onClick={() => !notification.is_read && markAsRead(notification.id)}
                >
                  <div className="flex items-start space-x-3">
                    <div className="text-lg">{getNotificationIcon(notification.type)}</div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${
                        notification.is_read ? 'text-gray-900' : 'text-gray-900'
                      }`}>
                        {notification.title}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {formatTime(notification.created_at)}
                      </p>
                    </div>
                    {!notification.is_read && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-gray-200 text-center">
            <button className="text-sm text-blue-600 hover:text-blue-800">
              View all notifications
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
