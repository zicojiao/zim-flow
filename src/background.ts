// ZimFlow AI Assistant - Plasmo Background Script
// Main background script for extension lifecycle management

// Create context menu when extension is installed/enabled
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "zimflow-summarize",
    title: "Generate Summary",
    contexts: ["selection"],
    documentUrlPatterns: ["http://*/*", "https://*/*"]
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "zimflow-summarize" && info.selectionText && tab?.windowId) {
    try {
      // Store the selected text in storage for the sidepanel to access
      await chrome.storage.local.set({
        selectedText: info.selectionText,
        timestamp: Date.now()
      });

      // Open the sidepanel
      await chrome.sidePanel.open({ windowId: tab.windowId });

      console.log('✅ Context menu triggered, text stored and sidepanel opened');
    } catch (error) {
      console.error('❌ Error handling context menu click:', error);
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