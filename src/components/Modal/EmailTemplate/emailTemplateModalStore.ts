import { IconMail } from '@tabler/icons-react';
import { createModal } from '../../../store/modal store/createModal';
import { EmailTemplateModal, type EmailTemplateForm } from './EmailTemplateModal';

export interface EmailTemplateModalParams {
  /** Pass existing values to prefill the form when editing/viewing. Omit for create mode. */
  initialData?: EmailTemplateForm | null;
  isView?: boolean;
  onSaved?: (data: EmailTemplateForm) => void;
}

interface EmailTemplateModalProps {
  opened: boolean;
  onClose: () => void;
  onMinimize: () => void;
  onSubmit?: (data: EmailTemplateForm) => void;
  initialData?: EmailTemplateForm;
  isView?: boolean;
}

function getTitle(params: EmailTemplateModalParams) {
  if (params.isView) return 'View Email Template';
  return params.initialData ? 'Edit Email Template' : 'Add Email Template';
}

export const emailTemplateModal = createModal<EmailTemplateModalParams, EmailTemplateModalProps>(
  'email-template-form',
  EmailTemplateModal,
  {
    icon: IconMail,
    getTitle,
    buildProps: (params) => ({
      initialData: params.initialData ?? undefined,
      isView: params.isView ?? false,
      onSubmit: params.onSaved,
    }),
  },
);