<template>
  <div v-if="visible" ref="overlayRef" class="crop-overlay" @click.self="$emit('cancel')">
    <div v-if="imgLoaded" class="crop-toolbar" :style="toolbarStyle">
      <div class="crop-title">Crop on Canvas</div>
      <div class="size-info">
        原图尺寸: {{ naturalWidth }} x {{ naturalHeight }}，请直接在当前主图上框选
      </div>
      <div class="analyze-tip">
        裁剪范围仅作用于当前选中的这张图，确认后会调用接口并在主图周边生成 segment 与泡泡。
      </div>
      <div class="crop-actions">
        <button class="btn" type="button" :disabled="confirmLoading" @click="$emit('cancel')">取消</button>
        <button class="btn primary" type="button" :disabled="!selection || confirmLoading" @click="handleConfirm">
          {{ confirmLoading ? "分析中..." : "确认并分析" }}
        </button>
      </div>
    </div>

    <div
      v-if="imgLoaded && hasFrame"
      class="crop-frame"
      :style="frameStyle"
    >
      <canvas
        ref="cropCanvasRef"
        class="crop-canvas"
        @mousedown="handleMouseDown"
        @mousemove="handleMouseMove"
        @mouseup="handleMouseUp"
        @mouseleave="handleMouseUp"
        @wheel.prevent="handleWheel"
      ></canvas>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from "vue";

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  imageSrc: {
    type: String,
    default: "",
  },
  frame: {
    type: Object,
    default: null,
  },
  confirmLoading: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["confirm", "cancel", "stage-pan-by", "stage-wheel"]);

const MIN_CROP_SIZE = 8;
const TOOLBAR_WIDTH = 320;
const TOOLBAR_GAP = 16;
const VIEWPORT_GAP = 16;

const imageObj = ref(null);
const imgLoaded = ref(false);
const naturalWidth = ref(0);
const naturalHeight = ref(0);
const displayWidth = ref(0);
const displayHeight = ref(0);

const overlayRef = ref(null);
const cropCanvasRef = ref(null);

const isDragging = ref(false);
const isStagePanning = ref(false);
const dragStart = ref({ x: 0, y: 0 });
const stagePanLast = ref({ x: 0, y: 0 });
const selection = ref(null);

const hasFrame = computed(() => {
  return !!(
    props.frame &&
    Number(props.frame.width) > 0 &&
    Number(props.frame.height) > 0
  );
});

const frameStyle = computed(() => {
  if (!hasFrame.value) {
    return {};
  }

  return {
    // 使用 transform 而不是 left/top，降低画布连续缩放时的布局抖动。
    transform: `translate3d(${Math.round(props.frame.x)}px, ${Math.round(props.frame.y)}px, 0)`,
    width: `${Math.round(props.frame.width)}px`,
    height: `${Math.round(props.frame.height)}px`,
  };
});

const toolbarStyle = computed(() => {
  if (!hasFrame.value) {
    return {};
  }

  const frameX = Number(props.frame.x) || 0;
  const frameY = Number(props.frame.y) || 0;
  const frameWidth = Number(props.frame.width) || 0;
  const frameHeight = Number(props.frame.height) || 0;

  const overlayWidth = overlayRef.value?.clientWidth || frameX + frameWidth + TOOLBAR_WIDTH;
  const overlayHeight = overlayRef.value?.clientHeight || frameY + frameHeight;

  const rightCandidateLeft = frameX + frameWidth + TOOLBAR_GAP;
  const leftCandidateLeft = frameX - TOOLBAR_WIDTH - TOOLBAR_GAP;
  const rightSpace = overlayWidth - rightCandidateLeft - VIEWPORT_GAP;
  const leftSpace = frameX - TOOLBAR_GAP - VIEWPORT_GAP;

  let left = rightCandidateLeft;
  if (rightSpace >= TOOLBAR_WIDTH) {
    left = rightCandidateLeft;
  } else if (leftSpace >= TOOLBAR_WIDTH) {
    // 右侧放不下就切到左侧，避免介绍面板与 crop 区域重叠。
    left = leftCandidateLeft;
  } else {
    const maxLeft = Math.max(VIEWPORT_GAP, overlayWidth - TOOLBAR_WIDTH - VIEWPORT_GAP);
    left = rightSpace >= leftSpace ? maxLeft : VIEWPORT_GAP;
  }

  const maxTop = Math.max(VIEWPORT_GAP, overlayHeight - 220);
  const top = Math.min(Math.max(frameY, VIEWPORT_GAP), maxTop);

  return {
    transform: `translate3d(${Math.round(left)}px, ${Math.round(top)}px, 0)`,
    width: `${TOOLBAR_WIDTH}px`,
  };
});

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const normalizeRect = (x1, y1, x2, y2) => {
  const left = Math.min(x1, x2);
  const top = Math.min(y1, y2);
  const width = Math.abs(x2 - x1);
  const height = Math.abs(y2 - y1);
  return { x: left, y: top, w: width, h: height };
};

