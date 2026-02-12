<template>
  <div class="memory-retrieve-container">
    <div class="header">
      <div class="title">
        <div class="icon">
          <SvgIcon name="speak"></SvgIcon>
        </div>
        <h2>Memory Retrieve</h2>
      </div>
      <button class="close-btn" @click="emit('close')">
        <el-icon><Close /></el-icon>
      </button>
    </div>

    <div class="questions">
      <ul>
        <li>你们是怎么相遇的?</li>
        <li>他是什么性格?</li>
        <li>翻看相册，有什么特别的回忆?</li>
      </ul>
    </div>

    <div class="content">
      <div class="main-image">
        <el-image :src="thumbnails[activeThumbnail]" alt="Main memory image" />
      </div>
      <div class="thumbnail-grid">
        <div
          v-for="(thumbnail, index) in thumbnails"
          :key="index"
          class="thumbnail-item"
          :class="{ active: index === activeThumbnail }"
          @click="selectThumbnail(index)"
        >
          <el-image :src="thumbnail" alt="Thumbnail" />
        </div>
        <div class="add-thumbnail" @click="addImage">
          <div class="add-icon">+</div>
        </div>
      </div>
    </div>

    <div class="description">
      <el-input
        v-model="descriptionValue"
        type="textarea"
        :rows="5"
        placeholder="请输入关于这只猫的回忆..."
        resize="none"
      />
    </div>

    <div class="bottom-actions">
      <button
        :class="['mic-btn', { listing: isRecording }]"
        @click="toggleRecording"
      >
        <el-icon><Microphone /></el-icon>
        <span v-if="isRecording" class="recording-indicator"></span>
      </button>
      <button class="upload-btn" @click="confirmMemory">确定</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue";
import { Microphone, Close } from "@element-plus/icons-vue";

const getAssetsFile = (url) => {
  return new URL(`../../../assets/${url}`, import.meta.url).href;
};

const emit = defineEmits(["close", "confirmMemory"]);

const thumbnails = ref([
  getAssetsFile("images/OIP-C2.png"),
  getAssetsFile("images/2.png"),
  getAssetsFile("images/2.png"),
  getAssetsFile("images/3.png"),
  getAssetsFile("images/1.jpg"),
]);
const activeThumbnail = ref(0);
const descriptionValue = ref(
  "我的猫叫然然，然后呢，是我十岁的时候领养的。为什么叫这个名字呢？是因为他非常的粘人。我觉得他非常可爱，但有时候也非常调皮。就是他很喜欢在我们家跑酷，上蹿下跳的。但是呢，非常遗憾的是，他在我17岁的时候去世了。"
);

const isRecording = ref(false);

// 方法
const selectThumbnail = (index) => {
  activeThumbnail.value = index;
};

const toggleRecording = () => {
  isRecording.value = !isRecording.value;
  if (isRecording.value) {
    startRecognition();
  } else {
    stopRecognition();
  }
};

const addImage = () => {
  // 这里可以实现添加图片的逻辑
  console.log("Add image clicked");
};

const confirmMemory = () => {
  // 这里可以实现上传的逻辑
  emit("confirmMemory", {
    mainImage: thumbnails.value[activeThumbnail.value],
    thumbnails: thumbnails.value,
    description: descriptionValue.value,
  });
};

const isListening = ref(false);
const finalText = ref(""); // 已确认的文本
const interimText = ref(""); // 临时文本
const fullText = ref(""); // 最终 + 临时拼接

let recognition = null;

onMounted(() => {
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    alert("当前浏览器不支持 Web Speech API，请使用 Chrome / Edge / Safari");
    return;
  }

  recognition = new SpeechRecognition();
  recognition.lang = "zh-CN"; // 'en-US'   // 英文  "zh-CN"; // 中文

  console.log("recognition.lang====", recognition.lang);
  recognition.interimResults = true;
  recognition.continuous = true;

  recognition.onstart = () => {
    console.log("recognition start");
    isListening.value = true;
    finalText.value = "";
    interimText.value = "";
    fullText.value = "";
  };

  recognition.onresult = (event) => {
    let interim = "";
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        finalText.value += transcript;
      } else {
        interim += transcript;
      }
    }
    interimText.value = interim;
    // 拼接成一段
    fullText.value = finalText.value + interimText.value;
    descriptionValue.value = descriptionValue.value + interimText.value;
  };

  recognition.onend = () => {
    console.log("recognition end");
    isListening.value = false;
  };

  recognition.onerror = (e) => {
    console.error("语音识别出错：", e);
    isListening.value = false;
    ElMessage.error("语音识别出错");
  };
});

onBeforeUnmount(() => {
  stopRecognition();
});

function startRecognition() {
  console.log(recognition, isListening.value);
  if (recognition && !isListening.value) {
    recognition.start();
  }
}

function stopRecognition() {
  if (recognition && isListening.value) {
    recognition.stop();
  }
  isListening.value = false;
}

const cancelRecognition = () => {
  stopRecognition();
};

const confirmRecognition = () => {
  stopRecognition();
  textareaText.value = finalText.value;
};
</script>

