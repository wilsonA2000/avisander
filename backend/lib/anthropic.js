// Wrapper del SDK de Anthropic para generación de contenido con Claude.
// Lee ANTHROPIC_API_KEY de .env. Si no está configurada, isEnabled() devuelve false
// y el tab muestra un aviso amigable.

let Anthropic = null

function getClient() {
  if (!process.env.ANTHROPIC_API_KEY) return null
  if (!Anthropic) {
    Anthropic = require('@anthropic-ai/sdk')
  }
  return new Anthropic.default({ apiKey: process.env.ANTHROPIC_API_KEY })
}

function isEnabled() {
  return !!process.env.ANTHROPIC_API_KEY
}

/**
 * Genera contenido de texto con Claude.
 * @param {object} opts
 * @param {string} opts.systemPrompt — instrucción de sistema
 * @param {string} opts.userMessage — mensaje del usuario
 * @param {string} [opts.model] — modelo (default claude-sonnet-4-20250514)
 * @param {number} [opts.maxTokens] — máximo de tokens (default 1024)
 * @returns {{ content: string, usage: { input_tokens, output_tokens } }}
 */
async function generateContent({ systemPrompt, userMessage, model, maxTokens = 1024 }) {
  const client = getClient()
  if (!client) throw new Error('ANTHROPIC_API_KEY no configurada')

  const response = await client.messages.create({
    model: model || 'claude-sonnet-4-20250514',
    max_tokens: maxTokens,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }]
  })

  const text = response.content
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('\n')

  return {
    content: text,
    usage: response.usage
  }
}

module.exports = { isEnabled, generateContent }
