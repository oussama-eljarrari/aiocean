import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import "./index.css"
import App from "./App.tsx"
import { ThemeProvider } from "@/components/theme-provider.tsx"
import LineWaves from "./components/LineWaves.tsx"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <div className="absolute opacity-50 inset-0 z-[-1]">
        {/* <LineWaves
          speed={0.3}
          innerLineCount={37}
          outerLineCount={36}
          warpIntensity={0.8}
          rotation={-45}
          edgeFadeWidth={0}
          colorCycleSpeed={1}
          brightness={0.2}
          color1="#007595"
          color2="#007595"
          color3="#ffffff"
          enableMouseInteraction
          mouseInfluence={2} /> */}
      </div>
      <App />
    </ThemeProvider>
  </StrictMode>
)
