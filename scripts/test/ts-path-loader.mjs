import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const projectRoot = process.cwd()
const srcRoot = path.join(projectRoot, 'src')

const resolveAliasPath = (specifier) => {
  const basePath = path.join(srcRoot, specifier.slice(2))
  const candidates = [
    basePath,
    `${basePath}.ts`,
    `${basePath}.tsx`,
    `${basePath}.js`,
    `${basePath}.mjs`,
    path.join(basePath, 'index.ts'),
    path.join(basePath, 'index.tsx'),
    path.join(basePath, 'index.js'),
    path.join(basePath, 'index.mjs'),
  ]

  return candidates.find((candidate) => fs.existsSync(candidate)) || null
}

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith('~/')) {
    const resolvedPath = resolveAliasPath(specifier)
    if (!resolvedPath) {
      throw new Error(`Unable to resolve ts path alias: ${specifier}`)
    }

    return nextResolve(pathToFileURL(resolvedPath).href, context)
  }

  return nextResolve(specifier, context)
}
