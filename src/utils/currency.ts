const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$",
  EUR: "€", 
  GBP: "£",
  CAD: "C$",
  AUD: "A$",
  JPY: "¥",
  CHF: "CHF",
  SEK: "kr",
  NOK: "kr", 
  DKK: "kr",
};

export const formatCurrency = (amount: number, currencyCode: string): string => {
  const validCurrencyCode = Object.keys(CURRENCY_SYMBOLS).includes(currencyCode) ? currencyCode : "USD";

  // Special handling for Japanese Yen (no decimal places)
  if (validCurrencyCode === "JPY") {
    const jpyFormatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: validCurrencyCode,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
    return jpyFormatter.format(amount);
  }
  
  const formatter = new Intl.NumberFormat('en-US', { 
    style: 'currency',
    currency: validCurrencyCode,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  
  return formatter.format(amount);
};

export const getCurrencySymbol = (currencyCode: string): string => {
  return CURRENCY_SYMBOLS[currencyCode] || currencyCode;
};