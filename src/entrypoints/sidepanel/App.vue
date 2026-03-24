<template>
  <div class="side-panel-container">
    <div class="chat-messages">
      <DynamicScroller
        v-if="messages.length > 0"
        :items="messages"
        :min-item-size="50"
        key-field="id"
        class="scroller"
      >
        <template #default="{ item, index, active }">
          <DynamicScrollerItem
            :item="item"
            :active="active"
            :size-dependencies="[item.content]"
            :data-index="index"
          >
            <div class="message-item" :class="item.role">
              <div class="message-bubble">
                <template v-if="item.role === 'user'">
                  <div class="message-content">{{ item.content }}</div>
                </template>
                <template v-else>
                  <div v-if="item.content === ''" class="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                  <template v-else>
                    <img class="rabbit-img" src="/public/icon/32.png"/>
                    <div class="message-content assistant-content">
                      <MdPreview :editorId="`preview-${item.id}`" :modelValue="item.content" />
                    </div>
                  </template>
                </template>
              </div>
            </div>
          </DynamicScrollerItem>
        </template>
      </DynamicScroller>
      <div v-else class="empty-state">
        <el-empty :image="rabbitRead" description="好久不见，有什么想说的？" :image-size="150" />
      </div>
    </div>

    <form class="chat-input-area" @submit.prevent="handleSubmit">
      <el-input
        v-model="input"
        type="textarea"
        :rows="3"
        placeholder="输入内容发送给波波兔..."
        @keydown.enter.prevent="handleEnter"
      />
      <div class="chat-actions">
        <el-button 
          v-if="isLoading" 
          type="warning" 
          @click="stop"
        >
          暂停
        </el-button>
        <el-button 
          v-else 
          type="primary" 
          :disabled="!input.trim()" 
          native-type="submit"
        >
          发送
        </el-button>
      </div>
    </form>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { DynamicScroller, DynamicScrollerItem } from 'vue-virtual-scroller';
import 'vue-virtual-scroller/dist/vue-virtual-scroller.css';
import rabbitRead from '../../assets/rabbit_read.png';
import { MdPreview } from 'md-editor-v3';
import 'md-editor-v3/lib/preview.css';

// Implement custom useChat to avoid `@ai-sdk/vue` missing exports on Vercel AI SDK v3/v4 bindings
function useChat({ api }: { api: string }) {
  const messages = ref<{ id: string; role: string; content: string }[]>([]);
  const input = ref('');
  const isLoading = ref(false);
  let abortController: AbortController | null = null;

  const handleSubmit = async (e?: Event) => {
    e?.preventDefault();
    if (!input.value.trim() || isLoading.value) return;

    const userMsg = { id: Date.now().toString(), role: 'user', content: input.value };
    messages.value.push(userMsg);
    
    const requestMessages = [...messages.value];
    input.value = '';
    isLoading.value = true;

    const aiMsgId = (Date.now() + 1).toString();
    messages.value.push({ id: aiMsgId, role: 'assistant', content: '' });

    abortController = new AbortController();

    try {
      const res = await fetch(api, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: requestMessages }),
        signal: abortController.signal
      });

      if (!res.ok) throw new Error(await res.text());
      if (!res.body) throw new Error('No response body');
      
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        
        for (const line of lines) {
          if (!line.trim()) continue;
          
          if (line.startsWith('0:')) {
            try {
              const text = JSON.parse(line.slice(2));
              messages.value[messages.value.length - 1].content += text;
            } catch (err) {}
          } else if (!line.match(/^[a-z0-9A-Z]+:/)) {
             // Fallback for raw text response without strict protocol protocols
             messages.value[messages.value.length - 1].content += line + '\n';
          }
        }
      }
      
      if (buffer.startsWith('0:')) {
        try {
          messages.value[messages.value.length - 1].content += JSON.parse(buffer.slice(2));
        } catch (e) {}
      } else if (buffer && !buffer.match(/^[a-z0-9A-Z]+:/)) {
        messages.value[messages.value.length - 1].content += buffer;
      }

    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error(err);
      }
    } finally {
      isLoading.value = false;
    }
  };

  const stop = () => {
    abortController?.abort();
    isLoading.value = false;
  };

  return { messages, input, handleSubmit, isLoading, stop };
}

const { messages, input, handleSubmit, isLoading, stop } = useChat({
  api: 'http://localhost:3008/api/chat',
});

watch(isLoading, (newVal) => {
  if (!newVal) {
    nextTick(() => {
      replaceATag();
    });
  }
});

