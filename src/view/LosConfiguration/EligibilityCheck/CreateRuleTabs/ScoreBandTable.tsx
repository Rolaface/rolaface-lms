import { useState } from "react";
import {
  ActionIcon,
  Box,
  Button,
  Group,
  NumberInput,
  Select,
  Stack,
  Text,
  TextInput,
  Title,
  Tooltip,
} from "@mantine/core";
import { IconAlertTriangle, IconPlus, IconTrash } from "@tabler/icons-react";
import {
  DECISION_COLOR,
  DECISION_OPTIONS,
  MULTIPLE_BASIS_OPTIONS,
  bandConflicts,
  bandNeedsLimit,
  bandRangeLabel,
  isFilled,
  newBand,
  sortBands,
  type BandScale,
  type CreditBand,
} from "./Ruleshared";

interface ScoreBandTableProps {
  title: string;
  description: string;
  scoreLabel: string;
  bands: CreditBand[];
  onChange: (bands: CreditBand[]) => void;
  scale: BandScale;
  idPrefix: string;
}

const COLUMNS = "84px 116px 104px minmax(250px, 1.5fr) minmax(170px, 1fr) 30px";

const headLabel = {
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: "0.04em",
  textTransform: "uppercase" as const,
  color: "var(--mantine-color-slate-5)",
};

const FIELD = {
  input: { height: 30, minHeight: 30, fontSize: 12.5, borderRadius: 8 },
};

const colorOf = (decision: string) => DECISION_COLOR[decision] ?? "slate";

function BandRow({
  band,
  bands,
  scale,
  autoFocus,
  onPatch,
  onSort,
  onRemove,
}: {
  band: CreditBand;
  bands: CreditBand[];
  scale: BandScale;
  autoFocus: boolean;
  onPatch: (patch: Partial<CreditBand>) => void;
  onSort: () => void;
  onRemove: () => void;
}) {
  const color = colorOf(band.decision);
  const conflicts = bandConflicts(band, bands, scale);
  const needsLimit = bandNeedsLimit(band);

  return (
    <Box
      style={{
        background: "var(--mantine-color-white)",
        border: `1px solid var(--mantine-color-${conflicts.length ? "danger-3" : "slate-2"})`,
        borderLeft: `3px solid var(--mantine-color-${color}-${band.decision ? 5 : 3})`,
        borderRadius: "var(--mantine-radius-md)",
        boxShadow: "var(--mantine-shadow-xs)",
        padding: "8px 10px",
      }}
    >
      <Box
        style={{
          display: "grid",
          gridTemplateColumns: COLUMNS,
          gap: 10,
          alignItems: "center",
        }}
      >
        <TextInput
          aria-label="Grade"
          placeholder="A"
          value={band.grade}
          maxLength={10}
          autoFocus={autoFocus}
          onChange={(e) => onPatch({ grade: e.currentTarget.value })}
          styles={{
            input: { ...FIELD.input, textAlign: "center", fontWeight: 700 },
          }}
        />
        <NumberInput
          aria-label="Minimum score"
          placeholder={String(scale.min)}
          value={band.min}
          onChange={(v) => onPatch({ min: v })}
          onBlur={onSort}
          allowNegative={false}
          allowDecimal={false}
          {...(scale.strict && {
            min: scale.min,
            max: scale.max,
            clampBehavior: "strict" as const,
          })}
          hideControls
          styles={{ input: { ...FIELD.input, fontWeight: 600 } }}
        />
        <Text
          fz={12}
          c={isFilled(band.min) ? "slate.7" : "slate.4"}
          fw={500}
          style={{ fontVariantNumeric: "tabular-nums" }}
        >
          {bandRangeLabel(band, bands, scale)}
        </Text>
        {needsLimit ? (
          <Group gap={6} wrap="nowrap">
            <NumberInput
              aria-label="Multiple"
              placeholder="0"
              value={band.multiple}
              onChange={(v) => onPatch({ multiple: v })}
              allowNegative={false}
              decimalScale={2}
              hideControls
              rightSection={
                <Text fz={11} c="slate.5">
                  ×
                </Text>
              }
              rightSectionWidth={22}
              w={84}
              styles={{ input: { ...FIELD.input, fontWeight: 600 } }}
            />
            <Select
              aria-label="Basis"
              placeholder="Basis"
              data={MULTIPLE_BASIS_OPTIONS}
              value={band.basis || null}
              onChange={(v) => onPatch({ basis: v ?? "" })}
              allowDeselect={false}
              styles={FIELD}
              style={{ flex: 1, minWidth: 0 }}
            />
          </Group>
        ) : (
          <Text fz={12} c="slate.4">
            No limit — declined
          </Text>
        )}
        <Select
          aria-label="Decision"
          placeholder="Decision"
          data={DECISION_OPTIONS}
          value={band.decision || null}
          onChange={(v) =>
            onPatch(
              v === "Decline"
                ? { decision: v, multiple: "", basis: "" }
                : { decision: v ?? "" },
            )
          }
          allowDeselect={false}
          leftSection={
            <Box
              style={{
                width: 8,
                height: 8,
                borderRadius: 99,
                background: `var(--mantine-color-${color}-${band.decision ? 5 : 3})`,
              }}
            />
          }
          leftSectionWidth={26}
          styles={{
            input: { ...FIELD.input, fontWeight: band.decision ? 600 : 400 },
          }}
        />
        <Tooltip label="Remove band" withArrow>
          <ActionIcon
            variant="subtle"
            color="slate"
            size="sm"
            radius="xl"
            onClick={onRemove}
            aria-label="Remove band"
          >
            <IconTrash size={14} />
          </ActionIcon>
        </Tooltip>
      </Box>
      {conflicts.length > 0 && (
        <Group gap={6} mt={6} wrap="nowrap">
          <IconAlertTriangle
            size={12}
            color="var(--mantine-color-danger-6)"
            style={{ flexShrink: 0 }}
          />
          <Text fz={11} c="danger.7">
            {conflicts.join(" · ")}
          </Text>
        </Group>
      )}
    </Box>
  );
}

