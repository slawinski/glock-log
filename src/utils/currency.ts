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
  const symbol = CURRENCY_SYMBOLS[currencyCode] || currencyCode;
  
  // Special handling for Japanese Yen (no decimal places)
  if (currencyCode === "JPY") {
    return `${symbol}${Math.round(amount)}`;
  }
  
  // For currencies with symbol at the end (kr)
  if (["SEK", "NOK", "DKK"].includes(currencyCode)) {
    return `${amount.toFixed(2)} ${symbol}`;
  }
  
  // For most currencies (symbol at the beginning)
  return `${symbol}${amount.toFixed(2)}`;
};

export const getCurrencySymbol = (currencyCode: string): string => {
  return CURRENCY_SYMBOLS[currencyCode] || currencyCode;
};