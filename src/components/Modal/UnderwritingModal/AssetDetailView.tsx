import React from 'react';
import { Box, Group, Text, SimpleGrid, Paper, TextInput, NumberInput, Select, Checkbox, Textarea, Badge, Stack, Button, Divider, ActionIcon } from '@mantine/core';
import { IconCar, IconInfoCircle, IconAlertTriangle, IconCalendarEvent, IconUserCheck, IconFileText, IconShieldCheck, IconCircleCheck, IconCircleX, IconArrowRight, IconGavel, IconX } from '@tabler/icons-react';
import type { DummyAssetBase } from '../PreScreeningModal/Dummyloanapplicationdata';
import { DUMMY_ASSET_TYPES } from '../PreScreeningModal/Dummyloanapplicationdata';
import { type Asset, type PanelId, type Decision, type Condition, type AssetDoc, CHECK_STATUSES, DECISION_LABEL, REJECT_REASONS, zmw, requiredDocsVerified, missingRequiredDocs, SectionLabel, ReadRow, MiniStat, ValidityNote, DocumentsTable, DecisionButton } from './UnderwritingModal';

export function AssetDetailView({
  asset,
  finalAmount,
  panel,
  notes,
  setNotes,
  onUpdate,
  editableBase,
}: {
  asset: Asset;
  finalAmount: number;
  panel: PanelId;
  notes: string;
  setNotes: (v: string) => void;
  onUpdate: (patch: Partial<Asset>) => void;
  editableBase?: boolean;
}) {
  const coverage = asset.valuation.amount ? Math.round((Number(asset.valuation.amount) / finalAmount) * 100) : null;
  const valuationBadge =
    asset.status === "Passed"
      ? { color: "green", label: "Valuation verified" }
      : ["Failed", "Exception"].includes(asset.status)
      ? { color: "red", label: "Valuation flagged" }
      : { color: "orange", label: "Valuation pending" };

  const requiredAssetDocs = asset.docs.filter((d) => d.tier === "required");
  const missingAssetDocs = requiredAssetDocs.filter((d) => d.status !== "Verified");
  const docsReady = requiredDocsVerified(asset.docs);
  const assetValidationStatus = asset.status === "Passed" ? "Passed" : asset.status === "Failed" ? "Failed" : "Review Required";
  const assetValuationStatus = asset.status === "Passed" ? "Verified" : "Pending";
  const assetDocsStatus = missingAssetDocs.length === 0 ? "Complete" : "Incomplete";

  // Validations have been removed per user request
  const statusOptions = CHECK_STATUSES;

  return (
    <Box px={16} pt={16} pb={12}>
      {panel === "assetDetails" && (
        <Box>
          <SectionLabel color="brand.8" icon={IconInfoCircle}>Basic Information</SectionLabel>
          {editableBase ? (
            <SimpleGrid cols={3} spacing={12} mt={16} mb={24}>
              <Select
                size="xs"
                label="Asset type"
                data={DUMMY_ASSET_TYPES}
                value={asset.base.type}
                onChange={(v) => onUpdate({ base: { ...asset.base, type: v || asset.base.type } })}
                radius="md"
                allowDeselect={false}
              />
              <TextInput
                size="xs"
                label="Asset ID"
                value={asset.base.assetId || ""}
                onChange={(e) => onUpdate({ base: { ...asset.base, assetId: e.currentTarget.value } })}
                placeholder="e.g. AST-33022"
                radius="md"
              />
              <TextInput
                size="xs"
                label="Description"
                value={asset.base.description || ""}
                onChange={(e) => onUpdate({ base: { ...asset.base, description: e.currentTarget.value } })}
                placeholder="e.g. Stand 4521, Kabwata, Lusaka"
                radius="md"
                error={!asset.base.description?.trim() ? "Required" : undefined}
              />
            </SimpleGrid>
          ) : (
            <SimpleGrid cols={3} spacing={24} mt={16} mb={24}>
              <ReadRow label="Asset type" value={asset.base.type || "�"} />
              <ReadRow label="Asset ID" value={asset.base.assetId || "�"} />
              <ReadRow label="Description" value={asset.base.description || "�"} />
            </SimpleGrid>
          )}

          <Group
            gap={12}
            p={12}
            mb={24}
            bg={asset.kycVerified ? "brand.0" : "gray.0"}
            style={{ border: `1px solid var(--mantine-color-${asset.kycVerified ? "brand" : "gray"}-2)`, borderRadius: 9 }}
            wrap="nowrap"
            align="center"
          >
            <IconInfoCircle size={13} color="var(--mantine-color-brand-6)" style={{ flexShrink: 0 }} />
            <Text fz={11} lh={1.3} c="dark.6" style={{ flex: 1 }}>
              Confirm the owner's KYC has been completed and verified for this asset.
            </Text>
            <Checkbox
              checked={asset.kycVerified}
              onChange={(e) => onUpdate({ kycVerified: e.currentTarget.checked })}
              label="KYC verified"
              size="xs"
              styles={{ label: { fontSize: 11.5 } }}
            />
          </Group>
        </Box>
      )}

      {panel === "valuation" && (
        <Box>
          <Group justify="space-between" mb={16} mt={6} align="center">
                <SectionLabel color="brand.8" icon={IconCar}>Asset Valuation</SectionLabel>
                <Badge size="sm" radius="xl" color={valuationBadge.color} variant="light" leftSection={<IconAlertTriangle size={11} />}>
                  {valuationBadge.label}
                </Badge>
            </Group>

            <SimpleGrid cols={2} spacing={20} mb={8}>
              <Box>
                <SimpleGrid cols={2} spacing={8}>
                <NumberInput
                  size="xs"
                  label="Valuation amount"
                  value={asset.valuation.amount ? Number(asset.valuation.amount) : undefined}
                  onChange={(v) => onUpdate({ valuation: { ...asset.valuation, amount: v ? String(v) : "" } })}
                  placeholder="e.g. 95000"
                  prefix="ZMW "
                  radius="md"
                  thousandSeparator=","
                />
                <Select
                  size="xs"
                  label="Valuation method"
                  value={asset.valuation.method}
                  onChange={(v) => onUpdate({ valuation: { ...asset.valuation, method: v || asset.valuation.method } })}
                  data={["Market comparison", "Cost approach", "Income approach"]}
                  radius="md"
                />
                <NumberInput
                  size="xs"
                  label="Market value"
                  value={asset.valuation.marketValue ? Number(asset.valuation.marketValue) : undefined}
                  onChange={(v) => onUpdate({ valuation: { ...asset.valuation, marketValue: v ? String(v) : "" } })}
                  placeholder="e.g. 98000"
                  prefix="ZMW "
                  radius="md"
                  thousandSeparator=","
                />
                <NumberInput
                  size="xs"
                  label="Forced sale value"
                  value={asset.valuation.forcedSaleValue ? Number(asset.valuation.forcedSaleValue) : undefined}
                  onChange={(v) => onUpdate({ valuation: { ...asset.valuation, forcedSaleValue: v ? String(v) : "" } })}
                  placeholder="e.g. 76000"
                  prefix="ZMW "
                  radius="md"
                  thousandSeparator=","
                />
              </SimpleGrid>
            </Box>
            <Box style={{ borderLeft: "1px solid var(--mantine-color-gray-2)", paddingLeft: 20 }}>
              <Stack gap={8} h="100%">
                <Textarea
                  size="xs"
                  label="Valuation notes"
                  value={asset.valuation.notes}
                  onChange={(e) => onUpdate({ valuation: { ...asset.valuation, notes: e.currentTarget.value } })}
                  placeholder="Condition, mileage, any relevant observations…"
                  minRows={coverage != null ? 5 : 7}
                  radius="md"
                  style={{ flex: 1 }}
                />
                {coverage != null && (
                  <Paper bg="brand.0" p={8} radius="md" style={{ border: "1px solid var(--mantine-color-brand-2)" }}>
                    <Stack gap={6}>
                      <MiniStat label="This asset's value" value={zmw(asset.valuation.amount)} />
                      <MiniStat label="Final loan amount" value={zmw(finalAmount)} />
                      <MiniStat label="Coverage" value={`${coverage}%`} accent={coverage < 120} />
                    </Stack>
                  </Paper>
                )}
              </Stack>
            </Box>
          </SimpleGrid>

          <Divider mb={6} />
          <SimpleGrid cols={2} spacing={20}>
            <Box>
              <SectionLabel color="brand.8" icon={IconUserCheck}>Valuer information</SectionLabel>
              <SimpleGrid cols={2} spacing={8} mt={6} mb={6}>
                <TextInput size="xs" label="Valuer name" value={asset.valuer.name} onChange={(e) => onUpdate({ valuer: { ...asset.valuer, name: e.currentTarget.value } })} placeholder="e.g. K. Zulu" radius="md" />
                <TextInput size="xs" label="Valuer / company" value={asset.valuer.company} onChange={(e) => onUpdate({ valuer: { ...asset.valuer, company: e.currentTarget.value } })} placeholder="e.g. Apex Valuers Ltd" radius="md" />
                <TextInput size="xs" label="License number" value={asset.valuer.license} onChange={(e) => onUpdate({ valuer: { ...asset.valuer, license: e.currentTarget.value } })} placeholder="e.g. VAL-2321" radius="md" />
                <TextInput size="xs" label="Contact" value={asset.valuer.contact} onChange={(e) => onUpdate({ valuer: { ...asset.valuer, contact: e.currentTarget.value } })} placeholder="Phone or email" radius="md" />
              </SimpleGrid>
              <Group
                gap={8}
                p={5}
                bg={asset.valuer.verified ? "brand.0" : "gray.0"}
                style={{ border: `1px solid var(--mantine-color-${asset.valuer.verified ? "brand" : "gray"}-2)`, borderRadius: 9 }}
                wrap="nowrap"
                align="center"
              >
                <IconInfoCircle size={13} color="var(--mantine-color-brand-6)" style={{ flexShrink: 0 }} />
                <Text fz={11} lh={1.3} c="dark.6" style={{ flex: 1 }}>
                  Confirm the valuer meets the configured panel requirement.
                </Text>
                <Checkbox
                  checked={asset.valuer.verified}
                  onChange={(e) => onUpdate({ valuer: { ...asset.valuer, verified: e.currentTarget.checked } })}
                  label="Confirmed"
                  size="xs"
                  styles={{ label: { fontSize: 11.5 } }}
                />
              </Group>
            </Box>

            <Box style={{ borderLeft: "1px solid var(--mantine-color-gray-2)", paddingLeft: 20 }}>
              <Group justify="space-between" mb={6}>
                <SectionLabel color="brand.8" icon={IconCalendarEvent}>Valuation date &amp; status</SectionLabel>
                <Select
                  data={statusOptions}
                  value={asset.status}
                  onChange={(v) => onUpdate({ status: v || asset.status })}
                  size="xs"
                  radius="xl"
                  w={140}
                  allowDeselect={false}
                />
              </Group>
              <Stack gap={4}>
                <TextInput size="xs" type="date" label="Valuation date" value={asset.valuationDate} onChange={(e) => onUpdate({ valuationDate: e.currentTarget.value })} radius="md" />
                <Box mt={10}>
                  <Text fz={12} fw={500} c="dark.6" mb={5}>
                    Validity
                  </Text>
                  <ValidityNote date={asset.valuationDate} days={asset.expiryDays} />
                </Box>
              </Stack>
              {["Failed", "Exception"].includes(asset.status) && (
                <Textarea
                  size="xs"
                  label="Finding / reason (required)"
                  value={asset.reason}
                  onChange={(e) => onUpdate({ reason: e.currentTarget.value })}
                  placeholder="Explain why the valuation failed or is an exception…"
                  minRows={1}
                  radius="md"
                  mt={8}
                />
              )}
            </Box>
          </SimpleGrid>

          <Box mt={24} mb={8}>
            <SectionLabel color="brand.8" icon={IconFileText}>Supporting Documents</SectionLabel>
            <DocumentsTable title="" docs={asset.docs} setDocs={(docs) => onUpdate({ docs })} />
          </Box>
        </Box>
      )}

      {panel === "notes" && (
        <Box>
          
          <Textarea
            size="xs"
            value={notes}
            onChange={(e) => setNotes(e.currentTarget.value)}
            placeholder="General comments, findings, risks, exceptions and recommendations that apply across the review…"
            minRows={2}
            radius="md"
          />
          <Text fz={11} c="dimmed" mt={6}>
            Shared across all assets and tabs, and included in the underwriting audit trail.
          </Text>
        </Box>
      )}

      {panel === "assetConclusion" && (
        <Box>
          <SectionLabel color="brand.8" icon={IconShieldCheck}>Validation Summary</SectionLabel>
          <SimpleGrid cols={3} spacing={8} mt={6} mb={10}>
            <Box
              p={10}
              bg={assetValidationStatus === "Passed" ? "green.0" : assetValidationStatus === "Failed" ? "red.0" : "orange.0"}
              style={{
                borderRadius: "var(--mantine-radius-md)",
                border: `1px solid var(--mantine-color-${assetValidationStatus === "Passed" ? "green" : assetValidationStatus === "Failed" ? "red" : "orange"}-3)`,
                borderLeftWidth: 3,
                borderLeftColor: `var(--mantine-color-${assetValidationStatus === "Passed" ? "green" : assetValidationStatus === "Failed" ? "red" : "orange"}-6)`,
              }}
            >
              <Text fz={9.5} fw={700} tt="uppercase" c={assetValidationStatus === "Passed" ? "green.7" : assetValidationStatus === "Failed" ? "red.7" : "orange.7"}>
                Asset Validation
              </Text>
              <Text fz={14} fw={700} c="dark.8" mt={1}>
                {assetValidationStatus}
              </Text>
            </Box>
            <Box
              p={10}
              bg={assetValuationStatus === "Verified" ? "green.0" : "orange.0"}
              style={{
                borderRadius: "var(--mantine-radius-md)",
                border: `1px solid var(--mantine-color-${assetValuationStatus === "Verified" ? "green" : "orange"}-3)`,
                borderLeftWidth: 3,
                borderLeftColor: `var(--mantine-color-${assetValuationStatus === "Verified" ? "green" : "orange"}-6)`,
              }}
            >
              <Text fz={9.5} fw={700} c={assetValuationStatus === "Verified" ? "green.7" : "orange.7"} tt="uppercase">
                Valuation
              </Text>
              <Text fz={14} fw={700} c="dark.8" mt={1}>
                {assetValuationStatus}
              </Text>
            </Box>
            <Box
              p={10}
              bg={assetDocsStatus === "Complete" ? "green.0" : "orange.0"}
              style={{
                borderRadius: "var(--mantine-radius-md)",
                border: `1px solid var(--mantine-color-${assetDocsStatus === "Complete" ? "green" : "orange"}-3)`,
                borderLeftWidth: 3,
                borderLeftColor: `var(--mantine-color-${assetDocsStatus === "Complete" ? "green" : "orange"}-6)`,
              }}
            >
              <Text fz={9.5} fw={700} c={assetDocsStatus === "Complete" ? "green.7" : "orange.7"} tt="uppercase">
                Documents
              </Text>
              <Text fz={14} fw={700} c="dark.8" mt={1}>
                {assetDocsStatus}
              </Text>
            </Box>
          </SimpleGrid>

          <Divider my={10} />

          <SectionLabel color="brand.8" icon={IconGavel}>Final Decision</SectionLabel>
          <SimpleGrid cols={4} spacing={16} mt={6} mb={10}>
            <Select
              size="xs"
              label="Assignee"
              data={["Internal team", "Legal"]}
              value={asset.assetAssignee}
              onChange={(v) => onUpdate({ assetAssignee: v || asset.assetAssignee })}
              radius="md"
            />
          </SimpleGrid>

          {!asset.assetDecision ? (
            <SimpleGrid cols={4} spacing={8}>
              <DecisionButton
                label="Approve / Proceed"
                caption="No conditions"
                color="green"
                icon={IconCircleCheck}
                onClick={() => onUpdate({ assetDecision: "approve" })}
              />
              <DecisionButton
                label="Approve with Conditions"
                caption="Add pre-disbursement terms"
                color="orange"
                icon={IconAlertTriangle}
                onClick={() => onUpdate({ assetDecision: "conditions" })}
              />
              <DecisionButton label="Refer / Further Revision" caption="Send back for more info" color="brand" icon={IconArrowRight} onClick={() => onUpdate({ assetDecision: "refer" })} />
              <DecisionButton label="Reject" caption="Close this asset" color="red" icon={IconCircleX} onClick={() => onUpdate({ assetDecision: "reject" })} />
            </SimpleGrid>
          ) : (
            <Box>
              <Group justify="space-between" mb={10}>
                <Text fz={13} fw={700} c="dark.8">
                  {DECISION_LABEL[asset.assetDecision]}
                </Text>
                <Button variant="subtle" size="compact-sm" onClick={() => onUpdate({ assetDecision: null })}>
                  Change decision
                </Button>
              </Group>

              {asset.assetDecision === "conditions" && (
                <Box mb={12}>
                  <Divider mb={10} />
                  {asset.assetConditions.map((c, i) => (
                    <Group key={i} align="flex-end" gap={10} mb={8} wrap="nowrap">
                      <TextInput
                        size="xs"
                        label="Condition"
                        value={c.condition}
                        onChange={(e) =>
                          onUpdate({
                            assetConditions: asset.assetConditions.map((cc, idx) => (idx === i ? { ...cc, condition: e.currentTarget.value } : cc)),
                          })
                        }
                        placeholder="e.g. Provide updated valuation report"
                        style={{ flex: 2 }}
                        radius="md"
                      />
                      <Select
                        size="xs"
                        label="Responsible party"
                        value={c.responsible}
                        onChange={(v) =>
                          onUpdate({
                            assetConditions: asset.assetConditions.map((cc, idx) => (idx === i ? { ...cc, responsible: v || cc.responsible } : cc)),
                          })
                        }
                        data={["Customer", "Internal", "Legal"]}
                        style={{ flex: 1 }}
                        radius="md"
                      />
                      <Select
                        size="xs"
                        label="Due before"
                        value={c.dueBefore}
                        onChange={(v) =>
                          onUpdate({
                            assetConditions: asset.assetConditions.map((cc, idx) => (idx === i ? { ...cc, dueBefore: v || cc.dueBefore } : cc)),
                          })
                        }
                        data={["Disbursement", "Offer", "Documentation"]}
                        style={{ flex: 1 }}
                        radius="md"
                      />
                      <ActionIcon
                        variant="default"
                        color="red"
                        size="lg"
                        onClick={() => onUpdate({ assetConditions: asset.assetConditions.filter((_, idx) => idx !== i) })}
                      >
                        <IconX size={14} />
                      </ActionIcon>
                    </Group>
                  ))}
                  <Button
                    variant="light"
                    size="compact-sm"
                    radius="md"
                    onClick={() =>
                      onUpdate({ assetConditions: [...asset.assetConditions, { condition: "", responsible: "Customer", dueBefore: "Disbursement" }] })
                    }
                  >
                    + Add condition
                  </Button>
                </Box>
              )}

              {(asset.assetDecision === "refer" || asset.assetDecision === "reject") && (
                <Box mb={12}>
                  <Divider mb={10} />
                  <Text fz={11} fw={600} c="dimmed" tt="uppercase" mb={8}>
                    Reason
                  </Text>
                  <Group gap={8} wrap="wrap">
                    {REJECT_REASONS.map((r) => (
                      <Button
                        key={r}
                        size="compact-sm"
                        radius="xl"
                        variant={asset.assetReasonCategory === r ? "light" : "outline"}
                        color={asset.assetReasonCategory === r ? "brand" : "gray"}
                        onClick={() => onUpdate({ assetReasonCategory: r })}
                      >
                        {r}
                      </Button>
                    ))}
                  </Group>
                </Box>
              )}

              <Divider mb={10} />
              <Textarea
                size="xs"
                label="Decision remarks — final reason / justification"
                value={asset.assetReasonDetail}
                onChange={(e) => onUpdate({ assetReasonDetail: e.currentTarget.value })}
                placeholder="Add the justification for this asset's decision…"
                minRows={2}
                radius="md"
              />
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
}

