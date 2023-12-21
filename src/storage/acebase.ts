import type { AceBase } from 'acebase';
import type { Adapter } from '.';
import hash from 'object-hash';

export function adapterAceBase(acebase: AceBase): Adapter {
	return ({ logger }) => ({
		async get({ model, operation, args }) {
			const queryHash = hash({ operation, args });
			logger.module('acebase').debug(`Get hash ${queryHash}`);

			const snapshot = await acebase.ref(`cache/${model}/${queryHash}`).get();
			if (snapshot.exists()) {
				logger.module('acebase').debug(`Found snapshot:`, snapshot.val());
				const value = snapshot.val();
				// If null was provided Acebase does not save it at all
				if (value.result === undefined) {
					value.result = null;
				}
				return snapshot.val();
			}
			return null;
		},
		async set({ model, operation, args }, value) {
			const queryHash = hash({ operation, args });
			logger.module('acebase').debug(`Set hash ${queryHash}`);
			await acebase.ref(`cache/${model}/${queryHash}`).set(value);
		},
		async clear(model) {
			await acebase.ref(`cache/${model}`).set(null);
		},
		async clearAll() {
			await acebase.ref('cache').set(null);
		}
	});
}
