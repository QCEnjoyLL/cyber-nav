import { describe, expect, it } from "vitest";
import { verifyPassword } from "../src/worker/auth";

const storedHash =
  "pbkdf2_sha256$100000$Y3liZXItbmF2LXRlc3Qtc2FsdA==$Nqfnj0BhM/EhuCqJNEGoHBMIQWA9JRNOCEzf1pN6sPw=";

describe("worker auth", () => {
  it("validates a matching PBKDF2 password hash", async () => {
    await expect(verifyPassword("night-city", storedHash)).resolves.toBe(true);
  });

  it("rejects an incorrect password", async () => {
    await expect(verifyPassword("wrong-password", storedHash)).resolves.toBe(false);
  });

  it("rejects malformed hashes without throwing", async () => {
    await expect(verifyPassword("night-city", "pbkdf2_sha256$100000$not base64$also not base64")).resolves.toBe(false);
  });
});
