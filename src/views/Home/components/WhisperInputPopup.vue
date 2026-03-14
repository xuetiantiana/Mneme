<template>
  <div
    v-if="visible"
    class="whisper-input-popup"
    :style="{ left: `${position.x}px`, top: `${position.y}px` }"
    @click.stop
  >
    <div class="popup-inner">
      <div class="popup-title">{{ title }}</div>
      <input
        ref="inputRef"
        v-model="textValue"
        class="whisper-input"
        type="text"
        placeholder="语音将自动转成文字，也可手动输入"
        @input="handleInput"
      />
      <div v-if="toolType === 'Add Memory'" class="upload-row">
        <label class="upload-label" for="memory-upload-input">上传图片</label>
        <input
          id="memory-upload-input"
          class="upload-input"
          type="file"
          accept="image/*"
          @change="handleFileChange"
        />
      </div>
      <div v-if="imagePreviewUrl" class="preview-wrap">
        <img :src="imagePreviewUrl" alt="memory" class="preview-image" />
      </div>
      <div class="popup-actions">
        <button class="action-btn" type="button" @click="toggleRecording">
          {{ isRecording ? "停止录音" : "开始录音" }}
        </button>
        <button class="action-btn primary" type="button" @click="handleSubmit">
          提交
        </button>
        <button class="action-btn" type="button" @click="$emit('cancel')">
          取消
        </button>
      </div>
      <div class="popup-hint">
        {{
          speechSupported
            ? isRecording
              ? "正在录音识别..."
              : "识别已暂停，可继续"
            : "当前浏览器不支持语音识别，请手动输入"
        }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { nextTick, onBeforeUnmount, ref, watch } from "vue";

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  position: {
    type: Object,
    default: () => ({ x: 0, y: 0 }),
  },
  title: {
    type: String,
    default: "Whisper",
  },
  toolType: {
    type: String,
    default: "Whisper",
  },
});

const emit = defineEmits(["submit", "cancel"]);

const inputRef = ref(null);
const textValue = ref("");
const isRecording = ref(false);
const imageFile = ref(null);
const imagePreviewUrl = ref("");

const speechSupported =
  typeof window !== "undefined" &&
  (!!window.SpeechRecognition || !!window.webkitSpeechRecognition);

let recognition = null;
let finalTextBuffer = "";
let shouldAutoRestart = false;

const createRecognition = () => {
  if (!speechSupported) {
    return null;
  }

  const RecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition;
  const rec = new RecognitionCtor();
  rec.lang = "zh-CN";
  rec.continuous = true;
  rec.interimResults = true;

  rec.onstart = () => {
    isRecording.value = true;
  };

  rec.onresult = (event) => {
    let interim = "";
    for (let i = event.resultIndex; i < event.results.length; i += 1) {
      const result = event.results[i];
      const transcript = result[0]?.transcript || "";
      if (result.isFinal) {
        finalTextBuffer = `${finalTextBuffer} ${transcript}`.trim();
      } else {
        interim += transcript;
      }
    }
    textValue.value = `${finalTextBuffer} ${interim}`.trim();
  };

  rec.onend = () => {
    isRecording.value = false;
    if (props.visible && shouldAutoRestart) {
      setTimeout(() => {
        try {
          rec.start();
        } catch (error) {
          // 忽略重复启动抛出的异常
        }
      }, 120);
    }
  };

  rec.onerror = () => {
    isRecording.value = false;
  };

  return rec;
};

const startRecording = () => {
  if (!speechSupported) {
    return;
  }
  if (!recognition) {
    recognition = createRecognition();
  }
  if (!recognition) {
    return;
  }
  shouldAutoRestart = true;
  try {
    recognition.start();
  } catch (error) {
    // 忽略重复启动抛出的异常
  }
};

const stopRecording = () => {
  shouldAutoRestart = false;
  if (recognition) {
    try {
      recognition.stop();
    } catch (error) {
      // 忽略停止时的异常
    }
  }
};

const toggleRecording = () => {
  if (isRecording.value) {
    stopRecording();
  } else {
    startRecording();
  }
};

const handleInput = () => {
  finalTextBuffer = textValue.value;
};

const handleSubmit = () => {
  const text = textValue.value.trim();
  emit("submit", {
    text,
    imageFile: imageFile.value,
    imageDataUrl: imagePreviewUrl.value,
  });
};

const handleFileChange = (event) => {
  const file = event.target?.files?.[0];
  if (!file) {
    imageFile.value = null;
    imagePreviewUrl.value = "";
    return;
  }

  imageFile.value = file;
  const reader = new FileReader();
  reader.onload = () => {
    imagePreviewUrl.value = typeof reader.result === "string" ? reader.result : "";
  };
  reader.readAsDataURL(file);
};

watch(
  () => props.visible,
  async (visible) => {
    if (visible) {
      textValue.value = "";
      finalTextBuffer = "";
      imageFile.value = null;
      imagePreviewUrl.value = "";
      await nextTick();
      inputRef.value?.focus();
      startRecording();
    } else {
      stopRecording();
    }
  }
);

onBeforeUnmount(() => {
  stopRecording();
  recognition = null;
});
</script>

<style scoped>
.whisper-input-popup {
  position: absolute;
  z-index: 1200;
}

.popup-inner {
  width: 340px;
  background: rgba(255, 255, 255, 0.98);
  border: 1px solid #dcdfe6;
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.16);
  border-radius: 12px;
  padding: 14px;
}

.popup-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 8px;
}

.whisper-input {
  width: 100%;
  height: 38px;
  border: 1px solid #cfd3dc;
  border-radius: 8px;
  padding: 0 10px;
  font-size: 14px;
  outline: none;
}

.whisper-input:focus {
  border-color: #409eff;
}

.popup-actions {
  display: flex;
  gap: 8px;
  margin-top: 10px;
}

.upload-row {
  margin-top: 10px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.upload-label {
  color: #606266;
  font-size: 12px;
  min-width: 52px;
}

.upload-input {
  font-size: 12px;
}

.preview-wrap {
  margin-top: 8px;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  padding: 6px;
  background: #fff;
}

.preview-image {
  display: block;
  max-width: 100%;
  max-height: 120px;
  border-radius: 6px;
}

.action-btn {
  border: 1px solid #d0d4dc;
  border-radius: 8px;
  background: #fff;
  color: #303133;
  cursor: pointer;
  height: 32px;
  padding: 0 12px;
}

.action-btn.primary {
  border-color: #409eff;
  background: #409eff;
  color: #fff;
}

.popup-hint {
  margin-top: 8px;
  color: #909399;
  font-size: 12px;
}
</style>
