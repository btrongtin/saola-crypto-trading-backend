export interface IUser {
  email: string;
  accounts: IAccount[];
}

export interface IAccount {
  id: string;
  type: string;
  balance: number;
  currency: 'USD' | 'VND';
}

export interface IRegisterRequestBody {
  email: string;
  password: string;
  accounts: IAccount[];
}

export interface ILoginRequestBody {
  email: string;
  password: string;
}
