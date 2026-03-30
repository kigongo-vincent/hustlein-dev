/**
 * Maps raw API / assertOk errors into NotificationStore toasts.
 * The server message is always shown as the body when present; titles are short UI labels.
 */
export function toastPartsFromApiError(
  err: unknown,
  options?: { fallbackTitle?: string; context?: 'chat' | 'default' }
): { message: string; title: string } {
  const raw = err instanceof Error ? err.message : String(err ?? 'Something went wrong')
  const trimmed = raw.trim()
  const lower = trimmed.toLowerCase()

  const fallbackTitle = options?.fallbackTitle ?? 'Something went wrong'
  const message = trimmed.length > 0 ? trimmed : 'Request failed.'

  if (lower === 'unauthorized' || lower === 'error: unauthorized' || lower.includes('unauthorized')) {
    return {
      title: 'Session expired',
      message: trimmed.length > 0 ? trimmed : 'Sign in again and retry.',
    }
  }

  if (
    lower === 'forbidden' ||
    lower === 'error: forbidden' ||
    lower.includes('no active assignment') ||
    lower.includes('belongs to another company') ||
    lower.includes('do not have access') ||
    lower.includes('you do not have access') ||
    lower.includes('not allowed')
  ) {
    return {
      title: 'Access denied',
      message,
    }
  }

  if (
    lower.includes('not found') ||
    lower.includes('no note, project, or marketplace posting') ||
    lower.includes('marketplace posting has no hired') ||
    lower.includes('linked_project_id') ||
    lower.includes('project not found or was removed') ||
    lower.includes('complete a hire')
  ) {
    return {
      title: options?.context === 'chat' ? 'Chat unavailable' : 'Not found',
      message,
    }
  }

  return { title: fallbackTitle, message }
}
