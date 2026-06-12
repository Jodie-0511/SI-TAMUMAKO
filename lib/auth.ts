import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

export type SessionUser = {
  id: string;
  nama: string;
  username: string;
  role: "admin" | "petugas";
};

const COOKIE_NAME = "si_tamu_mako_session";

function getSecretKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET minimal 32 karakter.");
  }
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(user: SessionUser) {
  return new SignJWT(user)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("12h")
    .sign(getSecretKey());
}

export async function setSessionCookie(user: SessionUser) {
  const token = await createSessionToken(user);
  const cookieStore = await cookies();

  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0
  });
}

export async function getSessionUser(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;

    const verified = await jwtVerify(token, getSecretKey());
    return verified.payload as SessionUser;
  } catch {
    return null;
  }
}

export function requireAdmin(user: SessionUser | null) {
  return Boolean(user && user.role === "admin");
}

export function requireOfficer(user: SessionUser | null) {
  return Boolean(user && (user.role === "admin" || user.role === "petugas"));
}
