"use client";

import { useState, useEffect, startTransition } from "react";
import { getUserLocation } from "@/lib/utils/country-detection";

interface CurrencyAmountProps {
  amount: number;
  className?: string;
}

export function CurrencyAmount({ amount, className }: CurrencyAmountProps) {
  const [currencySymbol, setCurrencySymbol] = useState("$");

  useEffect(() => {
    startTransition(() => {
      setCurrencySymbol(getUserLocation().currencySymbol);
    });
  }, []);

  return (
    <span className={className}>
      {currencySymbol}{amount.toLocaleString("en-US")}
    </span>
  );
}
