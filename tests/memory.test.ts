import { adapterMemory } from '@/storage';
import { testAdapter } from './adapter-tests';

const adapter = adapterMemory();

await testAdapter(adapter);
