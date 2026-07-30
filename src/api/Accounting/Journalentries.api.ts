
export interface JournalEntry {
  name: string;
  posting_date: string;
  total_debit: number;
  total_credit: number;
  docstatus: 0 | 1 | 2; // 0 Draft, 1 Submitted, 2 Cancelled
  user_remark?: string;
}

const DUMMY_ENTRIES: JournalEntry[] = [
  { name: 'JE-2026-0001', posting_date: '2026-07-01', total_debit: 45000, total_credit: 45000, docstatus: 1, user_remark: 'Salary provision for June' },
  { name: 'JE-2026-0002', posting_date: '2026-07-03', total_debit: 128500, total_credit: 128500, docstatus: 1, user_remark: 'Rent payment - July' },
  { name: 'JE-2026-0003', posting_date: '2026-07-05', total_debit: 21400, total_credit: 21400, docstatus: 0, user_remark: 'Utility bill adjustment' },
  { name: 'JE-2026-0004', posting_date: '2026-07-08', total_debit: 96000, total_credit: 96000, docstatus: 2, user_remark: 'Duplicate entry — voided' },
  { name: 'JE-2026-0005', posting_date: '2026-07-10', total_debit: 264300, total_credit: 264300, docstatus: 1, user_remark: 'Customer receipt - Bwalya Ent.' },
  { name: 'JE-2026-0006', posting_date: '2026-07-14', total_debit: 34600, total_credit: 34600, docstatus: 0, user_remark: 'GST output adjustment' },
  { name: 'JE-2026-0007', posting_date: '2026-07-18', total_debit: 187400, total_credit: 187400, docstatus: 1, user_remark: 'Supplier payment - Harborview' },
  { name: 'JE-2026-0008', posting_date: '2026-07-22', total_debit: 14760, total_credit: 14760, docstatus: 0, user_remark: 'Marketing expense booking' },
];

/** GET /accounting/journal-entries — replace body with axios/react-query call */
export async function fetchJournalEntries(): Promise<JournalEntry[]> {
  await new Promise((res) => setTimeout(res, 300));
  return DUMMY_ENTRIES;
}

/** POST /accounting/journal-entries/:name/submit — replace body with a real mutation */
export async function submitJournalEntry(name: string): Promise<void> {
  await new Promise((res) => setTimeout(res, 200));
  void name;
}

/** POST /accounting/journal-entries/:name/cancel — replace body with a real mutation */
export async function cancelJournalEntry(name: string): Promise<void> {
  await new Promise((res) => setTimeout(res, 200));
  void name;
}

/** DELETE /accounting/journal-entries/:name — replace body with a real mutation */
export async function deleteJournalEntry(name: string): Promise<void> {
  await new Promise((res) => setTimeout(res, 200));
  void name;
}