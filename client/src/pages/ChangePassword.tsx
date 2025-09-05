import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { changePasswordSchema, type ChangePasswordFormData } from '@/lib/schemas';
import api from '@/lib/api';
import { Lock } from 'lucide-react';
import { Layout } from '@/components/Layout';

export default function ChangePassword() {
  const { toast } = useToast();

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
  });

  const onSubmit = async (data: ChangePasswordFormData) => {
    try {
      await api.post('/auth/change-password', data);
      toast({ title: 'Password changed', description: 'Your password has been updated successfully.' });
      reset();
    } catch (error: unknown) {
      const { getErrorMessage } = await import('@/lib/utils');
      toast({ title: 'Change failed', description: getErrorMessage(error), variant: 'destructive' });
    }
  };

  return (
    <Layout>
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-medium">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center">
                <Lock className="w-6 h-6 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold">Change Password</CardTitle>
            <CardDescription>Update your account password</CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="oldPassword">Current Password</Label>
                <Input id="oldPassword" type="password" placeholder="Enter current password" {...register('oldPassword')} className={errors.oldPassword ? 'border-destructive' : ''} />
                {errors.oldPassword && (
                  <p className="text-sm text-destructive">{errors.oldPassword.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input id="newPassword" type="password" placeholder="Enter new password" {...register('newPassword')} className={errors.newPassword ? 'border-destructive' : ''} />
                {errors.newPassword && (
                  <p className="text-sm text-destructive">{errors.newPassword.message}</p>
                )}
              </div>
              <Button type="submit" className="w-full" variant="gradient" disabled={isSubmitting}>
                {isSubmitting ? 'Updating...' : 'Update Password'}
              </Button>
            </CardContent>
          </form>
        </Card>
      </div>
    </Layout>
  );
}


