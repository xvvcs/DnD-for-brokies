'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';
import { User, Heart, ChevronRight, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

import { Navbar, PageWrapper } from '@/components/shared';
import { useCharacters } from '@/hooks/useCharacters';
import { characterSheetUrl } from '@/lib/routes';
import { deleteCharacter } from '@/lib/db/characters';
import type { CharacterSummary } from '@/types/character';

export default function CharactersPage() {
  const queryClient = useQueryClient();
  const { data: characters, isLoading, error } = useCharacters();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const sortedCharacters = useMemo(
    () => characters?.slice().sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()) ?? [],
    [characters]
  );

  const handleDelete = async (e: React.MouseEvent, char: CharacterSummary) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm(`Delete "${char.name}"? This cannot be undone.`)) return;
    setDeletingId(char.id);
    try {
      await deleteCharacter(char.id);
      await queryClient.invalidateQueries({ queryKey: ['characters'] });
    } catch {
      alert('Failed to delete character. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      <Navbar />
      <PageWrapper>
        <div className="py-8">
          <h1 className="font-[family-name:var(--font-cinzel)] text-3xl md:text-4xl font-bold text-foreground mb-2">
            My Characters
          </h1>
          <p className="text-muted-foreground mb-8">
            Characters stored in your browser. Click to open the character sheet.
          </p>

          {isLoading && (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-20 rounded-lg bg-muted/50 animate-pulse border border-border/50"
                />
              ))}
            </div>
          )}

          {error && (
            <div className="rounded-lg border-2 border-destructive/30 bg-destructive/5 p-6 text-center">
              <p className="text-destructive font-medium">Failed to load characters</p>
              <p className="text-sm text-muted-foreground mt-1">
                {error instanceof Error ? error.message : 'Unknown error'}
              </p>
            </div>
          )}

          {!isLoading && !error && (!characters || characters.length === 0) && (
            <div className="rounded-lg border-2 border-dashed border-gold/50 bg-card/50 p-12 text-center">
              <User className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="font-[family-name:var(--font-cinzel)] text-lg text-muted-foreground">
                No characters yet
              </p>
              <p className="text-sm text-muted-foreground/80 mt-1 max-w-sm mx-auto">
                Seed a character from the home page debug section, or create one when the wizard is
                ready.
              </p>
              <Link href="/" className="inline-block mt-6 text-primary hover:underline font-medium">
                ← Back to Home
              </Link>
            </div>
          )}

          {!isLoading && !error && sortedCharacters.length > 0 && (
            <ul className="space-y-3">
              {sortedCharacters.map((char) => (
                <li
                  key={char.id}
                  className="group flex items-stretch rounded-lg border border-gold/40 bg-card hover:border-gold hover:bg-card/90 hover:shadow-md transition-all duration-200 overflow-hidden"
                >
                  <Link
                    href={characterSheetUrl(char.id)}
                    className="flex flex-1 items-center gap-4 p-4 min-w-0"
                  >
                    <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                      <User className="w-6 h-6 text-primary" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-[family-name:var(--font-cinzel)] font-semibold text-foreground truncate">
                        {char.name}
                      </p>
                      <p className="text-sm text-muted-foreground truncate">
                        {char.classes} · {char.race}
                      </p>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="text-xs text-muted-foreground/80">Level {char.level}</span>
                        <span className="flex items-center gap-1 text-xs text-muted-foreground/80">
                          <Heart className="w-3.5 h-3.5" />
                          {char.currentHp}/{char.maxHp} HP
                        </span>
                      </div>
                    </div>

                    <div className="flex-shrink-0 text-muted-foreground/50 group-hover:text-primary transition-colors">
                      <ChevronRight className="w-5 h-5" />
                    </div>
                  </Link>

                  <button
                    type="button"
                    onClick={(e) => handleDelete(e, char)}
                    disabled={deletingId === char.id}
                    className="flex-shrink-0 px-4 flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label={`Delete ${char.name}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          {!isLoading && sortedCharacters.length > 0 && (
            <p className="mt-6 text-xs text-muted-foreground/70">
              Most recently edited{' '}
              {sortedCharacters[0]?.updatedAt &&
                formatDistanceToNow(sortedCharacters[0].updatedAt, { addSuffix: true })}
            </p>
          )}
        </div>
      </PageWrapper>
    </>
  );
}
