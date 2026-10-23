/** Build-time data access for category summaries. */
import { asc } from 'drizzle-orm';
import type { Database } from './db';
import { categories } from '../../db/schema';
import type { Category } from '../types/game';

/**
 * Lists all categories, including those without games.
 * @param db - Database instance to query.
 * @returns Category IDs and names ordered alphabetically by name.
 */
export async function getAllCategories(db: Database): Promise<Category[]> {
    return db
        .select({ id: categories.id, name: categories.name })
        .from(categories)
        .orderBy(asc(categories.name));
}
