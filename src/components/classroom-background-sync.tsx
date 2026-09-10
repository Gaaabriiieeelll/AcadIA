"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

import { syncClassroomTasksInBackgroundAction } from "@/app/task-actions";

const SYNC_INTERVAL_MS = 10 * 60 * 1000;
const FOCUS_COOLDOWN_MS = 15 * 1000;

export function ClassroomBackgroundSync() {
  const router = useRouter();
  const lastAttemptRef = useRef(0);
  const synchronizingRef = useRef(false);

  useEffect(() => {
    let active = true;

    async function synchronize({ respectCooldown = true } = {}) {
      const now = Date.now();
      if (
        !active
        || synchronizingRef.current
        || document.visibilityState !== "visible"
        || (respectCooldown && now - lastAttemptRef.current < FOCUS_COOLDOWN_MS)
      ) return;

      lastAttemptRef.current = now;
      synchronizingRef.current = true;
      try {
        const status = await syncClassroomTasksInBackgroundAction();
        if (active && status === "synced") router.refresh();
      } catch {
        // A página continua usando os dados locais e oferece atualização manual.
      } finally {
        synchronizingRef.current = false;
      }
    }

    void synchronize({ respectCooldown: false });
    const intervalId = window.setInterval(() => {
      void synchronize({ respectCooldown: false });
    }, SYNC_INTERVAL_MS);
    const synchronizeWhenVisible = () => void synchronize();
    document.addEventListener("visibilitychange", synchronizeWhenVisible);
    window.addEventListener("focus", synchronizeWhenVisible);

    return () => {
      active = false;
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", synchronizeWhenVisible);
      window.removeEventListener("focus", synchronizeWhenVisible);
    };
  }, [router]);

  return null;
}
