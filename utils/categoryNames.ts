/** Case-insensitive name comparison for duplicate checks. */
export function normalizeCategoryName(name: string): string {
  return name.trim().toLowerCase();
}

export function isCategoryNameTaken(
  categories: { id: string; name: string }[],
  name: string,
  excludeId?: string
): boolean {
  const normalized = normalizeCategoryName(name);
  if (!normalized) return false;
  return categories.some(
    (c) => c.id !== excludeId && normalizeCategoryName(c.name) === normalized
  );
}
