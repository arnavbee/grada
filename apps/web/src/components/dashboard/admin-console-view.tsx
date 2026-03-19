'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { DashboardShell } from '@/src/components/dashboard/dashboard-shell';
import { Button } from '@/src/components/ui/button';
import { Card } from '@/src/components/ui/card';
import { apiRequest } from '@/src/lib/api-client';

type VerificationStatus = 'unreviewed' | 'verified_real' | 'internal' | 'flagged_test';

interface AdminOverviewStats {
  total_users: number;
  active_users: number;
  total_companies: number;
  recent_logins_24h: number;
  new_users_7d: number;
  likely_test_users: number;
  likely_real_users: number;
  verified_real_users: number;
  internal_users: number;
  flagged_test_users: number;
}

interface AdminTrendPoint {
  date: string;
  login_count: number;
  signup_count: number;
}

interface AdminUserRecord {
  id: string;
  email: string;
  full_name: string;
  role: string;
  company_id: string;
  company_name: string | null;
  is_active: boolean;
  is_super_admin: boolean;
  is_likely_test_user: boolean;
  likely_test_signals: string[];
  signup_source: string;
  verification_status: VerificationStatus;
  verification_notes: string | null;
  verified_by_user_id: string | null;
  verified_by_email: string | null;
  verified_at: string | null;
  created_at: string;
  last_seen_at: string | null;
  last_login: string | null;
  login_count: number;
}

interface AdminCompanyRecord {
  id: string;
  name: string;
  user_count: number;
  active_user_count: number;
  likely_real_user_count: number;
  last_login_at: string | null;
  created_at: string;
}

interface AdminActivityRecord {
  id: string;
  action: string;
  created_at: string;
  user_id: string | null;
  email: string | null;
  full_name: string | null;
  company_id: string | null;
  company_name: string | null;
  metadata: Record<string, string>;
}

interface AdminInsightsResponse {
  overview: AdminOverviewStats;
  trends: AdminTrendPoint[];
  users: AdminUserRecord[];
  companies: AdminCompanyRecord[];
  recent_activity: AdminActivityRecord[];
}

interface AdminUserReviewPayload {
  verification_status: VerificationStatus;
  verification_notes: string | null;
}

interface ReviewDraft {
  verificationStatus: VerificationStatus;
  verificationNotes: string;
  isSaving: boolean;
}

const VERIFICATION_OPTIONS: Array<{ label: string; value: VerificationStatus }> = [
  { label: 'Unreviewed', value: 'unreviewed' },
  { label: 'Verified Real', value: 'verified_real' },
  { label: 'Internal', value: 'internal' },
  { label: 'Flagged Test', value: 'flagged_test' },
];

