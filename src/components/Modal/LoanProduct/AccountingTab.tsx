// Remove useQuery and useMemo from your imports as they are no longer needed here
import { Text, Checkbox, Select } from "@mantine/core";
import { IconChevronDown, IconBuildingBank, IconStack2, IconFileText } from "@tabler/icons-react";
import { getAllIncomeAccounts, getAllIPAccounts, getAllPrincipalAccounts } from "../../../api/productApi";
import { SubSection } from "./Subsection";
import { theme, fieldLabelProps, toAccountOptions } from "./Constants";
import { AsyncAccountSelect } from "../../../utils/asyncAccountSelection";

export interface AccountFieldsState {
  loanAccount: string;
  disbursementAccount: string;
  repaymentAccount: string;
  writeOffAccount: string;
  writeOffRecoveryAccount: string;
  subsidyAccount: string;
  securityDepositAccount: string;
  suspenseCollectionAccount: string;
  customerRefundAccount: string;
}

export interface InterestPenaltyAccountsState {
  income: string;
  receivable: string;
  accrued: string;
  suspended: string;
  waiver: string;
}

interface AccountingTabProps {
  generalAccs: AccountFieldsState;
  setGeneralAccs: React.Dispatch<React.SetStateAction<AccountFieldsState>>;
  interestAccs: InterestPenaltyAccountsState;
  penaltyAccs: InterestPenaltyAccountsState;
  handleInterestChange: (field: keyof InterestPenaltyAccountsState, value: string | null) => void;
  handlePenaltyChange: (field: keyof InterestPenaltyAccountsState, value: string | null) => void;
  sameAsInterest: boolean;
  handleSameAsInterestToggle: (e: React.ChangeEvent<HTMLInputElement>) => void;
  brokenPeriodRecoveryAccount: string;
  setBrokenPeriodRecoveryAccount: (value: string) => void;
}

