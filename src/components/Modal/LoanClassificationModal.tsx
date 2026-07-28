import { useEffect, useState } from "react";
import { Modal, Box, Text, TextInput, Button } from "@mantine/core";
import { IconCategory, IconX } from "@tabler/icons-react";

export interface LoanClassificationData {
  level?: number;
  code: string;
  name: string;
  min_dpd_range: number | null;
  max_dpd_range: number | null;
  provision_rate: number;
}

interface LoanClassificationModalProps {
  opened: boolean;
  onClose: () => void;
  mode?: "add" | "edit" | "view";
  data?: LoanClassificationData | null;
}

const labelClass = { label: "text-sm font-medium text-gray-700 mb-1" };

export function LoanClassificationModal({
  opened,
  onClose,
  mode = "add",
  data = null,
}: LoanClassificationModalProps) {
  const isView = mode === "view";

  const title =
    mode === "add"
      ? "New Loan Classification"
      : mode === "edit"
      ? "Edit Loan Classification"
      : "Classification Details";

  const description =
    mode === "view"
      ? "Viewing classification rules & provisioning details."
      : "Define classification rules & provisioning criteria.";

  const [formData, setFormData] = useState({
    code: "",
    name: "",
    provision_rate: "",
    min_dpd_range: "",
    max_dpd_range: "",
  });

  useEffect(() => {
    if (opened && data) {
      setFormData({
        code: data.code ?? "",
        name: data.name ?? "",
        provision_rate: data.provision_rate != null ? String(data.provision_rate) : "",
        min_dpd_range: data.min_dpd_range != null ? String(data.min_dpd_range) : "",
        max_dpd_range: data.max_dpd_range != null ? String(data.max_dpd_range) : "",
      });
    } else if (opened) {
      setFormData({
        code: "",
        name: "",
        provision_rate: "",
        min_dpd_range: "",
        max_dpd_range: "",
      });
    }
  }, [opened, data]);

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      size="850px"
      withCloseButton={false}
      padding={0}
      radius="md"
    >
      <Box className="flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-[#6366F1] to-[#7C3AED] flex items-center justify-center">
              <IconCategory size={20} className="text-white" />
            </div>
            <div>
              <Text size="md" fw={700} className="text-gray-900 leading-tight">
                {title}
              </Text>
              <Text size="xs" c="dimmed">
                {description}
              </Text>
            </div>
          </div>
          <Button variant="subtle" color="gray" onClick={onClose} className="px-2" size="xs">
            <IconX size={18} />
          </Button>
        </div>

        <div className="border-b border-gray-200" />

        {/* Body */}
        <div className="flex-1 p-6">
          <div className="grid grid-cols-12 gap-5">
            <div className="col-span-2">
              <TextInput
                size="xs"
                label="Code"
                placeholder="STD"
                withAsterisk={!isView}
                value={formData.code}
                readOnly={isView}
                variant={isView ? "filled" : "default"}
                classNames={labelClass}
                onChange={(e) => setFormData({ ...formData, code: e.currentTarget.value })}
              />
            </div>

            <div className="col-span-4">
              <TextInput
                size="xs"
                label="Classification Name"
                placeholder="e.g. Standard"
                withAsterisk={!isView}
                value={formData.name}
                readOnly={isView}
                variant={isView ? "filled" : "default"}
                classNames={labelClass}
                onChange={(e) => setFormData({ ...formData, name: e.currentTarget.value })}
              />
            </div>

            <div className="col-span-2">
              <TextInput
                size="xs"
                label="Rate (%)"
                placeholder="0.00"
                rightSection={
                  <Text size="xs" c="dimmed" fw={600}>
                    %
                  </Text>
                }
                withAsterisk={!isView}
                value={formData.provision_rate}
                readOnly={isView}
                variant={isView ? "filled" : "default"}
                classNames={labelClass}
                onChange={(e) => setFormData({ ...formData, provision_rate: e.currentTarget.value })}
              />
            </div>

            <div className="col-span-2">
              <TextInput
                size="xs"
                label="Min DPD"
                placeholder="0"
                value={formData.min_dpd_range}
                readOnly={isView}
                variant={isView ? "filled" : "default"}
                classNames={labelClass}
                onChange={(e) => setFormData({ ...formData, min_dpd_range: e.currentTarget.value })}
              />
            </div>

            <div className="col-span-2">
              <TextInput
                size="xs"
                label="Max DPD"
                placeholder="30"
                value={formData.max_dpd_range}
                readOnly={isView}
                variant={isView ? "filled" : "default"}
                classNames={labelClass}
                onChange={(e) => setFormData({ ...formData, max_dpd_range: e.currentTarget.value })}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 px-6 flex justify-between items-center shrink-0 bg-gray-50/50">
          <Button size="xs" variant="default" onClick={onClose} className="font-semibold px-5">
            {isView ? "Close" : "Cancel"}
          </Button>

          {!isView && (
            <Button
              size="xs"
              onClick={() => {
                onClose();
              }}
              className="bg-gradient-to-r from-[#6366F1] to-[#7C3AED] hover:opacity-90 font-semibold px-6"
            >
              Save Changes
            </Button>
          )}
        </div>
      </Box>
    </Modal>
  );
}