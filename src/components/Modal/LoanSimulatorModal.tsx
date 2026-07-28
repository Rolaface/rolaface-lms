import { useMemo, useState } from "react";
import { Modal, Text, NumberInput, Button, Box, Tooltip, ActionIcon } from "@mantine/core";
import {
  IconCalculator,
  IconPercentage,
  IconCalendarStats,
  IconCurrencyDollar,
  IconInfoCircle,
  IconX,
  IconCurrency,
} from "@tabler/icons-react";

interface LoanSimulatorModalProps {
  opened: boolean;
  onClose: () => void;
  onApply?: (principal: number, tenure: number) => void;
}

const labelClass = { label: "text-sm font-bold text-slate-800 mb-1" };

function FieldIcon({ Icon, bg, color }: { Icon: any; bg: string; color: string }) {
  return (
    <div className="p-1.5 rounded-md flex items-center justify-center" style={{ backgroundColor: bg }}>
      <Icon size={14} style={{ color }} />
    </div>
  );
}

function calcEmi(principal: number, annualRate: number, tenureMonths: number) {
  if (!principal || !annualRate || !tenureMonths) return 0;
  const r = annualRate / 12 / 100;
  const emi = (principal * r * Math.pow(1 + r, tenureMonths)) / (Math.pow(1 + r, tenureMonths) - 1);
  return Math.round(emi * 100) / 100;
}

function calcPrincipalFromEmi(emi: number, annualRate: number, tenureMonths: number) {
  if (!emi || !annualRate || !tenureMonths) return 0;
  const r = annualRate / 12 / 100;
  const principal = (emi * (Math.pow(1 + r, tenureMonths) - 1)) / (r * Math.pow(1 + r, tenureMonths));
  return Math.round(principal * 100) / 100;
}

