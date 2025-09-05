import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { forgotPasswordSchema, verifyCodeSchema, resetPasswordSchema, type ForgotPasswordFormData, type VerifyCodeFormData, type ResetPasswordFormData } from '@/lib/schemas';
import api from '@/lib/api';
import { ShieldCheck } from 'lucide-react';

type Step = 'email' | 'verify' | 'reset';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState<string>('');

  const emailForm = useForm<ForgotPasswordFormData>({ resolver: zodResolver(forgotPasswordSchema) });
  const verifyForm = useForm<VerifyCodeFormData>({ resolver: zodResolver(verifyCodeSchema), defaultValues: { email } });
  const resetForm = useForm<ResetPasswordFormData>({ resolver: zodResolver(resetPasswordSchema), defaultValues: { email } });

  const handleSendCode = async (data: ForgotPasswordFormData) => {
    try {
      await api.post('/auth/forget-password', { email: data.email });
      setEmail(data.email);
      verifyForm.setValue('email', data.email);
      resetForm.setValue('email', data.email);
      toast({ title: 'Code sent', description: 'We sent a verification code to your email.' });
      setStep('verify');
    } catch (error: unknown) {
      const { getErrorMessage } = await import('@/lib/utils');
      toast({ title: 'Failed to send code', description: getErrorMessage(error), variant: 'destructive' });
    }
  };

  const handleVerify = async (data: VerifyCodeFormData) => {
    try {
      await api.post('/auth/verify-code', { email: email || data.email, otp: data.otp });
      toast({ title: 'Code verified', description: 'You can now reset your password.' });
      setStep('reset');
    } catch (error: unknown) {
      const { getErrorMessage } = await import('@/lib/utils');
      toast({ title: 'Verification failed', description: getErrorMessage(error), variant: 'destructive' });
    }
  };

  const handleReset = async (data: ResetPasswordFormData) => {
    try {
      await api.post('/auth/reset-password', { email: email || data.email, newPassword: data.newPassword });
      toast({ title: 'Password reset', description: 'Your password has been updated.' });
      navigate('/login');
    } catch (error: unknown) {
      const { getErrorMessage } = await import('@/lib/utils');
      toast({ title: 'Reset failed', description: getErrorMessage(error), variant: 'destructive' });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-secondary p-4">
      <Card className="w-full max-w-md shadow-medium">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">{step === 'email' ? 'Forgot Password' : step === 'verify' ? 'Verify Code' : 'Reset Password'}</CardTitle>
          <CardDescription>Follow the steps to recover your account</CardDescription>
        </CardHeader>

        {step === 'email' && (
          <form onSubmit={emailForm.handleSubmit(handleSendCode)}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="Enter your email" {...emailForm.register('email')} className={emailForm.formState.errors.email ? 'border-destructive' : ''} />
                {emailForm.formState.errors.email && (
                  <p className="text-sm text-destructive">{emailForm.formState.errors.email.message}</p>
                )}
              </div>
              <Button type="submit" className="w-full" variant="gradient" disabled={emailForm.formState.isSubmitting}>
                {emailForm.formState.isSubmitting ? 'Sending...' : 'Send Verification Code'}
              </Button>
            </CardContent>
          </form>
        )}

        {step === 'verify' && (
          <form onSubmit={verifyForm.handleSubmit(handleVerify)}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="otp">Verification Code</Label>
                <Input id="otp" inputMode="numeric" maxLength={6} placeholder="Enter 6-digit code" {...verifyForm.register('otp')} className={verifyForm.formState.errors.otp ? 'border-destructive' : ''} />
                {verifyForm.formState.errors.otp && (
                  <p className="text-sm text-destructive">{verifyForm.formState.errors.otp.message}</p>
                )}
              </div>
              <Button type="submit" className="w-full" variant="gradient" disabled={verifyForm.formState.isSubmitting}>
                {verifyForm.formState.isSubmitting ? 'Verifying...' : 'Verify Code'}
              </Button>
            </CardContent>
          </form>
        )}

        {step === 'reset' && (
          <form onSubmit={resetForm.handleSubmit(handleReset)}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input id="newPassword" type="password" placeholder="Enter new password" {...resetForm.register('newPassword')} className={resetForm.formState.errors.newPassword ? 'border-destructive' : ''} />
                {resetForm.formState.errors.newPassword && (
                  <p className="text-sm text-destructive">{resetForm.formState.errors.newPassword.message}</p>
                )}
              </div>
              <Button type="submit" className="w-full" variant="gradient" disabled={resetForm.formState.isSubmitting}>
                {resetForm.formState.isSubmitting ? 'Resetting...' : 'Reset Password'}
              </Button>
            </CardContent>
          </form>
        )}
      </Card>
    </div>
  );
}


