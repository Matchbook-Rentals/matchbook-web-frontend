import React from 'react';
import Link from 'next/link';
import { Notification } from '@prisma/client';
import { Trash2 } from 'lucide-react';

interface NotificationItemProps {
  notification: Notification;
  onClick: (notificationId: string) => void;
  onDelete: (notificationId: string) => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onClick, onDelete }) => {
  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDelete(notification.id);
  };

  return (
    <div className="flex items-center py-2 group">
      <Link 
        href={notification.url} 
        className="flex-grow flex items-center"
        onClick={() => onClick(notification.id)}
      >
        {notification.unread && <div className="w-2 h-2 bg-red-500 rounded-full mr-2" />}
        <p className="flex-grow">{notification.content}</p>
      </Link>
      <button 
        onClick={handleDelete}
        className="p-1 text-gray-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
};

export default NotificationItem;
