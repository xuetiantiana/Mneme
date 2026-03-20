<template>
  <div class="layout-container no-copy">
    <el-button
      style="position: absolute; left: 10px; top: 10px"
      @click="handleLogout"
      >退出</el-button
    >

    <el-button
      style="position: absolute; right: 170px; top: 10px"
      :loading="exportLoading"
      @click="handleExport"
      >Export</el-button
    >

    <el-button
      style="position: absolute; right: 10px; top: 10px"
      @click="showStoryListDialog = true"
      >Generated Assets</el-button
    >

    <!-- 故事列表弹窗 -->
    <StoryListDialog
      v-model="showStoryListDialog"
      :defaultIndex="currentStoryIndex"
    ></StoryListDialog>
    <!-- left-panel -->
    <div class="left-panel" v-show="showLeft">
      <div class="panel-header">
        <span>Memory Gallery</span>
        <button class="close-btn" @click="showLeft = false">
          <svg-icon name="toggle-icon" class="toggle-icon"></svg-icon>
        </button>
      </div>

      <div class="panel-content">
        <PCMListComponent></PCMListComponent>
      </div>
    </div>
    <el-tooltip content="显示 Memory Gallery" placement="right">
      <button
        class="toggle-btn fixed-btn"
        style="position: fixed; left: 30px; top: 70px"
        v-show="!showLeft"
        @click="showLeft = true"
      >
        <svg-icon name="toggle-icon" class="toggle-icon"></svg-icon>
      </button>
    </el-tooltip>

    <!-- main-panel -->
    <div class="main-panel">
      <div class="panel-header" style="justify-content: center">
        <span>
          Working memory
          <button class="fullscreen-btn" @click="toggleFullscreen" title="全屏">
            <svg
              v-if="!isFullscreen"
              viewBox="0 0 24 24"
              width="16"
              height="16"
              fill="currentColor"
            >
              <path
                d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"
              />
            </svg>
            <svg
              v-else
              viewBox="0 0 24 24"
              width="16"
              height="16"
              fill="currentColor"
            >
              <path
                d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"
              />
            </svg>
          </button>
        </span>
      </div>
      <div class="main-content">
        <WorkingMemory
          ref="workingMemoryRef"
          :topicContainers="getTopicContainers()"
          @renderNodesToTopic="handleRenderNodesToTopic"
        >
        </WorkingMemory>
      </div>
    </div>

    <!-- right-panel -->
    <div class="right-panel" v-show="showRight">
      <div class="panel-header">
        <span>My Story</span>
        <button class="close-btn" @click="showRight = false">
          <svg-icon name="toggle-icon" class="toggle-icon"></svg-icon>
        </button>
      </div>
      <div class="panel-content">
        <TopicContainerList
          ref="topicContainerListRef"
          @createSuccess="handleCreateSuccess"
        ></TopicContainerList>
      </div>
    </div>
    <el-tooltip content="显示 My Story" placement="left">
      <button
        class="toggle-btn"
        style="position: fixed; right: 30px; top: 70px"
        v-show="!showRight"
        @click="showRight = true"
      >
        <svg-icon name="toggle-icon" class="toggle-icon"></svg-icon>
      </button>
    </el-tooltip>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { ElMessage } from "element-plus";
import PCMListComponent from "@/views/Home/components/PCMListComponent.vue";
import TopicContainerList from "@/views/Home/components/TopicContainerList.vue";
import StoryListDialog from "@/views/Home/components/StoryListDialog.vue";
import { ExportData } from "@/service/api";
import { useStoryStore } from "@/stores/storyStore";
import { getSessionId } from "@/service/session";

import WorkingMemory from "@/views/Home/components/WorkingMemory.vue";

const showLeft = ref(true);
const showRight = ref(false);

const isFullscreen = computed(() => !showLeft.value && !showRight.value);

const toggleFullscreen = () => {
  if (isFullscreen.value) {
    showLeft.value = true;
    showRight.value = true;
  } else {
    showLeft.value = false;
    showRight.value = false;
  }
};
const showStoryListDialog = ref(false);
const currentStoryIndex = ref(0);
const topicContainerListRef = ref(null);
const workingMemoryRef = ref(null);
const exportLoading = ref(false);
const storyStore = useStoryStore();

const handleCreateSuccess = (index) => {
  currentStoryIndex.value = index;
  showStoryListDialog.value = true;
};

const getTopicContainers = () => {
  if (topicContainerListRef.value) {
    return topicContainerListRef.value.topicContainers || [];
  }
  return [];
};

