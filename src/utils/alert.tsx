import { notifications } from '@mantine/notifications';
import { modals } from '@mantine/modals';
import { ThemeIcon } from '@mantine/core';
import { IconCheck, IconX, IconAlertTriangle } from '@tabler/icons-react';
import React from 'react';

/* ---------------------------------------------------------
   Toast variants — using Mantine's built-in `color` prop,
   no custom CSS injection needed.
--------------------------------------------------------- */

/** Success toast */
export function showSuccess(message: string, title: string = 'Success') {
  notifications.show({
    title,
    message,
    color: 'success',
    autoClose: 3000,
    icon: (
      <ThemeIcon radius="xl" size={30} color="success">
        <IconCheck size={18} />
      </ThemeIcon>
    ),
  });
}

/** Error toast */
export function showApiError(message: string, title: string = 'Error') {
  notifications.show({
    title,
    message,
    color: 'danger',
    autoClose: 4000,
    icon: (
      <ThemeIcon radius="xl" size={30} color="danger">
        <IconX size={18} />
      </ThemeIcon>
    ),
  });
}

/** Warning toast */
export function showWarningError(message: string, title: string = 'Warning') {
  notifications.show({
    title,
    message,
    color: 'warning',
    autoClose: 4000,
    icon: (
      <ThemeIcon radius="xl" size={30} color="warning">
        <IconAlertTriangle size={18} />
      </ThemeIcon>
    ),
  });
}

/** Validation error toast */
export function showValidationError(message: string, title: string = 'Validation Error') {
  notifications.show({
    title,
    message,
    color: 'accent',
    autoClose: 4000,
    icon: (
      <ThemeIcon radius="xl" size={30} color="accent">
        <IconAlertTriangle size={18} />
      </ThemeIcon>
    ),
  });
}

/* ---------------------------------------------------------
   Confirm dialog — resolves true/false
--------------------------------------------------------- */
interface ShowConfirmOptions {
  title?: string;
  confirmButtonText?: string;
  cancelButtonText?: string;
  confirmButtonColor?: string;
}

export function showConfirm(
  message: string,
  options: ShowConfirmOptions = {}
): Promise<boolean> {
  const {
    title = 'Are you sure?',
    confirmButtonText = 'Delete',
    cancelButtonText = 'Cancel',
    confirmButtonColor = 'danger',
  } = options;

  return new Promise((resolve) => {
    modals.openConfirmModal({
      title: '',
      withCloseButton: true,
      centered: true,
      radius: 'md',
      children: (
        <div style={{ textAlign: 'center', padding: '4px 8px 0 8px' }}>
          <ThemeIcon
            radius="xl"
            size={64}
            color="danger"
            variant="light"
            style={{ margin: '0 auto 16px auto' }}
          >
            <IconAlertTriangle size={30} />
          </ThemeIcon>

          <h3 style={{ margin: '0 0 10px 0', fontSize: 22, fontWeight: 700 }}>{title}</h3>

          <p style={{ margin: '0 0 18px 0', fontSize: 14.5, lineHeight: 1.5 }}>{message}</p>

          <hr style={{ border: 'none', margin: '0 -20px 16px -20px' }} />
        </div>
      ),
      labels: { confirm: confirmButtonText, cancel: cancelButtonText },
      groupProps: { justify: 'flex-end', gap: 12 },
      cancelProps: { variant: 'default', radius: 'sm' },
      confirmProps: {
        radius: 'sm',
        color: confirmButtonColor,
      },
      onConfirm: () => resolve(true),
      onCancel: () => resolve(false),
    });
  });
}