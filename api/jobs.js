// Proxies live remote design jobs from multiple sources
// Remotive: free, no key needed
// Returns normalised job shape with applyUrl or email

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const [remotiveRes, adzunaRes] = await Promise.allSettled([
      fetchRemotive(),
      fetchAdzuna(),
    ])

    const jobs = [
      ...(remotiveRes.status === 'fulfilled' ? remotiveRes.value : []),
      ...(adzunaRes.status  === 'fulfilled' ? adzunaRes.value  : []),
    ]

    return res.status(200).json({ jobs, sources: { remotive: remotiveRes.status, adzuna: adzunaRes.status } })
  } catch (err) {
    console.error('Jobs fetch error:', err)
    return res.status(500).json({ error: 'Failed to fetch jobs', detail: err.message })
  }
}

async function fetchRemotive() {
  const r = await fetch('https://remotive.com/api/remote-jobs?category=design&limit=30', {
    headers: { 'Accept': 'application/json' },
  })
  if (!r.ok) throw new Error(`Remotive ${r.status}`)
  const data = await r.json()

  return (data.jobs || []).map(j => ({
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
    why: `Live role at ${j.company_name} via Remotive. Expand to view full listing.`,
    source: 'remotive',
  }))
}

async function fetchAdzuna() {
  // Adzuna requires app_id + app_key — set these as Vercel env vars
  const appId  = process.env.ADZUNA_APP_ID
  const appKey = process.env.ADZUNA_APP_KEY

  // Gracefully skip if not configured
  if (!appId || !appKey) return []

  const url = `https://api.adzuna.com/v1/api/jobs/gb/search/1?app_id=${appId}&app_key=${appKey}&results_per_page=20&what=designer&where=remote&content-type=application/json`
  const r = await fetch(url)
  if (!r.ok) throw new Error(`Adzuna ${r.status}`)
  const data = await r.json()

  return (data.results || []).map(j => ({
    id: `adzuna-${j.id}`,
    title: j.title,
    company: j.company?.display_name || 'Unknown',
    location: j.location?.display_name || 'Remote',
    workType: detectWorkType(j.title + ' ' + (j.description || '')),
    type: 'Full-time',
    salary: j.salary_min && j.salary_max ? `£${Math.round(j.salary_min/1000)}–${Math.round(j.salary_max/1000)}k` : null,
    salaryNum: j.salary_max ? Math.round(j.salary_max / 1000) : 0,
    email: null,
    applyUrl: j.redirect_url,
    tags: extractTags(j.title),
    posted: timeAgo(j.created),
    match: 65 + Math.floor(Math.random() * 25),
    why: `Role listed on Adzuna. Expand to view full listing and apply.`,
    source: 'adzuna',
  }))
}

function detectWorkType(text) {
  const t = text.toLowerCase()
  if (t.includes('remote')) return 'Remote'
  if (t.includes('hybrid')) return 'Hybrid'
  return 'On-site'
}

function extractTags(title) {
  const keywords = ['Brand', 'Visual', 'UI', 'UX', 'Motion', 'Identity', 'Graphic', 'Product', 'Creative', 'Digital']
  return keywords.filter(k => title.toLowerCase().includes(k.toLowerCase())).slice(0, 3)
}

function timeAgo(dateStr) {
  if (!dateStr) return '?'
  const diff = (Date.now() - new Date(dateStr)) / 1000
  if (diff < 3600)  return `${Math.floor(diff / 60)}m`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`
  return `${Math.floor(diff / 86400)}d`
}