export function LoanSimulatorModal({ opened, onClose, onApply }: LoanSimulatorModalProps) {
  const [simPrincipal, setSimPrincipal] = useState<number | "">(50000);
  const [simRate, setSimRate] = useState<number | "">(14.5);
  const [simTenure, setSimTenure] = useState<number | "">(12);
  const [simEmi, setSimEmi] = useState<number | "">("");
  const [simMode, setSimMode] = useState<"principalToEmi" | "emiToPrincipal">("principalToEmi");

  const simComputedEmi = useMemo(() => {
    if (simMode === "emiToPrincipal") return Number(simEmi) || 0;
    return calcEmi(Number(simPrincipal) || 0, Number(simRate) || 0, Number(simTenure) || 0);
  }, [simMode, simPrincipal, simRate, simTenure, simEmi]);

  const simComputedPrincipal = useMemo(() => {
    if (simMode === "emiToPrincipal") {
      return calcPrincipalFromEmi(Number(simEmi) || 0, Number(simRate) || 0, Number(simTenure) || 0);
    }
    return Number(simPrincipal) || 0;
  }, [simMode, simEmi, simRate, simTenure, simPrincipal]);

  const simTotalRepayment = useMemo(
    () => Math.round(simComputedEmi * (Number(simTenure) || 0) * 100) / 100,
    [simComputedEmi, simTenure]
  );
  const simTotalInterest = useMemo(
    () => Math.round((simTotalRepayment - simComputedPrincipal) * 100) / 100,
    [simTotalRepayment, simComputedPrincipal]
  );

  const handleSimPrincipalChange = (v: number | "") => {
    setSimPrincipal(v);
    setSimMode("principalToEmi");
    setSimEmi("");
  };

  const handleSimEmiChange = (v: number | "") => {
    setSimEmi(v);
    setSimMode("emiToPrincipal");
  };

  const formatCurrency = (val: number) => {
    return val.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <Modal 
      opened={opened} 
      onClose={onClose} 
      size="1100px" 
      withCloseButton={false} 
      padding="xl" 
      radius="md"
    >
      {/* Custom Clean Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <Text size="sm" fw={800} className="text-slate-800 uppercase tracking-wide">
              LOAN SIMULATOR
            </Text>
            <IconInfoCircle size={15} className="text-slate-400" />
          </div>
        </div>
        <ActionIcon onClick={onClose} variant="subtle" color="gray" size="lg">
          <IconX size={20} />
        </ActionIcon>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        
        {/* Left Column - Inputs */}
        <div className="flex flex-col gap-5">
          <NumberInput
            size="md"
            label="Principal"
            value={simPrincipal}
            onChange={(v) => handleSimPrincipalChange(v as number | "")}
            leftSection={<FieldIcon Icon={IconCurrency} bg="#FFF7ED" color="#EA580C" />}
            thousandSeparator=","
            classNames={labelClass}
          />
          
          <NumberInput
            size="md"
            label="Interest Rate (% p.a.)"
            value={simRate}
            onChange={(v) => setSimRate(v as number | "")}
            leftSection={<FieldIcon Icon={IconPercentage} bg="#EEF2FF" color="#4F46E5" />}
            classNames={labelClass}
          />
          
          <NumberInput
            size="md"
            label="Tenure (months)"
            value={simTenure}
            onChange={(v) => setSimTenure(v as number | "")}
            leftSection={<FieldIcon Icon={IconCalendarStats} bg="#ECFDF5" color="#059669" />}
            classNames={labelClass}
          />
          
          <div>
            <NumberInput
              size="md"
              label="EMI"
              value={simMode === "emiToPrincipal" ? simEmi : simComputedEmi || ""}
              onChange={(v) => handleSimEmiChange(v as number | "")}
              leftSection={<FieldIcon Icon={IconCalculator} bg="#FFF7ED" color="#EA580C" />}
              classNames={labelClass}
            />
            <Text size="sm" c="dimmed" className="mt-1.5">
              Enter an EMI to back-calculate the Principal below.
            </Text>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-md px-4 py-3 text-sm text-slate-600 mt-2">
            Showing <span className="font-bold text-[#4F46E5]">{simMode === "principalToEmi" ? "Principal → EMI" : "EMI → Principal"}</span>. Type a value into {simMode === "principalToEmi" ? "EMI" : "Principal"} to switch to {simMode === "principalToEmi" ? "EMI → Principal" : "Principal → EMI"} mode.
          </div>

          <Button
            size="md"
            className="bg-[#4338CA] hover:bg-[#3730A3] border-0 font-semibold mt-2"
            onClick={() => {
              if (onApply) onApply(simComputedPrincipal, Number(simTenure) || 0);
              onClose();
            }}
          >
            Apply to Loan Form →
          </Button>
        </div>

        {/* Right Column - Results Card */}
        <div className="bg-[#FFF9F0] border border-[#FED7AA] rounded-lg p-8 flex flex-col h-full">
          <Text size="xs" fw={800} className="text-[#EA580C] uppercase tracking-wide mb-3">
            ESTIMATED EMI
          </Text>
          <Text fw={800} className="text-[#EA580C] mb-8" style={{ fontSize: 36, lineHeight: 1 }}>
            {formatCurrency(simComputedEmi)}
          </Text>

          <div className="flex flex-col mt-auto gap-0">
            <div className="flex justify-between items-center text-[15px] text-slate-700 border-t border-[#FED7AA] py-4">
              <span>Principal</span>
              <span className="font-mono font-medium">{formatCurrency(simComputedPrincipal)}</span>
            </div>
            
            <div className="flex justify-between items-center text-[15px] text-slate-700 border-t border-[#FED7AA] py-4">
              <span>Total Interest Payable</span>
              <span className="font-mono font-medium">{formatCurrency(simTotalInterest)}</span>
            </div>
            
            <div className="flex justify-between items-center text-[15px] text-slate-700 border-t border-[#FED7AA] pt-4 pb-1">
              <span>Total Repayment</span>
              <span className="font-mono font-medium">{formatCurrency(simTotalRepayment)}</span>
            </div>
          </div>
        </div>
        
      </div>
    </Modal>
  );
}