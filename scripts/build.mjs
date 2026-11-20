// Builds every SVG in assets/ from src/ and live GitHub data.
// Run: GITHUB_TOKEN=... node scripts/build.mjs

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
const OUT = join(ROOT, 'assets')
const LOGIN = 'ChomasDev'

const C = {
  ink: '#0b0b0c',
  night: '#151516',
  bone: '#f1eee8',
  dim: '#a09b93',
  line: 'rgba(255,255,255,0.1)',
  sub: '#f2d35e',
  red: '#e23b33',
}

const series = {
  name: 'Thomas Favero',
  hook: "Come vendere un'app online (in fretta).",
  year: '2026',
  age: '21',
  base: 'Montebelluna, Treviso',
  logline: ['Il ragazzo che nessuno notava ha iniziato a costruire cose.', "Finché non l'hanno notato."],
  quote: 'Ricordatevi il mio nome, perché in bene o in male diventerà famoso.',
}

const episodes = [
  { n: 1, title: 'La sospensione', subtitle: 'Non mi sembrava una cattiva idea.', stamp: 'Sospeso', spot: 22, watched: 1 },
  { n: 2, title: 'Lo stage', subtitle: 'Dammi il tuo LinkedIn. Farai tante cose.', spot: 70, watched: 1 },
  { n: 3, title: 'Il palco', subtitle: 'Da invisibile a "quello che costruisce cose".', spot: 50, watched: 1 },
  { n: 4, title: 'La macchina', subtitle: 'Costruisco anche quando sembra tempo perso.', spot: 30, watched: 1 },
  { n: 5, title: 'Go2Match', subtitle: 'Ti sfido.', spot: 64, watched: 0.62 },
  { n: 6, title: 'PLAIOS', subtitle: 'Ogni parte è un plugin.', spot: 40, watched: 0.62 },
]

const spinoffs = [
  { repo: 'drako', title: 'Drako', genre: 'Zig · terminale macOS', pitch: ['Un terminale nativo su Ghostty.', 'Ogni pannello è una sessione', 'che sopravvive alla chiusura.'] },
  { repo: 'gossip-p2p', title: 'gossip-p2p', genre: 'TypeScript · reti P2P', pitch: ['Eventi sincronizzati tra peer', 'con un protocollo gossip', 'su WebRTC DataChannel.'] },
  { repo: 'SshRemoteCode', title: 'SshRemoteCode', genre: 'TypeScript · agenti AI', pitch: ['Al posto di MCP, il modello', 'scrive TypeScript che gira', 'via SSH sulla macchina.'] },
]

// ---------- helpers ----------

const read64 = (path) => readFileSync(join(ROOT, path)).toString('base64')

const esc = (text) =>
  String(text).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;')

const FONTS = {
  serif: `@font-face{font-family:IS;src:url(data:font/woff2;base64,${read64('src/fonts/serif.woff2')}) format('woff2')}`,
  serifItalic: `@font-face{font-family:IS;font-style:italic;src:url(data:font/woff2;base64,${read64('src/fonts/serif-italic.woff2')}) format('woff2')}`,
  geist: `@font-face{font-family:G;font-weight:100 900;src:url(data:font/woff2;base64,${read64('src/fonts/geist.woff2')}) format('woff2')}`,
  mono: `@font-face{font-family:GM;src:url(data:font/woff2;base64,${read64('src/fonts/mono.woff2')}) format('woff2')}`,
}

const BASE_CSS = `
.serif{font-family:IS,Georgia,serif}
.sans{font-family:G,system-ui,sans-serif}
.mono{font-family:GM,ui-monospace,monospace}
.label{font-family:G,system-ui,sans-serif;font-size:12px;font-weight:500;letter-spacing:.16em;fill:${C.dim}}
.subtitle{font-family:G,system-ui,sans-serif;font-weight:600;fill:${C.sub};paint-order:stroke;stroke:#000;stroke-width:4px;stroke-linejoin:round}
@media (prefers-reduced-motion:reduce){*{animation:none!important}}
`

const GRAIN = `
<filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="1.4" numOctaves="1" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/></filter>`

