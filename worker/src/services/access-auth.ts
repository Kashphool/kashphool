import { createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey } from "jose";
import type { WorkerEnv } from "../contracts";

type AccessEnv = Pick<
  WorkerEnv,
  "ACCESS_TEAM_DOMAIN" | "ACCESS_AUD" | "ENVIRONMENT" | "LOCAL_ADMIN_TOKEN"
>;

export interface AccessIdentity {
  email: string;
  subject: string;
}

export class AccessAuthenticationError extends Error {
  constructor() {
    super("Access authentication failed");
    this.name = "AccessAuthenticationError";
  }
}

export class AccessAuthorizationError extends Error {
  constructor() {
    super("Access identity is not authorized");
    this.name = "AccessAuthorizationError";
  }
}

const isLocalBypass = (request: Request, env: AccessEnv): boolean =>
  env.ENVIRONMENT === "development" &&
  ["localhost", "127.0.0.1"].includes(new URL(request.url).hostname) &&
  typeof env.LOCAL_ADMIN_TOKEN === "string" &&
  env.LOCAL_ADMIN_TOKEN.length > 0 &&
  request.headers.get("X-Kashphool-Local-Admin") === env.LOCAL_ADMIN_TOKEN;

export async function verifyAccess(
  request: Request,
  env: AccessEnv,
  jwks: JWTVerifyGetKey = createRemoteJWKSet(
    new URL(`https://${env.ACCESS_TEAM_DOMAIN}/cdn-cgi/access/certs`)
  )
): Promise<AccessIdentity> {
  if (isLocalBypass(request, env)) {
    return { email: "local-admin", subject: "local-admin" };
  }

  const token = request.headers.get("Cf-Access-Jwt-Assertion");
  if (!token) {
    throw new AccessAuthenticationError();
  }

  let payload;
  try {
    ({ payload } = await jwtVerify(token, jwks, {
      issuer: `https://${env.ACCESS_TEAM_DOMAIN}`,
      audience: env.ACCESS_AUD,
    }));
  } catch {
    throw new AccessAuthenticationError();
  }

  if (typeof payload.exp !== "number") {
    throw new AccessAuthenticationError();
  }

  if (typeof payload.email !== "string" || payload.email.trim().length === 0) {
    throw new AccessAuthorizationError();
  }

  return {
    email: payload.email.trim(),
    subject: typeof payload.sub === "string" ? payload.sub : "",
  };
}
