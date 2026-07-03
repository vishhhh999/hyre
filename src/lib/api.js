const ENDPOINT = '/api/generate'

async function callClaude(system, user, maxTokens = 800) {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ system, user, maxTokens }),
  })
  if (!res.ok) throw new Error('API error')
  const data = await res.json()
  return data.text
}

export async function generateEmail(job, profile) {
  const sys = `You write job application emails for a designer. Direct, specific, confident.
No "I am excited to apply". No flattery. No filler. 
3 short paragraphs, under 160 words. Sign with applicant first name only.
Return ONLY the email body — no subject line, no preamble.`

  const usr = `Role: ${job.title} at ${job.company}
Focus: ${job.tags.join(', ')}
Match reasoning: ${job.why}

Applicant: ${profile.name || 'the applicant'}, ${profile.role || 'designer'}, ${profile.experience || 'several years'} experience
Skills: ${profile.skills || 'brand design, visual identity'}
Portfolio: ${profile.portfolio || '[portfolio URL]'}`

  try {
    return await callClaude(sys, usr)
  } catch {
    return fallbackEmail(job, profile)
  }
}

export async function generateFollowUp(app, profile) {
  const days = Math.floor((Date.now() - new Date(app.sentAt)) / 86400000)
  const sys = `You write follow-up emails for job applications. 3 sentences max.
Not desperate. Not apologetic. Reference the original application, add one new signal, soft close.
Return ONLY the email body.`
  const usr = `Original application: ${app.title} at ${app.company}, sent ${days} days ago.
Applicant: ${profile.name || 'the applicant'}, portfolio: ${profile.portfolio || '[portfolio URL]'}`

  try {
    return await callClaude(sys, usr)
  } catch {
    return fallbackFollowUp(app, profile, days)
  }
}

// Build a mailto: URL — fallback when Gmail isn't connected
export function buildMailto(job, emailBody, profile) {
  const subject = encodeURIComponent(`${job.title} — ${profile.name || 'Application'}`)
  const body = encodeURIComponent(emailBody)
  return `mailto:${job.email}?subject=${subject}&body=${body}`
}

const fallbackEmail = (job, profile) =>
  `Hi ${job.company} team,\n\nI'm writing about the ${job.title} role. I'm a brand and visual designer with ${profile.experience || 'several years'} across identity systems, packaging, and web.\n\n${job.why}\n\nPortfolio: ${profile.portfolio || '[portfolio URL]'}. Resume attached. Happy to walk through relevant work.\n\n${profile.name?.split(' ')[0] || 'Vishesh'}`

const fallbackFollowUp = (app, profile, days) =>
  `Hi ${app.company} team,\n\nFollowing up on my ${app.title} application from ${days} days ago. I've since updated my portfolio at ${profile.portfolio || '[portfolio URL]'}.\n\nStill very interested — happy to talk whenever suits.\n\n${profile.name?.split(' ')[0] || 'Vishesh'}`
