import { cache } from '@';
import { Adapter } from '@/storage';
import { PrismaClient } from '@prisma/client';
import { beforeEach, describe, expect, test } from 'vitest';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function expectToHaveCache(data: any) {
	expect(data).toHaveProperty('_cache');
	expect(data).toHaveProperty('result');
	expect(data._cache).toHaveProperty('cached_at');
	expect(data._cache).toHaveProperty('expires_at');
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function expectNotToHaveCache(data: any) {
	expect(data).not.toHaveProperty('_cache');
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function expectToEqualWithCache(withoutCache: any, withCache: any) {
	expectNotToHaveCache(withoutCache);
	expectToHaveCache(withCache);
	expect(withoutCache).toEqual(withCache.result);
}

export async function testAdapter(adapter: Adapter) {
	const prisma = new PrismaClient().$extends(cache({ adapter, logLevel: 'log' }));

	beforeEach(async () => {
		await prisma.planet.deleteMany({});
		await prisma.clearCache();
	});

	// Standard tests
	describe.sequential('std', () => {
		test('find-unique', async () => {
			const created = await prisma.planet.create({
				data: {
					name: 'Earth'
				}
			});
			const result = await prisma.planet.findUnique({
				where: {
					id: created.id
				}
			});
			expect(result).toEqual(created);
		});

		test('find-unique-null', async () => {
			const result = await prisma.planet.findUnique({
				where: {
					id: 1
				}
			});
			expect(result).toEqual(null);
		});

		test('find-first', async () => {
			const created = await prisma.planet.create({
				data: {
					name: 'Earth'
				}
			});
			const result = await prisma.planet.findFirst({
				where: {
					name: 'Earth'
				}
			});
			expect(result).toEqual(created);
		});

		test('find-first-null', async () => {
			const result = await prisma.planet.findFirst({
				where: {
					name: 'Earth'
				}
			});
			expect(result).toEqual(null);
		});

		test('find-many', async () => {
			const created = await prisma.planet.create({
				data: {
					name: 'Earth'
				}
			});
			const result = await prisma.planet.findMany({
				where: {
					name: 'Earth'
				}
			});
			expect(result).toEqual([created]);
		});

		test('find-many-null', async () => {
			const result = await prisma.planet.findMany({
				where: {
					name: 'Earth'
				}
			});
			expect(result).toEqual([]);
		});

		test('count', async () => {
			await prisma.planet.create({
				data: {
					name: 'Earth'
				}
			});
			await prisma.planet.create({
				data: {
					name: 'Mars'
				}
			});
			await prisma.planet.create({
				data: {
					name: 'Venus'
				}
			});
			const result = await prisma.planet.count();
			expect(result).toEqual(3);
		});

		test('aggregate', async () => {
			await prisma.planet.create({
				data: {
					name: 'Earth',
					population: 100
				}
			});
			await prisma.planet.create({
				data: {
					name: 'Mars',
					population: 200
				}
			});
			await prisma.planet.create({
				data: {
					name: 'Venus',
					population: 300
				}
			});
			const result = await prisma.planet.aggregate({
				_sum: {
					population: true
				}
			});
			expect(result).toEqual({ _sum: { population: 600 } });
		});

		test('group-by', async () => {
			await prisma.planet.create({
				data: {
					name: 'Earth',
					population: 100
				}
			});
			await prisma.planet.create({
				data: {
					name: 'Mars',
					population: 200
				}
			});
			await prisma.planet.create({
				data: {
					name: 'Venus',
					population: 300
				}
			});
			const result = await prisma.planet.groupBy({
				by: ['name'],
				_sum: {
					population: true
				}
			});
			expect(result).toEqual([
				{
					name: 'Earth',
					_sum: { population: 100 }
				},
				{
					name: 'Mars',
					_sum: { population: 200 }
				},
				{
					name: 'Venus',
					_sum: { population: 300 }
				}
			]);
		});
	});

	// Cache tests
	describe.sequential('cache', () => {
		test('find-unique', async () => {
			const { id } = await prisma.planet.create({
				data: {
					name: 'Earth'
				}
			});
			const firstResult = await prisma.planet.findUnique({
				where: {
					id
				},
				cache: {
					set: true
				}
			});
			const secondResult = await prisma.planet.findUnique({
				where: {
					id
				},
				cache: {
					get: true
				}
			});
			expectToEqualWithCache(firstResult, secondResult);
		});

		test('find-unique-null', async () => {
			const firstResult = await prisma.planet.findUnique({
				where: {
					id: 1
				},
				cache: {
					set: true
				}
			});
			const secondResult = await prisma.planet.findUnique({
				where: {
					id: 1
				},
				cache: {
					get: true
				}
			});
			expect(firstResult).toEqual(null);
			expect(secondResult.result).toEqual(null);
		});

		test('find-first', async () => {
			await prisma.planet.create({
				data: {
					name: 'Earth'
				}
			});
			const firstResult = await prisma.planet.findFirst({
				where: {
					name: 'Earth'
				},
				cache: {
					set: true
				}
			});
			const secondResult = await prisma.planet.findFirst({
				where: {
					name: 'Earth'
				},
				cache: {
					get: true
				}
			});
			expectToEqualWithCache(firstResult, secondResult);
		});

		test('find-first-null', async () => {
			const firstResult = await prisma.planet.findFirst({
				where: {
					name: 'Earth'
				},
				cache: {
					set: true
				}
			});
			const secondResult = await prisma.planet.findFirst({
				where: {
					name: 'Earth'
				},
				cache: {
					get: true
				}
			});
			expect(firstResult).toEqual(null);
			expect(secondResult.result).toEqual(null);
		});

		test('find-many', async () => {
			await prisma.planet.create({
				data: {
					name: 'Earth'
				}
			});
			const firstResult = await prisma.planet.findMany({
				where: {
					name: 'Earth'
				},
				cache: {
					set: true
				}
			});
			const secondResult = await prisma.planet.findMany({
				where: {
					name: 'Earth'
				},
				cache: {
					get: true
				}
			});
			expectToEqualWithCache(firstResult, secondResult);
		});

		test('find-many-null', async () => {
			const firstResult = await prisma.planet.findMany({
				where: {
					name: 'Earth'
				},
				cache: {
					set: true
				}
			});
			const secondResult = await prisma.planet.findMany({
				where: {
					name: 'Earth'
				},
				cache: {
					get: true
				}
			});
			expect(firstResult).toEqual([]);
			expect(secondResult.result).toEqual([]);
		});

		test('count', async () => {
			await prisma.planet.create({
				data: {
					name: 'Earth'
				}
			});
			const firstResult = await prisma.planet.count({
				cache: {
					set: true
				}
			});
			const secondResult = await prisma.planet.count({
				cache: {
					get: true
				}
			});
			expectToEqualWithCache(firstResult, secondResult);
		});

		test('aggregate', async () => {
			await prisma.planet.create({
				data: {
					name: 'Earth',
					population: 100
				}
			});
			const firstResult = await prisma.planet.aggregate({
				_sum: {
					population: true
				},
				cache: {
					set: true
				}
			});
			const secondResult = await prisma.planet.aggregate({
				_sum: {
					population: true
				},
				cache: {
					get: true
				}
			});
			expectToEqualWithCache(firstResult, secondResult);
		});

		test('group-by', async () => {
			await prisma.planet.create({
				data: {
					name: 'Earth',
					population: 100
				}
			});
			const firstResult = await prisma.planet.groupBy({
				by: ['name'],
				_sum: {
					population: true
				},
				cache: {
					set: true
				}
			});
			const secondResult = await prisma.planet.groupBy({
				by: ['name'],
				_sum: {
					population: true
				},
				cache: {
					get: true
				}
			});
			expectToEqualWithCache(firstResult, secondResult);
		});
	});

	describe.sequential('timing', () => {
		test('ttl valid', async () => {
			const { id } = await prisma.planet.create({
				data: {
					name: 'Earth'
				}
			});
			const firstResult = await prisma.planet.findUnique({
				where: {
					id
				},
				cache: {
					set: {
						ttl: 9999
					}
				}
			});
			await prisma.planet.deleteMany({});
			const secondResult = await prisma.planet.findUnique({
				where: {
					id
				},
				cache: {
					get: true
				}
			});
			expectToEqualWithCache(firstResult, secondResult);
		});

		test('ttl expired', async () => {
			const { id } = await prisma.planet.create({
				data: {
					name: 'Earth'
				}
			});
			await prisma.planet.findUnique({
				where: {
					id
				},
				cache: {
					set: {
						ttl: 1
					}
				}
			});
			await prisma.planet.deleteMany({});
			await new Promise((resolve) => setTimeout(resolve, 1));
			const secondResult = await prisma.planet.findUnique({
				where: {
					id
				},
				cache: {
					get: true
				}
			});
			expect(secondResult.result).toEqual(null);
		});

		test('age valid', async () => {
			const { id } = await prisma.planet.create({
				data: {
					name: 'Earth'
				}
			});
			const firstResult = await prisma.planet.findUnique({
				where: {
					id
				},
				cache: {
					set: true
				}
			});
			await prisma.planet.deleteMany({});
			const secondResult = await prisma.planet.findUnique({
				where: {
					id
				},
				cache: {
					get: {
						max: 9999
					}
				}
			});
			expectToEqualWithCache(firstResult, secondResult);
		});

		test('age expired', async () => {
			const { id } = await prisma.planet.create({
				data: {
					name: 'Earth'
				}
			});
			await prisma.planet.findUnique({
				where: {
					id
				},
				cache: {
					set: true
				}
			});
			await prisma.planet.deleteMany({});
			await new Promise((resolve) => setTimeout(resolve, 1));
			const secondResult = await prisma.planet.findUnique({
				where: {
					id
				},
				cache: {
					get: {
						max: 1
					}
				}
			});
			expect(secondResult.result).toEqual(null);
		});
	});
}
