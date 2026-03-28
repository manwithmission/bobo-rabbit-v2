<template>
  <Transition name="msg-fade">
    <div
      v-if="visible"
      class="bobo-message-box"
      :style="boxStyle"
      @click.stop
      @contextmenu.stop.prevent
      @pointerdown.stop
      @mousedown.stop
    >
      <div class="msg-body">
        <div class="msg-content">
          <span class="msg-text">{{ message }}</span>
        </div>
        <!-- 确认按钮区域 -->
        <div v-if="showConfirmBtn" class="msg-actions">
          <button class="msg-confirm-btn" @click.stop="onConfirm">好的</button>
        </div>
      </div>
      <el-icon class="msg-close" @click.stop="close"><i-ep-Close /></el-icon>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

export interface MessageBoxProps {
  /** 按钮元素的位置信息，用于定位消息框 */
  buttonPosition: { x: number; y: number };
  /** 按钮宽度，默认 80px */
  buttonWidth?: number;
}

const props = withDefaults(defineProps<MessageBoxProps>(), {
  buttonWidth: 80,
})

const emit = defineEmits<{
  /** 用户点击"好的"确认按钮时触发 */
  (e: 'confirm'): void
}>()

const visible = ref(false)
const message = ref('')
const type = ref<'info' | 'success' | 'warning' | 'error'>('info')
const showConfirmBtn = ref(false)
let autoCloseTimer: ReturnType<typeof setTimeout> | null = null

const icon = computed(() => {
  const map: Record<string, string> = {
    info: 'i-ep-InfoFilled',
    success: 'i-ep-SuccessFilled',
    warning: 'i-ep-WarningFilled',
    error: 'i-ep-CircleCloseFilled',
  }
  return map[type.value]
})

const iconColor = computed(() => {
  const map: Record<string, string> = {
    info: '#909399',
    success: '#67c23a',
    warning: '#e6a23c',
    error: '#f56c6c',
  }
  return map[type.value]
})

const MSG_BOX_WIDTH = 260 // 与 CSS max-width 保持一致
const EDGE_MARGIN = 10 // 距离视口边缘最小间距

const ARROW_SIZE = 6 // 三角箭头大小（px）

const boxStyle = computed(() => {
  const btnX = props.buttonPosition.x
  const btnY = props.buttonPosition.y
  const btnW = props.buttonWidth
  const vw = window.innerWidth

  // 如果按钮还在默认位置（-1），使用 right/bottom 定位
  if (btnX === -1) {
    return {
      position: 'fixed' as const,
      right: '30px',
      bottom: `${80 + 80 + 20 + ARROW_SIZE}px`,
      '--arrow-left': `${btnW / 2}px`,
      '--arrow-align': 'right',
    }
  }

  const btnCenterX = btnX + btnW / 2
  const btnRightX = btnX + btnW

  // 检查居中定位是否会导致右侧溢出
  const halfBox = MSG_BOX_WIDTH / 2
  const wouldOverflowRight = btnCenterX + halfBox > vw - EDGE_MARGIN
  const wouldOverflowLeft = btnCenterX - halfBox < EDGE_MARGIN

  const style: Record<string, string> = {
    position: 'fixed',
    top: `${btnY - 10 - ARROW_SIZE}px`, // 额外上移 10px + 箭头高度
  }

  if (wouldOverflowRight) {
    // 按钮靠右时，消息框右边缘对齐按钮右边缘
    style.right = `${vw - btnRightX}px`
    style.transform = 'translateY(-100%)'
    // 箭头位置：从右边缘算起，对齐按钮中心 = btnW / 2
    style['--arrow-right'] = `${btnW / 2 - ARROW_SIZE}px`
    style['--arrow-align'] = 'right'
  } else if (wouldOverflowLeft) {
    // 按钮靠左时，消息框左边缘对齐按钮左边缘
    style.left = `${btnX}px`
    style.transform = 'translateY(-100%)'
    style['--arrow-left'] = `${btnW / 2 - ARROW_SIZE}px`
    style['--arrow-align'] = 'left'
  } else {
    // 默认居中，箭头居中
    style.left = `${btnCenterX}px`
    style.transform = 'translate(-50%, -100%)'
    style['--arrow-align'] = 'center'
  }

  return style
})

