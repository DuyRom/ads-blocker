console.log("[YouTubeAdBlock] Background service worker loaded");

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Message from content script:", message);
  sendResponse({ status: "received" });
});