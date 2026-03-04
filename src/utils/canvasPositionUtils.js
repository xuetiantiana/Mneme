/**
 * 获取气泡颜色，根据类型和个人特异性数值返回渐变颜色
 * @param {string} type - 类型：aesthetic（审美）, emotion（情感）, sensory（感官）, value（价值&个人意义）
 * @param {number} specificity - 个人特异性数值（1-5）
 * @returns {string} 返回颜色字符串
 */
export const getBubbleColor = (type, specificity) => {
  // 定义每种类型的颜色范围（从低到高）
  const colorRanges = {
    aesthetic: {
      low: { r: 255, g: 250, b: 240 }, // 浅米色
      high: { r: 245, g: 222, b: 179 }, // 深米色
    },
    emotion: {
      low: { r: 255, g: 240, b: 245 }, // 浅粉色
      high: { r: 255, g: 105, b: 180 }, // 深粉色
    },
    sensory: {
      low: { r: 248, g: 248, b: 242 }, // 浅米色
      high: { r: 193, g: 205, b: 193 }, // 深绿色
    },
    meaning: {
      low: { r: 240, g: 248, b: 255 }, // 浅蓝色
      high: { r: 176, g: 224, b: 230 }, // 深蓝色
    },
  };

  // 默认颜色
  const defaultRange = {
    low: { r: 240, g: 240, b: 240 },
    high: { r: 200, g: 200, b: 200 },
  };

  const range = colorRanges[type] || defaultRange;
  const ratio = (specificity - 1) / 4; // 转换为 0-1 范围

  // 计算渐变颜色
  const r = Math.round(range.low.r + (range.high.r - range.low.r) * ratio);
  const g = Math.round(range.low.g + (range.high.g - range.low.g) * ratio);
  const b = Math.round(range.low.b + (range.high.b - range.low.b) * ratio);

  return `rgb(${r}, ${g}, ${b})`;
};

/**
 * 创建包含图片和文本的 Konva 节点数组
 * 这是主要的工具函数，用于创建 PCM（图片+标题）组合节点
 * @param {Object} params - 参数对象
 * @param {string} params.imageSrc - 图片 URL
 * @param {string} params.text - 文本内容（标题），如果为空则不创建文本节点
 * @param {string} params.id - 节点 ID
 * @param {Object} options - 配置选项
 * @param {number} options.startX - 主图 X 坐标，默认 0
 * @param {number} options.startY - 主图 Y 坐标，默认 0
 * @param {number} options.mainImageWidth - 主图最大宽度，默认 200
 * @param {number} options.mainImageHeight - 主图最大高度，默认 200
 * @param {number} options.titleGap - 标题与主图的间距，默认 20
 * @param {number} options.fontSize - 文本字体大小，默认 14
 * @param {string} options.fontFamily - 文本字体，默认 'Arial'
 * @param {string} options.fill - 文本颜色，默认 '#000000'
 * @param {string} options.backgroundColor - 文本背景颜色，可选
 * @param {number} options.padding - 背景内边距，默认 5
 * @param {number} options.cornerRadius - 背景圆角，默认 4
 * @param {boolean} options.center - 是否以 (startX, startY) 为中心点，默认 false
 * @returns {Promise<Array<Konva.Node>>} 返回 Promise，解析为包含 Konva.Image 和（可选的）Konva.Text 或 Konva.Group 的数组
 */
