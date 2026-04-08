<template>
  <div
    v-show="visible"
    class="whisper-input-popup"
    :style="{ left: `${position.x}px`, top: `${position.y}px` }"
    @click.stop
  >
    <div class="popup-inner">
      <div class="popup-title">{{ title }}</div>
      <el-input
        ref="inputRef"
        v-model="textValue"
        class="whisper-input"
        type="textarea"
        :rows="3"
        :placeholder="t('popupTexts.whisper.placeholder')"
        :disabled="submitLoading"
        @input="handleInput"
      />
      <div v-if="toolType === 'Add Memory'" class="tool-hint add-memory-hint">
        {{ t('popupTexts.whisper.addMemoryHint') }}
      </div>
      <div v-if="toolType === 'Add Memory'" class="upload-row">
        <label class="upload-label" for="memory-upload-input">{{ t('popupTexts.whisper.uploadImage') }}</label>
        <input
          id="memory-upload-input"
          class="upload-input"
          type="file"
          accept="image/*"
          :disabled="submitLoading"
          @change="handleFileChange"
        />
      </div>
      <div v-if="imagePreviewUrl" class="preview-wrap">
        <img :src="imagePreviewUrl" :alt="t('popupTexts.whisper.previewAlt')" class="preview-image" />
      </div>
      <!-- Whisper 模式下明确提示：本次提交会触发 segment 重分析 -->
      <div v-if="toolType === 'Whisper'" class="tool-hint">
        {{ t('popupTexts.whisper.whisperHint') }}
      </div>
      <div class="popup-actions">
        <button class="action-btn" type="button" :disabled="submitLoading" @click="toggleRecording">
          {{ isRecording ? t('popupTexts.whisper.stopRecording') : t('popupTexts.whisper.startRecording') }}
        </button>
        <button class="action-btn primary" type="button" :disabled="submitLoading" @click="handleSubmit">
          {{ submitLoading ? (toolType === 'Add Memory' ? t('popupTexts.whisper.generatingPcm') : t('popupTexts.whisper.analyzing')) : (toolType === 'Whisper' ? t('popupTexts.whisper.confirmAnalysis') : t('popupTexts.whisper.submit')) }}
        </button>
        <button class="action-btn" type="button" :disabled="submitLoading" @click="$emit('cancel')">
          {{ t('popupTexts.whisper.cancel') }}
        </button>
      </div>
      <div class="popup-hint">
        {{ popupHintText }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from "vue";
import { useI18n } from "vue-i18n";

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
  submitLoading: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["submit", "cancel"]);
const { locale, t } = useI18n();

const inputRef = ref(null);
const textValue = ref("");
const isRecording = ref(false);
const imageFile = ref(null);
const imagePreviewUrl = ref("");
const recordingError = ref("");

const speechSupported =
  typeof window !== "undefined" &&
  (!!window.SpeechRecognition || !!window.webkitSpeechRecognition);
const canRequestMicrophone =
  typeof navigator !== "undefined" &&
  !!navigator.mediaDevices?.getUserMedia;

let recognition = null;
let finalTextBuffer = "";
let shouldAutoRestart = false;

// 统一收口底部提示：优先展示明确错误，其次展示加载态/录音态。
const popupHintText = computed(() => {
  if (recordingError.value) {
    return recordingError.value;
  }

  if (props.submitLoading && props.toolType === "Add Memory") {
    return t("popupTexts.whisper.addMemoryLoadingHint");
  }

  if (!speechSupported) {
    return t("popupTexts.whisper.speechUnsupported");
  }

  return isRecording.value
    ? t("popupTexts.whisper.recordingHint")
    : t("popupTexts.whisper.pausedHint");
});

const resetPopupState = () => {
  textValue.value = "";
  finalTextBuffer = "";
  imageFile.value = null;
  imagePreviewUrl.value = "";
  recordingError.value = "";
};

// 浏览器与 Web Speech API 的错误码并不统一，这里做一次归一化映射。
const resolveRecordingErrorMessage = (reason) => {
  switch (String(reason || "")) {
    case "not-allowed":
    case "service-not-allowed":
    case "permission-denied":
    case "NotAllowedError":
      return t("popupTexts.whisper.microphonePermissionDenied");
    case "audio-capture":
    case "NotFoundError":
    case "NotReadableError":
    case "TrackStartError":
      return t("popupTexts.whisper.microphoneUnavailable");
    case "insecure-context":
      return t("popupTexts.whisper.insecureContext");
    default:
      return t("popupTexts.whisper.recordingStartFailed");
  }
};