const getCanvasPoint = (event) => {
  const canvas = cropCanvasRef.value;
  if (!canvas) return { x: 0, y: 0 };

  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;

  const x = (event.clientX - rect.left) * scaleX;
  const y = (event.clientY - rect.top) * scaleY;

  return {
    x: clamp(x, 0, canvas.width),
    y: clamp(y, 0, canvas.height),
  };
};

const drawCanvas = () => {
  const canvas = cropCanvasRef.value;
  if (!imgLoaded.value || !canvas || !imageObj.value) return;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  canvas.width = displayWidth.value;
  canvas.height = displayHeight.value;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(imageObj.value, 0, 0, canvas.width, canvas.height);

  if (!selection.value) return;

  const { x, y, w, h } = selection.value;
  if (w < 1 || h < 1) return;

  // 仅显示选区边框，不加灰色遮罩
  ctx.strokeStyle = "#409eff";
  ctx.lineWidth = 2;
  ctx.setLineDash([]);
  ctx.setLineDash([]);
  ctx.strokeRect(x, y, w, h);
  ctx.setLineDash([]);
};

const cleanupStagePanListeners = () => {
  window.removeEventListener("mousemove", handleStagePanMove);
  window.removeEventListener("mouseup", handleStagePanEnd);
};

const handleStagePanMove = (event) => {
  if (!isStagePanning.value) {
    return;
  }

  // 中键拖拽不操作 crop 选区，而是把位移转发给底层 Konva 舞台。
  const dx = event.clientX - stagePanLast.value.x;
  const dy = event.clientY - stagePanLast.value.y;
  stagePanLast.value = { x: event.clientX, y: event.clientY };

  emit("stage-pan-by", { dx, dy });
};

const handleStagePanEnd = () => {
  if (!isStagePanning.value) {
    return;
  }

  isStagePanning.value = false;
  cleanupStagePanListeners();
};

const handleMouseDown = (event) => {
  if (!imgLoaded.value) return;

  if (event.button === 1) {
    // 在 crop 覆盖层里保留中键平移画布，避免进入裁剪模式后无法导航。
    event.preventDefault();
    isStagePanning.value = true;
    stagePanLast.value = { x: event.clientX, y: event.clientY };
    window.addEventListener("mousemove", handleStagePanMove);
    window.addEventListener("mouseup", handleStagePanEnd);
    return;
  }

  if (event.button !== 0) {
    return;
  }

  const p = getCanvasPoint(event);
  dragStart.value = p;
  selection.value = { x: p.x, y: p.y, w: 0, h: 0 };
  isDragging.value = true;
  drawCanvas();
};

const handleMouseMove = (event) => {
  if (!isDragging.value) return;
  const p = getCanvasPoint(event);
  selection.value = normalizeRect(
    dragStart.value.x,
    dragStart.value.y,
    p.x,
    p.y
  );
  drawCanvas();
};

const handleMouseUp = () => {
  if (!isDragging.value) return;
  isDragging.value = false;

  if (
    selection.value &&
    (selection.value.w < MIN_CROP_SIZE || selection.value.h < MIN_CROP_SIZE)
  ) {
    selection.value = null;
  }

  drawCanvas();
};

const handleWheel = (event) => {
  // 覆盖层自己不处理缩放，只把原始滚轮信息转发给 Konva 画布。
  emit("stage-wheel", {
    clientX: event.clientX,
    clientY: event.clientY,
    deltaX: event.deltaX,
    deltaY: event.deltaY,
    ctrlKey: event.ctrlKey,
    shiftKey: event.shiftKey,
  });
};

const syncDisplaySizeFromFrame = (preserveSelection = true) => {
  // 画布缩放只会改变覆盖层显示尺寸，不应该重新加载图片；
  // 若已有选区，则按比例同步到新尺寸上。
  const nextWidth = Math.max(Math.round(Number(props.frame?.width) || 0), 1);
  const nextHeight = Math.max(Math.round(Number(props.frame?.height) || 0), 1);

  const prevWidth = Math.max(displayWidth.value || 0, 1);
  const prevHeight = Math.max(displayHeight.value || 0, 1);

  if (preserveSelection && selection.value) {
    const scaleX = nextWidth / prevWidth;
    const scaleY = nextHeight / prevHeight;
    selection.value = {
      x: selection.value.x * scaleX,
      y: selection.value.y * scaleY,
      w: selection.value.w * scaleX,
      h: selection.value.h * scaleY,
    };
  }

  displayWidth.value = nextWidth;
  displayHeight.value = nextHeight;
};

