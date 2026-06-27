import { supabase } from '@/lib/supabase';

export interface IssueComment {
  id: string;
  issue_id: string;
  user_id: string;
  user_name: string;
  user_avatar?: string;
  content: string;
  parent_id: string | null;
  is_official: boolean;
  created_at: string;
  updated_at: string;
  replies?: IssueComment[];
}

class CommentService {
  // Get comments for an issue (threaded)
  async getComments(issueId: string): Promise<IssueComment[]> {
    if (!supabase) return [];
    try {
      const { data, error } = await supabase
        .from('issue_comments')
        .select('*')
        .eq('issue_id', issueId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const comments = (data || []).map(item => ({
        id: item.id,
        issue_id: item.issue_id,
        user_id: item.user_id,
        user_name: item.user_name || 'Anonymous',
        user_avatar: item.user_avatar,
        content: item.content,
        parent_id: item.parent_id,
        is_official: item.is_official || false,
        created_at: item.created_at,
        updated_at: item.updated_at,
      }));

      // Build thread tree
      const topLevel = comments.filter(c => !c.parent_id);
      const replies = comments.filter(c => c.parent_id);

      topLevel.forEach(comment => {
        comment.replies = replies.filter(r => r.parent_id === comment.id);
      });

      return topLevel;
    } catch (error) {
      console.error('Failed to fetch comments:', error);
      return [];
    }
  }

  // Add a comment
  async addComment(issueId: string, userId: string, userName: string, content: string, parentId?: string): Promise<IssueComment | null> {
    if (!supabase) return null;
    try {
      const { data, error } = await supabase
        .from('issue_comments')
        .insert({
          issue_id: issueId,
          user_id: userId,
          user_name: userName,
          content,
          parent_id: parentId || null,
          is_official: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to add comment:', error);
      return null;
    }
  }

  // Delete a comment (only own comments)
  async deleteComment(commentId: string, userId: string): Promise<boolean> {
    if (!supabase) return false;
    try {
      const { error } = await supabase
        .from('issue_comments')
        .delete()
        .eq('id', commentId)
        .eq('user_id', userId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Failed to delete comment:', error);
      return false;
    }
  }

  // Edit a comment
  async editComment(commentId: string, userId: string, newContent: string): Promise<boolean> {
    if (!supabase) return false;
    try {
      const { error } = await supabase
        .from('issue_comments')
        .update({ content: newContent, updated_at: new Date().toISOString() })
        .eq('id', commentId)
        .eq('user_id', userId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Failed to edit comment:', error);
      return false;
    }
  }

  // Get comment count for an issue
  async getCommentCount(issueId: string): Promise<number> {
    if (!supabase) return 0;
    try {
      const { count, error } = await supabase
        .from('issue_comments')
        .select('*', { count: 'exact', head: true })
        .eq('issue_id', issueId);

      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('Failed to count comments:', error);
      return 0;
    }
  }

  // Subscribe to comments on an issue
  subscribeToComments(issueId: string, callback: () => void) {
    if (!supabase) return null;

    return supabase
      .channel(`comments-${issueId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'issue_comments',
        filter: `issue_id=eq.${issueId}`,
      }, () => { callback(); })
      .subscribe();
  }
}

export const commentService = new CommentService();
export default commentService;
