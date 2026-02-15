import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import type { CharacterSummary } from '@/types/character';

/**
 * Hook to fetch all characters (summary view)
 */
export function useCharacters() {
  return useQuery({
    queryKey: ['characters'],
    queryFn: async () => {
      const characters = await db.characters.toArray();
      return characters.map(
        (char): CharacterSummary => ({
          id: char.id,
          name: char.name,
          level: char.level,
          race: char.race.name,
          classes: char.classes.map((c) => `${c.name} ${c.level}`).join(', '),
          currentHp: char.combat.currentHp,
          maxHp: char.combat.maxHp,
          updatedAt: new Date(char.updatedAt),
        })
      );
    },
    staleTime: 5 * 60 * 1000,
  });
}