const loadImage = async () => {
  imgLoaded.value = false;
  selection.value = null;

  if (!props.imageSrc) return;
  if (!hasFrame.value) return;

  const img = new Image();
  img.crossOrigin = "anonymous";

  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = reject;
    img.src = props.imageSrc;
  }).catch(() => null);

  if (!img.width || !img.height) return;

  imageObj.value = img;
  naturalWidth.value = img.width;
  naturalHeight.value = img.height;

  syncDisplaySizeFromFrame(false);

  imgLoaded.value = true;
  await nextTick();
  drawCanvas();
};

const handleConfirm = () => {
  if (!imgLoaded.value || !imageObj.value) return;
  if (!selection.value) return;

  const sx = naturalWidth.value / displayWidth.value;
  const sy = naturalHeight.value / displayHeight.value;

  const sourceX = Math.round(selection.value.x * sx);
  const sourceY = Math.round(selection.value.y * sy);
  const sourceW = Math.max(Math.round(selection.value.w * sx), 1);
  const sourceH = Math.max(Math.round(selection.value.h * sy), 1);

  const finalW = Math.min(sourceW, naturalWidth.value - sourceX);
  const finalH = Math.min(sourceH, naturalHeight.value - sourceY);

  if (finalW < 1 || finalH < 1) return;

  const outCanvas = document.createElement("canvas");
  outCanvas.width = finalW;
  outCanvas.height = finalH;

  const outCtx = outCanvas.getContext("2d");
  if (!outCtx) return;

  outCtx.drawImage(
    imageObj.value,
    sourceX,
    sourceY,
    finalW,
    finalH,
    0,
    0,
    finalW,
    finalH
  );

  let dataUrl = "";
  try {
    dataUrl = outCanvas.toDataURL("image/png");
  } catch (error) {
    return;
  }

  emit("confirm", { dataUrl });
};

watch(
  () => props.visible,
  (visible) => {
    if (visible) {
      loadImage();
    }
  }
);

watch(
  () => props.imageSrc,
  () => {
    if (props.visible && props.imageSrc) {
      loadImage();
    }
  }
);

watch(
  () => [props.frame?.width, props.frame?.height],
  async () => {
    if (!props.visible || !imgLoaded.value || !hasFrame.value) {
      return;
    }

    syncDisplaySizeFromFrame(true);
    await nextTick();
    drawCanvas();
  }
);

watch(
  () => props.visible,
  (visible) => {
    if (!visible) {
      isDragging.value = false;
      handleStagePanEnd();
    }
  }
);

onBeforeUnmount(() => {
  handleStagePanEnd();
});
</script>

<style scoped>
.crop-overlay {
  position: absolute;
  inset: 0;
  background: rgba(15, 23, 42, 0.14);
  z-index: 1300;
  /* 空白区域不拦截事件，让底层画布仍可继续接收交互。 */
  pointer-events: none;
}

.crop-toolbar {
  position: absolute;
  max-width: min(320px, calc(100% - 32px));
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 12px 32px rgba(15, 23, 42, 0.18);
  padding: 14px;
  pointer-events: auto;
  will-change: transform;
}

.crop-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 8px;
}

.size-info {
  font-size: 12px;
  color: #909399;
  margin-bottom: 8px;
}

.analyze-tip {
  font-size: 12px;
  color: #606266;
  margin-bottom: 10px;
  line-height: 1.5;
  background: #f5f7fa;
  border: 1px solid #ebeef5;
  border-radius: 6px;
  padding: 8px 10px;
}

.crop-frame {
  position: absolute;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.65), 0 12px 28px rgba(15, 23, 42, 0.18);
  background: rgba(255, 255, 255, 0.2);
  pointer-events: auto;
  will-change: transform, width, height;
}

.crop-canvas {
  display: block;
  width: 100%;
  height: 100%;
  cursor: crosshair;
}

.crop-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 12px;
}

.btn {
  height: 32px;
  padding: 0 12px;
  border-radius: 8px;
  border: 1px solid #dcdfe6;
  background: #fff;
  color: #303133;
  cursor: pointer;
}

.btn.primary {
  border-color: #409eff;
  background: #409eff;
  color: #fff;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
