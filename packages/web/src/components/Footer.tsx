export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto flex flex-col items-start gap-2 px-4 py-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <span className="text-base font-semibold text-foreground">AIOcean</span>
        <span>(c) {year} AIOcean. All rights reserved.</span>
      </div>
    </footer>
  )
}
