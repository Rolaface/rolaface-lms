import React from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { IconCalendarClock, IconMail, IconTimelineEvent, IconUserCog } from "@tabler/icons-react";
import {
  Box,
  Text,
  Stack,
  UnstyledButton,
  Avatar,
  ActionIcon,
  Tooltip,
} from "@mantine/core";
import {
  IconShieldCheck,
  IconLayoutDashboard,
  IconCash,
  IconFileText,
  IconUsers,
  IconSettings,
  IconMenu2,
  IconLogout, IconDiscount2,
  IconMoneybag,
  IconTool,
  IconChevronDown,
  IconBuildingBank,
  IconListDetails,
  IconReportAnalytics,
  IconCreditCard,
  IconFileInvoice,
  IconHome, IconHierarchy2,
  IconReceipt2,
  IconScale,
  IconChartBar,
  IconArrowsExchange,
  IconReceipt,
  IconBox,
  IconCoins,
} from "@tabler/icons-react";

import { usePermission } from "../hooks/Usepermission";
import type { LmsModule } from "../types/User/userRole";



interface NavItem {
  path?: string;
  label: string;
  icon: React.ComponentType<{
    size?: number;
    stroke?: number;
    style?: React.CSSProperties;
  }>;
  matchPrefix?: boolean;
  subItems?: NavItem[];
  modules?: LmsModule[];
}

const LOCAL_NAV_ITEMS: NavItem[] = [
  {
    path: "/",
    label: "Dashboard",
    icon: IconLayoutDashboard,
    matchPrefix: false,
  },
  {
    path: "/customer",
    label: "Customer",
    icon: IconUsers,
    matchPrefix: true,
    modules: ["Customer"],
  },
  {
    path: "/collateral",
    label: "Collateral",
    icon: IconBuildingBank,
    matchPrefix: true,
    subItems: [
      { path: "/collateral/type", label: "Collateral Type", icon: IconBox },
      { path: "/collateral/list", label: "Collateral", icon: IconCoins },
    ],
  },
  {
    path: "/setup",
    label: "Lending Setup",
    icon: IconSettings,
    matchPrefix: true,
    subItems: [
      { path: "/setup/category", label: "Loan Category", icon: IconListDetails },
      { path: "/setup/classification", label: "Loan Classification", icon: IconFileText },
      { path: "/setup/collection", label: "Collection Sequence", icon: IconListDetails },
      { path: "/setup/fees", label: "Fee and Charges", icon: IconReceipt },
      { path: "/setup/product", label: "Loan Product", icon: IconBuildingBank },
    ],
  },
  {
    path: "/origination",
    label: "Origination",
    icon: IconFileText,
    matchPrefix: true,
    subItems: [
      { path: "/origination/loanApplication", label: "Loan Application", icon: IconFileText },
    ],
  },
  {
    path: "/operations",
    label: "Lending Operations",
    icon: IconMoneybag,
    matchPrefix: true,
    subItems: [
      { path: "/operations/booking", label: "Loan Booking", icon: IconFileInvoice, modules: ["Loan"] },
      { path: "/operations/disbursement", label: "Loan Disbursement", icon: IconCreditCard, modules: ["Loan Disbursement"] },
      { path: "/operations/repayment", label: "Loan Repayment", icon: IconCash, modules: ["Loan Repayment"] },
      { path: "/operations/waiver", label: "Loan Waiver", icon: IconDiscount2 },
      { path: "/operations/capitalization", label: "Loan Capitalization", icon: IconFileText },
      { path: "/operations/restructure", label: "Loan Restructure", icon: IconSettings, modules: ["Loan Restructure"] },
      { path: "/operations/writeoff", label: "Loan Write-Off", icon: IconFileText },
      { path: "/operations/transfer", label: "Loan Transfer", icon: IconBuildingBank },
    ],
  },
  {
    path: "/accounting",
    label: "Accounting",
    icon: IconFileInvoice,
    matchPrefix: true,
    subItems: [
      {
        path: "/accounting/general-ledger",
        label: "General Ledger",
        icon: IconBuildingBank,
        subItems: [
          {
            path: "/accounting/general-ledger/chart-of-accounts",
            label: "Chart of Accounts",
            icon: IconHierarchy2,
          },
          {
            path: "/accounting/general-ledger/journal-entry",
            label: "Journal Entry",
            icon: IconReceipt2,
          },
          {
            path: "/accounting/general-ledger/report",
            label: "General Ledger Report",
            icon: IconFileText,
          },
        ],
      },
      {
        path: "/accounting/trial-balance",
        label: "Trial Balance",
        icon: IconScale,
      },
      {
        path: "/accounting/receivable",
        label: "Receivable",
        icon: IconUsers,
      },
      {
        path: "/accounting/payable",
        label: "Payable",
        icon: IconBuildingBank,
      },
      {
        path: "/accounting/profit-loss",
        label: "Profit & Loss",
        icon: IconChartBar,
      },
      {
        path: "/accounting/balance-sheet",
        label: "Balance Sheet",
        icon: IconReportAnalytics,
      },
      {
        path: "/accounting/cash-flow",
        label: "Cash Flow",
        icon: IconArrowsExchange,
      },
    ],
  },
  {
    path: "/reports",
    label: "Lending Reports",
    icon: IconReportAnalytics,
    matchPrefix: true,
    subItems: [
      { path: "/reports/statement", label: "Loan Statement", icon: IconFileText },
      { path: "/reports/arrears", label: "Arrear Reports", icon: IconReportAnalytics },
    ],
  },
  {
    path: "/settings",
    label: "Settings",
    icon: IconTool,
    matchPrefix: true,
    subItems: [
      {
        path: "/settings/user",
        label: "User",
        icon: IconUserCog,
        subItems: [
          { path: "/settings/user/management", label: "User Management", icon: IconUsers },
          { path: "/settings/user/roles", label: "Role Management", icon: IconShieldCheck },
        ],
      },
       {
        path: "/settings/emailTemplate",
        label: "Email Template",
        icon: IconMail,
      },
      {
        path: "/settings/scheduler",
        label: "Scheduler",
        icon: IconCalendarClock,
      },
    ], 
  },
];


