'use strict';

/**
 * Metro resolves `ws` to this file on native platforms so the bundle does not
 * pull Node's `ws` implementation. Supabase only needs this when
 * `globalThis.WebSocket` is missing; on React Native the global exists, so the
 * transport branch is never used — this shim exists for the resolver only.
 */
module.exports = globalThis.WebSocket;
