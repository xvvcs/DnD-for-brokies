/**
 * Owner lock for single-account deployments
 *
 * The first user to log in becomes the "owner". Only that Auth0 account
 * can access the app. Prevents others who create accounts from accessing
 * the deployer's instance.
 * @module auth/owner
 */

import { db } from '@/lib/db/database';
import { SETTINGS_KEYS } from '@/lib/db/schema';

const OWNER_KEY = SETTINGS_KEYS.authOwnerSub;

/**
 * Get the stored owner's Auth0 sub (user ID)
 * @returns Owner sub or null if not set
 */
export async function getOwnerSub(): Promise<string | null> {
  const entry = await db.settings.get(OWNER_KEY);
  if (!entry || typeof entry.value !== 'string') return null;
  return entry.value;
}

/**
 * Set the owner's Auth0 sub (first login becomes owner)
 * @param sub Auth0 user sub claim
 */
export async function setOwnerSub(sub: string): Promise<void> {
  await db.settings.put({
    key: OWNER_KEY,
    value: sub,
    updatedAt: new Date().toISOString(),
  });
}

/**
 * Check if the given user sub is the owner, and persist if first login
 * @param sub Current user's Auth0 sub
 * @returns true if access allowed, false if denied (different user)
 */
export async function checkAndSetOwner(sub: string): Promise<boolean> {
  const existing = await getOwnerSub();
  if (!existing) {
    await setOwnerSub(sub);
    return true;
  }
  return existing === sub;
}
