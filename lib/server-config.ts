export const serverConfig = {
  backendApiBaseUrl:
    process.env.BACKEND_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'https://buysel.azurewebsites.net',
  debugEnvToken: process.env.DEBUG_ENV_TOKEN || '',
}

export function backendUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${serverConfig.backendApiBaseUrl}${normalizedPath}`
}
