import { Box, Paper, Title, Text, Grid, TextInput, Select } from "@mantine/core";
import type { FormulaParams, SetFormulaParam } from "./Ruleshared";
import { useQuery } from "@tanstack/react-query";
import { getAllLoanProducts } from "../../../../api/productApi";
import { useMemo } from "react";

interface BasicInformationProps {
  ruleName: string;
  setRuleName: (v: string) => void;
  loanProduct: string | null;
  setLoanProduct: (v: string | null) => void;
  riskCategory: string | null;
  setRiskCategory: (v: string | null) => void;
  ruleStatus: string | null;
  setRuleStatus: (v: string | null) => void;
  formulaParams: FormulaParams;
  setFormulaParam: SetFormulaParam;
}
export function BasicInformation({
  ruleName,
  setRuleName,
  loanProduct,
  setLoanProduct,
  riskCategory,
  setRiskCategory,
  ruleStatus,
  setRuleStatus,
  formulaParams,
  setFormulaParam,
}: BasicInformationProps) {
  const { data: productResponse, isLoading: isProductsLoading, refetch: refetchProducts } = useQuery({
    queryKey: ["loanProducts"],
    queryFn: () => getAllLoanProducts(),
  });

  const availableProduct = useMemo(() => {
    const products = productResponse?.data || [];
    return products
      .filter((p: any) => p.disabled !== 1)
      .map((p: any) => ({
        value: p.name,
        label: p.name,
      }));
  }, [productResponse]);

  return (
    <Box>
      <Paper
        radius="md"
        style={{
          border: "1px solid var(--mantine-color-slate-2)",
          overflow: "hidden",
        }}
      >
        <Box
          py={8}
          px="sm"
          style={{
            borderBottom: "1px solid var(--mantine-color-slate-2)",
            background: "transparent",
          }}
        >
          <Title order={6} c="slate.8" fw={600}>
            Basic information
          </Title>
        </Box>

        <Grid
          gutter={10}
          py={10}
          px="sm"
          align="flex-start"
          style={{
            borderBottom: "1px solid var(--mantine-color-slate-2)",
            margin: 0,
          }}
        >
          <Grid.Col span={2}>
            <Text fz={11} fw={600} c="slate.6">
              Identity
            </Text>
          </Grid.Col>
          <Grid.Col span={10}>
            <Grid gutter={10}>
              <Grid.Col span={8}>
                <Box mb={1}>
                  <Text fz={10} fw={500} c="slate.7">
                    Rule name{" "}
                    <span style={{ color: "var(--mantine-color-red-6)" }}>
                      *
                    </span>
                  </Text>
                </Box>
                <TextInput
                  radius="md"
                  size="xs"
                  value={ruleName}
                  onChange={(e) => setRuleName(e.target.value)}
                  placeholder="Standard Personal Loan Eligibility"
                  styles={{ input: { minHeight: 26, height: 26 } }}
                />
              </Grid.Col>
              <Grid.Col span={2}>
                <Box mb={1}>
                  <Text fz={10} fw={500} c="slate.7">
                    Version
                  </Text>
                </Box>
                <TextInput
                  radius="md"
                  size="xs"
                  defaultValue="1.0"
                  disabled
                  styles={{ input: { minHeight: 26, height: 26 } }}
                />
              </Grid.Col>
              <Grid.Col span={2}>
                <Box mb={1}>
                  <Text fz={10} fw={500} c="slate.7">
                    Priority
                  </Text>
                </Box>
                <TextInput
                  radius="md"
                  size="xs"
                  type="number"
                  defaultValue={1}
                  styles={{ input: { minHeight: 26, height: 26 } }}
                />
              </Grid.Col>
            </Grid>
          </Grid.Col>
        </Grid>

        <Grid
          gutter={10}
          py={10}
          px="sm"
          align="flex-start"
          style={{
            borderBottom: "1px solid var(--mantine-color-slate-2)",
            margin: 0,
          }}
        >
          <Grid.Col span={2}>
            <Text fz={11} fw={600} c="slate.6">
              Applies to
            </Text>
          </Grid.Col>
          <Grid.Col span={10}>
            <Grid gutter={10} mb={8}>
              <Grid.Col span={6}>
                <Box mb={1}>
                  <Text fz={10} fw={500} c="slate.7">
                    Loan product
                  </Text>
                </Box>
                <Select
                  radius="md"
                  size="xs"
                  value={loanProduct}
                  onChange={setLoanProduct}
                 data={availableProduct}
                  styles={{ input: { minHeight: 26, height: 26 } }}
                />
              </Grid.Col>
              <Grid.Col span={3}>
                <Box mb={1}>
                  <Text fz={10} fw={500} c="slate.7">
                    Maximum amount
                  </Text>
                </Box>
                <TextInput
                  radius="md"
                  size="xs"
                  type="number"
                  value={formulaParams.productMax}
                  onChange={(e) =>
                    setFormulaParam("productMax")(
                      e.target.value === "" ? 0 : Number(e.target.value),
                    )
                  }
                  rightSection={
                    <Text fz={9} c="dimmed" mr={8}>
                      ZMW
                    </Text>
                  }
                  rightSectionWidth={36}
                  styles={{ input: { minHeight: 26, height: 26 } }}
                />
              </Grid.Col>
              <Grid.Col span={3}>
                <Box mb={1}>
                  <Text fz={10} fw={500} c="slate.7">
                    Risk category
                  </Text>
                </Box>
                <Select
                  radius="md"
                  size="xs"
                  value={riskCategory}
                  onChange={setRiskCategory}
                  data={["Low Risk", "Medium Risk", "High Risk"]}
                  styles={{ input: { minHeight: 26, height: 26 } }}
                />
              </Grid.Col>
            </Grid>
            <Grid gutter={10}>
              <Grid.Col span={3}>
                <Box mb={1}>
                  <Text fz={10} fw={500} c="slate.7">
                    Customer type
                  </Text>
                </Box>
                <Select
                  radius="md"
                  size="xs"
                  defaultValue="Individual"
                  data={["Individual", "Employee", "SME", "Corporate"]}
                  styles={{ input: { minHeight: 26, height: 26 } }}
                />
              </Grid.Col>
              <Grid.Col span={3}>
                <Box mb={1}>
                  <Text fz={10} fw={500} c="slate.7">
                    Customer segment
                  </Text>
                </Box>
                <Select
                  radius="md"
                  size="xs"
                  defaultValue="New Customer"
                  data={[
                    "New Customer",
                    "Existing Customer",
                    "Repeat Borrower",
                    "Preferred Customer",
                  ]}
                  styles={{ input: { minHeight: 26, height: 26 } }}
                />
              </Grid.Col>
            </Grid>
          </Grid.Col>
        </Grid>

        <Grid gutter={10} py={10} px="sm" align="flex-start" style={{ margin: 0 }}>
          <Grid.Col span={2}>
            <Text fz={11} fw={600} c="slate.6">
              In force
            </Text>
          </Grid.Col>
          <Grid.Col span={10}>
            <Grid gutter={10}>
              <Grid.Col span={4}>
                <Box mb={1}>
                  <Text fz={10} fw={500} c="slate.7">
                    Status
                  </Text>
                </Box>
                <Select
                  radius="md"
                  size="xs"
                  value={ruleStatus}
                  onChange={setRuleStatus}
                  data={["Draft", "Active", "Disabled"]}
                  styles={{ input: { minHeight: 26, height: 26 } }}
                />
              </Grid.Col>
              <Grid.Col span={4}>
                <Box mb={1}>
                  <Text fz={10} fw={500} c="slate.7">
                    Effective from
                  </Text>
                </Box>
                <TextInput
                  radius="md"
                  size="xs"
                  type="date"
                  defaultValue={new Date().toISOString().split("T")[0]}
                  styles={{ input: { minHeight: 26, height: 26 } }}
                />
              </Grid.Col>
              <Grid.Col span={4}>
                <Box mb={1}>
                  <Text fz={10} fw={500} c="slate.7">
                    Effective until
                  </Text>
                </Box>
                <TextInput
                  radius="md"
                  size="xs"
                  type="date"
                  styles={{ input: { minHeight: 26, height: 26 } }}
                />
              </Grid.Col>
            </Grid>
          </Grid.Col>
        </Grid>
      </Paper>
    </Box>
  );
}