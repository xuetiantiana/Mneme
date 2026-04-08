const zhPopupTexts = {
  whisper: {
    placeholder: "语音将自动转成文字，也可手动输入",
    addMemoryHint: "提示：生成 PCM 预计需要 2-3 分钟，请耐心等待。",
    uploadImage: "上传图片",
    previewAlt: "memory",
    whisperHint: "输入文字后会重新分析该 segment 图片，确认后将更新该图附近的泡泡。",
    stopRecording: "停止录音",
    startRecording: "开始录音",
    generatingPcm: "生成 PCM 中...",
    analyzing: "分析中...",
    confirmAnalysis: "确定分析",
    submit: "提交",
    cancel: "取消",
    addMemoryLoadingHint: "正在生成 PCM，预计 2-3 分钟，请勿关闭弹窗或重复提交。",
    recordingHint: "正在录音识别...",
    pausedHint: "识别已暂停，可继续",
    speechUnsupported: "当前浏览器不支持语音识别，请手动输入",
    microphonePermissionDenied: "麦克风权限被拒绝，请在浏览器地址栏中允许麦克风访问后重试。",
    microphoneUnavailable: "当前设备未检测到可用麦克风，或麦克风正被其他应用占用。",
    insecureContext: "当前页面不是安全上下文，浏览器不会开放麦克风。请使用 localhost 或 https 访问。",
    recordingStartFailed: "录音启动失败，请检查浏览器麦克风权限后重试。",
  },
  crop: {
    title: "Crop on Canvas",
    sizeInfo: "原图尺寸: {width} x {height}，请直接在当前主图上框选",
    analyzeTip: "裁剪范围仅作用于当前选中的这张图，确认后会调用接口并在主图周边生成 segment 与泡泡。",
    cancel: "取消",
    analyzing: "分析中...",
    confirmAndAnalyze: "确认并分析",
  },
};

export default zhPopupTexts;