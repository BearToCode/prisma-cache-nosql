# `prisma-cache-nosql`

A Prisma extension to store queries results in a temporary NoSQL cache. Currently supported storage options are standard memory and [AceBase](https://github.com/appy-one/acebase).

## Getting Started

### Installation

Using `npm`:

```
npm i prisma-cache-nosql
```

_If you want to use AceBase, install it as well:_

```
npm i acebase
```

### Setup with RAM

```ts
import { cache, adapterMemory } from 'prisma-cache-nosql';

const adapter = adapterMemory();

const prisma = new PrismaClient().$extends(
	cache({
		adapter
	})
);
```

### Setup with AceBase

```ts
import { cache, adapterAceBase } from 'prisma-cache-nosql';

const storage = new AceBase('cache_db');
const adapter = adapterAceBase(storage);

await db.ready();

const prisma = new PrismaClient().$extends(
	cache({
		adapter
	})
);
```

## Configuration

By default, Prisma will work the same and no value will be cached. If you want to start using the cache, you need to provide some configuration, that may look like this:

```ts
{
	// If provided, the result of this query will be saved in cache.
	// Can also be set: true
	set: {
		// Time-To-Live in ms
		ttl: 1000 * 60,
	},
	// If provided, a cached value will be used if a non expired one is found
	// Can also be get: true
	get: {
		// Max cache age in ms
		max: 1000 * 60 * 5
	}
}
```

This can be done in three different scopes:

### Global

This configuration has the less priority. It will be used where no others were specified.

```ts
// ...

const prisma = new PrismaClient().$extends(
	cache({
		default: {
			// Here
		}
	})
);
```

### Per Model

This one will be used for a specific model.

```ts
// ...

const prisma = new PrismaClient().$extends(
	cache({
		models: {
			myModel: {
				// Here
			}
		}
	})
);
```

### Per Query

The most specific one, will be prioritized over all the others:

```ts
const result = await prisma.model.findFirst({
	cache: {
		// Here
	}
});
```

## Supported Methods

The following methods can be used with cache:

- `findUnique`
- `findUniqueOrThrow`
- `findFirst`
- `findFirstOrThrow`
- `findMany`
- `count`
- `aggregate`
- `groupBy`

## API

### `cache(opts)`

- `adapter`: the storage adapter to use.
- `logLevel`: determines the messages logged. Can be `log`, `warn`, `error`.
- `default`: default cache configuration.
- `models`: models specific cache configuration.

## Development

### Runnings Tests

Setup the tests db using `npm run test:push-schema` and generate Prisma test client with `npm run test:generate-client`.

Run the tests using `npm run test`.

### Committing

Please, commit using commitizen so that [semantic-release](https://github.com/semantic-release/semantic-release) will be able to automatically determine the new package version:

```
git cz
# or
npm run commit
```
