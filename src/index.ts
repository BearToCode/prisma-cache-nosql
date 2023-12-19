import { Logger } from '@/utils/logger';
import { Prisma } from '@prisma/client';
import type { CacheMetadata } from '@/storage';
import {
	ArgsWithCache,
	CacheConfig,
	CacheOptions,
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
			Args extends ArgsWithCache<Type, Operation>
		>(
			operation: Operation
		): ClientMethodWithCache<Type, Operation, Args> => {
			return async function (this: Type, args?: Args) {
				type BaseResult = Prisma.Result<Type, Args, Operation>;
				type CachedResult = BaseResult & CacheMetadata;

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
						return cached as CachedResult;
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

				if (cacheConfig.get) {
					return {
						result: base
					};
				}

				return base as BaseResult;
			} as ClientMethodWithCache<Type, Operation, Args>;
		};

		return client.$extends({
			name: 'prisma-cache',
			model: {
				$allModels: {
					async findUnique<T, Args extends ArgsWithCache<T, 'findUnique'>>(this: T, args?: Args) {
						return overrideMethod<T, 'findUnique', Args>('findUnique').call(this, args);
					},
					async findUniqueOrThrow<T, Args extends ArgsWithCache<T, 'findUniqueOrThrow'>>(
						this: T,
						args?: Args
					) {
						return overrideMethod<T, 'findUniqueOrThrow', Args>('findUniqueOrThrow').call(
							this,
							args
						);
					},
					async findFirst<T, Args extends ArgsWithCache<T, 'findFirst'>>(this: T, args?: Args) {
						return overrideMethod<T, 'findFirst', Args>('findFirst').call(this, args);
					},
					async findFirstOrThrow<T, Args extends ArgsWithCache<T, 'findFirstOrThrow'>>(
						this: T,
						args?: Args
					) {
						return overrideMethod<T, 'findFirstOrThrow', Args>('findFirstOrThrow').call(this, args);
					},
					async findMany<T, Args extends ArgsWithCache<T, 'findMany'>>(this: T, args?: Args) {
						return overrideMethod<T, 'findMany', Args>('findMany').call(this, args);
					},
					async count<T, Args extends ArgsWithCache<T, 'count'>>(this: T, args?: Args) {
						return overrideMethod<T, 'count', Args>('count').call(this, args);
					},
					async aggregate<T, Args extends ArgsWithCache<T, 'aggregate'>>(this: T, args?: Args) {
						return overrideMethod<T, 'aggregate', Args>('aggregate').call(this, args);
					},
					async groupBy<T, Args extends ArgsWithCache<T, 'groupBy'>>(this: T, args?: Args) {
						return overrideMethod<T, 'groupBy', Args>('groupBy').call(this, args);
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
