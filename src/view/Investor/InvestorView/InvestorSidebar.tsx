/* Left sidebar of the Investor 360 view: investor identity, Overview, Investments, Statement and Profile. */
import { useState, type ReactNode } from "react";
import { ActionIcon, Avatar, Box, Progress, ScrollArea, Text, TextInput, Tooltip } from "@mantine/core";
import {
  IconArrowLeft,
  IconChartPie,
  IconChevronLeft,
  IconChevronRight,
  IconFileInvoice,
  IconReportMoney,
  IconSearch,
  IconUser,
} from "@tabler/icons-react";
import type { InvestorPortfolio } from "../../../types/Investor/investorFlow";
import { themeTokens } from "../../LoanAccount/LoanView/SharedUI";
import { StatusBadge } from "./ui";
import { initialsOf, useMoney, type InvestorViewSelection } from "./format";

interface Props {
  portfolio: InvestorPortfolio;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  onBack: () => void;
  selected: InvestorViewSelection;
  onSelect: (selection: InvestorViewSelection) => void;
}

function NavButton({
  icon,
  label,
  hint,
  active,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  hint: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-all"
      style={
        active
          ? { backgroundColor: themeTokens.primarySoft, color: themeTokens.primary }
          : { backgroundColor: "var(--mantine-color-white)", color: "var(--mantine-color-slate-6)" }
      }
    >
      {icon}
      <div className="flex-1 min-w-0">
        <Text fz={11} fw={700}>
          {label}
        </Text>
        <Text fz={9} c="dimmed" truncate>
          {hint}
        </Text>
      </div>
    </button>
  );
}

