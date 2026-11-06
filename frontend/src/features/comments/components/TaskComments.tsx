import React, { useState, useEffect, useCallback } from 'react';
import { MessageSquare, Send, Reply, Edit2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { commentService } from '../services/comment.service';
import { Comment } from '../../../types/comment.types';
import { useAuthStore } from '../../../stores/auth-store';
import { Avatar } from '../../../components/ui/Avatar';
import { Button } from '../../../components/ui/Button';
import { Textarea } from '../../../components/ui/Textarea';

export interface TaskCommentsProps {
  taskId: string;
}

export const TaskComments: React.FC<TaskCommentsProps> = ({ taskId }) => {
  const { user } = useAuthStore();
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newContent, setNewContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Replying state
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');

  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  const loadComments = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await commentService.getTaskComments(taskId);
      setComments(res.items || []);
    } catch {
      // Handled silently
    } finally {
      setIsLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  const handleCreateComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) return;

    try {
      setIsSubmitting(true);
      const created = await commentService.createComment(taskId, newContent.trim());
      setComments((prev) => [created, ...prev]);
      setNewContent('');
      toast.success('Comment posted');
    } catch {
      toast.error('Failed to post comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateReply = async (parentId: string) => {
    if (!replyContent.trim()) return;

    try {
      const created = await commentService.createComment(taskId, replyContent.trim(), parentId);
      // Append reply to matching parent comment
      setComments((prev) =>
        prev.map((c) =>
          c.id === parentId
            ? { ...c, replies: [...(c.replies || []), created] }
            : c
        )
      );
      setReplyContent('');
      setReplyingToId(null);
      toast.success('Reply posted');
    } catch {
      toast.error('Failed to post reply');
    }
  };

  const handleUpdateComment = async (commentId: string) => {
    if (!editContent.trim()) return;

    try {
      const updated = await commentService.updateComment(commentId, editContent.trim());
      setComments((prev) =>
        prev.map((c) => {
          if (c.id === commentId) return updated;
          if (c.replies) {
            return {
              ...c,
              replies: c.replies.map((r) => (r.id === commentId ? updated : r)),
            };
          }
          return c;
        })
      );
      setEditingId(null);
      toast.success('Comment updated');
    } catch {
      toast.error('Failed to update comment');
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    try {
      await commentService.deleteComment(commentId);
      setComments((prev) =>
        prev
          .filter((c) => c.id !== commentId)
          .map((c) => ({
            ...c,
            replies: c.replies ? c.replies.filter((r) => r.id !== commentId) : [],
          }))
      );
      toast.success('Comment deleted');
    } catch {
      toast.error('Failed to delete comment');
    }
  };

  return (
    <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200">
        <MessageSquare className="w-4 h-4 text-primary-500" />
        <span>Discussion ({comments.length})</span>
      </div>

      {/* Add Root Comment */}
      <form onSubmit={handleCreateComment} className="flex gap-2.5 items-start">
        <Avatar src={user?.avatarUrl} name={user?.name} size="sm" className="mt-1" />
        <div className="flex-1 space-y-2">
          <Textarea
            rows={2}
            placeholder="Write a comment or update..."
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
          />
          <div className="flex justify-end">
            <Button
              type="submit"
              size="sm"
              isLoading={isSubmitting}
              disabled={!newContent.trim()}
              rightIcon={<Send className="w-3.5 h-3.5" />}
            >
              Post Comment
            </Button>
          </div>
        </div>
      </form>

      {/* Comment List */}
      {isLoading ? (
        <div className="py-4 text-center text-xs text-slate-400">Loading comments...</div>
      ) : comments.length === 0 ? (
        <div className="py-6 text-center text-xs text-slate-400 italic">
          No comments yet. Start the conversation!
        </div>
      ) : (
        <div className="space-y-3 pt-2">
          {comments.map((comment) => {
            const isAuthor = comment.authorId === user?.id;
            const isEditing = editingId === comment.id;

            return (
              <div key={comment.id} className="space-y-2">
                {/* Single Comment Card */}
                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
                  <Avatar src={comment.author?.avatarUrl} name={comment.author?.name} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                        {comment.author?.name || 'User'}
                      </span>
                      <span className="text-[10px] text-slate-400 shrink-0">
                        {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                        {comment.isEdited && ' (edited)'}
                      </span>
                    </div>

                    {isEditing ? (
                      <div className="space-y-2 mt-1">
                        <Textarea
                          rows={2}
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                        />
                        <div className="flex gap-2 justify-end">
                          <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                            Cancel
                          </Button>
                          <Button size="sm" onClick={() => handleUpdateComment(comment.id)}>
                            Save
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                        {comment.content}
                      </p>
                    )}

                    {/* Actions: Reply, Edit, Delete */}
                    <div className="mt-2 flex items-center gap-3 text-[11px] text-slate-400">
                      <button
                        type="button"
                        onClick={() => {
                          setReplyingToId(replyingToId === comment.id ? null : comment.id);
                          setReplyContent('');
                        }}
                        className="flex items-center gap-1 hover:text-primary-600 transition-colors"
                      >
                        <Reply className="w-3 h-3" />
                        Reply
                      </button>

                      {isAuthor && !isEditing && (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingId(comment.id);
                              setEditContent(comment.content);
                            }}
                            className="flex items-center gap-1 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                          >
                            <Edit2 className="w-3 h-3" />
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteComment(comment.id)}
                            className="flex items-center gap-1 hover:text-rose-600 transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Inline Reply Input */}
                {replyingToId === comment.id && (
                  <div className="ml-8 flex items-start gap-2 pt-1">
                    <Avatar src={user?.avatarUrl} name={user?.name} size="xs" className="mt-1" />
                    <div className="flex-1 space-y-1.5">
                      <Textarea
                        rows={2}
                        placeholder={`Reply to ${comment.author?.name || 'comment'}...`}
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        autoFocus
                      />
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setReplyingToId(null)}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          disabled={!replyContent.trim()}
                          onClick={() => handleCreateReply(comment.id)}
                        >
                          Reply
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Nested Threaded Replies */}
                {comment.replies && comment.replies.length > 0 && (
                  <div className="ml-8 space-y-2 border-l-2 border-slate-200/80 dark:border-slate-800 pl-3">
                    {comment.replies.map((reply) => {
                      const isReplyAuthor = reply.authorId === user?.id;

                      return (
                        <div
                          key={reply.id}
                          className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-50/50 dark:bg-slate-800/30 border border-slate-200/40 dark:border-slate-800/50 text-xs"
                        >
                          <Avatar src={reply.author?.avatarUrl} name={reply.author?.name} size="xs" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-semibold text-slate-800 dark:text-slate-200">
                                {reply.author?.name}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                {formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true })}
                              </span>
                            </div>
                            <p className="mt-0.5 text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                              {reply.content}
                            </p>
                            {isReplyAuthor && (
                              <div className="mt-1 flex items-center justify-end">
                                <button
                                  type="button"
                                  onClick={() => handleDeleteComment(reply.id)}
                                  className="text-[10px] text-slate-400 hover:text-rose-500"
                                >
                                  Delete
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TaskComments;
