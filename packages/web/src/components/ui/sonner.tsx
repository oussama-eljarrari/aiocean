import type { CSSProperties } from "react"

import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      richColors
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      style={
        {
          "--normal-bg": "color-mix(in oklab, var(--card) 92%, var(--primary) 8%)",
          "--normal-text": "var(--card-foreground)",
          "--normal-border": "color-mix(in oklab, var(--border) 80%, var(--primary) 20%)",
          "--success-bg": "color-mix(in oklab, var(--card) 86%, #10b981 14%)",
          "--success-text": "var(--card-foreground)",
          "--success-border": "color-mix(in oklab, var(--border) 55%, #10b981 45%)",
          "--error-bg": "color-mix(in oklab, var(--card) 86%, #ef4444 14%)",
          "--error-text": "var(--card-foreground)",
          "--error-border": "color-mix(in oklab, var(--border) 55%, #ef4444 45%)",
          "--warning-bg": "color-mix(in oklab, var(--card) 86%, #f59e0b 14%)",
          "--warning-text": "var(--card-foreground)",
          "--warning-border": "color-mix(in oklab, var(--border) 55%, #f59e0b 45%)",
          "--info-bg": "color-mix(in oklab, var(--card) 86%, #0ea5e9 14%)",
          "--info-text": "var(--card-foreground)",
          "--info-border": "color-mix(in oklab, var(--border) 55%, #0ea5e9 45%)",
          "--border-radius": "12px",
        } as CSSProperties
      }
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:border group-[.toaster]:shadow-lg group-[.toaster]:backdrop-blur-sm group-[.toaster]:rounded-xl",
          title: "text-sm font-semibold tracking-tight",
          description: "text-sm text-muted-foreground",
          actionButton:
            "!bg-primary !text-primary-foreground hover:!bg-primary/90 !rounded-md !px-3 !h-8 !text-xs !font-semibold",
          cancelButton:
            "!bg-muted !text-foreground hover:!bg-muted/80 !rounded-md !px-3 !h-8 !text-xs !font-medium",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
