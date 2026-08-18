import { createTheme, rem } from "@mantine/core";

export const mantineTheme = createTheme({
  primaryColor: "brand",
  primaryShade: { light: 5, dark: 6 },
  defaultRadius: "sm",
  cursorType: "pointer",

  

  breakpoints: {
    xs: "30em", // 480px — below your supported floor, kept for Mantine internals that expect it
    sm: "40em", // 640px
    md: "48em", // 768px  ← your real floor (tablet)
    lg: "64em", // 1024px ← primary desktop target
    xl: "80em", // 1280px
  },

  colors: {
    /* =========================
     * PRIMARY (Indigo Blue)
     * ========================= */
    brand: [
      "#eef2ff",
      "#e0e7ff",
      "#c7d2fe",
      "#a5b4fc",
      "#818cf8",
      "#4F46E5", // primary
      "#4338CA",
      "#3730A3",
      "#312E81",
      "#1E1B4B",
    ],

    accent: [
      "#fff0e6",
      "#ffd1b8",
      "#ffb38a",
      "#ff945c",
      "#ff762e",
      "#F26522",
      "#d9561e",
      "#bf4c1a",
      "#a64216",
      "#8c3812",
    ],

    gold: [
      "#fff6e6",
      "#ffe5b3",
      "#ffd480",
      "#ffc24d",
      "#ffb11a",
      "#F5A623",
      "#db951f",
      "#c2841b",
      "#a87317",
      "#8f6213",
    ],

    indigoAlt: [
      "#eef2ff",
      "#e0e7ff",
      "#c7d2fe",
      "#a5b4fc",
      "#818cf8",
      "#6366f1",
      "#4f46e5",
      "#4338ca",
      "#3730a3",
      "#312e81",
    ],

    /* =========================
     * NEUTRAL — warm slate, not flat gray.
     * This single swap does more for "premium" feel than
     * anything else in the file. Use this instead of `gray.*`
     * everywhere: text, borders, backgrounds, dividers.
     * ========================= */
    slate: [
      "#f8fafc", // 0 — page / table-header background
      "#f1f5f9", // 1 — hover background, subtle fills
      "#e2e8f0", // 2 — borders, dividers
      "#cbd5e1", // 3 — disabled borders, input borders
      "#94a3b8", // 4 — placeholder text, disabled text
      "#64748b", // 5 — secondary/body text
      "#475569", // 6 — primary body text (non-heading)
      "#334155", // 7 — strong body text
      "#1e293b", // 8 — headings
      "#0f172a", // 9 — max-contrast headings
    ],

    /* =========================
     * SEMANTIC STATUS — desaturated, not neon.
     * Enterprise apps avoid pure red/green; these read as
     * "calm confidence" instead of "toy UI".
     * ========================= */
    success: [
      "#ecfdf5",
      "#d1fae5",
      "#a7f3d0",
      "#6ee7b7",
      "#34d399",
      "#10B981", // primary
      "#059669",
      "#047857",
      "#065f46",
      "#064e3b",
    ],

    warning: [
      "#fffbeb",
      "#fef3c7",
      "#fde68a",
      "#fcd34d",
      "#fbbf24",
      "#F59E0B", // primary
      "#d97706",
      "#b45309",
      "#92400e",
      "#78350f",
    ],

    /* =========================
     * DANGER / WARNING (Rose)
     * ========================= */
    danger: [
      "#fff1f2",
      "#ffe4e6",
      "#fecdd3",
      "#fda4af",
      "#fb7185",
      "#F43F5E", // primary
      "#E11D48",
      "#BE123C",
      "#9F1239",
      "#881337",
    ],

    info: [
      "#eff6ff",
      "#dbeafe",
      "#bfdbfe",
      "#93c5fd",
      "#60a5fa",
      "#3B82F6",
      "#2563eb",
      "#1d4ed8",
      "#1e40af",
      "#1e3a8a",
    ],
  },

  /* =========================
   * TYPOGRAPHY
   * Tighter, more deliberate scale than Mantine defaults.
   * Enterprise data-density needs smaller base sizes and
   * controlled line-height — not marketing-page type scale.
   * ========================= */
  fontFamily: "var(--font-main)",
  fontFamilyMonospace:
    "'JetBrains Mono', 'SF Mono', ui-monospace, 'Roboto Mono', monospace",
  fontSizes: {
    micro: rem(10),
    xxs: rem(11),
    xs: rem(12.5),
    sm: rem(14),
    md: rem(15.5),
    lg: rem(17.5),
    xl: rem(20),
  },

  lineHeights: {
    xs: "1.45",
    sm: "1.5",
    md: "1.55",
    lg: "1.6",
    xl: "1.65",
  },



  headings: {
    fontFamily: "var(--font-main)",
    fontWeight: "600",
    sizes: {
      h1: { fontSize: rem(26), lineHeight: "1.3", fontWeight: "700" },
      h2: { fontSize: rem(21), lineHeight: "1.35" },
      h3: { fontSize: rem(17), lineHeight: "1.4" },
      h4: { fontSize: rem(15), lineHeight: "1.4" },
      h5: { fontSize: rem(13.5), lineHeight: "1.45" },
      h6: { fontSize: rem(12.5), lineHeight: "1.45" },
    },
  },

  radius: {
    xs: "var(--radius-sm, 4px)",
    sm: "var(--radius-sm, 6px)",
    md: "var(--radius-main, 8px)",
    lg: "var(--radius-main, 12px)",   // was 10px
    xl: "var(--radius-main, 14px)",
  },
  shadows: {
    xs: "0 1px 2px rgba(15, 23, 42, 0.04)",
    sm: "var(--shadow-sm, 0 1px 3px rgba(15, 23, 42, 0.06), 0 1px 2px rgba(15, 23, 42, 0.04))",
    md: "var(--shadow-md, 0 4px 12px rgba(15, 23, 42, 0.08), 0 2px 4px rgba(15, 23, 42, 0.04))",
    lg: "0 10px 24px rgba(15, 23, 42, 0.10), 0 4px 8px rgba(15, 23, 42, 0.05)",
    xl: "0 20px 40px rgba(15, 23, 42, 0.12)",
  },

  other: {
    // ---- modal chrome ----
    // These now describe the header exactly as CustomerModal.tsx renders it
    // (solid brand-6 fill, white text) instead of the old, unused
    // white-header / navy-text combo that nothing referenced.
    modalHeaderBg: "var(--mantine-color-brand-6)",
    modalHeaderBorder: "var(--mantine-color-brand-7)",
    modalHeaderTextColor: "var(--mantine-color-white)",
    modalHeaderSubTextColor: "var(--mantine-color-brand-1)",
    modalHeaderDividerColor: "var(--mantine-color-brand-3)",
    modalHeaderIconBg: "var(--mantine-color-white)",

    headerIconOverlayBg:
      "color-mix(in srgb, var(--mantine-color-white) 18%, transparent)",
    headerButtonHoverBg:
      "color-mix(in srgb, var(--mantine-color-white) 10%, transparent)",

    // ---- semantic text roles — reference these instead of hardcoding gray.6 etc. ----
    textPrimary: "var(--mantine-color-slate-8)",
    textSecondary: "var(--mantine-color-slate-5)",
    textMuted: "var(--mantine-color-slate-4)",
    borderSubtle: "var(--mantine-color-slate-2)",
    surfaceMuted: "var(--mantine-color-slate-0)",
    surfaceHover: "var(--mantine-color-slate-1)",

    // ---- status dot colors, for the dot+label badge pattern ----
    statusActive: "var(--mantine-color-success-6)",
    statusInactive: "var(--mantine-color-danger-5)",
    statusPending: "var(--mantine-color-warning-5)",

    // ---- brand gradient + glow — single source of truth ----
    // Previously duplicated inline in Customer.tsx with mismatched
    // stops (brand-8 in one place, brand-7 in another). Pick ONE
    // gradient and reuse it everywhere so a brand color change only
    // has to happen here.
    brandGradient:
      "linear-gradient(135deg, var(--mantine-color-brand-5), var(--mantine-color-brand-7))",
    brandGlowShadow:
      "0 6px 16px color-mix(in srgb, var(--mantine-color-brand-6) 30%, transparent)",
    brandGlowShadowSm:
      "0 4px 10px color-mix(in srgb, var(--mantine-color-brand-6) 30%, transparent)",

    // ---- interaction states used in the customer table ----
    searchFocusRing:
      "0 0 0 3px color-mix(in srgb, var(--mantine-color-brand-5) 18%, transparent)",
    rowHoverBg:
      "color-mix(in srgb, var(--mantine-color-brand-5) 5%, var(--mantine-color-white))",
  },

  components: {
    Modal: {
      defaultProps: {
        centered: true,
        withCloseButton: false,
        radius: "xl",
        size: "xl",
        overlayProps: {
          blur: 2,
          opacity: 0.55,
        },
      },
    },

       MultiSelect: {
      defaultProps: { radius: "lg", size: "xs" },
      styles: {
        input: { borderColor: "var(--mantine-color-slate-3)" },
        label: {
          fontSize: rem(13.5),
          fontWeight: 600,
          color: "var(--mantine-color-slate-6)",
          marginBottom: rem(6),
        },
        pill: {
          fontWeight: 600,
        },
      },
    },

    Button: {
      defaultProps: {
        radius: "sm",
        color: "brand",
        size: "sm",
      },
      styles: {
        root: {
          fontWeight: 600,
          transition: "background-color 120ms ease, box-shadow 120ms ease, transform 80ms ease",
        },
      },
    },

    Paper: {
      defaultProps: {
        radius: "sm",
      },
      styles: {
        root: {
          borderColor: "var(--mantine-color-slate-2)",
        },
      },
    },

    Card: {
      defaultProps: {
        radius: "md",
        withBorder: true,
      },
      styles: {
        root: {
          borderColor: "var(--mantine-color-slate-2)",
        },
      },
    },

    Table: {
      defaultProps: {
        highlightOnHover: true,
        verticalSpacing: "sm",
        horizontalSpacing: "md",
      },
      styles: {
        thead: {
          background: "var(--mantine-color-slate-0)",
        },
        th: {
          color: "var(--mantine-color-slate-5)",
          fontSize: rem(11.5),
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.03em",
          borderBottom: "1px solid var(--mantine-color-slate-2)",
        },
        tr: {
          "&:hover": {
            background: "var(--mantine-color-slate-0)",
          },
        },
        td: {
          borderBottom: "1px solid var(--mantine-color-slate-1)",
          color: "var(--mantine-color-slate-6)",
        },
      },
    },

    Badge: {
      defaultProps: {
        radius: "sm",
        variant: "light",
      },
      styles: {
        root: {
          fontWeight: 600,
          letterSpacing: "0.02em",
          textTransform: "none",
        },
      },
    },

    Tooltip: {
      defaultProps: {
        radius: "sm",
        withArrow: true,
        transitionProps: { duration: 100 },
      },
      styles: {
        tooltip: {
          fontSize: rem(11.5),
          fontWeight: 500,
          background: "var(--mantine-color-slate-8)",
        },
      },
    },

    ActionIcon: {
      defaultProps: {
        radius: "sm",
      },
    },

  
    TextInput: {
      defaultProps: { radius: "lg", size: "xs" },
      styles: {
        input: {
          borderColor: "var(--mantine-color-slate-3)",
          fontSize: rem(14.5),
          "&:focus": { borderColor: "var(--mantine-color-brand-5)" },
        },
        label: {
          fontSize: rem(13.5),
          fontWeight: 600,
          color: "var(--mantine-color-slate-6)",
          marginBottom: rem(6),
        },
      },
    },

    NumberInput: {
      defaultProps: { radius: "lg", size: "xs" },
    },

    Select: {
      defaultProps: { radius: "lg", size: "xs" },
      styles: {
        input: { borderColor: "var(--mantine-color-slate-3)" },
        label: {
          fontSize: rem(13.5),
          fontWeight: 600,
          color: "var(--mantine-color-slate-6)",
          marginBottom: rem(6),
        },
      },
    },

    Textarea: {
      defaultProps: {
        radius: "sm",
        size: "sm",
      },
    },



    DateInput: {
      defaultProps: {
        radius: "sm",
        size: "sm",
      },
    },

    Checkbox: {
      defaultProps: {
        radius: "sm",
      },
    },

    Radio: {
      defaultProps: {
        radius: "sm",
      },
    },

    Tabs: {
      defaultProps: {
        radius: "sm",
      },
      styles: {
        tab: {
          fontWeight: 600,
          fontSize: rem(13),
        },
      },
    },
    
    SegmentedControl: {
      defaultProps: {
        radius: "md",
      },
      styles: {
        root: {
          background: "var(--mantine-color-slate-1)",
          padding: rem(3),
        },
        indicator: {
          boxShadow: "var(--mantine-shadow-sm)",
        },
        label: {
          fontWeight: 700,
          fontSize: rem(11.5),
          padding: `${rem(5)} ${rem(10)}`,
          whiteSpace: "nowrap",
        },
      },
    },

    Pagination: {
      defaultProps: {
        radius: "sm",
        size: "sm",
      },
    },

    Title: {
      styles: {
        root: {
          color: "var(--mantine-color-slate-8)",
        },
      },
    },

    Text: {
      defaultProps: {
        c: "slate.6",
      },
    },
  },
});


