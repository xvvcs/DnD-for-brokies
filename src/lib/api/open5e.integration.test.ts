/**
 * Open5E API Integration Tests
 *
 * Hits the real api.open5e.com to verify our integration works.
 * Run with: npm run test:integration
 *
 * These tests are excluded from the default `npm test` run (network-dependent,
 * may fail if API is down). Use for manual verification or scheduled CI jobs.
 *
 * Note: Open5E v2 uses document keys like "srd-2024" (5e 2024) and "wotc-srd"
 * (legacy). Some endpoints work with wotc-srd, others require srd-2024.
 * @module api/open5e.integration.test
 */

import { describe, it, expect } from 'vitest';

import {
  fetchDocuments,
  fetchClasses,
  fetchSpecies,
  fetchBackgrounds,
  fetchSpells,
  fetchWeapons,
  fetchArmor,
  fetchConditions,
} from '@/lib/api';
import type { Open5eDocument, Open5eCondition } from '@/types/open5e';

const SRD_2024 = 'srd-2024';
const WOTC_SRD = 'wotc-srd';

describe('Open5E API Integration', () => {
  describe('Documents', () => {
    it('should fetch available documents', async () => {
      const docs = await fetchDocuments();
      expect(Array.isArray(docs)).toBe(true);
      expect(docs.length).toBeGreaterThan(0);

      const hasSrd =
        docs.some((d: Open5eDocument) => d.key === SRD_2024) ||
        docs.some((d: Open5eDocument) => d.key === WOTC_SRD);
      expect(hasSrd).toBe(true);
    }, 15000);
  });

  describe('Classes', () => {
    it('should fetch classes for srd-2024', async () => {
      const classes = await fetchClasses([SRD_2024]);
      expect(Array.isArray(classes)).toBe(true);
      expect(classes.length).toBeGreaterThan(0);
    }, 15000);
  });

  describe('Species', () => {
    it('should fetch species for srd-2024', async () => {
      const species = await fetchSpecies([SRD_2024]);
      expect(Array.isArray(species)).toBe(true);
      expect(species.length).toBeGreaterThan(0);
    }, 15000);
  });

  describe('Backgrounds', () => {
    it('should fetch backgrounds for srd-2024', async () => {
      const backgrounds = await fetchBackgrounds([SRD_2024]);
      expect(Array.isArray(backgrounds)).toBe(true);
      expect(backgrounds.length).toBeGreaterThan(0);
    }, 15000);
  });

  describe('Spells', () => {
    it('should fetch spells for srd-2024', async () => {
      const spells = await fetchSpells([SRD_2024]);
      expect(Array.isArray(spells)).toBe(true);
      expect(spells.length).toBeGreaterThan(0);
    }, 30000);
  });

  describe('Equipment', () => {
    it('should fetch weapons', async () => {
      const weapons = await fetchWeapons([WOTC_SRD, SRD_2024]);
      expect(Array.isArray(weapons)).toBe(true);
      expect(weapons.length).toBeGreaterThan(0);
    }, 20000);

    it('should fetch armor', async () => {
      const armor = await fetchArmor([WOTC_SRD, SRD_2024]);
      expect(Array.isArray(armor)).toBe(true);
      expect(armor.length).toBeGreaterThan(0);
    }, 20000);

    // Note: fetchItems and fetchMagicItems have very large datasets and can take 2+ minutes.
    // Weapons and armor above verify the equipment flow; full fetchAllEquipment is tested in app.
  });

  describe('Reference Data', () => {
    it('should fetch conditions', async () => {
      const conditions = await fetchConditions();
      expect(Array.isArray(conditions)).toBe(true);
      expect(conditions.length).toBeGreaterThan(0);
      const blinded = conditions.find((c: Open5eCondition) => c.key === 'blinded');
      expect(blinded).toBeDefined();
    }, 30000);
  });
});
