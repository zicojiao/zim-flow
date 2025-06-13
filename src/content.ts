export { }


// Plasmo content script: handles overlay, selection, and submit
let overlay: HTMLDivElement = null
let selection: HTMLDivElement = null
let startX = 0, startY = 0, endX = 0, endY = 0
let isSelecting = false

function createOverlay() {
  overlay = document.createElement("div")
  overlay.style.position = "fixed"
  overlay.style.left = "0"
  overlay.style.top = "0"
  overlay.style.width = "100vw"
  overlay.style.height = "100vh"
  overlay.style.background = "rgba(0,0,0,0.3)"
  overlay.style.zIndex = "999999"
  overlay.style.cursor = "crosshair"
  overlay.style.userSelect = "none"
  document.body.appendChild(overlay)
}

function removeOverlay() {
  overlay?.remove()
  selection?.remove()
  overlay = null
  selection = null
}

function createSelectionRect(x, y, w, h) {
  if (!selection) {
    selection = document.createElement("div")
    selection.style.position = "fixed"
    selection.style.border = "2px solid #4f8cff"
    selection.style.background = "rgba(255,255,255,0.1)"
    selection.style.zIndex = "1000000"
    document.body.appendChild(selection)
  }
  selection.style.left = x + "px"
  selection.style.top = y + "px"
  selection.style.width = w + "px"
  selection.style.height = h + "px"
}

function addSubmitButton() {
  // Remove old button if exists
  const oldBtn = selection.querySelector("button")
  if (oldBtn) oldBtn.remove()
  const btn = document.createElement("button")
  btn.innerText = "Submit"
  btn.style.position = "absolute"
  btn.style.right = "4px"
  btn.style.bottom = "4px"
  btn.style.zIndex = "1000001"
  btn.style.background = "#4f8cff"
  btn.style.color = "#fff"
  btn.style.border = "none"
  btn.style.borderRadius = "4px"
  btn.style.padding = "4px 10px"
  btn.style.cursor = "pointer"
  btn.onclick = async (e) => {
    e.stopPropagation()
    // Get selection rect
    const rect = selection.getBoundingClientRect()
    const devicePixelRatio = window.devicePixelRatio
    chrome.runtime.sendMessage({
      type: "captureRegion",
      rect: {
        x: rect.left,
        y: rect.top,
        width: rect.width,
        height: rect.height
      },
      devicePixelRatio
    })
    removeOverlay()
  }
  selection.appendChild(btn)
}

function startScreenshotMode() {
  createOverlay()
  overlay.onmousedown = (e) => {
    isSelecting = true
    startX = e.clientX
    startY = e.clientY
    if (selection) selection.remove()
    selection = null
  }
  overlay.onmousemove = (e) => {
    if (!isSelecting) return
    endX = e.clientX
    endY = e.clientY
    const x = Math.min(startX, endX)
    const y = Math.min(startY, endY)
    const w = Math.abs(endX - startX)
    const h = Math.abs(endY - startY)
    createSelectionRect(x, y, w, h)
  }
  overlay.onmouseup = (e) => {
    isSelecting = false
    addSubmitButton()
  }
  overlay.oncontextmenu = (e) => {
    e.preventDefault()
    removeOverlay()
  }
}

// Listen for background messages
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  console.log("content msg", msg);
  if (msg.type === "startScreenshot") {
    startScreenshotMode()
  }
  if (msg.type === "fullScreenshot") {
    const { dataUrl, rect, devicePixelRatio } = msg
    const img = new window.Image()
    img.onload = () => {
      const canvas = document.createElement("canvas")
      canvas.width = rect.width * devicePixelRatio
      canvas.height = rect.height * devicePixelRatio
      const ctx = canvas.getContext("2d")
      ctx.drawImage(
        img,
        rect.x * devicePixelRatio,
        rect.y * devicePixelRatio,
        rect.width * devicePixelRatio,
        rect.height * devicePixelRatio,
        0,
        0,
        rect.width * devicePixelRatio,
        rect.height * devicePixelRatio
      )
      const cropped = canvas.toDataURL("image/png")
      chrome.runtime.sendMessage({
        type: "zimflow-cropped-image",
        dataUrl: cropped
      })
    }
    img.src = dataUrl
  }
  if (msg?.type === "captureRegion") {
    const { rect, devicePixelRatio } = msg
    const tabId = sender.tab?.id
    chrome.tabs.captureVisibleTab(null, { format: "png" }, (dataUrl) => {
      chrome.tabs.sendMessage(tabId, {
        type: "fullScreenshot",
        dataUrl,
        rect,
        devicePixelRatio
      })
    })
    sendResponse({ ok: true })
    return true
  }
})
