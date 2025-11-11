// app/lib/faculties/useFaculty.ts
"use client";

import { useState, useEffect } from "react";
import type { FacultyKey } from "../../lib/faculties";
import { checkFaculties } from "./client";

export function useFaculty(key: FacultyKey) {
  const [enabled, setEnabled] = useState<boolean | null>(null);

  useEffect(() => {
    checkFaculties([key])
      .then((faculties) => setEnabled(faculties[key]))
      .catch(() => setEnabled(false));
  }, [key]);

  return enabled;
}
