import { Logger } from '@/utils/logger';
import { Prisma } from '@prisma/client';
import type { CacheMetadata } from '@/storage';
import {
	CacheConfig,
	CacheOptions,
	CacheQueryArgs,
	ClientMethodWithCache,
	DefaultCacheConfig,
	SupportedOperation
} from './types';

export function cache(opts: CacheOptions) {
	const logger = new Logger(opts?.logLevel);
	const db = opts.adapter({ logger });

	return Prisma.defineExtension((client) => {
		/**
		 * Call the base prisma client method.
		 * @param model The model name
		 * @param operation The operation to perform
		 * @returns The base result.
		 */
		const callBaseMethod = async <Type, Operation extends SupportedOperation>(
			model: string,
			operation: Operation,
			args: Prisma.Args<Type, Operation> | undefined
		) => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			return (client[model as any] as any)[operation](args) as Prisma.Result<
				Type,
				typeof args,
				Operation
			>;
		};

		/**
		 * Overwrite a prisma client method with caching.
		 * @param operation The operation to perform
		 * @returns The overwritten method.
		 */
		const overrideMethod = <
			Type,
			Operation extends SupportedOperation,
			Args extends Prisma.Args<Type, Operation> & CacheQueryArgs
		>(
			operation: Operation
		): ClientMethodWithCache<Type, Operation, Args> => {
			return async function (this: Type, args?: Args) {
				type BaseResult = Prisma.Result<Type, Args, Operation>;
				type CachedResult = { result: BaseResult } & CacheMetadata;

				const context = Prisma.getExtensionContext(this);
				const model = context.$name;
				if (!model) {
					logger.error(`context.$name is undefined`);
					throw new Error('context.$name is undefined');
				}

				args ??= {} as Required<Args>;

				const cacheConfig =
					(args?.cache as CacheConfig) ??
					opts.models?.[model] ??
					opts.default ??
					DefaultCacheConfig;

				delete args.cache;

				if (cacheConfig.get) {
					const cached = await db.get<CachedResult>({ model, operation, args });
					const useCache =
						cached &&
						(cached._cache.expires_at === false || cached._cache.expires_at > Date.now()) &&
						(cacheConfig.get === true ||
							cached._cache.cached_at + cacheConfig.get.max > Date.now());
					if (useCache) {
						logger.log(
							`Found cached value with age ${cached._cache.cached_at.toFixed(0)}ms: `,
							cached
						);
						return cached.result;
					}
				}

				const base = await callBaseMethod<Type, Operation>(model, operation, args);

				if (cacheConfig.set) {
					const cached_at = Date.now();
					const expires_at = cacheConfig.set === true ? false : cached_at + cacheConfig.set.ttl;
					const pack = { result: base, _cache: { cached_at, expires_at } };
					logger.log(`Set cache: `, pack);
					await db.set({ model, operation, args }, pack);
				}

				return base as BaseResult;
			};
		};

		return client.$extends({
			name: 'prisma-cache',
			model: {
				$allModels: {
					async findUnique<T, A extends Prisma.Args<T, 'findUnique'> & Partial<CacheQueryArgs>>(
						this: T,
						args?: Prisma.Exact<A, Prisma.Args<T, 'findUnique'> & Partial<CacheQueryArgs>>
					) {
						return overrideMethod<T, 'findUnique', A>('findUnique').call(this, args);
					},
					async findUniqueOrThrow<
						T,
						A extends Prisma.Args<T, 'findUnique'> & Partial<CacheQueryArgs>
					>(
						this: T,
						args?: Prisma.Exact<A, Prisma.Args<T, 'findUniqueOrThrow'> & Partial<CacheQueryArgs>>
					) {
						return overrideMethod<T, 'findUniqueOrThrow', A>('findUniqueOrThrow').call(this, args);
					},
					async findFirst<T, A extends Prisma.Args<T, 'findFirst'> & Partial<CacheQueryArgs>>(
						this: T,
						args?: Prisma.Exact<A, Prisma.Args<T, 'findFirst'> & Partial<CacheQueryArgs>>
					) {
						return overrideMethod<T, 'findFirst', A>('findFirst').call(this, args);
					},
					async findFirstOrThrow<
						T,
						A extends Prisma.Args<T, 'findFirst'> & Partial<CacheQueryArgs>
					>(
						this: T,
						args?: Prisma.Exact<A, Prisma.Args<T, 'findFirstOrThrow'> & Partial<CacheQueryArgs>>
					) {
						return overrideMethod<T, 'findFirstOrThrow', A>('findFirstOrThrow').call(this, args);
					},
					async findMany<T, A extends Prisma.Args<T, 'findMany'> & Partial<CacheQueryArgs>>(
						this: T,
						args?: Prisma.Exact<A, Prisma.Args<T, 'findMany'> & Partial<CacheQueryArgs>>
					) {
						return overrideMethod<T, 'findMany', A>('findMany').call(this, args);
					},
					async count<T, A extends Prisma.Args<T, 'count'> & Partial<CacheQueryArgs>>(
						this: T,
						args?: Prisma.Exact<A, Prisma.Args<T, 'count'> & Partial<CacheQueryArgs>>
					) {
						return overrideMethod<T, 'count', A>('count').call(this, args);
					},
					async aggregate<T, A extends Prisma.Args<T, 'aggregate'> & Partial<CacheQueryArgs>>(
						this: T,
						args?: Prisma.Exact<A, Prisma.Args<T, 'aggregate'> & Partial<CacheQueryArgs>>
					) {
						return overrideMethod<T, 'aggregate', A>('aggregate').call(this, args);
					},
					async groupBy<T, A extends Prisma.Args<T, 'groupBy'> & Partial<CacheQueryArgs>>(
						this: T,
						args?: Prisma.Exact<A, Prisma.Args<T, 'groupBy'> & Partial<CacheQueryArgs>>
					) {
						return overrideMethod<T, 'groupBy', A>('groupBy').call(this, args);
					},

					async clearCache() {
						const context = Prisma.getExtensionContext(this);
						const model = context.$name;

						if (!model) {
							logger.error(`context.$name is undefined`);
							throw new Error('context.$name is undefined');
						}

						return db.clear(model);
					}
				}
			},
			client: {
				async clearCache() {
					return db.clearAll();
				}
			}
		});
	});
}

export * from './types';
export * from './storage';
