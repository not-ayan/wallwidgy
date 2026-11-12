import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

test('Issue 8: Service Worker SWR returns a valid 503 Response instead of undefined on offline cache miss', async () => {
  const swSource = readFileSync(path.join(ROOT_DIR, 'public', 'sw.js'), 'utf8')
  const listeners = new Map<string, (event: any) => void>()

  const sandbox = {
    self: {
      addEventListener: (type: string, fn: (event: any) => void) => listeners.set(type, fn),
      skipWaiting: () => Promise.resolve(),
      clients: { claim: () => Promise.resolve() },
    },
    URL,
    Response,
    caches: {
      match: async () => undefined,
      open: async () => ({ put: async () => {}, addAll: async () => {} }),
      keys: async () => [],
      delete: async () => true,
    },
    fetch: async () => {
      throw new TypeError('Failed to fetch (offline)')
    },
    console,
  }

  vm.runInNewContext(swSource, sandbox)

  const fetchHandler = listeners.get('fetch')
  assert.ok(fetchHandler, 'fetch listener should be registered')

  const captured: { promise: Promise<Response> | null } = { promise: null }
  fetchHandler({
    request: {
      method: 'GET',
      mode: 'cors',
      url: 'https://wallwidgy.test/_next/static/chunk.js',
    },
    respondWith: (p: Promise<Response>) => {
      captured.promise = p
    },
  })

  assert.ok(captured.promise, 'respondWith must be called for static asset')
  const response = await captured.promise
  assert.ok(response instanceof Response, 'SW must always resolve to a Response instance, never undefined')
  assert.equal(response.status, 503)
})
