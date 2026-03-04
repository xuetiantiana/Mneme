import Konva from "konva";
import { createBubbleNode } from "./canvasPositionUtils";

const getImageProxyUrl = (url) => {
  return url.replace("http://localhost:8000/api/images/data", "/data/PCM2");
};

// 全局悬浮按钮元素，用于图片 hover 时显示
let hoverButton = null;

/**
 * 创建悬浮操作按钮
 * 如果按钮已存在则直接返回，避免重复创建
 * @returns {HTMLButtonElement} 返回创建的按钮元素
 */
const createHoverButton = () => {
  // 如果按钮已存在，直接返回已有按钮
  if (hoverButton) return hoverButton;

  // 创建按钮元素
  const button = document.createElement("button");
  button.textContent = "操作";
  // 设置按钮样式：固定定位、蓝色背景、圆角等
  button.style.cssText = `
    position: fixed;
    z-index: 9999;
    padding: 6px 12px;
    background: #1890ff;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
    display: none;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    transition: background 0.2s;
  `;
  // 鼠标进入按钮时高亮显示
  button.addEventListener("mouseenter", () => {
    button.style.background = "#40a9ff";
  });
  // 鼠标离开按钮时恢复默认颜色
  button.addEventListener("mouseleave", () => {
    button.style.background = "#1890ff";
  });
  // 将按钮添加到 body 中，使用 fixed 定位脱离画布
  document.body.appendChild(button);
  hoverButton = button;
  return button;
};

/**
 * 显示悬浮按钮在图片内部的右上角
 * @param {Konva.Stage} stage - Konva 舞台实例，用于获取容器位置
 * @param {Konva.Image} konvaImage - 当前 hover 的图片节点
 * @param {Object} data - initMainImages 传入的原始数据，点击按钮时传递给回调
 * @param {Function} onButtonClick - 点击按钮时的回调函数，接收 (data, node) 两个参数
 */
const showHoverButton = (stage, konvaImage, data, onButtonClick) => {
  // 检查图片是否已扩展，已扩展则不显示按钮
  const isExpanded = konvaImage.getAttr("isExpanded");
  if (isExpanded) {
    hideHoverButton();
    return;
  }

  const button = createHoverButton();
  // 获取画布容器在视口中的位置信息
  const containerRect = stage.container().getBoundingClientRect();

  // 获取图片的绝对位置（考虑缩放、平移等变换）
  const absPos = konvaImage.getAbsolutePosition();
  const imageWidth = konvaImage.width();

  // 获取按钮的实际尺寸
  const buttonWidth = button.offsetWidth || 40;
  const buttonHeight = button.offsetHeight || 28;

  // 计算按钮位置：图片内部的右上角，向内偏移 8px
  const buttonX = containerRect.left + absPos.x + imageWidth - buttonWidth - 8;
  const buttonY = containerRect.top + absPos.y + 8;

  // 设置按钮位置并显示
  button.style.left = `${buttonX}px`;
  button.style.top = `${buttonY}px`;
  button.style.display = "block";

  // 绑定点击事件，点击时调用传入的回调函数并传递 data 和 node 参数
  button.onclick = () => {
    if (onButtonClick && typeof onButtonClick === "function") {
      // 标记图片为已扩展
      konvaImage.setAttr("isExpanded", true);
      onButtonClick(data, konvaImage);
      // 点击后隐藏按钮
      hideHoverButton();
    }
  };
};

/**
 * 隐藏悬浮按钮
 * 清除按钮的点击事件处理器
 */
const hideHoverButton = () => {
  if (hoverButton) {
    hoverButton.style.display = "none";
    hoverButton.onclick = null;
  }
};

/**
 * 初始化主图片节点
 * @param {Object} data - 包含 mainImages 数组的数据对象
 * @param {Object} options - 配置选项
 * @param {number} options.offsetX - X 轴偏移量，默认为 0
 * @param {number} options.offsetY - Y 轴偏移量，默认为 0
 * @param {Konva.Stage} options.stage - Konva 舞台实例，用于添加鼠标交互事件
 * @param {Function} options.onButtonClick - 悬浮按钮点击回调函数，接收 (data, node) 两个参数
 * @returns {Promise<Konva.Image[]>} 返回创建的图片节点数组
 */
