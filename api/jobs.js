// Job feed proxy — Remotive (always) + Adzuna (if env vars set)
// Both filtered to actual design roles only

const DESIGN_TITLE_KEYWORDS = [
  'brand', 'visual', 'graphic', 'identity', 'ui designer', 'ux designer',
  'product designer', 'motion designer', 'creative director', 'art director',
  'design lead', 'designer',
]

function isDesignRole(title) {
  const t = title.toLowerCase()
  return DESIGN_TITLE_KEYWORDS.some(k => t.includes(k))
}

function detectWorkType(text) {
  const t = text.toLowerCase()
  if (t.includes('remote')) return 'Remote'
  if (t.includes('hybrid')) return 'Hybrid'
  return 'On-site'
}

function extractTags(title) {
  const keywords = ['Brand', 'Visual', 'UI', 'UX', 'Motion', 'Identity', 'Graphic', 'Product', 'Creative', 'Digital', 'Art']
  return keywords.filter(k => title.toLowerCase().includes(k.toLowerCase())).slice(0, 3)
}

function timeAgo(dateStr) {
  if (!dateStr) return '?'
  const diff = (Date.now() - new Date(dateStr)) / 1000
  if (diff < 3600)  return `${Math.floor(diff / 60)}m`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`
  return `${Math.floor(diff / 86400)}d`
}

async function fetchRemotive() {
  const r = await fetch('https://remotive.com/api/remote-jobs?category=design&limit=50', {
    headers: { Accept: 'application/json' },
  })
  if (!r.ok) throw new Error(`Remotive ${r.status}`)
  const data = await r.json()

  return (data.jobs || [])
    .filter(j => isDesignRole(j.title))   // filter out non-design roles
    .map(j => ({
      id: `remotive-${j.id}`,
      title: j.title,
      company: j.company_name,
      location: j.candidate_required_location || 'Remote',
      workType: 'Remote',
      type: j.job_type || 'Full-time',
      salary: j.salary || null,
      salaryNum: 0,
      email: null,
      applyUrl: j.url,
      tags: (j.tags || []).slice(0, 3).map(t => t.charAt(0).toUpperCase() + t.slice(1)),
      posted: timeAgo(j.publication_date),
      match: 70 + Math.floor(Math.random() * 20),
      why: `Live remote role at ${j.company_name}. Expand to view full listing.`,
      source: 'remotive',
    }))
}

async function fetchAdzuna(country = 'gb') {
  const appId  = process.env.ADZUNA_APP_ID
  const appKey = process.env.ADZUNA_APP_KEY
  if (!appId || !appKey) return []

  // title_only=1 scopes the search to job titles only, much tighter than full-text
  // Use "designer" as a broad title anchor, then filter results by keyword list
  const params = new URLSearchParams({
    app_id: appId,
    app_key: appKey,
    results_per_page: 30,
    what: 'designer',
    title_only: 'designer',
  })

  const url = `https://api.adzuna.com/v1/api/jobs/${country}/search/1?${params}`
  const r = await fetch(url, { headers: { Accept: 'application/json' } })
  if (!r.ok) throw new Error(`Adzuna ${r.status}: ${await r.text()}`)
  const data = await r.json()

  return (data.results || [])
    .filter(j => isDesignRole(j.title))
    .map(j => ({
      id: `adzuna-${j.id}`,
      title: j.title,
      company: j.company?.display_name || 'Unknown',
      location: j.location?.display_name || 'Unknown',
      workType: detectWorkType(j.title + ' ' + (j.description || '')),
      type: 'Full-time',
      salary: j.salary_min && j.salary_max
        ? `£${Math.round(j.salary_min / 1000)}–${Math.round(j.salary_max / 1000)}k`
        : null,
      salaryNum: j.salary_max ? Math.round(j.salary_max / 1000) : 0,
      email: null,
      applyUrl: j.redirect_url,
      tags: extractTags(j.title),
      posted: timeAgo(j.created),
      match: 65 + Math.floor(Math.random() * 25),
      why: `Role on Adzuna. Click to view full listing and apply.`,
      source: 'adzuna',
    }))
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const [remotiveRes, adzunaRes] = await Promise.allSettled([
    fetchRemotive(),
    fetchAdzuna('gb'),
  ])

  const jobs = [
    ...(remotiveRes.status === 'fulfilled' ? remotiveRes.value : []),
    ...(adzunaRes.status  === 'fulfilled' ? adzunaRes.value  : []),
  ]

  // log errors server-side for debugging without breaking the response
  if (remotiveRes.status === 'rejected') console.error('Remotive failed:', remotiveRes.reason?.message)
  if (adzunaRes.status  === 'rejected') console.error('Adzuna failed:',  adzunaRes.reason?.message)

  return res.status(200).json({
    jobs,
    meta: {
      remotive: remotiveRes.status === 'fulfilled' ? remotiveRes.value.length : `error: ${remotiveRes.reason?.message}`,
      adzuna:   adzunaRes.status  === 'fulfilled' ? adzunaRes.value.length  : `error: ${adzunaRes.reason?.message}`,
    },
  })
}
