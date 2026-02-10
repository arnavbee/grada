import Link from 'next/link';

import { Button } from '@/src/components/ui/button';
import { Card } from '@/src/components/ui/card';
import { DashboardShell } from '@/src/components/dashboard/dashboard-shell';

const kpis = [
  { label: 'Total Orders', value: '1,248', delta: '+6.4% this week' },
  { label: 'Pending Orders', value: '84', delta: '12 require confirmation' },
  { label: 'Stock Alerts', value: '19', delta: '7 critical SKUs' },
  { label: 'Revenue (MTD)', value: '$218,420', delta: '+11.2% vs last month' },
];

const modules = [
  {
    title: 'Catalog',
    detail: 'Product records, image enrichment, measurements, and marketplace exports.',
    href: '/dashboard/catalog',
  },
  {
    title: 'Inventory',
    detail: 'Stock health, reservations, and low-stock visibility.',
    href: '/dashboard/inventory',
  },
  {
    title: 'Orders',
    detail: 'Purchase order lifecycle, validations, and operational actions.',
    href: '/dashboard/orders',
  },
];

export function DashboardView(): JSX.Element {
  return (
    <DashboardShell
      subtitle='Select a module to work in a dedicated route-based console page.'
      title='Dashboard'
    >
      <section className='grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4'>
        {kpis.map((kpi, index) => (
          <Card
            className='animate-enter border-kira-warmgray/45 p-4 transition-transform duration-200 hover:-translate-y-0.5'
            key={kpi.label}
            style={{ animationDelay: `${160 + index * 60}ms` }}
          >
            <p className='text-sm font-medium text-kira-darkgray'>{kpi.label}</p>
            <p className='mt-1 text-2xl font-semibold text-kira-black'>{kpi.value}</p>
            <small className='mt-2 block text-kira-midgray'>{kpi.delta}</small>
          </Card>
        ))}
      </section>

      <section className='grid grid-cols-1 gap-4 xl:grid-cols-3'>
        {modules.map((module, index) => (
          <Card className='animate-enter p-5' key={module.title} style={{ animationDelay: `${280 + index * 60}ms` }}>
            <h2>{module.title}</h2>
            <p className='mt-2 text-kira-darkgray'>{module.detail}</p>
            <Link className='mt-4 inline-block' href={module.href}>
              <Button className='px-5'>Open {module.title}</Button>
            </Link>
          </Card>
        ))}
      </section>
    </DashboardShell>
  );
}
