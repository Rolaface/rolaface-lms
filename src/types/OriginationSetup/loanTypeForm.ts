interface LoanTypeSetupItem {
  id?: string;
  name: string;
}

export interface CreateLoanTypePayload {
  Individual?: (LoanTypeSetupItem & { subTypes: (LoanTypeSetupItem & { purposes: LoanTypeSetupItem[] })[] })[];
  Business?: (LoanTypeSetupItem & { subTypes: (LoanTypeSetupItem & { purposes: LoanTypeSetupItem[] })[] })[];
  version?: string;
}

export interface CreateLoantypeResponse {
  message: {
    status_code: number;
    status: string;
    message: string;
    data: {
      setup: {
        Individual: {
          id: string;
          name: string;
          isActive?: number;
          subTypes: {
            id: string;
            name: string;
            isActive?: number;
            purposes: {
              id: string;
              name: string;
              isActive?: number;
            }[];
          }[];
        }[];
        Business: {
          id: string;
          name: string;
          isActive?: number;
          subTypes: {
            id: string;
            name: string;
            isActive?: number;
            purposes: {
              id: string;
              name: string;
              isActive?: number;
            }[];
          }[];
        }[];
      };
      version: string;
      summary?: {
        created: number;
        renamed: number;
        reactivated: number;
        deleted: number;
        deactivated: { id: string; name: string; level: number }[];
      };
    };
  };
}