export function InvestorSidebar({ portfolio, collapsed, onToggleCollapsed, onBack, selected, onSelect }: Props) {
  const money = useMoney();
  const [search, setSearch] = useState("");
  const { investor, investments } = portfolio;
  const q = search.trim().toLowerCase();
  const shown = q
    ? investments.filter(
        (i) => i.name.toLowerCase().includes(q) || i.investment_product_name.toLowerCase().includes(q),
      )
    : investments;

  const avatar = (size: number) => (
    <Avatar
      radius="xl"
      size={size}
      style={{
        background: `linear-gradient(135deg, ${themeTokens.primary}, ${themeTokens.info})`,
        color: "var(--mantine-color-white)",
        fontSize: size > 34 ? 13 : 11,
        fontWeight: 700,
      }}
    >
      {initialsOf(investor.name)}
    </Avatar>
  );

  if (collapsed) {
    const iconButton = (label: string, active: boolean, icon: ReactNode, onClick: () => void) => (
      <Tooltip label={label} position="right" withArrow>
        <ActionIcon
          variant={active ? "light" : "subtle"}
          color={active ? "brand" : "gray"}
          radius="md"
          size={38}
          onClick={onClick}
        >
          {icon}
        </ActionIcon>
      </Tooltip>
    );
    return (
      <div className="flex flex-col items-center w-14 shrink-0 h-screen sticky top-0 border-r border-[var(--mantine-color-slate-2)] bg-white py-3 gap-1">
        <ActionIcon variant="subtle" color="gray" radius="xl" size={34} onClick={onToggleCollapsed} className="mb-2">
          <IconChevronRight size={17} />
        </ActionIcon>
        <Box mb={8}>{avatar(32)}</Box>
        {iconButton("Overview", selected.type === "overview", <IconChartPie size={16} />, () =>
          onSelect({ type: "overview" }),
        )}
        {iconButton(
          `Investments (${investments.length})`,
          selected.type === "investment",
          <IconReportMoney size={16} />,
          () => investments[0] && onSelect({ type: "investment", id: investments[0].name }),
        )}
        {iconButton("Statement", selected.type === "statement", <IconFileInvoice size={16} />, () =>
          onSelect({ type: "statement" }),
        )}
        {iconButton("Profile", selected.type === "profile", <IconUser size={16} />, () =>
          onSelect({ type: "profile" }),
        )}
        <div className="flex-1" />
        <ActionIcon variant="subtle" color="gray" radius="xl" size={32} onClick={onBack}>
          <IconArrowLeft size={14} />
        </ActionIcon>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full lg:w-64 shrink-0 h-screen sticky top-0 border-r border-[var(--mantine-color-slate-2)] bg-white">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-[var(--mantine-color-slate-1)]">
        <ActionIcon variant="subtle" color="slate" size="sm" onClick={onBack}>
          <IconArrowLeft size={14} />
        </ActionIcon>
        <Text fz={11} fw={600} c="slate.5">
          Investments
        </Text>
        <ActionIcon variant="subtle" color="slate" size="sm" className="ml-auto" onClick={onToggleCollapsed}>
          <IconChevronLeft size={14} />
        </ActionIcon>
      </div>

      {/* Investor identity */}
      <div className="px-3 py-3 border-b border-[var(--mantine-color-slate-1)]">
        <div className="flex items-center gap-2.5">
          {avatar(38)}
          <div className="min-w-0">
            <Text fz="xs" fw={700} c="slate.9" truncate>
              {investor.name}
            </Text>
            <Text fz={10} c="dimmed" truncate>
              {investor.id}
            </Text>
          </div>
        </div>
        <Box mt={8}>
          <StatusBadge status={investor.status} size="xs" />
        </Box>
        <div className="mt-2.5 pt-2 border-t border-[var(--mantine-color-slate-1)]">
          <div className="flex justify-between items-center">
            <Text fz={10} c="dimmed">
              Mobile
            </Text>
            <Text fz={10} fw={600} c="slate.7" className="font-mono">
              {investor.mobile || "-"}
            </Text>
          </div>
          <div className="flex justify-between items-center mt-1 gap-2">
            <Text fz={10} c="dimmed">
              Email
            </Text>
            <Text fz={10} fw={600} c="slate.7" truncate>
              {investor.email || "-"}
            </Text>
          </div>
        </div>
      </div>

      <div className="px-2 py-2 flex flex-col gap-1 border-b border-[var(--mantine-color-slate-1)]">
        <NavButton
          icon={<IconChartPie size={14} />}
          label="Overview"
          hint="All investments at a glance"
          active={selected.type === "overview"}
          onClick={() => onSelect({ type: "overview" })}
        />
        <NavButton
          icon={<IconFileInvoice size={14} />}
          label="Statement"
          hint="Money in and money back"
          active={selected.type === "statement"}
          onClick={() => onSelect({ type: "statement" })}
        />
        <NavButton
          icon={<IconUser size={14} />}
          label="Profile"
          hint="Investor information"
          active={selected.type === "profile"}
          onClick={() => onSelect({ type: "profile" })}
        />
      </div>

      {/* Investments (contracts) */}
      <div className="px-3 pt-3 pb-2 flex items-center gap-2">
        <IconReportMoney size={13} color={themeTokens.primary} />
        <Text fz={10} fw={700} className="tracking-wide">
          INVESTMENTS
        </Text>
        <Text fz={10} fw={700} c="info.6" className="ml-auto">
          {investments.length}
        </Text>
      </div>
      <div className="px-3 pb-2">
        <TextInput
          size="xs"
          radius="md"
          placeholder="Search investment..."
          leftSection={<IconSearch size={12} />}
          value={search}
          onChange={(e) => setSearch(e.currentTarget.value)}
        />
      </div>
      <ScrollArea className="flex-1" type="hover" scrollbarSize={5} offsetScrollbars>
        <div className="px-2 pb-3 flex flex-col gap-1.5">
          {shown.map((inv) => {
            const active = selected.type === "investment" && selected.id === inv.name;
            const progress = inv.payouts_total ? (inv.payouts_done / inv.payouts_total) * 100 : 0;
            return (
              <button
                key={inv.name}
                type="button"
                onClick={() => onSelect({ type: "investment", id: inv.name })}
                className="w-full rounded-lg px-2.5 py-2 text-left transition-all"
                style={{
                  backgroundColor: active ? themeTokens.primarySoft : "var(--mantine-color-white)",
                  border: `1px solid ${active ? "var(--mantine-color-brand-2)" : "var(--mantine-color-slate-1)"}`,
                }}
              >
                <div className="flex items-center justify-between gap-2">
                  <Text fz={11} fw={700} c={active ? "brand.7" : "slate.8"} truncate>
                    {inv.name}
                  </Text>
                  <StatusBadge status={inv.status} size="xs" />
                </div>
                <Text fz={10} c="dimmed" truncate>
                  {inv.investment_product_name}
                </Text>
                <div className="flex items-center justify-between mt-1">
                  <Text fz={10} fw={600} c="slate.7">
                    {money(inv.investment_amount)}
                  </Text>
                  <Text fz={9} c="dimmed">
                    {inv.payouts_done}/{inv.payouts_total} payouts
                  </Text>
                </div>
                <Progress value={progress} size={3} radius="xl" color="success" mt={4} />
              </button>
            );
          })}
          {shown.length === 0 && (
            <Text fz="xs" c="dimmed" ta="center" py="sm">
              No investments found.
            </Text>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
