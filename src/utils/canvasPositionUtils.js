/**
 * Canvas 位置计算和节点创建工具函数
 * 用于在 Konva Canvas 上计算元素位置和创建 Konva 节点
 */

/**
 * 计算 Canvas 上各元素的位置
 * @param {Object} options - 配置选项
 * @param {number} options.mainImageX - 主图 X 坐标，默认 0
 * @param {number} options.mainImageY - 主图 Y 坐标，默认 0
 * @param {number} options.mainImageWidth - 主图最大宽度，默认 200
 * @param {number} options.mainImageHeight - 主图最大高度，默认 200
 * @param {number} options.titleGap - 标题与主图的间距，默认 20
 * @returns {Object} 包含所有元素位置信息的对象
 */
export const calculateCanvasPositions = (options = {}) => {
  const {
    mainImageX = 0,
    mainImageY = 0,
    mainImageWidth = 200,
    mainImageHeight = 200,
    titleGap = 20
  } = options

  return {
    mainImageX,
    mainImageY,
    mainImageWidth,
    mainImageHeight,
    titleX: mainImageX,
    titleY: mainImageY + mainImageHeight + titleGap
  }
}

/**
 * 计算图片的缩放比例和实际尺寸
 * 保持图片宽高比，适应指定的最大宽高
 * @param {HTMLImageElement} imgObj - 图片对象
 * @param {number} maxWidth - 最大宽度
 * @param {number} maxHeight - 最大高度
 * @returns {Object} 包含比例和实际尺寸的对象
 * @returns {number} return.ratio - 缩放比例
 * @returns {number} return.width - 实际宽度
 * @returns {number} return.height - 实际高度
 */
export const calculateImageRatio = (imgObj, maxWidth, maxHeight) => {
  if (!imgObj || !imgObj.width || !imgObj.height) {
    return { ratio: 1, width: maxWidth, height: maxHeight }
  }

  const ratio = Math.min(maxWidth / imgObj.width, maxHeight / imgObj.height)
  const width = imgObj.width * ratio
  const height = imgObj.height * ratio

  return { ratio, width, height }
}

/**
 * 创建 Konva 图片节点的配置对象
 * @param {HTMLImageElement} imgObj - 图片对象
 * @param {Object} positions - 位置信息对象
 * @param {string} itemId - 节点 ID，默认为空字符串
 * @returns {Object} 包含配置和实际尺寸的对象
 * @returns {Object} return.config - Konva.Image 的配置对象
 * @returns {number} return.actualWidth - 实际宽度
 * @returns {number} return.actualHeight - 实际高度
 */
export const createKonvaImage = (imgObj, positions, itemId = '') => {
  const { mainImageX, mainImageY } = positions
  const { width, height } = calculateImageRatio(imgObj, positions.mainImageWidth, positions.mainImageHeight)

  return {
    config: {
      image: imgObj,
      x: mainImageX,
      y: mainImageY,
      width,
      height,
      draggable: true,
      id: itemId
    },
    actualWidth: width,
    actualHeight: height
  }
}

/**
 * 创建 Konva 文本节点的配置对象
 * @param {Object} positions - 位置信息对象
 * @param {string} title - 文本内容
 * @param {string} itemId - 节点 ID，默认为空字符串
 * @param {number|null} imageWidth - 图片实际宽度，用于设置文本宽度，可选
 * @returns {Object} 包含配置的对象
 * @returns {Object} return.config - Konva.Text 的配置对象
 */
export const createKonvaText = (positions, title, itemId = '', imageWidth = null) => {
  const { mainImageX, mainImageY, titleX, titleY } = positions
  const actualImageWidth = imageWidth || positions.mainImageWidth

  return {
    config: {
      x: titleX,
      y: mainImageY + (imageWidth ? positions.actualHeight : positions.mainImageHeight) + 10,
      text: title || '未命名',
      fontSize: 14,
      fontFamily: 'Arial',
      fill: '#000000',
      draggable: true,
      id: itemId,
      width: actualImageWidth,
      lineHeight: 1.4
    }
  }
}

/**
 * 加载图片并在加载完成后执行回调
 * @param {string} imageSrc - 图片 URL
 * @param {Function} onLoadCallback - 图片加载完成后的回调函数，接收图片对象作为参数
 * @returns {HTMLImageElement} 图片对象
 */
