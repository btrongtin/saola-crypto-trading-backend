/**
 * Simulates processing a transaction with a delay.
 * @param {T} transaction - The transaction object to be processed.
 * @returns {Promise<T>} - A promise that resolves with the transaction object after a delay.
 */
export default function processTransaction<T>(transaction: T): Promise<T> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      reject('REJECT')
      // resolve(transaction);
    }, 3000); // 3 seconds
  });
}
