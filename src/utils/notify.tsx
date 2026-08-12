import { IconCheck, IconAlertCircle } from '@tabler/icons-react';
import { openCommonModal } from '../components/Modal/AlertModal';
import { parseFrappeError } from './parseFrappeError';

export function notifySuccess(message: string, heading = 'Success') {
  openCommonModal({
    heading,
    color: 'success',
    icon: <IconCheck size={36} />,
    body: message,
    buttons: [{ label: 'Ok', variant: 'light', color: 'success' }],
  });
}

export function notifyError(err: unknown, heading = 'Something went wrong') {
  openCommonModal({
    heading,
    color: 'danger',
    icon: <IconAlertCircle size={36} />,
    body: parseFrappeError(err),
    buttons: [{ label: 'Close', variant: 'light', color: 'slate' }],
  });
}


export function notifyValidationError(message: string, heading = 'Missing information') {
  openCommonModal({
    heading,
    color: 'warning',
    icon: <IconAlertCircle size={36} />,
    body: message,
    buttons: [{ label: 'Close', variant: 'light', color: 'slate' }],
  });
}