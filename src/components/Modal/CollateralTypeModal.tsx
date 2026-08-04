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
import { createLoanSecurityType } from '../../api/Collateral/loanSecurityTypeApi';

interface CollateralTypeModalProps {
  opened: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  typeId?: string | null;
  isViewMode?: boolean;
}

const labelClass = { label: "text-sm font-medium text-gray-700 mb-1" };

export function CollateralTypeModal({ opened, onClose, onSuccess, typeId, isViewMode }: CollateralTypeModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  const handleSave = async () => {
    if (!formData.type) return; 
    setIsSubmitting(true);
    
    try {
      const payload = {
        loan_security_type: formData.type,
        haircut: formData.haircut || 0,
        loan_to_value_ratio: Number(formData.ltv) || 0,
        disabled: formData.disabled ? (1 as 1 | 0) : (0 as 1 | 0),
      };

      const res = await createLoanSecurityType(payload);
      
      // FIX: Handle Frappe's default { message: { ... } } wrapper 
      // in case Axios hasn't unwrapped it.
      const responseData = (res as any).message || res;

      if (
        responseData?.status === "success" || 
        responseData?.status_code === 201 || 
        responseData?.status_code === 200
      ) {
        // Trigger table refresh
        if (onSuccess) {
          onSuccess();
        }
        // Close modal and reset form
        handleClose();
      } else {
        console.error("Failed to save, unexpected response:", res);
      }
    } catch (error) {
      console.error("Error saving collateral type:", error);
    } finally {
      setIsSubmitting(false);
    }
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
                {typeId ? (isViewMode ? "View Collateral Type" : "Edit Collateral Type") : "New Collateral Type"}
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
              disabled={isViewMode}
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
              disabled={isViewMode}
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
              disabled={isViewMode}
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
                disabled={isViewMode}
                checked={formData.disabled}
                onChange={(e) => setFormData({ ...formData, disabled: e.currentTarget.checked })}
                styles={{ label: { color: '#374151', fontWeight: 500 } }}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        {!isViewMode && (
          <div className="border-t border-gray-200 p-4 px-6 flex justify-between items-center shrink-0 bg-gray-50/50">
            <Button size="xs" variant="default" onClick={handleClose} className="font-semibold px-5" disabled={isSubmitting}>
              Cancel
            </Button>
            
            <Button
              size="xs"
              onClick={handleSave}
              loading={isSubmitting}
              disabled={!formData.type}
              className="bg-gradient-to-r from-[#6366F1] to-[#7C3AED] hover:opacity-90 font-semibold px-6"
            >
              Save Type
            </Button>
          </div>
        )}
      </Box>
    </Modal>
  );
}