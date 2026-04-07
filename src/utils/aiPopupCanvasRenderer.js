import Konva from "konva";

/**
 * @typedef {Object} AiPopupSelectionPayload
 * @property {"Reflect"|"Constellate"|"Resonance"} [toolType]
 * @property {string} [title]
 * @property {Array<any>} [selectedItems]
 */

// Reflect 只会确认一条问题卡片，这里取第一条有效项即可；
// Constellate / Resonance 的批量场景则直接保留整组 items。
const getFirstValidItem = (items) => {
  if (!Array.isArray(items)) {
    return null;
  }

  return items.find(Boolean) || null;
};

const AI_POPUP_THEME = {
  Reflect: {
    kind: "content",
    groupName: "ai-content-node reflect-content-node",
    borderColor: "#f59e0b",
    labelColor: "#000000",
    labelBg: "#fff7ed",
    bodyBg: "#fffdf7",
    reasonColor: "#78716c",
  },
  Constellate: {
    kind: "content",
    groupName: "ai-content-node constellate-content-node",
    borderColor: "#8cc5ff",
    labelColor: "#000000",
    labelBg: "#eff6ff",
    bodyBg: "#ffffff",
    reasonColor: "#475569",
  },
  Resonance: {
    kind: "resonance",
    groupName: "resonance-result-group",
    bg: "#ffffff",
    stroke: "#dbe7fb",
    kindColor: "#475569",
    keywordColor: "#1d4ed8",
    textColor: "#334155",
    actionTextColor: "#475569",
    actionBg: "#f8fafc",
    actionBorder: "#e2e8f0",
  },
};

const normalizeSelectedItems = (selectedItems) => {
  return Array.isArray(selectedItems) ? selectedItems.filter(Boolean) : [];
};

// 根据 AI 引导线的起终点，计算“内容卡片应该贴在线端外侧”的矩形位置。
// 返回值既包含中心点，也包含 top-left，便于单卡片和多卡片堆叠两种场景复用。
export const getAiGuidePlacementRectFromLinePoints = (linePoints, boxWidth, boxHeight) => {
  if (!Array.isArray(linePoints) || linePoints.length < 4) {
    return null;
  }

  const startX = Number(linePoints[0]) || 0;
  const startY = Number(linePoints[1]) || 0;
  const endX = Number(linePoints[2]) || 0;
  const endY = Number(linePoints[3]) || 0;
  const dx = endX - startX;
  const dy = endY - startY;
  const currentLength = Math.sqrt(dx * dx + dy * dy);
  const halfWidth = boxWidth / 2;
  const halfHeight = boxHeight / 2;

  let unitX = 0;
  let unitY = 0;
  if (currentLength > 0) {
    unitX = dx / currentLength;
    unitY = dy / currentLength;
  }

  const d1 = unitX !== 0 ? Math.abs(halfWidth / unitX) : Infinity;
  const d2 = unitY !== 0 ? Math.abs(halfHeight / unitY) : Infinity;
  const distanceToEdge = Math.min(d1, d2);
  const centerX = endX + unitX * distanceToEdge;
  const centerY = endY + unitY * distanceToEdge;

  return {
    centerX,
    centerY,
    offsetX: halfWidth,
    offsetY: halfHeight,
    topLeftX: centerX - halfWidth,
    topLeftY: centerY - halfHeight,
  };
};

