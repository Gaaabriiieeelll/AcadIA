import "server-only";

import { cache } from "react";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";

export class AuthenticationRequiredError extends Error {
  constructor() {
    super("Authentication required");
    this.name = "AuthenticationRequiredError";
  }
}

export const getCurrentIdentity = cache(async () => {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) return null;

  return {
    googleSubject: session.user.id,
  };
});

export async function requireCurrentIdentity() {
  const identity = await getCurrentIdentity();

  if (!identity) throw new AuthenticationRequiredError();

  return identity;
}
