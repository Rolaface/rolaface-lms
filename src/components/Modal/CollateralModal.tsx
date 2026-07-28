import { useState } from "react";
import {
  Modal,
  Box,
  Text,
  TextInput,
  NumberInput,
  Select,
  Checkbox,
  Button,
} from "@mantine/core";
import { IconBriefcase, IconX, IconPercentage, IconChevronDown } from "@tabler/icons-react";

interface CollateralModalProps {
  opened: boolean;
  onClose: () => void;
}

const labelClass = { label: "text-sm font-medium text-gray-700 mb-1" };

export function CollateralModal({ opened, onClose }: CollateralModalProps) {
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    type: "",
    haircut: 0,
    originalValue: "" as number | "",
    ltv: "" as number | "",
    disabled: false,
  });

  const handleReset = () => {
    setFormData({
      code: "",
      name: "",
      type: "",
      haircut: 0,
      originalValue: "",
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
      size="750px"
      withCloseButton={false}
      padding={0}
      radius="md"
    >
      <Box className="flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-[#6366F1] to-[#7C3AED] flex items-center justify-center">
              <IconBriefcase size={20} className="text-white" />
            </div>
            <div>
              <Text size="md" fw={700} className="text-gray-900 leading-tight">
                New Collateral
              </Text>
              <Text size="xs" c="dimmed">
                Define collateral details, valuation metrics, and status.
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
          <div className="grid grid-cols-2 gap-x-8 gap-y-5">
            <TextInput
              size="xs"
              label="Collateral Code"
              placeholder="Enter code"
              withAsterisk
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.currentTarget.value })}
              classNames={labelClass}
            />

            <Select
              size="xs"
              label="Collateral Type"
              placeholder="Select type"
              withAsterisk
              data={[
                "Real Estate",
                "Vehicles",
                "Government Bonds",
                "Shares/Equities",
                "Cash Deposits",
              ]}
              searchable
              rightSection={<IconChevronDown size={14} className="text-gray-500" />}
              value={formData.type}
              onChange={(v) => setFormData({ ...formData, type: v || "" })}
              classNames={labelClass}
            />

            <div className="col-span-2">
              <TextInput
                size="xs"
                label="Collateral Name"
                placeholder="Enter full name"
                withAsterisk
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.currentTarget.value })}
                classNames={labelClass}
              />
            </div>

            <NumberInput
              size="xs"
              label="Original Collateral Value"
              placeholder="0.00"
              thousandSeparator=","
              hideControls
              value={formData.originalValue}
              onChange={(v) => setFormData({ ...formData, originalValue: v as number })}
              classNames={labelClass}
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
            />

            {/* Checkbox aligned nicely with the other inputs */}
            <div className="flex items-center pt-6">
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
            Save Collateral
          </Button>
        </div>
      </Box>
    </Modal>
  );
}