// 创建 Reflect 内容卡片。
// 输入保持为 Reflect 接口返回的原始 selectedItems；
// 这里会从首条问题项中读取 text 和 memory 来组织卡片内容。
export const createReflectAiPopupContentGroup = ({
  title = "",
  selectedItems = [],
  fontFamily,
} = {}) => {
  const theme = AI_POPUP_THEME.Reflect;
  const group = new Konva.Group({
    draggable: true,
    name: theme.groupName,
    customType: "reflect_result_group",
  });

  let currentY = 0;
  const maxWidth = 220;
  const bodyPadding = 10;
  const imageContentWidth = maxWidth - bodyPadding * 2;
  const titleText = String(title || getFirstValidItem(selectedItems)?.text || "").trim();

  if (titleText) {
    const labelBg = new Konva.Rect({
      x: 0,
      y: currentY,
      width: maxWidth,
      height: 0,
      name: "ai-content-title-bg",
      fill: theme.labelBg,
      cornerRadius: [10, 10, 0, 0],
      listening: false,
    });

    const labelText = new Konva.Text({
      x: 0,
      y: currentY,
      text: titleText,
      fontSize: 15,
      fontFamily,
      fill: theme.labelColor,
      padding: bodyPadding,
      width: maxWidth,
      align: "left",
      fontStyle: "600",
      // Reflect 卡片确认后会把 Text/Image 扁平化到画布顶层，
      // 这里必须保留监听，后续这个标题文本才能被单独点击选中。
      listening: true,
    });

    labelBg.height(labelText.height());
    group.add(labelBg);
    group.add(labelText);
    currentY += labelText.height();
  }

  const bgNode = new Konva.Rect({
    x: 0,
    y: 0,
    name: "ai-content-body-bg",
    width: maxWidth,
    height: currentY > 0 ? currentY : 50,
    fill: theme.bodyBg,
    stroke: theme.borderColor,
    strokeWidth: 1,
    cornerRadius: 10,
    shadowColor: "rgba(15, 23, 42, 0.10)",
    shadowBlur: 10,
    shadowOffset: { x: 0, y: 4 },
  });

  group.add(bgNode);
  bgNode.moveToBottom();

  const imageLoadTasks = [];
  const reflectItem = getFirstValidItem(selectedItems);
  const imageItems = Array.isArray(reflectItem?.memory) ? reflectItem.memory : [];

  if (imageItems.length > 0) {
    // Reflect 改成更小的记忆缩略图网格：每行最多 4 张。
    const gridColumnCount = 4;
    const gridGap = 4;
    const imageToReasonGap = 3;
    const rowGap = 10;
    const imageCellWidth =
      (imageContentWidth - gridGap * (gridColumnCount - 1)) / gridColumnCount;
    const imageCellHeight = 40;
    const gridStartY = currentY + 8;

    const imageEntries = imageItems
      .map((item) => {
        const rawSrc = typeof item === "string" ? item : item?.image_url || "";
        const src = String(rawSrc || "").trim();
        if (!src) {
          return null;
        }

        const reasonTextValue =
          typeof item === "string" ? "" : String(item?.reason || "").trim();
        const reasonText = reasonTextValue
          ? new Konva.Text({
              x: 0,
              y: 0,
              text: reasonTextValue,
              fontSize: 10,
              fontFamily,
              fill: theme.reasonColor,
              width: imageCellWidth,
              lineHeight: 1.3,
              wrap: "word",
              // reason 文本扁平化后也需要保持可选中，不能关闭监听。
              listening: true,
            })
          : null;

        return {
          item,
          src,
          reasonText,
          reasonHeight: reasonText ? reasonText.height() : 0,
        };
      })
      .filter(Boolean);

    const rowHeights = [];
    imageEntries.forEach((entry, index) => {
      const rowIndex = Math.floor(index / gridColumnCount);
      const cellHeight =
        imageCellHeight +
        (entry.reasonText ? imageToReasonGap + entry.reasonHeight : 0);
      rowHeights[rowIndex] = Math.max(rowHeights[rowIndex] || 0, cellHeight);
    });

    const rowTops = [];
    let currentRowY = gridStartY;
    rowHeights.forEach((rowHeight, index) => {
      rowTops[index] = currentRowY;
      currentRowY += rowHeight + rowGap;
    });

    imageEntries.forEach((entry, index) => {
      const rowIndex = Math.floor(index / gridColumnCount);
      const columnIndex = index % gridColumnCount;
      const cellX = bodyPadding + columnIndex * (imageCellWidth + gridGap);
      const cellY = rowTops[rowIndex];

      if (entry.reasonText) {
        entry.reasonText.position({
          x: cellX,
          y: cellY + imageCellHeight + imageToReasonGap,
        });
        group.add(entry.reasonText);
      }

      const imageTask = new Promise((resolve) => {
        const imageObj = new Image();
        imageObj.onload = () => {
          const scale = Math.min(
            imageCellWidth / imageObj.width,
            imageCellHeight / imageObj.height
          );
          const imgWidth = imageObj.width * scale;
          const imgHeight = imageObj.height * scale;

          const konvaImage = new Konva.Image({
            x: cellX + (imageCellWidth - imgWidth) / 2,
            y: cellY + (imageCellHeight - imgHeight) / 2,
            image: imageObj,
            width: imgWidth,
            height: imgHeight,
            cornerRadius: 6,
            id: typeof entry.item === "string" ? undefined : entry.item?.image_id || undefined,
            customType:
              typeof entry.item === "string" ? undefined : entry.item?.customType || undefined,
          });
          group.add(konvaImage);
          resolve();
        };
        imageObj.onerror = () => resolve();
        imageObj.src = entry.src;
      });

      imageLoadTasks.push(imageTask);
    });

    if (rowHeights.length > 0) {
      const gridBottom = rowTops[rowHeights.length - 1] + rowHeights[rowHeights.length - 1];
      bgNode.height(Math.max(bgNode.height(), gridBottom + bodyPadding));
    }
  }

  return {
    group,
    bgNode,
    imageLoadTasks,
  };
};

