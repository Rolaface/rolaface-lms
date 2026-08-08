import { ReactNode } from 'react';
import { Button, Group, Text, useMantineTheme } from '@mantine/core';

interface ModalFooterProps {
  leftSlot?: ReactNode;
  isViewMode?: boolean;
  onClose: () => void;
  onReset?: () => void;
  resetLabel?: string;
  onSaveDraft?: () => void;
  saveDraftLabel?: string;
  submitLabel: string;
  submitLoading?: boolean;
  submitDisabled?: boolean;
  submitIcon?: ReactNode;
  onSubmit?: () => void;
  variant?: 'tailwind' | 'theme';
  errorMessage?: string;
}

export function ModalFooter({
  leftSlot,
  isViewMode,
  onClose,
  onReset,
  resetLabel = 'Reset',
  onSaveDraft,
  saveDraftLabel = 'Save as Draft',
  submitLabel,
  submitLoading,
  submitDisabled,
  submitIcon,
  onSubmit,
  variant = 'tailwind',
  errorMessage,
}: ModalFooterProps) {
  const theme = useMantineTheme();
  const submitButtonProps = onSubmit
    ? { type: 'button' as const, onClick: onSubmit }
    : { type: 'submit' as const };

  if (variant === 'theme') {
    return (
      <Group
        justify="space-between"
        px="xl"
        py="md"
        style={{ borderTop: '1px solid var(--mantine-color-slate-2)', flexShrink: 0 }}
      >
        <Group gap="sm">
          <Button variant="subtle" color="slate" onClick={onClose} disabled={submitLoading}>
            {isViewMode ? 'Close' : 'Cancel'}
          </Button>
          {leftSlot}
        </Group>

        <Group gap="sm">
          {errorMessage && !isViewMode && (
            <Text size="xs" c="red">
              {errorMessage}
            </Text>
          )}

          {!isViewMode && (
            <>
              {onReset && (
                <Button variant="subtle" color="red" onClick={onReset}>
                  {resetLabel}
                </Button>
              )}
              {onSaveDraft && (
                <Button variant="default" onClick={onSaveDraft}>
                  {saveDraftLabel}
                </Button>
              )}
              <Button
                {...submitButtonProps}
                px="xl"
                disabled={submitDisabled}
                loading={submitLoading}
                rightSection={submitIcon}
                styles={{
                  root: {
                    background: theme.other.brandGradient,
                    boxShadow: theme.other.brandGlowShadowSm,
                    border: 'none',
                  },
                }}
              >
                {submitLabel}
              </Button>
            </>
          )}
        </Group>
      </Group>
    );
  }

  return (
    <div className="bg-white border-t border-slate-100 p-3 px-5 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 shrink-0 rounded-b-md">
      <div className="flex items-center gap-3">
        <Button
          size="sm"
          variant="default"
          onClick={onClose}
          disabled={submitLoading}
          className="font-semibold px-5 text-slate-700 border-slate-200"
        >
          {isViewMode ? 'Close' : 'Cancel'}
        </Button>
        {leftSlot}
      </div>

      <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2">
        {errorMessage && !isViewMode && (
          <Text size="xs" c="red" className="sm:mr-2">
            {errorMessage}
          </Text>
        )}

        {!isViewMode && (
          <>
            {onReset && (
              <button
                type="button"
                onClick={onReset}
                className="text-xs font-semibold text-red-500 hover:text-red-600 transition-colors"
              >
                {resetLabel}
              </button>
            )}

            {onSaveDraft && (
              <Button
                size="sm"
                variant="default"
                onClick={onSaveDraft}
                className="font-semibold px-5 text-slate-700 border-slate-200"
              >
                {saveDraftLabel}
              </Button>
            )}

            <Button
              {...submitButtonProps}
              size="sm"
              loading={submitLoading}
              disabled={submitDisabled}
              rightSection={submitIcon}
              className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 border-0 font-semibold px-6"
            >
              {submitLabel}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}