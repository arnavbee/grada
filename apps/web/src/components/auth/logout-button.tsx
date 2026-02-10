'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/src/components/ui/button';
import { apiRequest } from '@/src/lib/api-client';
import { clearAuthCookies } from '@/src/lib/auth-cookie';

interface MessageResponse {
  message: string;
}

export function LogoutButton(): JSX.Element {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function handleLogout(): Promise<void> {
    setIsLoading(true);
    try {
      await apiRequest<MessageResponse>('/auth/logout', {
        method: 'POST',
      });
    } catch {
      // Even if API is unavailable, clear local session cookies.
    } finally {
      clearAuthCookies();
      router.push('/');
      router.refresh();
      setIsLoading(false);
    }
  }

  return (
    <Button onClick={handleLogout} variant='text'>
      {isLoading ? 'Logging out...' : 'Logout'}
    </Button>
  );
}
