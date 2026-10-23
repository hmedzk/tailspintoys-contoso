/** Exercises game queries and combined filters against in-memory databases. */
import { describe, it, expect, beforeEach } from 'vitest';
import { createTestDatabase } from '../../db/test-helpers';
import { categories, publishers, games } from '../../db/schema';
import type { Database } from './db';
import {
    getAllGames,
    getAllGameIds,
    getGameById,
} from './games';

async function seedGames(db: Database, count: number): Promise<void> {
    const [category] = await db
        .insert(categories)
        .values({ name: 'Strategy', description: 'cat' })
        .returning({ id: categories.id });
    const [publisher] = await db
        .insert(publishers)
        .values({ name: 'Pub One', description: 'pub' })
        .returning({ id: publishers.id });

    // Insert titles in reverse-alphabetical order to prove ordering is applied.
    for (let i = count; i >= 1; i--) {
        await db.insert(games).values({
            title: `Game ${String(i).padStart(2, '0')}`,
            description: `Description ${i}`,
            starRating: 4.2,
            categoryId: category.id,
            publisherId: publisher.id,
        });
    }
}

describe('games data-access helpers', () => {
    let db: Database;

    beforeEach(async () => {
        db = await createTestDatabase();
    });

    it('returns all games ordered by title', async () => {
        await seedGames(db, 3);
        const all = await getAllGames(db);
        expect(all.map((g) => g.title)).toEqual(['Game 01', 'Game 02', 'Game 03']);
        expect(all[0].category).toEqual({ id: expect.any(Number), name: 'Strategy' });
        expect(all[0].publisher).toEqual({ id: expect.any(Number), name: 'Pub One' });
    });

    it('returns all game ids ordered by title', async () => {
        await seedGames(db, 3);
        const ids = await getAllGameIds(db);
        const all = await getAllGames(db);
        expect(ids).toEqual(all.map((g) => g.id));
    });

    it('fetches a single game by id', async () => {
        await seedGames(db, 2);
        const ids = await getAllGameIds(db);
        const game = await getGameById(db, ids[0]);
        expect(game?.title).toBe('Game 01');
    });

    it('returns null for a non-existent game', async () => {
        await seedGames(db, 2);
        expect(await getGameById(db, 99999)).toBeNull();
    });
});

describe('getAllGames filtering', () => {
    let db: Database;

    beforeEach(async () => {
        db = await createTestDatabase();
        await db.insert(categories).values([
            { id: 1, name: 'Strategy' },
            { id: 2, name: 'Puzzle' },
            { id: 3, name: 'Unused category' },
        ]);
        await db.insert(publishers).values([
            { id: 1, name: 'Alpha Games' },
            { id: 2, name: 'Beta Games' },
            { id: 3, name: 'Unused publisher' },
        ]);
        await db.insert(games).values([
            { id: 1, title: 'Zulu', description: 'Strategy by Alpha', categoryId: 1, publisherId: 1 },
            { id: 2, title: 'Bravo', description: 'Puzzle by Alpha', categoryId: 2, publisherId: 1 },
            { id: 3, title: 'Alpha', description: 'Strategy by Beta', categoryId: 1, publisherId: 2 },
        ]);
    });

    it.each([
        { label: 'no filters', filters: {}, titles: ['Alpha', 'Bravo', 'Zulu'] },
        { label: 'empty categories', filters: { categoryIds: [] }, titles: ['Alpha', 'Bravo', 'Zulu'] },
        { label: 'one category', filters: { categoryIds: [1] }, titles: ['Alpha', 'Zulu'] },
        { label: 'multiple categories (OR)', filters: { categoryIds: [1, 2] }, titles: ['Alpha', 'Bravo', 'Zulu'] },
        { label: 'duplicate categories', filters: { categoryIds: [1, 1] }, titles: ['Alpha', 'Zulu'] },
        { label: 'publisher only', filters: { publisherId: 1 }, titles: ['Bravo', 'Zulu'] },
        { label: 'publisher with empty categories', filters: { categoryIds: [], publisherId: 1 }, titles: ['Bravo', 'Zulu'] },
        { label: 'category AND publisher', filters: { categoryIds: [1], publisherId: 1 }, titles: ['Zulu'] },
        { label: 'multiple categories AND publisher', filters: { categoryIds: [1, 2], publisherId: 1 }, titles: ['Bravo', 'Zulu'] },
        { label: 'unused category', filters: { categoryIds: [3] }, titles: [] },
        { label: 'unused publisher', filters: { publisherId: 3 }, titles: [] },
        { label: 'no matching combination', filters: { categoryIds: [2], publisherId: 2 }, titles: [] },
        { label: 'unknown category', filters: { categoryIds: [999] }, titles: [] },
        { label: 'unknown publisher', filters: { publisherId: 999 }, titles: [] },
        { label: 'zero publisher ID', filters: { publisherId: 0 }, titles: [] },
        { label: 'known and unknown categories', filters: { categoryIds: [1, 999] }, titles: ['Alpha', 'Zulu'] },
    ])('returns ordered matches for $label', async ({ filters, titles }) => {
        const matches = await getAllGames(db, filters);
        expect(matches).toHaveLength(titles.length);
        expect(matches.map((game) => game.title)).toEqual(titles);
    });

    it('preserves the related category and publisher in filtered results', async () => {
        const matches = await getAllGames(db, { categoryIds: [1], publisherId: 1 });
        expect(matches).toHaveLength(1);
        expect(matches[0]).toEqual({
            id: 1,
            title: 'Zulu',
            description: 'Strategy by Alpha',
            starRating: null,
            category: { id: 1, name: 'Strategy' },
            publisher: { id: 1, name: 'Alpha Games' },
        });
    });

    it('returns an empty list from an empty database with or without filters', async () => {
        const emptyDb = await createTestDatabase();
        expect(await getAllGames(emptyDb)).toEqual([]);
        expect(await getAllGames(emptyDb, { categoryIds: [1], publisherId: 1 })).toEqual([]);
    });
});
