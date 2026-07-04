// Job feed proxy — Remotive (always) + Adzuna (if env vars set)
// Both filtered to actual design roles only

// must match a specific visual/digital design discipline
// "Gas Designer", "Kitchen Designer", "Electrical Designer" all fail this
const DESIGN_ROLE_PATTERNS = [
  /brand\s*designer/i,
  /visual\s*designer/i,
  /graphic\s*designer/i,
  /ui\s*designer/i,
  /ux\s*designer/i,
  /ui\/ux/i,
  /product\s*designer/i,
  /motion\s*designer/i,
  /creative\s*director/i,
  /art\s*director/i,
  /design\s*lead/i,
  /design\s*director/i,
  /senior\s*designer/i,
  /junior\s*designer/i,
  /digital\s*designer/i,
  /identity\s*designer/i,
  /interaction\s*designer/i,
  /web\s*designer/i,
  /communication\s*designer/i,
  /experience\s*designer/i,
]

function isDesignRole(title) {
  return DESIGN_ROLE_PATTERNS.some(p => p.test(title))
}

function extractExperience(text) {
  if (!text) return null
  // match patterns like "3+ years", "2-4 years", "5 years experience", "senior (5+)"
  const patterns = [
    /(\d+)\s*\+\s*years?/i,
    /(\d+)\s*[-–]\s*(\d+)\s*years?/i,
    /(\d+)\s*years?\s*(of\s*)?experience/i,
    /minimum\s*(\d+)\s*years?/i,
    /at\s*least\s*(\d+)\s*years?/i,
  ]
  for (const p of patterns) {
    const m = text.match(p)
    if (m) {
      if (m[2]) return `${m[1]}–${m[2]} yrs`
      return `${m[1]}+ yrs`
    }
  }
  // infer from seniority keyword if no number found
  const t = text.toLowerCase()
  if (t.includes('senior') || t.includes('lead')) return '5+ yrs'
  if (t.includes('junior') || t.includes('entry')) return '0–2 yrs'
  if (t.includes('mid-level') || t.includes('mid level')) return '3–5 yrs'
  return null
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
  // Remotive category=design is unreliable — use search with explicit terms instead
  const queries = ['brand designer', 'visual designer', 'product designer']
  const seen = new Set()
  const results = []

  for (const q of queries) {
    try {
      const r = await fetch(
        `https://remotive.com/api/remote-jobs?search=${encodeURIComponent(q)}&limit=20`,
        { headers: { Accept: 'application/json' } }
      )
      if (!r.ok) continue
      const data = await r.json()
      for (const j of (data.jobs || [])) {
        if (seen.has(j.id) || !isDesignRole(j.title)) continue
        seen.add(j.id)
        results.push({
          id: `remotive-${j.id}`,
          title: j.title,
          company: j.company_name,
          location: j.candidate_required_location || 'Remote',
          workType: 'Remote',
          type: j.job_type || 'Full-time',
          salary: j.salary || null,
          salaryNum: 0,
          experience: extractExperience(j.description || ''),
          email: null,
          applyUrl: j.url,
          tags: (j.tags || []).slice(0, 3).map(t => t.charAt(0).toUpperCase() + t.slice(1)),
          posted: timeAgo(j.publication_date),
          match: 70 + Math.floor(Math.random() * 20),
          why: `Live remote role at ${j.company_name}. Expand to view full listing.`,
          source: 'remotive',
        })
      }
    } catch {
      // continue to next query
    }
  }

  return results
}

async function fetchAdzuna() {
  const appId  = process.env.ADZUNA_APP_ID
  const appKey = process.env.ADZUNA_APP_KEY
  if (!appId || !appKey) return []

  const searches = [
    { country: 'gb', term: 'brand designer' },
    { country: 'gb', term: 'visual designer' },
    { country: 'us', term: 'brand designer' },
    { country: 'us', term: 'visual designer' },
  ]

  const seen = new Set()
  const results = []

  for (const { country, term } of searches) {
    try {
      const params = new URLSearchParams({
        app_id: appId,
        app_key: appKey,
        results_per_page: 10,
        what: term,
        title_only: term,
        sort_by: 'date',
      })
      const r = await fetch(
        `https://api.adzuna.com/v1/api/jobs/${country}/search/1?${params}`,
        { headers: { Accept: 'application/json' } }
      )
      if (!r.ok) continue
      const data = await r.json()

      for (const j of (data.results || [])) {
        if (seen.has(j.id) || !isDesignRole(j.title)) continue
        seen.add(j.id)
        results.push({
          id: `adzuna-${j.id}`,
          title: j.title,
          company: j.company?.display_name || 'Unknown',
          location: j.location?.display_name || 'Unknown',
          workType: detectWorkType(j.title + ' ' + (j.description || '')),
          type: 'Full-time',
          salary: j.salary_min && j.salary_max
            ? `${country === 'us' ? '$' : '£'}${Math.round(j.salary_min / 1000)}–${Math.round(j.salary_max / 1000)}k`
            : null,
          salaryNum: j.salary_max ? Math.round(j.salary_max / 1000) : 0,
          experience: extractExperience(j.description || ''),
          email: null,
          applyUrl: j.redirect_url,
          tags: extractTags(j.title),
          posted: timeAgo(j.created),
          match: 65 + Math.floor(Math.random() * 25),
          why: `Role on Adzuna (${country.toUpperCase()}). Click to view full listing and apply.`,
          source: 'adzuna',
        })
      }
    } catch {
      // continue to next search
    }
  }

  return results
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const [remotiveRes, adzunaRes] = await Promise.allSettled([
    fetchRemotive(),
    fetchAdzuna(),
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