// 创建 Constellate 内容卡片。
// 输入保持为 Constellate 接口返回的原始 selectedItems；
// 标题仍作为独立上下文保留，但卡片主体直接消费选中的原始图片项。
export const createConstellateAiPopupContentGroup = ({
  title = "",
  selectedItems = [],
  fontFamily,
} = {}) => {
  const theme = AI_POPUP_THEME.Constellate;
  const group = new Konva.Group({
    draggable: true,
    name: theme.groupName,
    customType: "constellate_result_group",
  });

  let currentY = 0;
  const maxWidth = 220;
  const bodyPadding = 10;
  const imageContentWidth = maxWidth - bodyPadding * 2;
  const titleText = String(title || "").trim();

  if (titleText) {
    const labelBg = new Konva.Rect({
      x: 0,
      y: currentY,
      width: maxWidth,
      height: 0,
      name: "ai-content-title-bg",
      fill: theme.labelBg,
      cornerRadius: [10, 10, 0, 0],
      listening: false,
    });

    const labelText = new Konva.Text({
      x: 0,
      y: currentY,
      text: titleText,
      fontSize: 15,
      fontFamily,
      fill: theme.labelColor,
      padding: bodyPadding,
      width: maxWidth,
      align: "left",
      fontStyle: "normal",
      // Constellate 标题在落画布后会变成独立文本节点，
      // 保留监听才能参与 stage 委托选中。
      listening: true,
    });

    labelBg.height(labelText.height());
    group.add(labelBg);
    group.add(labelText);
    currentY += labelText.height();
  }

  const bgNode = new Konva.Rect({
    x: 0,
    y: 0,
    name: "ai-content-body-bg",
    width: maxWidth,
    height: currentY > 0 ? currentY : 50,
    fill: theme.bodyBg,
    stroke: theme.borderColor,
    strokeWidth: 1,
    cornerRadius: 10,
    shadowColor: "rgba(15, 23, 42, 0.10)",
    shadowBlur: 10,
    shadowOffset: { x: 0, y: 4 },
  });

  group.add(bgNode);
  bgNode.moveToBottom();

  const imageLoadTasks = [];

  if (Array.isArray(selectedItems) && selectedItems.length > 0) {
    // Constellate 改为更紧凑的缩略图网格：每行最多 3 张，
    // 这样同一轮检索结果能在一个卡片里更集中地展示。
    const gridColumnCount = 3;
    const gridGap = 6;
    const imageToReasonGap = 4;
    const rowGap = 12;
    const imageCellWidth =
      (imageContentWidth - gridGap * (gridColumnCount - 1)) / gridColumnCount;
    const imageCellHeight = 72;
    const gridStartY = currentY + 8;

    const imageEntries = selectedItems
      .map((item) => {
        const rawSrc = typeof item === "string" ? item : item?.image_url || "";
        const src = String(rawSrc || "").trim();
        if (!src) {
          return null;
        }

        const reasonTextValue =
          typeof item === "string" ? "" : String(item?.reason || "").trim();
        const reasonText = reasonTextValue
          ? new Konva.Text({
              x: 0,
              y: 0,
              text: reasonTextValue,
              fontSize: 11,
              fontFamily,
              fill: theme.reasonColor,
              width: imageCellWidth,
              lineHeight: 1.35,
              wrap: "word",
              // 图片说明文本需要允许点击，否则用户只能选中图片本身。
              listening: true,
            })
          : null;

        return {
          item,
          src,
          reasonText,
          reasonHeight: reasonText ? reasonText.height() : 0,
        };
      })
      .filter(Boolean);

    const rowHeights = [];
    imageEntries.forEach((entry, index) => {
      const rowIndex = Math.floor(index / gridColumnCount);
      const cellHeight =
        imageCellHeight +
        (entry.reasonText ? imageToReasonGap + entry.reasonHeight : 0);
      rowHeights[rowIndex] = Math.max(rowHeights[rowIndex] || 0, cellHeight);
    });

    const rowTops = [];
    let currentRowY = gridStartY;
    rowHeights.forEach((rowHeight, index) => {
      rowTops[index] = currentRowY;
      currentRowY += rowHeight + rowGap;
    });

    imageEntries.forEach((entry, index) => {
      const rowIndex = Math.floor(index / gridColumnCount);
      const columnIndex = index % gridColumnCount;
      const cellX = bodyPadding + columnIndex * (imageCellWidth + gridGap);
      const cellY = rowTops[rowIndex];

      if (entry.reasonText) {
        entry.reasonText.position({
          x: cellX,
          y: cellY + imageCellHeight + imageToReasonGap,
        });
        group.add(entry.reasonText);
      }

      const imageTask = new Promise((resolve) => {
        const imageObj = new Image();
        imageObj.onload = () => {
          const scale = Math.min(
            imageCellWidth / imageObj.width,
            imageCellHeight / imageObj.height
          );
          const imgWidth = imageObj.width * scale;
          const imgHeight = imageObj.height * scale;

          const konvaImage = new Konva.Image({
            x: cellX + (imageCellWidth - imgWidth) / 2,
            y: cellY + (imageCellHeight - imgHeight) / 2,
            image: imageObj,
            width: imgWidth,
            height: imgHeight,
            cornerRadius: 6,
            id: typeof entry.item === "string" ? undefined : entry.item?.image_id || undefined,
            customType:
              typeof entry.item === "string" ? undefined : entry.item?.customType || undefined,
          });
          group.add(konvaImage);
          resolve();
        };
        imageObj.onerror = () => resolve();
        imageObj.src = entry.src;
      });

      imageLoadTasks.push(imageTask);
    });

    if (rowHeights.length > 0) {
      const gridBottom = rowTops[rowHeights.length - 1] + rowHeights[rowHeights.length - 1];
      bgNode.height(Math.max(bgNode.height(), gridBottom + bodyPadding));
    }
  }

  return {
    group,
    bgNode,
    imageLoadTasks,
  };
};

