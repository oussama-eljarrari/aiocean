import { useState } from "react"

/** Build an ordered list of logo URLs to try, best first. */
function getLogoSources(logo?: string | null, url?: string | null): string[] {
  const sources: string[] = []
  if (logo) sources.push(logo)
  if (url) {
    try {
      const host = new URL(url).hostname
      sources.push(`https://logo.clearbit.com/${host}`)
      sources.push(`https://www.google.com/s2/favicons?domain=${host}&sz=128`)
    } catch {
      // invalid URL — skip derived sources
    }
  }
  return sources
}

interface ToolLogoProps {
  name: string
  logo?: string | null
  url?: string | null
  /** Container size/shape classes, e.g. "size-12 text-2xl rounded-lg". */
  className?: string
  /** Inner image classes, e.g. "p-1.5". */
  imgClassName?: string
}

/**
 * Shows a tool's logo with graceful fallback:
 * explicit logo_url -> Clearbit logo -> Google favicon -> first letter.
 */
export function ToolLogo({ name, logo, url, className, imgClassName }: ToolLogoProps) {
  const sources = getLogoSources(logo, url)
  const [idx, setIdx] = useState(0)
  const src = sources[idx]

  return (
    <div
      className={`relative flex shrink-0 items-center justify-center overflow-hidden border bg-muted font-medium shadow-sm ${
        className ?? "size-12 rounded-lg text-2xl"
      }`}
    >
      <span>{name.charAt(0).toUpperCase()}</span>
      {src && (
        <img
          src={src}
          alt={name}
          className={`absolute inset-0 size-full bg-muted object-contain ${imgClassName ?? "p-1.5"}`}
          onError={() => setIdx((i) => i + 1)}
        />
      )}
    </div>
  )
}
