import { useEffect, useState } from 'react';

export interface LoanClassificationData {
  level?: number;
  code: string;
  name: string;
  min_dpd_range: number | null;
  max_dpd_range: number | null;
  is_written_off: boolean;
  provision_rate: number;
}

interface LoanClassificationModalProps {
  opened: boolean;
  onClose: () => void;
  mode?: 'add' | 'edit' | 'view';
  data?: LoanClassificationData | null;
}

interface LoanClassificationFormState {
  code: string;
  name: string;
  min_dpd_range: string;
  max_dpd_range: string;
  provision_rate: string;
  is_written_off: boolean;
}

const EMPTY_FORM_STATE: LoanClassificationFormState = {
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

  const title =
    mode === 'add'
      ? 'New Loan Classification'
      : mode === 'edit'
        ? 'Edit Loan Classification'
        : 'View Loan Classification';

  const [formData, setFormData] =
    useState<LoanClassificationFormState>(EMPTY_FORM_STATE);

  /**
   * Existing behavior preserved:
   * Populate form when editing/viewing existing classification.
   * Reset form when creating a new classification.
   */
  useEffect(() => {
    if (opened && data) {
      setFormData({
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
  }, [opened, data, mode]);


  /**
   * Type-safe field updater.
   * Prevents accidental state shape mutations.
   */
  const updateField = <K extends keyof LoanClassificationFormState>(
    field: K,
    value: LoanClassificationFormState[K],
  ) => {
    setFormData((previous) => ({
      ...previous,
      [field]: value,
    }));
  };


  if (!opened) {
    return null;
  }


  return (
    <div
      className="
        fixed inset-0 z-50
        flex items-center justify-center
        bg-[#0b1c30]/40
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
          rounded-lg
          border
          border-[#c7c4d8]
          bg-white
          shadow-[0px_20px_25px_-5px_rgba(0,0,0,0.1)]
        "
      >

        {/* Header */}
        <div
          className="
            sticky
            top-0
            z-10
            flex
            items-start
            justify-between
            border-b
            border-[#c7c4d8]
            bg-white
            px-6
            py-4
          "
        >
          <div className="flex flex-col gap-1">
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

            <p
              className="
                text-sm
                text-[#464555]
              "
            >
              Configure a loan classification policy used throughout the
              lending lifecycle.
            </p>
          </div>


          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="
              rounded-full
              p-1
              text-[#464555]
              transition-colors
              hover:text-[#0b1c30]
              focus:outline-none
              focus:ring-2
              focus:ring-[#3525cd]
            "
          >
            <span className="text-xl">
              ×
            </span>
          </button>
        </div>



        {/* Scrollable Content */}
        <div
          className="
    flex
    flex-col
    gap-8
    px-6
    py-4
  "
        >


          {/* Classification Identity */}
          <section className="flex flex-col gap-3">

            <div>
              <h3
                className="
                  border-b
                  border-[#c7c4d8]
                  pb-1
                  text-sm
                  font-semibold
                  text-[#0b1c30]
                "
              >
                Classification Identity
              </h3>

              {/* <p
                className="
                  mt-1
                  text-xs
                  text-[#464555]
                "
              >
                Define the unique identity used across lending workflows.
              </p> */}
            </div>


            <div className="flex gap-4">

              {/* Classification Code */}
              <div className="flex flex-1 flex-col gap-1">

                <label
                  htmlFor="class-code"
                  className="
                    text-xs
                    font-semibold
                    text-[#0b1c30]
                  "
                >
                  Code
                  {!isView && (
                    <span className="ml-1 text-red-600">
                      *
                    </span>
                  )}
                </label>


                <input
                  id="class-code"
                  type="text"
                  placeholder="e.g. SUB"
                  value={formData.code}
                  disabled={isView}
                  onChange={(event) =>
                    updateField(
                      'code',
                      event.target.value,
                    )
                  }
                  className="
                    h-10
                    rounded
                    border
                    border-[#c7c4d8]
                    bg-white
                    px-3
                    text-sm
                    text-[#0b1c30]
                    placeholder:text-[#777587]
                    outline-none
                    focus:border-transparent
                    focus:ring-2
                    focus:ring-[#3525cd]
                    disabled:bg-[#eff4ff]
                  "
                />

                <span
                  className="
                    text-xs
                    text-[#464555]
                  "
                >
                  Unique institution-wide short code.
                </span>

              </div>



              {/* Classification Name */}
              <div className="flex-2 flex flex-col gap-1">

                <label
                  htmlFor="class-name"
                  className="
                    text-xs
                    font-semibold
                    text-[#0b1c30]
                  "
                >
                  Name
                  {!isView && (
                    <span className="ml-1 text-red-600">
                      *
                    </span>
                  )}
                </label>


                <input
                  id="class-name"
                  type="text"
                  placeholder="e.g. Substandard"
                  value={formData.name}
                  disabled={isView}
                  onChange={(event) =>
                    updateField(
                      'name',
                      event.target.value,
                    )
                  }
                  className="
                    h-10
                    rounded
                    border
                    border-[#c7c4d8]
                    bg-white
                    px-3
                    text-sm
                    text-[#0b1c30]
                    placeholder:text-[#777587]
                    outline-none
                    focus:border-transparent
                    focus:ring-2
                    focus:ring-[#3525cd]
                    disabled:bg-[#eff4ff]
                  "
                />

                <span
                  className="
                    text-xs
                    text-[#464555]
                  "
                >
                  Readable name.
                </span>

              </div>

            </div>



          </section>



          {/* Delinquency Configuration */}
          <section className="flex flex-col gap-3">

            <div>
              <h3
                className="
                  border-b
                  border-[#c7c4d8]
                  pb-1
                  text-sm
                  font-semibold
                  text-[#0b1c30]
                "
              >
                Delinquency Configuration
              </h3>

              {/* <p
                className="
                  mt-1
                  text-xs
                  text-[#464555]
                "
              >
                Specify the Days Past Due range mapped to this classification.
              </p> */}
            </div>


            <div className="flex gap-4">

              {/* Min DPD */}
              <div className="flex flex-1 flex-col gap-1">

                <label
                  htmlFor="min-dpd"
                  className="text-xs font-semibold text-[#0b1c30]"
                >
                  From DPD
                  {!isView && (
                    <span className="ml-1 text-red-600">*</span>
                  )}
                </label>

                <input
                  id="min-dpd"
                  type="number"
                  placeholder="91"
                  value={formData.min_dpd_range}
                  disabled={isView}
                  onChange={(event) =>
                    updateField(
                      'min_dpd_range',
                      event.target.value,
                    )
                  }
                  className="
                    h-10
                    rounded
                    border
                    border-[#c7c4d8]
                    px-3
                    text-sm
                    outline-none
                    focus:ring-2
                    focus:ring-[#3525cd]
                    disabled:bg-[#eff4ff]
                  "
                />

              </div>


              {/* Max DPD */}
              <div className="flex flex-1 flex-col gap-1">

                <label
                  htmlFor="max-dpd"
                  className="text-xs font-semibold text-[#0b1c30]"
                >
                  To DPD
                  {!isView && (
                    <span className="ml-1 text-red-600">*</span>
                  )}
                </label>

                <input
                  id="max-dpd"
                  type="number"
                  placeholder="180"
                  value={formData.max_dpd_range}
                  disabled={isView}
                  onChange={(event) =>
                    updateField(
                      'max_dpd_range',
                      event.target.value,
                    )
                  }
                  className="
                    h-10
                    rounded
                    border
                    border-[#c7c4d8]
                    px-3
                    text-sm
                    outline-none
                    focus:ring-2
                    focus:ring-[#3525cd]
                    disabled:bg-[#eff4ff]
                  "
                />

              </div>



            </div>

            <div className="flex flex-col gap-1">
              <span className="text-xs text-[#464555]">
                Inclusive Days Past Due range for this classification.
              </span>
            </div>

          </section>

          {/* Financial Configuration */}
          <section className="flex flex-col gap-3">

            <div>
              <h3
                className="
                  border-b
                  border-[#c7c4d8]
                  pb-1
                  text-sm
                  font-semibold
                  text-[#0b1c30]
                "
              >
                Financial Configuration
              </h3>

              {/* <p
                className="
                  mt-1
                  text-xs
                  text-[#464555]
                "
              >
                Configure the expected provisioning percentage for this risk
                level.
              </p> */}
            </div>

            <div className="w-1/2 flex flex-col gap-1">

              <label
                htmlFor="provision-rate"
                className="text-xs font-semibold text-[#0b1c30]"
              >
                Provision Rate
                {!isView && (
                  <span className="ml-1 text-red-600">*</span>
                )}
              </label>

              <div
                className="
                  flex
                  h-10
                  items-center
                  rounded
                  border
                  border-[#c7c4d8]
                  bg-white
                  focus-within:border-transparent
                  focus-within:ring-2
                  focus-within:ring-[#3525cd]
                "
              >
                <input
                  id="provision-rate"
                  type="number"
                  placeholder="20.00"
                  value={formData.provision_rate}
                  disabled={isView}
                  onChange={(event) =>
                    updateField(
                      'provision_rate',
                      event.target.value,
                    )
                  }
                  className="
                    h-full
                    w-full
                    border-none
                    bg-transparent
                    px-3
                    text-sm
                    outline-none
                    disabled:bg-[#eff4ff]
                  "
                />

                <span
                  className="
                    pr-3
                    text-sm
                    text-[#464555]
                  "
                >
                  %
                </span>
              </div>

              <span
                className="
                  text-xs
                  text-[#464555]
                "
              >
                Accepted range: 0–100%.
              </span>

            </div>

          </section>

          {/* Write-Off Eligibility */}
          <section className="flex flex-col gap-3">

            <div>
              <h3
                className="
                  border-b
                  border-[#c7c4d8]
                  pb-1
                  text-sm
                  font-semibold
                  text-[#0b1c30]
                "
              >
                Write-Off Eligibility
              </h3>

              {/* <p
                className="
                  mt-1
                  text-xs
                  text-[#464555]
                "
              >
                Determine whether loans in this classification can participate
                in institution write-off operations.
              </p> */}
            </div>

            <label
              htmlFor="write-off"
              className="
                flex
                cursor-pointer
                items-start
                gap-3
                pt-2
              "
            >

              <input
                id="write-off"
                type="checkbox"
                checked={formData.is_written_off}
                disabled={isView}
                onChange={(event) =>
                  updateField(
                    'is_written_off',
                    event.target.checked,
                  )
                }
                className="
                  mt-1
                  h-4
                  w-4
                  rounded
                  border-[#c7c4d8]
                  text-[#3525cd]
                  focus:ring-[#3525cd]
                  disabled:cursor-not-allowed
                "
              />

              <div className="flex flex-col gap-1">

                <span
                  className="
                    text-sm
                    font-medium
                    text-[#0b1c30]
                  "
                >
                  Eligible for Write-Off
                </span>

                <span
                  className="
                    text-xs
                    text-[#464555]
                  "
                >
                  Loans within this classification become eligible for
                  institution write-off workflows.
                </span>

              </div>

            </label>

          </section>

        </div>

        {/* Footer */}
        <div
          className="
            sticky
            bottom-0
            z-10
            flex
            items-center
            justify-between
            border-t
            border-[#c7c4d8]
            bg-white
            px-6
            py-4
          "
        >

          <button
            type="button"
            onClick={onClose}
            className="
              h-10
              rounded
              border
              border-[#c7c4d8]
              px-4
              text-sm
              font-medium
              text-[#0b1c30]
              transition-colors
              hover:bg-[#eff4ff]
              focus:outline-none
              focus:ring-2
              focus:ring-[#3525cd]
            "
          >
            {isView ? 'Close' : 'Cancel'}
          </button>

          {!isView && (
            <button
              type="button"
              onClick={onClose}
              className="
                flex
                h-10
                items-center
                gap-2
                rounded
                bg-[#3525cd]
                px-4
                text-sm
                font-semibold
                text-white
                transition-colors
                hover:bg-[#2f2ebe]
                focus:outline-none
                focus:ring-2
                focus:ring-[#3525cd]
                focus:ring-offset-2
              "
            >
              <span>Save Classification</span>
            </button>
          )}

        </div>

      </div>

    </div>
  );
}