// 创建 Resonance 分析卡片。
// Resonance 的视觉结构和 Reflect / Constellate 不同，
// 因此单独维护一个构建函数，组件层只负责把若干张卡片按 AI 引导线方向堆叠摆放。
export const createAiPopupResonanceGroup = ({
  resonanceItem,
  position,
  fontFamily,
} = {}) => {
  const theme = AI_POPUP_THEME.Resonance;
  const mainText = String(resonanceItem?.text || resonanceItem?.keyword || "").trim();
  if (!mainText) {
    return null;
  }

  const kind = String(resonanceItem?.kind || "analysis").trim();
  const keyword = String(resonanceItem?.keyword || "").trim();
  const cardWidth = 280;
  const cardPadding = 12;
  const bodyWidth = cardWidth - cardPadding * 2;
  const group = new Konva.Group({
    x: position?.x || 0,
    y: position?.y || 0,
    draggable: true,
    name: theme.groupName,
    customType: "resonance_result_group",
  });

  const cardBg = new Konva.Rect({
    x: 0,
    y: 0,
    name: "resonance-card-bg",
    width: cardWidth,
    height: 80,
    fill: theme.bg,
    stroke: theme.stroke,
    strokeWidth: 1,
    cornerRadius: 10,
    shadowColor: "rgba(15, 23, 42, 0.08)",
    shadowBlur: 8,
    shadowOffset: { x: 0, y: 2 },
  });
  group.add(cardBg);

  let currentY = cardPadding;

  const kindText = new Konva.Text({
    x: cardPadding,
    y: currentY,
    text: kind,
    fontSize: 12,
    fontFamily,
    fill: theme.kindColor,
    draggable: false,
    listening: false,
  });
  group.add(kindText);
  currentY += kindText.height() + 8;

  if (keyword) {
    const keywordText = new Konva.Text({
      x: cardPadding,
      y: currentY,
      text: keyword,
      fontSize: 13,
      fontFamily,
      fill: theme.keywordColor,
      width: bodyWidth,
      wrap: "word",
      draggable: false,
      listening: false,
    });
    group.add(keywordText);
    currentY += keywordText.height() + 8;
  }

  const mainTextNode = new Konva.Text({
    x: cardPadding,
    y: currentY,
    text: mainText,
    fontSize: 13,
    fontFamily,
    fill: theme.textColor,
    width: bodyWidth,
    lineHeight: 1.6,
    wrap: "word",
    draggable: false,
    listening: false,
  });
  group.add(mainTextNode);
  currentY += mainTextNode.height();

  cardBg.height(currentY + cardPadding);
  return group;
};

