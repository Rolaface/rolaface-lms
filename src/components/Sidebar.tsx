import React, { useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  Box,
  Text,
  Stack,
  UnstyledButton,
  Avatar,
  ActionIcon,
  Collapse,
} from "@mantine/core";
import {
  IconShieldCheck,
  IconLayoutDashboard,
  IconCalculator,
  IconFileText,
  IconUsers,
  IconSettings,
  IconMenu2,
  IconLogout,
  IconMoneybag,
  IconChevronDown,
  IconChevronUp,
  IconBuildingBank,
  IconListDetails,
  IconReportAnalytics,
  IconCreditCard,
} from "@tabler/icons-react";

// Updated Navigation Items with Submenus
const LOCAL_NAV_ITEMS = [
  {
    path: "/",
    label: "Dashboard",
    icon: IconLayoutDashboard,
    matchPrefix: false,
  },
  { path: "/customer", label: "Customer", icon: IconUsers, matchPrefix: true },
  {
    path: "/collateral",
    label: "Collateral",
    icon: IconShieldCheck,
    matchPrefix: true,
    subItems: [
      {
        path: "/collateral/type",
        label: "Collateral Type",
        icon: IconListDetails,
      },
      { path: "/collateral/list", label: "Collateral", icon: IconShieldCheck },
    ],
  },
  {
    path: "/setup",
    label: "Lending Setup",
    icon: IconSettings,
    matchPrefix: true,
    subItems: [
      {
        path: "/setup/category",
        label: "Loan Category",
        icon: IconListDetails,
      },
      {
        path: "/setup/classification",
        label: "Loan Classification",
        icon: IconFileText,
      },
      // {
      //   path: "/setup/classificationRange",
      //   label: "Loan Classification Range",
      //   icon: IconFileText,
      // },
      // {
      //   path: "/setup/provisioning",
      //   label: "Provisioning",
      //   icon: IconCalculator,
      // },
      {
        path: "/setup/collection",
        label: "Collection Sequence",
        icon: IconListDetails,
      },
      { path: "/setup/fees", label: "Fee and Charges", icon: IconCreditCard },
      { path: "/setup/product", label: "Loan Product", icon: IconBuildingBank },
    ],
  },
  {
    path: "/origination",
    label: "Origination",
    icon: IconFileText,
    matchPrefix: true,
    subItems: [
      {
        path: "/origination/application",
        label: "Loan Application",
        icon: IconFileText,
      },
    ],
  },
  {
    path: "/operations",
    label: "Lending Operations",
    icon: IconMoneybag,
    matchPrefix: true,
    subItems: [
      {
        path: "/operations/booking",
        label: "Loan Booking",
        icon: IconFileText,
      },
      {
        path: "/operations/disbursement",
        label: "Loan Disbursement",
        icon: IconCreditCard,
      },
      {
        path: "/operations/repayment",
        label: "Loan Repayment",
        icon: IconCalculator,
      },
      {
        path: "/operations/prepayment",
        label: "Loan Prepayment",
        icon: IconCalculator,
      },
      { path: "/operations/waiver", label: "Loan Waiver", icon: IconFileText },
      {
        path: "/operations/capitalization",
        label: "Loan Capitalization",
        icon: IconFileText,
      },
      {
        path: "/operations/settlement",
        label: "Full Settlement",
        icon: IconShieldCheck,
      },
      {
        path: "/operations/restructure",
        label: "Loan Restructure",
        icon: IconSettings,
      },
      {
        path: "/operations/writeoff",
        label: "Loan Write-Off",
        icon: IconFileText,
      },
      {
        path: "/operations/transfer",
        label: "Loan Transfer",
        icon: IconBuildingBank,
      },
    ],
  },
  {
    path: "/reports",
    label: "Lending Reports",
    icon: IconReportAnalytics,
    matchPrefix: true,
    subItems: [
      {
        path: "/reports/statement",
        label: "Loan Statement",
        icon: IconFileText,
      },
      {
        path: "/reports/arrears",
        label: "Arrear Reports",
        icon: IconReportAnalytics,
      },
    ],
  },
];
// Size config — tweak these to scale text/icons up or down
const SIZES = {
  rootIcon: 22, // top-level nav icons (Dashboard, Customer, etc.)
  subIcon: 18, // submenu icons
  rootText: 15, // top-level label font size (px)
  subText: 14, // submenu label font size (px)
  chevron: 16,
  logoIcon: 28,
  avatarLetter: "md", // Mantine Avatar size token
};

