import { getPublicFileUrl } from '@/lib/config'

export function getPhotoUrl(photoBlobUrl: string | null): string | null {
  if (!photoBlobUrl) return null

  const resolvedUrl = getPublicFileUrl(photoBlobUrl)
  if (!resolvedUrl || resolvedUrl.trim() === '') {
    return '/placeholder.jpg'
  }

  return resolvedUrl
}
