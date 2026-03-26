import App from './App.vue';

export default defineContentScript({
  matches: ['<all_urls>'],
  cssInjectionMode: 'ui',
  async main(ctx) {
    const ui = await createShadowRootUi(ctx, {
      name: 'bobo-rabbit-floating',
      position: 'inline',
      anchor: 'body',
      append: 'last',
      onMount: (container: HTMLElement) => {
        // Fetch generated CSS string from the background to bypass page-level CSP
        const shadow = container.getRootNode() as ShadowRoot;
        if (shadow && !shadow.querySelector('style[data-bobo-css]')) {
          browser.runtime.sendMessage({ action: 'fetch_css', url: '/content-scripts/content.css' }).then((css) => {
            if (css && typeof css === 'string') {
              const style = document.createElement('style');
              style.setAttribute('data-bobo-css', 'true');
              style.textContent = css.replaceAll(':root', ':host');
              shadow.insertBefore(style, container);
            }
          });
        }

        const app = createApp(App);
        app.mount(container);
        return app;
      },
      onRemove: (app: any) => {
        if (app) {
          app.unmount();
        }
      },
    });
    ui.mount();
  },
});
