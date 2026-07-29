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
    getAll: `${ERP_BASE}/api/method/rolaface_lms_app.modules.loan.charges.api.get_charges`,
  },

  // =========================
  // DASHBOARD
  // =========================
  dashboard: {},

  // =========================
  // CUSTOMER
  // =========================
  customer: {
    getAllCustomers: `${ERP_BASE}/api/method/rolaface_lms_app.utils.search.get_customers`,
  },

  // =========================
  // LOAN
  // =========================
loan: {
  create: `${ERP_BASE}/api/method/rolaface_lms_app.modules.loan.loan.api.create_loan`,
  getLoans:  `${ERP_BASE}/api/method/rolaface_lms_app.modules.loan.loan.api.get_loans`,
  getLoanById: `${ERP_BASE}/api/method/rolaface_lms_app.modules.loan.loan.api.get_loan_by_id`,
  updateLoan:`${ERP_BASE}/api/method/rolaface_lms_app.modules.loan.loan.api.update_loan`,
  deleteLoan: `${ERP_BASE}/api/method/rolaface_lms_app.modules.loan.loan.api.delete_loan`,
  statusLoan: `${ERP_BASE}/api/method/rolaface_lms_app.modules.loan.loan.api.update_loan_status`,
},

  // =========================
  // LOAN PRODUCT
  // =========================
  loanProduct: {
    get: `${ERP_BASE}/api/method/rolaface_lms_app.modules.loan.product.api.get_loan_products`,
    getAllLoanProducts: `${ERP_BASE}/api/method/rolaface_lms_app.modules.loan.product.api.get_loan_products`,
    create: `${ERP_BASE}/api/method/rolaface_lms_app.modules.loan.product.api.create_loan_product`,
    update: `${ERP_BASE}/api/method/rolaface_lms_app.modules.loan.product.api.update_loan_product`,
    getById: `${ERP_BASE}/api/method/rolaface_lms_app.modules.loan.product.api.get_loan_product_by_id`,
    delete: `${ERP_BASE}/api/method/rolaface_lms_app.modules.loan.product.api.delete_loan_product`,
    enable: `${ERP_BASE}/api/method/rolaface_lms_app.modules.loan.product.api.enable_loan_product`,
    disable: `${ERP_BASE}/api/method/rolaface_lms_app.modules.loan.product.api.disable_loan_product`,
  },

  // =========================
  // SEARCH / LOOKUPS (accounts, items, offset orders)
  // =========================
  search: {
    getAccounts: `${ERP_BASE}/api/method/rolaface_lms_app.utils.search.get_accounts`,
    getItems: `${ERP_BASE}/api/method/rolaface_lms_app.utils.search.get_items`,
    getLoanDemandOffsetOrders: `${ERP_BASE}/api/method/rolaface_lms_app.utils.search.get_loan_demand_offset_orders`,
  },


  // =========================
  // LOAN CLASSIFICATION
  // =========================
  loanClassification: {
    create: `${ERP_BASE}/api/method/rolaface_lms_app.modules.loan.classification.api.create_loan_classification`,
    getAll: `${ERP_BASE}/api/method/rolaface_lms_app.modules.loan.classification.api.get_loan_classifications`,
    getById: `${ERP_BASE}/api/method/rolaface_lms_app.modules.loan.classification.api.get_loan_classification_by_id`,    update: `${ERP_BASE}/api/method/rolaface_lms_app.modules.loan.classification.api.update_loan_classification`,
    delete: `${ERP_BASE}/api/method/rolaface_lms_app.modules.loan.classification.api.delete_loan_classification`,
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
  loanDisbursement: {
    createLoanDsbr: `${ERP_BASE}/api/method/rolaface_lms_app.modules.loan.disbursement.api.create_loan_disbursement`,
    getLoanDsbr: `${ERP_BASE}/api/method/rolaface_lms_app.modules.loan.disbursement.api.get_loan_disbursements`,
    getLoanAppNumber: `${ERP_BASE}/api/resource/Loan`
  },

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