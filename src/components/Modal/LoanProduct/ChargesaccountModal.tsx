import { Box, Text, Button, Modal, ActionIcon, Select } from "@mantine/core";
import {
  IconX, IconChevronDown, IconReceipt2, IconWallet,
  IconClipboardCheck, IconClipboardList, IconStack2,
} from "@tabler/icons-react";

import { IconChip } from "./IconChips";
import { theme, fieldLabelProps } from "./Constants";
import type { ChargeRow } from "./ChargesTab";

interface ChargeAccountsModalProps {
  accountsModalIndex: number | null;
  setAccountsModalIndex: (index: number | null) => void;
  charges: ChargeRow[];
  handleUpdateCharge: (index: number, field: keyof ChargeRow, value: string) => void;
  isViewMode?: boolean;
  incomeAccounts: string[];
  principalAccounts: string[];
  writeOffAccounts: string[];
}

export function ChargeAccountsModal({
  accountsModalIndex, setAccountsModalIndex, charges, handleUpdateCharge, isViewMode,
  incomeAccounts, principalAccounts, writeOffAccounts,
}: ChargeAccountsModalProps) {
  if (accountsModalIndex === null) return null;
  const charge = charges[accountsModalIndex];
  if (!charge) return null;

  const update = (field: keyof ChargeRow, value: string) => handleUpdateCharge(accountsModalIndex, field, value);

  return (
    <Modal
      opened={accountsModalIndex !== null}
      onClose={() => setAccountsModalIndex(null)}
      size="50%" withCloseButton={false} padding={0} radius="lg" centered
      overlayProps={{ backgroundOpacity: 0.5, blur: 3 }}
      styles={{
        content: { display: "flex", flexDirection: "column", maxHeight: "80vh", overflow: "hidden" },
        header: { display: "none", padding: 0, margin: 0, minHeight: 0 },
        body: { flex: 1, display: "flex", flexDirection: "column", padding: 0, minHeight: 0, overflow: "hidden" },
      }}
    >
      <Box className="flex justify-between items-center px-6 py-4 shrink-0 bg-white border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: `linear-gradient(135deg, ${theme.brand[5]}, ${theme.brand[7]})` }}>
            <IconReceipt2 size={16} className="text-white" />
          </div>
          <div>
            <Text size="sm" fw={800} className="text-slate-900 leading-tight">Editing accounts for: {charge.type || "Untitled charge"}</Text>
            <Text size="xs" className="text-slate-400 mt-0.5">Row #{accountsModalIndex + 1} · {charge.basedOn === "Percentage" ? `${charge.percentage || "0"}%` : charge.amount || "0"}</Text>
          </div>
        </div>
        <ActionIcon type="button" variant="light" color="gray" radius="xl" size="lg" onClick={() => setAccountsModalIndex(null)} aria-label="Close" className="hover:bg-slate-100">
          <IconX size={16} />
        </ActionIcon>
      </Box>

      <div className="flex-1 min-h-0 overflow-y-auto p-6 bg-[#F7F8FB]" style={{ flex: "1 1 0%", minHeight: 0, overflowY: "auto" }}>
        <fieldset disabled={isViewMode} className="border-0 p-0 m-0">
          <div className="rounded-xl border p-5 bg-white" style={{ borderColor: theme.brand[1] }}>
            <div className="flex items-center gap-2 mb-4">
              <IconWallet size={16} style={{ color: theme.brand[6] }} />
              <Text size="xs" fw={700} className="uppercase tracking-wide" style={{ color: theme.brand[6] }}>Charge Accounts</Text>
            </div>
            <div className="grid grid-cols-2 gap-x-5 gap-y-4">
              <Select size="xs" searchable label="Income Account" placeholder="Select income account" data={incomeAccounts} value={charge.incomeAccount} onChange={(v) => update("incomeAccount", v || "")} rightSection={<IconChevronDown size={13} className="text-slate-400" />} leftSection={<IconChip icon={IconWallet} color="gold" />} leftSectionWidth={44} classNames={{ label: fieldLabelProps.label, input: `${fieldLabelProps.input} !pl-[50px]` }} />
              <Select size="xs" searchable label="Receivable Account" placeholder="Select receivable account" data={principalAccounts} value={charge.receivableAccount} onChange={(v) => update("receivableAccount", v || "")} rightSection={<IconChevronDown size={13} className="text-slate-400" />} leftSection={<IconChip icon={IconReceipt2} color="brand" />} leftSectionWidth={44} classNames={{ label: fieldLabelProps.label, input: `${fieldLabelProps.input} !pl-[50px]` }} />
              <Select size="xs" searchable label="Waiver Account" placeholder="Select waiver account" data={principalAccounts} value={charge.waiverAccount} onChange={(v) => update("waiverAccount", v || "")} rightSection={<IconChevronDown size={13} className="text-slate-400" />} leftSection={<IconChip icon={IconClipboardCheck} color="indigoAlt" />} leftSectionWidth={44} classNames={{ label: fieldLabelProps.label, input: `${fieldLabelProps.input} !pl-[50px]` }} />
              <Select size="xs" searchable label="Write Off Account" placeholder="Select write off account" data={writeOffAccounts} value={charge.writeOffAccount} onChange={(v) => update("writeOffAccount", v || "")} rightSection={<IconChevronDown size={13} className="text-slate-400" />} leftSection={<IconChip icon={IconClipboardList} color="danger" />} leftSectionWidth={44} classNames={{ label: fieldLabelProps.label, input: `${fieldLabelProps.input} !pl-[50px]` }} />
              <Select size="xs" searchable label="Suspense Account" placeholder="Select suspense account" data={principalAccounts} value={charge.suspenseAccount} onChange={(v) => update("suspenseAccount", v || "")} rightSection={<IconChevronDown size={13} className="text-slate-400" />} leftSection={<IconChip icon={IconStack2} color="gold" />} leftSectionWidth={44} classNames={{ label: fieldLabelProps.label, input: `${fieldLabelProps.input} !pl-[50px]` }} />
            </div>
          </div>
        </fieldset>
      </div>

      <div className="bg-white border-t border-slate-100 p-3.5 px-6 flex justify-between items-center shrink-0">
        <Text size="10px" className="text-slate-400">Shortcuts: Esc close</Text>
        <Button type="button" size="sm" radius="md" onClick={() => setAccountsModalIndex(null)} className="font-semibold px-6">
          Done
        </Button>
      </div>
    </Modal>
  );
}