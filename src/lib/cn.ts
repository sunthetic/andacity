// ~/lib/cn.ts
import { isSignal } from '@builder.io/qwik'
import type { ClassList, Signal } from '@builder.io/qwik'

type CnPart =
  | string
  | false
  | null
  | undefined
  | ClassList
  | Signal<ClassList>

export const cn = (...parts: CnPart[]): ClassList => {
  const out: ClassList = {}

  for (const part of parts) {
    if (!part) continue

    const resolved = isSignal(part) ? part.value : part

    if (!resolved) continue

    if (typeof resolved === 'string') {
      for (const token of resolved.split(/\s+/).filter(Boolean)) {
        out[token] = true
      }
      continue
    }

    // ClassList object map
    for (const [k, v] of Object.entries(resolved)) {
      if (v) out[k] = v
    }
  }

  return out
}
