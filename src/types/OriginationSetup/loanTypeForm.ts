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
          subTypes: {
            id: string;
            name: string;
            purposes: {
              id: string;
              name: string;
            }[];
          }[];
        }[];
        Business: {
          id: string;
          name: string;
          subTypes: {
            id: string;
            name: string;
            purposes: {
              id: string;
              name: string;
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