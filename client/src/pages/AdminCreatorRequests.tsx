import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';

export default function AdminCreatorRequests() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [actionUserId, setActionUserId] = useState<string | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['creator-requests'],
    queryFn: async () => (await api.get('/creator/requests')).data,
    enabled: user?.role === 'admin',
  });

  const approve = useMutation({
    mutationFn: async (userId: string) => (await api.put(`/creator/requests/${userId}/approve`)).data,
    onSuccess: () => { toast({ title: 'Approved' }); refetch(); },
    onError: async (error: unknown) => {
      const { getErrorMessage } = await import('@/lib/utils');
      toast({ title: 'Approve failed', description: getErrorMessage(error), variant: 'destructive' });
    },
    onSettled: () => setActionUserId(null),
  });
  const reject = useMutation({
    mutationFn: async (userId: string) => (await api.put(`/creator/requests/${userId}/reject`)).data,
    onSuccess: () => { toast({ title: 'Rejected' }); refetch(); },
    onError: async (error: unknown) => {
      const { getErrorMessage } = await import('@/lib/utils');
      toast({ title: 'Reject failed', description: getErrorMessage(error), variant: 'destructive' });
    },
    onSettled: () => setActionUserId(null),
  });

  if (user?.role !== 'admin') {
    return (
      <Layout>
        <div className="text-sm text-muted-foreground">You do not have permission to view this page.</div>
      </Layout>
    );
  }

  const items = data?.data || [];

  return (
    <Layout>
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle>Creator Access Requests</CardTitle>
          <CardDescription>Review and manage pending requests</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-4 bg-muted rounded w-2/3 animate-pulse" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground">No pending requests</p>
          ) : (
            <div className="space-y-3">
              {items.map((r: { _id: string; user?: { _id?: unknown; name?: string; email?: string } | string | null; requester?: { _id?: unknown; name?: string; email?: string } | null; applicant?: { _id?: unknown; name?: string; email?: string } | null; userDetails?: { _id?: unknown; name?: string; email?: string } | null; userId?: unknown; requestedBy?: unknown; requesterId?: unknown; applicantId?: unknown; creatorId?: unknown; ownerId?: unknown; name?: string; email?: string; message?: string }) => {
                const userObj = (typeof r.user === 'object' && r.user) || r.requester || r.applicant || r.userDetails || undefined;
                const rawId =
                  (userObj && (((userObj as { _id?: unknown })._id ?? (userObj as { id?: unknown }).id)))
                  ?? (r as any).userId
                  ?? (r as any).user_id
                  ?? (r as any).userID
                  ?? (r as any).requestedBy
                  ?? (r as any).requesterId
                  ?? (r as any).requester_id
                  ?? (r as any).applicantId
                  ?? (r as any).applicant_id
                  ?? (r as any).creatorId
                  ?? (r as any).creator_id
                  ?? (r as any).ownerId
                  ?? (r as any).owner_id
                  ?? (r as any).uid
                  ?? (typeof r.user === 'string' ? r.user : undefined)
                  ?? (r as any).id
                  ?? (r as any)._id;
                const uid = rawId !== undefined && rawId !== null ? String(rawId) : '';
                const displayName: string = (userObj && (userObj as { name?: string }).name) || r.name || (uid ? `User ${uid.slice(-6)}` : 'Unknown user');
                const displayEmail: string = (userObj && (userObj as { email?: string }).email) || r.email || 'unknown@example.com';
                return (
                  <div key={r._id} className="p-3 rounded-md border flex items-center justify-between">
                    <div>
                      <div className="font-medium">{displayName} <span className="text-muted-foreground text-xs">({displayEmail})</span></div>
                      {uid && <div className="text-xs text-muted-foreground">User ID: {uid}</div>}
                      {r.message && <div className="text-sm text-muted-foreground">{r.message}</div>}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => {
                          if (!uid) return toast({ title: 'Missing user id', variant: 'destructive' });
                          setActionUserId(uid);
                          approve.mutate(uid);
                        }}
                        disabled={approve.isPending || reject.isPending}
                      >
                        {approve.isPending && actionUserId === uid ? 'Approving...' : 'Approve'}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          if (!uid) return toast({ title: 'Missing user id', variant: 'destructive' });
                          setActionUserId(uid);
                          reject.mutate(uid);
                        }}
                        disabled={approve.isPending || reject.isPending}
                      >
                        {reject.isPending && actionUserId === uid ? 'Rejecting...' : 'Reject'}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </Layout>
  );
}


