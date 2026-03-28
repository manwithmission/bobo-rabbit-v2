/**
 * Background Service Worker
 *
 * 职责：
 * 1. 久坐健康提醒 —— 每隔固定时间向所有标签页广播提醒消息
 * 2. 消息路由 —— 处理 content script / sidepanel 发来的各类请求
 */
export default defineBackground(() => {
  console.log('Hello background!', { id: browser.runtime.id });

  /** 久坐提醒定时器名称（备用，暂未使用 chrome.alarms） */
  const HEALTH_ALARM_NAME = 'health-reminder';

  /** 久坐提醒间隔（秒），当前设置为 30 分钟 */
  const HEALTH_INTERVAL_SEC = 30 * 60; // 30 分钟

  /**
   * 启动久坐提醒定时器
   * 使用 setInterval 每隔 HEALTH_INTERVAL_SEC 秒向所有标签页
   * 发送 `health_reminder` 消息，content script 收到后展示提醒对话框。
   */
  const startHealthTimer = () => {
    setInterval(async () => {
      const tabs = await browser.tabs.query({});
      for (const tab of tabs) {
        if (tab.id) {
          browser.tabs.sendMessage(tab.id, { action: 'health_reminder' }).catch(() => {
            // 部分标签页（如 chrome:// 页面）未注入 content script，忽略发送失败
          });
        }
      }
    }, HEALTH_INTERVAL_SEC * 1000);
  };

  // 扩展启动时立即开始计时
  startHealthTimer();

  /**
   * 统一消息监听器
   * 处理来自 content script 和 sidepanel 的消息：
   * - open_side_panel：打开侧边面板
   * - fetch_css：获取扩展内部 CSS 文件内容（绕过页面 CSP 限制）
   * - restart_health_timer：用户确认提醒后，广播关闭所有标签页的提醒对话框
   */
  browser.runtime.onMessage.addListener((message, sender, sendResponse) => {

    // ---- 打开侧边面板 ----
    if (message.action === 'open_side_panel') {
      if (sender.tab && sender.tab.windowId) {
        // @ts-ignore — chrome.sidePanel 类型定义尚未被 WXT 完整覆盖
        chrome.sidePanel.open({ windowId: sender.tab.windowId });
      }
    }

    // ---- 获取扩展内部 CSS 文本 ----
    // content script 通过此消息获取打包后的 CSS 文件内容，
    // 再注入到 Shadow DOM 中，以避免被宿主页面的 CSP 策略拦截。
    // 返回 true 表示 sendResponse 将异步调用。
    if (message.action === 'fetch_css') {
      fetch(browser.runtime.getURL(message.url))
        .then(res => res.text())
        .then(text => sendResponse(text))
        .catch(err => sendResponse(''));
      return true;
    }

    // ---- 关闭所有标签页的健康提醒对话框 ----
    // 当任意标签页的用户点击"好的"确认按钮后，
    // 广播 `close_health_dialog` 消息让所有标签页同步关闭提醒对话框。
    if (message.action === 'restart_health_timer') {
      browser.tabs.query({}).then((tabs) => {
        for (const tab of tabs) {
          if (tab.id) {
            browser.tabs.sendMessage(tab.id, { action: 'close_health_dialog' }).catch(() => {
              // 部分标签页未注入 content script，忽略发送失败
            });
          }
        }
      });
    }
  });
});
