// seeds/styles.ts
import type { StylesDoc } from "@/app/lib/styles/types";

export const stylesSeed: StylesDoc = {
  $version: 1,
  themes: ["light", "dark"],

  global: {
    body: {
      light: {
        backgroundColor: "#f7f8fa",
        textColor: "#0f1419",
        borderColor: "#e5e7eb",
        borderRadius: 12,
        borderWidth: 1,
        fontFamily:
          'Inter, system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif',
        fontSize: 16,
        fontWeight: 500,
        lineHeight: 1.45,
        transitionSpeed: "normal",
      },
      dark: {
        backgroundColor: "#0b0f11",
        textColor: "#f2f5f7",
        borderColor: "#1f2937",
        borderRadius: 12,
        borderWidth: 1,
        fontFamily:
          'Inter, system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif',
        fontSize: 16,
        fontWeight: 500,
        lineHeight: 1.45,
        transitionSpeed: "normal",
      },
    },
    font: {
      baseFamily:
        'Inter, system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif',
      scale: 1,
    },
  },

  /* ============== COMPONENTES ============== */
  components: {
    /* ----- BUTTON ----- */
    button: {
      // Forma clásica (tema → estado)
      light: {
        rest: {
          backgroundColor: "#111827",
          textColor: "#ffffff",
          borderColor: "#111827",
          borderRadius: 12,
          borderWidth: 1,
          paddingX: 14,
          paddingY: 10,
          transitionSpeed: "normal",
        },
        hover: {
          backgroundColor: "#1f2937",
          textColor: "#ffffff",
          borderColor: "#1f2937",
        },
        active: {
          backgroundColor: "#0f172a",
          textColor: "#ffffff",
          borderColor: "#0f172a",
        },
        disabled: {
          backgroundColor: "#9ca3af",
          textColor: "#f3f4f6",
          borderColor: "#9ca3af",
          opacity: 0.6,
          cursor: "not-allowed",
        },
        highlight: {
          backgroundColor: "#0e7490",
          textColor: "#ffffff",
          borderColor: "#0b5e73",
        },
      },
      dark: {
        rest: {
          backgroundColor: "#0e7490",
          textColor: "#ffffff",
          borderColor: "#0e7490",
          borderRadius: 12,
          borderWidth: 1,
          paddingX: 14,
          paddingY: 10,
          transitionSpeed: "normal",
        },
        hover: {
          backgroundColor: "#0b5e73",
          textColor: "#ffffff",
          borderColor: "#0b5e73",
        },
        active: {
          backgroundColor: "#094a5a",
          textColor: "#ffffff",
          borderColor: "#094a5a",
        },
        disabled: {
          backgroundColor: "#374151",
          textColor: "#9ca3af",
          borderColor: "#374151",
          opacity: 0.6,
          cursor: "not-allowed",
        },
        highlight: {
          backgroundColor: "#14b8a6",
          textColor: "#052e2b",
          borderColor: "#0ea5a6",
        },
      },

      // NUEVO: variantes dinámicas (el editor puede crear más en FS)
      kinds: {
        primary: {
          light: {
            rest: {
              backgroundColor: "#111827",
              textColor: "#F9FAFB",
              borderColor: "#111827",
              borderWidth: 1,
              borderRadius: 10,
              paddingX: 16,
              paddingY: 10,
            },
            hover: { backgroundColor: "#1f2937" },
            active: { backgroundColor: "#0f172a" },
            disabled: { opacity: 0.6 },
            highlight: { backgroundColor: "#0e7490" },
          },
          dark: {
            rest: {
              backgroundColor: "#111827",
              textColor: "#F9FAFB",
              borderColor: "#111827",
              borderWidth: 1,
              borderRadius: 10,
              paddingX: 16,
              paddingY: 10,
            },
            hover: { backgroundColor: "#0f172a" },
            active: { backgroundColor: "#0b1220" },
            disabled: { opacity: 0.6 },
            highlight: { backgroundColor: "#14b8a6" },
          },
        },

        secondary: {
          light: {
            rest: {
              backgroundColor: "transparent",
              textColor: "#111827",
              borderColor: "#111827",
              borderWidth: 1,
              borderRadius: 8,
              paddingX: 16,
              paddingY: 10,
            },
            hover: { borderColor: "#1f2937" },
            active: { borderColor: "#0f172a" },
            disabled: { opacity: 0.6 },
          },
          dark: {
            rest: {
              backgroundColor: "transparent",
              textColor: "#F9FAFB",
              borderColor: "#F9FAFB",
              borderWidth: 1,
              borderRadius: 8,
              paddingX: 16,
              paddingY: 10,
            },
            hover: { borderColor: "#e5e7eb" },
            active: { borderColor: "#cbd5e1" },
            disabled: { opacity: 0.6 },
          },
        },
      },
    },

    /* ----- INPUT ----- */
    input: {
      light: {
        rest: {
          backgroundColor: "#ffffff",
          textColor: "#0f1419",
          borderColor: "#d1d5db",
          borderWidth: 1,
          borderRadius: 12,
          paddingX: 12,
          paddingY: 10,
        },
        hover: {
          backgroundColor: "#ffffff",
          textColor: "#0f1419",
          borderColor: "#cbd5e1",
        },
        active: {
          backgroundColor: "#ffffff",
          textColor: "#0f1419",
          borderColor: "#0e7490",
          boxShadow: "0 0 0 3px rgba(20,184,166,.25)",
          outlineColor: "#14b8a6",
          outlineWidth: "2px",
        },
        disabled: {
          backgroundColor: "#f3f4f6",
          textColor: "#9ca3af",
          borderColor: "#e5e7eb",
        },
        highlight: {
          backgroundColor: "#ffffff",
          textColor: "#0f1419",
          borderColor: "#14b8a6",
          boxShadow: "0 0 0 3px rgba(20,184,166,.25)",
        },
      },
      dark: {
        rest: {
          backgroundColor: "#0f1419",
          textColor: "#e5e7eb",
          borderColor: "#374151",
          borderWidth: 1,
          borderRadius: 12,
          paddingX: 12,
          paddingY: 10,
        },
        hover: {
          backgroundColor: "#111827",
          textColor: "#e5e7eb",
          borderColor: "#475569",
        },
        active: {
          backgroundColor: "#111827",
          textColor: "#ffffff",
          borderColor: "#0e7490",
          boxShadow: "0 0 0 3px rgba(20,184,166,.25)",
          outlineColor: "#14b8a6",
          outlineWidth: "2px",
        },
        disabled: {
          backgroundColor: "#111317",
          textColor: "#9ca3af",
          borderColor: "#2b3340",
        },
        highlight: {
          backgroundColor: "#0f1419",
          textColor: "#ffffff",
          borderColor: "#14b8a6",
          boxShadow: "0 0 0 3px rgba(20,184,166,.25)",
        },
      },
    },

    /* ----- SELECT ----- */
    select: {
      light: {
        rest: {
          backgroundColor: "#ffffff",
          textColor: "#0f1419",
          borderColor: "#d1d5db",
          borderWidth: 1,
          borderRadius: 12,
          paddingX: 12,
          paddingY: 10,
        },
        hover: {
          backgroundColor: "#ffffff",
          textColor: "#0f1419",
          borderColor: "#cbd5e1",
        },
        active: {
          backgroundColor: "#ffffff",
          textColor: "#0f1419",
          borderColor: "#0e7490",
          boxShadow: "0 0 0 3px rgba(20,184,166,.25)",
        },
        disabled: {
          backgroundColor: "#f3f4f6",
          textColor: "#9ca3af",
          borderColor: "#e5e7eb",
        },
        highlight: {
          backgroundColor: "#ffffff",
          textColor: "#0f1419",
          borderColor: "#14b8a6",
        },
      },
      dark: {
        rest: {
          backgroundColor: "#0f1419",
          textColor: "#e5e7eb",
          borderColor: "#374151",
          borderWidth: 1,
          borderRadius: 12,
          paddingX: 12,
          paddingY: 10,
        },
        hover: {
          backgroundColor: "#111827",
          textColor: "#e5e7eb",
          borderColor: "#475569",
        },
        active: {
          backgroundColor: "#111827",
          textColor: "#ffffff",
          borderColor: "#0e7490",
          boxShadow: "0 0 0 3px rgba(20,184,166,.25)",
        },
        disabled: {
          backgroundColor: "#111317",
          textColor: "#9ca3af",
          borderColor: "#2b3340",
        },
        highlight: {
          backgroundColor: "#0f1419",
          textColor: "#ffffff",
          borderColor: "#14b8a6",
        },
      },
    },

    /* ----- LABEL ----- */
    label: {
      light: {
        rest: { textColor: "#374151" },
        hover: { textColor: "#1f2937" },
        active: { textColor: "#0f1419" },
        disabled: { textColor: "#9ca3af" },
        highlight: { textColor: "#0e7490" },
      },
      dark: {
        rest: { textColor: "#cbd5e1" },
        hover: { textColor: "#e5e7eb" },
        active: { textColor: "#ffffff" },
        disabled: { textColor: "#9ca3af" },
        highlight: { textColor: "#14b8a6" },
      },
    },

    /* ----- HEADINGS ----- */
    h1: {
      light: { rest: { textColor: "#0f1419", fontSize: 32, fontWeight: 700, lineHeight: 1.2 } },
      dark: { rest: { textColor: "#ffffff", fontSize: 32, fontWeight: 700, lineHeight: 1.2 } },
    },
    h2: {
      light: { rest: { textColor: "#111827", fontSize: 24, fontWeight: 700, lineHeight: 1.25 } },
      dark: { rest: { textColor: "#e5e7eb", fontSize: 24, fontWeight: 700, lineHeight: 1.25 } },
    },
    h3: {
      light: { rest: { textColor: "#1f2937", fontSize: 20, fontWeight: 600, lineHeight: 1.3 } },
      dark: { rest: { textColor: "#cbd5e1", fontSize: 20, fontWeight: 600, lineHeight: 1.3 } },
    },

    /* ----- LINK ----- */
    a: {
      light: {
        rest: { textColor: "#0e7490" },
        hover: { textColor: "#0b5e73" },
        active: { textColor: "#094a5a" },
        disabled: { textColor: "#9ca3af" },
        highlight: { textColor: "#14b8a6" },
      },
      dark: {
        rest: { textColor: "#14b8a6" },
        hover: { textColor: "#0ea5a6" },
        active: { textColor: "#0891b2" },
        disabled: { textColor: "#9ca3af" },
        highlight: { textColor: "#ffffff" },
      },
    },

    /* ----- PARAGRAPH ----- */
    p: {
      light: {
        rest: { textColor: "#374151", lineHeight: 1.6 },
        hover: { textColor: "#1f2937" },
        active: { textColor: "#0f1419" },
        disabled: { textColor: "#9ca3af" },
        highlight: { textColor: "#0e7490" },
      },
      dark: {
        rest: { textColor: "#cbd5e1", lineHeight: 1.6 },
        hover: { textColor: "#e5e7eb" },
        active: { textColor: "#ffffff" },
        disabled: { textColor: "#9ca3af" },
        highlight: { textColor: "#14b8a6" },
      },
    },

    /* ----- IMAGE ----- */
    image: {
      light: {
        rest: {
          backgroundColor: "#ffffff",
          borderColor: "#e5e7eb",
          borderRadius: 12,
          borderWidth: 1,
          boxShadow: "0 1px 2px rgba(0,0,0,.06)",
        },
      },
      dark: {
        rest: {
          backgroundColor: "#0f1419",
          borderColor: "#1f2937",
          borderRadius: 12,
          borderWidth: 1,
          boxShadow: "0 1px 2px rgba(255,255,255,.06)",
        },
      },
    },
  },
};

export default stylesSeed;