<style lang="scss" scoped>
.memory-retrieve-container {
  background: #ffffff;
  border-radius: 12px;
  padding: 16px 26px;
  max-width: 600px;
  margin: 0 auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  width: 420px;
  height: 580px;
  overflow: auto;

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
    padding-bottom: 16px;
    border-bottom: 1px solid #e0e0e0;

    .title {
      display: flex;
      align-items: center;
      gap: 12px;

      h2 {
        margin: 0;
        font-size: 20px;
        font-weight: 600;
        color: #333333;
      }

      .icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        background-color: #f0f7ff;
        border-radius: 8px;
      }
    }

    .close-btn {
      background: none;
      border: none;
      cursor: pointer;
      padding: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
      transition: background-color 0.2s;
      color: #999999;
      font-size: 1.5em;

      &:hover {
        background-color: #f5f5f5;
        color: #666666;
      }
    }
  }

  .questions {
    margin-bottom: 12px;

    ul {
      list-style-type: disc;
      padding-left: 4px;
      margin: 0;

      li {
        margin-bottom: 8px;
        color: #666666;
        font-size: 14px;
        line-height: 1.4;
        padding-left: 4px;
      }
    }
  }

  .content {
    display: flex;
    gap: 16px;
    margin-bottom: 12px;
    height: 170px;

    .main-image {
      width: 260px;
      height: 100%;

      .el-image {
        width: 100%;
        height: 100%;
        object-fit: cover;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }
    }

    .thumbnail-grid {
      flex: 1;
      height: 100%;
      overflow: auto;
      padding-right: 10px;

      .thumbnail-item {
        width: 70px;
        height: 50px;
        border-radius: 6px;
        overflow: hidden;
        cursor: pointer;
        border: 2px solid transparent;
        transition: all 0.2s;
        margin-bottom: 6px;

        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        &.active {
          border-color: #2196f3;
          box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.2);
        }

        .el-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
      }

      .add-thumbnail {
        width: 70px;
        height: 50px;
        border: 2px dashed #cccccc;
        border-radius: 6px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s;
        background-color: #f9f9f9;

        &:hover {
          border-color: #2196f3;
          background-color: #f0f7ff;
        }

        .add-icon {
          font-size: 24px;
          color: #999999;
          font-weight: 300;
        }
      }
    }
  }

  .description {
    :deep(.el-textarea__inner) {
      background-color: #f9f9f9;
      border-radius: 8px;
      padding: 16px;
      color: #333333;
      font-size: 14px;
      line-height: 1.6;
      border: none;
      border-left: 3px solid #2196f3;
      min-height: 120px;
      resize: none;
    }
  }

  .bottom-actions {
    display: flex;
    gap: 12px;
    align-items: center;
    justify-content: flex-end;
    padding-top: 20px;

    .mic-btn {
      background: none;
      border: none;
      cursor: pointer;
      padding: 10px;
      border-radius: 50%;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      border: 1px solid #e0e0e0;
      position: relative;
      overflow: hidden;

      .el-icon {
        font-size: 1.8em;
        z-index: 1;
      }

      .recording-indicator {
        position: absolute;
        top: 2px;
        right: 2px;
        width: 8px;
        height: 8px;
        background-color: #ff4444;
        border-radius: 50%;
        animation: pulse 1.5s ease-in-out infinite;
      }

      &:hover {
        background-color: #f5f5f5;
      }

      &.listing {
        background-color: #2196f3;
        border-color: #1976d2;
        animation: recording-wave 2s ease-in-out infinite;

        &::before,
        &::after {
          content: "";
          position: absolute;
          border-radius: 50%;
          background-color: rgba(255, 255, 255, 0.6);
        }

        &::before {
          width: 100%;
          height: 100%;
          animation: wave-expand 2s ease-in-out infinite;
        }

        &::after {
          width: 60%;
          height: 60%;
          top: 20%;
          left: 20%;
          animation: wave-expand 2s ease-in-out infinite 0.5s;
        }
      }
    }

    .upload-btn {
      padding: 10px 32px;
      background-color: #2196f3;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      transition: background-color 0.2s;
      box-shadow: 0 2px 4px rgba(33, 150, 243, 0.2);

      &:hover {
        background-color: #1976d2;
        transform: translateY(-1px);
        box-shadow: 0 4px 8px rgba(33, 150, 243, 0.3);
      }

      &:active {
        transform: translateY(0);
      }
    }
  }
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.5;
    transform: scale(1.2);
  }
}

@keyframes wave-expand {
  0%,
  100% {
    transform: scale(1);
    opacity: 0.6;
  }
  50% {
    transform: scale(1.3);
    opacity: 1;
  }
}

@media (max-width: 640px) {
  .memory-retrieve-container {
    padding: 12px;
  }

  .content {
    flex-direction: column;

    .thumbnail-grid {
      flex-direction: row;
      width: 100%;
      overflow-x: auto;
      padding-bottom: 8px;

      .thumbnail-item,
      .add-thumbnail {
        flex-shrink: 0;
      }
    }
  }

  .header {
    .title {
      h2 {
        font-size: 18px;
      }
    }
  }
}
</style>