export const loadAndCreateImage = (imageSrc, onLoadCallback) => {
  const imgObj = new Image()
  imgObj.crossOrigin = 'anonymous'
  imgObj.onload = () => {
    onLoadCallback(imgObj)
  }
  imgObj.onerror = (error) => {
    console.error('Image load error:', error)
  }
  imgObj.src = imageSrc
  return imgObj
}

/**
 * 创建包含图片和文本的 Konva 节点数组
 * 这是主要的工具函数，用于创建 PCM（图片+标题）组合节点
 * @param {Object} params - 参数对象
 * @param {string} params.imageSrc - 图片 URL
 * @param {string} params.text - 文本内容（标题），如果为空则不创建文本节点
 * @param {string} params.id - 节点 ID
 * @param {Object} options - 配置选项
 * @param {number} options.mainImageX - 主图 X 坐标，默认 0
 * @param {number} options.mainImageY - 主图 Y 坐标，默认 0
 * @param {number} options.mainImageWidth - 主图最大宽度，默认 200
 * @param {number} options.mainImageHeight - 主图最大高度，默认 200
 * @param {number} options.titleGap - 标题与主图的间距，默认 20
 * @param {number} options.fontSize - 文本字体大小，默认 14
 * @param {string} options.fontFamily - 文本字体，默认 'Arial'
 * @param {string} options.fill - 文本颜色，默认 '#000000'
 * @param {string} options.backgroundColor - 文本背景颜色，可选
 * @param {number} options.padding - 背景内边距，默认 5
 * @param {number} options.cornerRadius - 背景圆角，默认 4
 * @returns {Promise<Array<Konva.Node>>} 返回 Promise，解析为包含 Konva.Image 和（可选的）Konva.Text 或 Konva.Group 的数组
 */
export const createImageAndTextNodes = ({ imageSrc, text, id }, options = {}) => {
  const {
    mainImageX = 0,
    mainImageY = 0,
    mainImageWidth = 200,
    mainImageHeight = 200,
    titleGap = 20,
    fontSize = 14,
    fontFamily = 'Arial',
    fill = '#000000',
    backgroundColor,
    padding = 5,
    cornerRadius = 4
  } = options

  return new Promise((resolve, reject) => {
    if (!imageSrc) {
      reject(new Error('imageSrc is required'))
      return
    }

    const imgObj = new Image()
    imgObj.crossOrigin = 'anonymous'
    imgObj.onerror = (error) => {
      console.error('Image load error:', error)
      reject(error)
    }
    imgObj.onload = () => {
      try {
        const ratio = Math.min(mainImageWidth / imgObj.width, mainImageHeight / imgObj.height)
        const width = imgObj.width * ratio
        const height = imgObj.height * ratio

        const konvaImage = new Konva.Image({
          image: imgObj,
          x: mainImageX,
          y: mainImageY,
          width,
          height,
          draggable: true,
          id: id || ''
        })

        if (text) {
          createTextNode({ text, id }, {
            x: mainImageX,
            y: mainImageY + height + 10,
            fontSize,
            fontFamily,
            fill,
            backgroundColor,
            padding,
            cornerRadius,
            width
          }).then((konvaText) => {
            resolve([konvaImage, konvaText])
          }).catch((error) => {
            reject(error)
          })
        } else {
          resolve([konvaImage])
        }
      } catch (error) {
        reject(error)
      }
    }
    imgObj.src = imageSrc
  })
}

/**
 * 创建纯文本 Konva 节点
 * @param {Object} params - 参数对象
 * @param {string} params.text - 文本内容
 * @param {string} params.id - 节点 ID
 * @param {Object} options - 配置选项
 * @param {number} options.x - 文本 X 坐标，默认 0
 * @param {number} options.y - 文本 Y 坐标，默认 0
 * @param {number} options.fontSize - 字体大小，默认 13
 * @param {string} options.fontFamily - 字体，默认 'Arial'
 * @param {string} options.fill - 文本颜色，默认 '#000000'
 * @param {string} options.backgroundColor - 背景颜色，可选
 * @param {number} options.padding - 背景内边距，默认 5
 * @param {number} options.cornerRadius - 背景圆角，默认 4
 * @param {boolean} options.center - 是否以 (x, y) 为中心点，默认 false
 * @returns {Promise<Konva.Node>} 返回 Promise，解析为 Konva.Text 或 Konva.Group 对象
 */
