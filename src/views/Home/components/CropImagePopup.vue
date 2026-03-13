<template>
  <div v-if="visible" class="crop-popup-mask" @click.self="$emit('cancel')">
    <div class="crop-popup">
      <div class="crop-title">Crop Image</div>

      <div v-if="imgLoaded" class="size-info">
        原图尺寸: {{ naturalWidth }} x {{ naturalHeight }}，拖拽鼠标在原图上画矩形进行裁剪
      </div>

      <div v-if="imgLoaded" class="crop-canvas-wrap">
        <canvas
          ref="cropCanvasRef"
          class="crop-canvas"
          @mousedown="handleMouseDown"
          @mousemove="handleMouseMove"
          @mouseup="handleMouseUp"
          @mouseleave="handleMouseUp"
        ></canvas>
      </div>

      <div class="crop-actions">
        <button class="btn" type="button" @click="$emit('cancel')">取消</button>
        <button class="btn primary" type="button" :disabled="!selection" @click="handleConfirm">确认</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { nextTick, ref, watch } from "vue";

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  imageSrc: {
    type: String,
    default: "",
  },
});

const emit = defineEmits(["confirm", "cancel"]);

const MAX_CANVAS_WIDTH = 720;
const MAX_CANVAS_HEIGHT = 420;
const MIN_CROP_SIZE = 8;

const imageObj = ref(null);
const imgLoaded = ref(false);
const naturalWidth = ref(0);
const naturalHeight = ref(0);
const displayWidth = ref(0);
const displayHeight = ref(0);

const cropCanvasRef = ref(null);

const isDragging = ref(false);
const dragStart = ref({ x: 0, y: 0 });
const selection = ref(null);

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

const handleMouseDown = (event) => {
  if (!imgLoaded.value) return;
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

const loadImage = async () => {
  imgLoaded.value = false;
  selection.value = null;

  if (!props.imageSrc) return;

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

  const scale = Math.min(
    MAX_CANVAS_WIDTH / img.width,
    MAX_CANVAS_HEIGHT / img.height,
    1
  );

  displayWidth.value = Math.round(img.width * scale);
  displayHeight.value = Math.round(img.height * scale);

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
</script>

<style scoped>
.crop-popup-mask {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
  z-index: 1300;
  display: flex;
  align-items: center;
  justify-content: center;
}

.crop-popup {
  width: 780px;
  max-width: calc(100% - 24px);
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.2);
  padding: 14px;
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

.crop-canvas-wrap {
  display: flex;
  justify-content: center;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  background: #fafafa;
  padding: 10px;
}

.crop-canvas {
  display: block;
  max-width: 100%;
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
