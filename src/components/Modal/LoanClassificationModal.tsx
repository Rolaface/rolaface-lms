import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { LoanClassificationData } from '../../types/loanClassification';
import {
  createLoanClassification,
  updateLoanClassification,
} from "../../api/LoanClassificationApi"
import { parseFrappeError } from '../../utils/parseFrappeError';

// Re-exported so this stays a drop-in replacement even if some file still
// imports `LoanClassificationData` from this Modal file (old pattern).
export type { LoanClassificationData } from '../../types/loanClassification';

interface LoanClassificationModalProps {
  opened: boolean;
  onClose: () => void;
  mode?: "add" | "edit" | "view";
  data?: LoanClassificationData | null;
}

interface LoanClassificationFormState {
  level: string;
  code: string;
  name: string;
  min_dpd_range: string;
  max_dpd_range: string;
  provision_rate: string;
  is_written_off: boolean;
}

const EMPTY_FORM_STATE: LoanClassificationFormState = {
  level: '',
  code: '',
  name: '',
  min_dpd_range: '',
  max_dpd_range: '',
  provision_rate: '',
  is_written_off: false,
};

export function LoanClassificationModal({
  opened,
  onClose,
  mode = 'add',
  data = null,
}: LoanClassificationModalProps) {
  const isView = mode === 'view';
  const queryClient = useQueryClient();

  const title =
    mode === 'add'
      ? 'New Loan Classification'
      : mode === 'edit'
        ? 'Edit Loan Classification'
        : 'View Loan Classification';

  const [formData, setFormData] =
    useState<LoanClassificationFormState>(EMPTY_FORM_STATE);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (opened && data) {
      setFormData({
        level: data.level !== undefined && data.level !== null ? String(data.level) : '',
        code: data.code || '',
        name: data.name || '',
        min_dpd_range:
          data.min_dpd_range !== null
            ? String(data.min_dpd_range)
            : '',
        max_dpd_range:
          data.max_dpd_range !== null
            ? String(data.max_dpd_range)
            : '',
        provision_rate:
          data.provision_rate !== null
            ? String(data.provision_rate)
            : '',
        is_written_off: data.is_written_off || false,
      });
    } else if (opened && mode === 'add') {
      setFormData(EMPTY_FORM_STATE);
    }
    setFormError(null);
  }, [opened, data, mode]);

  const updateField = <K extends keyof LoanClassificationFormState>(
    field: K,
    value: LoanClassificationFormState[K],
  ) => {
    setFormData((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  // --- API mutations ---
  const createMutation = useMutation({
    mutationFn: (payload: LoanClassificationData) =>
      createLoanClassification(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loanClassifications'] });
      onClose();
    },
    onError: (err) => {
      console.error('Create loan classification failed:', err);
      setFormError(parseFrappeError(err));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: LoanClassificationData }) =>
      updateLoanClassification(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loanClassifications'] });
      onClose();
    },
    onError: (err) => {
      console.error('Update loan classification failed:', err);
      setFormError(parseFrappeError(err));
    },
  });

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const handleSave = () => {
    setFormError(null);

    if (formData.level === '') {
      setFormError('Level is required.');
      return;
    }
    if (!formData.code.trim() || !formData.name.trim()) {
      setFormError('Code and Name are required.');
      return;
    }
    if (formData.min_dpd_range === '' || formData.max_dpd_range === '') {
      setFormError('Min and Max DPD are required.');
      return;
    }
    if (Number(formData.max_dpd_range) < Number(formData.min_dpd_range)) {
      setFormError('Max DPD must be greater than or equal to Min DPD.');
      return;
    }
    if (formData.provision_rate === '') {
      setFormError('Provision rate is required.');
      return;
    }

    const payload: LoanClassificationData = {
      level: Number(formData.level),
      code: formData.code.trim(),
      name: formData.name.trim(),
      min_dpd_range: Number(formData.min_dpd_range),
      max_dpd_range: Number(formData.max_dpd_range),
      provision_rate: Number(formData.provision_rate),
      is_written_off: formData.is_written_off,
    };

    if (mode === 'edit' && data?.code) {
      updateMutation.mutate({ id: data.code, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  if (!opened) {
    return null;
  }

  return (
    <div
      className="
        fixed inset-0 z-50
        flex items-center justify-center
        bg-[#0b1c30]/50
        backdrop-blur-[2px]
        p-4
      "
      role="dialog"
      aria-modal="true"
    >
      {/* Modal Container */}
      <div
        className="
          relative
          flex
          w-full
          max-w-2xl
          flex-col
          overflow-hidden
          rounded-xl
          border
          border-[#e2e1ec]
          bg-white
          shadow-[0px_25px_50px_-12px_rgba(11,28,48,0.25)]
        "
      >
        {/* Header */}
        <div
          className="
            sticky
            top-0
            z-10
            flex
            items-center
            justify-between
            border-b
            border-[#e2e1ec]
            bg-white
            px-6
            py-5
          "
        >
          <h2
            className="
              text-lg
              font-semibold
              tracking-tight
              text-[#0b1c30]
            "
          >
            {title}
          </h2>

          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="
              flex
              h-8
              w-8
              items-center
              justify-center
              rounded-full
              text-[#777587]
              transition-colors
              hover:bg-[#f1f1f7]
              hover:text-[#0b1c30]
              focus:outline-none
              focus:ring-2
              focus:ring-[#3525cd]
            "
          >
            <span className="text-lg leading-none">×</span>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex flex-col gap-6 px-6 py-6">
          {/* Classification Identity */}
          <section className="flex flex-col gap-3 rounded-lg border border-[#e2e1ec] bg-[#f8f9ff] p-4">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-[#8886a0]">
              Classification Identity
            </span>

            <div className="grid grid-cols-[96px_1fr_1fr] gap-4">
              {/* Level */}
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="class-level"
                  className="text-xs font-medium text-[#464555]"
                >
                  Level
                  {!isView && <span className="ml-0.5 text-red-500">*</span>}
                </label>

                <input
                  id="class-level"
                  type="number"
                  placeholder="1"
                  value={formData.level}
                  disabled={isView}
                  onChange={(event) => updateField('level', event.target.value)}
                  className="
                    h-10
                    rounded-md
                    border
                    border-[#d5d3e3]
                    bg-white
                    px-3
                    text-sm
                    text-[#0b1c30]
                    outline-none
                    transition-colors
                    placeholder:text-[#a4a2b8]
                    focus:border-[#3525cd]
                    focus:ring-2
                    focus:ring-[#3525cd]/20
                    disabled:bg-[#f1f1f7]
                    disabled:text-[#8886a0]
                  "
                />
              </div>

              {/* Classification Code */}
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="class-code"
                  className="text-xs font-medium text-[#464555]"
                >
                  Classification Code
                  {!isView && <span className="ml-0.5 text-red-500">*</span>}
                </label>

                <input
                  id="class-code"
                  type="text"
                  placeholder="e.g. SUB"
                  value={formData.code}
                  disabled={isView || mode === 'edit'}
                  onChange={(event) => updateField('code', event.target.value)}
                  className="
                    h-10
                    rounded-md
                    border
                    border-[#d5d3e3]
                    bg-white
                    px-3
                    text-sm
                    text-[#0b1c30]
                    outline-none
                    transition-colors
                    placeholder:text-[#a4a2b8]
                    focus:border-[#3525cd]
                    focus:ring-2
                    focus:ring-[#3525cd]/20
                    disabled:bg-[#f1f1f7]
                    disabled:text-[#8886a0]
                  "
                />
              </div>

              {/* Classification Name */}
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="class-name"
                  className="text-xs font-medium text-[#464555]"
                >
                  Classification Name
                  {!isView && <span className="ml-0.5 text-red-500">*</span>}
                </label>

                <input
                  id="class-name"
                  type="text"
                  placeholder="e.g. Substandard"
                  value={formData.name}
                  disabled={isView}
                  onChange={(event) => updateField('name', event.target.value)}
                  className="
                    h-10
                    rounded-md
                    border
                    border-[#d5d3e3]
                    bg-white
                    px-3
                    text-sm
                    text-[#0b1c30]
                    outline-none
                    transition-colors
                    placeholder:text-[#a4a2b8]
                    focus:border-[#3525cd]
                    focus:ring-2
                    focus:ring-[#3525cd]/20
                    disabled:bg-[#f1f1f7]
                    disabled:text-[#8886a0]
                  "
                />
              </div>
            </div>
          </section>

          {/* Delinquency Configuration */}
          <section className="flex flex-col gap-3 rounded-lg border border-[#e2e1ec] bg-[#f8f9ff] p-4">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-[#8886a0]">
              Delinquency Configuration
            </span>

            <div className="grid grid-cols-3 gap-4">
              {/* From DPD */}
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="min-dpd"
                  className="text-xs font-medium text-[#464555]"
                >
                  From DPD
                  {!isView && <span className="ml-0.5 text-red-500">*</span>}
                </label>

                <input
                  id="min-dpd"
                  type="number"
                  placeholder="91"
                  value={formData.min_dpd_range}
                  disabled={isView}
                  onChange={(event) =>
                    updateField('min_dpd_range', event.target.value)
                  }
                  className="
                    h-10
                    rounded-md
                    border
                    border-[#d5d3e3]
                    bg-white
                    px-3
                    text-sm
                    text-[#0b1c30]
                    outline-none
                    transition-colors
                    placeholder:text-[#a4a2b8]
                    focus:border-[#3525cd]
                    focus:ring-2
                    focus:ring-[#3525cd]/20
                    disabled:bg-[#f1f1f7]
                    disabled:text-[#8886a0]
                  "
                />
              </div>

              {/* To DPD */}
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="max-dpd"
                  className="text-xs font-medium text-[#464555]"
                >
                  To DPD
                  {!isView && <span className="ml-0.5 text-red-500">*</span>}
                </label>

                <input
                  id="max-dpd"
                  type="number"
                  placeholder="180"
                  value={formData.max_dpd_range}
                  disabled={isView}
                  onChange={(event) =>
                    updateField('max_dpd_range', event.target.value)
                  }
                  className="
                    h-10
                    rounded-md
                    border
                    border-[#d5d3e3]
                    bg-white
                    px-3
                    text-sm
                    text-[#0b1c30]
                    outline-none
                    transition-colors
                    placeholder:text-[#a4a2b8]
                    focus:border-[#3525cd]
                    focus:ring-2
                    focus:ring-[#3525cd]/20
                    disabled:bg-[#f1f1f7]
                    disabled:text-[#8886a0]
                  "
                />
              </div>

              {/* Provision Rate */}
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="provision-rate"
                  className="text-xs font-medium text-[#464555]"
                >
                  Provision Rate
                  {!isView && <span className="ml-0.5 text-red-500">*</span>}
                </label>

                <div
                  className="
                    flex
                    h-10
                    items-center
                    rounded-md
                    border
                    border-[#d5d3e3]
                    bg-white
                    transition-colors
                    focus-within:border-[#3525cd]
                    focus-within:ring-2
                    focus-within:ring-[#3525cd]/20
                  "
                >
                  <input
                    id="provision-rate"
                    type="number"
                    placeholder="20.00"
                    value={formData.provision_rate}
                    disabled={isView}
                    onChange={(event) =>
                      updateField('provision_rate', event.target.value)
                    }
                    className="
                      h-full
                      w-full
                      rounded-l-md
                      border-none
                      bg-transparent
                      px-3
                      text-sm
                      text-[#0b1c30]
                      outline-none
                      placeholder:text-[#a4a2b8]
                      disabled:text-[#8886a0]
                    "
                  />
                  <span className="pr-3 text-sm text-[#8886a0]">%</span>
                </div>
              </div>
            </div>
          </section>

          {formError && !isView && (
            <div
              className="
                flex
                items-center
                gap-2
                rounded-md
                border
                border-red-200
                bg-red-50
                px-3
                py-2
                text-xs
                font-medium
                text-red-600
              "
            >
              {formError}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="
            sticky
            bottom-0
            z-10
            flex
            items-center
            justify-end
            gap-3
            border-t
            border-[#e2e1ec]
            bg-white
            px-6
            py-4
          "
        >
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="
              h-10
              rounded-md
              border
              border-[#d5d3e3]
              px-4
              text-sm
              font-medium
              text-[#464555]
              transition-colors
              hover:bg-[#f8f8fc]
              focus:outline-none
              focus:ring-2
              focus:ring-[#3525cd]/30
              disabled:opacity-60
            "
          >
            {isView ? 'Close' : 'Cancel'}
          </button>

          {!isView && (
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="
                flex
                h-10
                items-center
                gap-2
                rounded-md
                bg-[#3525cd]
                px-5
                text-sm
                font-semibold
                text-white
                shadow-sm
                transition-colors
                hover:bg-[#2f2ebe]
                focus:outline-none
                focus:ring-2
                focus:ring-[#3525cd]
                focus:ring-offset-2
                disabled:opacity-60
              "
            >
              {isSaving ? 'Saving...' : 'Save Classification'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}