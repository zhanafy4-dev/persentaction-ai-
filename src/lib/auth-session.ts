import { encode } from "next-auth/jwt";

const SESSION_MAX_AGE = 30 * 24 * 60 * 60;

export function sessionCookieName() {
  const secure = process.env.NODE_ENV === "production";
  return secure ? "__Secure-next-auth.session-token" : "next-auth.session-token";
}

export async function createSessionToken(userId: string, email: string) {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error("NEXTAUTH_SECRET is not set on the server.");

  return encode({
    token: {
      sub: userId,
      email,
      userId,
    },
    secret,
    maxAge: SESSION_MAX_AGE,
  });
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  maxAge: SESSION_MAX_AGE,
  secure: process.env.NODE_ENV === "production",
};
