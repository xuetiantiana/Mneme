import Konva from "konva";
import {
    createImageAndTextNodes,
    createTextNode,
    getBubbleColor,
    DEFAULT_FONT_FAMILY,
} from "./canvasPositionUtils";

export const getImageProxyUrl = (url) => {
    if (!url) return "";
    const isDev = Boolean(import.meta.env?.DEV);

    // 生产/打包环境直接使用原图地址，不走代理。
    if (!isDev) {
        return url;
    }

    // 如果是 Azure 图片，使用代理
    if (url.includes("azurewebsites.net")) {
        const path = url.split("azurewebsites.net")[1];
        return `/azure${path}`;
    }

    // 如果是 trae-api-cn.mchost.guru 图片，使用代理
    if (url.includes("trae-api-cn.mchost.guru")) {
        const path = url.split("trae-api-cn.mchost.guru")[1];
        return `/image-proxy${path}`;
    }

    return url;
};

// 全局 Konva 按钮组，用于图片 hover 时显示
let hoverButtonGroup = null;

/**
 * 创建 Konva 悬浮操作按钮
 * @param {Konva.Layer} layer - 所在的图层
 * @returns {Konva.Group} 返回创建的按钮组
 */
const createHoverButtonGroup = (layer) => {
    // 如果已存在且未被销毁，则直接返回
    if (hoverButtonGroup && hoverButtonGroup.getStage())
        return hoverButtonGroup;

    const group = new Konva.Group({
        visible: false,
        listening: true,
        name: "hover-action-btn",
    });

    const rect = new Konva.Rect({
        width: 60,
        height: 28,
        fill: "#1890ff",
        cornerRadius: 4,
        shadowColor: "black",
        shadowBlur: 10,
        shadowOffset: { x: 0, y: 2 },
        shadowOpacity: 0.2,
    });

    const text = new Konva.Text({
        text: "Expand",
        fontSize: 12,
        fill: "white",
        width: 60,
        height: 28,
        align: "center",
        verticalAlign: "middle",
    });

    group.add(rect);
    group.add(text);

    // 悬浮效果
    group.on("mouseenter", () => {
        document.body.style.cursor = "pointer";
        rect.fill("#40a9ff");
        layer.batchDraw();
    });

    group.on("mouseleave", () => {
        document.body.style.cursor = "default";
        rect.fill("#1890ff");
        layer.batchDraw();
    });

    layer.add(group);
    hoverButtonGroup = group;
    return group;
};

/**
 * 显示悬浮按钮在图片内部的右上角
 * @param {Konva.Layer} layer - 当前图层
 * @param {Konva.Image} konvaImage - 当前 hover 的图片节点
 * @param {Object} data - initMainImages 传入的原始数据，点击按钮时传递给回调
 * @param {Function} onButtonClick - 点击按钮时的回调函数，接收 (data, node) 两个参数
 */
const showHoverButtonGroup = (layer, konvaImage, data, onButtonClick) => {
    // 检查图片是否已扩展，已扩展则不显示按钮
    const isExpanded = konvaImage.getAttr("isExpanded");
    if (isExpanded) {
        hideHoverButtonGroup();
        return;
    }

    const buttonGroup = createHoverButtonGroup(layer);

    // 获取图片的绝对位置和尺寸
    const imageX = konvaImage.x();
    const imageY = konvaImage.y();
    const imageWidth = konvaImage.width() * konvaImage.scaleX();

    // 计算按钮位置：图片内部的右上角，向内偏移 8px
    const buttonX = imageX + imageWidth - 60 - 8;
    const buttonY = imageY + 8;

    buttonGroup.position({ x: buttonX, y: buttonY });
    buttonGroup.visible(true);
    buttonGroup.moveToTop();
    layer.batchDraw();

    // 绑定点击事件
    buttonGroup.off("click tap"); // 先解绑旧事件
    buttonGroup.on("click tap", (e) => {
        e.cancelBubble = true; // 阻止冒泡
        if (onButtonClick && typeof onButtonClick === "function") {
            // 标记图片为已扩展
            konvaImage.setAttr("isExpanded", true);
            onButtonClick(data, konvaImage);
            // 点击后删除按钮
            hideHoverButtonGroup();
        }
    });
};

