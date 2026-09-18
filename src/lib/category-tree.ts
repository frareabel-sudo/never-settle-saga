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

/** Written when the app composes a name; `>` is the canonical form. */
export const CATEGORY_SEPARATOR = ">";

/**
 * Accepted when reading a name back.
 *
 * The Command Centre may not allow every character in a category name, and that
 * project could not be checked from here — so rather than betting the whole
 * feature on one key, any of these splits a parent from a child. `/` is
 * deliberately NOT here: real product categories contain it ("Salt / Pepper").
 */
const SEPARATORS = [">", "»", "::", "|"] as const;

function splitOnAnySeparator(name: string): string[] {
  let parts = [name];
  for (const sep of SEPARATORS) {
    parts = parts.flatMap((part) => part.split(sep));
  }
  return parts;
}

/**
 * Flat categories that should sit under a parent, without renaming anything.
 *
 * The `>` convention below still works, but it requires typing a special name
 * in the Command Centre, and that turned out to be the thing standing between
 * the feature and the shop. This map needs no data change at all: the category
 * keeps the plain name it already has, and the shop nests it on the way out.
 *
 * Keys and values are matched case-insensitively and ignore surrounding space,
 * so "Can opener" and "can  Opener" both land under Keychains.
 *
 * To nest another one, add a line. To un-nest, delete it.
 */
const NESTED_UNDER: Record<string, string> = {
  "lipsticks": "Keychains",
  "can opener": "Keychains",
  "can openers": "Keychains",
  "desktop glasses": "Organizer",
  "desk & makeup organiser": "Organizer",
};

function declaredParent(name: string): string | null {
  // Collapse runs of whitespace too: a category typed with a double space
  // should still find its parent.
  const key = name.trim().toLowerCase().replace(/\s+/g, " ");
  return NESTED_UNDER[key] ?? null;
}

export type CategoryNode = {
  /** Full stored name, e.g. `Organizer > Glasses`. What products are tagged with. */
  value: string;
  /** Leaf label for the button, e.g. `Glasses`. */
  label: string;
  children: CategoryNode[];
};

function splitName(name: string): string[] {
  return splitOnAnySeparator(name)
    .map((part) => part.trim())
    .filter(Boolean);
}

/** `Organizer > Glasses` -> `Organizer`; a mapped flat name -> its parent. */
export function parentOf(name: string): string {
  const parts = splitName(name);
  if (parts.length > 1) return parts[0];
  return declaredParent(name) ?? parts[0] ?? name;
}

/** True when `name` is `parent` itself or one of its descendants. */
export function isUnder(name: string, parent: string): boolean {
  if (name === parent) return true;
  return parentOf(name) === parent && name !== parent;
}

/** Leaf label for a button: the child part, or the whole name if top-level. */
function leafLabel(name: string): string {
  const parts = splitName(name);
  if (parts.length > 1) return parts.slice(1).join(` ${CATEGORY_SEPARATOR} `);
  return name.trim();
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

    const mapped = parts.length === 1 ? declaredParent(name) : null;
    const rootName = mapped ?? parts[0];
    let root = roots.get(rootName);
    if (!root) {
      root = { value: rootName, label: rootName, children: [] };
      roots.set(rootName, root);
    }

    // Deeper than two levels is flattened onto the second: the UI only has
    // room for one sub-row, and nothing in the catalogue nests further.
    if (parts.length > 1 || mapped) {
      if (!root.children.some((c) => c.value === name)) {
        root.children.push({ value: name, label: leafLabel(name), children: [] });
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
