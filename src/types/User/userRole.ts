export const LMS_MODULES = [
  "Loan",
  "Loan Repayment",
  "Loan Disbursement",
  "Loan Restructure",
  "Loan Write Off",
  "Loan Transfer",
  "Customer",
  "Loan Category",
  "Loan Classification",
  "Loan Product",
  "Loan Demand Offset Order",
  "Item",
  "Loan Security",
  "Loan Security Type",
  "Loan Application",
  "Account",
  "Journal Entry",
] as const;

export type LmsModule = (typeof LMS_MODULES)[number];

export interface PermissionEntry {
  module: LmsModule;
  read: 0 | 1;
  write: 0 | 1;
  create: 0 | 1;
  delete: 0 | 1;
  import: 0 | 1;
  export: 0 | 1;
  report: 0 | 1;
  submit: 0 | 1;
  cancel: 0 | 1;
  email: 0 | 1;
}

export interface UserRole {
  role: string;
  permission: PermissionEntry[];
}

export type UserRoleFormData = UserRole;

export const EMPTY_FORM: UserRole = {
  role: "",
  permission: [],
};