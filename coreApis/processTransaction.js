export default (transaction) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve(transaction);
      // reject('Transaction processing failed'); // Simulate transaction processing failure
    }, 3000); //3 seconds
  });
};
