/** Spanish number formatting (non-breaking space before €, so amounts never wrap apart) that does not depend on the runtime's ICU data (same output on server and browser). */
const group = (s: string) => s.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
export const eur0 = (n: number) => `${group(String(Math.round(n)))}\u00a0€`;
export const eur2 = (n: number) => { const [i, d] = Math.abs(n).toFixed(2).split("."); return `${n < 0 ? "−" : ""}${group(i)},${d}\u00a0€`; };
export const num0 = (n: number) => group(String(Math.round(n)));
