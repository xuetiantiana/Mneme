import Konva from "konva";

/**
 * @typedef {Object} AiPopupSelectionPayload
 * @property {"Reflect"|"Constellate"|"Resonance"} [toolType="Reflect"]
 *   AI 工具类型。Reflect 会消费首条有效项，Constellate / Resonance 会消费全部有效项。
 * @property {string} [title=""]
 *   弹窗确认时传入的标题文本。Reflect 可回退到首条问题项的 text，其余工具按原值透传。
 * @property {Array<any>} [selectedItems=[]]
 *   弹窗中被确认选中的结果列表。函数内部会先过滤掉空项，再按不同 toolType 转成画布节点。
 * @property {boolean} [preserveAiAssist=false]
 *   是否在内容落到画布后保留当前 AI 环状态。为 true 时，只新增节点，不主动清理 ring / tool 状态；
 *   为 false 时，交由画布侧按默认流程结束本次 AI assist。
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
    stroke: "#cbdcf8",
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

const setAiPopupLocalPosition = (node, x, y) => {
  node.setAttr("aiPopupLocalX", x);
  node.setAttr("aiPopupLocalY", y);
  node.position({ x, y });
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

// 创建 Reflect 节点。
// isReturnGroup 为 true 时，返回只包含一个 group 的数组；
// 否则直接返回文本、图片节点数组。
export const createReflectAiPopupNodes = ({
  title = "",
  selectedItems = [],
  isReturnGroup = false,
  fontFamily,
} = {}) => {
  const theme = AI_POPUP_THEME.Reflect;
  const group = isReturnGroup
    ? new Konva.Group({
        draggable: true,
        name: theme.groupName,
        customType: "reflect_result_group",
      })
    : null;
  const nodesList = [];

  let currentY = 0;
  const maxWidth = 220;
  const bodyPadding = 10;
  const imageContentWidth = maxWidth - bodyPadding * 2;
  const titleText = String(title || getFirstValidItem(selectedItems)?.text || "").trim();

  if (titleText) {
    const titleNode = new Konva.Text({
      x: 0,
      y: currentY,
      text: titleText,
      fontSize: 15,
      fontFamily,
      fill: theme.labelColor,
      padding: isReturnGroup ? bodyPadding : 0,
      width: maxWidth,
      align: "left",
      fontStyle: "600",
      listening: true,
      draggable: !isReturnGroup,
      customType: "reflect_result_text",
    });

    if (group) {
      const labelBg = new Konva.Rect({
        x: 0,
        y: currentY,
        width: maxWidth,
        height: titleNode.height(),
        name: "ai-content-title-bg",
        fill: theme.labelBg,
        cornerRadius: [10, 10, 0, 0],
        listening: false,
      });
      group.add(labelBg);
      group.add(titleNode);
    } else {
      setAiPopupLocalPosition(titleNode, 0, currentY);
      nodesList.push(titleNode);
    }

    currentY += titleNode.height();
  }

  const bgNode = group
    ? new Konva.Rect({
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
      })
    : null;

  if (group && bgNode) {
    group.add(bgNode);
    bgNode.moveToBottom();
  }

  const imageLoadTasks = [];
  const reflectItem = getFirstValidItem(selectedItems);
  const imageItems = Array.isArray(reflectItem?.memory) ? reflectItem.memory : [];
  let contentHeight = Math.max(currentY, 50);

  if (imageItems.length > 0) {
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
        entry.reasonText.draggable(!isReturnGroup);
        entry.reasonText.setAttr("customType", "reflect_result_reason");
        setAiPopupLocalPosition(
          entry.reasonText,
          cellX,
          cellY + imageCellHeight + imageToReasonGap
        );
        if (group) {
          group.add(entry.reasonText);
        } else {
          nodesList.push(entry.reasonText);
        }
      }

      const imageNode = new Konva.Image({
        x: cellX,
        y: cellY,
        width: imageCellWidth,
        height: imageCellHeight,
        cornerRadius: 6,
        draggable: !isReturnGroup,
        id: typeof entry.item === "string" ? undefined : entry.item?.image_id || undefined,
        customType:
          typeof entry.item === "string" ? "reflect_result_image" : entry.item?.customType || "reflect_result_image",
      });
      setAiPopupLocalPosition(imageNode, cellX, cellY);
      if (group) {
        group.add(imageNode);
      } else {
        nodesList.push(imageNode);
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

          imageNode.image(imageObj);
          imageNode.size({
            width: imgWidth,
            height: imgHeight,
          });
          setAiPopupLocalPosition(
            imageNode,
            cellX + (imageCellWidth - imgWidth) / 2,
            cellY + (imageCellHeight - imgHeight) / 2
          );
          resolve();
        };
        imageObj.onerror = () => resolve();
        imageObj.src = entry.src;
      });

      imageLoadTasks.push(imageTask);
    });

    if (rowHeights.length > 0) {
      const gridBottom = rowTops[rowHeights.length - 1] + rowHeights[rowHeights.length - 1];
      contentHeight = Math.max(contentHeight, gridBottom + bodyPadding);
      if (bgNode) {
        bgNode.height(Math.max(bgNode.height(), contentHeight));
      }
    }
  }

  const resultNodes = group ? [group] : nodesList;
  resultNodes.imageLoadTasks = imageLoadTasks;
  resultNodes.contentWidth = maxWidth;
  resultNodes.contentHeight = contentHeight;
  return resultNodes;
};

// 创建 Constellate 的独立文本/图片节点。
// 不再额外包一层卡片 group，也不再依赖边框背景，
// 只返回最终会直接落到画布上的 Text / Image 节点。
export const createConstellateAiPopupNodes = ({
  title = "",
  selectedItems = [],
  isReturnGroup = false,
  fontFamily,
} = {}) => {
  const theme = AI_POPUP_THEME.Constellate;
  const group = isReturnGroup
    ? new Konva.Group({
        draggable: true,
        name: theme.groupName,
        customType: "constellate_result_group",
      })
    : null;
  const nodesList = [];
  let currentY = 0;
  const maxWidth = 220;
  const bodyPadding = 10;
  const imageContentWidth = maxWidth - bodyPadding * 2;
  const titleText = String(title || "").trim();

  if (titleText) {
    const titleNode = new Konva.Text({
      x: 0,
      y: currentY,
      text: titleText,
      fontSize: 15,
      fontFamily,
      fill: theme.labelColor,
      width: maxWidth,
      align: "left",
      fontStyle: "normal",
      listening: true,
      draggable: !isReturnGroup,
      customType: "constellate_result_text",
    });

    setAiPopupLocalPosition(titleNode, 0, currentY);
    if (group) {
      titleNode.draggable(false);
      group.add(titleNode);
    } else {
      nodesList.push(titleNode);
    }
    currentY += titleNode.height() + 12;
  }

  const imageLoadTasks = [];
  let contentHeight = currentY;

  if (Array.isArray(selectedItems) && selectedItems.length > 0) {
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
        entry.reasonText.draggable(!isReturnGroup);
        entry.reasonText.setAttr("customType", "constellate_result_reason");
        setAiPopupLocalPosition(
          entry.reasonText,
          cellX,
          cellY + imageCellHeight + imageToReasonGap
        );
        if (group) {
          group.add(entry.reasonText);
        } else {
          nodesList.push(entry.reasonText);
        }
      }

      const imageNode = new Konva.Image({
        x: cellX,
        y: cellY,
        width: imageCellWidth,
        height: imageCellHeight,
        cornerRadius: 6,
        draggable: !isReturnGroup,
        id: typeof entry.item === "string" ? undefined : entry.item?.image_id || undefined,
        customType:
          typeof entry.item === "string" ? "constellate_result_image" : entry.item?.customType || "constellate_result_image",
      });
      setAiPopupLocalPosition(imageNode, cellX, cellY);
      if (group) {
        group.add(imageNode);
      } else {
        nodesList.push(imageNode);
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
          const imageX = cellX + (imageCellWidth - imgWidth) / 2;
          const imageY = cellY + (imageCellHeight - imgHeight) / 2;

          imageNode.image(imageObj);
          imageNode.size({
            width: imgWidth,
            height: imgHeight,
          });
          setAiPopupLocalPosition(imageNode, imageX, imageY);
          resolve();
        };
        imageObj.onerror = () => resolve();
        imageObj.src = entry.src;
      });

      imageLoadTasks.push(imageTask);
    });

    if (rowHeights.length > 0) {
      const gridBottom = rowTops[rowHeights.length - 1] + rowHeights[rowHeights.length - 1];
      contentHeight = Math.max(contentHeight, gridBottom + bodyPadding);
    }
  }

  const resultNodes = group ? [group] : nodesList;
  resultNodes.imageLoadTasks = imageLoadTasks;
  resultNodes.contentWidth = maxWidth;
  resultNodes.contentHeight = contentHeight;
  return resultNodes;
};

// 创建单个 Resonance 分析卡片 group。
// 每个 analysis 结果都对应一个独立 group，方便选中和拖拽。
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
  group.setAttr("selectAsTextWrapperGroup", true);

  const cardBg = new Konva.Rect({
    x: 0,
    y: 0,
    name: "resonance-card-bg",
    width: cardWidth,
    height: 80,
    fill: theme.bg,
    stroke: theme.stroke,
    strokeWidth: 1.5,
    cornerRadius: 12,
    shadowColor: "rgba(148, 163, 184, 0.18)",
    shadowBlur: 12,
    shadowOffset: { x: 0, y: 4 },
    listening: true,
    draggable: false,
    customType: "resonance_result_bg",
  });

  let currentY = cardPadding;

  const kindText = new Konva.Text({
    x: cardPadding,
    y: currentY,
    text: kind,
    fontSize: 12,
    fontFamily,
    fill: theme.kindColor,
    draggable: false,
    listening: true,
    customType: "resonance_result_kind",
  });
  currentY += kindText.height() + 8;

  let keywordText = null;
  if (keyword) {
    keywordText = new Konva.Text({
      x: cardPadding,
      y: currentY,
      text: keyword,
      fontSize: 13,
      fontFamily,
      fill: theme.keywordColor,
      width: bodyWidth,
      wrap: "word",
      draggable: false,
      listening: true,
      customType: "resonance_result_keyword",
    });
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
    listening: true,
    customType: "resonance_result_text",
  });
  currentY += mainTextNode.height();

  const cardHeight = currentY + cardPadding;
  cardBg.height(cardHeight);

  group.add(cardBg);
  cardBg.moveToBottom();
  group.add(kindText);
  if (keywordText) {
    group.add(keywordText);
  }
  group.add(mainTextNode);
  group.setAttr("contentWidth", cardWidth);
  group.setAttr("contentHeight", cardHeight);
  return group;
};

// 创建 Resonance 节点。
// 每个选中项都会返回一个独立 group，createResonanceAiPopupNodes 只负责批量堆叠这些 group。
export const createResonanceAiPopupNodes = ({
  title = "",
  selectedItems = [],
  isReturnGroup = true,
  fontFamily,
} = {}) => {
  const rowGap = 16;
  const resultNodes = [];
  let stackTop = 0;

  normalizeSelectedItems(selectedItems).forEach((resonanceItem) => {
    const group = createAiPopupResonanceGroup({
      resonanceItem,
      position: { x: 0, y: stackTop },
      fontFamily,
    });

    if (!group) {
      return;
    }

    setAiPopupLocalPosition(group, 0, stackTop);
    resultNodes.push(group);
    stackTop += (Number(group.getAttr("contentHeight")) || 0) + rowGap;
  });

  resultNodes.imageLoadTasks = [];
  resultNodes.contentWidth = 280;
  resultNodes.contentHeight = Math.max(0, stackTop - (resultNodes.length > 0 ? rowGap : 0));
  resultNodes.title = title;
  return resultNodes;
};

/**
 * 对外统一的“弹窗确认后落画布”入口。
 * 这里不再依赖画布组件内部的具体挂载 helper 命名，
 * 而是把三种工具的数据都先归一化，再交给画布组件暴露的统一渲染 API。
 *
 * @param {AiPopupSelectionPayload} payload
 *   弹窗确认后的标准化入参。
 * @param {"Reflect"|"Constellate"|"Resonance"} [payload.toolType="Reflect"]
 *   当前确认来源的 AI 工具。
 * @param {string} [payload.title=""]
 *   卡片标题；不同工具会按各自展示规则决定是否使用。
 * @param {Array<any>} [payload.selectedItems=[]]
 *   需要被渲染到画布上的原始结果项。
 * @param {boolean} [payload.preserveAiAssist=false]
 *   是否保留当前 AI assist 的 ring 与工具状态。
 *   常见场景是“确认后只新增节点，但不销毁环”，这时传 true。
 * @param {{ renderAiPopupSelectionToLayer?: Function }} konvaApi
 *   画布组件暴露出来的渲染 API 集合；当前至少需要 renderAiPopupSelectionToLayer。
 * @returns {{ success: boolean, message?: string }}
 *   统一返回成功标记；失败时会附带可直接给 UI 使用的提示文案。
 */
