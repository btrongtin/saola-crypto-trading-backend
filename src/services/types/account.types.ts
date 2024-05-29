export interface IUser {
  email: string;
  accounts: IAccount[];
}

export interface IAccount {
  id: string;
  type: string;
  balance: number;
}

export interface IRegisterRequestBody {
  email: string;
  password: string;
  accounts: Array<{
    type: string;
    balance: number;
  }>;
}

export interface ILoginRequestBody {
  email: string;
  password: string;
}
