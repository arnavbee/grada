import { describe, expect, it } from "vitest";

import type { Role } from "./index";

describe("Role union", () => {
  it("accepts expected role values", () => {
    const role: Role = "admin";
    expect(role).toBe("admin");
  });
});
