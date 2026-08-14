import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Alert, Box, Button, Group, Modal, Select, Stack, Text, ActionIcon } from "@mantine/core";
import { IconBuildingBank, IconX, IconAlertCircle } from "@tabler/icons-react";
import { getAllLoanProducts } from "../../api/productApi";

const hex = "#1971C2"; // same "info/blue" theme hex used in AlertModal.tsx

interface CreateLoanBookingModalProps {
  opened: boolean;
  applicationId: string | null;
  onClose: () => void;
  onConfirm: (loanProduct: string) => void;
  isSubmitting?: boolean;
}

export function CreateLoanBookingModal({
  opened,
  applicationId,
  onClose,
  onConfirm,
  isSubmitting,
}: CreateLoanBookingModalProps) {
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);

  const { data: productsResponse, isLoading } = useQuery({
    queryKey: ["loan-products"],
    queryFn: getAllLoanProducts,
    enabled: opened,
  });

  const products = productsResponse?.data ?? [];
  const productOptions = products.map((p: any) => ({
    value: p.name,
    label: `${p.product_name} (${p.product_code})`,
  }));

  useEffect(() => {
    if (!opened) setSelectedProduct(null);
  }, [opened]);

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      centered
      withCloseButton={false}
      size="md"
      radius="lg"
      padding={0}
      overlayProps={{ backgroundOpacity: 0.55, blur: 3 }}
      styles={{
        body: { padding: 0 },
        content: { overflow: "hidden", borderTop: `4px solid ${hex}` },
      }}
    >
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
            onClick={onClose}
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
            <IconBuildingBank size={34} />
          </Box>
        </Box>

        <Stack align="center" gap="md" px="xl" pb="xl">
          <Stack gap={4} align="center">
            <Text fw={700} size="xl" ta="center">
              Want to create a loan?
            </Text>
            <Text size="sm" c="dimmed" ta="center">
              Select the loan product to use for{" "}
              <Text span fw={600} c="dark">
                {applicationId}
              </Text>
            </Text>
          </Stack>

          <Alert
            color="blue"
            variant="light"
            radius="md"
            w="100%"
            icon={<IconAlertCircle size={20} />}
            styles={{ root: { background: `${hex}0D`, border: `1px solid ${hex}26` } }}
          >
            <Text size="sm">
              This will convert the application into a Loan Booking using the product selected below.
            </Text>
          </Alert>

          <Select
            w="100%"
            radius="md"
            label="Loan Product"
            placeholder={isLoading ? "Loading products..." : "Select a loan product"}
            data={productOptions}
            value={selectedProduct}
            onChange={setSelectedProduct}
            searchable
            disabled={isLoading}
            required
          />

          <Group justify="flex-end" w="100%" mt="sm">
            <Button variant="default" radius="md" onClick={onClose}>
              Cancel
            </Button>
            <Button
              color="blue"
              radius="md"
              disabled={!selectedProduct}
              loading={isSubmitting}
              onClick={() => selectedProduct && onConfirm(selectedProduct)}
            >
              Create Loan
            </Button>
          </Group>
        </Stack>
      </Stack>
    </Modal>
  );
}