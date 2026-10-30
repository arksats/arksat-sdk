import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { resolve, sep } from 'node:path'

const root = fileURLToPath(new URL('../', import.meta.url))
const port = Number(process.env.PORT ?? 4174)
const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url, 'http://127.0.0.1')
    const path = url.pathname === '/' ? '/examples/browser/index.html' : decodeURIComponent(url.pathname)
    if (!/^\/(?:dist\/[a-zA-Z0-9_.-]+\.js|examples\/browser\/(?:index\.html|main\.js))$/.test(path)) { response.writeHead(404); response.end(); return }
    const file = resolve(root, `.${path}`)
    if (!file.startsWith(`${resolve(root)}${sep}`)) throw new Error('Invalid path')
    const body = await readFile(file)
    response.writeHead(200, { 'Content-Type': file.endsWith('.html') ? 'text/html; charset=utf-8' : 'text/javascript; charset=utf-8', 'Cache-Control': 'no-store' })
    response.end(body)
  } catch { response.writeHead(404); response.end('Not found') }
})
server.listen(port, '127.0.0.1', () => console.log(`Arksat SDK example: http://127.0.0.1:${server.address().port}`))