export function ScoreBandTable({
  title,
  description,
  scoreLabel,
  bands,
  onChange,
  scale,
  idPrefix,
}: ScoreBandTableProps) {
  const [addedId, setAddedId] = useState<string | null>(null);

  const patchBand = (id: string, patch: Partial<CreditBand>) =>
    onChange(bands.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  const addBand = () => {
    const band = newBand(idPrefix);
    setAddedId(band.id);
    onChange([...bands, band]);
  };
  const removeBand = (id: string) => onChange(bands.filter((b) => b.id !== id));
  const sort = () => {
    const sorted = sortBands(bands);
    if (sorted.some((b, i) => b.id !== bands[i].id)) onChange(sorted);
  };

  return (
    <Box>
      <Box
        py={6}
        px={8}
        mb="sm"
        style={{ borderBottom: "1px solid var(--mantine-color-slate-2)" }}
      >
        <Title order={6} c="slate.8" fw={600} mb={1}>
          {title}
        </Title>
        <Text fz={10} c="slate.5">
          {description}
        </Text>
      </Box>

      <Box style={{ overflowX: "auto" }}>
        <Stack gap={6} miw={760}>
          <Box
            style={{
              display: "grid",
              gridTemplateColumns: COLUMNS,
              gap: 10,
              padding: "0 10px 0 13px",
            }}
          >
            {[
              "Grade",
              `Min ${scoreLabel.toLowerCase()}`,
              "Range",
              "Credit limit",
              "Decision",
              "",
            ].map((h, i) => (
              <Text key={i} style={headLabel}>
                {h}
              </Text>
            ))}
          </Box>
          {bands.length === 0 && (
            <Text fz={11} c="slate.5" ta="center" py="sm">
              No bands yet.
            </Text>
          )}
          {bands.map((band) => (
            <BandRow
              key={band.id}
              band={band}
              bands={bands}
              scale={scale}
              autoFocus={band.id === addedId}
              onPatch={(patch) => patchBand(band.id, patch)}
              onSort={sort}
              onRemove={() => removeBand(band.id)}
            />
          ))}
        </Stack>
      </Box>

      <Group mt="xs">
        <Button
          variant="subtle"
          color="slate"
          size="xs"
          leftSection={<IconPlus size={12} />}
          onClick={addBand}
        >
          Add band
        </Button>
      </Group>
    </Box>
  );
}
