export interface CreateLoanTypePayload {
  Individual?: {
    name: string;
    subTypes: {
      name: string;
      purposes: {
        name: string;
      }[];
    }[];
  }[];
  Business?: {
    name: string;
    subTypes: {
      name: string;
      purposes: {
        name: string;
      }[];
    }[];
  }[];
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
      summary: {
        created: number;
        renamed: number;
        reactivated: number;
        deleted: number;
        deactivated: any[];
      };
    };
  };
}