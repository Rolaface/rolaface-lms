import { createTheme } from "@mantine/core";

export const mantineTheme = createTheme({
  primaryColor: "brand",

  colors: {
    /* =========================
     * IZB PRIMARY (Deep Red)
     * ========================= */
    brand: [
      "#ffe9ea",
      "#fbbdc0",
      "#f58f95",
      "#ee616a",
      "#e83340",
      "#B32025", // logo red
      "#9A1C20",
      "#7f171a",
      "#651214",
      "#4c0d0f",
    ],

    /* =========================
     * IZB ORANGE (Z gradient)
     * ========================= */
    accent: [
      "#fff0e6",
      "#ffd1b8",
      "#ffb38a",
      "#ff945c",
      "#ff762e",
      "#F26522", // logo orange
      "#d9561e",
      "#bf4c1a",
      "#a64216",
      "#8c3812",
    ],

    /* =========================
     * IZB GOLD (Z highlight)
     * ========================= */
    gold: [
      "#fff6e6",
      "#ffe5b3",
      "#ffd480",
      "#ffc24d",
      "#ffb11a",
      "#F5A623", // logo yellow
      "#db951f",
      "#c2841b",
      "#a87317",
      "#8f6213",
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