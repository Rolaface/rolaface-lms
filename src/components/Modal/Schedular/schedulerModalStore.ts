import { IconCalendarClock } from '@tabler/icons-react';
import { createModal } from '../../../store/modal store/createModal';
import { SchedulerModal, type SchedulerFormValues } from './SchedulerModal';

export interface SchedulerModalParams {
  /** Pass existing values to prefill the form when editing/viewing. Omit for create mode. */
  initialData?: SchedulerFormValues | null;
  isView?: boolean;
  onSaved?: (data: SchedulerFormValues) => void;
}

interface SchedulerModalProps {
  opened: boolean;
  onClose: () => void;
  onMinimize: () => void;
  onSubmit?: (data: SchedulerFormValues) => void;
  initialData?: SchedulerFormValues;
  isView?: boolean;
}

function getTitle(params: SchedulerModalParams) {
  if (params.isView) return 'View Scheduler';
  return params.initialData ? 'Edit Scheduler' : 'Add Scheduler';
}

export const schedulerModal = createModal<SchedulerModalParams, SchedulerModalProps>(
  'scheduler-form',
  SchedulerModal,
  {
    icon: IconCalendarClock,
    getTitle,
    buildProps: (params) => ({
      initialData: params.initialData ?? undefined,
      isView: params.isView ?? false,
      onSubmit: params.onSaved,
    }),
  }
);