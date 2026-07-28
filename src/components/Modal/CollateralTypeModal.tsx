import { useState } from "react";
import {
  Modal,
  Box,
  Text,
  TextInput,
  NumberInput,
  Checkbox,
  Button,
} from "@mantine/core";
import { IconCategory, IconX, IconPercentage } from "@tabler/icons-react";

interface CollateralTypeModalProps {
  opened: boolean;
  onClose: () => void;
}

const labelClass = { label: "text-sm font-medium text-gray-700 mb-1" };

export function CollateralTypeModal({ opened, onClose }: CollateralTypeModalProps) {
  const [formData, setFormData] = useState({
    type: "",
    haircut: 0,
    ltv: "" as number | "",
    disabled: false,
  });

  const handleReset = () => {
    setFormData({
      type: "",
      haircut: 0,
      ltv: "",
      disabled: false,
    });
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
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
                New Collateral Type
              </Text>
              <Text size="xs" c="dimmed">
                Define collateral category parameters and limits.
              </Text>
            </div>
          </div>
          <Button variant="subtle" color="gray" onClick={handleClose} className="px-2" size="xs">
            <IconX size={18} />
          </Button>
        </div>

        <div className="border-b border-gray-200" />

        {/* Body */}
        <div className="flex-1 p-6">
          <div className="flex flex-wrap sm:flex-nowrap items-end gap-5">
            <TextInput
              size="xs"
              label="Collateral Type"
              placeholder="e.g. Real Estate"
              withAsterisk
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.currentTarget.value })}
              classNames={labelClass}
              className="flex-1"
            />

            <NumberInput
              size="xs"
              label="Haircut %"
              placeholder="0.000"
              decimalScale={3}
              fixedDecimalScale
              hideControls
              value={formData.haircut}
              onChange={(v) => setFormData({ ...formData, haircut: v as number })}
              rightSection={<IconPercentage size={13} className="text-gray-400" />}
              classNames={labelClass}
              className="flex-1"
            />

            <NumberInput
              size="xs"
              label="Loan To Value Ratio"
              placeholder="0.00"
              hideControls
              value={formData.ltv}
              onChange={(v) => setFormData({ ...formData, ltv: v as number })}
              rightSection={<IconPercentage size={13} className="text-gray-400" />}
              classNames={labelClass}
              className="flex-1"
            />

            <div className="pb-[6px]">
              <Checkbox
                size="xs"
                label="Disabled"
                color="indigo"
                checked={formData.disabled}
                onChange={(e) => setFormData({ ...formData, disabled: e.currentTarget.checked })}
                styles={{ label: { color: '#374151', fontWeight: 500 } }}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 px-6 flex justify-between items-center shrink-0 bg-gray-50/50">
          <Button size="xs" variant="default" onClick={handleClose} className="font-semibold px-5">
            Cancel
          </Button>
          
          <Button
            size="xs"
            onClick={() => {
              // Save logic here
              onClose();
            }}
            className="bg-gradient-to-r from-[#6366F1] to-[#7C3AED] hover:opacity-90 font-semibold px-6"
          >
            Save Type
          </Button>
        </div>
      </Box>
    </Modal>
  );
}