function svg({ width, height, title, fonts, css = '', defs = '', body }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${esc(title)}">
<title>${esc(title)}</title>
<style>${fonts.join('')}${BASE_CSS}${css}</style>
<defs>${GRAIN}${defs}</defs>
${body}
<rect width="${width}" height="${height}" filter="url(#grain)" opacity=".05" pointer-events="none"/>
</svg>
`
}

// Deterministic random, so a rebuild without data changes produces the same file.
function random(seed) {
  let s = seed
  return () => {
    s = (s * 16807) % 2147483647
    return s / 2147483647
  }
}

function write(name, content) {
  writeFileSync(join(OUT, name), content)
  console.log(`${name}  ${(content.length / 1024).toFixed(0)} kB`)
}

// ---------- cold open ----------

function coldOpen() {
  const W = 1280
  const H = 640
  const lines = [...episodes.map((ep) => ep.subtitle), series.quote]
  const step = 3.6
  const loop = lines.length * step
  const shownFor = ((step - 0.4) / loop) * 100

  const rand = random(7)
  const rain = Array.from({ length: 170 }, () => {
    const x = 300 + rand() * 980
    const y = rand() * H
    const len = 10 + rand() * 18
    return `<line x1="${x.toFixed(1)}" y1="${y.toFixed(1)}" x2="${(x - 2).toFixed(1)}" y2="${(y + len).toFixed(1)}"/>`
  }).join('')

  const subtitles = lines
    .map(
      (line, i) =>
        `<text class="subtitle cue" x="${W / 2}" y="${H - 44}" text-anchor="middle" font-size="22" style="animation-delay:${(i * step).toFixed(1)}s">${esc(line)}</text>`,
    )
    .join('')

  const css = `
.in{opacity:0;animation:in .9s cubic-bezier(.2,.7,.2,1) forwards}
@keyframes in{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
.rain{animation:fall .9s linear infinite}
@keyframes fall{from{transform:translate(0,-${H}px)}to{transform:translate(-30px,0)}}
.lamp{animation:flicker 7s steps(1) infinite}
@keyframes flicker{0%,100%{opacity:.55}62%{opacity:.35}63%{opacity:.6}64%{opacity:.3}66%{opacity:.55}}
.cue{opacity:0;animation:cue ${loop}s linear infinite}
@keyframes cue{0%{opacity:0}1%{opacity:1}${shownFor.toFixed(2)}%{opacity:1}${(shownFor + 1).toFixed(2)}%{opacity:0}100%{opacity:0}}
.play{transform-box:fill-box;transform-origin:left;animation:play ${loop}s linear infinite}
@keyframes play{from{transform:scaleX(0)}to{transform:scaleX(1)}}
`

  const defs = `
<linearGradient id="fadeL" x1="0" x2="1"><stop offset="0" stop-color="${C.ink}"/><stop offset=".3" stop-color="${C.ink}" stop-opacity=".55"/><stop offset=".62" stop-color="${C.ink}" stop-opacity="0"/></linearGradient>
<linearGradient id="fadeB" x1="0" x2="0" y1="0" y2="1"><stop offset=".55" stop-color="${C.ink}" stop-opacity="0"/><stop offset="1" stop-color="${C.ink}" stop-opacity=".95"/></linearGradient>
<radialGradient id="glow"><stop offset="0" stop-color="#ffb347" stop-opacity=".55"/><stop offset="1" stop-color="#ffb347" stop-opacity="0"/></radialGradient>
<clipPath id="frame"><rect width="${W}" height="${H}" rx="14"/></clipPath>`

  const imgX = 280
  const imgW = 1132
  const lampX = imgX + 760 * (imgW / 1280)

  const body = `
<g clip-path="url(#frame)">
  <rect width="${W}" height="${H}" fill="${C.ink}"/>
  <image href="data:image/webp;base64,${read64('src/hero.webp')}" x="${imgX}" y="0" width="${imgW}" height="${H}" preserveAspectRatio="xMidYMid slice"/>
  <circle class="lamp" cx="${lampX}" cy="24" r="120" fill="url(#glow)"/>
  <g stroke="#ffcf8a" stroke-width="1" opacity=".16"><g class="rain">${rain}</g><g class="rain" style="animation-delay:-.45s">${rain}</g></g>
  <rect width="${W}" height="${H}" fill="url(#fadeL)"/>
  <rect width="${W}" height="${H}" fill="url(#fadeB)"/>

  <g class="in" style="animation-delay:.1s">
    <rect x="64" y="166" width="2" height="15" fill="${C.red}"/>
    <text class="label" x="78" y="178">UNA SERIE ORIGINALE</text>
  </g>
  <text class="serif in" x="60" y="282" font-size="106" letter-spacing="-1.5" fill="${C.bone}" style="animation-delay:.25s">${esc(series.name)}</text>
  <text class="serif in" x="64" y="334" font-size="30" font-style="italic" fill="${C.dim}" style="animation-delay:.4s">${esc(series.hook)}</text>

  <g class="sans in" font-size="15" fill="${C.dim}" style="animation-delay:.55s">
    <text x="64" y="388" fill="${C.bone}">${series.year}</text>
    <rect x="112" y="374" width="28" height="19" rx="2" fill="none" stroke="${C.dim}" stroke-opacity=".6"/>
    <text x="126" y="388" font-size="12" text-anchor="middle">${series.age}</text>
    <text x="156" y="388">${episodes.length} episodi</text>
    <text x="242" y="388">${esc(series.base)}</text>
  </g>
  <g class="sans in" font-size="18" fill="${C.bone}" fill-opacity=".85" style="animation-delay:.7s">
    <text x="64" y="432">${esc(series.logline[0])}</text>
    <text x="64" y="458">${esc(series.logline[1])}</text>
  </g>

  <g class="sans in" font-size="16" font-weight="600" style="animation-delay:.85s">
    <rect x="64" y="486" width="128" height="46" rx="3" fill="${C.bone}"/>
    <path d="M90 499v20l15-10z" fill="${C.ink}"/>
    <text x="114" y="515" fill="${C.ink}">Guarda</text>
    <rect x="204" y="486" width="150" height="46" rx="3" fill="#fff" fill-opacity=".15"/>
    <circle cx="232" cy="509" r="9" fill="none" stroke="${C.bone}" stroke-width="1.6"/>
    <path d="M232 507v7M232 503.5v.5" stroke="${C.bone}" stroke-width="1.6" stroke-linecap="round"/>
    <text x="252" y="515" fill="${C.bone}">Altre info</text>
  </g>

  ${subtitles}

  <rect x="0" y="${H - 4}" width="${W}" height="4" fill="#fff" fill-opacity=".12"/>
  <rect class="play" x="0" y="${H - 4}" width="${W}" height="4" fill="${C.red}"/>
</g>`

  return svg({
    width: W,
    height: H,
    title: `${series.name}. Una serie originale. ${series.hook}`,
    fonts: [FONTS.serif, FONTS.serifItalic, FONTS.geist],
    css,
    defs,
    body,
  })
}

// ---------- episode frames ----------

function wrap(text, max) {
  const words = text.split(' ')
  const out = ['']
  for (const word of words) {
    const current = out.at(-1)
    if (current && (current + ' ' + word).length > max) {
      out.push(word)
      continue
    }
    out[out.length - 1] = current ? `${current} ${word}` : word
  }
  return out
}

function episodeFrame(ep) {
  const W = 640
  const H = 360
  const watchedW = (W - 164) * ep.watched
  const status = ep.watched === 1 ? 'Disponibile' : 'In produzione'
  const minutes = String(18 + ep.n * 3).padStart(2, '0')
  const subLines = wrap(ep.subtitle, 34)

  const subtitle = subLines
    .map((line, i) => `<text class="subtitle" x="${W / 2}" y="${270 - (subLines.length - 1 - i) * 32}" text-anchor="middle" font-size="24">${esc(line)}</text>`)
    .join('')

  const stamp = ep.stamp
    ? `<g transform="translate(320 82) rotate(-6)" opacity=".85">
    <rect x="-70" y="-22" width="140" height="44" rx="4" fill="none" stroke="${C.red}" stroke-width="3"/>
    <text class="sans" x="0" y="8" text-anchor="middle" font-size="22" font-weight="700" letter-spacing="4" fill="${C.red}">${esc(ep.stamp.toUpperCase())}</text>
  </g>`
    : ''

  const css = `
.cursor{animation:blink 1.1s steps(1) infinite}
@keyframes blink{50%{opacity:0}}
`

  const defs = `
<radialGradient id="spot" cx="${ep.spot}%" cy="0%" r="120%" fx="${ep.spot}%" fy="0%"><stop offset="0" stop-color="#24231f"/><stop offset=".55" stop-color="#141413"/><stop offset="1" stop-color="#0f0f10"/></radialGradient>
<clipPath id="frame"><rect width="${W}" height="${H}" rx="10"/></clipPath>`

  const body = `
<g clip-path="url(#frame)">
  <rect width="${W}" height="${H}" fill="url(#spot)"/>
  <text class="serif" x="${W - 24}" y="${H - 34}" text-anchor="end" font-size="300" fill="#fff" fill-opacity=".035">${ep.n}</text>
  <text class="label" x="28" y="46" font-size="17">EP. ${ep.n}</text>
  ${stamp}
  <text class="serif" x="${W / 2}" y="170" text-anchor="middle" font-size="68" fill="${C.bone}">${esc(ep.title)}</text>
  ${subtitle}
  <g class="mono" font-size="14" fill="${C.dim}">
    <text x="28" y="${H - 22}">00:00</text>
    <rect x="82" y="${H - 28}" width="${W - 164}" height="3" fill="#fff" fill-opacity=".15"/>
    <rect x="82" y="${H - 28}" width="${watchedW}" height="3" fill="${ep.watched === 1 ? C.red : C.sub}"/>
    <circle class="${ep.watched === 1 ? '' : 'cursor'}" cx="${82 + watchedW}" cy="${H - 26.5}" r="5" fill="${ep.watched === 1 ? C.red : C.sub}"/>
    <text x="${W - 28}" y="${H - 22}" text-anchor="end">${minutes}:00</text>
    <text x="${W - 28}" y="42" text-anchor="end" font-size="14" letter-spacing="1">${status.toUpperCase()}</text>
  </g>
  <rect width="${W}" height="${H}" rx="10" fill="none" stroke="#fff" stroke-opacity=".07"/>
</g>`

  return svg({
    width: W,
    height: H,
    title: `Episodio ${ep.n}: ${ep.title}. ${ep.subtitle}`,
    fonts: [FONTS.serif, FONTS.geist, FONTS.mono],
    css,
    defs,
    body,
  })
}

// ---------- spin-off cards ----------

function spinoffCard(spin, stars) {
  const W = 420
  const H = 300

  const pitch = spin.pitch
    .map((line, i) => `<text x="28" y="${178 + i * 22}">${esc(line)}</text>`)
    .join('')

  const body = `
<rect width="${W}" height="${H}" rx="10" fill="${C.night}"/>
<rect x="0" y="0" width="${W}" height="4" fill="${C.sub}" fill-opacity=".9"/>
<text class="label" x="28" y="44">SPIN-OFF · OPEN SOURCE</text>
<text class="serif" x="26" y="104" font-size="44" fill="${C.bone}">${esc(spin.title)}</text>
<text class="sans" x="28" y="134" font-size="13" fill="${C.sub}">${esc(spin.genre)}</text>
<g class="sans" font-size="15" fill="${C.dim}">${pitch}</g>
<g class="mono" font-size="12" fill="${C.dim}">
  <path d="M35 ${H - 39}l2.4 4.9 5.4.8-3.9 3.8.9 5.4-4.8-2.5-4.8 2.5.9-5.4-3.9-3.8 5.4-.8z" fill="${C.sub}"/>
  <text x="48" y="${H - 25}">${stars} ${stars === 1 ? 'stella' : 'stelle'}</text>
  <text x="${W - 28}" y="${H - 25}" text-anchor="end">github.com/${LOGIN}/${esc(spin.repo)} →</text>
</g>
<rect width="${W}" height="${H}" rx="10" fill="none" stroke="#fff" stroke-opacity=".07"/>`

  return svg({
    width: W,
    height: H,
    title: `${spin.title}: ${spin.pitch.join(' ')}`,
    fonts: [FONTS.serif, FONTS.geist, FONTS.mono],
    body,
  })
}

// ---------- season scrubber (live data) ----------

async function fetchStats() {
  const token = process.env.GITHUB_TOKEN
  if (!token) {
    throw new Error('GITHUB_TOKEN is required')
  }

  const query = `query($login:String!){
    user(login:$login){
      followers{totalCount}
      contributionsCollection{contributionCalendar{totalContributions weeks{contributionDays{date contributionCount}}}}
      repositories(first:100, ownerAffiliations:OWNER, isFork:false, privacy:PUBLIC){
        totalCount
        nodes{name stargazerCount languages(first:8, orderBy:{field:SIZE, direction:DESC}){edges{size node{name}}}}
      }
    }
  }`

  const response = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: { Authorization: `bearer ${token}`, 'Content-Type': 'application/json', 'User-Agent': 'profile-readme-build' },
    body: JSON.stringify({ query, variables: { login: LOGIN } }),
  })

  const json = await response.json()
  if (!response.ok || json.errors) {
    throw new Error(`GitHub API error: ${JSON.stringify(json.errors ?? json)}`)
  }

  const user = json.data.user
  const repos = user.repositories.nodes
  const languages = new Map()

  for (const repo of repos) {
    for (const edge of repo.languages.edges) {
      languages.set(edge.node.name, (languages.get(edge.node.name) ?? 0) + edge.size)
    }
  }

  return {
    followers: user.followers.totalCount,
    publicRepos: user.repositories.totalCount,
    stars: repos.reduce((sum, repo) => sum + repo.stargazerCount, 0),
    starsByRepo: Object.fromEntries(repos.map((repo) => [repo.name, repo.stargazerCount])),
    total: user.contributionsCollection.contributionCalendar.totalContributions,
    days: user.contributionsCollection.contributionCalendar.weeks.flatMap((week) => week.contributionDays),
    languages: [...languages.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name]) => name),
  }
}

const MONTHS = ['GEN', 'FEB', 'MAR', 'APR', 'MAG', 'GIU', 'LUG', 'AGO', 'SET', 'OTT', 'NOV', 'DIC']

function season(stats) {
  const W = 1280
  const H = 300
  const left = 64
  const right = W - 64
  const baseY = 214
  const maxBar = 96
  const days = stats.days
  const step = (right - left) / days.length
  const peak = Math.max(1, ...days.map((day) => day.contributionCount))

  const bars = days
    .map((day, i) => {
      const h = day.contributionCount === 0 ? 2 : 6 + Math.sqrt(day.contributionCount / peak) * (maxBar - 6)
      const x = left + i * step
      const fill = day.contributionCount === 0 ? '#fff' : C.bone
      const opacity = day.contributionCount === 0 ? 0.12 : 0.35 + 0.65 * Math.sqrt(day.contributionCount / peak)
      return `<rect x="${x.toFixed(1)}" y="${(baseY - h).toFixed(1)}" width="${Math.max(1, step - 1).toFixed(1)}" height="${h.toFixed(1)}" rx=".6" fill="${fill}" fill-opacity="${opacity.toFixed(2)}"/>`
    })
    .join('')

  const monthTicks = days
    .map((day, i) => ({ day, i }))
    .filter(({ day, i }) => i === 0 || day.date.endsWith('-01'))
    .map(({ day, i }) => {
      const month = MONTHS[Number(day.date.slice(5, 7)) - 1]
      return `<text x="${(left + i * step).toFixed(1)}" y="${baseY + 26}">${month}</text>`
    })
    .join('')

  const best = days.reduce((a, b) => (b.contributionCount > a.contributionCount ? b : a))
  const activeDays = days.filter((day) => day.contributionCount > 0).length

  const metrics = [
    [stats.total.toLocaleString('en-US').replaceAll(',', '.'), 'contributi nell’ultimo anno'],
    [String(activeDays), 'giorni in onda'],
    [String(stats.followers), 'follower'],
    [String(stats.stars), 'stelle'],
    [String(stats.publicRepos), 'repo pubblici'],
  ]

  const metricText = metrics
    .map(
      ([value, label], i) => `<g transform="translate(${left + i * 200} 0)">
    <text class="serif" y="84" font-size="40" fill="${C.bone}">${esc(value)}</text>
    <text class="sans" y="106" font-size="13" fill="${C.dim}">${esc(label)}</text>
  </g>`,
    )
    .join('')

  const css = `
.played{transform-box:fill-box;transform-origin:left;animation:sweep 3.2s cubic-bezier(.3,.6,.2,1) forwards}
@keyframes sweep{from{transform:scaleX(0)}to{transform:scaleX(1)}}
.head{animation:head 3.2s cubic-bezier(.3,.6,.2,1) forwards}
@keyframes head{from{transform:translateX(-${right - left}px)}to{transform:none}}
.pulse{transform-box:fill-box;transform-origin:center;animation:pulse 1.6s ease-out 3.2s infinite}
@keyframes pulse{from{transform:scale(1);opacity:.6}to{transform:scale(3);opacity:0}}
`

  const updated = new Date().toISOString().slice(0, 10)

  const body = `
<rect width="${W}" height="${H}" rx="14" fill="${C.ink}"/>
<rect x="64" y="30" width="2" height="15" fill="${C.red}"/>
<text class="label" x="78" y="42">STAGIONE ${series.year} · ASCOLTI</text>
<text class="mono" x="${right}" y="42" text-anchor="end" font-size="11" fill="${C.dim}">GENERE: ${esc(stats.languages.join(' · ').toUpperCase())}</text>
${metricText}
<g>${bars}</g>
<rect x="${left}" y="${baseY + 4}" width="${right - left}" height="3" rx="1.5" fill="#fff" fill-opacity=".12"/>
<rect class="played" x="${left}" y="${baseY + 4}" width="${right - left}" height="3" rx="1.5" fill="${C.red}"/>
<g class="head">
  <circle class="pulse" cx="${right}" cy="${baseY + 5.5}" r="7" fill="${C.red}"/>
  <circle cx="${right}" cy="${baseY + 5.5}" r="7" fill="${C.red}"/>
</g>
<g class="mono" font-size="10" fill="${C.dim}" letter-spacing="1">${monthTicks}</g>
<text class="mono" x="${left}" y="${H - 22}" font-size="11" fill="${C.dim}">PUNTATA MIGLIORE: ${best.date} · ${best.contributionCount} CONTRIBUTI</text>
<text class="mono" x="${right}" y="${H - 22}" font-size="11" fill="${C.dim}" text-anchor="end">AGGIORNATO ${updated} · IN DIRETTA</text>
<rect width="${W}" height="${H}" rx="14" fill="none" stroke="#fff" stroke-opacity=".07"/>`

  return svg({
    width: W,
    height: H,
    title: `Stagione ${series.year}: ${stats.total} contributi, ${stats.followers} follower, ${stats.stars} stelle`,
    fonts: [FONTS.serif, FONTS.geist, FONTS.mono],
    css,
    defs: '',
    body,
  })
}

// ---------- end card ----------

function endCard() {
  const W = 1280
  const H = 200
  const chars = [...series.quote]
  const typeFor = chars.length * 0.045

  const css = `
.typed{transform-box:fill-box;transform-origin:left;animation:type ${typeFor.toFixed(2)}s steps(${chars.length}) .6s both}
@keyframes type{from{clip-path:inset(0 100% 0 0)}to{clip-path:inset(0 0 0 0)}}
.fade{opacity:0;animation:fade 1s ease ${(typeFor + 1).toFixed(2)}s forwards}
@keyframes fade{to{opacity:1}}
`

  const body = `
<rect width="${W}" height="${H}" rx="14" fill="${C.ink}"/>
<text class="label" x="${W / 2}" y="54" text-anchor="middle">PROSSIMAMENTE</text>
<text class="subtitle typed" x="${W / 2}" y="112" text-anchor="middle" font-size="26">${esc(series.quote)}</text>
<text class="serif fade" x="${W / 2}" y="160" text-anchor="middle" font-size="22" font-style="italic" fill="${C.dim}">continua su thomasfave.ro</text>`

  return svg({
    width: W,
    height: H,
    title: series.quote,
    fonts: [FONTS.serifItalic, FONTS.geist],
    css,
    body,
  })
}

// ---------- main ----------

mkdirSync(OUT, { recursive: true })

const stats = await fetchStats()

write('cold-open.svg', coldOpen())

for (const ep of episodes) {
  write(`ep-${ep.n}.svg`, episodeFrame(ep))
}

for (const spin of spinoffs) {
  write(`spinoff-${spin.repo.toLowerCase()}.svg`, spinoffCard(spin, stats.starsByRepo[spin.repo] ?? 0))
}

write('season.svg', season(stats))
write('end.svg', endCard())
