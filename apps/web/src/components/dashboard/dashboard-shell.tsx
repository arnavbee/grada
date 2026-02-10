'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';

import { LogoutButton } from '@/src/components/auth/logout-button';
import { Button } from '@/src/components/ui/button';
import { Card } from '@/src/components/ui/card';
import { cn } from '@/src/lib/cn';
import { apiRequest } from '@/src/lib/api-client';

const navigation = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Catalog', href: '/dashboard/catalog' },
  { label: 'Inventory', href: '/dashboard/inventory' },
  { label: 'Orders', href: '/dashboard/orders' },
  { label: 'Settings', href: '/dashboard/settings' },
] as const;

function DotIcon(): JSX.Element {
  return (
    <svg aria-hidden='true' className='h-4 w-4 text-current' viewBox='0 0 20 20'>
      <circle cx='10' cy='10' fill='none' r='7' stroke='currentColor' strokeWidth='1.5' />
    </svg>
  );
}

interface DashboardShellProps {
  title?: string;
  subtitle?: string;
  hideHeader?: boolean;
  children: ReactNode;
}

interface AuthMeResponse {
  company_name?: string | null;
}

export function DashboardShell({
  title = '',
  subtitle = '',
  hideHeader = false,
  children,
}: DashboardShellProps): JSX.Element {
  const pathname = usePathname();
  const [companyName, setCompanyName] = useState('grada');

  useEffect(() => {
    let mounted = true;

    apiRequest<AuthMeResponse>('/auth/me')
      .then((profile) => {
        const resolvedCompanyName = profile.company_name?.trim();
        if (!mounted || !resolvedCompanyName) {
          return;
        }
        setCompanyName(resolvedCompanyName);
      })
      .catch(() => {
        // Keep graceful fallback when auth profile is unavailable.
      });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className='min-h-screen'>
      <div className='mx-auto grid max-w-[1440px] grid-cols-1 gap-4 p-4 md:grid-cols-12 md:gap-6 md:p-6'>
        <aside className='surface-card animate-enter md:col-span-3 lg:col-span-2'>
          <div className='border-b border-kira-warmgray/35 px-4 py-5'>
            <p className='text-lg font-black leading-tight text-kira-black md:text-xl'>{companyName}</p>
            <p className='mt-1 text-xs uppercase tracking-[0.12em] text-kira-midgray'>Operational Console</p>
          </div>
          <nav className='p-2'>
            <ul className='space-y-1'>
              {navigation.map((item, index) => {
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <li key={item.href}>
                    <Link
                      className={cn(
                        'kira-focus-ring flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors',
                        active
                          ? 'bg-kira-brown/15 text-kira-brown'
                          : 'text-kira-darkgray hover:bg-kira-warmgray/20 hover:text-kira-black',
                      )}
                      href={item.href}
                      style={{ animationDelay: `${120 + index * 45}ms` }}
                    >
                      <DotIcon />
                      <span>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </aside>

        <main className='space-y-6 md:col-span-9 lg:col-span-10'>
          {!hideHeader ? (
            <Card className='animate-enter p-5 md:p-6'>
              <div className='flex flex-wrap items-start justify-between gap-3'>
                <div>
                  <h1>{title}</h1>
                  <p className='mt-1 text-kira-darkgray'>{subtitle}</p>
                </div>
                <div className='flex items-center gap-2'>
                  <Link
                    className='kira-focus-ring rounded-md px-3 py-2 text-sm text-kira-darkgray hover:bg-kira-warmgray/20'
                    href='/'
                  >
                    Home
                  </Link>
                  <Link
                    className='kira-focus-ring rounded-md px-3 py-2 text-sm text-kira-darkgray hover:bg-kira-warmgray/20'
                    href='/design-system'
                  >
                    Design System
                  </Link>
                  <LogoutButton />
                  <Button variant='secondary'>Export</Button>
                  <Button>Generate Report</Button>
                </div>
              </div>
            </Card>
          ) : null}

          {children}
        </main>
      </div>
    </div>
  );
}
