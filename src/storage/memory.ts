import type { Adapter } from '.';
import hash from 'object-hash';

export function adapterMemory(): Adapter {
	const storage = new Map<string, string>();
	return ({ logger }) => ({
		async get({ model, operation, args }) {
			const queryHash = hash({ operation, args });
			const key = `${model}:${queryHash}`;

			logger.module('memory').log(`Get key ${key}`);
			const value = storage.get(key);
			if (value) {
				logger.module('memory').log(`Found value:`, value);
				return JSON.parse(value);
			}
			return null;
		},
		async set({ model, operation, args }, value) {
			const queryHash = hash({ operation, args });
			const key = `${model}:${queryHash}`;

			logger.module('memory').log(`Set key ${key}`);
			storage.set(key, JSON.stringify(value));
		},
		async clear(model) {
			for (const [key] of storage.entries()) {
				if (key.startsWith(`${model}:`)) {
					storage.delete(key);
				}
			}
		},
		async clearAll() {
			storage.clear();
		}
	});
}
