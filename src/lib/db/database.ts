import Dexie, { Table } from 'dexie';
import type { Character } from '@/types/character';
import type { Campaign } from '@/types/campaign';

/**
 * DnDnB Database Schema
 *
 * Version 1: Initial schema for characters and campaigns
 */
class DnDnBDatabase extends Dexie {
  characters!: Table<Character, string>;
  campaigns!: Table<Campaign, string>;

  constructor() {
    super('dndnb');

    this.version(1).stores({
      characters: 'id, name, level, race, classes, updatedAt',
      campaigns: 'id, name, updatedAt',
    });
  }
}

export const db = new DnDnBDatabase();