// 对外统一的“弹窗确认后落画布”入口。
// 这里不再依赖画布组件内部的具体挂载 helper 命名，
// 而是把三种工具的数据都先归一化，再交给画布组件暴露的统一渲染 API。
export const drawAiPopupSelectionToCanvas = (
  /** @type {AiPopupSelectionPayload} */
  { toolType = "Reflect", title = "", selectedItems = [] } = {},
  konvaApi
) => {
  if (!konvaApi || typeof konvaApi.renderAiPopupSelectionToLayer !== "function") {
    return {
      success: false,
      message: "AI 内容绘制失败，画布未准备好",
    };
  }

  const items = normalizeSelectedItems(selectedItems);

  if (!items.length) {
    return {
      success: false,
      message:
        toolType === "Resonance"
          ? "请至少选择一条分析结果后再确认"
          : "请先选择至少一项内容后再确认",
    };
  }

  if (toolType === "Resonance") {
    const nodes = items
      .map((item) =>
        createAiPopupResonanceGroup({
          resonanceItem: item,
          position: { x: 0, y: 0 },
          fontFamily: "Georgia, serif",
        })
      )
      .filter(Boolean);

    return konvaApi.renderAiPopupSelectionToLayer({
      toolType: "Resonance",
      title: String(title || "").trim(),
      layoutMode: "resonance-stack",
      nodes,
      rowGap: 16,
    });
  }

  if (toolType === "Constellate") {
    const { group, imageLoadTasks } = createConstellateAiPopupContentGroup({
      title,
      selectedItems: items,
      fontFamily: "Georgia, serif",
    });

    return konvaApi.renderAiPopupSelectionToLayer({
      toolType: "Constellate",
      layoutMode: "content",
      nodes: group ? [group] : [],
      imageLoadTasks,
      flattenToNodes: true,
      autoSelectOnFlatten: true,
    });
  }

  if (toolType === "Reflect") {
    const { group, imageLoadTasks } = createReflectAiPopupContentGroup({
      title,
      selectedItems: items,
      fontFamily: "Georgia, serif",
    });

    return konvaApi.renderAiPopupSelectionToLayer({
      toolType: "Reflect",
      layoutMode: "content",
      nodes: group ? [group] : [],
      imageLoadTasks,
      flattenToNodes: true,
      autoSelectOnFlatten: false,
    });
  }

  return {
    success: false,
    message: "AI 内容绘制失败，未知的工具类型",
  };
};