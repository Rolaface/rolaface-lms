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
    getById: `${ERP_BASE}/api/method/rolaface_lms_app.modules.loan.charges.api.get_charge_by_id`,
    getAll: `${ERP_BASE}/api/method/rolaface_lms_app.modules.loan.charges.api.get_charges`,
    deleteCharge: `${ERP_BASE}/api/method/rolaface_lms_app.modules.loan.charges.api.delete_charge`,
    updateCharge: `${ERP_BASE}/api/method/rolaface_lms_app.modules.loan.charges.api.update_charge`,
  
   },

  // =========================
  // Loan Writeoff
  // =========================
  loanWriteoff: {
    createWriteoff: `${ERP_BASE}/api/method/rolaface_lms_app.modules.loan.write_off.api.create_loan_write_off`,
    getWriteOffAccounts:`${ERP_BASE}/api/method/rolaface_lms_app.utils.search.get_accounts`,
    getLoanAccounts:`${ERP_BASE}/api/method/rolaface_lms_app.utils.search.get_loans`,
    getAll:`${ERP_BASE}/api/method/rolaface_lms_app.modules.loan.write_off.api.get_loan_write_offs`,
    getWriteOffById:`${ERP_BASE}/api/method/rolaface_lms_app.modules.loan.write_off.api.get_loan_write_off_by_id`,
    updateWriteoff:`${ERP_BASE}/api/method/rolaface_lms_app.modules.loan.write_off.api.update_loan_write_off`,
    deleteWriteoff:`${ERP_BASE}/api/method/rolaface_lms_app.modules.loan.write_off.api.delete_loan_write_off`,
    updateStatus: `${ERP_BASE}/api/method/rolaface_lms_app.modules.loan.write_off.api.update_loan_write_off_status`,
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