import {
  Alert,
  Button,
  Group,
  Stack,
  Text,
  ThemeIcon,
  ActionIcon,
} from "@mantine/core";
import {
  IconAlertCircle,
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

export const openCommonModal = ({
  heading,
  subtitle,
  body,
  color = "blue",
  icon,
  buttons,
}: CommonModalProps) => {
  let modalId: string;

  modalId = modals.open({
    centered: true,
    withCloseButton: false,
    size: "md",
    radius: "lg",
    padding: "xl",

    overlayProps: {
      backgroundOpacity: 0.55,
      blur: 3,
    },

    children: (
      <Stack
        align="center"
        gap="md"
        pos="relative"
      >
        {/* Top Right Close */}
        <ActionIcon
          variant="subtle"
          color="gray"
          size="md"
          radius="xl"
          onClick={() => modals.close(modalId)}
          style={{
            position: "absolute",
            top: -8,
            right: -8,
          }}
          aria-label="Close"
        >
          <IconX size={18} />
        </ActionIcon>

        {/* Icon */}
        <ThemeIcon
          size={64}
          radius="xl"
          color={color}
          variant="light"
        >
          {icon ?? <IconAlertCircle size={36} />}
        </ThemeIcon>

        {/* Heading */}
        <Stack
          gap={4}
          align="center"
        >
          <Text
            fw={700}
            size="lg"
          >
            {heading}
          </Text>
<Text
  size="sm"
  c="dimmed"
  ta="center"
>
  {subtitle}
</Text>
          <Text
            size="sm"
            c="dimmed"
            ta="center"
          >
            Please review the information below.
          </Text>
        </Stack>

        {/* Body */}
        <Alert
          color={color}
          variant="light"
          radius="md"
          w="100%"
          icon={<IconAlertCircle size={20} />}
        >
          <Text size="sm">
            {body}
          </Text>
        </Alert>

        {/* Buttons */}
        <Group
          justify="flex-end"
          w="100%"
          mt="sm"
        >
          {buttons.map((button, index) => (
            <Button
              key={index}
              color={button.color}
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
    ),
  });

  return modalId;
};