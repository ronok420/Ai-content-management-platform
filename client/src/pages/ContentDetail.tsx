import React, { useMemo, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';
import { commentSchema, type CommentFormData } from '@/lib/schemas';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, Heart, MessageCircle } from 'lucide-react';

export default function ContentDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [liked, setLiked] = useState<boolean>(false);
  const [following, setFollowing] = useState<boolean>(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState<string>('');

  const { data: detail } = useQuery({
    queryKey: ['content', id],
    queryFn: async () => (await api.get(`/content/${id}`)).data,
    enabled: Boolean(id),
  });

  const { data: related } = useQuery({
    queryKey: ['related', id],
    queryFn: async () => (await api.get(`/content/${id}/related`)).data,
    enabled: Boolean(id),
  });

  const { data: analytics } = useQuery({
    queryKey: ['analytics', id],
    queryFn: async () => (await api.get(`/analytics/content/${id}`)).data,
    enabled: Boolean(id),
  });

  const likeMutation = useMutation({
    mutationFn: async () => (await api.post(`/interactions/like/${id}`)).data,
    onSuccess: () => {
      setLiked((v) => !v);
      toast({ title: 'Updated', description: 'Your like preference has been updated.' });
      queryClient.invalidateQueries({ queryKey: ['content', id] });
      queryClient.invalidateQueries({ queryKey: ['analytics', id] });
    },
    onError: async (error: unknown) => {
      const { getErrorMessage } = await import('@/lib/utils');
      toast({ title: 'Failed', description: getErrorMessage(error), variant: 'destructive' });
    },
  });

  const followMutation = useMutation({
    mutationFn: async (userId: string) => (await api.post(`/interactions/follow/${userId}`)).data,
    onSuccess: () => {
      setFollowing((v) => !v);
      toast({ title: 'Updated', description: 'Follow status updated.' });
    },
    onError: async (error: unknown) => {
      const { getErrorMessage } = await import('@/lib/utils');
      toast({ title: 'Failed', description: getErrorMessage(error), variant: 'destructive' });
    },
  });

  const commentsQuery = useQuery({
    queryKey: ['comments', id],
    queryFn: async () => (await api.get(`/interactions/comments/${id}`)).data,
    enabled: Boolean(id),
  });

  const addComment = useMutation({
    mutationFn: async (data: CommentFormData) => {
      const text = (data.text || '').trim();
      if (!text || !id) {
        throw new Error('Comment text or content id missing');
      }

      const payloadVariants = [
        // With contentId
        { text, contentId: id },
        { comment: text, contentId: id },
        { commentText: text, contentId: id },
        { body: text, contentId: id },
        { content: text, contentId: id },
        { message: text, contentId: id },
        // Without contentId (some APIs reject extra fields when :id is in URL)
        { text },
        { comment: text },
        { commentText: text },
        { body: text },
        { content: text },
        { message: text },
      ];

      // Try primary endpoint with different payload shapes
      for (const payload of payloadVariants) {
        try {
          const res = await api.post(`/interactions/comments/${id}`, payload);
          return res.data;
        } catch (err: any) {
          const code = err?.response?.status;
          if (![400, 404, 422].includes(code)) {
            // Non-retriable error
            throw err;
          }
        }
      }

      // Fallback A: collection endpoint with contentId in body
      for (const payload of payloadVariants) {
        try {
          const res = await api.post(`/interactions/comments`, payload);
          return res.data;
        } catch (err: any) {
          const code = err?.response?.status;
          if (![400, 404, 422].includes(code)) {
            throw err;
          }
        }
      }

      // Fallback B: alternate content-nested endpoint
      for (const payload of payloadVariants) {
        try {
          const alt = await api.post(`/interactions/comments/content/${id}`, payload);
          return alt.data;
        } catch (err: any) {
          const code = err?.response?.status;
          if (![400, 404, 422].includes(code)) {
            throw err;
          }
        }
      }

      // Fallback C: common REST style /content/:id/comments
      for (const payload of payloadVariants) {
        try {
          const alt2 = await api.post(`/content/${id}/comments`, payload);
          return alt2.data;
        } catch (err: any) {
          const code = err?.response?.status;
          if (![400, 404, 422].includes(code)) {
            throw err;
          }
        }
      }

      // If all attempts failed, throw a generic error
      throw new Error('Unable to post comment. Please try again.');
    },
    onSuccess: () => {
      toast({ title: 'Comment added' });
      commentsQuery.refetch();
      commentForm.reset();
    },
    onError: async (error: unknown) => {
      const { getErrorMessage } = await import('@/lib/utils');
      toast({ title: 'Failed', description: getErrorMessage(error), variant: 'destructive' });
    },
  });

  const updateComment = useMutation({
    mutationFn: async ({ commentId, text }: { commentId: string; text: string }) => (await api.put(`/interactions/comments/${commentId}`, { text })).data,
    onSuccess: () => {
      toast({ title: 'Comment updated' });
      setEditingCommentId(null);
      setEditingText('');
      commentsQuery.refetch();
    },
    onError: async (error: unknown) => {
      const { getErrorMessage } = await import('@/lib/utils');
      toast({ title: 'Failed', description: getErrorMessage(error), variant: 'destructive' });
    },
  });

  const deleteComment = useMutation({
    mutationFn: async (commentId: string) => (await api.delete(`/interactions/comments/${commentId}`)).data,
    onSuccess: () => {
      toast({ title: 'Comment deleted' });
      commentsQuery.refetch();
    },
    onError: async (error: unknown) => {
      const { getErrorMessage } = await import('@/lib/utils');
      toast({ title: 'Failed', description: getErrorMessage(error), variant: 'destructive' });
    },
  });

  const commentForm = useForm<CommentFormData>({ resolver: zodResolver(commentSchema) });

  const article = detail?.data as undefined | {
    _id: string;
    title: string;
    body: string;
    author?: { _id: string; name: string };
    featuredImage?: string | null;
    category?: string;
    autoTags?: string[];
    viewsCount?: number;
    likesCount?: number;
    commentsCount?: number;
  };
  const relatedList = related?.data || [];
  const metrics = analytics?.data;

  if (!id) return null;

  return (
    <Layout>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle>{article?.title || 'Loading...'}</CardTitle>
              <CardDescription className="flex items-center gap-4 text-sm">
                {article?.author?.name && <span>by <Link to={`/users/${article.author._id}/content`} className="text-primary underline">{article.author.name}</Link></span>}
                <span className="flex items-center gap-1 text-muted-foreground"><Eye className="w-4 h-4" /> {article?.viewsCount ?? metrics?.viewsCount ?? 0}</span>
                <span className="flex items-center gap-1 text-muted-foreground"><Heart className="w-4 h-4" /> {article?.likesCount ?? metrics?.likesCount ?? 0}</span>
                <span className="flex items-center gap-1 text-muted-foreground"><MessageCircle className="w-4 h-4" /> {article?.commentsCount ?? 0}</span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              {article?.featuredImage && (
                <img src={article.featuredImage} alt={article.title} className="w-full rounded-lg mb-4" />
              )}
              <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: article?.body || '' }} />
              <div className="flex items-center gap-2 mt-4">
                {article?.category && <Badge variant="secondary">{article.category}</Badge>}
                {Array.isArray(article?.autoTags) && article.autoTags.slice(0, 5).map((t: string) => (
                  <Badge key={t} variant="outline" className="text-xs">{t}</Badge>
                ))}
              </div>
              <div className="flex items-center gap-3 mt-6">
                <Button variant="outline" onClick={() => likeMutation.mutate()} disabled={!user}>{liked ? 'Unlike' : 'Like'}</Button>
                {article?.author?._id && article.author._id !== user?._id && (
                  <Button variant="outline" onClick={() => followMutation.mutate(article.author._id)} disabled={!user}>{following ? 'Unfollow' : 'Follow'}</Button>
                )}

                {user?._id && article?.author?._id === user._id && (
                  <>
                    <Button variant="outline" onClick={() => navigate(`/content/${article._id}/edit`)}>Edit</Button>
                    <Button variant="destructive" onClick={async () => {
                      try {
                        await api.delete(`/content/${article._id}`);
                        toast({ title: 'Deleted', description: 'Content deleted successfully.' });
                        navigate('/');
                      } catch (error) {
                        const { getErrorMessage } = await import('@/lib/utils');
                        toast({ title: 'Delete failed', description: getErrorMessage(error), variant: 'destructive' });
                      }
                    }}>Delete</Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle>Comments</CardTitle>
              <CardDescription>Join the discussion</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {Array.isArray(commentsQuery.data?.data) && commentsQuery.data.data.length > 0 ? (
                <div className="space-y-3">
                  {commentsQuery.data.data.map((c: { _id: string; author?: { _id?: string; name?: string }; text: string }) => (
                    <div key={c._id} className="p-3 rounded-md border">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-medium">{c.author?.name || 'Anonymous'}</div>
                        {user?._id && user._id === c.author?._id && (
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => { setEditingCommentId(c._id); setEditingText(c.text); }}>Edit</Button>
                            <Button size="sm" variant="destructive" onClick={() => deleteComment.mutate(c._id)}>Delete</Button>
                          </div>
                        )}
                      </div>
                      {editingCommentId === c._id ? (
                        <div className="mt-2 space-y-2">
                          <Input value={editingText} onChange={(e) => setEditingText(e.target.value)} />
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => updateComment.mutate({ commentId: c._id, text: editingText })}>Save</Button>
                            <Button size="sm" variant="outline" onClick={() => { setEditingCommentId(null); setEditingText(''); }}>Cancel</Button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground">{c.text}</div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No comments yet.</p>
              )}

              <form onSubmit={commentForm.handleSubmit((d) => addComment.mutate({ text: (d.text || '').trim() }))} className="space-y-2">
                <Label htmlFor="text">Add a comment</Label>
                <Input id="text" placeholder="Write a comment" {...commentForm.register('text')} className={commentForm.formState.errors.text ? 'border-destructive' : ''} />
                {commentForm.formState.errors.text && (
                  <p className="text-sm text-destructive">{commentForm.formState.errors.text.message}</p>
                )}
                <Button type="submit" variant="gradient" disabled={!user || addComment.isPending}>Post Comment</Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle>Related</CardTitle>
              <CardDescription>People also read</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {relatedList.length === 0 ? (
                <p className="text-sm text-muted-foreground">No related content</p>
              ) : (
                relatedList.map((r: { _id: string; title: string }) => (
                  <Link key={r._id} to={`/content/${r._id}`} className="block hover:underline">
                    {r.title}
                  </Link>
                ))
              )}
            </CardContent>
          </Card>

          {metrics && (
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle>Analytics</CardTitle>
                <CardDescription>Performance metrics</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-1">
                <div>Views: {metrics.viewsCount}</div>
                <div>Likes: {metrics.likesCount}</div>
                <div>Comments: {metrics.commentsCount}</div>
              </CardContent>
            </Card>
          )}

          {Array.isArray(article?.autoTags) && (
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle>AI Highlights</CardTitle>
                <CardDescription>Auto-generated insights for this article</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {article?.category && (
                  <div>
                    <div className="font-medium">AI Suggested Category</div>
                    <div className="text-muted-foreground">{article.category}</div>
                  </div>
                )}
                <div>
                  <div className="font-medium">AI Suggested Tags</div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {(article.autoTags || []).slice(0, 10).map((t) => (
                      <Badge key={t} variant="outline" className="text-xs">{t}</Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
}


