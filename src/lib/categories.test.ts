/** Exercises category summaries against an in-memory database. */
import { describe, it, expect, beforeEach } from 'vitest';
import { createTestDatabase } from '../../db/test-helpers';
import { categories } from '../../db/schema';
import type { Database } from './db';
import { getAllCategories } from './categories';

describe('getAllCategories', () => {
    let db: Database;

    beforeEach(async () => {
        db = await createTestDatabase();
    });

    it('returns only IDs and names alphabetically, including categories without games', async () => {
        await db.insert(categories).values([
            { id: 1, name: 'Strategy', description: 'Unused category' },
            { id: 2, name: 'Adventure', description: null },
            { id: 3, name: 'Puzzle', description: 'Another category' },
        ]);

        const all = await getAllCategories(db);

        expect(all).toHaveLength(3);
        expect(all).toEqual([
            { id: 2, name: 'Adventure' },
            { id: 3, name: 'Puzzle' },
            { id: 1, name: 'Strategy' },
        ]);
    });

    it('returns an empty list when no categories exist', async () => {
        expect(await getAllCategories(db)).toEqual([]);
    });
});
