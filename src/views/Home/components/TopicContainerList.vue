<template>
  <div class="topic-container-list">
    <el-button class="add-topic-btn" style="width: 10em" @click="addNewTopic"
      >新建主题容器</el-button
    >
    <div class="topic-list-scroll">
      <div
        v-for="(topic, index) in topicContainers"
        :key="index"
        class="topic-container-item"
        :class="{ active: topic.selected }"
      >
        <input
          type="checkbox"
          v-model="topic.selected"
          class="topic-checkbox"
        />
        <div class="topic-container-header">
          <div class="title-input-wrapper">
            <span class="title-label">一句话主题：</span>
            <div class="title-input-container">
              <el-input
                width="100%"
                type="text"
                v-model="topic.title"
                placeholder="请输入一句话主题"
                class="title-input"
              />
            </div>
          </div>
        </div>
        <div class="topic-container-content">
          <div class="detail-item">
            <span class="detail-label">细节描述：</span>
            <el-input
              type="textarea"
              v-model="topic.desc"
              placeholder="请输入细节描述"
              class="detail-textarea"
              :autosize="{ minRows: 2, maxRows: 4 }"
            />
          </div>

          <div style="height: 300px">
            <konvaComponent
              :ref="(el) => setKonvaRef(el, index)"
              @sendSelectedNodes="handleSelectedNodes"
            >
            </konvaComponent>
          </div>
        </div>
      </div>
    </div>
    <div class="bottom-action">
      <el-tooltip
        :disabled="selectedCount > 0"
        content="请先选择主题容器"
        placement="top"
      >
        <el-button
          class="action-btn"
          type="primary"
          :disabled="selectedCount === 0"
          :loading="loading"
          @click="handleGenerate"
          >Generate</el-button
        >
      </el-tooltip>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import konvaComponent from "@/components/konvaComponent.vue";
import { CreateStory } from "@/service/api";
import { useStoryStore } from "@/stores/storyStore";
import { ElMessage } from "element-plus";

const storyStore = useStoryStore();
const loading = ref(false);

const topicContainers = ref([
  {
    title: "猫咪对人的信任",
    selected: true,
    desc: "人物：\n场景：\n 情节：",
  },
]);

const selectedCount = computed(() => {
  return topicContainers.value.filter((topic) => topic.selected).length;
});

const addNewTopic = () => {
  const newTopic = {
    title: ``,
    selected: false,
    desc: "人物：\n场景：\n 情节：",
    image: null,
  };
  topicContainers.value.push(newTopic);
};

const handleSelectedNodes = (nodesData) => {
  console.log("父组件接收到选中的节点数据:", nodesData);
};

const konvaRefs = ref([]);

const setKonvaRef = (el, index) => {
  konvaRefs.value[index] = el;
};

const renderNodesToFirstCanvas = (nodesData) => {
  console.log("TopicContainerList接收到要渲染的节点数据:", nodesData.nodes);
  console.log("目标画布索引:", nodesData.canvasIndex);

  const canvasIndex = nodesData.canvasIndex || 0;

  if (konvaRefs.value[canvasIndex]) {
    console.log(`konvaRefs.value[${canvasIndex}] 存在`);
    console.log("方法:", Object.keys(konvaRefs.value[canvasIndex]));
    if (typeof konvaRefs.value[canvasIndex].renderNodes === "function") {
      konvaRefs.value[canvasIndex].renderNodes(nodesData.nodes);
      console.log(`已将节点渲染到画布 ${canvasIndex}`);
    } else {
      console.log("renderNodes 方法不存在");
    }
  } else {
    console.log(`画布 ${canvasIndex} 引用不存在`);
  }
};

