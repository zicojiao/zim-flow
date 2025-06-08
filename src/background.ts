// ZimFlow AI Assistant - Plasmo Background Script
// Main background script for extension lifecycle management

// Create context menu when extension is installed/enabled
chrome.runtime.onInstalled.addListener(() => {
  // chrome.contextMenus.create({
  //   id: "zimflow-askai",
  //   title: "Ask AI",
  //   contexts: ["selection"],
  //   documentUrlPatterns: ["http://*/*", "https://*/*"]
  // });
  chrome.contextMenus.create({
    id: "zimflow-gemmaai",
    title: "Ask Gemma AI",
    contexts: ["selection"],
    documentUrlPatterns: ["http://*/*", "https://*/*"]
  });
  chrome.contextMenus.create({
    id: "zimflow-quiz",
    title: "Generate Quiz",
    contexts: ["selection"],
    documentUrlPatterns: ["http://*/*", "https://*/*"]
  });
  chrome.contextMenus.create({
    id: "zimflow-summarize",
    title: "Generate Summary",
    contexts: ["selection"],
    documentUrlPatterns: ["http://*/*", "https://*/*"]
  });
  chrome.contextMenus.create({
    id: "zimflow-translate",
    title: "Translate Selection",
    contexts: ["selection"],
    documentUrlPatterns: ["http://*/*", "https://*/*"]
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "zimflow-summarize" && info.selectionText && tab?.windowId) {
    try {
      // Open the sidepanel
      await chrome.sidePanel.open({ windowId: tab.windowId });

      // Store the selected text in storage for the sidepanel to access
      await chrome.storage.local.set({
        selectedText: info.selectionText,
        timestamp: Date.now()
      });

      console.log('✅ Context menu triggered, text stored and sidepanel opened');
    } catch (error) {
      console.error('❌ Error handling context menu click:', error);
    }
  }
  if (info.menuItemId === "zimflow-translate" && info.selectionText && tab?.windowId) {
    try {
      await chrome.sidePanel.open({ windowId: tab.windowId });
      await chrome.storage.local.set({
        translateText: info.selectionText,
        translateTimestamp: Date.now()
      });
      console.log('✅ Translate menu triggered, text stored and sidepanel opened');
    } catch (error) {
      console.error('❌ Error handling translate menu click:', error);
    }
  }
  if (info.menuItemId === "zimflow-askai" && info.selectionText && tab?.windowId) {
    try {
      await chrome.sidePanel.open({ windowId: tab.windowId });
      await chrome.storage.local.set({
        askaiText: info.selectionText,
        askaiTimestamp: Date.now()
      });
      console.log('✅ Ask AI menu triggered, text stored and sidepanel opened');
    } catch (error) {
      console.error('❌ Error handling Ask AI menu click:', error);
    }
  }
  if (info.menuItemId === "zimflow-gemmaai" && info.selectionText && tab?.windowId) {
    try {
      await chrome.sidePanel.open({ windowId: tab.windowId });
      await chrome.storage.local.set({
        gemmaText: info.selectionText,
        gemmaTimestamp: Date.now()
      });
      console.log('✅ Gemma AI menu triggered, text stored and sidepanel opened');
    } catch (error) {
      console.error('❌ Error handling Gemma AI menu click:', error);
    }
  }
  if (info.menuItemId === "zimflow-quiz" && info.selectionText && tab?.windowId) {
    try {
      await chrome.sidePanel.open({ windowId: tab.windowId });
      await chrome.storage.local.set({
        quizText: info.selectionText,
        quizTimestamp: Date.now()
      });
      console.log('✅ Quiz menu triggered, text stored and sidepanel opened');
    } catch (error) {
      console.error('❌ Error handling quiz menu click:', error);
    }
  }
});

// Listen for extension icon click to actively open sidepanel (Chrome 121+)
if (chrome.sidePanel && chrome.action && chrome.action.onClicked) {
  chrome.action.onClicked.addListener(async (tab) => {
    try {
      await chrome.sidePanel.open({ windowId: tab.windowId });
    } catch (e) {
      // Some older Chrome versions might not support sidePanel.open
      console.warn('sidePanel.open not supported in this Chrome version');
    }
  });
}

// Auto cleanup on extension suspend to prevent memory leaks
chrome.runtime.onSuspend.addListener(() => {
  console.log('Extension suspending, cleaning up...');
});

chrome.runtime.onMessage.addListener(async (msg, sender, sendResponse) => {
  if (msg?.type === "initiateScreenshot") {
    const handleInitiateScreenshot = async () => {
      const tabs = await chrome.tabs.query({ active: true })
      console.log("tabs", tabs)
      if (tabs.length > 0 && tabs[0].id) {
        chrome.tabs.sendMessage(tabs[0].id, { type: "startScreenshot" })
      }
    }
    await handleInitiateScreenshot()
    sendResponse({ ok: true })
    return true
  }
  if (msg?.type === "captureRegion") {
    const { rect, devicePixelRatio } = msg
    const tabId = sender.tab?.id
    if (typeof tabId === "number") {
      chrome.tabs.captureVisibleTab(null, { format: "png" }, (dataUrl) => {
        chrome.tabs.sendMessage(tabId, {
          type: "fullScreenshot",
          dataUrl,
          rect,
          devicePixelRatio
        })
      })
    } else {
      console.error("No valid tabId for captureRegion!", sender)
    }
    sendResponse({ ok: true })
    return true
  }
  if (msg?.type === "zimflow-cropped-image" && msg.dataUrl) {
    chrome.runtime.sendMessage({
      type: "zimflow-cropped-image",
      dataUrl: msg.dataUrl
    })
  }
});