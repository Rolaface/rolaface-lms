import { notifications } from '@mantine/notifications';
import { modals } from '@mantine/modals';
import { IconCheck, IconX, IconAlertTriangle } from '@tabler/icons-react';
import React from 'react';

/* ---------------------------------------------------------
   1. One-time style injection (left border + bottom strip)
--------------------------------------------------------- */
function ensureAlertStylesInjected() {
  if (typeof document === 'undefined') return;
  if (document.getElementById('custom-alert-styles')) return;

  const style = document.createElement('style');
  style.id = 'custom-alert-styles';
  style.innerHTML = `
    .alert-root {
      border-radius: 10px !important;
      border-left: 5px solid var(--alert-color) !important;
      background: var(--alert-bg) !important;
      position: relative;
      overflow: hidden;
      padding: 14px 16px 18px 16px !important;
    }
    .alert-root::after {
      content: '';
      position: absolute;
      left: 0;
      bottom: 0;
      height: 3px;
      width: 65%;
      background: var(--alert-color);
      border-radius: 0 3px 3px 0;
    }
    .alert-title { font-weight: 700 !important; font-size: 15px !important; color: #1a1a1a !important; }
    .alert-description { color: #3c3c3c !important; font-size: 14px !important; margin-top: 2px !important; }
    .alert-closeButton { color: #555 !important; }

    .alert-success { --alert-color: #2f9e44; --alert-bg: #ebfbee; }
    .alert-error   { --alert-color: #e03131; --alert-bg: #fff0f0; }
    .alert-warning { --alert-color: #f59f00; --alert-bg: #fff9db; }
    .alert-validation { --alert-color: #e8590c; --alert-bg: #fff4e6; }
  `;
  document.head.appendChild(style);
}

/* ---------------------------------------------------------
   2. Icon-in-circle badge (matches the round colored icon)
--------------------------------------------------------- */
function IconCircle({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        width: 30,
        height: 30,
        borderRadius: '50%',
        background: color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        flexShrink: 0,
      }}
    >
      {children}
    </div>
  );
}

/* ---------------------------------------------------------
   3. Toast variants
--------------------------------------------------------- */

/** Success toast */
export function showSuccess(message: string, title: string = 'Success') {
  ensureAlertStylesInjected();
  notifications.show({
    title,
    message,
    autoClose: 3000,
    icon: (
      <IconCircle color="#2f9e44">
        <IconCheck size={18} />
      </IconCircle>
    ),
    classNames: {
      root: 'alert-root alert-success',
      title: 'alert-title',
      description: 'alert-description',
      closeButton: 'alert-closeButton',
    },
  });
}

/** Error toast */
export function showApiError(message: string, title: string = 'Error') {
  ensureAlertStylesInjected();
  notifications.show({
    title,
    message,
    autoClose: 4000,
    icon: (
      <IconCircle color="#e03131">
        <IconX size={18} />
      </IconCircle>
    ),
    classNames: {
      root: 'alert-root alert-error',
      title: 'alert-title',
      description: 'alert-description',
      closeButton: 'alert-closeButton',
    },
  });
}

/** Warning toast */
export function showWarningError(message: string, title: string = 'Warning') {
  ensureAlertStylesInjected();
  notifications.show({
    title,
    message,
    autoClose: 4000,
    icon: (
      <IconCircle color="#f59f00">
        <IconAlertTriangle size={18} />
      </IconCircle>
    ),
    classNames: {
      root: 'alert-root alert-warning',
      title: 'alert-title',
      description: 'alert-description',
      closeButton: 'alert-closeButton',
    },
  });
}

/** Validation error toast (same as error, separate name for readability at call-sites) */
export function showValidationError(message: string, title: string = 'Validation Error') {
  ensureAlertStylesInjected();
  notifications.show({
    title,
    message,
    autoClose: 4000,
    icon: (
      <IconCircle color="#e8590c">
        <IconAlertTriangle size={18} />
      </IconCircle>
    ),
    classNames: {
      root: 'alert-root alert-validation',
      title: 'alert-title',
      description: 'alert-description',
      closeButton: 'alert-closeButton',
    },
  });
}

/* ---------------------------------------------------------
   4. Confirm dialog — resolves true/false (matches "Are you sure?")
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
    confirmButtonColor = 'red',
  } = options;

  return new Promise((resolve) => {
    modals.openConfirmModal({
      title: '', // hide default top-left title, we render our own centered layout below
      withCloseButton: true,
      centered: true,
      radius: 'md',
      children: (
        <div style={{ textAlign: 'center', padding: '4px 8px 0 8px' }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: '#fdeaea',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto',
            }}
          >
            <IconAlertTriangle size={30} color="#e03131" />
          </div>

          <h3 style={{ margin: '0 0 10px 0', fontSize: 22, fontWeight: 700, color: '#1a1a1a' }}>
            {title}
          </h3>

          <p style={{ margin: '0 0 18px 0', fontSize: 14.5, color: '#555', lineHeight: 1.5 }}>
            {message}
          </p>

          <hr style={{ border: 'none', borderTop: '1px solid #eee', margin: '0 -20px 16px -20px' }} />
        </div>
      ),
      labels: { confirm: confirmButtonText, cancel: cancelButtonText },
      groupProps: { justify: 'flex-end', gap: 12 },
      cancelProps: { variant: 'default', radius: 'sm' },
      confirmProps: {
        radius: 'sm',
        color: confirmButtonColor.startsWith('#') ? undefined : confirmButtonColor,
        style: confirmButtonColor.startsWith('#')
          ? { backgroundColor: confirmButtonColor }
          : undefined,
      },
      onConfirm: () => resolve(true),
      onCancel: () => resolve(false),
    });
  });
}