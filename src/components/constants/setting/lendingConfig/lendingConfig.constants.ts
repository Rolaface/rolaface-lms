import {
  IconSettings,
  IconPercentage,
  IconReceipt2,
  IconCoins,
 IconBuildingBank
} from "@tabler/icons-react";
import { API } from "../../../../config/api"; 

export const LENDING_ENDPOINTS = {
  getDefaults: API.lendingConfig.getDefaults,
  updateDefaults: API.lendingConfig.updateDefaults,
} as const;

export const TAB_ITEMS = [
  { value: "general", label: "General Information", icon: IconSettings },
  {
    value: "interest-penalty",
    label: "Interest & Penalty Accounts",
    icon: IconPercentage,
  },
  { value: "principal", label: "Principal Accounts", icon: IconCoins },
  { value: "fee", label: "Fee Accounts", icon: IconReceipt2 },
  
  {
    value: "general-accounts",
    label: "General Accounts",
  icon: IconBuildingBank,
  },
] as const;

export type TabValue = (typeof TAB_ITEMS)[number]["value"];