export const createImageAndTextNodes = (
  { imageSrc, text, id },
  options = {}
) => {
  const {
    startX = 0,
    startY = 0,
    mainImageWidth = 200,
    mainImageHeight = 200,
    titleGap = 10,
    fontSize = 14,
    fontFamily = "Arial",
    fill = "#333",
    backgroundColor,
    padding = 5,
    cornerRadius = 4,
    center = false,
  } = options;

  return new Promise((resolve, reject) => {
    if (!imageSrc) {
      reject(new Error("imageSrc is required"));
      return;
    }

    const imgObj = new Image();
    imgObj.crossOrigin = "anonymous";
    imgObj.onerror = (error) => {
      console.error("Image load error:", error);
      reject(error);
    };
    imgObj.onload = () => {
      try {
        const ratio = Math.min(
          mainImageWidth / imgObj.width
          // mainImageHeight / imgObj.height
        );
        const width = imgObj.width * ratio;
        const height = imgObj.height * ratio;

        let imageX = startX;
        let imageY = startY;
        if (center) {
          imageX = startX - width / 2;
          imageY = startY - height / 2;
        }

        const konvaImage = new Konva.Image({
          image: imgObj,
          x: imageX,
          y: imageY,
          width,
          height,
          draggable: true,
          id: id || "",
          cornerRadius: 10,
        });

        if (text) {
          createTextNode(
            { text, id },
            {
              startX: imageX,
              startY: imageY + height + titleGap,
              fontSize,
              fontFamily,
              fill,
              backgroundColor,
              padding,
              cornerRadius,
              width,
              align: "center",
            }
          )
            .then((konvaText) => {
              resolve([konvaImage, konvaText]);
            })
            .catch((error) => {
              reject(error);
            });
        } else {
          resolve([konvaImage]);
        }
      } catch (error) {
        reject(error);
      }
    };
    imgObj.src = imageSrc;
  });
};

/**
 * 创建气泡 Konva 节点
 * @param {Object} params - 参数对象
 * @param {string} params.text - 文本内容
 * @param {string} params.id - 节点 ID
 * @param {Object} options - 配置选项
 * @param {number} options.startX - 文本 X 坐标，默认 0
 * @param {number} options.startY - 文本 Y 坐标，默认 0
 * @param {number} options.fontSize - 字体大小，默认 13
 * @param {string} options.fontFamily - 字体，默认 'Arial'
 * @param {string} options.fill - 文本颜色，默认 '#000000'
 * @param {string} options.backgroundColor - 背景颜色，可选
 * @param {number} options.padding - 背景内边距，默认 5
 * @param {number} options.cornerRadius - 背景圆角，默认 4
 * @param {boolean} options.center - 是否以 (startX, startY) 为中心点，默认 false
 * @param {boolean} options.isBubble - 是否为气泡样式，true 时显示圆形气泡带阴影，false 时显示普通矩形背景或纯文本，默认 false
 * @returns {Promise<Konva.Node>} 返回 Promise，解析为 Konva.Text 或 Konva.Group 对象
 */
