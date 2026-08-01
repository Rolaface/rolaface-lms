export type VoucherType = "Journal Entry" | "Bank Entry";
export type EntryType = "Dr" | "Cr";


export interface JournalEntryFormValues {
  postingDate: string;
  voucher_type: VoucherType;
  isOpening: boolean;
  remarks: string;
  cheque_no: string;
  cheque_date: string;
}


export interface JournalEntryLine {
  name?: string; 
  account: string;
  ccy: string;
  entryType: EntryType;
  amount: string;
  partyType: string;
  party: string;
  exchange_rate: string;
  voucher_type: string;
  remark: string;
  isRateMissing?: boolean;
}

export type JournalEntryErrors = Partial<Record<keyof JournalEntryFormValues, string>>;

/** Per-line field errors, keyed by the entry's row index */
export interface JournalEntryLineError {
  account?: string;
  amount?: string;
}
export type JournalEntryRowErrors = Record<number, JournalEntryLineError>;

export interface SelectOption {
  label: string;
  value: string;
  currency?: string;
}

export interface JournalEntryTotals {
  debit: number;
  credit: number;
}


export type JournalEntryMode = "create" | "edit" | "view";

export interface JournalEntryModalProps {
  opened: boolean;
  onClose: () => void;
  onSuccess?: () => void;
 
  entryId?: string | null;

  isReadOnly?: boolean;
}