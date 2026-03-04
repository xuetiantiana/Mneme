<template>
  <el-dialog
    v-model="visible"
    title="故事列表"
    width="800px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <div class="story-list-container">
      <div class="story-list-left">
        <div
          v-for="(story, index) in storyStore.storyList"
          :key="index"
          class="story-item"
          :class="{ active: selectedStoryIndex === index }"
          @click="selectedStoryIndex = index"
        >
          <div class="story-title">{{ story.result.title }}</div>
          <div class="story-time">{{ getStoryTime( story.createdAt) }}</div>
        </div>
        <div v-if="storyStore.storyList.length === 0" class="no-story">
          暂无故事
        </div>
      </div>
      <div class="story-list-right">
        <div v-if="selectedStory" class="story-content">
          <div class="story-item-detail">
            <!-- <div class="item-title">{{ selectedStory.result.title }}</div> -->
            <div
              class="item-description"
              v-html="parseMarkdown(selectedStory.result.markdown)"
            ></div>
          </div>
        </div>
        <div v-else class="no-selected">请创建一个故事</div>
      </div>
    </div>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import { marked } from "marked";
import { useStoryStore } from "@/stores/storyStore";

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  defaultIndex: {
    type: Number,
    default: 0,
  },
});

const emit = defineEmits(["update:modelValue"]);

const storyStore = useStoryStore();

const visible = ref(props.modelValue);
const selectedStoryIndex = ref(0);

watch(
  () => props.modelValue,
  (val) => {
    visible.value = val;
    if (val && props.defaultIndex !== null && props.defaultIndex !== undefined) {
      selectedStoryIndex.value = props.defaultIndex;
    }
  }
);

watch(visible, (val) => {
  emit("update:modelValue", val);
});

const selectedStory = computed(() => {
  if (storyStore.storyList.length > 0 && selectedStoryIndex.value !== null) {
    return storyStore.storyList[selectedStoryIndex.value];
  }
  return null;
});

const getStoryTime = (timeStr) => {
  if (!timeStr) {
    return new Date().toLocaleString();
  }
  const date = new Date(timeStr);
  if (isNaN(date.getTime())) {
    return timeStr;
  }
  return date.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const parseMarkdown = (markdown) => {
  if (!markdown) return "";
  return marked(markdown);
};

const handleClose = () => {
  selectedStoryIndex.value = 0;
};
</script>

<style scoped lang="scss">
.story-list-container {
  display: flex;
  height: 500px;
  gap: 20px;

  .story-list-left {
    width: 200px;
    min-width: 200px;
    border-right: 1px solid #eee;
    overflow-y: auto;

    .story-item {
      padding: 12px;
      cursor: pointer;
      border-bottom: 1px solid #f0f0f0;
      transition: all 0.2s;

      &:hover {
        background-color: #f5f5f5;
      }

      &.active {
        background-color: #e6f7ff;
        border-left: 3px solid #1890ff;
      }

      .story-title {
        font-size: 14px;
        font-weight: 500;
        color: #333;
        margin-bottom: 4px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .story-time {
        font-size: 12px;
        color: #999;
      }
    }

    .no-story {
      padding: 20px;
      text-align: center;
      color: #999;
      font-size: 14px;
    }
  }

  .story-list-right {
    flex: 1;
    overflow-y: auto;

    .story-content {
      .story-item-detail {
        margin-bottom: 20px;
        padding: 12px;
        border: 1px solid #eee;
        border-radius: 8px;

        .item-title {
          font-size: 16px;
          font-weight: 500;
          color: #333;
          margin-bottom: 12px;
        }

        .item-screenshot {
          max-width: 100%;
          border-radius: 8px;
          margin-bottom: 12px;
        }

        .item-description {
          font-size: 14px;
          color: #666;
          line-height: 1.6;
          white-space: pre-wrap;

          :deep(h1) {
            font-size: 24px;
            font-weight: bold;
            margin: 16px 0 12px;
            color: #333;
          }

          :deep(h2) {
            font-size: 20px;
            font-weight: bold;
            margin: 14px 0 10px;
            color: #333;
          }

          :deep(h3) {
            font-size: 16px;
            font-weight: bold;
            margin: 12px 0 8px;
            color: #333;
          }

          :deep(p) {
            margin: 8px 0;
          }

          :deep(ul),
          :deep(ol) {
            padding-left: 20px;
            margin: 8px 0;
          }

          :deep(li) {
            margin: 4px 0;
          }

          :deep(code) {
            background: #f5f5f5;
            padding: 2px 6px;
            border-radius: 4px;
            font-family: monospace;
            font-size: 13px;
          }

          :deep(pre) {
            background: #f5f5f5;
            padding: 12px;
            border-radius: 8px;
            overflow-x: auto;
            margin: 12px 0;

            code {
              background: none;
              padding: 0;
            }
          }

          :deep(blockquote) {
            border-left: 4px solid #ddd;
            padding-left: 12px;
            margin: 12px 0;
            color: #666;
          }
        }
      }
    }

    .no-selected {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: #999;
      font-size: 14px;
    }
  }
}
</style>
