import { ReceivedPOReviewView } from "@/src/components/dashboard/received-po-review-view";

interface ReceivedPOReviewPageProps {
  params: {
    id: string;
  };
}

export default function ReceivedPOReviewPage({ params }: ReceivedPOReviewPageProps): JSX.Element {
  return <ReceivedPOReviewView receivedPoId={params.id} />;
}
