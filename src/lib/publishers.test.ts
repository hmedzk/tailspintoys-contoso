import { describe, it, expect, beforeEach } from 'vitest';
import { createTestDatabase } from '../../db/test-helpers';
import { publishers } from '../../db/schema';
import type { Database } from './db';
import { getAllPublishers } from './publishers';

describe('getAllPublishers', () => {
    let db: Database;

    beforeEach(async () => {
        db = await createTestDatabase();
    });

    it('returns every publisher with only its id and name, ordered by name', async () => {
        await db.insert(publishers).values([
            { id: 1, name: 'Zebra Games', description: 'A publisher without games' },
            { id: 2, name: 'Alpha Games', description: null },
            { id: 3, name: 'Middle Games', description: 'Another publisher' },
        ]);

        const all = await getAllPublishers(db);

        expect(all).toHaveLength(3);
        expect(all).toEqual([
            { id: 2, name: 'Alpha Games' },
            { id: 3, name: 'Middle Games' },
            { id: 1, name: 'Zebra Games' },
        ]);
    });

    it('returns an empty list when there are no publishers', async () => {
        expect(await getAllPublishers(db)).toEqual([]);
    });
});
