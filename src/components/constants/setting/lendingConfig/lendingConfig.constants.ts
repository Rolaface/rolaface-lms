import {
  IconSettings,
  IconPercentage,
  IconReceipt2,
  IconCoins,
  IconAlertTriangle,
} from "@tabler/icons-react";

export const LENDING_ENDPOINTS = {
  getDefaults: "TODO_ADD_API_LENDING_DEFAULTS_GET",
  updateDefaults: "TODO_ADD_API_LENDING_DEFAULTS_UPDATE",
  getGLAccounts: "TODO_ADD_API_GL_ACCOUNTS_GET",
} as const;

export const TAB_ITEMS = [
  { value: "general", label: "General Information", icon: IconSettings },
  {
    value: "interest-penalty",
    label: "Interest & Penalty Accounts",
    icon: IconPercentage,
  },
  { value: "fee", label: "Fee Accounts", icon: IconReceipt2 },
  { value: "principal", label: "Principal Accounts", icon: IconCoins },
  {
    value: "arrears",
    label: "Arrears & Write-off",
    icon: IconAlertTriangle,
  },
] as const;

export type TabValue = (typeof TAB_ITEMS)[number]["value"];