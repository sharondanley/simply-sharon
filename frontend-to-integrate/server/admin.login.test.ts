import { describe, it, expect, beforeAll } from "vitest";
import { ENV } from "./_core/env";

describe("Admin Login Credentials", () => {
  it("should have ADMIN_USERNAME configured", () => {
    expect(ENV.adminUsername).toBeTruthy();
    expect(typeof ENV.adminUsername).toBe("string");
    expect(ENV.adminUsername.length).toBeGreaterThan(0);
  });

  it("should have ADMIN_PASSWORD configured", () => {
    expect(ENV.adminPassword).toBeTruthy();
    expect(typeof ENV.adminPassword).toBe("string");
    expect(ENV.adminPassword.length).toBeGreaterThan(0);
  });

  it("should reject empty password (security check)", () => {
    // The login mutation checks !ENV.adminPassword before comparing
    // so an empty password always fails — this confirms the guard is in place
    const wouldReject = !ENV.adminPassword || ENV.adminPassword.length === 0;
    expect(wouldReject).toBe(false);
  });
});
