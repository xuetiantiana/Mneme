const enPopupTexts = {
  whisper: {
    placeholder: "Speech will be converted to text automatically, or you can type manually.",
    addMemoryHint: "Tip: Generating PCM usually takes 2-3 minutes. Please wait patiently.",
    uploadImage: "Upload Image",
    previewAlt: "memory preview",
    whisperHint: "After entering text, the current segment image will be analyzed again and nearby bubbles will be updated.",
    stopRecording: "Stop Recording",
    startRecording: "Start Recording",
    generatingPcm: "Generating PCM...",
    analyzing: "Analyzing...",
    confirmAnalysis: "Confirm Analysis",
    submit: "Submit",
    cancel: "Cancel",
    addMemoryLoadingHint: "PCM is being generated and may take 2-3 minutes. Please do not close the popup or submit again.",
    recordingHint: "Recording and recognizing...",
    pausedHint: "Recognition paused. You can continue.",
    speechUnsupported: "Speech recognition is not supported in the current browser. Please type manually.",
    microphonePermissionDenied: "Microphone permission was denied. Please allow microphone access in the browser address bar and try again.",
    microphoneUnavailable: "No available microphone was detected, or it is being used by another application.",
    insecureContext: "The current page is not a secure context, so the browser will not allow microphone access. Please use localhost or https.",
    recordingStartFailed: "Failed to start recording. Please check browser microphone permissions and try again.",
  },
  crop: {
    title: "Crop on Canvas",
    sizeInfo: "Original size: {width} x {height}. Please crop directly on the current main image.",
    analyzeTip: "The crop area only applies to the currently selected image. After confirmation, the API will be called and segments and bubbles will be created around the main image.",
    cancel: "Cancel",
    analyzing: "Analyzing...",
    confirmAndAnalyze: "Confirm and Analyze",
  },
};

export default enPopupTexts;