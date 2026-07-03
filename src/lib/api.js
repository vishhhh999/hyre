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
  const name = profile.name || 'the applicant'
  const firstName = name.split(' ')[0]
  const role = profile.role || 'designer'
  const experience = profile.experience || 'several years'
  const skills = profile.skills || 'brand design, visual identity'
  const portfolio = profile.portfolio ? `https://${profile.portfolio.replace(/^https?:\/\//, '')}` : null

  const sys = `You write job application emails for a designer. Direct, specific, confident.
STRICT RULES:
- Never use placeholder text like [studio name], [client type], [specific project], [portfolio URL], or any square-bracket placeholder whatsoever
- Use ONLY the real information provided below — if you don't have a detail, omit it entirely
- No "I am excited to apply". No flattery. No filler
- 3 short paragraphs, under 160 words
- Sign with the applicant's first name only: ${firstName}
- Return ONLY the email body — no subject line, no preamble`

  const usr = `Role: ${job.title} at ${job.company}
Tags: ${job.tags.join(', ')}
Why they match: ${job.why}

Applicant name: ${name}
Role: ${role}
Experience: ${experience}
Skills: ${skills}${portfolio ? `\nPortfolio: ${portfolio}` : ''}

Write a 3-paragraph email. Use only what's above — no invented details, no brackets.`

  try {
    return await callClaude(sys, usr)
  } catch {
    return fallbackEmail(job, profile)
  }
}

export async function generateFollowUp(app, profile) {
  const days = Math.floor((Date.now() - new Date(app.sentAt)) / 86400000)
  const firstName = (profile.name || 'Vishesh').split(' ')[0]
  const portfolio = profile.portfolio ? `https://${profile.portfolio.replace(/^https?:\/\//, '')}` : null

  const sys = `You write follow-up emails for job applications.
STRICT RULES:
- 3 sentences maximum
- Not desperate, not apologetic
- No placeholder text in square brackets — use only real info provided
- Sign with first name only: ${firstName}
- Return ONLY the email body`

  const usr = `Follow-up for: ${app.title} at ${app.company}, sent ${days} days ago.
Applicant: ${profile.name || 'the applicant'}${portfolio ? `, portfolio: ${portfolio}` : ''}`

  try {
    return await callClaude(sys, usr)
  } catch {
    return fallbackFollowUp(app, profile, days)
  }
}

// Build Gmail compose URL — opens web Gmail with pre-filled recipient, subject, body
export function buildGmailUrl(job, emailBody, profile) {
  const to = encodeURIComponent(job.email)
  const subject = encodeURIComponent(`${job.title} — ${profile.name || 'Application'}`)
  const body = encodeURIComponent(emailBody)
  return `https://mail.google.com/mail/?view=cm&fs=1&to=${to}&su=${subject}&body=${body}`
}

const fallbackEmail = (job, profile) => {
  const firstName = (profile.name || 'Vishesh').split(' ')[0]
  const portfolio = profile.portfolio ? `\n\nPortfolio: https://${profile.portfolio.replace(/^https?:\/\//, '')}. Resume attached.` : '\n\nResume attached.'
  return `Hi ${job.company} team,\n\nI'm writing about the ${job.title} role. I'm a ${profile.role || 'brand and visual designer'} with ${profile.experience || 'several years'} across identity systems, packaging, and web.\n\n${job.why}${portfolio} Happy to walk through relevant work.\n\n${firstName}`
}

const fallbackFollowUp = (app, profile, days) => {
  const firstName = (profile.name || 'Vishesh').split(' ')[0]
  const portfolio = profile.portfolio ? ` Updated portfolio at https://${profile.portfolio.replace(/^https?:\/\//, '')}.` : ''
  return `Hi ${app.company} team,\n\nFollowing up on my ${app.title} application from ${days} days ago.${portfolio}\n\nStill very interested — happy to talk whenever suits.\n\n${firstName}`
}
