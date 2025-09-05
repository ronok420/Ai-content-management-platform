import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { creatorRequestSchema, type CreatorRequestFormData } from '@/lib/schemas';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export default function CreatorRequest() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<CreatorRequestFormData>({
    resolver: zodResolver(creatorRequestSchema),
    defaultValues: {
      message: 'I would like to become a creator on this platform. I have experience writing about technology.'
    }
  });

  const onSubmit = async (data: CreatorRequestFormData) => {
    try {
      await api.post('/creator/request-access', data);
      toast({ title: 'Request sent', description: 'Your request has been submitted for review.' });
      reset();
    } catch (error: unknown) {
      const { getErrorMessage } = await import('@/lib/utils');
      toast({ title: 'Request failed', description: getErrorMessage(error), variant: 'destructive' });
    }
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>Become a Creator</CardTitle>
            <CardDescription>Request access to publish content on the platform</CardDescription>
          </CardHeader>
          <CardContent>
            {user?.role !== 'reader' ? (
              <p className="text-sm text-muted-foreground">You already have creator or admin privileges.</p>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="message">Why do you want creator access?</Label>
                  <Textarea id="message" rows={6} {...register('message')} className={errors.message ? 'border-destructive' : ''} />
                  {errors.message && (
                    <p className="text-sm text-destructive">{errors.message.message}</p>
                  )}
                </div>
                <Button type="submit" variant="gradient" disabled={isSubmitting}>Submit Request</Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}