export const createTextNode = ({ text, id }, options = {}) => {
  const {
    startX = 0,
    startY = 0,
    fontSize = 13,
    fontFamily = "Arial",
    fill = "#333",
    backgroundColor,
    padding = 5,
    cornerRadius = 4,
    width,
    align = "left",
    center = false,
    isBubble = false,
  } = options;

  return new Promise((resolve, reject) => {
    try {
      const konvaText = new Konva.Text({
        x: 0,
        y: 0,
        text: text || "",
        fontSize,
        fontFamily,
        fill,
        draggable: false,
        id: id || "",
        width: width || undefined,
        lineHeight: 1.4,
        align,
      });

      if (backgroundColor) {
        const textWidth = konvaText.width();
        const textHeight = konvaText.height();
        const size = Math.max(textWidth, textHeight) + padding * 2;
        const setWidth = isBubble ? size : textWidth + padding * 2;
        const setHeight = isBubble ? size : textHeight + padding * 2;
        const background = new Konva.Rect({
          x: 0,
          y: 0,
          width: setWidth,
          height: setHeight,
          fill: backgroundColor,
          cornerRadius: isBubble ? size / 2 : cornerRadius,
          draggable: false,
        });

        const group = new Konva.Group({
          x: startX,
          y: startY,
          draggable: true,
          id: id || "",
        });

        group.add(background);
        group.add(konvaText);

        konvaText.x((setWidth - textWidth) / 2);
        konvaText.y((setHeight - textHeight) / 2);

        konvaText.on("textChange", () => {
          const newWidth = konvaText.width();
          const newHeight = konvaText.height();
          const newSize = Math.max(newWidth, newHeight) + padding * 2;
          background.width(newSize);
          background.height(newSize);
          background.cornerRadius(newSize / 2);
          konvaText.x((newSize - newWidth) / 2);
          konvaText.y((newSize - newHeight) / 2);
        });

        if (center) {
          const groupWidth = background.width();
          const groupHeight = background.height();
          group.x(startX - groupWidth / 2);
          group.y(startY - groupHeight / 2);
        }

        resolve(group);
      } else {
        konvaText.x(startX);
        konvaText.y(startY);
        konvaText.draggable(true);

        if (center) {
          const textWidth = konvaText.width();
          const textHeight = konvaText.height();
          konvaText.x(startX - textWidth / 2);
          konvaText.y(startY - textHeight / 2);
        }

        resolve(konvaText);
      }
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * 创建 interpretations 文本节点数组
 * 为每个 interpretation 创建一个文本节点
 * @param {Object} interpretations - interpretations 对象，包含多个数组（meaning, emotion, sensory, aesthetic）
 * @param {Object} options - 配置选项
 * @param {number} options.imageX - 图片 X 坐标，默认 0
 * @param {number} options.imageY - 图片 Y 坐标，默认 0
 * @param {number} options.imageWidth - 图片宽度，默认 200
 * @param {number} options.imageHeight - 图片高度，默认 200
 * @param {number} options.horizontalGap - 图片与文本之间的水平间距，默认 15
 * @param {number} options.verticalGap - 文本节点之间的垂直间距，默认 70
 * @param {number} options.fontSize - 字体大小，默认 12
 * @param {string} options.fontFamily - 字体，默认 'Arial'
 * @param {string} options.fill - 文本颜色，默认 '#666666'
 * @param {string} options.backgroundColor - 背景颜色，可选
 * @param {number} options.padding - 背景内边距，默认 5
 * @param {number} options.cornerRadius - 背景圆角，默认 4
 * @param {number} options.width - 文本宽度，可选
 * @returns {Promise<Array<Konva.Node>>} 返回 Promise，解析为包含所有文本节点的数组
 */
export const createInterpretationTextNodes = (
  interpretations,
  options = {}
) => {
  const {
    imageX = 0,
    imageY = 0,
    imageWidth = 200,
    imageHeight = 200,
    horizontalGap = 15,
    verticalGap = 70,
    fontSize = 12,
    fontFamily = "Arial",
    fill = "#333",
    backgroundColor,
    padding = 5,
    cornerRadius = 4,
    width,
  } = options;

  return new Promise((resolve, reject) => {
    if (!interpretations || typeof interpretations !== "object") {
      reject(new Error("interpretations must be an object"));
      return;
    }

    try {
      const interpretationArray = [];

      Object.keys(interpretations).forEach((type) => {
        const items = interpretations[type];
        if (Array.isArray(items)) {
          items.forEach((item) => {
            interpretationArray.push({
              ...item,
              type,
            });
          });
        }
      });

      if (interpretationArray.length === 0) {
        resolve([]);
        return;
      }

      const textNodes = [];
      const startX = imageX + imageWidth + horizontalGap;
      const totalTextHeight = interpretationArray.length * verticalGap;
      let currentY = imageY + (imageHeight - totalTextHeight) / 2;

      interpretationArray.forEach((interpretation) => {
        const { id, text, specificity, type } = interpretation;

        const textContent = specificity ? `${text}` : text;

        createTextNode(
          { text: textContent, id },
          {
            startX,
            startY: currentY,
            backgroundColor: getBubbleColor(type, specificity),
            padding,
            cornerRadius,
            isBubble: true,
            align: "center",
            width: 60,
          }
        )
          .then((konvaText) => {
            textNodes.push(konvaText);

            if (textNodes.length === interpretationArray.length) {
              resolve(textNodes);
            }
          })
          .catch((error) => {
            reject(error);
          });

        currentY += verticalGap;
      });
    } catch (error) {
      reject(error);
    }
  });
};
