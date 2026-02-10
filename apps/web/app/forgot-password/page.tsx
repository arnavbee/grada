'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';

import { AuthShell } from '@/src/components/auth/auth-shell';
import { Button } from '@/src/components/ui/button';
import { InputField } from '@/src/components/ui/input-field';
import { apiRequest } from '@/src/lib/api-client';

interface ForgotPasswordResponse {
  message: string;
  reset_token?: string;
}

export default function ForgotPasswordPage(): JSX.Element {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<ForgotPasswordResponse | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    try {
      const response = await apiRequest<ForgotPasswordResponse>('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      setSuccess(response);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to request reset link.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthShell
      subtitle='Enter your account email and we will send a secure reset link.'
      title='Reset your password'
    >
      <form className='space-y-4' noValidate onSubmit={handleSubmit}>
        <InputField
          hint='We will send a link that expires in 30 minutes.'
          label='Work Email'
          onChange={(event) => setEmail(event.target.value)}
          type='email'
          value={email}
        />

        {error ? <p className='rounded-md bg-kira-warmgray/20 px-3 py-2 text-sm text-kira-black'>{error}</p> : null}
        {success ? (
          <div className='rounded-md border border-kira-warmgray/50 bg-kira-offwhite p-3'>
            <p className='text-sm text-kira-darkgray'>{success.message}</p>
            {success.reset_token ? (
              <p className='mt-1 text-xs text-kira-midgray'>
                Dev token: <code className='text-kira-black'>{success.reset_token}</code>
              </p>
            ) : null}
          </div>
        ) : null}

        <Button className='w-full' disabled={isSubmitting} type='submit'>
          {isSubmitting ? 'Sending...' : 'Send Reset Link'}
        </Button>

        <p className='text-center text-sm text-kira-midgray'>
          Remembered your password?{' '}
          <Link className='kira-focus-ring text-kira-darkgray hover:text-kira-black' href='/login'>
            Return to login
          </Link>
          .
        </p>
      </form>
    </AuthShell>
  );
}