/**
 * 删除悬浮按钮
 */
const hideHoverButtonGroup = () => {
    if (hoverButtonGroup) {
        const layer = hoverButtonGroup.getLayer();
        hoverButtonGroup.destroy();
        hoverButtonGroup = null;
        if (layer) layer.batchDraw();
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
            if (
                mainImages &&
                Array.isArray(mainImages) &&
                mainImages.length > 0
            ) {
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
                                // id: `main_image_${data.id}_${index}`,
                                id: data.id,
                                customType: data.type, // 显式使用自定义属性
                                zIndex: z_index,
                                stroke: "#f1f1f1",
                                strokeWidth: 8,
                                cornerRadius: 10,
                            });

                            // 如果传入了 stage 实例，为图片添加鼠标交互事件
                            if (stage) {
                                // 获取 stage 所在的 layer，用于添加按钮
                                const layer = stage.getLayers()[0]; // 假设只有一个主要图层，或者可以传入 layer

                                // 鼠标进入图片时，显示悬浮操作按钮
                                konvaImage.on("mouseenter", () => {
                                    if (layer) {
                                        showHoverButtonGroup(
                                            layer,
                                            konvaImage,
                                            data,
                                            onButtonClick,
                                        );
                                    }
                                });

                                // 鼠标离开图片时，如果目标不是按钮本身，则隐藏按钮
                                konvaImage.on("mouseleave", (e) => {
                                    const pointerPos =
                                        stage.getPointerPosition();
                                    if (!pointerPos) return;

                                    // 获取鼠标位置下的所有形状
                                    const shapes =
                                        stage.getIntersection(pointerPos);

                                    // 检查是否在按钮组内
                                    let isOverButton = false;
                                    if (
                                        hoverButtonGroup &&
                                        hoverButtonGroup.visible()
                                    ) {
                                        // 简单判断：如果鼠标还在图片内或者在按钮范围内
                                        // 但这里 mouseleave 触发说明离开了图片
                                        // 我们需要检查是否进入了按钮
                                        // 由于 Konva 的事件机制，直接检查 pointerPos 是否在按钮 rect 内可能更准确
                                        const btnRect =
                                            hoverButtonGroup.getClientRect();
                                        if (
                                            pointerPos.x >= btnRect.x &&
                                            pointerPos.x <=
                                                btnRect.x + btnRect.width &&
                                            pointerPos.y >= btnRect.y &&
                                            pointerPos.y <=
                                                btnRect.y + btnRect.height
                                        ) {
                                            isOverButton = true;
                                        }
                                    }

                                    if (!isOverButton) {
                                        hideHoverButtonGroup();
                                    }
                                });

                                // 图片拖动时，如果按钮正在显示，则更新按钮位置跟随图片
                                konvaImage.on("dragmove", () => {
                                    if (
                                        hoverButtonGroup &&
                                        hoverButtonGroup.visible()
                                    ) {
                                        if (layer) {
                                            showHoverButtonGroup(
                                                layer,
                                                konvaImage,
                                                data,
                                                onButtonClick,
                                            );
                                        }
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
                                        offsetY,
                                    );
                                    if (titleNode) {
                                        nodes.push(titleNode);
                                    }
                                }
                                resolve(nodes);
                            }
                        } catch (error) {
                            console.error(
                                "Failed to create Konva image:",
                                error,
                            );
                            loadedCount++;
                            if (loadedCount === totalImages) {
                                // 所有图片加载完成后，添加标题文字
                                if (data.title) {
                                    const titleNode = createTitleNode(
                                        data.title,
                                        mainImages,
                                        offsetX,
                                        offsetY,
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
        fontFamily: DEFAULT_FONT_FAMILY,
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

export const initSegmentImagesItem = (segment, options = {}) => {
    const { offsetX = 0, offsetY = 0, initBubbles = true } = options;

    return new Promise((resolve, reject) => {
        if (!segment || !segment.image_url) {
            resolve({ images: [], bubbles: [] });
            return;
        }

        const layoutData = segment.layout || {};
        const x = layoutData.x || 0;
        const y = layoutData.y || 0;
        const w = layoutData.w || 150;
        const h = layoutData.h || 150;
        const rotation = layoutData.rotation || 0;
        const z_index = layoutData.z_index || 1;

        const imagePromise = createImageAndTextNodes(
            {
                imageSrc: getImageProxyUrl(segment.image_url),
                text: segment.label || "",
                // id: `segment_image_${segment.signifier_id}`,
                id: segment.id,
                customType: segment.type,
            },
            {
                startX: x + offsetX,
                startY: y + offsetY,
                mainImageWidth: w,
                mainImageHeight: h,
                rotation,
                fontSize: 14,
                fontFamily: DEFAULT_FONT_FAMILY,
                fill: "#333",
                center: true,
            },
        )
            .then((nodes) => {
                if (nodes instanceof Konva.Group) {
                    return [nodes];
                }
                return nodes;
            })
            .then((nodes) => {
                nodes.forEach((node) => {
                    if (node instanceof Konva.Image) {
                        node.rotation(rotation);
                        node.zIndex(z_index);
                    }
                });
                return nodes;
            })
            .catch((error) => {
                console.error("Failed to create segment Konva image:", error);
                return [];
            });

        const bubblePromise =
            initBubbles &&
            segment.layout.bubbles &&
            Array.isArray(segment.layout.bubbles)
                ? initPCMBubbles(segment.layout.bubbles, {
                      offsetX: x + offsetX,
                      offsetY: y + offsetY,
                  })
                : Promise.resolve([]);

        Promise.all([imagePromise, bubblePromise])
            .then(([nodes, bubbles]) => {
                const images = Array.isArray(nodes) ? nodes : [nodes];
                resolve({ images, bubbles });
            })
            .catch((error) => {
                resolve({ images: [], bubbles: [] });
            });
    });
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

                const segmentPromises = segments.map((segment) =>
                    initSegmentImagesItem(segment, { offsetX, offsetY }),
                );

                Promise.all(segmentPromises)
                    .then((results) => {
                        const allImages = [];
                        const allBubbles = [];
                        results.forEach((result) => {
                            allImages.push(...result.images);
                            allBubbles.push(...result.bubbles);
                        });
                        resolve([...allImages, ...allBubbles]);
                    })
                    .catch(() => {
                        resolve([]);
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
                    const hasColorSource =
                        (typeof bubble.textBackgroundColor === "string" &&
                            bubble.textBackgroundColor.trim().length > 0) ||
                        (typeof bubble.fill === "string" &&
                            bubble.fill.trim().length > 0) ||
                        (typeof bubble.kind === "string" &&
                            bubble.kind.trim().length > 0);

                    const bubbleBackgroundColor = hasColorSource
                        ? bubble.textBackgroundColor ||
                          bubble.fill ||
                          getBubbleColor(bubble.kind, bubble.specificity)
                        : "#000";

                    const bubbleTextColor = hasColorSource
                        ? bubble.textColor || "#333"
                        : "#fff";

                    createTextNode(
                        {
                            text: bubble.text,
                            id: bubble.id,
                            customType: bubble.type || "bubble",
                        },
                        {
                            startX: x,
                            startY: y,
                            fontSize: bubble.fontSize || 14,
                            fontFamily:
                                bubble.fontFamily || DEFAULT_FONT_FAMILY,
                            fill: bubbleTextColor,
                            padding: bubble.textPadding || 5,
                            cornerRadius: bubble.textCornerRadius || 4,
                            center: true,
                            backgroundColor: bubbleBackgroundColor,
                            isBubble: false,
                            align: "center",
                            // width: 60,
                        },
                    )
                        .then((textNode) => {
                            nodes.push(textNode);
                            completedCount++;
                            if (completedCount === totalBubbles) {
                                resolve(nodes);
                            }
                        })
                        .catch((error) => {
                            console.error(
                                "Failed to create bubble text:",
                                error,
                            );
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
