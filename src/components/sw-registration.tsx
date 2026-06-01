"use client"

import { useEffect } from "react"

export function SWRegistration() {
  useEffect(() => {
    if ("serviceWorker" in navigator && window.location.protocol === "https:" || window.location.hostname === "localhost") {
      const handler = () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((registration) => {
            // console.log("SW registered:", registration)
          })
          .catch((error) => {
            console.error("SW registration failed:", error)
          })
      }
      window.addEventListener("load", handler)
      return () => window.removeEventListener("load", handler)
    }
  }, [])

    return null
}
