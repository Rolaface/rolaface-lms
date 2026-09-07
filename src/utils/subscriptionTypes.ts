export interface RawSubscribedModules {
  erp?: {
    enabled?: boolean;
    sales?: boolean;
    customer?: boolean;
    procurement?: boolean;
    inventory?: { warehouse?: boolean; stockEntry?: boolean; item?: boolean };
    accounting?: boolean;
    assets?: boolean;
    settings?: {
      bank?: boolean;
      email?: boolean;
      company?: boolean;
      userAndRoles?: boolean;
      scheduler?: boolean;
      taxMain?: { taxCategory?: boolean; salesTax?: boolean; itemTax?: boolean };
    };
  };
  hrms?: {
    enabled?: boolean;
    settings?: { bank?: boolean; email?: boolean; company?: boolean; userAndRoles?: boolean };
    expenseManagement?: boolean;
  };
  lending?: boolean;
}