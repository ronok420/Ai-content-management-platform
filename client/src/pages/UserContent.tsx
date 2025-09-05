import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import api from '@/lib/api';

export default function UserContent() {
  const { userId } = useParams<{ userId: string }>();

  const { data, isLoading } = useQuery({
    queryKey: ['user-content', userId],
    queryFn: async () => (await api.get(`/users/${userId}/content`)).data,
    enabled: Boolean(userId),
  });

  const items = data?.data || [];

  return (
    <Layout>
      <div className="space-y-6">
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>User Content</CardTitle>
            <CardDescription>All published articles by this user</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-4 bg-muted rounded w-2/3 animate-pulse" />
                ))}
              </div>
            ) : items.length === 0 ? (
              <p className="text-sm text-muted-foreground">No content found</p>
            ) : (
              <div className="space-y-3">
                {items.map((it: any) => (
                  <Link to={`/content/${it._id}`} key={it._id} className="block p-3 rounded-md hover:bg-accent">
                    <div className="font-medium">{it.title}</div>
                    <div className="text-sm text-muted-foreground">{it.category}</div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}


