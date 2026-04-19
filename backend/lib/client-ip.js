// Detrás de Cloudflare + Fly el req.ip es el edge, no el cliente.
// Cloudflare inyecta la IP real en CF-Connecting-IP; Fly en Fly-Client-IP.
function clientIp(req) {
  return (
    req.headers['cf-connecting-ip'] ||
    req.headers['fly-client-ip'] ||
    req.ip
  )
}

module.exports = { clientIp }
