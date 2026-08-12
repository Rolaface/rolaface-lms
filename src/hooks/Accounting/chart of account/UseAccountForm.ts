import { useEffect, useState } from 'react';
import { showApiError, showSuccess, showValidationError } from '../../../utils/alert';
import {
  createAccount,
  updateAccount,
  type CreateCOAPayload,
  type COAAccount,
} from '../../../api/Accounting/Chartofaccounts.api';

export interface NewAccountForm {
  accountName: string;
  accountNumber: string;
  isGroup: boolean;
  rootType: string;
  accountType: string;
  currency: string;
  parentAccount: string;
}

export type NewAccountErrors = Partial<Record<keyof NewAccountForm, string>>;

export const ROOT_TYPE_OPTIONS = ['Asset', 'Liability', 'Income', 'Expense', 'Equity'];

export const ACCOUNT_TYPE_OPTIONS = [
  'Accumulated Depreciation', 'Asset Received But Not Billed', 'Bank', 'Cash',
  'Chargeable', 'Capital Work in Progress', 'Cost of Goods Sold', 'Current Asset',
  'Current Liability', 'Depreciation', 'Direct Expense', 'Direct Income', 'Equity',
  'Expense Account', 'Expenses Included In Asset Valuation', 'Expenses Included In Valuation',
  'Fixed Asset', 'Income Account', 'Indirect Expense', 'Indirect Income', 'Liability',
  'Payable', 'Receivable', 'Round Off', 'Round Off for Opening', 'Stock',
  'Stock Adjustment', 'Stock Received But Not Billed', 'Service Received But Not Billed',
  'Tax', 'Temporary',
];

const emptyForm = (overrides?: Partial<NewAccountForm>): NewAccountForm => ({
  accountName: '',
  accountNumber: '',
  isGroup: false,
  rootType: '',
  accountType: '',
  currency: '',
  parentAccount: '',
  ...overrides,
});

interface UseAccountFormArgs {
  company: string;
  baseCurrency: string;
  parentAccount?: COAAccount | null;
  editAccount?: COAAccount | null;
  onSuccess?: () => void;
}

export function useAccountForm({
  company,
  baseCurrency,
  parentAccount,
  editAccount,
  onSuccess,
}: UseAccountFormArgs) {
  const [form, setForm] = useState<NewAccountForm>(emptyForm({ currency: baseCurrency }));
  const [errors, setErrors] = useState<NewAccountErrors>({});
  const [loading, setLoading] = useState(false);
  const isEditMode = !!editAccount;

  // Re-seed the form whenever the target (edit / add-child / plain create) changes
  useEffect(() => {
    if (editAccount) {
      setForm(emptyForm({
        accountName: editAccount.account_name,
        accountNumber: editAccount.account_number ?? '',
        isGroup: editAccount.is_group === 1,
        rootType: editAccount.root_type ?? '',
        accountType: editAccount.account_type ?? '',
        currency: editAccount.account_currency ?? baseCurrency,
        parentAccount: editAccount.parent_account ?? '',
      }));
    } else if (parentAccount) {
      setForm(emptyForm({
        parentAccount: parentAccount.name,
        accountType: parentAccount.account_type ?? '',
        currency: baseCurrency,
      }));
    } else {
      setForm(emptyForm({ currency: baseCurrency }));
    }
    setErrors({});
  }, [editAccount, parentAccount, baseCurrency]);

  const setField = <K extends keyof NewAccountForm>(name: K, value: NewAccountForm[K]) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const validate = (): boolean => {
    const next: NewAccountErrors = {};
    if (!isEditMode && !form.accountName.trim()) {
      next.accountName = 'Account name is required';
    }
    if (form.isGroup && !form.rootType) {
      next.rootType = 'Root type is required for group accounts';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const reset = () => {
    if (editAccount) {
      setForm(emptyForm({
        accountName: editAccount.account_name,
        accountNumber: editAccount.account_number ?? '',
        isGroup: editAccount.is_group === 1,
        rootType: editAccount.root_type ?? '',
        accountType: editAccount.account_type ?? '',
        currency: editAccount.account_currency ?? baseCurrency,
      }));
    } else if (parentAccount) {
      setForm(emptyForm({ parentAccount: parentAccount.name, currency: baseCurrency }));
    } else {
      setForm(emptyForm({ currency: baseCurrency }));
    }
    setErrors({});
  };

  const handleSubmit = async () => {
    if (!validate()) {
      showValidationError('Please fix the highlighted fields.');
      return;
    }

    setLoading(true);
    try {
      const basePayload: CreateCOAPayload = {
        doctype: 'Account',
        is_root: 'false',
        company,
        is_group: form.isGroup ? 1 : 0,
        account_number: form.accountNumber.trim() || undefined,
        account_currency: form.currency.trim() || undefined,
        account_type: form.accountType || undefined,
        root_type: form.isGroup ? form.rootType : undefined,
        parent: form.parentAccount || undefined,
      };

      if (isEditMode && editAccount) {
        const res = await updateAccount(editAccount.name, {
          ...basePayload,
          name: editAccount.name,
          account_name: editAccount.account_name,
        });
        showSuccess(res?.message?.message ?? 'Account updated successfully');
      } else {
        const res = await createAccount({
          ...basePayload,
          account_name: form.accountName.trim(),
        });
        showSuccess(res?.message?.message ?? 'Account created successfully');
      }

      onSuccess?.();
    } catch (err: any) {
      showApiError(err?.response?.data?.message ?? err?.message ?? 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return { form, setField, errors, loading, isEditMode, handleSubmit, reset };
}