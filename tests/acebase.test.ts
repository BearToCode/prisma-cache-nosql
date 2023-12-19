import { adapterAceBase } from '@/storage/acebase';
import { AceBase } from 'acebase';
import { testAdapter } from './adapter-tests';
import { afterAll } from 'vitest';

const db = new AceBase('test_db', {
	logLevel: 'warn'
});
const adapter = adapterAceBase(db);

await db.ready();

await testAdapter(adapter);

afterAll(async () => {
	await db.close();
});
