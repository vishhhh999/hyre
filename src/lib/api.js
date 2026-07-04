const ENDPOINT = '/api/generate'

async function callClaude(system, user, maxTokens = 1000) {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ system, user, maxTokens }),
  })
  if (!res.ok) throw new Error('API error')
  const data = await res.json()
  return data.text
}

// Normalise portfolio URL — always www. prefix, no protocol
function portfolioUrl(raw) {
  if (!raw) return null
  let clean = raw.replace(/^https?:\/\//, '').replace(/^www\./, '')
  return `www.${clean}`
}

export async function generateEmail(job, profile) {
  const name = profile.name || 'the applicant'
  const firstName = name.split(' ')[0]
  const portfolio = portfolioUrl(profile.portfolio)

  const profileBlock = [
    `Name: ${name}`,
    profile.role        ? `Role: ${profile.role}` : null,
    profile.experience  ? `Experience: ${profile.experience}` : null,
    profile.skills      ? `Skills: ${profile.skills}` : null,
    profile.about       ? `About: ${profile.about}` : null,
    portfolio           ? `Portfolio: ${portfolio}` : null,
  ].filter(Boolean).join('\n')

  const sys = `You write job application emails for a designer. Your job is to write a real, specific, confident email — not a template.

STRICT RULES:
- Read the applicant profile carefully and reference specific details from it (skills, background, about)
- Never invent details not present in the profile
- Never use square-bracket placeholders like [studio name] or [portfolio URL] — use actual values or omit
- No "I am excited to apply", no flattery, no filler phrases
- 3 short paragraphs, under 160 words total
- Sign off with first name only: ${firstName}
- Return ONLY the email body — no subject line, no preamble, no "Here is the email:" intro`

  const usr = `JOB:
Title: ${job.title}
Company: ${job.company}
Tags: ${job.tags.join(', ')}
Why this person matches: ${job.why}

APPLICANT PROFILE:
${profileBlock}

Write the email. Draw from the profile details above — reference the applicant's actual skills and background as they relate to this specific role.`

  try {
    return await callClaude(sys, usr)
  } catch {
    return fallbackEmail(job, profile)
  }
}

export async function generateFollowUp(app, profile) {
  const days = Math.floor((Date.now() - new Date(app.sentAt)) / 86400000)
  const firstName = (profile.name || 'Vishesh').split(' ')[0]
  const portfolio = portfolioUrl(profile.portfolio)

  const sys = `You write follow-up emails for job applications. Short, direct, not desperate.
RULES: 3 sentences max. No placeholders. Sign with first name only: ${firstName}. Return ONLY the email body.`

  const usr = `Follow-up for: ${app.title} at ${app.company}, sent ${days} days ago.
Applicant: ${profile.name || 'the applicant'}${portfolio ? `, portfolio: ${portfolio}` : ''}${profile.about ? `\nBackground: ${profile.about}` : ''}`

  try {
    return await callClaude(sys, usr)
  } catch {
    return fallbackFollowUp(app, profile, days)
  }
}

// Gmail compose URL — u/1 account slot
export function buildGmailUrl(toEmail, subject, body) {
  const to = encodeURIComponent(toEmail)
  const su = encodeURIComponent(subject)
  const bd = encodeURIComponent(body)
  return `https://mail.google.com/mail/u/1/?view=cm&fs=1&to=${to}&su=${su}&body=${bd}`
}

const fallbackEmail = (job, profile) => {
  const firstName = (profile.name || 'Vishesh').split(' ')[0]
  const portfolio = portfolioUrl(profile.portfolio)
  const portfolioLine = portfolio ? `\n\nPortfolio: ${portfolio}. Resume attached.` : '\n\nResume attached.'
  return `Hi ${job.company} team,\n\nI'm writing about the ${job.title} role. I'm a ${profile.role || 'brand and visual designer'} with ${profile.experience || 'several years'} of experience in ${profile.skills || 'brand identity and visual design'}.\n\n${job.why}${portfolioLine}\n\n${firstName}`
}

const fallbackFollowUp = (app, profile, days) => {
  const firstName = (profile.name || 'Vishesh').split(' ')[0]
  const portfolio = portfolioUrl(profile.portfolio)
  const portfolioLine = portfolio ? ` Portfolio: ${portfolio}.` : ''
  return `Hi ${app.company} team,\n\nFollowing up on my ${app.title} application from ${days} days ago.${portfolioLine}\n\nStill very interested — happy to talk whenever suits.\n\n${firstName}`
}

