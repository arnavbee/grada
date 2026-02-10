'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';

import { AuthShell } from '@/src/components/auth/auth-shell';
import { Button } from '@/src/components/ui/button';
import { InputField } from '@/src/components/ui/input-field';
import { apiRequest } from '@/src/lib/api-client';
import { setAuthCookies } from '@/src/lib/auth-cookie';

interface LoginResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export default function LoginPage(): JSX.Element {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const tokens = await apiRequest<LoginResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      setAuthCookies(tokens, rememberMe);
      router.push('/dashboard');
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to sign in.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthShell
      subtitle='Sign in to manage inventory, purchase orders, and exports across marketplaces.'
      title='Welcome back'
    >
      <form className='space-y-4' noValidate onSubmit={handleSubmit}>
        <InputField
          label='Work Email'
          onChange={(event) => setEmail(event.target.value)}
          placeholder='you@company.com'
          type='email'
          value={email}
        />
        <InputField
          label='Password'
          onChange={(event) => setPassword(event.target.value)}
          placeholder='Enter password'
          type='password'
          value={password}
        />

        <div className='flex items-center justify-between'>
          <label className='flex items-center gap-2 text-sm text-kira-darkgray'>
            <input
              checked={rememberMe}
              className='kira-focus-ring h-4 w-4 accent-kira-black'
              onChange={(event) => setRememberMe(event.target.checked)}
              type='checkbox'
            />
            Remember me
          </label>
          <Link className='kira-focus-ring text-sm text-kira-darkgray hover:text-kira-black' href='/forgot-password'>
            Forgot password?
          </Link>
        </div>

        {error ? <p className='rounded-md bg-kira-warmgray/20 px-3 py-2 text-sm text-kira-black'>{error}</p> : null}

        <Button className='w-full' disabled={isSubmitting} type='submit'>
          {isSubmitting ? 'Signing in...' : 'Sign In'}
        </Button>

        <p className='text-center text-sm text-kira-midgray'>
          New here?{' '}
          <Link className='kira-focus-ring text-kira-darkgray hover:text-kira-black' href='/signup'>
            Create account
          </Link>
          .
        </p>

        <p className='text-center text-sm text-kira-midgray'>
          Need design references?{' '}
          <Link className='kira-focus-ring text-kira-darkgray hover:text-kira-black' href='/design-system'>
            View design system
          </Link>
          .
        </p>
      </form>
    </AuthShell>
  );
}
