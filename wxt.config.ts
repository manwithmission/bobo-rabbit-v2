import { defineConfig } from 'wxt';
import Icons from 'unplugin-icons/vite'
import IconsResolver from 'unplugin-icons/resolver'
import AutoImport from 'unplugin-auto-import/vite';
import Components from 'unplugin-vue-components/vite';
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers';

// See https://wxt.dev/api/config.html
export default defineConfig({
  srcDir: 'src',
  modules: ['@wxt-dev/module-vue'],
  vite: () => ({
    plugins: [
      AutoImport({
        imports: ['vue'],
        resolvers: [
          ElementPlusResolver(),
          // 自动导入图标组件
          IconsResolver({
            prefix: 'Icon',
          }),
        ],
      }),
      Components({
        resolvers: [
          ElementPlusResolver(),
          // 自动注册图标组件
          IconsResolver({
            enabledCollections: ['ep'],
          }),
        ],
      }),

      Icons({
        autoInstall: true,
      }),
    ],
  }),
  manifest: {
    permissions: ['storage', 'sidePanel'],
  },
});
