<template>
  <div class="pcm-list-container">
    <div class="select-all-bar">
      <span>Select all memories</span>
      <input type="checkbox" v-model="selectAll" @change="handleSelectAll" />
    </div>

    <div class="cards-grid">
      <div v-for="(item, index) in memoryItems" :key="index" class="card-item" :class="{ selected: item.selected }">
        <button class="add-btn" :class="{ active: item.selected }" @click="toggleItem(item)">
          <svg v-if="item.selected" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          <span v-else>+</span>
        </button>
        <div class="card-images">
          <img v-for="(img, imgIndex) in item.images" :key="imgIndex" :src="img" :alt="item.title" class="card-image" :style="getImageStyle(imgIndex)" />
        </div>
        <div class="card-footer">
          <span class="card-title">{{ item.title }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const selectAll = ref(false)

const memoryItems = ref([
  {
    title: 'Art',
    selected: false,
    images: [
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=abstract%20art%20painting&image_size=square',
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20art%20sculpture&image_size=square'
    ]
  },
  {
    title: 'Graphic Design',
    selected: false,
    images: [
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=graphic%20design%20poster&image_size=square',
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=typography%20design&image_size=square'
    ]
  },
  {
    title: 'Fashion',
    selected: false,
    images: [
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=fashion%20photography%20model&image_size=square',
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=fashion%20accessories&image_size=square'
    ]
  },
  {
    title: 'Film Photography',
    selected: false,
    images: [
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=film%20photography%20vintage&image_size=square',
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=analog%20camera%20photos&image_size=square'
    ]
  },
  {
    title: 'Cinema',
    selected: false,
    images: [
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cinema%20movie%20scene&image_size=square',
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=film%20camera%20equipment&image_size=square'
    ]
  },
  {
    title: 'UI/UX',
    selected: false,
    images: [
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=ui%20design%20interface&image_size=square',
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=ux%20design%20wireframe&image_size=square'
    ]
  },
  {
    title: 'Fashion',
    selected: false,
    images: [
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=fashion%20photography%20model&image_size=square',
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=fashion%20accessories&image_size=square'
    ]
  },
  {
    title: 'Film Photography',
    selected: false,
    images: [
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=film%20photography%20vintage&image_size=square',
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=analog%20camera%20photos&image_size=square'
    ]
  },
  {
    title: 'Cinema',
    selected: false,
    images: [
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cinema%20movie%20scene&image_size=square',
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=film%20camera%20equipment&image_size=square'
    ]
  },
  {
    title: 'UI/UX',
    selected: false,
    images: [
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=ui%20design%20interface&image_size=square',
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=ux%20design%20wireframe&image_size=square'
    ]
  }
])

const getImageStyle = (index) => {
  const offsets = [
    { top: 0, left: 0, rotate: -5 },
    { top: 10, left: 20, rotate: 8 }
  ]
  return {
    top: `${offsets[index].top}px`,
    left: `${offsets[index].left}px`,
    transform: `rotate(${offsets[index].rotate}deg)`,
    zIndex: offsets.length - index
  }
}

const toggleItem = (item) => {
  item.selected = !item.selected
  updateSelectAll()
}

const handleSelectAll = () => {
  memoryItems.value.forEach(item => {
    item.selected = selectAll.value
  })
}

const updateSelectAll = () => {
  selectAll.value = memoryItems.value.every(item => item.selected)
}
</script>

<style scoped lang="scss">
.pcm-list-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: .875rem;
  overflow:hidden;

  .select-all-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding:.8rem;
    margin-bottom: 16px;
    border-bottom: 1px solid #e0e0e0;
    font-size: 1em;
    font-weight: 500;
    color: #777777;

    input[type="checkbox"] {
      width: 1rem;
      height: 1rem;
      cursor: pointer;
    }
  }

  .cards-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: .5em;
    background-color: #f1f1f1;
    padding: .5em;
    border-radius: 12px;
    overflow-y: auto;

    .card-item {
      position: relative;
      border: 1px solid transparent;
      border-radius: 12px;
      padding: 1.5em .9em .9em;
      cursor: pointer;
      transition: all 0.2s ease;
      background-color: #ddd;

      &.selected {
        border-color: #333;
      }

      &:hover {
        // border-color: #999;
      }

      .add-btn {
        position: absolute;
        top: 8px;
        right: 8px;
        width: 1em;
        height: 1em;
        border: 2px solid #999;
        border-radius: 50%;
        background: #fff;
        font-size: 18px;
        font-weight: 500;
        color: #999;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0;
        line-height: 1;
        transition: all 0.2s ease;
        z-index: 10;

        &.active {
          border-color: #333;
          background: #333;
          color: #fff;
        }

        &:hover:not(.active) {
          border-color: #333;
          color: #333;
        }
      }

      .card-images {
        position: relative;
        height: 120px;
        margin-bottom: 12px;

        .card-image {
          position: absolute;
          width: 80px;
          height: 80px;
          object-fit: cover;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
      }

      .card-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;

        .card-title {
          font-size: .875em;
          color: #333;
        }
      }
    }
  }
}
</style>
