export default defineEventHandler((event) => {
  const origin = getHeader(event, 'origin') || '*'
  setHeader(event, 'Access-Control-Allow-Origin', origin)
  setHeader(event, 'Access-Control-Allow-Credentials', 'true')
  setHeader(event, 'Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  setHeader(event, 'Access-Control-Allow-Headers', 'Content-Type,Authorization')

  if (event.method === 'OPTIONS') {
    setResponseStatus(event, 204)
    return 'ok'
  }
})
