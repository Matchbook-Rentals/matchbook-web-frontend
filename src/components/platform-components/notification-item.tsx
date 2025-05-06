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
    <div className="flex justify-between items-center hover:bg-gray-50 group">
      <Link
        href={notification.url}
        className="flex-grow flex items-center w-3/4 max-w-3/4 overflow-x-hidden px-4 py-3"
        onClick={() => onClick(notification.id)}
      >
        {notification.unread && <div className="w-2 h-2 text-wrap bg-red-500 rounded-full mr-2 flex-shrink-0" />}
        <p className="flex-grow text-sm font-medium text-gray-800">{notification.content}</p>
      </Link>
      <button
        onClick={handleDelete}
        className="p-2 text-gray-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity mr-2"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
};

export default NotificationItem;
