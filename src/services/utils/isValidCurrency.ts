import { Currency } from '@prisma/client';

export default function (currency: string): currency is Currency {
  return currency === 'USD' || currency === 'VND';
}
