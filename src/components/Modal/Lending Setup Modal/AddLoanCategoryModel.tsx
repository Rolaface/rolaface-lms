import React, { useEffect, useRef, useState } from "react";

export interface LoanCategoryFormData {
  code: string;
  name: string;
}

interface AddLoanCategoryModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: LoanCategoryFormData) => void | Promise<void>;
  loading?: boolean;
}

interface FormErrors {
  code?: string;
  name?: string;
}

const AddLoanCategoryModal: React.FC<AddLoanCategoryModalProps> = ({
  open,
  onClose,
  onSave,
  loading = false,
}) => {
  const initialState: LoanCategoryFormData = {
    code: "",
    name: "",
  };

  const [form, setForm] = useState(initialState);
  const [errors, setErrors] = useState<FormErrors>({});

  const firstInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;

    setForm(initialState);
    setErrors({});

    const timer = setTimeout(() => {
      firstInputRef.current?.focus();
    }, 100);

    return () => clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (open) {
      window.addEventListener("keydown", handleEscape);
    }

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [open, onClose]);

  const validate = () => {
    const newErrors: FormErrors = {};

    if (!form.code.trim()) {
      newErrors.code = "Loan Category Code is required.";
    }

    if (!form.name.trim()) {
      newErrors.name = "Loan Category Name is required.";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    await onSave({
      code: form.code.trim(),
      name: form.name.trim(),
    });
  };

  const handleChange = (
    field: keyof LoanCategoryFormData,
    value: string
  ) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4"
      aria-labelledby="add-category-title"
      aria-modal="true"
      role="dialog"
    >
      <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">

        {/* Header */}
        <div className="border-b border-slate-200 px-6 py-5">
          <h2
            id="add-category-title"
            className="text-xl font-semibold text-slate-900"
          >
            Add Loan Category
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Create a new loan category for your organization.
          </p>
        </div>

        {/* Body */}
        <div className="space-y-6 px-6 py-6">

          {/* Code */}
          <div>
            <label
              htmlFor="loan-category-code"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Loan Category Code
              <span className="ml-1 text-rose-500">*</span>
            </label>

            <input
              ref={firstInputRef}
              id="loan-category-code"
              type="text"
              aria-invalid={!!errors.code}
              aria-describedby={
                errors.code ? "loan-category-code-error" : undefined
              }
              placeholder="e.g. HOME"
              value={form.code}
              onChange={(e) =>
                handleChange("code", e.target.value.toUpperCase())
              }
              className={`w-full rounded-xl border bg-gray-100 px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 transition-all outline-none

                ${
                  errors.code
                    ? "border-red-400 ring-2 ring-red-100"
                    : "border-gray-200"
                }

                focus:border-indigo-600
                focus:bg-white
                focus:ring-4
                focus:ring-indigo-100
                hover:border-gray-300
              `}
            />

            {errors.code && (
              <p
                id="loan-category-code-error"
                className="mt-2 text-sm text-red-600"
              >
                {errors.code}
              </p>
            )}
          </div>

          {/* Name */}
          <div>
            <label
              htmlFor="loan-category-name"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Loan Category Name
              <span className="ml-1 text-rose-500">*</span>
            </label>

            <input
              id="loan-category-name"
              type="text"
              aria-invalid={!!errors.name}
              aria-describedby={
                errors.name ? "loan-category-name-error" : undefined
              }
              placeholder="Enter category name"
              value={form.name}
              onChange={(e) =>
                handleChange("name", e.target.value)
              }
              className={`w-full rounded-xl border bg-gray-100 px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 transition-all outline-none

                ${
                  errors.name
                    ? "border-red-400 ring-2 ring-red-100"
                    : "border-gray-200"
                }

                focus:border-indigo-600
                focus:bg-white
                focus:ring-4
                focus:ring-indigo-100
                hover:border-gray-300
              `}
            />

            {errors.name && (
              <p
                id="loan-category-name-error"
                className="mt-2 text-sm text-red-600"
              >
                {errors.name}
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-5">

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 active:scale-[0.98]"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={handleSubmit}
            className="rounded-xl bg-indigo-700 px-5 py-2.5 text-sm font-semibold text-white shadow transition hover:bg-indigo-800 focus:ring-4 focus:ring-indigo-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Saving..." : "Save Category"}
          </button>

        </div>
      </div>
    </div>
  );
};

export default AddLoanCategoryModal;