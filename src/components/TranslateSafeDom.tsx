"use client"

import * as Sentry from '@sentry/nextjs'

// Chrome's auto-translate and some extensions replace or move DOM nodes React
// owns, so its next insertBefore/removeChild throws and the error boundary
// shows "500". Ignoring a call whose node is no longer where React left it is
// the standard workaround (facebook/react#11538); the translated page stays
// usable and the rest of the tree keeps updating.
//
// Each skipped call leaves a Sentry breadcrumb so the mutation stays visible
// in any later event instead of being swallowed silently.
let patched = false

function describeNode(node: Node | null): string {
  if (!node) return 'null'
  if (node.nodeType === Node.ELEMENT_NODE) {
    const element = node as Element
    return element.id ? `${element.tagName.toLowerCase()}#${element.id}` : element.tagName.toLowerCase()
  }
  return node.nodeName
}

function recordSkip(operation: 'insertBefore' | 'removeChild', parent: Node, child: Node, ref: Node | null) {
  try {
    Sentry.addBreadcrumb({
      category: 'dom.translate-safe',
      level: 'warning',
      message: `Skipped ${operation}: node is no longer where React left it`,
      data: {
        operation,
        parent: describeNode(parent),
        child: describeNode(child),
        ref: operation === 'insertBefore' ? describeNode(ref) : undefined,
        refParent: ref ? describeNode(ref.parentNode) : undefined,
        childParent: operation === 'removeChild' ? describeNode(child.parentNode) : undefined,
        documentLang: typeof document !== 'undefined' ? document.documentElement.lang : undefined,
      },
    })
  } catch {
    // Reporting must never break DOM updates.
  }
}

function patchDom() {
  if (patched || typeof Node === 'undefined') return
  patched = true

  const { removeChild, insertBefore } = Node.prototype

  Node.prototype.removeChild = function <T extends Node>(this: Node, child: T): T {
    if (child.parentNode !== this) {
      recordSkip('removeChild', this, child, null)
      return child
    }
    return removeChild.call(this, child) as T
  }

  Node.prototype.insertBefore = function <T extends Node>(this: Node, node: T, ref: Node | null): T {
    if (ref && ref.parentNode !== this) {
      recordSkip('insertBefore', this, node, ref)
      return node
    }
    return insertBefore.call(this, node, ref) as T
  }
}

patchDom()

export function TranslateSafeDom() {
  return null
}
