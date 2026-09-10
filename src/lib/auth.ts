import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

import {
  isAcademicGoogleEmail,
  isGoogleEmailAllowed,
  normalizeGoogleEmail,
} from "@/lib/google-account-policy";

const SESSION_MAX_AGE_SECONDS = 8 * 60 * 60;

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.AUTH_GOOGLE_ID ?? "",
      clientSecret: process.env.AUTH_GOOGLE_SECRET ?? "",
      authorization: {
        params: {
          prompt: "select_account",
          scope: "openid email profile",
        },
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: SESSION_MAX_AGE_SECONDS,
  },
  jwt: {
    maxAge: SESSION_MAX_AGE_SECONDS,
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider !== "google" || !profile?.email) {
        return "/login?error=InvalidProvider";
      }

      const googleProfile = profile as typeof profile & {
        email_verified?: boolean;
      };
      const isVerified = googleProfile.email_verified !== false;
      if (!isVerified) {
        return "/login?error=UnverifiedEmail";
      }

      const email = normalizeGoogleEmail(profile.email);
      const isAcademicEmail = isAcademicGoogleEmail(email);

      if (isAcademicEmail && process.env.ALLOW_ACADEMIC_EMAIL !== "true") {
        return "/login?error=AcademicEmailRequiresAuthorization";
      }

      if (!isGoogleEmailAllowed(email)) {
        return "/login?error=EmailNotAuthorized";
      }

      return true;
    },
    async session({ session, token }) {
      if (session.user && typeof token.sub === "string") {
        session.user.id = token.sub;
      }
      return session;
    },
  },
  secret: process.env.AUTH_SECRET,
};

export function isAuthConfigured() {
  return Boolean(
    process.env.AUTH_SECRET &&
      process.env.AUTH_GOOGLE_ID &&
      process.env.AUTH_GOOGLE_SECRET &&
      process.env.ALLOWED_EMAILS,
  );
}
