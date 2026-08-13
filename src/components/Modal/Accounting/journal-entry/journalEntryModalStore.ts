import { IconFileText } from '@tabler/icons-react';
import { createModal } from '../../../../store/modal store/createModal';
import JournalEntryModal from './JournalEntryModal';

export interface JournalEntryModalParams {
  entryId?: string | null;
  isReadOnly?: boolean;
  baseCurrency: string;
  onSuccess?: () => void;
}

function getTitle(params: JournalEntryModalParams) {
  if (params.isReadOnly) return 'View Journal Entry';
  if (params.entryId) return 'Update Journal Entry';
  return 'New Journal Entry';
}

export const journalEntryModal = createModal(
  'journal-entry',
  JournalEntryModal,
  {
    icon: IconFileText,
    getTitle,
    buildProps: (params) => ({
      onSuccess: params.onSuccess,
      entryId: params.entryId ?? null,
      isReadOnly: params.isReadOnly ?? false,
      baseCurrency: params.baseCurrency,
    }),
  },
);