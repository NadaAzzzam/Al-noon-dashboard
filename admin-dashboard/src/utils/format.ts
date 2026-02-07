/** Format a number as price in Egyptian Pounds (EGP). */
export function formatPriceEGP(value: number): string {
  return `${value.toFixed(2)} EGP`;
}
