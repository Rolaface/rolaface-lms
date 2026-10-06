import { Badge, Box, Group, NumberInput, Select, Text, TextInput, Title } from "@mantine/core";
import type { FormulaParams, SetFormulaParam } from "./Ruleshared";
import { useLoanProductOptions } from "../../../../components/Modal/OriginationSetup/LoanProductAssignmentModal";

interface BasicInformationProps {
  ruleName: string;
  setRuleName: (v: string) => void;
  loanProduct: string | null;
  setLoanProduct: (v: string | null) => void;
  ruleStatus: string | null;
  formulaParams: FormulaParams;
  setFormulaParam: SetFormulaParam;
  effectiveFrom: string;
  setEffectiveFrom: (v: string) => void;
  effectiveUntil: string;
  setEffectiveUntil: (v: string) => void;
  version: string;
  productLocked: boolean;
}

const FIELD_STYLES = {
  label: { fontSize: 11, fontWeight: 600, color: "var(--mantine-color-slate-7)", marginBottom: 4 },
  input: { height: 32, minHeight: 32, fontSize: 12.5, borderRadius: 8 },
  description: { fontSize: 10.5, marginTop: 4 },
};

export function BasicInformation({
  ruleName,
  setRuleName,
  loanProduct,
  setLoanProduct,
  ruleStatus,
  formulaParams,
  setFormulaParam,
  effectiveFrom,
  setEffectiveFrom,
  effectiveUntil,
  setEffectiveUntil,
  version,
  productLocked,
}: BasicInformationProps) {
  const { options: productOptions } = useLoanProductOptions();
  const availableProduct = productOptions.map((p) => ({ value: p.value, label: `${p.value} · ${p.label}` }));
  const datesInvalid = !!effectiveUntil && !!effectiveFrom && effectiveUntil < effectiveFrom;

  return (
    <Box>
      <Group
        justify="space-between"
        align="flex-start"
        py={6}
        px={8}
        mb="md"
        style={{ borderBottom: "1px solid var(--mantine-color-slate-2)" }}
      >
        <Box>
          <Title order={6} c="slate.8" fw={600} mb={1}>
            Basic Information
          </Title>
          <Text fz={10} c="slate.5">
            Name the rule, choose the loan product it applies to and set when it is in force.
          </Text>
        </Box>
        <Group gap={6}>
          <Badge size="sm" radius="sm" variant="light" color="slate">
            v{version}
          </Badge>
          <Badge size="sm" radius="sm" variant="light" color={ruleStatus === "Active" ? "success" : "brand"}>
            {ruleStatus || "Draft"}
          </Badge>
        </Group>
      </Group>

      <Box px={8} style={{ display: "grid", gridTemplateColumns: "repeat(6, minmax(0, 1fr))", gap: "14px 16px" }}>
        <TextInput
          label="Rule name"
          withAsterisk
          placeholder="Standard Personal Loan Eligibility"
          value={ruleName}
          onChange={(e) => setRuleName(e.currentTarget.value)}
          maxLength={140}
          styles={FIELD_STYLES}
          style={{ gridColumn: "span 3" }}
        />
        <Select
          label="Loan product"
          withAsterisk
          placeholder="Select loan product"
          value={loanProduct || null}
          onChange={setLoanProduct}
          data={
            loanProduct && !availableProduct.some((p) => p.value === loanProduct)
              ? [{ value: loanProduct, label: loanProduct }, ...availableProduct]
              : availableProduct
          }
          searchable
          disabled={productLocked}
          description={productLocked ? "Fixed after the rule is created" : undefined}
          inputWrapperOrder={["label", "input", "description", "error"]}
          styles={FIELD_STYLES}
          style={{ gridColumn: "span 3" }}
        />
        <NumberInput
          label="Maximum amount"
          hideControls
          min={0}
          placeholder="0"
          thousandSeparator=","
          value={formulaParams.productMax}
          onChange={(val) => setFormulaParam("productMax")(val === "" ? 0 : Number(val))}
          rightSection={
            <Text fz={10} c="slate.5">
              ZMW
            </Text>
          }
          rightSectionWidth={44}
          styles={FIELD_STYLES}
          style={{ gridColumn: "span 2" }}
        />
        <TextInput
          label="Effective from"
          type="date"
          value={effectiveFrom}
          onChange={(e) => setEffectiveFrom(e.currentTarget.value)}
          styles={FIELD_STYLES}
          style={{ gridColumn: "span 2" }}
        />
        <TextInput
          label="Effective until"
          type="date"
          value={effectiveUntil}
          min={effectiveFrom || undefined}
          onChange={(e) => setEffectiveUntil(e.currentTarget.value)}
          error={datesInvalid ? "Cannot be before effective from" : undefined}
          styles={FIELD_STYLES}
          style={{ gridColumn: "span 2" }}
        />
      </Box>
    </Box>
  );
}
