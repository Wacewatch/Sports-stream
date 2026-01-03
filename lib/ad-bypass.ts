export function openAdWithBypass(url: string): boolean {
  const adUrl = url || "https://www.example.com/ad"
  let opened = false

  // Method 1: Direct window.open with noreferrer
  try {
    const popup = window.open(adUrl, "_blank", "noopener,noreferrer,width=1,height=1,left=9999,top=9999")
    if (popup) {
      opened = true
      console.log("[v0] Ad opened via window.open")
    }
  } catch (e) {
    console.error("[v0] window.open failed:", e)
  }

  // Method 2: Create invisible link and click it
  if (!opened) {
    try {
      const link = document.createElement("a")
      link.href = adUrl
      link.target = "_blank"
      link.rel = "noopener noreferrer"
      link.style.display = "none"
      document.body.appendChild(link)

      // Dispatch actual click event
      const clickEvent = new MouseEvent("click", {
        view: window,
        bubbles: true,
        cancelable: true,
        buttons: 1,
      })
      link.dispatchEvent(clickEvent)

      setTimeout(() => document.body.removeChild(link), 100)
      opened = true
      console.log("[v0] Ad opened via link click")
    } catch (e) {
      console.error("[v0] Link click failed:", e)
    }
  }

  // Method 3: Form submission in new tab
  if (!opened) {
    try {
      const form = document.createElement("form")
      form.action = adUrl
      form.target = "_blank"
      form.method = "GET"
      form.style.display = "none"
      document.body.appendChild(form)
      form.submit()
      setTimeout(() => document.body.removeChild(form), 100)
      opened = true
      console.log("[v0] Ad opened via form submit")
    } catch (e) {
      console.error("[v0] Form submit failed:", e)
    }
  }

  // Method 4: Location assign in new window
  if (!opened) {
    try {
      const w = window.open("", "_blank")
      if (w) {
        w.location.assign(adUrl)
        opened = true
        console.log("[v0] Ad opened via location.assign")
      }
    } catch (e) {
      console.error("[v0] location.assign failed:", e)
    }
  }

  // Method 5: Create iframe and trigger navigation
  if (!opened) {
    try {
      const iframe = document.createElement("iframe")
      iframe.style.display = "none"
      document.body.appendChild(iframe)
      if (iframe.contentWindow) {
        iframe.contentWindow.location.href = adUrl
        setTimeout(() => {
          const popup = window.open("", "_blank")
          if (popup && iframe.contentWindow) {
            popup.location.href = iframe.contentWindow.location.href
          }
          document.body.removeChild(iframe)
        }, 50)
        opened = true
        console.log("[v0] Ad opened via iframe")
      }
    } catch (e) {
      console.error("[v0] iframe method failed:", e)
    }
  }

  return opened
}
