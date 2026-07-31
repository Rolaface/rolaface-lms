import { Receivable } from "../view/Accounting/Receivable ";

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
  // Accounting
  // =========================
Accounting: {
  chartOfAccounts: {
    createCOA: `${ERP_BASE}/api/method/erpnext.accounts.utils.add_ac`,
    deleteCOA: `${ERP_BASE}/api/method/frappe.client.delete`,
    getCOA: `${ERP_BASE}/api/method/custom_api.api.chart_of_account.get_chart_of_accounts`,
    getCOAbyId: `${ERP_BASE}/api/resource/Account`,
  
    
    getBalanceSheet: `${ERP_BASE}/api/method/custom_api.api.balance_sheet.get_balance_sheet`,
    getCashFlow: `${ERP_BASE}/api/method/custom_api.api.cash_flow.get_cash_flow`,
    getAllPayables: `${ERP_BASE}/api/method/custom_api.api.accounts_payable.get_accounts_payable`,
    getAllReceivable: `${ERP_BASE}/api/method/custom_api.api.accounts_receivable.get_accounts_receivable`,
    getLedger: `${ERP_BASE}/api/method/custom_api.api.chart_of_account.get_general_ledger_detail`,
  },

  journalEntry: {
   getByIdOnly: `${ERP_BASE}/api/resource`,
    create: `${ERP_BASE}/api/resource/Journal Entry`,
    getAll: `${ERP_BASE}/api/resource/Journal Entry`,
    getById: `${ERP_BASE}/api/resource/Journal Entry`,
    update: `${ERP_BASE}/api/resource/Journal Entry`,
    delete: `${ERP_BASE}/api/resource/Journal Entry`,
    updateStatus: `${ERP_BASE}/api/method/custom_api.api.accounting.journal_entry.api.update_journal_entry_status`,
  },

  profitLoss: {
    get: `${ERP_BASE}/api/method/custom_api.api.profit_loss.get_profit_and_loss`,
  },

  balanceSheet: {
    get:`${ERP_BASE}/api/method/custom_api.api.balance_sheet.get_balance_sheet`,
  },

  generalLedger: {
    get: `${ERP_BASE}/api/method/...`,
  },
  payable:{

    getAllPayables: `${ERP_BASE}/api/method/custom_api.api.accounts_payable.get_accounts_payable`,
   
   
  },
  receivable:{
    getAllReceivable: `${ERP_BASE}/api/method/custom_api.api.accounts_receivable.get_accounts_receivable`,
   
  },
  trialbalnce:{ 
     get:`${ERP_BASE}/api/method/custom_api.api.trial_balance.get_trial_balance`,
    }


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
  
//    },
//     getAll: `${ERP_BASE}/api/method/rolaface_lms_app.modules.loan.charges.api.get_charges`,
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
//   getAllLoanProducts: `${ERP_BASE}/api/method/rolaface_lms_app.modules.loan.product.api.get_loan_products`,
//     get: `${ERP_BASE}/api/method/rolaface_lms_app.modules.loan.product.api.get_loan_products`,
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
    getLoanCategory: `${ERP_BASE}/api/method/rolaface_lms_app.utils.search.get_loan_category`,
  },


  // =========================
  // LOAN CLASSIFICATION
  // =========================
  loanClassification: {
    create: `${ERP_BASE}/api/method/rolaface_lms_app.modules.loan.classification.api.create_loan_classification`,
    getAll: `${ERP_BASE}/api/method/rolaface_lms_app.modules.loan.classification.api.get_loan_classifications`,
    getById: `${ERP_BASE}/api/method/rolaface_lms_app.modules.loan.classification.api.get_loan_classification_by_id`, 
    update: `${ERP_BASE}/api/method/rolaface_lms_app.modules.loan.classification.api.update_loan_classification`,
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
    getLoanDsbrById: `${ERP_BASE}/api/method/rolaface_lms_app.modules.loan.disbursement.api.get_loan_disbursement_by_id`,
    getLoanAppNumber: `${ERP_BASE}/api/resource/Loan`,
    updateLoanDsbr: `${ERP_BASE}/api/method/rolaface_lms_app.modules.loan.disbursement.api.update_loan_disbursement`,
    deleteLoanDsbr: `${ERP_BASE}/api/method/rolaface_lms_app.modules.loan.disbursement.api.delete_loan_disbursement`,
    updateDsbrStatus: `${ERP_BASE}/api/method/rolaface_lms_app.modules.loan.disbursement.api.update_loan_disbursement_status`,
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
  lookup:{
    getAllReceivable: `${ERP_BASE}/api/method/custom_api.api.accounts_receivable.get_accounts_receivable`,
    getSuppliers:`${ERP_BASE}/api/method/custom_api.api.search.get_suppliers`,
    getCostCenters: `${ERP_BASE}/api/method/custom_api.api.search.get_cost_centers`,
    getPayableAccounts:`${ERP_BASE}/api/method/custom_api.api.search.get_payable_accounts`,
     getCustomers:`${ERP_BASE}/api/method/custom_api.api.search.get_customers`,
    getReceivableAccounts: `${ERP_BASE}/api/method/custom_api.api.search.get_receivable_accounts`,

  },
  frappeUtilsAPI:{
 getCompanyCurrentFiscalYear: `${ERP_BASE}/api/method/custom_api.utils.frappe_utils.get_current_fiscal_year`,
  },
} as const;

export default API;