export function AccountingTab({
  generalAccs, setGeneralAccs,
  interestAccs, penaltyAccs,
  handleInterestChange, handlePenaltyChange,
  sameAsInterest, handleSameAsInterestToggle,
  brokenPeriodRecoveryAccount, setBrokenPeriodRecoveryAccount,
}: AccountingTabProps) {

  const chevron = <IconChevronDown size={14} className="text-slate-400" />;

  return (
    <div>
      <SubSection title="Principal Accounts" icon={IconBuildingBank}>
        <div className="grid grid-cols-3 gap-x-4 gap-y-3">
          <AsyncAccountSelect fetchFn={getAllPrincipalAccounts} queryKeyPrefix="principalAccs" size="xs" withAsterisk rightSection={chevron} placeholder="Select account" label="Loan Account" value={generalAccs.loanAccount} onChange={(v) => setGeneralAccs((p) => ({ ...p, loanAccount: v || "" }))} classNames={fieldLabelProps} />
          <AsyncAccountSelect fetchFn={getAllPrincipalAccounts} queryKeyPrefix="principalAccs" size="xs" withAsterisk rightSection={chevron} placeholder="Select account" label="Disbursement Bank Account" value={generalAccs.disbursementAccount} onChange={(v) => setGeneralAccs((p) => ({ ...p, disbursementAccount: v || "" }))} classNames={fieldLabelProps} />
          <AsyncAccountSelect fetchFn={getAllPrincipalAccounts} queryKeyPrefix="principalAccs" size="xs" withAsterisk rightSection={chevron} placeholder="Select account" label="Repayment Bank Account" value={generalAccs.repaymentAccount} onChange={(v) => setGeneralAccs((p) => ({ ...p, repaymentAccount: v || "" }))} classNames={fieldLabelProps} />
        </div>
      </SubSection>

      <SubSection
        title="Interest & Penalty Accounts"
        icon={IconStack2}
        trailing={
          <Checkbox size="xs" label="Same as Interest" checked={sameAsInterest} onChange={handleSameAsInterestToggle} classNames={{ label: "text-xs text-slate-700 font-medium cursor-pointer" }} />
        }
      >
        <div className="grid grid-cols-3 gap-4 mb-2.5 px-0">
          <Text size="xs" fw={700} className="text-slate-400 uppercase tracking-wider">Account Type</Text>
          <Text size="xs" fw={700} className="uppercase tracking-wider" style={{ color: theme.brand[6] }}>Interest</Text>
          <Text size="xs" fw={700} className="uppercase tracking-wider" style={{ color: theme.danger[6] }}>Penalty</Text>
        </div>
        <div className="flex flex-col gap-2.5">
          {[
            { key: "income", label: "Income Account", fetchFn: getAllIncomeAccounts, queryKey: "incAccs", required: true },
            { key: "receivable", label: "Receivable Account", fetchFn: getAllIPAccounts, queryKey: "ipAccs", required: true },
            { key: "accrued", label: "Accrued Account", fetchFn: getAllIPAccounts, queryKey: "ipAccs", required: true },
            { key: "suspended", label: "Suspended Account", fetchFn: getAllIPAccounts, queryKey: "ipAccs", required: false },
            { key: "waiver", label: "Waiver Account", fetchFn: getAllIPAccounts, queryKey: "ipAccs", required: true },
          ].map(({ key, label, fetchFn, queryKey, required }) => (
            <div key={key} className="grid grid-cols-3 gap-4 items-center">
              <Text size="xs" fw={600} className="text-slate-700">
                {label}
                {required && <span className="text-danger-6"> *</span>}
              </Text>
              <AsyncAccountSelect fetchFn={fetchFn} queryKeyPrefix={queryKey} size="xs" value={interestAccs[key as keyof InterestPenaltyAccountsState]} onChange={(v) => handleInterestChange(key as keyof InterestPenaltyAccountsState, v)} rightSection={chevron} placeholder="Select account" classNames={{ input: fieldLabelProps.input }} />
              <AsyncAccountSelect fetchFn={fetchFn} queryKeyPrefix={queryKey} size="xs" value={penaltyAccs[key as keyof InterestPenaltyAccountsState]} onChange={(v) => handlePenaltyChange(key as keyof InterestPenaltyAccountsState, v)} rightSection={chevron} placeholder="Select account" classNames={{ input: fieldLabelProps.input }} />
            </div>
          ))}
        </div>
        {/* <div className="mt-3.5 pt-3.5 border-t border-slate-100">
          <AsyncAccountSelect
            fetchFn={getAllIPAccounts} // Or getAllIncomeAccounts if preferred
            queryKeyPrefix="ipAccs"
            size="xs"
            withAsterisk
            label="Broken Period Interest Recovery Account"
            description="Interest-side only — used when a loan is disbursed mid-cycle"
            placeholder="Select account"
            value={brokenPeriodRecoveryAccount}
            onChange={(v) => setBrokenPeriodRecoveryAccount(v || "")}
            rightSection={<IconChevronDown size={14} className="text-slate-400" />}
            classNames={fieldLabelProps}
            className="max-w-md"
          />
        </div> */}
      </SubSection>

      <SubSection title="General Accounts" icon={IconFileText} last>
        <div className="grid grid-cols-3 gap-x-4 gap-y-3">
          <AsyncAccountSelect fetchFn={getAllIPAccounts} queryKeyPrefix="ipAccs" size="xs" withAsterisk rightSection={chevron} placeholder="Select account" label="Write Off Account" value={generalAccs.writeOffAccount} onChange={(v) => setGeneralAccs((p) => ({ ...p, writeOffAccount: v || "" }))} classNames={fieldLabelProps} />
          <AsyncAccountSelect fetchFn={getAllIPAccounts} queryKeyPrefix="ipAccs" size="xs" withAsterisk rightSection={chevron} placeholder="Select account" label="Write Off Recovery" value={generalAccs.writeOffRecoveryAccount} onChange={(v) => setGeneralAccs((p) => ({ ...p, writeOffRecoveryAccount: v || "" }))} classNames={fieldLabelProps} />
          <AsyncAccountSelect fetchFn={getAllIPAccounts} queryKeyPrefix="ipAccs" size="xs" rightSection={chevron} placeholder="Select account" label="Subsidy Account" value={generalAccs.subsidyAccount} onChange={(v) => setGeneralAccs((p) => ({ ...p, subsidyAccount: v || "" }))} classNames={fieldLabelProps} />
          <AsyncAccountSelect fetchFn={getAllIPAccounts} queryKeyPrefix="ipAccs" size="xs" withAsterisk rightSection={chevron} placeholder="Select account" label="Security Deposit Account" value={generalAccs.securityDepositAccount} onChange={(v) => setGeneralAccs((p) => ({ ...p, securityDepositAccount: v || "" }))} classNames={fieldLabelProps} />
          <AsyncAccountSelect fetchFn={getAllIPAccounts} queryKeyPrefix="ipAccs" size="xs" rightSection={chevron} placeholder="Select account" label="Suspense Collection" value={generalAccs.suspenseCollectionAccount} onChange={(v) => setGeneralAccs((p) => ({ ...p, suspenseCollectionAccount: v || "" }))} classNames={fieldLabelProps} />
          <AsyncAccountSelect fetchFn={getAllIPAccounts} queryKeyPrefix="ipAccs" size="xs" withAsterisk rightSection={chevron} placeholder="Select account" label="Customer Refund" value={generalAccs.customerRefundAccount} onChange={(v) => setGeneralAccs((p) => ({ ...p, customerRefundAccount: v || "" }))} classNames={fieldLabelProps} />
        </div>
      </SubSection>
    </div>
  );
}