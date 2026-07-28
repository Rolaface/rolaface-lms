// src/config/api.ts
const ERP_BASE = (import.meta.env.VITE_API_BASE_URL ?? "") as string;

export { ERP_BASE };

export const API = {
  // =========================
  // AUTH
  // =========================
  auth: {
    // login: `${ERP_BASE}/api/method/...`,
    // logout: `${ERP_BASE}/api/method/...`,
  },
  // =========================
  // CHARGES
  // =========================
  loanCharges: {
    createCharges: `${ERP_BASE}/api/method/rolaface_lms_app.modules.loan.charges.api.create_charge`,
  },
  // =========================
  // DASHBOARD
  // =========================
  dashboard: {},

  // =========================
  // CUSTOMER
  // =========================
  customer: {
    getAllCustomers: `${ERP_BASE}/api/method/rolaface_lms_app.utils.search.get_customers`
  },

  // =========================
  // LOAN
  // =========================
loan: {
  create: `${ERP_BASE}/api/method/rolaface_lms_app.modules.loan.loan.api.create_loan`,
  getLoans:  `${ERP_BASE}/api/method/rolaface_lms_app.modules.loan.loan.api.get_loans`,
  getLoanById: `${ERP_BASE}/api/method/rolaface_lms_app.modules.loan.loan.api.get_loan_by_id`,
  updateLoan:`${ERP_BASE}/api/method/rolaface_lms_app.modules.loan.loan.api.update_loan`,
},

  // =========================
  // LOAN PRODUCT
  // =========================
  loanProduct: {
  get: `${ERP_BASE}/api/method/rolaface_lms_app.modules.loan.product.api.get_loan_products`,
    getAllLoanProducts: `${ERP_BASE}/api/method/rolaface_lms_app.modules.loan.product.api.get_loan_products`,
  },

  // =========================
  // LOAN APPLICATION
  // =========================
  loanApplication: {},

  // =========================
  // LOAN APPROVAL
  // =========================
  loanApproval: {},

  // =========================
  // LOAN DISBURSEMENT
  // =========================
  loanDisbursement: {},

  // =========================
  // REPAYMENT SCHEDULE
  // =========================
  repaymentSchedule: {},

  // =========================
  // LOAN REPAYMENT
  // =========================
  loanRepayment: {},

  // =========================
  // LOAN RESTRUCTURE
  // =========================
  loanRestructure: {},

  // =========================
  // LOAN CLOSURE
  // =========================
  loanClosure: {},

  // =========================
  // PENALTY
  // =========================
  penalty: {},

  // =========================
  // WRITE OFF
  // =========================
  writeOff: {},

  // =========================
  // COLLECTIONS
  // =========================
  collections: {},

  // =========================
  // GUARANTOR
  // =========================
  guarantor: {},

  // =========================
  // COLLATERAL
  // =========================
  collateral: {},

  // =========================
  // REPORTS
  // =========================
  reports: {},

  // =========================
  // SETTINGS
  // =========================
  settings: {},

  // =========================
  // FILE UPLOAD
  // =========================
  upload: {},

  // =========================
  // COMMON
  // =========================
  common: {},
} as const;

export default API;