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
Company:{
  getById: `${ERP_BASE}/api/method/custom_api.api.organization.company.api.get`,
  getUserDetails: `${ERP_BASE}/api/method/auth_api.user_management.api.auth.get_login_user`,
  getCurrency: `${ERP_BASE}/api/method/custom_api.api.search.get_currencies`,
},
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
    get: `${ERP_BASE}/api/method/custom_api.api.chart_of_account.get_general_ledger_detail`,
    viewLedger:`${ERP_BASE}/api/method/custom_api.api.chart_of_account.get_general_ledger_detail`,
  },
  payable:{

    getAllPayables: `${ERP_BASE}/api/method/custom_api.api.accounts_payable.get_accounts_payable`,
   
   
  },
  receivable:{
    getAllReceivable: `${ERP_BASE}/api/method/custom_api.api.accounts_receivable.get_accounts_receivable`,
   
  },
  trialbalnce:{ 
     get:`${ERP_BASE}/api/method/custom_api.api.trial_balance.get_trial_balance`,
    },
  cashFlow: {
    get: `${ERP_BASE}/api/method/custom_api.api.cash_flow.get_cash_flow`,
  },  


},




RoleManagement: {
  createUserRoles: `${ERP_BASE}/api/method/auth_api.role_management.api.role.create`,
  getUserRoles: `${ERP_BASE}/api/method/auth_api.role_management.api.role.get`,
  getUserRolesbyId: `${ERP_BASE}/api/method/auth_api.role_management.api.role.get_by_id`,
  updateUserRoles: `${ERP_BASE}/api/method/auth_api.role_management.api.role.update`,
  updateUserRolesStatus: `${ERP_BASE}/api/method/auth_api.role_management.api.role.update_status`,
  createUser: `${ERP_BASE}/api/method/auth_api.user_management.api.auth.signup`,
  Language: `${ERP_BASE}/api/method/frappe.desk.search.search_link`,
  getUser: `${ERP_BASE}/api/method/auth_api.user_management.api.auth.get`,
  getUserbyId: `${ERP_BASE}/api/method/auth_api.user_management.api.auth.get_user_by_id`,
  updateUser: `${ERP_BASE}/api/method/auth_api.user_management.api.auth.update`,
  deleteUser: `${ERP_BASE}/api/method/frappe.client.delete`,
  getGender: `${ERP_BASE}/api/resource/Gender`,
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
  dashboard: {
    getSummary: `${ERP_BASE}/api/method/rolaface_lms_app.modules.dashboard.api.get_dashboard_summary`,
    getCharts: `${ERP_BASE}/api/method/rolaface_lms_app.modules.dashboard.api.get_dashboard_charts`,
    getQuickInsights: `${ERP_BASE}/api/method/rolaface_lms_app.modules.dashboard.api.get_quick_insights`,
    getPendingApprovals: `${ERP_BASE}/api/method/rolaface_lms_app.modules.dashboard.api.get_pending_approvals`,
    getOverdueTasks: `${ERP_BASE}/api/method/rolaface_lms_app.modules.dashboard.api.get_overdue_tasks`,
  },

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
  uploadFile: `${ERP_BASE}/api/method/upload_file`,
  create: `${ERP_BASE}/api/method/rolaface_lms_app.modules.loan.loan.api.create_loan`,
  loanDocument: `${ERP_BASE}/api/method/rolaface_lms_app.modules.loan.loan.api.attach_loan_documents`,
  getLoans:  `${ERP_BASE}/api/method/rolaface_lms_app.modules.loan.loan.api.get_loans`,
  getLoanById: `${ERP_BASE}/api/method/rolaface_lms_app.modules.loan.loan.api.get_loan_by_id`,
  updateLoan:`${ERP_BASE}/api/method/rolaface_lms_app.modules.loan.loan.api.update_loan`,
  deleteLoan: `${ERP_BASE}/api/method/rolaface_lms_app.modules.loan.loan.api.delete_loan`,
  statusLoan: `${ERP_BASE}/api/method/rolaface_lms_app.modules.loan.loan.api.update_loan_status`,
  getLoanScheduleById: `${ERP_BASE}/api/method/rolaface_lms_app.modules.loan.loan.api.get_repayment_schedule_by_id`,
},
loanView: {
  getOverview: `${ERP_BASE}/api/method/rolaface_lms_app.modules.loan.loan.loan_view.api.get_loan_overview`,
  getInstallmentDetail: `${ERP_BASE}/api/method/rolaface_lms_app.modules.loan.loan.loan_view.api.get_installment_detail`,
  getScheduleTimeline: `${ERP_BASE}/api/method/rolaface_lms_app.modules.loan.loan.loan_view.api.get_repayment_schedule_timeline`,
  getScheduleVersions: `${ERP_BASE}/api/method/rolaface_lms_app.modules.loan.loan.loan_view.api.get_repayment_schedule_versions`,
  getSchedule: `${ERP_BASE}/api/method/rolaface_lms_app.modules.loan.loan.loan_view.api.get_repayment_schedule`,
  getRepaymentHistory: `${ERP_BASE}/api/method/rolaface_lms_app.modules.loan.loan.loan_view.api.get_repayment_history`,
  getAccountingLedger: `${ERP_BASE}/api/method/rolaface_lms_app.modules.loan.loan.loan_view.api.get_loan_accounting_ledger`,
  getCollateralView: `${ERP_BASE}/api/method/rolaface_lms_app.modules.loan.loan.loan_view.api.get_collateral_view`,
  getDocuments: `${ERP_BASE}/api/method/rolaface_lms_app.modules.loan.loan.loan_view.api.get_loan_documents`,
  getActivityAudit: `${ERP_BASE}/api/method/rolaface_lms_app.modules.loan.loan.loan_view.api.get_loan_activity_audit`,
  getDisbursementHistory: `${ERP_BASE}/api/method/rolaface_lms_app.modules.loan.loan.loan_view.api.get_disbursement_history`,
},
loanStatement: {
    getDashboard: `${ERP_BASE}/api/method/rolaface_lms_app.modules.loan.loan.loan_statement.api.get_loan_statement_dashboard`,
    getStatement: `${ERP_BASE}/api/method/rolaface_lms_app.modules.loan.loan.loan_statement.api.get_loan_statement`,
    exportPdf: `${ERP_BASE}/api/method/rolaface_lms_app.modules.loan.loan.loan_statement.api.export_loan_statement_pdf`,
    exportExcel: `${ERP_BASE}/api/method/rolaface_lms_app.modules.loan.loan.loan_statement.api.export_loan_statement_excel`,
  },

    loanArrear: {
    getSummary: `${ERP_BASE}/api/method/rolaface_lms_app.modules.loan.loan.loan_arrear.api.get_arrear_summary`,
    getCharts: `${ERP_BASE}/api/method/rolaface_lms_app.modules.loan.loan.loan_arrear.api.get_arrear_charts`,
    getInsights: `${ERP_BASE}/api/method/rolaface_lms_app.modules.loan.loan.loan_arrear.api.get_arrear_insights`,
    getTopOverdueAccounts: `${ERP_BASE}/api/method/rolaface_lms_app.modules.loan.loan.loan_arrear.api.get_top_overdue_accounts`,
    exportExcel: `${ERP_BASE}/api/method/rolaface_lms_app.modules.loan.loan.loan_arrear.api.export_arrear_report`,
  },


  collectionSequence: {
    create:`${ERP_BASE}/api/method/rolaface_lms_app.modules.loan.collection_order.api.create`,
    getSequence:`${ERP_BASE}/api/method/rolaface_lms_app.modules.loan.collection_order.api.get_all`,
    getById:`${ERP_BASE}/api/method/rolaface_lms_app.modules.loan.collection_order.api.get`,
    updateSequence:`${ERP_BASE}/api/method/rolaface_lms_app.modules.loan.collection_order.api.update`,
    deleteSequence:`${ERP_BASE}/api/method/frappe.client.delete`
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

  loanRestructure: {
    create:`${ERP_BASE}/api/method/rolaface_lms_app.modules.loan.restructure.api.create`,
    getAll:`${ERP_BASE}/api/method/rolaface_lms_app.modules.loan.restructure.api.get_all`,
    getById:`${ERP_BASE}/api/method/rolaface_lms_app.modules.loan.restructure.api.get`,
    update:`${ERP_BASE}/api/method/rolaface_lms_app.modules.loan.restructure.api.update`,
    summary:`${ERP_BASE}/api/method/lending.loan_management.doctype.loan_repayment.loan_repayment.calculate_amounts`,
    search:`${ERP_BASE}/api/method/rolaface_lms_app.modules.loan.repayment.api.get_loan_repayment_account`,
    delete:`${ERP_BASE}/api/method/rolaface_lms_app.modules.loan.restructure.api.delete`,
    loanGetById: `${ERP_BASE}/api/method/rolaface_lms_app.modules.loan.loan.api.get_loan_by_id`,
    getCharges:`${ERP_BASE}/api/method/rolaface_lms_app.utils.search.get_items`,
    updateStatus:`${ERP_BASE}/api/method/frappe.desk.doctype.bulk_update.bulk_update.submit_cancel_or_update_docs`,
    getRepaymentSchedule:`${ERP_BASE}/api/method/lending.api.get_repayment_schedule`
  },

  // =========================
  // SEARCH / LOOKUPS (accounts, items, offset orders)
  // =========================
  search: {
    getAccounts: `${ERP_BASE}/api/method/rolaface_lms_app.utils.search.get_accounts`,
    getItems: `${ERP_BASE}/api/method/rolaface_lms_app.utils.search.get_items`,
    getLoanDemandOffsetOrders: `${ERP_BASE}/api/method/rolaface_lms_app.utils.search.get_loan_demand_offset_orders`,
    getLoanCategory: `${ERP_BASE}/api/method/rolaface_lms_app.utils.search.get_loan_category`,
    getLoanDemandOffsetOrderDetail: `${ERP_BASE}/api/resource/Loan Demand Offset Order`,

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
  loanApplication: {
    create: `${ERP_BASE}/api/method/rolaface_lms_app.modules.loan.custom_api.loanApplication.api.create_custom_loan_application`,
    getLoanApplication: `${ERP_BASE}/api/method/rolaface_lms_app.modules.loan.custom_api.loanApplication.api.get_custom_loan_applications`,
    convertToLoan: `${ERP_BASE}/api/method/rolaface_lms_app.modules.loan.custom_api.loanApplication.api.convert_custom_loan_application_to_loan`,
    getLoanApplicationById: `${ERP_BASE}/api/method/rolaface_lms_app.modules.loan.custom_api.loanApplication.api.get_custom_loan_application_by_id`,
    updateLoanApplication: `${ERP_BASE}/api/method/rolaface_lms_app.modules.loan.custom_api.loanApplication.api.update_custom_loan_application`,
    deleteLoanApplication: `${ERP_BASE}/api/method/rolaface_lms_app.modules.loan.custom_api.loanApplication.api.delete_custom_loan_application`,
    getCountries: `${ERP_BASE}/api/method/rolaface_lms_app.modules.loan.loanApplication.api.get_countries`,
  },

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
    modeOfPayment: `${ERP_BASE}/api/resource/Mode of Payment`,
  },

  // =========================
  // REPAYMENT SCHEDULE
  // =========================
  repaymentSchedule: {},

  // =========================
  // LOAN REPAYMENT
  // =========================
  loanRepayment: {
    getLoanReapyAcc: `${ERP_BASE}/api/method/rolaface_lms_app.modules.loan.repayment.api.get_loan_repayment_account`,
    createLoanRepay: `${ERP_BASE}/api/method/rolaface_lms_app.modules.loan.repayment.api.create`,
    getLoanDues: `${ERP_BASE}/api/method/lending.loan_management.doctype.loan_repayment.loan_repayment.calculate_amounts`,
    updateLoanRepay: `${ERP_BASE}/api/method/rolaface_lms_app.modules.loan.repayment.api.update`,
    getLoanRepayById: `${ERP_BASE}/api/method/rolaface_lms_app.modules.loan.repayment.api.get_by_id`,
    getAllLoanRepay: `${ERP_BASE}/api/method/rolaface_lms_app.modules.loan.repayment.api.get_all`,
    updateStatus: `${ERP_BASE}/api/method/rolaface_lms_app.modules.loan.repayment.api.update_status`,
    deleteLoanRepay: `${ERP_BASE}/api/method/rolaface_lms_app.modules.loan.repayment.api.delete`,
     modeOfPayment: `${ERP_BASE}/api/resource/Mode of Payment`,
  },



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
  collateralType: {
     createCollateralType: `${ERP_BASE}/api/method/rolaface_lms_app.modules.loan.collateralType.api.create_collateral_type`,
    getCollateralType: `${ERP_BASE}/api/method/rolaface_lms_app.modules.loan.collateralType.api.get_collateral_types`,
    getCollateralTypeById: `${ERP_BASE}/api/method/rolaface_lms_app.modules.loan.collateralType.api.get_collateral_type_by_id`,
     updateCollateralType: `${ERP_BASE}/api/method/rolaface_lms_app.modules.loan.collateralType.api.update_collateral_type`,
    deleteCollateralType: `${ERP_BASE}/api/method/rolaface_lms_app.modules.loan.collateralType.api.delete_collateral_type`,
     enableCollateralType: `${ERP_BASE}/api/method/rolaface_lms_app.modules.loan.collateralType.api.enable_collateral_type`,
    disableCollateralType: `${ERP_BASE}/api/method/rolaface_lms_app.modules.loan.collateralType.api.disable_collateral_type`,
  },

  // =========================
  // COLLATERAL
  // =========================
  collateral: {
     createCollateral: `${ERP_BASE}/api/method/rolaface_lms_app.modules.loan.collateral.api.create_collateral`,
    getCollateral: `${ERP_BASE}/api/method/rolaface_lms_app.modules.loan.collateral.api.get_collateral`,
    getCollateralById: `${ERP_BASE}/api/method/rolaface_lms_app.modules.loan.collateral.api.get_collateral_by_id`,
    updateCollateral: `${ERP_BASE}/api/method/rolaface_lms_app.modules.loan.collateral.api.update_collateral`,
    deleteCollateral: `${ERP_BASE}/api/method/rolaface_lms_app.modules.loan.collateral.api.delete_collateral`,
    enableCollateral: `${ERP_BASE}/api/method/rolaface_lms_app.modules.loan.collateral.api.enable_collateral`,
    disableCollateral: `${ERP_BASE}/api/method/rolaface_lms_app.modules.loan.collateral.api.disable_collateral`,
  },

  // =========================
  // LOAN CATEGORY
  // =========================
  loanCategory: {
    getAll: `${ERP_BASE}/api/method/rolaface_lms_app.modules.loan.category.api.get_all`,
    getById: `${ERP_BASE}/api/method/rolaface_lms_app.modules.loan.category.api.get`,
    create: `${ERP_BASE}/api/method/rolaface_lms_app.modules.loan.category.api.create`,
    update: `${ERP_BASE}/api/method/rolaface_lms_app.modules.loan.category.api.update`,
    enableDisable: `${ERP_BASE}/api/method/rolaface_lms_app.modules.loan.category.api.enable_disable`,
    delete: `${ERP_BASE}/api/method/frappe.client.delete`,
  },

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
    getCurrency: `${ERP_BASE}/api/method/erpnext.setup.utils.get_exchange_rate`,
    currencylistsearch:`${ERP_BASE}/api/method/custom_api.api.search.get_currencies`,

    getLoanProducts: `${ERP_BASE}/api/method/rolaface_lms_app.utils.search.get_loan_products`,
    getLoanApplications: `${ERP_BASE}/api/method/rolaface_lms_app.utils.search.get_loan_applications`,
    getCurrencies: `${ERP_BASE}/api/method/rolaface_lms_app.utils.search.get_currencies`,
    getLoans: `${ERP_BASE}/api/method/rolaface_lms_app.utils.search.get_loans`,
    getLoanSecurityTypes: `${ERP_BASE}/api/method/rolaface_lms_app.utils.search.get_loan_security_types`,
    getLoanCategory: `${ERP_BASE}/api/method/rolaface_lms_app.utils.search.get_loan_category`,
    getLoanSecurities: `${ERP_BASE}/api/method/rolaface_lms_app.utils.search.get_loan_securities`,
    getLoanDisbursements: `${ERP_BASE}/api/method/rolaface_lms_app.utils.search.get_loan_disbursements`,
    getLoanRepayments: `${ERP_BASE}/api/method/rolaface_lms_app.utils.search.get_loan_repayments`,
    getLoanPartners: `${ERP_BASE}/api/method/rolaface_lms_app.utils.search.get_loan_partners`,
    getLoanDemandOffsetOrders: `${ERP_BASE}/api/method/rolaface_lms_app.utils.search.get_loan_demand_offset_orders`,
    getAccounts: `${ERP_BASE}/api/method/rolaface_lms_app.utils.search.get_accounts`,
    getItems: `${ERP_BASE}/api/method/rolaface_lms_app.utils.search.get_items`,
    get_loan_classification: `${ERP_BASE}/api/method/rolaface_lms_app.utils.search.get_loan_classification`,
    getCountries: `${ERP_BASE}/api/resource/Country`,
    getGenders: `${ERP_BASE}/api/resource/Gender`,
    getIndustries: `${ERP_BASE}/api/resource/Industry Type`,
  },
  frappeUtilsAPI:{
 getCompanyCurrentFiscalYear: `${ERP_BASE}/api/method/custom_api.utils.frappe_utils.get_current_fiscal_year`,
 getaccounts:`${ERP_BASE}/api/resource/Account`
  },
} as const;

export default API;