import { ReceivedPODocumentsView } from "@/src/components/dashboard/received-po-documents-view";

interface ReceivedPODocumentsPageProps {
  params: {
    id: string;
  };
}

export default function ReceivedPODocumentsPage({
  params,
}: ReceivedPODocumentsPageProps): JSX.Element {
  return <ReceivedPODocumentsView receivedPoId={params.id} />;
}
