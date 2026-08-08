import { ThemeIcon, type MantineColor } from "@mantine/core";
import type { ComponentType } from "react";

interface FieldIconProps {
  Icon: ComponentType<{ size?: number }>;
  color: MantineColor;
}

export function FieldIcon({ Icon, color }: FieldIconProps) {
  return (
    <ThemeIcon variant="light" color={color} radius="md" size={30}>
      <Icon size={15} />
    </ThemeIcon>
  );
}