export const drawAiPopupSelectionToCanvas = (
  { toolType = "Reflect", title = "", selectedItems = [], preserveAiAssist = false } = {},
  konvaApi
) => {
    console.log("drawAiPopupSelectionToCanvas called with:", {
      toolType,
      title,
      selectedItems,
      preserveAiAssist,
    });

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
    const nodes = createResonanceAiPopupNodes({
      title: String(title || "").trim(),
      selectedItems: items,
      isReturnGroup: true,
      fontFamily: "Georgia, serif",
    });

    return konvaApi.renderAiPopupSelectionToLayer({
      toolType: "Resonance",
      layoutMode: "resonance-stack",
      nodes,
      imageLoadTasks: nodes.imageLoadTasks,
      contentWidth: nodes.contentWidth,
      contentHeight: nodes.contentHeight,
      flattenToNodes: false,
      preserveAiAssist,
    });
  }

  if (toolType === "Constellate") {
    const nodes = createConstellateAiPopupNodes({
      title,
      selectedItems: items,
      isReturnGroup: false,
      fontFamily: "Georgia, serif",
    });

    return konvaApi.renderAiPopupSelectionToLayer({
      toolType: "Constellate",
      layoutMode: "constellate-direct",
      nodes,
      imageLoadTasks: nodes.imageLoadTasks,
      contentWidth: nodes.contentWidth,
      contentHeight: nodes.contentHeight,
      preserveAiAssist,
    });
  }

  if (toolType === "Reflect") {
    const nodes = createReflectAiPopupNodes({
      title,
      selectedItems: items,
      isReturnGroup: true,
      fontFamily: "Georgia, serif",
    });

    return konvaApi.renderAiPopupSelectionToLayer({
      toolType: "Reflect",
      layoutMode: "content",
      nodes,
      imageLoadTasks: nodes.imageLoadTasks,
      contentWidth: nodes.contentWidth,
      contentHeight: nodes.contentHeight,
      flattenToNodes: true,
      autoSelectOnFlatten: false,
      preserveAiAssist,
    });
  }

  return {
    success: false,
    message: "AI 内容绘制失败，未知的工具类型",
  };
};