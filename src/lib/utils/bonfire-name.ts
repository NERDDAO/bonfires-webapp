export function cleanBonfireName(name: string): string {
  return name.replace(/\s*synthesis judge bonfire$/i, "").trim() || name;
}