const handleRenderNodesToTopic = (nodesData) => {
  console.log("Home接收到要渲染的节点数据:", nodesData);
  showRight.value = true; // 确保右侧面板打开以显示渲染结果
  setTimeout(() => {
    if (topicContainerListRef.value) {
    topicContainerListRef.value.renderNodesToFirstCanvas(nodesData);
  }
  }, 100);
};

const handleLogout = () => {
  localStorage.clear();
  window.location.reload();
};

const parseFileNameFromDisposition = (disposition) => {
  if (!disposition) return "export-data";
  const utf8Match = disposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) return decodeURIComponent(utf8Match[1]);
  const normalMatch = disposition.match(/filename=\"?([^\";]+)\"?/i);
  if (normalMatch?.[1]) return normalMatch[1];
  return "export-data";
};

const downloadBlob = (blob, fileName) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const handleExport = async () => {
  const user_id = storyStore.user_id || localStorage.getItem("user_id") || "";
  const session_id = storyStore.session_id || getSessionId();

  if (!user_id || !session_id) {
    ElMessage.warning("缺少 user_id 或 session_id，无法导出");
    return;
  }

  exportLoading.value = true;
  try {
    const res = await ExportData(
      { user_id, session_id },
      { responseType: "blob" }
    );

    const contentType = String(res?.headers?.["content-type"] || "").toLowerCase();
    const disposition = res?.headers?.["content-disposition"] || "";

    if (contentType.includes("application/json")) {
      const text = await res.data.text();
      const json = JSON.parse(text || "{}");
      const downloadUrl = json?.data?.download_url || json?.download_url;
      if (downloadUrl) {
        window.open(downloadUrl, "_blank");
        ElMessage.success("已获取下载链接");
        return;
      }
      ElMessage.success("导出成功");
      console.log("ExportData JSON response:", json);
      return;
    }

    const fileName = parseFileNameFromDisposition(disposition);
    downloadBlob(res.data, fileName);
    ElMessage.success("导出文件已下载");
  } catch (error) {
    console.error("ExportData error:", error);
    ElMessage.error("导出失败，请检查网络或稍后重试");
  } finally {
    exportLoading.value = false;
  }
};
</script>

<style scoped lang="scss">
.layout-container {
  display: flex;
  height: 100vh;
  width: 100%;
  overflow: hidden;
  background: #eee;
  padding: 56px 1px 1px;
  gap: 14px;

  .left-panel {
    width: 240px;
    min-width: 240px;
    max-width: 240px;
    background-color: #ffff;
    display: flex;
    flex-direction: column;
    border-radius: 20px;
    flex-shrink: 0;

    .panel-content {
      flex: 1;
      overflow: hidden;
    }
  }

  .right-panel {
    width: 350px;
    min-width: 350px;
    max-width: 350px;
    background-color: #ffff;
    display: flex;
    flex-direction: column;
    border-radius: 20px;
    flex-shrink: 0;
    border-right: none;
    border-left: 1px solid #ddd;

    .panel-content {
      flex: 1;
      overflow-y: auto;
    }
  }

  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    position: relative;
    padding: 0.8rem;
    border-bottom: 1px solid #e2e2e2;

    span {
      font-weight: 600;
      font-size: 1.125em;
    }
    .toggle-icon {
      width: 16px;
      height: 16px;
    }

    .close-btn {
      display: flex;
      background: none;
      border: none;
      font-size: 24px;
      cursor: pointer;
      color: #666;
      padding: 4px;
      &:hover {
        color: #333;
      }
    }

    .fullscreen-btn {
      display: inline-flex;
      background: none;
      border: none;
      cursor: pointer;
      color: #666;
      padding: 0 4px;
      vertical-align: middle;
      margin-left: 8px;
      &:hover {
        color: #333;
      }
    }
  }

  .main-panel {
    flex: 1;
    display: flex;
    flex-direction: column;
    background-color: #fff;
    border-radius: 20px;
    overflow: hidden;

    .main-content {
      flex: 1;
      overflow-y: auto;
    }
  }

  .toggle-btn {
    background: none;
    border: 1px solid #ddd;
    border-radius: 4px;
    padding: 4px 12px;
    cursor: pointer;
    font-size: 18px;
    color: #666;
    z-index: 10;

    &:hover {
      background-color: #f0f0f0;
    }

    .toggle-icon {
      width: 16px;
      height: 16px;
    }
  }
}
</style>