const handleEnter = (e: KeyboardEvent) => {
  if (e.shiftKey) {
    // allow multiline on Shift+Enter
    return;
  }
  
  if (input.value.trim()) {
    handleSubmit(e);
  }
};

/**
 * 检查pendingPrompt
 */
const checkPendingPrompt = async () => {
  const data = await browser.storage.local.get('pendingPrompt');
  if (data.pendingPrompt && typeof data.pendingPrompt === 'string') {
    input.value = data.pendingPrompt;
    await browser.storage.local.remove('pendingPrompt');
    handleSubmit();
  }
};

/**
 * 监听storage变化
 * @param changes 
 * @param area 
 */
const handleStorageChange = (changes: any, area: string) => {
  if (area === 'local' && changes.pendingPrompt?.newValue) {
    const newValue = changes.pendingPrompt.newValue;
    if (typeof newValue === 'string') {
      input.value = newValue;
      browser.storage.local.remove('pendingPrompt');
      handleSubmit();
    }
  }
};

/**
 * 替换消息a标签
 */
const replaceATag = () => {
  const links = document.querySelectorAll('.assistant-content a');
  links.forEach(link => {
    if (!link.hasAttribute('data-bound')) {
      link.setAttribute('data-bound', 'true');
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const href = link.getAttribute('href');
        if (href) {
          browser.tabs.create({ url: href });
        }
      });
    }
  });
};

onMounted(() => {
  checkPendingPrompt();
  browser.storage.onChanged.addListener(handleStorageChange);
});

onUnmounted(() => {
  browser.storage.onChanged.removeListener(handleStorageChange);
});
</script>

<style lang="scss" scoped>
.side-panel-container {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 20px);
  background-color: white;
  box-sizing: border-box;
  font-family: var(--el-font-family, sans-serif);
}

.chat-messages {
  flex: 1;
  overflow: hidden;
  position: relative;
  
  .scroller {
    height: 100%;

    /* Element UI 风格滚动条 */
    &::-webkit-scrollbar {
      width: 6px;
      height: 6px;
    }

    &::-webkit-scrollbar-thumb {
      border-radius: 5px;
      background: var(--el-scrollbar-bg-color, rgba(144, 147, 153, 0.3));

      &:hover {
        background: var(--el-scrollbar-hover-bg-color, rgba(144, 147, 153, 0.5));
      }
    }

    &::-webkit-scrollbar-track {
      background: transparent;
      border-radius: 5px;
    }
  }
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.message-item {
  padding: 8px 16px;
  display: flex;
  flex-direction: column;

  &.user {
    align-items: flex-end;
    .message-bubble {
      background-color: #EB8E46;
      color: white;
      border-radius: 12px 12px 0 12px;
    }
    .message-role {
      color: rgba(255, 255, 255, 0.9);
      text-align: right;
    }
  }

  &.assistant {
    align-items: flex-start;
    .message-bubble {
      background-color: white;
      color: #303133;
      border: 1px solid #e4e7ed;
      border-radius: 12px 12px 12px 0;
    }
    .rabbit-img{
      width: 32px;
      margin-bottom: 10px;
    }
  }
}

.message-bubble {
  max-width: 85%;
  padding: 12px 16px;
  word-break: break-word;
  box-shadow: 0 2px 6px rgba(0,0,0,0.04);
  display: flex;
  flex-direction: column;
  font-size: 16px;

  .message-content {
    line-height: 1.6;
    white-space: pre-wrap;

    &.assistant-content {
      white-space: normal;
    }

    :deep(.md-editor-preview-wrapper) {
      padding: 0;
    }

    :deep(.md-editor) {
      background-color: transparent;
    }
  }
}

:deep(.chat-input-area) {
  padding: 16px;
  background-color: white;
  border-top: 1px solid #e4e7ed;
  display: flex;
  flex-direction: column;
  gap: 12px;
  box-shadow: 0 -2px 6px rgba(0,0,0,0.02);

  .chat-actions {
    display: flex;
    justify-content: flex-end;
  }

  .el-textarea__inner{
    font-size: 16px;
  }
}

.typing-indicator {
  display: flex;
  align-items: center;
  gap: 4px;
  height: 22px;

  span {
    display: inline-block;
    width: 6px;
    height: 6px;
    background-color: #909399;
    border-radius: 50%;
    animation: typing 1.4s infinite ease-in-out both;

    &:nth-child(1) {
      animation-delay: -0.32s;
    }
    &:nth-child(2) {
      animation-delay: -0.16s;
    }
  }
}

@keyframes typing {
  0%, 80%, 100% {
    transform: scale(0.4);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}
</style>
