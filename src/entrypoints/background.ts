export default defineBackground(() => {
  console.log('Hello background!', { id: browser.runtime.id });

  browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'open_side_panel') {
      if (sender.tab && sender.tab.windowId) {
        // @ts-ignore
        chrome.sidePanel.open({ windowId: sender.tab.windowId });
      }
    }
    if (message.action === 'fetch_css') {
      fetch(browser.runtime.getURL(message.url))
        .then(res => res.text())
        .then(text => sendResponse(text))
        .catch(err => sendResponse(''));
      return true;
    }
  });
});