export function Sidebar({
  isCollapsed,
  onToggle,
}: {
  isCollapsed: boolean;
  onToggle: () => void;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  // State to manage open/closed submenus
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({
    // 'Lending Setup': true,
  });

  const toggleMenu = (label: string) => {
    setOpenMenus((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  return (
    <Box className="flex h-full flex-col bg-white overflow-hidden">
      {/* Sub Header: Logo, Company Name & Toggle */}
      <Box
        className={`flex items-center border-b border-gray-200 py-5 ${isCollapsed ? "px-4 justify-center flex-col gap-4" : "px-6 gap-4"}`}
      >
        <Box className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white shadow-sm">
          <IconShieldCheck size={28} className="text-[#3B82F6]" />
        </Box>

        {!isCollapsed && (
          <Text fw={700} size="md" className="flex-1 text-gray-900">
            LMS
          </Text>
        )}

        <ActionIcon
          variant="subtle"
          color="gray"
          className="shrink-0"
          onClick={onToggle}
        >
          <IconMenu2 size={22} className="text-gray-500" />
        </ActionIcon>
      </Box>

      {/* Navigation Items */}
      <Stack
        gap={16}
        className={`flex-1 py-8 overflow-y-auto ${isCollapsed ? "px-4 items-center" : "px-6"}`}
      >
        {LOCAL_NAV_ITEMS.map((item) => {
          const isRootActive = item.matchPrefix
            ? (pathname.startsWith(item.path) && item.path !== "/") ||
              pathname === item.path
            : pathname === item.path;

          const ItemIcon = item.icon;
          const hasSubItems = item.subItems && item.subItems.length > 0;

          // Ensure it evaluates to a strict boolean
          const isOpen = openMenus[item.label] === true;

          return (
            <Box key={item.label} className="w-full">
              <UnstyledButton
                {...(hasSubItems && !isCollapsed
                  ? { component: "button" as any }
                  : { component: Link, to: item.path })}
                onClick={(e: React.MouseEvent) => {
                  if (hasSubItems && !isCollapsed) {
                    e.preventDefault(); // Stop any rogue link behaviors
                    toggleMenu(item.label);
                  }
                }}
                title={isCollapsed ? item.label : undefined}
                className={`flex w-full items-center justify-between text-[15px] font-medium transition-colors py-1.5 ${isCollapsed ? "justify-center" : ""} ${
                  isRootActive || (isOpen && hasSubItems && !isCollapsed)
                    ? "text-[#1E40AF]"
                    : "text-gray-600 hover:text-[#1E40AF]"
                }`}
                style={{ fontSize: SIZES.rootText }}
              >
                <Box
                  className={`flex items-center ${isCollapsed ? "justify-center" : "gap-4"}`}
                >
                  <ItemIcon
                    // size={22}
                    size={SIZES.rootIcon}
                    stroke={1.5}
                    className={
                      isRootActive || (isOpen && hasSubItems && !isCollapsed)
                        ? "text-[#1E40AF]"
                        : "text-gray-500"
                    }
                  />
                  {!isCollapsed && <span>{item.label}</span>}
                </Box>

                {/* Expand / Collapse Icon */}
                {!isCollapsed && hasSubItems && (
                  <Box className="text-gray-400">
                    {isOpen ? (
                      <IconChevronUp
                        size={SIZES.chevron}
                        className="text-[#1E40AF]"
                      />
                    ) : (
                      <IconChevronDown size={16} />
                    )}
                  </Box>
                )}
              </UnstyledButton>

              {/* Submenu rendering */}
              {hasSubItems && !isCollapsed && isOpen && (
                <Box className="ml-[11px] mt-2 mb-2 flex flex-col gap-3 border-l-2 border-gray-200 py-1 pl-6">
                  {item.subItems!.map((subItem) => {
                    const isSubActive = pathname === subItem.path;
                    const SubIcon = subItem.icon;

                    return (
                      <UnstyledButton
                        key={subItem.path}
                        component={Link}
                        to={subItem.path}
                        className={`flex items-center gap-3 text-[14px] font-medium transition-colors ${
                          isSubActive
                            ? "text-[#1E40AF]"
                            : "text-gray-600 hover:text-[#1E40AF]"
                        }`}
                        style={{ fontSize: SIZES.subText }}
                      >
                        <SubIcon
                          // size={18}
                          size={SIZES.subIcon}
                          stroke={1.5}
                          className={
                            isSubActive ? "text-[#1E40AF]" : "text-gray-500"
                          }
                        />
                        <span>{subItem.label}</span>
                      </UnstyledButton>
                    );
                  })}
                </Box>
              )}
            </Box>
          );
        })}
      </Stack>

      {/* Footer: User Profile */}
      <Box
        className={`border-t border-gray-200 shrink-0 ${isCollapsed ? "p-2 flex flex-col items-center gap-4" : "p-4"}`}
      >
        <Box
          className={`flex items-center rounded-lg px-2 py-1 ${isCollapsed ? "justify-center" : "justify-between"}`}
        >
          <Box className="flex items-center gap-3">
            <Avatar
              color="blue"
              radius="xl"
              size={isCollapsed ? "sm" : "md"}
              className="bg-[#1E3A8A]"
            >
              A
            </Avatar>

            {!isCollapsed && (
              <Box>
                <Text
                  size="sm"
                  fw={700}
                  className="text-gray-900 leading-tight"
                >
                  Administrator
                </Text>
                <Text
                  size="xs"
                  className="text-gray-500 uppercase tracking-wide font-medium mt-0.5"
                >
                  Administrator
                </Text>
              </Box>
            )}
          </Box>

          {!isCollapsed && (
            <ActionIcon variant="subtle" color="red">
              <IconLogout size={22} className="text-red-500" stroke={1.5} />
            </ActionIcon>
          )}
        </Box>

        {/* If collapsed, show logout icon below avatar */}
        {isCollapsed && (
          <ActionIcon variant="subtle" color="red" title="Logout">
            <IconLogout size={22} className="text-red-500" stroke={1.5} />
          </ActionIcon>
        )}
      </Box>
    </Box>
  );
}
