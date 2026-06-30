/**
 * Format a long Indonesian name by keeping the first two words intact,
 * and abbreviating the subsequent words with their initial letter.
 * 
 * Example: "Muhammad Budi Santoso Susilo" -> "Muhammad Budi S. S."
 */
export function formatIndonesianName(name: string): string {
  if (!name) return "";
  
  const words = name.trim().split(/\s+/);
  if (words.length <= 2) {
    return name;
  }
  
  const firstTwo = words.slice(0, 2).join(" ");
  const rest = words.slice(2).map(w => w[0].toUpperCase() + ".").join(" ");
  
  return `${firstTwo} ${rest}`;
}
