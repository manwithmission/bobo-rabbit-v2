<template>
  <el-popover popper-class="link-list-popover" placement="left" :width="200" trigger="hover" :teleported="false">
      <template #reference>
        <slot name="reference"></slot>
      </template>
      <div class="popover-body">
        <RecycleScroller
          class="link-list-scroller"
          :items="linkList"
          :item-size="47"
          key-field="id"
        >
          <template #default="{ item }">
            <div class="link-button" @click="visitLink(item.url)">
              <el-image :src="item.icon" class="link-icon" fit="contain">
                <template #error>
                  <img src="/public/icon/32.png" class="link-icon">
                </template>
              </el-image>
              <div class="title">{{ item.title }}</div>
            </div>
          </template>
        </RecycleScroller>
        <div class="add-link-button" @click="addCurrentPage">
          <el-icon class="button-icon"><i-ep-plus /></el-icon>
          <div class="title">添加当前页面</div>
        </div>
      </div>
    </el-popover>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { RecycleScroller } from 'vue-virtual-scroller'
import 'vue-virtual-scroller/dist/vue-virtual-scroller.css'

const props = defineProps({
    appContainer: {
        type: HTMLElement,
        default: null
    }
})

interface Link {
  id: number;
  title: string;
  url: string;
  icon: string;
}


const linkList = ref<Link[]>([])

let storageWatcher: Function | null = null

/**
 * 刷新链接列表
 */
const refreshLinkList = async () => {
    const tempList = await storage.getItem<Link[]>('sync:linkList');
    if(tempList){
      linkList.value = [...tempList];
    }
}

/**
 * 访问链接
 */
const visitLink = (url: string) => {
  window.open(url, '_blank');
}

/**
 * 添加当前页面
 */
const addCurrentPage = () => {
  const url = window.location.href;
  const title = document.title;
  
  // 获取 Icon (优先获取 shortcut icon，否则找 rel 包含 icon 的标签)
  const icon = document.querySelector('link[rel~="icon"]') 
                ? (document.querySelector('link[rel~="icon"]') as HTMLLinkElement).href 
                : `${window.location.origin}/favicon.ico`;

  if(linkList.value.some((item: Link) => item.url === url)){
    ElMessage({
      message: '该页面已存在',
      type: 'warning',
      appendTo: props.appContainer || document.body
    });
    return;
  }
  
  linkList.value.push({
    id: Date.now(),
    title,
    url,
    icon
  });

  storage.setItem('sync:linkList', [...linkList.value]);
  
  ElMessage({
    message: '添加成功',
    type: 'success',
    appendTo: props.appContainer || document.body
  });
}

onMounted(() => {
  refreshLinkList();
  storageWatcher = storage.watch('sync:linkList', (newValue) => {
    refreshLinkList();
  });
})

onUnmounted(() => {
  if(storageWatcher){
    storageWatcher();
  }
})

</script>

<style lang="scss" scoped>
.bobo-popover{
  .popover-body{
    .link-list-scroller{
      max-height: 141px; // 3 items × 47px

      // Element Plus 风格滚动条（穿透 scoped 到 RecycleScroller 内部）
      :deep(.vue-recycle-scroller__slot),
      :deep(&) {
        scrollbar-width: thin;
        scrollbar-color: #c0c4cc transparent;
      }

      &::-webkit-scrollbar,
      :deep(*::-webkit-scrollbar) {
        width: 6px;
        height: 6px;
      }
      &::-webkit-scrollbar-track,
      :deep(*::-webkit-scrollbar-track) {
        background: transparent;
      }
      &::-webkit-scrollbar-thumb,
      :deep(*::-webkit-scrollbar-thumb) {
        background-color: #c0c4cc;
        border-radius: 3px;
        &:hover {
          background-color: #909399;
        }
      }
    }
    .link-button{
      display: flex;
      align-items: center;
      padding: 5px;
      height: 42px;
      box-sizing: border-box;
      background-color: rgba(237, 235, 247, 0.3);
      margin-bottom: 5px;
      cursor: pointer;
      .link-icon{
        width: 32px;
        height: 32px;
        border-radius: 4px;
        margin-right: 10px;
        flex-shrink: 0;
      }
      .title{
        flex: 1;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      &:hover{
        background-color: rgba(237, 235, 247, 0.8);
      }
    }
    .add-link-button{
      display: flex;
      align-items: center;
      padding: 5px;
      background-color: rgba(237, 235, 247, 0.3);
      margin-bottom: 5px;
      cursor: pointer;
      .button-icon{
        font-size: 16px;
        margin-right: 10px;
      }
      &:hover{
        background-color: rgba(237, 235, 247, 0.8);
      }
    }
  }
}

</style>