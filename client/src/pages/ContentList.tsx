import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Link, useSearchParams } from 'react-router-dom';
import api from '@/lib/api';

export default function ContentList() {
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState<string>(params.get('search') || '');
  const page = Number(params.get('page') || 1);

  const { data, isLoading } = useQuery({
    queryKey: ['content', { search, page }],
    queryFn: async () => (await api.get('/content', { params: { search, page } })).data,
  });

  const items = data?.data?.content || [];
  const pagination = data?.data?.paginationInfo || { totalItems: 0, totalPages: 1, currentPage: 1 };

  const canPrev = pagination.currentPage > 1;
  const canNext = pagination.currentPage < pagination.totalPages;

  return (
    <Layout>
      <div className="space-y-6">
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>Browse Content</CardTitle>
            <CardDescription>Search and explore published content</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} />
              <Button onClick={() => setParams({ search, page: '1' })}>Search</Button>
            </div>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-4 bg-muted rounded w-2/3 animate-pulse" />
                ))}
              </div>
            ) : items.length === 0 ? (
              <p className="text-sm text-muted-foreground">No content found</p>
            ) : (
              <div className="space-y-2">
                {items.map((it: { _id: string; title: string; author: { _id: string; name: string } }) => (
                  <Link key={it._id} to={`/content/${it._id}`} className="block p-3 rounded-md hover:bg-accent">
                    <div className="font-medium">{it.title}</div>
                    <div className="text-sm text-muted-foreground">by {it.author?.name}</div>
                  </Link>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <Button variant="outline" disabled={!canPrev} onClick={() => setParams({ search, page: String(pagination.currentPage - 1) })}>Previous</Button>
              <div className="text-sm text-muted-foreground">Page {pagination.currentPage} of {pagination.totalPages}</div>
              <Button variant="outline" disabled={!canNext} onClick={() => setParams({ search, page: String(pagination.currentPage + 1) })}>Next</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}


