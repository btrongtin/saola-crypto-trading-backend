import { MONEY_EXCHANGE_RATE } from '../../constant';
import { Currency } from '@prisma/client';

export default function (from: Currency, to: Currency, amount: number): number {
  if (!MONEY_EXCHANGE_RATE[from] || !MONEY_EXCHANGE_RATE[to]) {
    throw new Error('Unsupported currency type');
  }
  if (from === to) return amount;

  return (amount * MONEY_EXCHANGE_RATE[from]) / MONEY_EXCHANGE_RATE[to];
}
