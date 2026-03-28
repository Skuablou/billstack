import { createContext, useContext, useState, ReactNode } from "react";

type Currency = "€" | "$";

const CurrencyContext = createContext<{
  currency: Currency;
  toggle: () => void;
}>({ currency: "€", toggle: () => {} });

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrency] = useState<Currency>("€");
  const toggle = () => setCurrency((c) => (c === "€" ? "$" : "€"));
  return (
    <CurrencyContext.Provider value={{ currency, toggle }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  return useContext(CurrencyContext);
}
