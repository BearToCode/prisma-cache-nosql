import { Logger } from '@/utils/logger';

export type CacheMetadata = {
	_cache: {
		cached_at: number;
		expires_at: number | false;
	};
};

type QueryArgs = string | number | bigint | boolean | object;
type Query = {
	model: string;
	operation: string;
	args?: QueryArgs;
};

export type Adapter = (opts: { logger: Logger }) => Database;

export interface Database {
	get<T extends CacheMetadata>(query: Query): Promise<T | null>;
	set<T extends object>(query: Query, value: T): Promise<void>;
	clear(model: string): Promise<void>;
	clearAll(): Promise<void>;
}
