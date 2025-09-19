import React, { useState, useEffect } from "react";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../app/App";
import { TerminalDirectory, DirectoryItem } from "../../components";
import { storage } from "../../services/storage-new";

type CurrencySelectionNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "CurrencySelection"
>;

const CURRENCIES = [
  { code: "USD", name: "US Dollar", symbol: "$" },
  { code: "EUR", name: "Euro", symbol: "€" },
  { code: "GBP", name: "British Pound", symbol: "£" },
  { code: "CAD", name: "Canadian Dollar", symbol: "C$" },
  { code: "AUD", name: "Australian Dollar", symbol: "A$" },
  { code: "JPY", name: "Japanese Yen", symbol: "¥" },
  { code: "CHF", name: "Swiss Franc", symbol: "CHF" },
  { code: "SEK", name: "Swedish Krona", symbol: "kr" },
  { code: "NOK", name: "Norwegian Krone", symbol: "kr" },
  { code: "DKK", name: "Danish Krone", symbol: "kr" },
];

export const CurrencySelection = () => {
  const navigation = useNavigation<CurrencySelectionNavigationProp>();
  const [currentCurrency, setCurrentCurrency] = useState<string>("USD");

  useEffect(() => {
    loadCurrentCurrency();
  }, []);

  const loadCurrentCurrency = async () => {
    try {
      const currency = await storage.getCurrency();
      setCurrentCurrency(currency);
    } catch (error) {
      console.error("Error loading currency:", error);
    }
  };

  const handleCurrencySelect = async (currencyCode: string) => {
    try {
      await storage.setCurrency(currencyCode);
      setCurrentCurrency(currencyCode);
      navigation.goBack();
    } catch (error) {
      console.error("Error setting currency:", error);
    }
  };

  const currencyItems: DirectoryItem[] = CURRENCIES.map((currency) => ({
    label: `${currency.code}: ${currency.name} (${currency.symbol})${
      currentCurrency === currency.code ? " [SELECTED]" : ""
    }`,
    onPress: () => handleCurrencySelect(currency.code),
  }));

  return <TerminalDirectory title="CURRENCY/" items={currencyItems} />;
};
