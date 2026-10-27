import { execFile, spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import http from 'node:http'
import { networkInterfaces } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const lan = process.argv.includes('--lan')
const port = lan ? '5174' : '5173'
const url = `http://127.0.0.1:${port}/`
const noOpen = process.argv.includes('--no-open')

function showAddresses() {
  if (!lan) return
  console.log('\nAKSES DARI HP / TABLET (Wi-Fi yang sama):')
  const addresses = Object.entries(networkInterfaces()).flatMap(([name, entries]) =>
    (entries ?? [])
      .filter(
        (entry) =>
          entry.family === 'IPv4' && !entry.internal && !entry.address.startsWith('169.254.'),
      )
      .map((entry) => ({ name, address: entry.address })),
  )
  if (!addresses.length)
    console.log(
      'Alamat jaringan belum ditemukan. Hubungkan komputer ke Wi-Fi / LAN terlebih dahulu.',
    )
  for (const { name, address } of addresses) console.log(`  ${name}: http://${address}:${port}/`)
  console.log(
    'Pilih alamat Wi-Fi/Ethernet yang sama dengan HP. Alamat 127.0.0.1 hanya untuk komputer ini.',
  )
  console.log(
    'Layanan ini membagikan hasil build game pada jaringan lokal, bukan menerbitkannya ke internet.\n',
  )
}

function inspectServer() {
  return new Promise((resolve) => {
    const request = http.get(url, { timeout: 2000 }, (response) => {
      let body = ''
      response.setEncoding('utf8')
      response.on('data', (chunk) => {
        body += chunk
        if (body.length > 65536) request.destroy()
      })
      response.on('end', () => {
        resolve(
          response.statusCode === 200 && /<title>\s*CrossLink/i.test(body)
            ? 'crosslink'
            : 'occupied',
        )
      })
      response.on('error', () => resolve('occupied'))
    })
    request.on('timeout', () => request.destroy(new Error('timeout')))
    request.on('error', (error) => resolve(error.code === 'ECONNREFUSED' ? 'missing' : 'occupied'))
  })
}

function openExistingGame() {
  if (noOpen) return Promise.resolve()
  const command =
    process.platform === 'win32'
      ? 'powershell.exe'
      : process.platform === 'darwin'
        ? 'open'
        : 'xdg-open'
  const args =
    process.platform === 'win32'
      ? ['-NoProfile', '-Command', `Start-Process -FilePath '${url}'`]
      : [url]
  return new Promise((resolve) => {
    execFile(command, args, { windowsHide: true }, (error) => {
      if (error) console.log(`Buka alamat ini secara manual di browser: ${url}`)
      resolve()
    })
  })
}

const existing = await inspectServer()
if (existing === 'crosslink') {
  console.log(`CrossLink sudah aktif: ${url}`)
  console.log('Menggunakan server yang sudah berjalan; tidak membuat server kedua.')
  showAddresses()
  await openExistingGame()
} else if (existing === 'occupied') {
  console.error(`Port ${port} dipakai layanan lain atau belum merespons sebagai CrossLink.`)
  console.error(
    'Launcher tidak menghentikan layanan tersebut. Periksa terminal atau minta bantuan.',
  )
  process.exitCode = 1
} else {
  const vite = path.join(root, 'node_modules', 'vite', 'bin', 'vite.js')
  if (lan && !existsSync(path.join(root, 'dist', 'index.html'))) {
    console.error(
      'Build game belum tersedia. Jalankan pnpm build atau npm run build, lalu buka launcher mobile kembali.',
    )
    process.exitCode = 1
  } else if (!existsSync(vite)) {
    console.error(
      'Dependensi belum terpasang. Jalankan pnpm install atau npm install di folder proyek.',
    )
    process.exitCode = 1
  } else {
    console.log(`Menjalankan CrossLink: ${url}`)
    console.log('Browser akan terbuka otomatis. Biarkan jendela ini terbuka selama bermain.')
    console.log('Tekan Ctrl+C untuk menghentikan server.')
    showAddresses()
    const args = [
      vite,
      ...(lan ? ['preview'] : []),
      '--host',
      lan ? '0.0.0.0' : '127.0.0.1',
      '--port',
      port,
      '--strictPort',
    ]
    if (!noOpen) args.push('--open')
    const server = spawn(process.execPath, args, { cwd: root, stdio: 'inherit', windowsHide: true })
    server.on('error', (error) => {
      console.error(`Server tidak dapat dimulai: ${error.message}`)
      process.exitCode = 1
    })
    server.on('exit', (code) => {
      process.exitCode = code ?? 1
    })
  }
}
