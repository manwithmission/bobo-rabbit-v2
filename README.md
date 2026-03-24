# Bobo Rabbit V2 🐰

Bobo Rabbit V2 (波波兔) 是一款基于浏览器侧边栏（SidePanel）和内容脚本（Content Script）构建的现代化体验的 AI 智能助理浏览器插件。它可以悬浮在用户浏览的任意网页上，通过侧边栏提供功能丰富的 AI 对话交互体验，同时支持将任务一键下发给后台 AI Agent。

## 🛠️ 技术栈 (Tech Stack)

该项目使用了最前沿的前端及浏览器扩展开发框架和工具：

- **[WXT](https://wxt.dev/)**: 下一代浏览器扩展开发框架，提供极速的开发体验和开箱即用的 HMR（热更新）。
- **[Vue 3](https://vuejs.org/)**: 采用 Composition API 和 `<script setup>` 语法，享受极致的响应式开发体验。
- **[Vercel AI SDK](https://sdk.vercel.ai/)**: 用于对接 AI 接口（如本地模型或远端大模型），提供了极佳的流式数据 (Streaming) 与对话状态控制支持。

## ✨ 核心特性

- **全局悬浮助手**: 注入任意网页的悬浮级吉祥物“波波兔”，支持任意拖拽及边缘防溢出控制。
- **一键侧边栏召唤**: 提供独立唤起 AI 侧边栏（Side Panel）的功能，不占用额外的窗口操作。
- **智能对话模式**: 支持暂停流式返回、大篇幅虚拟滚动、打字机动画预渲染等交互细节。
- **动态联动**: 支持在悬浮菜单中一键点击“GitHub 热门仓库”，通过 `storage.local` 无缝联动并将 prompt 压入侧边栏完成自动化回复。

---

## 🚀 启动与运行 (Usage Steps)

### 1. 环境准备
确保你的本地环境已安装以下工具：
- [Node.js](https://nodejs.org/) (推荐版本 v18+)
- [pnpm](https://pnpm.io/) (推荐的包管理工具)

### 2. 安装依赖
克隆或下载本仓库后，在项目根目录运行以下命令安装所需的依赖包：
```bash
pnpm install
```

### 3. 开发预览
通过 WXT 即可自动开启一个带有已加载此扩展的测试浏览器（默认支持 Chromium 核心引擎）。代码每次保存都会热替换（HMR）：
```bash
# 对于 Chrome / Edge 等浏览器
pnpm dev

# 如果你想在 Firefox 测试
pnpm dev:firefox
```
_注意: 侧边栏中 AI Agent 聊天默认调用 `http://localhost:3008/api/chat` 服务接口，实际体验该功能时需要确保你的 AI Backend 服务处于启动状态。_

### 4. 构建与打包
开发完成且准备发布扩展商店，或提交给生产环境部署时，可运行以下打包指令：
```bash
# 构建生产环境产物 (输出直接至 .output 目录)
pnpm build

# 将扩展直接打包为可供上传商店或局域网分享的 zip 文件
pnpm zip
```

## 📂 项目结构概览

- `src/entrypoints/background.ts`: 扩展后台任务。负责跨组件通信，例如通过 runtime 发送事件唤起侧边栏。
- `src/entrypoints/content/`: 内容脚本（Content scripts）。负责全站 DOM 节点注入功能，例如绘制悬浮气泡“波波兔”与其弹出菜单。
- `src/entrypoints/sidepanel/`: 侧边栏的界面与核心业务逻辑。承载着 AI 对话主界面的消息渲染（md-editor-v3）、虚拟防卡顿长列表及 AI Prompt 通信等。
- `wxt.config.ts`: WXT 及底层的 Vite 环境配置。包括 AutoImport 图标框架、Element Plus 库以及 manifest `permissions` (`sidePanel`, `storage`) 的注册。
