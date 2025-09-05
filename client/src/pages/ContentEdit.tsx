import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import api from '@/lib/api';
import { createContentSchema, type CreateContentFormData } from '@/lib/schemas';
import { useToast } from '@/hooks/use-toast';

export default function ContentEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data, isLoading } = useQuery({
    queryKey: ['content', id],
    queryFn: async () => (await api.get(`/content/${id}`)).data,
    enabled: Boolean(id),
  });

  const form = useForm<CreateContentFormData>({
    resolver: zodResolver(createContentSchema),
  });

  useEffect(() => {
    if (data?.data) {
      form.reset({ title: data.data.title, body: data.data.body, status: data.data.status });
    }
  }, [data, form]);

  const updateMutation = useMutation({
    mutationFn: async (payload: Partial<CreateContentFormData>) => (await api.put(`/content/${id}`, payload)).data,
    onSuccess: () => {
      toast({ title: 'Updated', description: 'Content updated successfully.' });
      navigate(`/content/${id}`);
    },
    onError: async (error: unknown) => {
      const { getErrorMessage } = await import('@/lib/utils');
      toast({ title: 'Update failed', description: getErrorMessage(error), variant: 'destructive' });
    }
  });

  const onSubmit = (values: CreateContentFormData) => {
    updateMutation.mutate({ title: values.title, body: values.body, status: values.status });
  };

  return (
    <Layout>
      <div className="max-w-3xl mx-auto">
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>Edit Content</CardTitle>
            <CardDescription>Update your article</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-4 bg-muted rounded w-2/3 animate-pulse" />
                ))}
              </div>
            ) : (
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input id="title" {...form.register('title')} className={form.formState.errors.title ? 'border-destructive' : ''} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="body">Content</Label>
                  <Textarea id="body" rows={10} {...form.register('body')} className={form.formState.errors.body ? 'border-destructive' : ''} />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" variant="gradient" disabled={updateMutation.isPending}>Save Changes</Button>
                  <Button type="button" variant="outline" onClick={() => navigate(-1)}>Cancel</Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}


