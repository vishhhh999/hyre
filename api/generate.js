export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { system, user, maxTokens = 800 } = req.body

  if (!system || !user) {
    return res.status(400).json({ error: 'Missing system or user prompt' })
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: maxTokens,
        system,
        messages: [{ role: 'user', content: user }],
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      console.error('Anthropic error:', err)
      return res.status(500).json({ error: 'Anthropic API error' })
    }

    const data = await response.json()
    const text = data.content?.find(b => b.type === 'text')?.text ?? ''

    return res.status(200).json({ text })
  } catch (err) {
    console.error('Generate error:', err)
    return res.status(500).json({ error: 'Internal error' })
  }
}
