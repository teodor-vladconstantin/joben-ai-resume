"use client"

// Chrome's auto-translate and some extensions replace or move DOM nodes React
// owns, so its next insertBefore/removeChild throws and the error boundary
// shows "500". Ignoring a call whose node is no longer where React left it is
// the standard workaround (facebook/react#11538); the translated page stays
// usable and the rest of the tree keeps updating.
let patched = false

function patchDom() {
  if (patched || typeof Node === 'undefined') return
  patched = true

  const { removeChild, insertBefore } = Node.prototype

  Node.prototype.removeChild = function <T extends Node>(this: Node, child: T): T {
    if (child.parentNode !== this) return child
    return removeChild.call(this, child) as T
  }

  Node.prototype.insertBefore = function <T extends Node>(this: Node, node: T, ref: Node | null): T {
    if (ref && ref.parentNode !== this) return node
    return insertBefore.call(this, node, ref) as T
  }
}

patchDom()

export function TranslateSafeDom() {
  return null
}
