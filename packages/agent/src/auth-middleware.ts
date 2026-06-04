import { readFile } from 'node:fs/promises'
import type { MiddlewareHandler } from 'hono'
import * as jose from 'jose'

export type AuthConfig = {
  /** OAuth Authorization Server issuer (must match `iss` claim) */
  issuer: string
  /** Canonical resource URL (must match `aud` claim) */
  audience: string
  /** URL of this server's RFC 9728 protected-resource metadata document */
  resourceMetadataUrl: string
  /** Required scopes, advertised in 401 responses */
  requiredScopes: string[]
  /** Path to the AS public key (PEM, SPKI) used to verify RS256 JWTs */
  publicKeyPath: string
}

type AuthInfo = {
  token: string
  payload: jose.JWTPayload
}

declare module 'hono' {
  interface ContextVariableMap {
    auth: AuthInfo
  }
}

let cachedKey: CryptoKey | undefined

async function getPublicKey(path: string): Promise<CryptoKey> {
  if (cachedKey) return cachedKey
  const pem = await readFile(path, 'utf8')
  cachedKey = await jose.importSPKI(pem, 'RS256')
  return cachedKey
}

function challenge(config: AuthConfig, error: string, description: string): string {
  const scope = config.requiredScopes.join(' ')
  return (
    `Bearer resource_metadata="${config.resourceMetadataUrl}", ` +
    `scope="${scope}", ` +
    `error="${error}", ` +
    `error_description="${description}"`
  )
}

/**
 * Bearer-token authentication for MCP routes per the MCP authorization spec.
 *
 * - Missing/malformed token → 401 with WWW-Authenticate pointing to the
 *   RFC 9728 protected-resource metadata document
 * - Valid token → JWT payload is exposed on the Hono context as `c.get('auth')`
 */
export function createAuthMiddleware(config: AuthConfig): MiddlewareHandler {
  return async (c, next) => {
    const header = c.req.header('Authorization')
    if (!header || !header.toLowerCase().startsWith('bearer ')) {
      return new Response(
        JSON.stringify({ error: 'invalid_token', error_description: 'Bearer token required' }),
        {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
            'WWW-Authenticate': challenge(config, 'invalid_token', 'Bearer token required'),
          },
        },
      )
    }

    const token = header.slice(7).trim()
    try {
      const key = await getPublicKey(config.publicKeyPath)
      const { payload } = await jose.jwtVerify(token, key, {
        issuer: config.issuer,
        audience: config.audience,
        algorithms: ['RS256'],
        clockTolerance: 5,
      })
      c.set('auth', { token, payload })
      await next()
    } catch (err) {
      const description = err instanceof Error ? err.message : 'Token verification failed'
      return new Response(
        JSON.stringify({ error: 'invalid_token', error_description: description }),
        {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
            'WWW-Authenticate': challenge(config, 'invalid_token', description),
          },
        },
      )
    }
  }
}