const handleGenerate = async () => {
  loading.value = true;

  // 获取选中的 topicContainers
  const selectedTopics = topicContainers.value.filter(
    (topic) => topic.selected
  );

  // 导出每个选中的 canvas 图片并生成指定格式的数据
  const result = [];

  for (let i = 0; i < topicContainers.value.length; i++) {
    if (topicContainers.value[i].selected && konvaRefs.value[i]) {
      const konvaRef = konvaRefs.value[i];
      const containerIndex = i + 1;

      // 检查 title 和 description
      const title = topicContainers.value[i].title;
      const description = topicContainers.value[i].desc;

      if (!title || !title.trim()) {
        ElMessage.error(`第 ${containerIndex} 个主题容器的标题不能为空`);
        loading.value = false;
        return;
      }

      if (!description || !description.trim()) {
        ElMessage.error(`第 ${containerIndex} 个主题容器的描述不能为空`);
        loading.value = false;
        return;
      }

      // 检查 canvas 是否有内容
      if (typeof konvaRef.exportCanvas === "function") {
        try {
          const imageData = await konvaRef.exportCanvas();

          if (!imageData) {
            ElMessage.error(
              `第 ${containerIndex} 个主题容器的图片不能为空，请先在画布中添加内容`
            );
            loading.value = false;
            return;
          }

          const canvasData = konvaRef.exportElementInfo();
          console.log("$$$$canvasData", canvasData);
          if (
            !canvasData ||
            (Array.isArray(canvasData) && canvasData.length === 0)
          ) {
            ElMessage.error(
              `第 ${containerIndex} 个主题容器的画布内容不能为空`
            );
            loading.value = false;
            return;
          }
          console.log("canvasData", canvasData);
          // 将 JSON 字符串数组转换为解析后的对象数组
          const parsedCanvasData = canvasData.map((jsonStr) =>
            JSON.parse(jsonStr)
          );
          console.log("parsedCanvasData", parsedCanvasData);

          result.push({
            screenshot: imageData,
            title: title,
            description: description,
            canvas_data: parsedCanvasData,
          });
        } catch (error) {
          console.error(`导出 Canvas ${i} 图片失败:`, error);
          ElMessage.error(`第 ${containerIndex} 个主题容器的画布导出失败`);
          loading.value = false;
          return;
        }
      } else {
        console.error(`Canvas ${i} 没有 exportCanvas 方法`);
      }
    }
  }

  // 检查是否有选中的主题容器
  if (result.length === 0) {
    ElMessage.error("请至少选择一个主题容器");
    loading.value = false;
    return;
  }

  console.log("选中数据:", result);
  // 调用 CreateStory API
  try {
    const response = await CreateStory({
      themes: result,
    });
    console.log("创建成功:", response);
    const res = response.data;
    // 判断接口是否成功
    if (res && res.success) {
      storyStore.addStory({
        selectedTopics: selectedTopics,
        result: res.data, // 适配不同的后端返回结构
        createdAt: new Date().toLocaleString(),
      });
      console.log("storyList:", storyStore.storyList);

      // 触发创建成功事件
      emit("createSuccess", 0);
    } else {
      ElMessage.error("创建失败:" + (response?.message || "未知错误"));
      ElMessage.error("创建失败:" + (error?.message || "未知错误"));
    }
    ElMessage.error(errorMsg);
    loading.value = false;
  } finally {
    loading.value = false;
  }
};

const emit = defineEmits(["createSuccess"]);

defineExpose({
  topicContainers,
  renderNodesToFirstCanvas,
});
</script>

<style scoped lang="scss">
.topic-container-list {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 16px;

  .add-topic-btn {
    width: 100%;
    background: #1890ff;
    color: #fff;
    border: none;
    border-radius: 8px;
    padding: 12px 16px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    margin-bottom: 16px;

    &:hover {
      background: #40a9ff;
    }

    &:active {
      background: #096dd9;
    }
  }

  .topic-list-scroll {
    flex: 1;
    overflow-y: auto;
    padding-right: 8px;

    .topic-container-item {
      border: 2px solid transparent;
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 16px;
      background: #0000000d;
      transition: all 0.2s ease;
      --el-font-size-base: 0.875rem;
      font-size: 0.875rem;
      position: relative;
      &:last-child {
        margin-bottom: 0;
      }
      &.active {
        // border-color: #000;
      }

      .topic-checkbox {
        position: absolute;
        top: 0px;
        right: 0px;
        width: 1rem;
        height: 1rem;
        cursor: pointer;
      }

      .topic-container-header {
        background: #fff;
        padding: 8px 12px;
        border-radius: 8px;
        margin-bottom: 12px;
        .title-input-wrapper {
          display: flex;
          justify-content: space-between;
          align-items: center;
          .title-input-container {
            flex: 1;
            :deep(.el-input) {
              --el-input-text-color: #000;
              .el-input__wrapper {
                padding: 0;
                outline: none;
                box-shadow: none;
                color: #000;
              }
            }
          }
        }
      }

      .topic-container-content {
        .detail-item {
          background: #fff;
          border-radius: 8px;
          margin: 8px 0;
          display: flex;
          flex-direction: column;
          padding: 8px 12px;

          .detail-label {
            font-weight: 500;
            color: #333;
            margin-bottom: 4px;
          }

          .detail-textarea {
            :deep(.el-textarea__inner) {
              box-shadow: none;
              padding: 0;
              color: #000;
            }
          }
        }

        .topic-image {
          width: 100%;
          border-radius: 8px;
          overflow: hidden;

          img {
            width: 100%;
            height: auto;
            display: block;
          }
        }
      }
    }
  }

  .bottom-action {
    padding-top: 16px;
    display: flex;
    justify-content: center;

    .action-btn {
      border: none;
      border-radius: 24px;
      padding: 12px 32px;
      font-size: 16px;
      font-weight: 500;
      transition: all 0.2s ease;
    }
  }
}
</style>
