/**
 * One level of category nesting, carried in the category NAME.
 *
 * Cosmos stores categories as a flat list of `{ id, name }` with no parent
 * field, and the Command Centre has no notion of a hierarchy. Rather than
 * change the schema and the admin app, a child is named with its parent and a
 * separator:
 *
 *     Organizer
 *     Organizer > Glasses
 *
 * The shop parses that back into two levels. A product may carry either the
 * parent, the child, or both — selecting a parent matches its children too, so
 * tagging a product only `Organizer > Glasses` still shows it under Organizer.
 */

export const CATEGORY_SEPARATOR = ">";

export type CategoryNode = {
  /** Full stored name, e.g. `Organizer > Glasses`. What products are tagged with. */
  value: string;
  /** Leaf label for the button, e.g. `Glasses`. */
  label: string;
  children: CategoryNode[];
};

function splitName(name: string): string[] {
  return name
    .split(CATEGORY_SEPARATOR)
    .map((part) => part.trim())
    .filter(Boolean);
}

/** `Organizer > Glasses` -> `Organizer`; a top-level name maps to itself. */
export function parentOf(name: string): string {
  return splitName(name)[0] ?? name;
}

/** True when `name` is `parent` itself or one of its descendants. */
export function isUnder(name: string, parent: string): boolean {
  if (name === parent) return true;
  return parentOf(name) === parent && name !== parent;
}

/**
 * Build the two-level menu from the flat list.
 *
 * A parent that only ever appears as a prefix (`Organizer > Glasses` exists but
 * `Organizer` does not) still gets a top-level entry, so nothing is unreachable.
 */
export function buildCategoryTree(categories: string[]): CategoryNode[] {
  const roots = new Map<string, CategoryNode>();

  for (const name of categories) {
    if (name === "All") continue;
    const parts = splitName(name);
    if (parts.length === 0) continue;

    const rootName = parts[0];
    let root = roots.get(rootName);
    if (!root) {
      root = { value: rootName, label: rootName, children: [] };
      roots.set(rootName, root);
    }

    // Deeper than two levels is flattened onto the second: the UI only has
    // room for one sub-row, and nothing in the catalogue nests further.
    if (parts.length > 1) {
      const childLabel = parts.slice(1).join(` ${CATEGORY_SEPARATOR} `);
      if (!root.children.some((c) => c.value === name)) {
        root.children.push({ value: name, label: childLabel, children: [] });
      }
    }
  }

  return Array.from(roots.values());
}

/** Does this product's category list satisfy the active selection? */
export function matchesCategory(
  productCategories: string[],
  active: string,
): boolean {
  if (active === "All") return true;
  return productCategories.some((c) => isUnder(c, active));
}