// 显式申请麦克风权限，确保浏览器能弹出授权框，而不是静默拒绝后续识别启动。
const ensureMicrophoneAccess = async () => {
  if (typeof window !== "undefined" && window.isSecureContext === false) {
    recordingError.value = resolveRecordingErrorMessage("insecure-context");
    return false;
  }

  if (!canRequestMicrophone) {
    return true;
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach((track) => track.stop());
    return true;
  } catch (error) {
    recordingError.value = resolveRecordingErrorMessage(error?.name || error?.message);
    return false;
  }
};

const createRecognition = () => {
  if (!speechSupported) {
    return null;
  }

  const RecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition;
  const rec = new RecognitionCtor();
  rec.lang = locale.value === "en" ? "en-US" : "zh-CN";
  rec.continuous = true;
  rec.interimResults = true;

  rec.onstart = () => {
    recordingError.value = "";
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

  // 识别服务偶发自动结束时，只有在弹窗仍打开且没有错误时才尝试自动续上。
  rec.onend = () => {
    isRecording.value = false;
    if (props.visible && shouldAutoRestart && !recordingError.value) {
      setTimeout(() => {
        try {
          rec.start();
        } catch (error) {
          recordingError.value = resolveRecordingErrorMessage(error?.name || error?.message);
        }
      }, 120);
    }
  };

  rec.onerror = (event) => {
    isRecording.value = false;
    recordingError.value = resolveRecordingErrorMessage(event?.error);
  };

  return rec;
};

// `requestPermission` 为 true 时，要求在当前点击链路里先拉起浏览器麦克风授权。
const startRecording = async ({ requestPermission = false } = {}) => {
  if (!speechSupported) {
    recordingError.value = t("popupTexts.whisper.speechUnsupported");
    return false;
  }

  recordingError.value = "";

  if (requestPermission) {
    const granted = await ensureMicrophoneAccess();
    if (!granted) {
      shouldAutoRestart = false;
      return false;
    }
  }

  if (!recognition) {
    recognition = createRecognition();
  }
  if (!recognition) {
    recordingError.value = t("popupTexts.whisper.recordingStartFailed");
    return false;
  }
  shouldAutoRestart = true;
  try {
    recognition.start();
    return true;
  } catch (error) {
    recordingError.value = resolveRecordingErrorMessage(error?.name || error?.message);
    console.warn("Speech recognition start failed:", error);
    return false;
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
    void startRecording({ requestPermission: true });
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

const updateMemoryFile = (file) => {
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

const handleFileChange = (event) => {
  const file = event.target?.files?.[0] || null;
  updateMemoryFile(file);
};

// 打开弹窗时先重置状态，并尽量在用户点击打开的这条链路里直接启动录音。
const prepareForOpen = async ({ autoStart = true } = {}) => {
  resetPopupState();
  if (autoStart) {
    void startRecording({ requestPermission: true });
  }
  await nextTick();
  inputRef.value?.focus?.();
};

watch(
  () => props.visible,
  async (visible) => {
    if (visible) {
      await nextTick();
      inputRef.value?.focus?.();
    } else {
      stopRecording();
      resetPopupState();
    }
  }
);

// 语言切换后同步更新识别语言，避免中文/英文识别器沿用旧 locale。
watch(
  () => locale.value,
  (language) => {
    if (recognition) {
      recognition.lang = language === "en" ? "en-US" : "zh-CN";
    }
  }
);

defineExpose({
  prepareForOpen,
  startRecording,
  stopRecording,
});

onBeforeUnmount(() => {
  stopRecording();
  recognition = null;
});
</script>

<style scoped>
.whisper-input-popup {
  position: fixed;
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
}

.whisper-input :deep(.el-textarea__inner) {
  border-radius: 8px;
  font-size: 14px;
  line-height: 1.5;
  min-height: 84px !important;
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

.tool-hint {
  margin-top: 10px;
  font-size: 12px;
  line-height: 1.5;
  color: #606266;
  background: #f5f7fa;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  padding: 8px 10px;
}

.add-memory-hint {
  color: #8a5f00;
  background: #fff7e6;
  border-color: #ffe7ba;
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

.action-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.popup-hint {
  margin-top: 8px;
  color: #909399;
  font-size: 12px;
}
</style>
