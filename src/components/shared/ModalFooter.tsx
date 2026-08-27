import { ReactNode } from 'react';
import { Button, Group, Text, useMantineTheme } from '@mantine/core';

const FOOTER_MIN_HEIGHT = 60;

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
      <div
        style={{
          borderTop: '1px solid var(--mantine-color-slate-2)',
          flexShrink: 0,
          minHeight: FOOTER_MIN_HEIGHT,
          backgroundColor: 'var(--mantine-color-white)',
          zIndex: 10,
        }}
      >
        {errorMessage && !isViewMode && (
          <Text size="xs" c="red" px="xl" pt="xs">
            {errorMessage}
          </Text>
        )}

        <Group justify="space-between" px="xl" py="sm">
          <Group gap="sm">
            <Button variant="subtle" color="slate" onClick={onClose} disabled={submitLoading}>
              {isViewMode ? 'Close' : 'Cancel'}
            </Button>
            {leftSlot}
          </Group>

          <Group gap="sm">
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
      </div>
    );
  }

  return (
    <div
      className="bg-white border-t border-slate-100 flex flex-col shrink-0 rounded-b-md"
      style={{ minHeight: FOOTER_MIN_HEIGHT }}
    >
      {errorMessage && !isViewMode && (
        <Text size="xs" c="red" className="px-5 pt-2">
          {errorMessage}
        </Text>
      )}

      <div className="px-5 py-3 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
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

        <div className="flex items-center gap-2">
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
    </div>
  );
}