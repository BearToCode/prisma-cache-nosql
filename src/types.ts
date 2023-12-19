import { Prisma } from '@prisma/client';
import { Adapter } from './storage';
import { LogLevel } from './utils/logger';

/**
 * Options for `prisma-cache-nosql` extension.
 */
export type CacheOptions = {
	/**
	 * The adapter to use for caching.
	 */
	adapter: Adapter;
	/*
	 * The log level for the logger.
	 */
	logLevel?: LogLevel;
	/**
	 * Default cache options for all queries.
	 */
	default?: CacheConfig;
	/**
	 * Cache options for specific models.
	 */
	models?: {
		[model: string]: CacheConfig;
	};
};

export type CacheConfig = {
	set?:
		| {
				/**
				 * Time to live of the cached value in milliseconds.
				 */
				ttl: number;
		  }
		| boolean;
	get?:
		| boolean
		| {
				/**
				 * Maximum age of the cached value in milliseconds.
				 */
				max: number;
		  };
};

/**
 * Cache options for specific queries.
 */
export type CacheQueryArgs = {
	cache: CacheConfig;
};

/**
 * Default cache options for all queries.
 */
export const DefaultCacheConfig: CacheConfig = {
	set: false,
	get: false
};

export type ArgsWithCache<Type, Operation extends SupportedOperation> = Prisma.Args<
	Type,
	Operation
> &
	Partial<CacheQueryArgs>;

export type ClientMethodWithCache<
	Type,
	Operation extends SupportedOperation,
	Args extends ArgsWithCache<Type, Operation>
> = (this: Type, args?: Args) => Promise<Prisma.Result<Type, Operation, Args>>;

/**
 * Supported operations for caching.
 */
export const SupportedOperations = [
	'findUnique',
	'findUniqueOrThrow',
	'findFirst',
	'findFirstOrThrow',
	'findMany',
	'count',
	'aggregate',
	'groupBy'
] as const;
export type SupportedOperation = (typeof SupportedOperations)[number];
