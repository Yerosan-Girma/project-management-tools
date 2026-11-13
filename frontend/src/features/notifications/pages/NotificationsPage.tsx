import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Bell,
  CheckCheck,
  Trash2,
  CheckCircle2,
  Clock,
  MessageSquare,
  Building2,
  FolderGit2,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { notificationService } from '../services/notification.service';
import { Notification, NotificationType } from '../../../types/notification.types';
import { Button } from '../../../components/ui/Button';
import { EmptyState } from '../../../components/ui/EmptyState';

export const NotificationsPage: React.FC = () => {
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: notificationsData, isLoading } = useQuery({
    queryKey: ['notifications', filter],
    queryFn: () =>
      notificationService.getNotifications({
        unreadOnly: filter === 'unread',
      }),
    staleTime: 1000 * 30,
  });

  const notifications: Notification[] = notificationsData?.items || [];

  const markAllReadMutation = useMutation({
    mutationFn: () => notificationService.markAllAsRead(),
    onSuccess: () => {
      queryClient.setQueryData(['notifications', 'all'], (old: any) =>
        old ? { ...old, items: old.items?.map((n: Notification) => ({ ...n, isRead: true })) } : old
      );
      queryClient.setQueryData(['notifications', 'unread'], (old: any) =>
        old ? { ...old, items: [] } : old
      );
      toast.success('All notifications marked as read');
    },
    onError: () => toast.error('Failed to mark all as read'),
  });

  const markAsReadMutation = useMutation({
    mutationFn: (notification: Notification) => notificationService.markAsRead(notification.id),
    onMutate: async (notification) => {
      await queryClient.cancelQueries({ queryKey: ['notifications'] });
      queryClient.setQueriesData({ queryKey: ['notifications'] }, (old: any) =>
        old
          ? {
              ...old,
              items: old.items?.map((n: Notification) =>
                n.id === notification.id ? { ...n, isRead: true } : n
              ),
            }
          : old
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => notificationService.deleteNotification(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['notifications'] });
      queryClient.setQueriesData({ queryKey: ['notifications'] }, (old: any) =>
        old ? { ...old, items: old.items?.filter((n: Notification) => n.id !== id) } : old
      );
    },
    onSuccess: () => toast.success('Notification removed'),
    onError: () => toast.error('Failed to delete notification'),
  });

  const handleMarkAllRead = () => {
    markAllReadMutation.mutate();
  };

  const handleMarkAsRead = (notification: Notification) => {
    if (!notification.isRead) {
      markAsReadMutation.mutate(notification);
    }

    // Direct navigation if resourceId is provided
    const resType = notification.resourceType?.toUpperCase();
    if (resType === 'INVITATION' && notification.resourceId) {
      navigate(`/invitations/${notification.resourceId}`);
    } else if (resType === 'PROJECT' && notification.resourceId) {
      navigate(`/projects/${notification.resourceId}`);
    } else if (resType === 'WORKSPACE' && notification.resourceId) {
      navigate(`/workspaces/${notification.resourceId}`);
    }
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    deleteMutation.mutate(id);
  };

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'TASK_ASSIGNED':
        return <CheckCircle2 className="w-5 h-5 text-primary-500" />;
      case 'TASK_DEADLINE_APPROACHING':
      case 'TASK_OVERDUE':
        return <Clock className="w-5 h-5 text-amber-500" />;
      case 'COMMENT_MENTION':
        return <MessageSquare className="w-5 h-5 text-sky-500" />;
      case 'WORKSPACE_INVITATION':
        return <Building2 className="w-5 h-5 text-indigo-500" />;
      case 'PROJECT_MEMBER_ADDED':
      case 'PROJECT_ADDED':
        return <FolderGit2 className="w-5 h-5 text-emerald-500" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-slate-500" />;
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            Notifications
            {unreadCount > 0 && (
              <span className="rounded-full bg-primary-100 dark:bg-primary-950/60 text-primary-700 dark:text-primary-300 text-xs font-semibold px-2.5 py-0.5">
                {unreadCount} unread
              </span>
            )}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time updates regarding task assignments, comments, and milestones.
          </p>
        </div>

        {notifications.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllRead}
            leftIcon={<CheckCheck className="w-4 h-4" />}
          >
            Mark all read
          </Button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
            filter === 'all'
              ? 'bg-primary-50 text-primary-600 dark:bg-primary-950/60 dark:text-primary-400'
              : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
          }`}
        >
          All Activity
        </button>

        <button
          type="button"
          onClick={() => setFilter('unread')}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
            filter === 'unread'
              ? 'bg-primary-50 text-primary-600 dark:bg-primary-950/60 dark:text-primary-400'
              : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
          }`}
        >
          Unread Only
        </button>
      </div>

      {/* Notifications List */}
      {isLoading ? (
        <div className="py-16 flex flex-col items-center justify-center text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600 mb-2" />
          <span className="text-xs">Loading activity notifications...</span>
        </div>
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={<Bell className="w-6 h-6" />}
          title={filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
          description="When tasks are assigned to you or teammates post comments, alerts appear here."
        />
      ) : (
        <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
          {notifications.map((item) => (
            <div
              key={item.id}
              onClick={() => handleMarkAsRead(item)}
              className={`p-4 flex items-start gap-4 transition-colors cursor-pointer hover:bg-slate-50/80 dark:hover:bg-slate-800/40 ${
                !item.isRead ? 'bg-primary-50/20 dark:bg-primary-950/10' : ''
              }`}
            >
              <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0 mt-0.5">
                {getNotificationIcon(item.type)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {item.title}
                  </h4>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[11px] text-slate-400">
                      {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                    </span>
                    {!item.isRead && (
                      <span className="h-2 w-2 rounded-full bg-primary-600" title="Unread" />
                    )}
                  </div>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {item.message}
                </p>
              </div>

              <button
                type="button"
                onClick={(e) => handleDelete(e, item.id)}
                className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors shrink-0"
                title="Dismiss"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