function formatTimestamp(value: string | null): string {
  if (!value) {
    return 'Never';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function formatTrendDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('en-IN', {
    month: 'short',
    day: 'numeric',
  }).format(date);
}

function classifyUser(user: AdminUserRecord): string {
  if (user.is_super_admin) {
    return 'Super admin';
  }
  if (user.verification_status === 'verified_real') {
    return 'Verified real';
  }
  if (user.verification_status === 'internal') {
    return 'Internal';
  }
  if (user.verification_status === 'flagged_test') {
    return 'Flagged test';
  }
  return user.is_likely_test_user ? 'Likely test' : 'Likely real';
}

function buildDraftMap(users: AdminUserRecord[]): Record<string, ReviewDraft> {
  return Object.fromEntries(
    users.map((user) => [
      user.id,
      {
        verificationStatus: user.verification_status,
        verificationNotes: user.verification_notes ?? '',
        isSaving: false,
      },
    ]),
  );
}

export function AdminConsoleView(): JSX.Element {
  const [insights, setInsights] = useState<AdminInsightsResponse | null>(null);
  const [reviewDrafts, setReviewDrafts] = useState<Record<string, ReviewDraft>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadInsights = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await apiRequest<AdminInsightsResponse>('/admin/insights?user_limit=150&activity_limit=80');
      setInsights(response);
      setReviewDrafts((previous) => {
        const next = buildDraftMap(response.users);
        for (const [userId, draft] of Object.entries(previous)) {
          if (next[userId]) {
            next[userId] = {
              verificationStatus: draft.verificationStatus,
              verificationNotes: draft.verificationNotes,
              isSaving: draft.isSaving,
            };
          }
        }
        return next;
      });
      setError(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load super admin insights.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadInsights();
  }, [loadInsights]);

  const summaryCards = useMemo(() => {
    if (!insights) {
      return [];
    }

    return [
      { label: 'Accounts', value: String(insights.overview.total_users), detail: `${insights.overview.active_users} active` },
      { label: 'Companies', value: String(insights.overview.total_companies), detail: `${insights.overview.new_users_7d} new users in 7d` },
      { label: 'Recent Logins', value: String(insights.overview.recent_logins_24h), detail: 'Last 24 hours' },
      { label: 'Verified Real', value: String(insights.overview.verified_real_users), detail: `${insights.overview.likely_real_users} likely real total` },
      { label: 'Internal', value: String(insights.overview.internal_users), detail: 'Team and owner accounts' },
      { label: 'Flagged Test', value: String(insights.overview.flagged_test_users), detail: `${insights.overview.likely_test_users} likely test total` },
    ];
  }, [insights]);

  const maxTrendCount = useMemo(() => {
    if (!insights?.trends.length) {
      return 1;
    }
    return Math.max(
      1,
      ...insights.trends.flatMap((point) => [point.login_count, point.signup_count]),
    );
  }, [insights]);

  async function handleSaveReview(userId: string): Promise<void> {
    const draft = reviewDrafts[userId];
    if (!draft) {
      return;
    }

    setReviewDrafts((previous) => ({
      ...previous,
      [userId]: { ...previous[userId], isSaving: true },
    }));

    try {
      const payload: AdminUserReviewPayload = {
        verification_status: draft.verificationStatus,
        verification_notes: draft.verificationNotes.trim() || null,
      };
      await apiRequest<AdminUserRecord>(`/admin/users/${userId}/review`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
      await loadInsights();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save review.');
      setReviewDrafts((previous) => ({
        ...previous,
        [userId]: { ...previous[userId], isSaving: false },
      }));
    }
  }

  return (
    <DashboardShell
      subtitle='Global visibility for accounts, companies, auth activity, and manual user verification.'
      title='Super Admin'
    >
      {error ? (
        <Card className='border border-red-200 bg-red-50 p-4 text-sm text-red-700'>
          {error}
        </Card>
      ) : null}

      <section className='grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3'>
        {summaryCards.map((card, index) => (
          <Card className='animate-enter p-4' key={card.label} style={{ animationDelay: `${140 + index * 50}ms` }}>
            <p className='text-sm font-medium text-kira-darkgray'>{card.label}</p>
            <p className='mt-1 text-2xl font-semibold text-kira-black'>{card.value}</p>
            <small className='mt-2 block text-kira-midgray'>{card.detail}</small>
          </Card>
        ))}
        {isLoading && summaryCards.length === 0 ? (
          <Card className='p-4 text-sm text-kira-midgray'>Loading super admin metrics...</Card>
        ) : null}
      </section>

      <section className='grid grid-cols-1 gap-4 xl:grid-cols-3'>
        <Card className='p-5 xl:col-span-2'>
          <div className='flex items-start justify-between gap-3'>
            <div>
              <h2>Login Trends</h2>
              <p className='mt-2 text-kira-darkgray'>Daily website activity across all tenants. Dark bars are logins, light bars are signups.</p>
            </div>
            <p className='text-sm text-kira-midgray'>Last 14 days</p>
          </div>
          <div className='mt-6 grid grid-cols-7 gap-3 md:grid-cols-14'>
            {insights?.trends.map((point) => (
              <div className='flex min-h-[180px] flex-col justify-end gap-2' key={point.date}>
                <div className='flex h-[140px] items-end justify-center gap-1 rounded-lg bg-kira-warmgray/10 px-2 py-3'>
                  <div
                    className='w-3 rounded-t bg-kira-black'
                    style={{ height: `${Math.max(8, (point.login_count / maxTrendCount) * 100)}%` }}
                    title={`${point.login_count} logins`}
                  />
                  <div
                    className='w-3 rounded-t bg-kira-brown/55'
                    style={{ height: `${Math.max(8, (point.signup_count / maxTrendCount) * 100)}%` }}
                    title={`${point.signup_count} signups`}
                  />
                </div>
                <div className='text-center'>
                  <p className='text-xs font-medium text-kira-black'>{formatTrendDate(point.date)}</p>
                  <p className='text-[11px] text-kira-midgray'>{point.login_count}L / {point.signup_count}S</p>
                </div>
              </div>
            ))}
            {!isLoading && !insights?.trends.length ? (
              <p className='text-sm text-kira-midgray'>No trend data available yet.</p>
            ) : null}
          </div>
        </Card>

        <Card className='p-5'>
          <h2>Companies</h2>
          <p className='mt-2 text-kira-darkgray'>See which tenants are active and how many manually reviewed real users they have.</p>
          <div className='mt-4 space-y-3'>
            {insights?.companies.map((company) => (
              <div className='rounded-lg border border-kira-warmgray/35 p-3' key={company.id}>
                <div className='flex items-start justify-between gap-3'>
                  <div>
                    <p className='font-medium text-kira-black'>{company.name}</p>
                    <p className='mt-1 text-xs text-kira-midgray'>
                      {company.user_count} users • {company.active_user_count} active • {company.likely_real_user_count} real-ish
                    </p>
                  </div>
                  <p className='text-xs text-kira-midgray'>Last login: {formatTimestamp(company.last_login_at)}</p>
                </div>
              </div>
            ))}
            {!isLoading && !insights?.companies.length ? (
              <p className='text-sm text-kira-midgray'>No companies found.</p>
            ) : null}
          </div>
        </Card>
      </section>

      <section>
        <Card className='p-5'>
          <div className='flex items-start justify-between gap-3'>
            <div>
              <h2>Accounts</h2>
              <p className='mt-2 text-kira-darkgray'>Use manual review to mark real customers, internal team accounts, or test users. Heuristic hints remain visible for unreviewed users.</p>
            </div>
            {insights ? <p className='text-sm text-kira-midgray'>{insights.users.length} shown</p> : null}
          </div>
          <div className='mt-4 overflow-x-auto rounded-xl border border-kira-warmgray/40'>
            <table className='min-w-full border-collapse'>
              <thead>
                <tr className='bg-kira-darkgray text-left text-kira-offwhite'>
                  <th className='px-4 py-3 text-xs font-semibold uppercase tracking-[0.04em]'>User</th>
                  <th className='px-4 py-3 text-xs font-semibold uppercase tracking-[0.04em]'>Company</th>
                  <th className='px-4 py-3 text-xs font-semibold uppercase tracking-[0.04em]'>Activity</th>
                  <th className='px-4 py-3 text-xs font-semibold uppercase tracking-[0.04em]'>Source</th>
                  <th className='px-4 py-3 text-xs font-semibold uppercase tracking-[0.04em]'>Classification</th>
                  <th className='px-4 py-3 text-xs font-semibold uppercase tracking-[0.04em]'>Review</th>
                </tr>
              </thead>
              <tbody>
                {insights?.users.map((user) => {
                  const draft = reviewDrafts[user.id] ?? {
                    verificationStatus: user.verification_status,
                    verificationNotes: user.verification_notes ?? '',
                    isSaving: false,
                  };

                  return (
                    <tr className='border-b border-kira-warmgray/35 align-top' key={user.id}>
                      <td className='px-4 py-3 text-sm text-kira-black'>
                        <p className='font-medium'>{user.full_name}</p>
                        <p className='text-kira-midgray'>{user.email}</p>
                        <p className='mt-1 text-xs text-kira-midgray'>
                          Created {formatTimestamp(user.created_at)} • {user.role}
                        </p>
                      </td>
                      <td className='px-4 py-3 text-sm text-kira-black'>
                        <p>{user.company_name ?? user.company_id}</p>
                        <p className='mt-1 text-xs text-kira-midgray'>{user.is_active ? 'Active account' : 'Inactive account'}</p>
                      </td>
                      <td className='px-4 py-3 text-sm text-kira-black'>
                        <p>Last seen: {formatTimestamp(user.last_seen_at)}</p>
                        <p className='mt-1 text-xs text-kira-midgray'>
                          Last login: {formatTimestamp(user.last_login)} • {user.login_count} login{user.login_count === 1 ? '' : 's'}
                        </p>
                      </td>
                      <td className='px-4 py-3 text-sm text-kira-black'>
                        <p>{user.signup_source}</p>
                        {user.is_super_admin ? <p className='mt-1 text-xs text-kira-midgray'>Super admin allowlisted</p> : null}
                      </td>
                      <td className='px-4 py-3 text-sm text-kira-black'>
                        <p>{classifyUser(user)}</p>
                        {user.verified_at ? (
                          <p className='mt-1 text-xs text-kira-midgray'>
                            Reviewed {formatTimestamp(user.verified_at)}
                            {user.verified_by_email ? ` by ${user.verified_by_email}` : ''}
                          </p>
                        ) : null}
                        {user.verification_status === 'unreviewed' ? (
                          <p className='mt-1 text-xs text-kira-midgray'>
                            {user.likely_test_signals.length > 0 ? user.likely_test_signals.join(', ') : 'No obvious test signals'}
                          </p>
                        ) : null}
                      </td>
                      <td className='px-4 py-3 text-sm text-kira-black'>
                        <div className='min-w-[260px] space-y-2'>
                          <select
                            className='kira-focus-ring w-full border border-kira-warmgray/55 bg-transparent px-3 py-2 text-sm'
                            onChange={(event) => {
                              const value = event.target.value as VerificationStatus;
                              setReviewDrafts((previous) => ({
                                ...previous,
                                [user.id]: { ...draft, verificationStatus: value },
                              }));
                            }}
                            value={draft.verificationStatus}
                          >
                            {VERIFICATION_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                          <textarea
                            className='kira-focus-ring min-h-[76px] w-full border border-kira-warmgray/55 bg-transparent px-3 py-2 text-sm'
                            onChange={(event) => {
                              const value = event.target.value;
                              setReviewDrafts((previous) => ({
                                ...previous,
                                [user.id]: { ...draft, verificationNotes: value },
                              }));
                            }}
                            placeholder='Why is this account real, internal, or test?'
                            value={draft.verificationNotes}
                          />
                          <Button
                            className='w-full'
                            disabled={draft.isSaving}
                            onClick={() => void handleSaveReview(user.id)}
                          >
                            {draft.isSaving ? 'Saving...' : 'Save Review'}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {!isLoading && !insights?.users.length ? (
                  <tr>
                    <td className='px-4 py-6 text-sm text-kira-midgray' colSpan={6}>No user records found.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </Card>
      </section>

      <section>
        <Card className='p-5'>
          <h2>Recent Activity</h2>
          <p className='mt-2 text-kira-darkgray'>Auth, signup, invite, and admin review events recorded by the backend audit log.</p>
          <div className='mt-4 overflow-x-auto rounded-xl border border-kira-warmgray/40'>
            <table className='min-w-full border-collapse'>
              <thead>
                <tr className='bg-kira-darkgray text-left text-kira-offwhite'>
                  <th className='px-4 py-3 text-xs font-semibold uppercase tracking-[0.04em]'>Time</th>
                  <th className='px-4 py-3 text-xs font-semibold uppercase tracking-[0.04em]'>Action</th>
                  <th className='px-4 py-3 text-xs font-semibold uppercase tracking-[0.04em]'>User</th>
                  <th className='px-4 py-3 text-xs font-semibold uppercase tracking-[0.04em]'>Company</th>
                  <th className='px-4 py-3 text-xs font-semibold uppercase tracking-[0.04em]'>Details</th>
                </tr>
              </thead>
              <tbody>
                {insights?.recent_activity.map((event) => (
                  <tr className='border-b border-kira-warmgray/35 align-top' key={event.id}>
                    <td className='px-4 py-3 text-sm text-kira-black'>{formatTimestamp(event.created_at)}</td>
                    <td className='px-4 py-3 text-sm text-kira-black'>{event.action}</td>
                    <td className='px-4 py-3 text-sm text-kira-black'>
                      <p>{event.full_name ?? 'Unknown user'}</p>
                      <p className='text-kira-midgray'>{event.email ?? 'No email recorded'}</p>
                    </td>
                    <td className='px-4 py-3 text-sm text-kira-black'>{event.company_name ?? event.company_id ?? 'N/A'}</td>
                    <td className='px-4 py-3 text-sm text-kira-black'>
                      {Object.keys(event.metadata).length > 0 ? Object.entries(event.metadata).map(([key, value]) => (
                        <p className='text-xs text-kira-midgray' key={key}>
                          {key}: {value}
                        </p>
                      )) : (
                        <p className='text-xs text-kira-midgray'>No extra metadata</p>
                      )}
                    </td>
                  </tr>
                ))}
                {!isLoading && !insights?.recent_activity.length ? (
                  <tr>
                    <td className='px-4 py-6 text-sm text-kira-midgray' colSpan={5}>No audit events found.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </Card>
      </section>
    </DashboardShell>
  );
}
