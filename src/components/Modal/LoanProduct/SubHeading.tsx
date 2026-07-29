import { Text } from "@mantine/core";
import { theme } from "./Constants";

export const SubHeading = ({ children, color = "brand" }: { children: React.ReactNode; color?: "brand" | "danger" }) => {
  const c = theme[color];
  return (
    <Text size="xs" fw={700} className="uppercase tracking-wide mb-0" style={{ color: (c as any)[6] ?? c[5] }}>
      {children}
    </Text>
  );
};