import React, { useState, useEffect, useCallback } from 'react';
import { commentService, IssueComment } from '@/services/CommentService';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { MessageSquare, Reply, Trash2, Edit2, Send, User, Clock, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from '@/hooks/use-toast';

interface IssueCommentsProps {
  issueId: string;
}

export const IssueComments: React.FC<IssueCommentsProps> = ({ issueId }) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<IssueComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchComments = useCallback(async () => {
    setLoading(true);
    const data = await commentService.getComments(issueId);
    setComments(data);
    setLoading(false);
  }, [issueId]);

  useEffect(() => {
    fetchComments();
    const sub = commentService.subscribeToComments(issueId, fetchComments);
    return () => { sub?.unsubscribe(); };
  }, [issueId, fetchComments]);

  const handleSubmitComment = async () => {
    if (!newComment.trim() || !user) return;
    setSubmitting(true);
    const result = await commentService.addComment(issueId, user.id, user.name || 'User', newComment.trim());
    if (result) {
      setNewComment('');
      fetchComments();
      toast({ title: 'Comment posted' });
    } else {
      toast({ title: 'Error', description: 'Failed to post comment', variant: 'destructive' });
    }
    setSubmitting(false);
  };

  const handleSubmitReply = async (parentId: string) => {
    if (!replyContent.trim() || !user) return;
    setSubmitting(true);
    const result = await commentService.addComment(issueId, user.id, user.name || 'User', replyContent.trim(), parentId);
    if (result) {
      setReplyTo(null);
      setReplyContent('');
      fetchComments();
    } else {
      toast({ title: 'Error', description: 'Failed to post reply', variant: 'destructive' });
    }
    setSubmitting(false);
  };

  const handleDelete = async (commentId: string) => {
    if (!user) return;
    const success = await commentService.deleteComment(commentId, user.id);
    if (success) {
      fetchComments();
      toast({ title: 'Comment deleted' });
    }
  };

  const handleEdit = async (commentId: string) => {
    if (!editContent.trim() || !user) return;
    const success = await commentService.editComment(commentId, user.id, editContent.trim());
    if (success) {
      setEditingId(null);
      setEditContent('');
      fetchComments();
      toast({ title: 'Comment updated' });
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const diff = Date.now() - d.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return d.toLocaleDateString();
  };

  const CommentItem: React.FC<{ comment: IssueComment; isReply?: boolean }> = ({ comment, isReply = false }) => (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${isReply ? 'ml-8 border-l-2 border-gray-200 dark:border-gray-700 pl-4' : ''}`}
    >
      <div className="flex items-start gap-3 py-3">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${comment.is_official ? 'bg-royal/10 text-royal' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>
          {comment.is_official ? <Shield className="w-4 h-4" /> : <User className="w-4 h-4" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm text-gray-900 dark:text-white">{comment.user_name}</span>
            {comment.is_official && <span className="text-xs bg-royal/10 text-royal px-1.5 py-0.5 rounded font-medium">Official</span>}
            <span className="text-xs text-gray-400 flex items-center gap-1"><Clock className="w-3 h-3" />{formatDate(comment.created_at)}</span>
            {comment.created_at !== comment.updated_at && <span className="text-xs text-gray-400">(edited)</span>}
          </div>

          {editingId === comment.id ? (
            <div className="mt-2 space-y-2">
              <Textarea value={editContent} onChange={e => setEditContent(e.target.value)} className="text-sm min-h-[60px]" />
              <div className="flex gap-2">
                <Button size="sm" onClick={() => handleEdit(comment.id)} disabled={submitting}>Save</Button>
                <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 whitespace-pre-wrap">{comment.content}</p>
          )}

          <div className="flex items-center gap-2 mt-2">
            {!isReply && user && (
              <Button variant="ghost" size="sm" className="text-xs h-7 px-2" onClick={() => { setReplyTo(replyTo === comment.id ? null : comment.id); setReplyContent(''); }}>
                <Reply className="w-3 h-3 mr-1" /> Reply
              </Button>
            )}
            {user?.id === comment.user_id && (
              <>
                <Button variant="ghost" size="sm" className="text-xs h-7 px-2" onClick={() => { setEditingId(comment.id); setEditContent(comment.content); }}>
                  <Edit2 className="w-3 h-3 mr-1" /> Edit
                </Button>
                <Button variant="ghost" size="sm" className="text-xs h-7 px-2 text-red-500 hover:text-red-700" onClick={() => handleDelete(comment.id)}>
                  <Trash2 className="w-3 h-3 mr-1" /> Delete
                </Button>
              </>
            )}
          </div>

          {/* Reply input */}
          <AnimatePresence>
            {replyTo === comment.id && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="mt-3 space-y-2 overflow-hidden">
                <Textarea placeholder="Write a reply..." value={replyContent} onChange={e => setReplyContent(e.target.value)} className="text-sm min-h-[60px]" />
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => handleSubmitReply(comment.id)} disabled={submitting || !replyContent.trim()}>
                    <Send className="w-3 h-3 mr-1" /> Reply
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setReplyTo(null)}>Cancel</Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Replies */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-2 space-y-1">
              {comment.replies.map(reply => (
                <CommentItem key={reply.id} comment={reply} isReply />
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <MessageSquare className="w-5 h-5 text-gray-500" />
        <h3 className="font-semibold text-gray-900 dark:text-white">
          Comments {comments.length > 0 && <span className="text-sm font-normal text-gray-500">({comments.reduce((acc, c) => acc + 1 + (c.replies?.length || 0), 0)})</span>}
        </h3>
      </div>

      {/* New comment input */}
      {user ? (
        <div className="space-y-2">
          <Textarea
            placeholder="Add a comment..."
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
            className="min-h-[80px]"
          />
          <div className="flex justify-end">
            <Button onClick={handleSubmitComment} disabled={submitting || !newComment.trim()} size="sm">
              <Send className="w-4 h-4 mr-1" /> {submitting ? 'Posting...' : 'Post Comment'}
            </Button>
          </div>
        </div>
      ) : (
        <p className="text-sm text-gray-500 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">Sign in to leave a comment.</p>
      )}

      <Separator />

      {/* Comments list */}
      {loading ? (
        <div className="text-center py-6 text-gray-400">Loading comments...</div>
      ) : comments.length === 0 ? (
        <div className="text-center py-8">
          <MessageSquare className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">No comments yet. Be the first to share your thoughts.</p>
        </div>
      ) : (
        <div className="space-y-1">
          {comments.map(comment => (
            <CommentItem key={comment.id} comment={comment} />
          ))}
        </div>
      )}
    </div>
  );
};
