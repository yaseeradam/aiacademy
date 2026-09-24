/**
 * Converts numbers into English words for Nigerian Naira currency amounts.
 * Example: 50000 -> "Fifty Thousand Naira Only"
 * Example: 65000 -> "Sixty-Five Thousand Naira Only"
 */

export function numberToWords(num: number): string {
  if (isNaN(num) || num === 0) return 'Zero';

  const ones = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
  ];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const helper = (n: number): string => {
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? '-' + ones[n % 10] : '');
    if (n < 1000) {
      const rem = n % 100;
      return ones[Math.floor(n / 100)] + ' Hundred' + (rem !== 0 ? ' and ' + helper(rem) : '');
    }
    if (n < 1000000) {
      const rem = n % 1000;
      return helper(Math.floor(n / 1000)) + ' Thousand' + (rem !== 0 ? (rem < 100 ? ' and ' : ' ') + helper(rem) : '');
    }
    if (n < 1000000000) {
      const rem = n % 1000000;
      return helper(Math.floor(n / 1000000)) + ' Million' + (rem !== 0 ? (rem < 100 ? ' and ' : ' ') + helper(rem) : '');
    }
    return helper(Math.floor(n / 1000000000)) + ' Billion' + (n % 1000000000 !== 0 ? ' ' + helper(n % 1000000000) : '');
  };

  return helper(num).trim();
}

export function numberToNairaWords(amount: number | string): string {
  if (!amount) return '';
  const cleanStr = String(amount).replace(/[^0-9.]/g, '');
  const num = parseFloat(cleanStr);
  if (isNaN(num) || num <= 0) return '';

  const integerPart = Math.floor(num);
  const words = numberToWords(integerPart);
  return `${words} Naira Only`;
}
