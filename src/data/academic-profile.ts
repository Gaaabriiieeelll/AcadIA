import "server-only";

import { db } from "@/lib/db";
import type { AcademicProfileValues } from "@/types/academic-profile";

import { requireCurrentIdentity } from "./current-user";

const academicProfileSelection = {
  registrationNumber: true,
  campus: true,
  course: true,
  classGroup: true,
  academicStage: true,
} as const;

export async function getCurrentAcademicProfile(): Promise<AcademicProfileValues | null> {
  const { googleSubject } = await requireCurrentIdentity();
  const user = await db.user.findUnique({
    where: { googleSubject },
    select: {
      profile: {
        select: academicProfileSelection,
      },
    },
  });

  return user?.profile ?? null;
}

export async function saveCurrentAcademicProfile(values: AcademicProfileValues) {
  const { googleSubject } = await requireCurrentIdentity();

  await db.user.upsert({
    where: { googleSubject },
    create: {
      googleSubject,
      profile: {
        create: values,
      },
    },
    update: {
      profile: {
        upsert: {
          create: values,
          update: values,
        },
      },
    },
    select: { id: true },
  });
}