function filterNavItems(
  items: NavItem[],
  canAccessAnyOf: (modules: LmsModule[]) => boolean
): NavItem[] {
  const result: NavItem[] = [];
  for (const item of items) {
    if (item.subItems && item.subItems.length > 0) {
      const filteredChildren = filterNavItems(item.subItems, canAccessAnyOf);
      if (filteredChildren.length > 0) {
        result.push({ ...item, subItems: filteredChildren });
      }
      continue;
    }
    const allowed = !item.modules || item.modules.length === 0 || canAccessAnyOf(item.modules);
    if (allowed) result.push(item);
  }
  return result;
}

const SIZES = {
  rootIcon: 19,
  subIcon: 16,
  subSubIcon: 15,
  rootText: 14.5,
  subText: 13.5,
  subSubText: 13,
  chevron: 15,
};



const tk = {
  textDefault: "var(--mantine-color-slate-6)",
  textMuted: "var(--mantine-color-slate-4)",
  textHeading: "var(--mantine-color-slate-8)",
  textActive: "var(--mantine-color-brand-7)",
  iconDefault: "var(--mantine-color-slate-5)",
  border: "var(--mantine-color-slate-2)",
  surface: "var(--mantine-color-white)",
  surfaceMuted: "var(--mantine-color-slate-0)",
  surfaceHover: "color-mix(in srgb, var(--mantine-color-brand-5) 6%, transparent)",
  activeBg:
    "linear-gradient(90deg, color-mix(in srgb, var(--mantine-color-brand-5) 12%, transparent), color-mix(in srgb, var(--mantine-color-brand-5) 4%, transparent))",
  activeBar: "linear-gradient(180deg, var(--mantine-color-brand-4), var(--mantine-color-brand-7))",
  activeIconBg: "var(--mantine-color-white)",
  activeIconShadow: "0 1px 2px color-mix(in srgb, var(--mantine-color-brand-8) 20%, transparent)",
  ring: "color-mix(in srgb, var(--mantine-color-brand-5) 35%, transparent)",
  logoGlow: "0 6px 16px color-mix(in srgb, var(--mantine-color-brand-6) 35%, transparent)",
  logoGradient: "linear-gradient(135deg, var(--mantine-color-brand-5), var(--mantine-color-brand-8))",
};


function Collapse({ open, children }: { open: boolean; children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateRows: open ? "1fr" : "0fr",
        transition: "grid-template-rows 240ms cubic-bezier(0.4, 0, 0.2, 1)",
      }}
    >
      <div style={{ overflow: "hidden", minHeight: 0 }}>{children}</div>
    </div>
  );
}

