import { DashboardShell } from '@/src/components/dashboard/dashboard-shell';
import { Card } from '@/src/components/ui/card';

interface ModulePlaceholderViewProps {
  title: string;
  description: string;
}

export function ModulePlaceholderView({ title, description }: ModulePlaceholderViewProps): JSX.Element {
  return (
    <DashboardShell subtitle={description} title={title}>
      <Card className='p-5'>
        <h2>{title}</h2>
        <p className='mt-2 text-kira-darkgray'>Dedicated page created. Module implementation continues next.</p>
      </Card>
    </DashboardShell>
  );
}
