import {
  Alert,
  Button,
  Group,
  Stack,
  Text,
  Box,
  ActionIcon,
} from "@mantine/core";
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

/* ------------------------------------------------------------------ */
/*  Color -> alert "type" mapping.                                     */
/*  Same `color` prop as before (e.g. "red", "orange", "blue", "teal") */
/*  now automatically drives the icon + badge label + hex used for the */
/*  glow/callout tint — no call-site changes needed.                   */
/* ------------------------------------------------------------------ */

const TYPE_BY_COLOR: Record<
  string,
  { label: string; icon: ReactNode; hex: string }
> = {
  red: {
    label: "Danger",
    icon: <IconAlertOctagon size={34} stroke={2.2} />,
    hex: "#E03131",
  },
  orange: {
    label: "Warning",
    icon: <IconAlertTriangle size={34} stroke={2.2} />,
    hex: "#F08C00",
  },
  yellow: {
    label: "Warning",
    icon: <IconAlertTriangle size={34} stroke={2.2} />,
    hex: "#F5A623",
  },
  blue: {
    label: "Info",
    icon: <IconInfoCircle size={34} stroke={2.2} />,
    hex: "#1971C2",
  },
  teal: {
    label: "Success",
    icon: <IconCircleCheck size={34} stroke={2.2} />,
    hex: "#0CA678",
  },
  green: {
    label: "Success",
    icon: <IconCircleCheck size={34} stroke={2.2} />,
    hex: "#2F9E44",
  },
};

const DEFAULT_THEME = {
  label: "Notice",
  icon: <IconAlertCircle size={34} stroke={2.2} />,
  hex: "#495057",
};

export const openCommonModal = ({
  heading,
  subtitle,
  body,
  color = "blue",
  icon,
  buttons,
}: CommonModalProps) => {
  const theme = TYPE_BY_COLOR[color] ?? DEFAULT_THEME;
  let modalId: string;

  modalId = modals.open({
    centered: true,
    withCloseButton: false,
    size: "md",
    radius: "lg",
    padding: 0,
    overlayProps: {
      backgroundOpacity: 0.55,
      blur: 3,
    },
    styles: {
      body: { padding: 0 },
      content: { overflow: "hidden" },
    },

    children: (
      <Stack gap={0} pos="relative">
        {/* Top gradient zone with icon */}
        <Box
          pos="relative"
          pt={40}
          pb={20}
          style={{
            background: `radial-gradient(ellipse at center, ${theme.hex}22 0%, ${theme.hex}00 70%)`,
          }}
        >
          <ActionIcon
            variant="subtle"
            color="gray"
            size="md"
            radius="xl"
            onClick={() => modals.close(modalId)}
            style={{ position: "absolute", top: 16, right: 16 }}
            aria-label="Close"
          >
            <IconX size={18} />
          </ActionIcon>

          <Stack align="center" gap={0}>
            <Box
              style={{
                width: 84,
                height: 84,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                clipPath:
                  "polygon(25% 3%, 75% 3%, 100% 50%, 75% 97%, 25% 97%, 0% 50%)",
                background: `${theme.hex}1F`,
                boxShadow: `0 0 32px 6px ${theme.hex}33`,
                color: theme.hex,
              }}
            >
              {icon ?? theme.icon}
            </Box>
          </Stack>
        </Box>

        {/* Body */}
        <Stack align="center" gap="md" px="xl" pb="xl">
          {/* Badge */}
          <Box
            px="sm"
            py={4}
            style={{
              borderRadius: 999,
              background: `${theme.hex}14`,
              color: theme.hex,
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            {theme.label}
          </Box>

          {/* Heading + subtitle */}
          <Stack gap={4} align="center">
            <Text fw={700} size="xl" ta="center">
              {heading}
            </Text>
            {subtitle && (
              <Text size="sm" c="dimmed" ta="center">
                {subtitle}
              </Text>
            )}
          </Stack>

          {/* Original body content, now inside a tinted callout box */}
          <Alert
            color={color}
            variant="light"
            radius="md"
            w="100%"
            icon={<IconAlertCircle size={20} />}
            styles={{
              root: {
                background: `${theme.hex}0D`,
                border: `1px solid ${theme.hex}26`,
              },
            }}
          >
            <Text size="sm">{body}</Text>
          </Alert>

          {/* Buttons — unchanged behavior/props */}
          <Group justify="flex-end" w="100%" mt="sm">
            {buttons.map((button, index) => (
              <Button
                key={index}
                color={button.color ?? color}
                variant={button.variant ?? "filled"}
                radius="md"
                onClick={() => {
                  modals.close(modalId);
                  button.onClick?.();
                }}
              >
                {button.label}
              </Button>
            ))}
          </Group>
        </Stack>
      </Stack>
    ),
  });

  return modalId;
};