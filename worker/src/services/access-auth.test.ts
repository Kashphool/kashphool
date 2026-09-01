import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT } from "jose";
import { beforeAll, describe, expect, it } from "vitest";
import type { WorkerEnv } from "../contracts";
import {
  AccessAuthenticationError,
  AccessAuthorizationError,
  verifyAccess,
} from "./access-auth";

const env = {
  ACCESS_TEAM_DOMAIN: "kashphool.cloudflareaccess.com",
  ACCESS_AUD: "admin-audience",
  ENVIRONMENT: "production",
} as WorkerEnv;

let privateKey: CryptoKey;
let jwks: ReturnType<typeof createLocalJWKSet>;

beforeAll(async () => {
  const keyPair = await generateKeyPair("RS256");
  privateKey = keyPair.privateKey;
  jwks = createLocalJWKSet({
    keys: [
      {
        ...(await exportJWK(keyPair.publicKey)),
        alg: "RS256",
        kid: "test-key",
        use: "sig",
      },
    ],
  });
});

const signToken = async (
  overrides: {
    email?: string;
    issuer?: string;
    audience?: string;
    expiration?: number | null;
  } = {}
): Promise<string> => {
  const now = Math.floor(Date.now() / 1000);
  let token = new SignJWT({ email: overrides.email ?? "admin@kashphool.co.uk" })
    .setProtectedHeader({ alg: "RS256", kid: "test-key" })
    .setIssuer(overrides.issuer ?? `https://${env.ACCESS_TEAM_DOMAIN}`)
    .setAudience(overrides.audience ?? env.ACCESS_AUD)
    .setSubject("access-user-123")
    .setIssuedAt(now);
  if (overrides.expiration !== null) {
    token = token.setExpirationTime(overrides.expiration ?? now + 300);
  }
  return token.sign(privateKey);
};

const requestWithToken = (token: string): Request =>
  new Request("https://kashphool.co.uk/api/admin/leads", {
    headers: { "Cf-Access-Jwt-Assertion": token },
  });

describe("verifyAccess", () => {
  it("returns the verified email and subject from a valid Access JWT", async () => {
    const token = await signToken();

    await expect(
      verifyAccess(requestWithToken(token), env, jwks)
    ).resolves.toEqual({
      email: "admin@kashphool.co.uk",
      subject: "access-user-123",
    });
  });

  it("rejects a request without an Access JWT", async () => {
    await expect(
      verifyAccess(
        new Request("https://kashphool.co.uk/api/admin/leads"),
        env,
        jwks
      )
    ).rejects.toBeInstanceOf(AccessAuthenticationError);
  });

  it("rejects an expired Access JWT", async () => {
    const now = Math.floor(Date.now() / 1000);
    const token = await signToken({ expiration: now - 1 });

    await expect(
      verifyAccess(requestWithToken(token), env, jwks)
    ).rejects.toBeInstanceOf(AccessAuthenticationError);
  });

  it("rejects an Access JWT without an expiry", async () => {
    const token = await signToken({ expiration: null });

    await expect(
      verifyAccess(requestWithToken(token), env, jwks)
    ).rejects.toBeInstanceOf(AccessAuthenticationError);
  });

  it("rejects an Access JWT from the wrong issuer", async () => {
    const token = await signToken({
      issuer: "https://other.cloudflareaccess.com",
    });

    await expect(
      verifyAccess(requestWithToken(token), env, jwks)
    ).rejects.toBeInstanceOf(AccessAuthenticationError);
  });

  it("rejects an Access JWT for the wrong audience", async () => {
    const token = await signToken({ audience: "another-application" });

    await expect(
      verifyAccess(requestWithToken(token), env, jwks)
    ).rejects.toBeInstanceOf(AccessAuthenticationError);
  });

  it("forbids a verified identity without a non-empty email", async () => {
    const token = await signToken({ email: "   " });

    await expect(
      verifyAccess(requestWithToken(token), env, jwks)
    ).rejects.toBeInstanceOf(AccessAuthorizationError);
  });

  it("permits the local bypass only for development localhost with the configured token", async () => {
    const localEnv = {
      ...env,
      ENVIRONMENT: "development",
      LOCAL_ADMIN_TOKEN: "local-admin-token",
    } satisfies WorkerEnv;

    await expect(
      verifyAccess(
        new Request("http://127.0.0.1:8787/api/admin/leads", {
          headers: { "X-Kashphool-Local-Admin": "local-admin-token" },
        }),
        localEnv,
        jwks
      )
    ).resolves.toEqual({ email: "local-admin", subject: "local-admin" });

    const nearMisses = [
      {
        request: new Request("https://kashphool.co.uk/api/admin/leads", {
          headers: { "X-Kashphool-Local-Admin": "local-admin-token" },
        }),
        environment: localEnv,
      },
      {
        request: new Request("http://localhost:8787/api/admin/leads", {
          headers: { "X-Kashphool-Local-Admin": "wrong-token" },
        }),
        environment: localEnv,
      },
      {
        request: new Request("http://localhost:8787/api/admin/leads", {
          headers: { "X-Kashphool-Local-Admin": "local-admin-token" },
        }),
        environment: {
          ...localEnv,
          ENVIRONMENT: "production",
        } satisfies WorkerEnv,
      },
    ];

    for (const nearMiss of nearMisses) {
      await expect(
        verifyAccess(nearMiss.request, nearMiss.environment, jwks)
      ).rejects.toBeInstanceOf(AccessAuthenticationError);
    }
  });
});
