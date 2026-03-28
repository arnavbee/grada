import { afterEach, describe, expect, it, vi } from "vitest";

import { getStickerAssetFetchUrl } from "@/src/lib/sticker-asset-pdf";

describe("sticker asset PDF helpers", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("keeps same-origin asset URLs direct", () => {
    vi.stubGlobal("window", {
      location: { origin: "https://grada-web.vercel.app" },
    });

    expect(getStickerAssetFetchUrl("/static/uploads/logo.png")).toBe(
      "https://grada-web.vercel.app/static/uploads/logo.png",
    );
  });

  it("proxies cross-origin asset URLs through the app", () => {
    vi.stubGlobal("window", {
      location: { origin: "https://grada-web.vercel.app" },
    });

    expect(
      getStickerAssetFetchUrl(
        "https://pub-9ff9925f394b4118b94857488a8c83d5.r2.dev/uploads/company/logo.png",
      ),
    ).toBe(
      "https://grada-web.vercel.app/api/sticker-assets/proxy?url=https%3A%2F%2Fpub-9ff9925f394b4118b94857488a8c83d5.r2.dev%2Fuploads%2Fcompany%2Flogo.png",
    );
  });
});
