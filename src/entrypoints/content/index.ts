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
