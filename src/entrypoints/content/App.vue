<template>
  <div class="bobo-app-container" ref="appContainer">
    <!-- 消息框：放在 el-popover 外部，避免触发 popover 事件 -->
    <MessageBox
      ref="messageBoxRef"
      :buttonPosition="position"
      :buttonWidth="80"
      @confirm="onMessageConfirm"
    />

    <el-popover ref="popoverRef" popper-class="bobo-popover" placement="left" :width="200" trigger="contextmenu" :teleported="false">
      <template #reference>
        <div
          ref="buttonRef"
          class="bobo-floating-btn" 
          :class="{ 'is-dragging': isDragging }"
          :style="{
            left: position.x !== -1 ? `${position.x}px` : 'auto',
            top: position.y !== -1 ? `${position.y}px` : 'auto',
            right: position.x !== -1 ? 'auto' : '30px',
            bottom: position.y !== -1 ? 'auto' : '80px',
          }"
          @pointerdown="onPointerDown"
          @mouseenter="isHovering = true"
          @mouseleave="isHovering = false"
        >
          <img v-if="isDragging" class="rabbit-img" src="../../assets/rabbit_drag.png"/>
          <img v-else-if="isHovering" class="rabbit-img" src="../../assets/rabbit_hover.png"/>
          <img v-else class="rabbit-img" src="../../assets/rabbit_stand.png"/>
        </div>
      </template>
      <div class="popover-body">
        <LinkListPopover :appContainer="appContainer">
          <template #reference>
            <div class="link-list-button">
              <el-icon class="button-icon"><i-ep-link /></el-icon>
              <div class="title">兔子书签</div>
            </div>
          </template>
        </LinkListPopover>
        <div>
          <div class="tool-button" @click="viewGithubHot">
            <span class="iconfont icon-GitHub button-icon"></span>
            <div class="title">GitHub热门仓库</div>
          </div>
        </div>
        <div>
          <div class="tool-button" @click="chat">
            <el-icon class="button-icon"><i-ep-ChatDotSquare /></el-icon>
            <div class="title">聊一聊</div>
          </div>
        </div>
      </div>
    </el-popover>
  </div>
</template>

<script setup lang="ts">
import "@/components/LinkListPopover.vue"
import "@/assets/iconfont/iconfont.css"
import MessageBox from "@/components/MessageBox.vue"

const buttonRef = ref<any>(null);
const popoverRef = ref<any>(null);
const messageBoxRef = ref<InstanceType<typeof MessageBox> | null>(null);
const position = ref({ x: -1, y: -1 });
const isDragging = ref(false);
const isHovering = ref(false);

//窗口大小变化处理回调
const handleResize = () => {
  if (position.value.x === -1) return;
  
  const el = buttonRef.value?.$el || buttonRef.value;
  if (!el) return;

  const maxX = Math.max(0, window.innerWidth - el.offsetWidth);
  const maxY = Math.max(0, window.innerHeight - el.offsetHeight);
  
  let newX = position.value.x;
  let newY = position.value.y;
  
  if (newX > maxX) newX = maxX;
  if (newY > maxY) newY = maxY;
  if (newX < 0) newX = 0;
  if (newY < 0) newY = 0;
  
  position.value = { x: newX, y: newY };
};

const onPointerDown = (e: PointerEvent) => {
  console.log('onPointerDown', e)
  if (e.button !== 0) return; // Only respond to left click
  e.preventDefault();
  
  const el = buttonRef.value?.$el || buttonRef.value;
  if (!el) return;
  
  const rect = el.getBoundingClientRect();
  
  if (position.value.x === -1) {
    position.value = { x: rect.left, y: rect.top };
  }
  
  const offsetX = e.clientX - rect.left;
  const offsetY = e.clientY - rect.top;
  
  isDragging.value = true;
  popoverRef.value?.hide?.();
  
  const onPointerMove = (moveEvent: PointerEvent) => {
    let newX = moveEvent.clientX - offsetX;
    let newY = moveEvent.clientY - offsetY;
    
    // Boundary checks with viewport size considerations
    const maxX = Math.max(0, window.innerWidth - el.offsetWidth);
    const maxY = Math.max(0, window.innerHeight - el.offsetHeight);
    
    if (newX < 0) newX = 0;
    if (newX > maxX) newX = maxX;
    if (newY < 0) newY = 0;
    if (newY > maxY) newY = maxY;
    
    position.value = { x: newX, y: newY };
  };
  
  const onPointerUp = () => {
    isDragging.value = false;
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', onPointerUp);
    window.removeEventListener('pointercancel', onPointerUp);
  };
  
  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', onPointerUp);
  window.addEventListener('pointercancel', onPointerUp);
};

const appContainer = ref<HTMLElement | null>(null);

/**
 * 聊一聊
 */
const chat = () => {
  browser.runtime.sendMessage({ action: 'open_side_panel' });
  popoverRef.value?.hide?.();
}

/**
 * 查看热门github仓库
 */
const viewGithubHot = async () => {
  await browser.storage.local.set({ pendingPrompt: '介绍一下GitHub今日热门仓库' });
  browser.runtime.sendMessage({ action: 'open_side_panel' });
  popoverRef.value?.hide?.();
}

/**
 * 显示消息通知（不会触发 popover）
 */
const showMessage = (
  msg: string,
  type: 'info' | 'success' | 'warning' | 'error' = 'info',
  duration: number = 3000,
) => {
  messageBoxRef.value?.show(msg, type, duration)
}

// 暴露给外部使用
defineExpose({ showMessage })

/**
 * 用户点击消息框的“好的”按钮后，通知 background 重新启动定时器
 */
const onMessageConfirm = () => {
  browser.runtime.sendMessage({ action: 'restart_health_timer' })
}

/**
 * 监听来自 background 的消息
 */
const onBackgroundMessage = (message: any) => {
  if (message.action === 'health_reminder') {
    messageBoxRef.value?.showWithConfirm(
      '久坐有害健康，起来站站，休息一下，喝口水吧~',
      'warning',
    )
  }
  if (message.action === 'close_health_dialog') {
    messageBoxRef.value?.close()
  }
}

onMounted(() => {
  window.addEventListener('resize', handleResize);
  browser.runtime.onMessage.addListener(onBackgroundMessage);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
  browser.runtime.onMessage.removeListener(onBackgroundMessage);
});


</script>

<style lang="scss" scoped>
.bobo-floating-btn {
  position: fixed;
  right: 30px;
  bottom: 80px;
  z-index: 2147483647; /* Max z-index to ensure it sits on top */
  width: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  cursor: grab;
  /* Prevent text selection issue during drag */
  user-select: none;
  .rabbit-img{
    width: 100%;
  }
}

.bobo-floating-btn:hover {
  transform: scale(1.1);
}

.bobo-floating-btn.is-dragging {
  transition: none !important;
  cursor: grabbing !important;
  transform: scale(1.05); /* maintain scale during drag */
}

.bobo-popover{
  .popover-body{

    @mixin popover-button{
      display: flex;
      align-items: center;
      padding: 5px;
      background-color: rgba(237, 235, 247, 0.3);
      margin-bottom: 5px;
      .button-icon{
        font-size: 16px;
        margin-right: 10px;
      }
      &:hover{
        background-color: rgba(237, 235, 247, 0.8);
      }
    }
    
    .link-list-button{
      @include popover-button;
    }
    .tool-button{
      @include popover-button;
      cursor: pointer;
    }
  }
}
</style>
