import { Suspense } from "react";

import { StickerBuilderView } from "@/src/components/dashboard/sticker-builder-view";

export default function StickerBuilderPage(): JSX.Element {
  return (
    <Suspense fallback={null}>
      <StickerBuilderView />
    </Suspense>
  );
}
