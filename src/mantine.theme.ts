import { createTheme } from "@mantine/core";

export const mantineTheme = createTheme({
  primaryColor: "brand",

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
  },

  fontFamily: "var(--font-main)",

  radius: {
    xs: "var(--radius-sm)",
    sm: "var(--radius-sm)",
    md: "var(--radius-main)",
    lg: "var(--radius-main)",
    xl: "var(--radius-main)",
  },

  shadows: {
    sm: "var(--shadow-sm)",
    md: "var(--shadow-md)",
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

    Button: {
      defaultProps: {
        radius: "sm",
        color: "brand",
      },
    },

    Paper: {
      defaultProps: {
        radius: "sm",
      },
    },

    TextInput: {
      defaultProps: {
        radius: "sm",
      },
    },

    Textarea: {
      defaultProps: {
        radius: "sm",
      },
    },

    NumberInput: {
      defaultProps: {
        radius: "sm",
      },
    },

    DateInput: {
      defaultProps: {
        radius: "sm",
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
    },

    Select: {
      defaultProps: {
        radius: "sm",
      },
    },
  },
});