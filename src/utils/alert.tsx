import { notifications } from '@mantine/notifications';
import { modals } from '@mantine/modals';
import { IconCheck, IconX, IconAlertTriangle } from '@tabler/icons-react';

/** Success toast */
export function showSuccess(message: string, title: string = 'Success') {
  notifications.show({
    title,
    message,
    color: 'green',
    icon: <IconCheck size={16} />,
    autoClose: 3000,
  });
}

/** Error toast */
export function showApiError(message: string, title: string = 'Error') {
  notifications.show({
    title,
    message,
    color: 'red',
    icon: <IconX size={16} />,
    autoClose: 4000,
  });
}

/** Warning toast */
export function showWarningError(message: string, title: string = 'Warning') {
  notifications.show({
    title,
    message,
    color: 'yellow',
    icon: <IconAlertTriangle size={16} />,
    autoClose: 4000,
  });
}

/** Validation error toast (same as error, separate name for readability at call-sites) */
export function showValidationError(message: string, title: string = 'Validation Error') {
  notifications.show({
    title,
    message,
    color: 'orange',
    icon: <IconAlertTriangle size={16} />,
    autoClose: 4000,
  });
}

/** Confirm dialog — resolves true/false */
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
    confirmButtonText = 'Confirm',
    cancelButtonText = 'Cancel',
    confirmButtonColor = 'red',
  } = options;

  return new Promise((resolve) => {
    modals.openConfirmModal({
      title,
      children: <p style={{ margin: 0, fontSize: 14 }}>{message}</p>,
      labels: { confirm: confirmButtonText, cancel: cancelButtonText },
      confirmProps: { color: confirmButtonColor.startsWith('#') ? undefined : confirmButtonColor },
      styles: confirmButtonColor.startsWith('#')
        ? { }
        : undefined,
      onConfirm: () => resolve(true),
      onCancel: () => resolve(false),
    });
  });
}