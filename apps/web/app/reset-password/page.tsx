'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';

import { AuthShell } from '@/src/components/auth/auth-shell';
import { Button } from '@/src/components/ui/button';
import { InputField } from '@/src/components/ui/input-field';
import { apiRequest } from '@/src/lib/api-client';

interface MessageResponse {
  message: string;
}

export default function ResetPasswordPage(): JSX.Element {
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenFromQuery = params.get('token');
    if (tokenFromQuery) {
      setToken(tokenFromQuery);
    }
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await apiRequest<MessageResponse>('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, new_password: newPassword }),
      });
      setSuccess(response.message);
      setNewPassword('');
      setConfirmPassword('');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to reset password.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthShell subtitle='Choose a strong password to complete account recovery.' title='Set a new password'>
      <form className='space-y-4' noValidate onSubmit={handleSubmit}>
        <InputField
          hint='Use the token from forgot-password response in development.'
          label='Reset Token'
          onChange={(event) => setToken(event.target.value)}
          value={token}
        />
        <InputField
          hint='Use 8+ chars, one uppercase, one number.'
          label='New Password'
          onChange={(event) => setNewPassword(event.target.value)}
          type='password'
          value={newPassword}
        />
        <InputField
          label='Confirm New Password'
          onChange={(event) => setConfirmPassword(event.target.value)}
          type='password'
          value={confirmPassword}
        />

        {error ? <p className='rounded-md bg-kira-warmgray/20 px-3 py-2 text-sm text-kira-black'>{error}</p> : null}
        {success ? <p className='rounded-md bg-kira-brown/10 px-3 py-2 text-sm text-kira-black'>{success}</p> : null}

        <Button className='w-full' disabled={isSubmitting} type='submit'>
          {isSubmitting ? 'Updating...' : 'Update Password'}
        </Button>

        <p className='text-center text-sm text-kira-midgray'>
          Back to{' '}
          <Link className='kira-focus-ring text-kira-darkgray hover:text-kira-black' href='/login'>
            login
          </Link>
          .
        </p>
      </form>
    </AuthShell>
  );
}
