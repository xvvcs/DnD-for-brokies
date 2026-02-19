/**
 * Route helpers for consistent URL generation.
 * Use these when linking to character sheets to support static export.
 */

/**
 * URL for viewing a character sheet (live DB characters).
 * Use this for seeded/created characters; /characters/[id] only works for
 * IDs listed in generateStaticParams (e.g. debug-fighter, debug-wizard).
 */
export function characterSheetUrl(id: string): string {
  return `/characters/view?id=${encodeURIComponent(id)}`;
}
