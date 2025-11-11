"use client";

import type { FacultyKey } from "../../lib/faculties";

type CheckResponse = {
  ok: boolean;
  faculties: Record<FacultyKey, boolean>;
  error?: string;
};

export async function checkFaculties(
  topics: FacultyKey[]
): Promise<Record<FacultyKey, boolean>> {
  const res = await fetch("/api/faculties/check", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ topics }),
  });

  const data = (await res.json()) as CheckResponse;

  if (!res.ok || !data.ok) {
    throw new Error(data.error || "Faculty check failed");
  }

  return data.faculties;
}
