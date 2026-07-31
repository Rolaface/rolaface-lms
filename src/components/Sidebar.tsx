import React, { useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  Box,
  Text,
  Stack,
  UnstyledButton,
  Avatar,
  ActionIcon,
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
  IconFileInvoice,
  IconHierarchy2,
  IconReceipt2,
  IconBookmarks,
  IconCreditCardRefund,
  IconCreditCardPay,
  IconChartLine,
  IconScale,
} from "@tabler/icons-react";

/* ───────────────── Nav item types (recursive) ───────────────── */

interface NavItem {
  path?: string; // omit for a group that only holds children (e.g. "General Ledger")
  label: string;
  icon: React.ComponentType<{
    size?: number;
    stroke?: number;
    className?: string;
  }>;
  matchPrefix?: boolean;
  subItems?: NavItem[];
}

// Updated Navigation Items with Submenus
const LOCAL_NAV_ITEMS: NavItem[] = [
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
      {
        path: "/setup/collection",
        label: "Collection Order",
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
      { path: "/operations/waiver", label: "Loan Waiver", icon: IconFileText },
      {
        path: "/operations/capitalization",
        label: "Loan Capitalization",
        icon: IconFileText,
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
    path: "/accounting",
    label: "Accounting",
    icon: IconFileInvoice,
    matchPrefix: true,
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
  rootIcon: 22,
  subIcon: 18,
  subSubIcon: 16,
  rootText: 15,
  subText: 14,
  subSubText: 13,
  chevron: 16,
  logoIcon: 28,
  avatarLetter: "md",
};

/* ───────────────── Recursive submenu node ───────────────── */
/* Handles both a leaf link (has `path`, no `subItems`) and a group
   (has `subItems`, with or without its own `path`) at any nesting depth. */

function NavNode({
  item,
  depth,
  pathname,
  openMenus,
  toggleMenu,
}: {
  item: NavItem;
  depth: number; // 1 = first-level submenu item, 2 = nested group, ...
  pathname: string;
  openMenus: Record<string, boolean>;
  toggleMenu: (key: string) => void;
}) {
  const hasSubItems = !!item.subItems?.length;
  const menuKey = `${depth}-${item.label}`;
  const isOpen = openMenus[menuKey] === true;
  const Icon = item.icon;

  const isActive = item.path
    ? pathname === item.path
    : hasSubItems
      ? item.subItems!.some((s) => (s.path ? pathname === s.path : false))
      : false;

  const textSize = depth >= 2 ? SIZES.subSubText : SIZES.subText;
  const iconSize = depth >= 2 ? SIZES.subSubIcon : SIZES.subIcon;

  if (hasSubItems) {
    // Group node — no path (or a path that's just a section landing page),
    // renders a toggle button + nested children.
    return (
      <Box className="w-full">
        <UnstyledButton
          onClick={() => toggleMenu(menuKey)}
          className={`flex w-full items-center justify-between font-medium transition-colors ${
            isActive || isOpen
              ? "text-[#1E40AF]"
              : "text-gray-600 hover:text-[#1E40AF]"
          }`}
          style={{ fontSize: textSize }}
        >
          <Box className="flex items-center gap-3">
            <Icon
              size={iconSize}
              stroke={1.5}
              className={
                isActive || isOpen ? "text-[#1E40AF]" : "text-gray-500"
              }
            />
            <span>{item.label}</span>
          </Box>
          {isOpen ? (
            <IconChevronUp size={SIZES.chevron} className="text-[#1E40AF]" />
          ) : (
            <IconChevronDown size={SIZES.chevron} className="text-gray-400" />
          )}
        </UnstyledButton>

        {isOpen && (
          <Box className="ml-[11px] mt-2 mb-2 flex flex-col gap-3 border-l-2 border-gray-200 py-1 pl-6">
            {item.subItems!.map((sub) => (
              <NavNode
                key={sub.label}
                item={sub}
                depth={depth + 1}
                pathname={pathname}
                openMenus={openMenus}
                toggleMenu={toggleMenu}
              />
            ))}
          </Box>
        )}
      </Box>
    );
  }

  // Leaf node — a real route link
  return (
    <UnstyledButton
      component={Link}
      to={item.path}
      className={`flex items-center gap-3 font-medium transition-colors ${
        isActive ? "text-[#1E40AF]" : "text-gray-600 hover:text-[#1E40AF]"
      }`}
      style={{ fontSize: textSize }}
    >
      <Icon
        size={iconSize}
        stroke={1.5}
        className={isActive ? "text-[#1E40AF]" : "text-gray-500"}
      />
      <span>{item.label}</span>
    </UnstyledButton>
  );
}

export function Sidebar({
  isCollapsed,
  onToggle,
}: {
  isCollapsed: boolean;
  onToggle: () => void;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  // Keyed by `${depth}-${label}` so labels can repeat across sections/depths
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});

  const toggleMenu = (key: string) => {
    setOpenMenus((prev) => ({ ...prev, [key]: !prev[key] }));
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
            ? (pathname.startsWith(item.path!) && item.path !== "/") ||
              pathname === item.path
            : pathname === item.path;

          const ItemIcon = item.icon;
          const hasSubItems = !!item.subItems?.length;
          const menuKey = `0-${item.label}`;
          const isOpen = openMenus[menuKey] === true;

          return (
            <Box key={item.label} className="w-full">
              <UnstyledButton
                {...(hasSubItems && !isCollapsed
                  ? { component: "button" as any }
                  : { component: Link, to: item.path })}
                onClick={(e: React.MouseEvent) => {
                  if (hasSubItems && !isCollapsed) {
                    e.preventDefault();
                    toggleMenu(menuKey);
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

              {/* First-level submenu — each entry may itself be a group (e.g. "General Ledger") */}
              {hasSubItems && !isCollapsed && isOpen && (
                <Box className="ml-[11px] mt-2 mb-2 flex flex-col gap-3 border-l-2 border-gray-200 py-1 pl-6">
                  {item.subItems!.map((sub) => (
                    <NavNode
                      key={sub.label}
                      item={sub}
                      depth={1}
                      pathname={pathname}
                      openMenus={openMenus}
                      toggleMenu={toggleMenu}
                    />
                  ))}
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

        {isCollapsed && (
          <ActionIcon variant="subtle" color="red" title="Logout">
            <IconLogout size={22} className="text-red-500" stroke={1.5} />
          </ActionIcon>
        )}
      </Box>
    </Box>
  );
}
