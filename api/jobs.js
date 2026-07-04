// Fetches live remote design jobs from Remotive public API (no key required)
// Called by the frontend "Load more" button
export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const response = await fetch(
      'https://remotive.com/api/remote-jobs?category=design&limit=20',
      { headers: { 'Accept': 'application/json' } }
    )

    if (!response.ok) throw new Error(`Remotive responded ${response.status}`)

    const data = await response.json()

    // Normalise to our job shape
    const jobs = (data.jobs || []).map((j, i) => ({
      id: `remotive-${j.id}`,
      title: j.title,
      company: j.company_name,
      location: j.candidate_required_location || 'Remote',
      workType: 'Remote',
      type: j.job_type || 'Full-time',
      salary: j.salary || 'Not specified',
      salaryNum: 0,
      email: null,           // Remotive jobs link to ATS — no direct email
      applyUrl: j.url,       // used instead of email
      tags: (j.tags || []).slice(0, 3).map(t => t.charAt(0).toUpperCase() + t.slice(1)),
      posted: j.publication_date ? timeAgo(j.publication_date) : '?',
      match: 70 + Math.floor(Math.random() * 20), // placeholder until real matching is wired
      why: `${j.company_name} is hiring via Remotive. Review the full listing to confirm fit.`,
      source: 'remotive',
    }))

    return res.status(200).json({ jobs })
  } catch (err) {
    console.error('Jobs fetch error:', err)
    return res.status(500).json({ error: 'Failed to fetch jobs', detail: err.message })
  }
}

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr)) / 1000
  if (diff < 3600)  return `${Math.floor(diff / 60)}m`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`
  return `${Math.floor(diff / 86400)}d`
}
