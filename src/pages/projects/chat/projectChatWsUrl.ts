// /**
//  * Single global chat WebSocket. Clients join a room after connect with
//  * `{ type: 'join', roomId, userId }` (see useProjectChat).
//  *
//  * Relative `VITE_API_URL`: WS targets the API origin directly (no Vite WS proxy),
//  * same as before — dev defaults to `http://localhost:3000`.
//  */
// function httpOriginForRelativeApiWebSocket(): string {
//   if (import.meta.env.DEV) {
//     const raw = (import.meta.env.VITE_DEV_API_ORIGIN as string | undefined)?.trim()
//     if (raw) {
//       try {
//         return new URL(raw).origin
//       } catch {
//         /* fall through */
//       }
//     }
//     return 'http://localhost:3000'
//   }
//   if (typeof window === 'undefined') return ''
//   return window.location.origin
// }

// export type GlobalChatWsUrlOptions = {
//   /** Canonical doc entity id (internal project UUID); server joins this room on connect. */
//   roomId?: string
//   /** Optional; echoed for future use (hub routing is by roomId). */
//   userId?: string
// }

// /** Full `ws:` / `wss:` URL for the global chat hub. Pass `roomId` so the server subscribes before the first frame. */
// export function getGlobalChatWebSocketUrl(opts?: GlobalChatWsUrlOptions): string | null {
//   const apiBase = import.meta.env.VITE_API_URL ?? '/api'
//   const pathSuffix = '/ws/chat'

//   let base: string | null = null
//   if (apiBase.startsWith('http://') || apiBase.startsWith('https://')) {
//     const u = new URL(apiBase)
//     const wsProto = u.protocol === 'https:' ? 'wss:' : 'ws:'
//     const prefix = u.pathname.replace(/\/$/, '') || ''
//     base = `${wsProto}//${u.host}${prefix}${pathSuffix}`
//   } else {
//     const pathPrefix = apiBase.replace(/\/$/, '') || '/api'
//     const origin = httpOriginForRelativeApiWebSocket()
//     if (!origin) return null
//     const u = new URL(origin)
//     const wsProto = u.protocol === 'https:' ? 'wss:' : 'ws:'
//     base = `${wsProto}//${u.host}${pathPrefix}${pathSuffix}`
//   }

//   if (!base) return null
//   const params = new URLSearchParams()
//   if (opts?.roomId) params.set('roomId', opts.roomId)
//   if (opts?.userId) params.set('userId', opts.userId)
//   const q = params.toString()
//   return q ? `${base}?${q}` : base
// }

/**
 * Single global chat WebSocket. Clients join a room after connect with
 * `{ type: 'join', roomId, userId }` (see useProjectChat).
 *
 * Uses VITE_API_URL if set; otherwise defaults to relative path.
 * Works in DEV (proxied through Vite) and PROD (same-origin).
 */
function getWebSocketOrigin(): string {
  // In dev, use relative origin (Vite proxy handles the backend)
  if (import.meta.env.DEV) {
    if (typeof window === "undefined") return "";
    return window.location.origin;
  }

  // In prod, use current origin
  if (typeof window === "undefined") return "";
  return window.location.origin;
}

export type GlobalChatWsUrlOptions = {
  /** Internal project UUID; server joins this room on connect */
  roomId?: string;
  /** Optional; echoed for future use (hub routing by roomId) */
  userId?: string;
};

/**
 * Returns full `ws:` / `wss:` URL for the global chat hub.
 * Accepts optional roomId and userId for joining on connect.
 */
export function getGlobalChatWebSocketUrl(
  opts?: GlobalChatWsUrlOptions
): string | null {
  // Base path (use environment variable if set, otherwise relative /api)
  const apiBase = import.meta.env.VITE_API_URL ?? "/api";
  const pathSuffix = "/ws/chat";

  let base: string | null = null;
  const origin = getWebSocketOrigin();
  if (!origin) return null;

  // Determine WS protocol based on origin
  const wsProto = origin.startsWith("https:") ? "wss:" : "ws:";

  // Normalize base path
  const pathPrefix = apiBase.replace(/\/$/, "") || "/api";

  // Construct full URL
  base = `${wsProto}//${new URL(origin).host}${pathPrefix}${pathSuffix}`;

  // Attach optional query parameters
  const params = new URLSearchParams();
  if (opts?.roomId) params.set("roomId", opts.roomId);
  if (opts?.userId) params.set("userId", opts.userId);
  const q = params.toString();
  return q ? `${base}?${q}` : base;
}
