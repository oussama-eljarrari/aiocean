import { z } from 'zod'
import { readFileSync } from 'node:fs'
import 'dotenv/config'

const envSchema = z.object({
  AGENT_PORT: z.coerce.number().default(3001),
  AGENT_PUBLIC_URL: z.string().optional(),
  OAUTH_ISSUER: z.string().default('http://localhost:8080'),
  OAUTH_PUBLIC_KEY_PATH: z.string({
    message: 'OAUTH_PUBLIC_KEY_PATH is required',
  }),
  MCP_SUPPORTED_SCOPES: z.string().default('mcp:user mcp:admin'),
  MCP_REQUIRED_SCOPES: z.string().default('mcp:user'),
  INTERNAL_SHARED_SECRET: z.string().default(''),
  PHP_API_BASE_URL: z.string().default('http://localhost:8080'),
  OPENROUTER_API_KEY: z.string().optional(),
  EXA_API_KEY: z.string().optional(),
})

// Parse environmental inputs using Zod
const parsedEnv = envSchema.safeParse(process.env)
if (!parsedEnv.success) {
  console.error('❌ Configuration validation failed:', JSON.stringify(parsedEnv.error.format(), null, 2))
  throw new Error('Invalid environment configuration')
}

const env = parsedEnv.data

// Load public key PEM
let oauthPublicKeyPem: string
try {
  oauthPublicKeyPem = readFileSync(env.OAUTH_PUBLIC_KEY_PATH, 'utf8')
} catch (err) {
  throw new Error(
    `Configuration Error: Failed to read public key from path "${env.OAUTH_PUBLIC_KEY_PATH}": ${
      err instanceof Error ? err.message : String(err)
    }`
  )
}

function parseScopes(scopesStr: string): string[] {
  return scopesStr.split(/\s+/).filter(Boolean)
}

const publicBaseUrl = env.AGENT_PUBLIC_URL || `http://localhost:${env.AGENT_PORT}`

export const config = {
  port: env.AGENT_PORT,
  publicBaseUrl,
  resourceUrl: `${publicBaseUrl}/mcp`,
  resourceMetadataUrl: `${publicBaseUrl}/.well-known/oauth-protected-resource`,
  oauthIssuer: env.OAUTH_ISSUER,
  oauthPublicKeyPem,
  supportedScopes: parseScopes(env.MCP_SUPPORTED_SCOPES),
  requiredScopes: parseScopes(env.MCP_REQUIRED_SCOPES),
  internalSharedSecret: env.INTERNAL_SHARED_SECRET,
  phpApiBaseUrl: env.PHP_API_BASE_URL,
  openRouterApiKey: env.OPENROUTER_API_KEY,
  exaApiKey: env.EXA_API_KEY,
} as const

export type Config = typeof config
