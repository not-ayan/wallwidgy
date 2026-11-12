import { registerHooks } from 'node:module'
import { existsSync } from 'node:fs'
import { pathToFileURL, fileURLToPath } from 'node:url'
import path from 'node:path'

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

function resolveWithExtensions(basePath) {
  for (const ext of ['', '.ts', '.tsx', '.js', '.mjs']) {
    const candidate = basePath + ext
    if (existsSync(candidate)) {
      return {
        shortCircuit: true,
        url: pathToFileURL(candidate).href,
      }
    }
  }
  return null
}

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === 'next/server') {
      return nextResolve('next/server.js', context)
    }
    if (specifier.startsWith('@/')) {
      const resolved = resolveWithExtensions(path.join(ROOT_DIR, specifier.slice(2)))
      if (resolved) return resolved
    }
    if ((specifier.startsWith('./') || specifier.startsWith('../')) && context.parentURL?.startsWith('file:')) {
      const parentDir = path.dirname(fileURLToPath(context.parentURL))
      const resolved = resolveWithExtensions(path.resolve(parentDir, specifier))
      if (resolved) return resolved
    }
    return nextResolve(specifier, context)
  },
})
