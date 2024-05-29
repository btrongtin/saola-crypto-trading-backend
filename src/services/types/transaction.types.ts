export interface ISendTransactionRequestBody {
  amount: number;
  toAddress: string;
  accountId: string;
  currency: string;
}

// Define the structure for the withdraw transaction request body
export interface IWithdrawTransactionRequestBody {
  amount: number;
  accountId: string;
  currency: string;
}
