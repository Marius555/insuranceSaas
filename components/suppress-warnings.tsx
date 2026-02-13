"use client";

if (process.env.NODE_ENV === "development" && typeof window !== "undefined") {
  const originalError = console.error;
  console.error = (...args: unknown[]) => {
    if (
      typeof args[0] === "string" &&
      args[0].includes("Each child in a list should have a unique") &&
      args.some(
        (arg) => typeof arg === "string" && arg.includes("OuterLayoutRouter")
      )
    ) {
      return;
    }
    originalError.apply(console, args);
  };
}

export function SuppressWarnings() {
  return null;
}
