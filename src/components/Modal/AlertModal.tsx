import { Alert, Button, Group, Stack, Text, Box, ActionIcon } from "@mantine/core";
import {
  IconAlertCircle,
  IconAlertTriangle,
  IconAlertOctagon,
  IconInfoCircle,
  IconCircleCheck,
  IconX,
} from "@tabler/icons-react";
import { modals } from "@mantine/modals";
import type { ReactNode } from "react";

interface ModalButton {
  label: string;
  color?: string;
  variant?: "filled" | "light" | "outline" | "subtle" | "default";
  onClick?: () => void;
}

interface CommonModalProps {
  heading: string;
  subtitle?: string;
  body: ReactNode;
  color?: string;
  icon?: ReactNode;
  buttons: ModalButton[];
}

// color prop -> { icon, hex }. Aliases map to the same theme so any
// existing string ("red"/"danger", "green"/"teal"/"success", etc.) works.
const THEMES: Record<string, { icon: ReactNode; hex: string }> = {
  red: { icon: <IconAlertOctagon size={34} />, hex: "#E03131" },
  danger: { icon: <IconAlertOctagon size={34} />, hex: "#E03131" },
  orange: { icon: <IconAlertTriangle size={34} />, hex: "#F08C00" },
  yellow: { icon: <IconAlertTriangle size={34} />, hex: "#F08C00" },
  warning: { icon: <IconAlertTriangle size={34} />, hex: "#F08C00" },
  blue: { icon: <IconInfoCircle size={34} />, hex: "#1971C2" },
  info: { icon: <IconInfoCircle size={34} />, hex: "#1971C2" },
  teal: { icon: <IconCircleCheck size={34} />, hex: "#2F9E44" },
  green: { icon: <IconCircleCheck size={34} />, hex: "#2F9E44" },
  success: { icon: <IconCircleCheck size={34} />, hex: "#2F9E44" },
};
const DEFAULT_THEME = { icon: <IconAlertCircle size={34} />, hex: "#495057" };

export const openCommonModal = ({
  heading,
  subtitle,
  body,
  color = "blue",
  icon,
  buttons,
}: CommonModalProps) => {
  const { icon: themeIcon, hex } = THEMES[color?.toLowerCase()] ?? DEFAULT_THEME;
  let modalId: string;

  modalId = modals.open({
    centered: true,
      zIndex: 10000,
    withCloseButton: false,
    size: "md",
    radius: "lg",
    padding: 0,
    overlayProps: { backgroundOpacity: 0.55, blur: 3 },
    styles: {
      body: { padding: 0 },
      content: { overflow: "hidden", borderTop: `4px solid ${hex}` },
    },
    children: (
      <Stack gap={0}>
        <Box
          pos="relative"
          pt={44}
          pb={24}
          style={{
            background: `linear-gradient(to bottom, ${hex}4D 0%, ${hex}26 40%, ${hex}00 100%)`,
          }}
        >
          <ActionIcon
            variant="subtle"
            color="gray"
            radius="xl"
            onClick={() => modals.close(modalId)}
            style={{ position: "absolute", top: 16, right: 16 }}
            aria-label="Close"
          >
            <IconX size={18} />
          </ActionIcon>

          <Box
            mx="auto"
            style={{
              width: 84,
              height: 84,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              clipPath: "polygon(25% 3%,75% 3%,100% 50%,75% 97%,25% 97%,0% 50%)",
              background: `${hex}33`,
              boxShadow: `0 0 32px 8px ${hex}40`,
              color: hex,
            }}
          >
            {icon ?? themeIcon}
          </Box>
        </Box>

        <Stack align="center" gap="md" px="xl" pb="xl">
          <Stack gap={4} align="center">
            <Text fw={700} size="xl" ta="center">{heading}</Text>
            {subtitle && <Text size="sm" c="dimmed" ta="center">{subtitle}</Text>}
          </Stack>

          <Alert
            color={color}
            variant="light"
            radius="md"
            w="100%"
            icon={<IconAlertCircle size={20} />}
            styles={{ root: { background: `${hex}0D`, border: `1px solid ${hex}26` } }}
          >
            <Text size="sm">{body}</Text>
          </Alert>

          <Group justify="flex-end" w="100%" mt="sm">
            {buttons.map((btn, i) => (
              <Button
                key={i}
                color={btn.color ?? color}
                variant={btn.variant ?? "filled"}
                radius="md"
                onClick={() => {
                  modals.close(modalId);
                  btn.onClick?.();
                }}
              >
                {btn.label}
              </Button>
            ))}
          </Group>
        </Stack>
      </Stack>
    ),
  });

  return modalId;
};