/**
 * Character Sheet Page (Server Component)
 *
 * Exports generateStaticParams for static export.
 * Renders the client-side character sheet.
 */

import { CharacterSheetClient } from './CharacterSheetClient';

// Generate static params for debug mode characters
export function generateStaticParams() {
  return [{ id: 'debug-fighter' }, { id: 'debug-wizard' }];
}

export default async function CharacterSheetPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CharacterSheetClient characterId={id} />;
}
