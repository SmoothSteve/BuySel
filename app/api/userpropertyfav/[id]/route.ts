export async function GET(request: Request) {
  const response = await fetch(`${process.env.API_BASE_URL}/property`)
  const data = await response.json()
  return Response.json(data)
}