function Chevron({ open }: { open: boolean }) {
  return (
    <IconChevronDown
      size={SIZES.chevron}
      style={{
        color: open ? "var(--mantine-color-brand-6)" : tk.textMuted,
        transform: open ? "rotate(180deg)" : "rotate(0deg)",
        transition: "transform 220ms ease, color 150ms ease",
        flexShrink: 0,
      }}
    />
  );
}



function NavNode({
  item,
  depth,
  pathname,
  openMenus,
  toggleMenu,
}: {
  item: NavItem;
  depth: number;
  pathname: string;
  openMenus: Record<string, boolean>;
  toggleMenu: (key: string, depth: number) => void;
}) {
  const hasSubItems = !!item.subItems?.length;
  const menuKey = `${depth}-${item.label}`;
  const isOpen = openMenus[menuKey] === true;
  const Icon = item.icon;

  const isActive = item.path
    ? pathname === item.path || pathname.startsWith(item.path + "/")
    : hasSubItems
      ? item.subItems!.some((s) =>
        s.path
          ? pathname === s.path || pathname.startsWith(s.path + "/")
          : false
      )
      : false;

  const textSize = depth >= 2 ? SIZES.subSubText : SIZES.subText;
  const iconSize = depth >= 2 ? SIZES.subSubIcon : SIZES.subIcon;

  const rowStyle: React.CSSProperties = {
    fontSize: textSize,
    color: isActive || isOpen ? tk.textActive : tk.textDefault,
    fontWeight: isActive ? 600 : 500,
    borderRadius: "var(--mantine-radius-sm)",
    padding: "6px 8px",
    transition: "background-color 150ms ease, color 150ms ease, transform 150ms ease",
  };

  if (hasSubItems) {
    return (
      <Box className="w-full">
        <UnstyledButton
          onClick={() => toggleMenu(menuKey, depth)}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = tk.surfaceHover)}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
          className="flex w-full items-center justify-between"
          style={rowStyle}
        >
          <Box className="flex items-center gap-3">
            <Icon
              size={iconSize}
              stroke={1.6}
              style={{ color: isActive || isOpen ? "var(--mantine-color-brand-6)" : tk.iconDefault }}
            />
            <span>{item.label}</span>
          </Box>
          <Chevron open={isOpen} />
        </UnstyledButton>

        <Collapse open={isOpen}>
          <Box
            className="ml-[11px] mt-2 mb-1 flex flex-col gap-1 py-1 pl-5"
            style={{ borderLeft: `2px solid ${tk.border}` }}
          >
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
        </Collapse>
      </Box>
    );
  }

  return (
    <UnstyledButton
      component={Link}
      to={item.path}
      onMouseEnter={(e) => {
        if (!isActive) e.currentTarget.style.backgroundColor = tk.surfaceHover;
      }}
      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = isActive ? "transparent" : "transparent")}
      className="flex items-center gap-3"
      style={{ ...rowStyle, color: isActive ? tk.textActive : tk.textDefault }}
    >
      {isActive && (
        <span
          style={{
            width: 4,
            height: 4,
            borderRadius: 999,
            background: "var(--mantine-color-brand-6)",
            flexShrink: 0,
          }}
        />
      )}
      <Icon size={iconSize} stroke={1.6} style={{ color: isActive ? "var(--mantine-color-brand-6)" : tk.iconDefault }} />
      <span>{item.label}</span>
    </UnstyledButton>
  );
}

function getInitialOpenMenus(pathname: string): Record<string, boolean> {
  return {
    "0-Collateral": pathname.startsWith("/collateral"),
    "0-Lending Setup": pathname.startsWith("/setup"),
    "0-Origination": pathname.startsWith("/origination"),
    "0-Lending Operations": pathname.startsWith("/operations"),
    "0-Accounting": pathname.startsWith("/accounting"),
    "1-General Ledger": pathname.startsWith("/accounting/general-ledger"),
    "0-Lending Reports": pathname.startsWith("/reports"),
    "0-Settings": pathname.startsWith("/settings"),
    "1-User": pathname.startsWith("/settings/user"),
  };
}