export const initMainImages = (data, options = {}) => {
  console.log("!!!", data);
  const {
    offsetX = 0,
    offsetY = 0,
    stage = null,
    onButtonClick = null,
  } = options;
  return new Promise((resolve, reject) => {
    if (!data) {
      reject(new Error("data is required"));
      return;
    }

    const { mainImages } = data;

    try {
      if (mainImages && Array.isArray(mainImages) && mainImages.length > 0) {
        let loadedCount = 0;
        const totalImages = mainImages.length;
        const nodes = [];

        mainImages.forEach((imgData, index) => {
          const x = imgData.layout.x || 0;
          const y = imgData.layout.y || 0;
          const w = imgData.layout.w || 200;
          const h = imgData.layout.h || 200;
          const rotation = imgData.layout.rotation || 0;
          const z_index = imgData.layout.z_index || index + 1;
          const url = getImageProxyUrl(imgData.image_url || "");

          const imgObj = new Image();
          imgObj.crossOrigin = "anonymous";
          imgObj.onerror = (error) => {
            console.error("Image load error:", error);
            loadedCount++;
            if (loadedCount === totalImages) {
              resolve(nodes);
            }
          };
          imgObj.onload = () => {
            try {
              const ratio = imgObj.height / imgObj.width;
              const calculatedHeight = w * ratio;

              const konvaImage = new Konva.Image({
                image: imgObj,
                x: x - w / 2 + offsetX,
                y: y - calculatedHeight / 2 + offsetY,
                width: w,
                height: calculatedHeight,
                rotation,
                draggable: true,
                id: `main_image_${index}`,
                zIndex: z_index,
                stroke: "#f1f1f1",
                strokeWidth: 8,
                cornerRadius: 10,
              });

              // 如果传入了 stage 实例，为图片添加鼠标交互事件
              if (stage) {
                // 鼠标进入图片时，显示悬浮操作按钮
                konvaImage.on("mouseenter", () => {
                  showHoverButton(stage, konvaImage, data, onButtonClick);
                });

                // 鼠标离开图片时，如果目标不是按钮本身，则隐藏按钮
                konvaImage.on("mouseleave", (e) => {
                  const relatedTarget = e.evt.relatedTarget;
                  if (relatedTarget !== hoverButton) {
                    hideHoverButton();
                  }
                });

                // 图片拖动时，如果按钮正在显示，则更新按钮位置跟随图片
                konvaImage.on("dragmove", () => {
                  if (hoverButton && hoverButton.style.display === "block") {
                    showHoverButton(stage, konvaImage, data, onButtonClick);
                  }
                });
              }

              nodes.push(konvaImage);

              loadedCount++;
              if (loadedCount === totalImages) {
                // 所有图片加载完成后，添加标题文字
                if (data.title) {
                  const titleNode = createTitleNode(
                    data.title,
                    mainImages,
                    offsetX,
                    offsetY
                  );
                  if (titleNode) {
                    nodes.push(titleNode);
                  }
                }
                resolve(nodes);
              }
            } catch (error) {
              console.error("Failed to create Konva image:", error);
              loadedCount++;
              if (loadedCount === totalImages) {
                // 所有图片加载完成后，添加标题文字
                if (data.title) {
                  const titleNode = createTitleNode(
                    data.title,
                    mainImages,
                    offsetX,
                    offsetY
                  );
                  if (titleNode) {
                    nodes.push(titleNode);
                  }
                }
                resolve(nodes);
              }
            }
          };
          imgObj.src = url;
        });
      } else {
        resolve([]);
      }
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * 创建标题文字节点，显示在图片下方
 * @param {string} title - 标题文字
 * @param {Array} mainImages - 主图片数组
 * @param {number} offsetX - X 轴偏移量
 * @param {number} offsetY - Y 轴偏移量
 * @returns {Konva.Text} 返回创建的文字节点
 */
const createTitleNode = (title, mainImages, offsetX, offsetY) => {
  if (!title || !mainImages || mainImages.length === 0) {
    return null;
  }

  // 计算所有图片的中心点位置
  let totalX = 0;
  let totalY = 0;
  let maxBottom = -Infinity;

  mainImages.forEach((imgData) => {
    const x = imgData.layout.x || 0;
    const y = imgData.layout.y || 0;
    const w = imgData.layout.w || 200;
    const h = imgData.layout.h || 200;
    totalX += x;
    totalY += y;

    // 计算图片底部位置（考虑高度）
    const ratio = h / w;
    const calculatedHeight = w * ratio;
    const bottom = y + calculatedHeight / 2;
    if (bottom > maxBottom) {
      maxBottom = bottom;
    }
  });

  const centerX = totalX / mainImages.length + offsetX;
  const titleY = maxBottom + offsetY + 20; // 在图片下方 20px 处

  const titleNode = new Konva.Text({
    text: title,
    x: centerX,
    y: titleY,
    fontSize: 14,
    fontFamily: "Arial",
    fill: "#333",
    // fontStyle: 'bold',
    align: "center",
    draggable: true,
    id: "main_title",
    zIndex: 100,
  });

  // 设置文字宽度并计算居中的 x 位置
  const textWidth = Math.min(titleNode.width(), 300);
  titleNode.width(textWidth);
  // 通过调整 x 坐标实现居中，而不是使用 offsetX
  titleNode.x(centerX - textWidth / 2);

  return titleNode;
};

export const initSegmentsImages = (data, options = {}) => {
  const { offsetX = 0, offsetY = 0 } = options;

  return new Promise((resolve, reject) => {
    if (!data) {
      reject(new Error("data is required"));
      return;
    }

    const { segments, layout } = data;

    try {
      if (segments && Array.isArray(segments) && segments.length > 0) {
        let loadedCount = 0;
        let totalImages = 0;

        segments.forEach((segment) => {
          if (segment.image_url) {
            totalImages++;
          }
        });

        if (totalImages === 0) {
          resolve([]);
          return;
        }

        const nodes = [];
        const bubblePromises = [];

        segments.forEach((segment, index) => {
          if (!segment.image_url) {
            return;
          }

          const layoutData = segments[index].layout || {};
          const x = layoutData.x || 0;
          const y = layoutData.y || 0;
          const w = layoutData.w || 150;
          const h = layoutData.h || 150;
          const rotation = layoutData.rotation || 0;
          const z_index = layoutData.z_index || index + 1;

          const imgObj = new Image();
          imgObj.crossOrigin = "anonymous";
          imgObj.onerror = (error) => {
            console.error("Segment image load error:", error);
            loadedCount++;
            if (loadedCount === totalImages) {
              Promise.all(bubblePromises)
                .then((bubbleNodesArrays) => {
                  const allBubbleNodes = bubbleNodesArrays.flat();
                  resolve([...nodes, ...allBubbleNodes]);
                })
                .catch(() => {
                  resolve(nodes);
                });
            }
          };
          imgObj.onload = () => {
            try {
              const ratio = imgObj.height / imgObj.width;
              const calculatedHeight = w * ratio;

              const konvaImage = new Konva.Image({
                image: imgObj,
                x: x - w / 2 + offsetX,
                y: y - calculatedHeight / 2 + offsetY,
                width: w,
                height: calculatedHeight,
                rotation,
                draggable: true,
                id: `segment_image_${segment.seg_id}`,
                zIndex: z_index,
                cornerRadius: 10,
              });

              nodes.push(konvaImage);

              loadedCount++;
              if (loadedCount === totalImages) {
                Promise.all(bubblePromises)
                  .then((bubbleNodesArrays) => {
                    const allBubbleNodes = bubbleNodesArrays.flat();
                    resolve([...nodes, ...allBubbleNodes]);
                  })
                  .catch(() => {
                    resolve(nodes);
                  });
              }
            } catch (error) {
              console.error("Failed to create segment Konva image:", error);
              loadedCount++;
              if (loadedCount === totalImages) {
                Promise.all(bubblePromises)
                  .then((bubbleNodesArrays) => {
                    const allBubbleNodes = bubbleNodesArrays.flat();
                    resolve([...nodes, ...allBubbleNodes]);
                  })
                  .catch(() => {
                    resolve(nodes);
                  });
              }
            }
          };
          imgObj.src = getImageProxyUrl(segment.image_url);

          if (segment.bubbles && Array.isArray(segment.bubbles)) {
            bubblePromises.push(
              initPCMBubbles(segment.bubbles, { offsetX, offsetY })
            );
          }
        });
      } else {
        resolve([]);
      }
    } catch (error) {
      reject(error);
    }
  });
};

export const initPCMBubbles = (bubbles, options = {}) => {
  const { offsetX = 0, offsetY = 0 } = options;

  return new Promise((resolve, reject) => {
    if (!bubbles || !Array.isArray(bubbles)) {
      resolve([]);
      return;
    }

    try {
      const nodes = [];
      let completedCount = 0;
      const totalBubbles = bubbles.length;

      bubbles.forEach((bubble, bubbleIndex) => {
        const x = (bubble.x || 0) + offsetX;
        const y = (bubble.y || 0) + offsetY;
        const radius = bubble.radius || 50;
        const fill = bubble.fill || "rgba(255, 255, 255, 0.9)";
        const stroke = bubble.stroke || "#333";
        const strokeWidth = bubble.strokeWidth || 2;
        const z_index = bubble.z_index || bubbleIndex + 1;

        // const konvaCircle = new Konva.Circle({
        //   x,
        //   y,
        //   radius,
        //   fill,
        //   stroke,
        //   strokeWidth,
        //   draggable: true,
        //   id: `bubble_${bubbleIndex}`,
        //   zIndex: z_index
        // })

        // nodes.push(konvaCircle)

        if (bubble.text) {
          createBubbleNode(
            { text: bubble.text, id: `bubble_text_${bubbleIndex}` },
            {
              startX: x,
              startY: y,
              fontSize: bubble.fontSize || 14,
              fontFamily: bubble.fontFamily || "Arial",
              fill: bubble.textColor || "#333",
              backgroundColor: bubble.textBackgroundColor,
              padding: bubble.textPadding || 5,
              cornerRadius: bubble.textCornerRadius || 4,
              center: true,
              backgroundColor: bubble.color,
            }
          )
            .then((textNode) => {
              nodes.push(textNode);
              completedCount++;
              if (completedCount === totalBubbles) {
                resolve(nodes);
              }
            })
            .catch((error) => {
              console.error("Failed to create bubble text:", error);
              completedCount++;
              if (completedCount === totalBubbles) {
                resolve(nodes);
              }
            });
        } else {
          completedCount++;
          if (completedCount === totalBubbles) {
            resolve(nodes);
          }
        }
      });
    } catch (error) {
      reject(error);
    }
  });
};
