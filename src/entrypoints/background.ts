export default defineBackground(() => {
  console.log('Hello background!', { id: browser.runtime.id });

  browser.runtime.onMessage.addListener((message, sender) => {
    if (message.action === 'open_side_panel') {
      if (sender.tab && sender.tab.windowId) {
        // @ts-ignore
        chrome.sidePanel.open({ windowId: sender.tab.windowId });
      }
    }
  });
});
