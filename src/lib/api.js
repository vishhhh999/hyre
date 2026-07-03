import { PROFILE } from './data.js'

const ENDPOINT = '/api/generate' // Vercel serverless proxy

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

export async function generateEmail(job) {
  try {
    return await callClaude(
      `You write job application emails for a designer. Direct, specific, confident. 
No "I am excited to apply". No flattery. No filler. 
3 short paragraphs, under 160 words. Sign with the applicant's first name only. 
Return ONLY the email body — no subject line, no preamble.`,
      `Role: ${job.title} at ${job.company}
Focus: ${job.tags.join(', ')}
Match reasoning: ${job.why}

Applicant: ${PROFILE.name}, ${PROFILE.role}, ${PROFILE.experience} experience
Skills: ${PROFILE.skills}
Portfolio: ${PROFILE.portfolio}
Email: ${PROFILE.email}`
    )
  } catch {
    return fallbackEmail(job)
  }
}

export async function generateFollowUp(app) {
  const days = Math.floor((Date.now() - new Date(app.sentAt)) / 86400000)
  try {
    return await callClaude(
      `You write follow-up emails for job applications. 3 sentences max. 
Not desperate. Not apologetic. Reference the original application, add one new signal, soft close.
Return ONLY the email body.`,
      `Original application: ${app.title} at ${app.company}, sent ${days} days ago.
Applicant: ${PROFILE.name}, portfolio: ${PROFILE.portfolio}`
    )
  } catch {
    return fallbackFollowUp(app, days)
  }
}

const fallbackEmail = (job) =>
  `Hi ${job.company} team,

I'm writing about the ${job.title} role. I'm a brand and visual designer with ${PROFILE.experience} across identity systems, packaging, and web — I take work from strategy through build.

${job.why.replace(/your/g, 'my')}

Portfolio: ${PROFILE.portfolio}. Resume attached. Happy to walk through relevant work.

Vishesh`

const fallbackFollowUp = (app, days) =>
  `Hi ${app.company} team,

Following up on my ${app.title} application from ${days} days ago. I've since shipped new identity work — updated at ${PROFILE.portfolio}.

Still very interested. Happy to talk whenever suits.

Vishesh`
