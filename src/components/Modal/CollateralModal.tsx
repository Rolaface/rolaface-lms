import { useState, useEffect } from "react";
import {
  Modal,
  Box,
  Text,
  TextInput,
  NumberInput,
  Select,
  Checkbox,
  Button,
  Loader,
  LoadingOverlay,
} from "@mantine/core";
import { IconBriefcase, IconX, IconPercentage, IconChevronDown } from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";

import { 
  createLoanSecurity, 
  updateLoanSecurity, 
  getLoanSecurityById 
} from "../../api/Collateral/loanSecurityApi";
import { getLoanSecurityType } from "../../api/lookupApi";

interface CollateralModalProps {
  opened: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  securityId?: string | null;
  isViewMode?: boolean;
}

const labelClass = { label: "text-sm font-medium text-gray-700 mb-1" };

export function CollateralModal({ opened, onClose, onSuccess, securityId, isViewMode }: CollateralModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetchingDetails, setIsFetchingDetails] = useState(false);

  const [formData, setFormData] = useState({
    code: "",
    name: "",
    type: "",
    haircut: 0,
    originalValue: "" as number | "",
    ltv: "" as number | "",
    disabled: false,
  });

  const { data: typeOptions = [], isLoading: isLoadingTypes } = useQuery({
    queryKey: ["lookup", "loanSecurityTypes"],
    queryFn: async () => {
      const res = await getLoanSecurityType();

      const payload =
        res?.data?.status === "success"
          ? res.data
          : res?.status === "success"
          ? res
          : res?.message?.status === "success"
          ? res.message
          : null;

      if (!payload || !Array.isArray(payload.data)) {
        return [];
      }

      return payload.data.map((item: any) => ({
        value: String(item.value),
        label: item.label || item.value,
      }));
    },
    enabled: opened,
  });

  useEffect(() => {
    if (opened && securityId) {
      const fetchDetails = async () => {
        setIsFetchingDetails(true);
        try {
          const res = await getLoanSecurityById(securityId);
          
          const itemData = res?.data?.data || res?.data || res?.message?.data || res;

          if (itemData) {
            setFormData({
              code: itemData.loan_security_code || "",
              name: itemData.loan_security_name || "",
              type: itemData.loan_security_type || "",
              haircut: itemData.haircut ?? 0,
              originalValue: itemData.original_security_value ?? "",
              ltv: itemData.loan_to_value_ratio ?? "",
              disabled: itemData.disabled === 1,
            });
          }
        } catch (error) {
          console.error("Failed to fetch collateral details", error);
        } finally {
          setIsFetchingDetails(false);
        }
      };
      
      fetchDetails();
    } else if (opened && !securityId) {
      handleReset();
    }
  }, [opened, securityId]);

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

  const handleSave = async () => {
    if (!formData.code || !formData.name || !formData.type) return; 
    setIsSubmitting(true);

    try {
      const payload = {
        loan_security_code: formData.code,
        loan_security_name: formData.name,
        loan_security_type: formData.type,
        original_security_value: Number(formData.originalValue) || 0,
        haircut: Number(formData.haircut) || 0,
        loan_to_value_ratio: Number(formData.ltv) || 0,
        disabled: formData.disabled ? (1 as 1 | 0) : (0 as 1 | 0),
      };

      let res;
      
      // Determine if we are updating or creating
      if (securityId) {
        res = await updateLoanSecurity({ id: securityId, payload });
      } else {
        res = await createLoanSecurity(payload);
      }
      
      const isSuccess = 
        res?.status === "success" || 
        res?.status_code === 200 || 
        res?.status_code === 201 ||
        res?.message?.status === "success" ||
        res?.message?.status_code === 200 ||
        res?.message?.status_code === 201;

      if (isSuccess) {
        if (onSuccess) onSuccess();
        handleClose();
      } else {
        console.error("Failed to save collateral:", res);
      }
    } catch (error) {
      console.error("Error saving collateral:", error);
    } finally {
      setIsSubmitting(false);
    }
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
      <Box className="flex flex-col relative">
        {/* Loading overlay blocks the UI while fetching existing item details */}
        <LoadingOverlay 
          visible={isFetchingDetails} 
          zIndex={1000} 
          overlayProps={{ radius: "sm", blur: 2 }} 
        />
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-[#6366F1] to-[#7C3AED] flex items-center justify-center">
              <IconBriefcase size={20} className="text-white" />
            </div>
            <div>
              <Text size="md" fw={700} className="text-gray-900 leading-tight">
                {securityId ? (isViewMode ? "View Collateral" : "Edit Collateral") : "New Collateral"}
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
              disabled={isViewMode || !!securityId} // Cannot edit code after creation based on standard ERP practice
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.currentTarget.value })}
              classNames={labelClass}
            />

            <Select
              size="xs"
              label="Collateral Type"
              placeholder={isLoadingTypes ? "Loading types..." : "Select type"}
              withAsterisk
              disabled={isViewMode || isLoadingTypes}
              data={typeOptions}
              searchable
              clearable
              rightSection={
                isLoadingTypes ? (
                  <Loader size={14} color="gray" />
                ) : (
                  <IconChevronDown size={14} className="text-gray-500" />
                )
              }
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
                disabled={isViewMode}
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
              disabled={isViewMode}
              value={formData.originalValue}
              onChange={(v) => setFormData({ ...formData, originalValue: v as number })}
              classNames={labelClass}
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
            />

            <div className="flex items-center pt-6">
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
              disabled={!formData.code || !formData.name || !formData.type}
              className="bg-gradient-to-r from-[#6366F1] to-[#7C3AED] hover:opacity-90 font-semibold px-6"
            >
              Save Collateral
            </Button>
          </div>
        )}
      </Box>
    </Modal>
  );
}