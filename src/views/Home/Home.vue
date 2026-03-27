<template>
  <div class="layout-container no-copy">
    <el-button
      style="position: absolute; left: 10px; top: 10px"
      @click="handleLogout"
      >Logout</el-button
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
    <el-tooltip content="Show Memory Gallery" placement="right">
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
    <el-tooltip content="Show My Story" placement="left">
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
import { ref, computed, onMounted } from "vue";
import { ElMessage } from "element-plus";
import PCMListComponent from "@/views/Home/components/PCMListComponent.vue";
import TopicContainerList from "@/views/Home/components/TopicContainerList.vue";
import StoryListDialog from "@/views/Home/components/StoryListDialog.vue";
import { ExportData } from "@/service/api";
import { useStoryStore } from "@/stores/storyStore";

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

onMounted(async () => {
  try {
    await storyStore.fetchStoryList();
  } catch (error) {
    console.error("GetStoryList error:", error);
  }
});

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

const downloadDataUrl = (dataUrl, fileName) => {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const dataUrlToBlob = async (dataUrl) => {
  const response = await fetch(dataUrl);
  return response.blob();
};

const downloadBlob = (blob, fileName) => {
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(objectUrl);
};

const parseFileNameFromDisposition = (
  contentDisposition = "",
  contentType = "",
) => {
  const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    return decodeURIComponent(utf8Match[1]);
  }

  const normalMatch = contentDisposition.match(/filename="?([^";]+)"?/i);
  if (normalMatch?.[1]) {
    return normalMatch[1];
  }

  const lowerContentType = String(contentType).toLowerCase();
  if (
    lowerContentType.includes("application/zip") ||
    lowerContentType.includes("application/x-zip-compressed") ||
    lowerContentType.includes("application/x-compressed")
  ) {
    return `export-${Date.now()}.zip`;
  }

  return `export-${Date.now()}.zip`;
};

const handleExport = async () => {
  exportLoading.value = true;
  try {
    const screenshotDataUrl =
      workingMemoryRef.value?.exportCurrentCanvasScreenshot?.() || "";

    const formData = new FormData();

    if (screenshotDataUrl) {
      const fileName = `canvas-${Date.now()}.png`;
      // downloadDataUrl(screenshotDataUrl, fileName);

      const screenshotBlob = await dataUrlToBlob(screenshotDataUrl);
      const screenshotFile = new File([screenshotBlob], fileName, {
        type: screenshotBlob.type || "image/png",
      });

      formData.append("working_memory_screenshot", screenshotFile);
    }

    // 调试：确认上传前 FormData 中确实包含文件字段。
    for (const [key, value] of formData.entries()) {
      if (value instanceof File) {
        console.log("Export formData field:", key, value.name, value.size, value.type);
      } else {
        console.log("Export formData field:", key, value);
      }
    }

    const exportResp = await ExportData(formData, {
      responseType: "blob",
    });

    const responseBlob = exportResp?.data;
    const headers = exportResp?.headers || {};
    const contentType = String(
      headers["content-type"] || headers["Content-Type"] || "",
    ).toLowerCase();

    if (responseBlob instanceof Blob) {
      if (contentType.includes("application/json")) {
        const text = await responseBlob.text();
        let payload = {};
        try {
          payload = text ? JSON.parse(text) : {};
        } catch (parseError) {
          console.warn("Export response JSON parse failed:", parseError);
        }
        const downloadUrl =
          payload?.download_url ||
          payload?.data?.download_url ||
          payload?.url ||
          payload?.data?.url;

        if (downloadUrl) {
          const fileNameFromUrl =
            decodeURIComponent(String(downloadUrl).split("/").pop() || "") ||
            `export-${Date.now()}.zip`;
          const link = document.createElement("a");
          link.href = downloadUrl;
          link.download = fileNameFromUrl;
          link.target = "_blank";
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      } else {
        const fileName = parseFileNameFromDisposition(
          headers["content-disposition"] || headers["Content-Disposition"] || "",
          contentType,
        );
        downloadBlob(responseBlob, fileName);
      }
    }

    ElMessage.success(
      screenshotDataUrl ? "已导出（本次上传截图）" : "已导出（本次未上传截图）",
    );
  } catch (error) {
    console.error("ExportData screenshot upload error:", error);
    ElMessage.error("截图导出或上传失败，请稍后重试");
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
