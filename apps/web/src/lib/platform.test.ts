import { describe, expect, it } from "vitest";

import { platformName } from "./platform";

describe("platformName", () => {
  it("is stable for UI and docs", () => {
    expect(platformName).toBe("grada");
  });
});
