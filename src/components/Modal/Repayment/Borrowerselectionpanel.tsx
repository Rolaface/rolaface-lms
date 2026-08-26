import {
  ActionIcon,
  Anchor,
  Badge,
  ScrollArea,
  Text,
  TextInput,
  Tooltip,
  UnstyledButton,
  useMantineTheme,
} from "@mantine/core";
import { IconBuildingBank, IconChevronLeft, IconChevronRight, IconSearch, IconUserSearch } from "@tabler/icons-react";
import type { Borrower, LoanAccount } from "../../../types/loanRepayment";
import { formatCurrency } from "../../../utils/Loanrepaymentutils";

interface BorrowerSelectionPanelProps {
  collapsed: boolean;
  onToggleCollapse: (collapsed: boolean) => void;
  search: string;
  onSearchChange: (value: string) => void;
  isSearching: boolean;
  matches: Borrower[];
  selectedBorrower: Borrower | null;
  selectedLoanId: string | null;
  onSelectBorrower: (borrower: Borrower) => void;
  onClearBorrower: () => void;
  onSelectLoan: (loan: LoanAccount) => void;
  isView?: boolean;
}

export function BorrowerSelectionPanel({
  collapsed,
  onToggleCollapse,
  search,
  onSearchChange,
  isSearching,
  matches,
  selectedBorrower,
  selectedLoanId,
  onSelectBorrower,
  onClearBorrower,
  onSelectLoan,
  isView,
}: BorrowerSelectionPanelProps) {
  const theme = useMantineTheme();

  // Collapsed rail — unchanged behaviour, just isolated into its own return.
  if (collapsed) {
    return (
      <div className="shrink-0 w-14 p-3" style={{ borderRight: "1px solid var(--mantine-color-slate-2)" }}>
        <div className="flex flex-col items-center gap-4">
          <Tooltip label="Expand borrower selection" withArrow position="right">
            <ActionIcon variant="light" color="brand" size="md" onClick={() => onToggleCollapse(false)}>
              <IconChevronRight size={16} />
            </ActionIcon>
          </Tooltip>
          {selectedBorrower && (
            <Tooltip label={selectedBorrower.name} withArrow position="right">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{
                  background: "var(--mantine-color-brand-0)",
                  border: "1px solid var(--mantine-color-brand-2)",
                }}
              >
                <Text size="xs" fw={700} c="brand.6">
                  {selectedBorrower.name
                    .split(" ")
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join("")}
                </Text>
              </div>
            </Tooltip>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="shrink-0 w-[300px] flex flex-col min-h-0" style={{ borderRight: "1px solid var(--mantine-color-slate-2)" }}>
      <div className="p-5 pb-4">
        <div className="flex items-center justify-between mb-0.5">
          <div className="flex items-center gap-2">
            <div className="w-1 h-4 rounded" style={{ background: theme.other.accentBarGradient }} />
            <IconUserSearch size={15} style={{ color: "var(--mantine-color-brand-6)" }} />
            <Text size="sm" fw={700} c="slate.8">
              Borrower Selection
            </Text>
          </div>
          {selectedBorrower && (
            <Tooltip label="Collapse" withArrow position="left">
              <ActionIcon variant="subtle" color="slate" size="sm" onClick={() => onToggleCollapse(true)}>
                <IconChevronLeft size={14} />
              </ActionIcon>
            </Tooltip>
          )}
        </div>
        <Text size="xs" c="dimmed" className="ml-5 mb-4">
          Search by A/C no, phone or name
        </Text>

        {!selectedBorrower && !isView && (
          <TextInput
            size="sm"
            placeholder="Search by loan A/C, applicant or phone"
            value={search}
            disabled={isView}
            onChange={(e) => onSearchChange(e.currentTarget.value)}
            leftSection={<IconSearch size={14} style={{ color: "var(--mantine-color-slate-4)" }} />}
          />
        )}
      </div>

      <ScrollArea className="flex-1 px-5 pb-5" scrollbarSize={6} type="hover">
        {selectedBorrower ? (
          <div>
            <div className="flex items-center justify-between mb-2">
              <Text size="xs" fw={600} c="dimmed" className="uppercase tracking-wide">
                Selected Borrower
              </Text>
              {!isView && (
                <Anchor
                  component="button"
                  type="button"
                  onClick={onClearBorrower}
                  size="xs"
                  fw={700}
                  c="brand.6"
                  underline="never"
                  styles={{ root: { "&:hover": { color: "var(--mantine-color-brand-7)" } } }}
                >
                  Change
                </Anchor>
              )}
            </div>
            <div
              className="text-left rounded-md"
              style={{
                border: "1px solid var(--mantine-color-brand-3)",
                background: "var(--mantine-color-brand-0)",
                paddingTop: "1rem",
                paddingBottom: "1rem",
                paddingLeft: "1.25rem",
                paddingRight: "1rem",
              }}
            >
              <div className="flex items-center justify-between">
                <Text size="sm" fw={700} c="slate.8">
                  {selectedBorrower.name}
                </Text>
                <Badge
                  size="sm"
                  variant="light"
                  color={selectedBorrower.status === "Overdue" ? "danger" : "success"}
                  styles={{ root: { fontSize: 10 } }}
                >
                  {selectedBorrower.status}
                </Badge>
              </div>
              <Text size="xs" c="dimmed" className="mt-0.5">
                CIF: {selectedBorrower.cif} | {selectedBorrower.phone}
              </Text>
            </div>
          </div>
        ) : (
          search.trim() && (
            <div className="flex flex-col gap-2">
              {isSearching ? (
                <Text size="xs" c="dimmed" className="py-2">
                  Searching...
                </Text>
              ) : matches.length === 0 ? (
                <Text size="xs" c="dimmed" className="py-2">
                  No borrowers found.
                </Text>
              ) : (
                matches.map((borrower) => (
                  <UnstyledButton
                    key={borrower.cif}
                    type="button"
                    onClick={() => onSelectBorrower(borrower)}
                    className="text-left rounded-md transition-colors w-full"
                    style={{
                      border: "1px solid var(--mantine-color-slate-2)",
                      paddingTop: "1rem",
                      paddingBottom: "1rem",
                      paddingLeft: "1.25rem",
                      paddingRight: "1rem",
                    }}
                    styles={{ root: { "&:hover": { backgroundColor: "var(--mantine-color-slate-1)" } } }}
                  >
                    <div className="flex items-center justify-between">
                      <Text size="sm" fw={700} c="slate.8">
                        {borrower.name}
                      </Text>
                      <Badge
                        size="sm"
                        variant="light"
                        color={borrower.status === "Overdue" ? "danger" : "success"}
                        styles={{ root: { fontSize: 10 } }}
                      >
                        {borrower.status}
                      </Badge>
                    </div>
                    <Text size="xs" c="dimmed" className="mt-0.5">
                      CIF: {borrower.cif} | {borrower.phone}
                    </Text>
                  </UnstyledButton>
                ))
              )}
            </div>
          )
        )}

        {selectedBorrower && (
          <div className="mt-5">
            <div className="flex items-center gap-1.5 mb-2">
              <IconBuildingBank size={13} style={{ color: "var(--mantine-color-slate-4)" }} />
              <Text size="xs" fw={600} c="dimmed" className="uppercase tracking-wide">
                Select Active Loan Account
              </Text>
            </div>
            <div className="flex flex-col gap-2">
              {selectedBorrower.loans.map((loan) => {
                const isSelected = selectedLoanId === loan.id;
                return (
                  <UnstyledButton
                    key={loan.id}
                    type="button"
                    disabled={isView}
                    onClick={() => onSelectLoan(loan)}
                    className={`text-left rounded-md transition-colors w-full ${isView ? "cursor-default opacity-80" : ""
                      }`}
                    style={{
                      border: isSelected
                        ? "1px solid var(--mantine-color-brand-4)"
                        : "1px solid var(--mantine-color-slate-2)",
                      background: isSelected ? "var(--mantine-color-brand-0)" : "var(--mantine-color-white)",
                      boxShadow: isSelected ? "0 0 0 1px var(--mantine-color-brand-2)" : "none",
                      paddingTop: "1rem",
                      paddingBottom: "1rem",
                      paddingLeft: "1.25rem",
                      paddingRight: "1rem",
                    }}
                    styles={{
                      root: {
                        "&:hover": !isSelected ? { backgroundColor: "var(--mantine-color-slate-1)" } : undefined,
                      },
                    }}
                  >
                    <Text size="sm" fw={700} c="slate.8">
                      {loan.type} - {loan.id}
                    </Text>
                    <Text size="xs" c="dimmed" className="mt-0.5">
                      Balance: {formatCurrency(loan.balance)} | EMI Date: {loan.emiDate}
                    </Text>
                  </UnstyledButton>
                );
              })}
            </div>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
