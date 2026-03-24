import { POBuilderView } from "@/src/components/dashboard/po-builder-view";

interface POBuilderDetailPageProps {
  params: {
    id: string;
  };
}

export default function POBuilderDetailPage({ params }: POBuilderDetailPageProps): JSX.Element {
  return <POBuilderView initialPoRequestId={params.id} />;
}