export const createTextNode = ({ text, id }, options = {}) => {
  const {
    x = 0,
    y = 0,
    fontSize = 13,
    fontFamily = 'Arial',
    fill = '#000000',
    backgroundColor,
    padding = 5,
    cornerRadius = 4,
    width,
    center = false
  } = options

  return new Promise((resolve, reject) => {
    try {
      const konvaText = new Konva.Text({
        x: 0,
        y: 0,
        text: text || '',
        fontSize,
        fontFamily,
        fill,
        draggable: false,
        id: id || '',
        width: width || undefined,
        lineHeight: 1.4
      })

      if (backgroundColor) {
        const textWidth = konvaText.width()
        const textHeight = konvaText.height()

        const background = new Konva.Rect({
          x: 0,
          y: 0,
          width: textWidth + padding * 2,
          height: textHeight + padding * 2,
          fill: backgroundColor,
          cornerRadius,
          draggable: false
        })

        const group = new Konva.Group({
          x,
          y,
          draggable: true,
          id: id || ''
        })

        group.add(background)
        group.add(konvaText)

        konvaText.x(padding)
        konvaText.y(padding)

        konvaText.on('textChange', () => {
          const newWidth = konvaText.width()
          const newHeight = konvaText.height()
          background.width(newWidth + padding * 2)
          background.height(newHeight + padding * 2)
        })

        if (center) {
          const groupWidth = background.width()
          const groupHeight = background.height()
          group.x(x - groupWidth / 2)
          group.y(y - groupHeight / 2)
        }

        resolve(group)
      } else {
        konvaText.x(x)
        konvaText.y(y)
        konvaText.draggable(true)
        
        if (center) {
          const textWidth = konvaText.width()
          const textHeight = konvaText.height()
          konvaText.x(x - textWidth / 2)
          konvaText.y(y - textHeight / 2)
        }
        
        resolve(konvaText)
      }
    } catch (error) {
      reject(error)
    }
  })
}

/**
 * 创建 interpretations 文本节点数组
 * 为每个 interpretation 创建一个文本节点
 * @param {Object} interpretations - interpretations 对象，包含多个数组（meaning, emotion, sensory, aesthetic）
 * @param {Object} options - 配置选项
 * @param {number} options.startX - 起始 X 坐标，默认 0
 * @param {number} options.startY - 起始 Y 坐标，默认 0
 * @param {number} options.verticalGap - 文本节点之间的垂直间距，默认 25
 * @param {number} options.fontSize - 字体大小，默认 12
 * @param {string} options.fontFamily - 字体，默认 'Arial'
 * @param {string} options.fill - 文本颜色，默认 '#666666'
 * @param {string} options.backgroundColor - 背景颜色，可选
 * @param {number} options.padding - 背景内边距，默认 5
 * @param {number} options.cornerRadius - 背景圆角，默认 4
 * @param {number} options.width - 文本宽度，可选
 * @returns {Promise<Array<Konva.Node>>} 返回 Promise，解析为包含所有文本节点的数组
 */
export const createInterpretationTextNodes = (interpretations, options = {}) => {
  const {
    startX = 0,
    startY = 0,
    verticalGap = 25,
    fontSize = 12,
    fontFamily = 'Arial',
    fill = '#666666',
    backgroundColor,
    padding = 5,
    cornerRadius = 4,
    width
  } = options

  return new Promise((resolve, reject) => {
    if (!interpretations || typeof interpretations !== 'object') {
      reject(new Error('interpretations must be an object'))
      return
    }

    try {
      const interpretationArray = []
      
      Object.keys(interpretations).forEach((type) => {
        const items = interpretations[type]
        if (Array.isArray(items)) {
          items.forEach((item) => {
            interpretationArray.push({
              ...item,
              type
            })
          })
        }
      })

      if (interpretationArray.length === 0) {
        resolve([])
        return
      }

      const textNodes = []
      let currentY = startY

      interpretationArray.forEach((interpretation) => {
        const { id, text, specificity, type } = interpretation
        
        const textContent = specificity ? `${text} (${specificity})` : text
        
        createTextNode({ text: textContent, id }, {
          x: startX,
          y: currentY,
          fontSize,
          fontFamily,
          fill,
          backgroundColor,
          padding,
          cornerRadius,
          width
        }).then((konvaText) => {
          textNodes.push(konvaText)
          
          if (textNodes.length === interpretationArray.length) {
            resolve(textNodes)
          }
        }).catch((error) => {
          reject(error)
        })

        currentY += verticalGap
      })
    } catch (error) {
      reject(error)
    }
  })
}