export function Sidebar({
  isCollapsed,
  onToggle,
  onLogout,
}: {
  isCollapsed: boolean;
  onToggle: () => void;
  onLogout?: () => void;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [openMenus, setOpenMenus] = React.useState<Record<string, boolean>>(() =>
    getInitialOpenMenus(pathname)
  );

 const { canAccessAnyOf, isAdmin, permissions } = usePermission();
const visibleNavItems = React.useMemo(
  () => filterNavItems(LOCAL_NAV_ITEMS, canAccessAnyOf),
  [canAccessAnyOf, isAdmin, permissions]
);

  const toggleMenu = (key: string, depth: number) => {
    setOpenMenus((prev) => {
      const willOpen = !prev[key];
      const next: Record<string, boolean> = { ...prev };
      Object.keys(next).forEach((k) => {
        if (k.startsWith(`${depth}-`)) {
          next[k] = false;
        }
      });

      next[key] = willOpen;
      return next;
    });
  };

  return (
    <Box
      className="flex h-full flex-col overflow-hidden"
      style={{
        background: tk.surface,
        borderRight: `1px solid ${tk.border}`,
      }}
    >
      <style>{`
        .lms-nav-scroll::-webkit-scrollbar { width: 6px; }
        .lms-nav-scroll::-webkit-scrollbar-thumb {
          background: var(--mantine-color-slate-3);
          border-radius: 999px;
        }
        .lms-nav-scroll::-webkit-scrollbar-thumb:hover {
          background: var(--mantine-color-slate-4);
        }
        .lms-nav-scroll { scrollbar-width: thin; scrollbar-color: var(--mantine-color-slate-3) transparent; }
        .lms-focusable:focus-visible {
          outline: 2px solid var(--mantine-color-brand-5);
          outline-offset: 2px;
        }
      `}</style>

      {/* Header: Logo, Company Name & Toggle */}
      <Box
        className={`flex items-center py-5 ${isCollapsed ? "px-4 justify-center flex-col gap-4" : "px-5 gap-3"}`}
        style={{ borderBottom: `1px solid ${tk.border}` }}
      >
        <Box
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
          style={{ background: tk.logoGradient, boxShadow: tk.logoGlow }}
        >
          <IconShieldCheck size={24} stroke={2} color="var(--mantine-color-white)" />
        </Box>

        {!isCollapsed && (
          <Box className="flex-1 min-w-0">
            <Text fw={700} size="md" style={{ color: tk.textHeading, letterSpacing: "0.01em" }}>
              LMS
            </Text>
          </Box>
        )}

        <Tooltip label="Switch workspace" position="bottom" disabled={isCollapsed}>
          <ActionIcon
            variant="subtle"
            radius="md"
            className="lms-focusable shrink-0"
            onClick={() => {
              window.location.href = `${import.meta.env.VITE_ERP_URL}/select-app`;
            }}
            style={{ color: tk.iconDefault }}
          >
            <IconHome size={18} />
          </ActionIcon>
        </Tooltip>

        {!isCollapsed && (
          <ActionIcon
            variant="subtle"
            radius="md"
            className="lms-focusable shrink-0"
            onClick={onToggle}
            style={{ color: tk.iconDefault }}
          >
            <IconMenu2 size={19} />
          </ActionIcon>
        )}
      </Box>

      {isCollapsed && (
        <Box className="flex justify-center pt-3">
          <ActionIcon variant="subtle" radius="md" onClick={onToggle} style={{ color: tk.iconDefault }}>
            <IconMenu2 size={19} />
          </ActionIcon>
        </Box>
      )}

      {/* Navigation */}
      <Stack
        gap={4}
        className={`lms-nav-scroll flex-1 py-4 overflow-y-auto ${isCollapsed ? "px-3 items-center" : "px-4"}`}
      >
        {visibleNavItems.map((item) => {
          const isRootActive = item.matchPrefix
            ? (pathname.startsWith(item.path!) && item.path !== "/") || pathname === item.path
            : pathname === item.path;

          const ItemIcon = item.icon;
          const hasSubItems = !!item.subItems?.length;
          const menuKey = `0-${item.label}`;
          const isOpen = openMenus[menuKey] === true;
          const highlighted = isRootActive || (isOpen && hasSubItems && !isCollapsed);

          const button = (
            <UnstyledButton
              {...(hasSubItems && !isCollapsed
                ? { component: "button" as any }
                : { component: Link, to: item.path })}
              onClick={(e: React.MouseEvent) => {
                if (hasSubItems && !isCollapsed) {
                  e.preventDefault();
                  toggleMenu(menuKey, 0);
                }
              }}
              className={`lms-focusable relative flex w-full items-center justify-between overflow-hidden ${isCollapsed ? "justify-center" : ""}`}
              style={{
                fontSize: SIZES.rootText,
                fontWeight: isRootActive ? 700 : 600,
                color: highlighted ? tk.textActive : tk.textDefault,
                background: isRootActive ? tk.activeBg : "transparent",
                borderRadius: "var(--mantine-radius-md)",
                padding: isCollapsed ? "10px" : "9px 10px",
                transition: "background-color 150ms ease, color 150ms ease",
              }}
              onMouseEnter={(e) => {
                if (!isRootActive) e.currentTarget.style.backgroundColor = tk.surfaceHover;
              }}
              onMouseLeave={(e) => {
                if (!isRootActive) e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              {isRootActive && (
                <span
                  style={{
                    position: "absolute",
                    left: 0,
                    top: "14%",
                    bottom: "14%",
                    width: 3,
                    borderRadius: 999,
                    background: tk.activeBar,
                  }}
                />
              )}

              <Box className={`flex items-center ${isCollapsed ? "justify-center" : "gap-3"}`}>
                <Box
                  className="flex items-center justify-center shrink-0"
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: "var(--mantine-radius-sm)",
                    background: isRootActive ? tk.activeIconBg : "transparent",
                    boxShadow: isRootActive ? tk.activeIconShadow : "none",
                    transition: "background-color 150ms ease, box-shadow 150ms ease",
                  }}
                >
                  <ItemIcon
                    size={SIZES.rootIcon}
                    stroke={1.7}
                    style={{ color: highlighted ? "var(--mantine-color-brand-6)" : tk.iconDefault }}
                  />
                </Box>
                {!isCollapsed && <span>{item.label}</span>}
              </Box>

              {!isCollapsed && hasSubItems && <Chevron open={isOpen} />}
            </UnstyledButton>
          );

          return (
            <Box key={item.label} className="w-full">
              {isCollapsed ? (
                <Tooltip label={item.label} position="right" offset={12}>
                  {button}
                </Tooltip>
              ) : (
                button
              )}

              {hasSubItems && !isCollapsed && (
                <Collapse open={isOpen}>
                  <Box
                    className="ml-[26px] mt-1.5 mb-1 flex flex-col gap-1 py-1 pl-5"
                    style={{ borderLeft: `2px solid ${tk.border}` }}
                  >
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
                </Collapse>
              )}
            </Box>
          );
        })}
      </Stack>

      {/* Footer: User Profile */}
      <Box
        className={`shrink-0 ${isCollapsed ? "p-3 flex flex-col items-center gap-3" : "p-3"}`}
        style={{ borderTop: `1px solid ${tk.border}` }}
      >
        <Box
          className={`flex items-center rounded-lg px-2 py-2 ${isCollapsed ? "justify-center" : "justify-between gap-2"}`}
          style={{ transition: "background-color 150ms ease" }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = tk.surfaceMuted)}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
        >
          <Box className="flex items-center gap-3 min-w-0">
            <Box
              className="flex items-center justify-center shrink-0"
              style={{
                width: isCollapsed ? 34 : 38,
                height: isCollapsed ? 34 : 38,
                borderRadius: 999,
                padding: 2,
                background: `linear-gradient(135deg, var(--mantine-color-brand-4), var(--mantine-color-brand-7))`,
              }}
            >
              <Avatar color="brand" radius="xl" size={isCollapsed ? "sm" : "md"} style={{ border: `2px solid ${tk.surface}` }}>
                A
              </Avatar>
            </Box>

            {!isCollapsed && (
              <Box className="min-w-0">
                <Text size="sm" fw={700} style={{ color: tk.textHeading, lineHeight: 1.2 }} truncate>
                  Administrator
                </Text>
                <Text size="xs" style={{ color: tk.textMuted, letterSpacing: "0.03em", marginTop: 2 }}>
                  ADMINISTRATOR
                </Text>
              </Box>
            )}
          </Box>

          {!isCollapsed && (
            <Tooltip label="Sign out">
              <ActionIcon
                variant="subtle"
                radius="md"
                className="lms-focusable shrink-0"
                onClick={onLogout}
                style={{ color: tk.iconDefault }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--mantine-color-danger-6)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = tk.iconDefault)}
              >
                <IconLogout size={17} />
              </ActionIcon>
            </Tooltip>
          )}
        </Box>
      </Box>
    </Box>
  );
}