/**
 * 显示普通消息（自动关闭）
 */
const show = (
  msg: string,
  msgType: 'info' | 'success' | 'warning' | 'error' = 'info',
  duration: number = 3000,
) => {
  clearTimer()
  message.value = msg
  type.value = msgType
  showConfirmBtn.value = false
  visible.value = true

  if (duration > 0) {
    autoCloseTimer = setTimeout(() => {
      close()
    }, duration)
  }
}

/**
 * 显示带确认按钮的消息（不会自动关闭，需用户点击"好的"）
 */
const showWithConfirm = (
  msg: string,
  msgType: 'info' | 'success' | 'warning' | 'error' = 'info',
) => {
  clearTimer()
  message.value = msg
  type.value = msgType
  showConfirmBtn.value = true
  visible.value = true
}

const onConfirm = () => {
  visible.value = false
  showConfirmBtn.value = false
  emit('confirm')
}

const close = () => {
  visible.value = false
  showConfirmBtn.value = false
  clearTimer()
}

const clearTimer = () => {
  if (autoCloseTimer) {
    clearTimeout(autoCloseTimer)
    autoCloseTimer = null
  }
}

defineExpose({ show, showWithConfirm, close })
</script>

<style lang="scss" scoped>
.bobo-message-box {
  z-index: 2147483647;
  max-width: 260px;
  min-width: 120px;
  padding: 10px 12px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12), 0 2px 4px rgba(0, 0, 0, 0.04);
  display: flex;
  align-items: flex-start;
  gap: 6px;
  pointer-events: auto;
  font-size: 13px;
  line-height: 1.4;
  color: #303133;

  /* 底部小三角箭头 */
  &::after {
    content: '';
    position: absolute;
    bottom: -6px;
    width: 0;
    height: 0;
    border-left: 6px solid transparent;
    border-right: 6px solid transparent;
    border-top: 6px solid #fff;
    filter: drop-shadow(0 2px 2px rgba(0, 0, 0, 0.06));
  }

  /* 箭头水平位置 - 靠右对齐 */
  &[style*='--arrow-align: right']::after {
    right: var(--arrow-right, 20px);
    left: auto;
  }

  /* 箭头水平位置 - 靠左对齐 */
  &[style*='--arrow-align: left']::after {
    left: var(--arrow-left, 20px);
    right: auto;
  }

  /* 箭头水平位置 - 居中 */
  &[style*='--arrow-align: center']::after {
    left: 50%;
    transform: translateX(-50%);
  }

  .msg-body {
    flex: 1;
    min-width: 0;

    .msg-content {
      display: flex;
      align-items: flex-start;
      gap: 6px;

      .msg-icon {
        font-size: 16px;
        flex-shrink: 0;
        margin-top: 2px;
      }

      .msg-text {
        word-break: break-word;
      }
    }

    .msg-actions {
      display: flex;
      justify-content: flex-end;
      margin-top: 8px;

      .msg-confirm-btn {
        padding: 4px 16px;
        font-size: 12px;
        color: #fff;
        background: linear-gradient(135deg, #7c5ce0, #6a4fd4);
        border: none;
        border-radius: 4px;
        cursor: pointer;
        transition: all 0.2s;

        &:hover {
          background: linear-gradient(135deg, #6a4fd4, #5a3fc4);
          box-shadow: 0 2px 8px rgba(106, 79, 212, 0.4);
        }

        &:active {
          transform: scale(0.96);
        }
      }
    }
  }

  .msg-close {
    font-size: 14px;
    color: #909399;
    cursor: pointer;
    flex-shrink: 0;
    transition: color 0.2s;
    margin-top: 2px;

    &:hover {
      color: #303133;
    }
  }
}

/* 过渡动画 */
.msg-fade-enter-active {
  transition: opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1), margin-top 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.msg-fade-leave-active {
  transition: opacity 0.2s ease-in, margin-top 0.2s ease-in;
}
.msg-fade-enter-from {
  opacity: 0;
  margin-top: 10px;
}
.msg-fade-leave-to {
  opacity: 0;
  margin-top: -5px;
}
</style>
