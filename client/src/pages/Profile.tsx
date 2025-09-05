import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { useMutation } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Layout } from '@/components/Layout';
import { useAuth } from '@/context/AuthContext';
import { updateProfileSchema, type UpdateProfileFormData } from '@/lib/schemas';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';
import { User, Crown, Mail, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
// useMutation already imported above

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const creatorRequest = useMutation({
    mutationFn: async () => (await api.post('/creator/request-access', { message: 'I would like to become a creator on this platform.' })).data,
    onSuccess: () => toast({ title: 'Request sent', description: 'We will review your request shortly.' }),
    onError: async (error: unknown) => {
      const { getErrorMessage } = await import('@/lib/utils');
      toast({ title: 'Failed', description: getErrorMessage(error), variant: 'destructive' });
    },
  });
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<UpdateProfileFormData>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      name: user?.name || '',
      bio: user?.bio || '',
    }
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: UpdateProfileFormData) => {
      const response = await api.put('/users/me', data);
      return response.data;
    },
    onSuccess: () => {
      toast({
        title: "Profile updated!",
        description: "Your profile has been updated successfully.",
      });
      refreshUser();
    },
    onError: async (error: unknown) => {
      const { getErrorMessage } = await import('@/lib/utils');
      toast({
        title: "Update failed",
        description: getErrorMessage(error, "Something went wrong."),
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: UpdateProfileFormData) => {
    updateProfileMutation.mutate(data);
  };

  if (!user) return null;

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Profile Settings</h1>
          <p className="text-muted-foreground">Manage your account information</p>
        </div>

        <Card className="shadow-soft">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Avatar className="w-20 h-20">
                <AvatarImage src={user.profileImage} />
                <AvatarFallback className="bg-gradient-primary text-white text-2xl">
                  {user.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
            <CardTitle className="flex items-center justify-center space-x-2">
              <span>{user.name}</span>
              {user.role === 'creator' && <Crown className="w-5 h-5 text-primary" />}
            </CardTitle>
            <CardDescription className="flex items-center justify-center space-x-4">
              <div className="flex items-center space-x-1">
                <Mail className="w-4 h-4" />
                <span>{user.email}</span>
              </div>
              <Badge variant={user.role === 'admin' ? 'default' : 'secondary'} className="capitalize">
                {user.role}
              </Badge>
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>Update Profile</CardTitle>
            <CardDescription>Update your profile information</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  {...register('name')}
                  className={errors.name ? 'border-destructive' : ''}
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  placeholder="Tell us about yourself..."
                  rows={4}
                  {...register('bio')}
                  className={errors.bio ? 'border-destructive' : ''}
                />
                {errors.bio && (
                  <p className="text-sm text-destructive">{errors.bio.message}</p>
                )}
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                variant="gradient"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Updating...' : 'Update Profile'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {user.role === 'reader' && (
          <Card className="shadow-soft border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Crown className="w-5 h-5 mr-2 text-primary" />
                Become a Creator
              </CardTitle>
              <CardDescription>
                Request creator access to start publishing content and reach a wider audience.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex gap-2">
              <Button variant="gradient" className="w-full" onClick={() => creatorRequest.mutate()} disabled={creatorRequest.isPending}>
                {creatorRequest.isPending ? 'Quick Requesting...' : 'Quick Request'}
              </Button>
              <Link to="/creator/request" className="w-full">
                <Button variant="outline" className="w-full">Open Request Form</Button>
              </Link>
            </CardContent>
          </Card>
        )}

        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>Security</CardTitle>
            <CardDescription>Manage your password and security settings</CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/change-password">
              <Button variant="outline" className="w-full">Change Password</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}