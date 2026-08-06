import { Text, Paper, ThemeIcon, Badge, Group, Box, Button } from "@mantine/core";
import type { ButtonProps } from "@mantine/core";
import { IconChevronUp } from "@tabler/icons-react";
import { colorVar } from "../../../utils/customer/utils";
import type { ChipColor } from "../../../types/customer/types";



export const FieldLabel = ({
  text,
  tag,
  tone = "muted",
}: {
  text: string;
  tag?: string;
  tone?: "required" | "muted";
}) => (
  <Group gap="xs" wrap="nowrap" component="span" style={{ display: "inline-flex" }}>
    <Text span size="sm" fw={600} c="dark.7" style={{ whiteSpace: "nowrap" }}>
      {text}
    </Text>
    <Text
      span
      size="xs"
      fw={500}
      c={tag ? (tone === "required" ? "danger.7" : "dimmed") : undefined}
      style={{ whiteSpace: "nowrap", visibility: tag ? "visible" : "hidden" }}
    >
      {tag || "\u00b7"}
    </Text>
  </Group>
);

export const IconChip = ({
  icon: Icon,
  color = "brand",
}: {
  icon: React.ComponentType<{ size?: number }>;
  color?: ChipColor;
}) => (
  <ThemeIcon
    radius={0}
    variant="light"
    color={color}
    size={38}
    style={{ borderRight: `1px solid ${colorVar(color, 1)}` }}
  >
    <Icon size={16} />
  </ThemeIcon>
);

export const PlainCard = ({
  children,
  dense = false,
}: {
  children: React.ReactNode;
  dense?: boolean;
}) => (
  <Paper withBorder shadow="xs" radius="md" p={dense ? "sm" : "md"} bg="white">
    {children}
  </Paper>
);

const BADGE_COLOR: Record<string, ChipColor | "gray"> = {
  REQUIRED: "gold",
  OPTIONAL: "gray",
  "RUNS AUTOMATICALLY": "brand",
};

export const SectionHeader = ({
  icon: Icon,
  title,
  badge,
  description,
  accent = "brand",
  dense = false,
}: {
  icon: any;
  title: string;
  badge?: keyof typeof BADGE_COLOR;
  description?: string;
  accent?: ChipColor;
  dense?: boolean;
}) => (
  <Group
    justify="space-between"
    align="flex-start"
    pb={dense ? "xs" : "sm"}
    mb={dense ? "xs" : "sm"}
    style={{ borderBottom: "1px solid var(--mantine-color-gray-1)" }}
  >
    <Group align="flex-start" gap="sm" wrap="nowrap">
      <ThemeIcon radius="md" variant="light" color={accent} size={dense ? 24 : 28}>
        <Icon size={dense ? 14 : 16} />
      </ThemeIcon>
      <Box>
        <Group gap="xs">
          <Text size="sm" fw={800} c="dark.9">
            {title}
          </Text>
          {badge && (
            <Badge size="xs" radius="sm" color={BADGE_COLOR[badge]} variant="light" tt="uppercase">
              {badge}
            </Badge>
          )}
        </Group>
        {description && !dense && (
          <Text size="xs" c="dimmed" mt="xs">
            {description}
          </Text>
        )}
      </Box>
    </Group>
    <ThemeIcon variant="transparent" color="gray" size="sm" mt="xs">
      <IconChevronUp size={15} />
    </ThemeIcon>
  </Group>
);


type GradientButtonProps = ButtonProps & React.ComponentPropsWithoutRef<"button">;

export const GradientButton = (props: GradientButtonProps) => (
  <Button variant="gradient" gradient={{ from: "brand.5", to: "brand.7", deg: 135 }} {...props} />
);