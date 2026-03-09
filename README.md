# Mneme

Mneme 是一个基于 Vue 3 + Vite 的可视化记忆编排与故事生成前端项目。  
项目围绕“记忆素材（PCM）→ 工作画布（Working Memory）→ 主题容器（My Story）→ 生成故事”的流程，提供拖拽、画布编辑与故事预览能力。

## 功能概览

- Memory Gallery：拉取并展示 PCM 记忆单元列表，可查看详情与画布预览。
- Working Memory：主画布编辑区，支持文本节点添加、节点选择与跨画布发送。
- My Story：多主题容器管理，每个主题绑定独立 Konva 画布，可导出图片并生成故事。
- Generated outline：按生成时间查看故事列表，支持 Markdown 渲染展示。
- 多路由实验画布：包含 Index、canvas、FabricEditor 等实验/演示页面。

## 技术栈

- 前端框架：Vue 3（Composition API）
- 构建工具：Vite 5
- 语言：TypeScript + JavaScript（混用）
- UI 组件：Element Plus
- 状态管理：Pinia
- 路由：Vue Router（Hash 模式）
- 画布引擎：Konva + vue-konva（主编辑能力）
- 网络请求：Axios（封装请求与拦截器）
- 其他：marked（Markdown 渲染）、vite-plugin-svg-icons（SVG 图标注册）

## 运行环境

- Node.js 18+（建议）
- npm 9+（建议）

## 快速开始

```bash
npm install
npm run dev
```

开发服务启动后，默认通过 Vite 本地地址访问（通常为 `http://localhost:5173`）。

## 常用命令

```bash
# 本地开发
npm run dev

# 类型检查 + 生产构建
npm run build

# 本地预览构建结果
npm run preview

# 发布到 gh-pages（需具备对应权限）
npm run deploy
```

## 路由与页面

| 路径 | 页面 | 说明 |
|---|---|---|
| `/` | Home/Home.vue | 主流程页面：Memory Gallery + Working Memory + My Story |
| `/Index` | Index/Index.vue | 分层画布输入流程（实验页） |
| `/konvaComponent` | components/konvaComponent.vue | Konva 组件调试入口 |
| `/canvas` `/canvas2` `/canvas3` | 各类画布实验页 | 试验/历史页面 |
| `/FabricEditor` | FabricEditor.vue | Fabric 编辑器实验页 |
| `/qqq` | qqq.vue | 其他测试页面 |

## 核心业务流程

1. 左侧 `PCMListComponent` 调用 PCM 列表接口，展示记忆单元。
2. 用户在弹窗中查看记忆详情，可进行拖拽素材操作。
3. 中间 `WorkingMemory` 使用 `KonvaComponent` 进行图文编排与节点选择。
4. 选中节点通过“发送到主题容器”进入右侧 `TopicContainerList` 指定画布。
5. 右侧点击 `Generate`：
   - 导出选中主题容器的画布图片。
   - 组装主题标题、描述、canvas 数据。
   - 调用 `CreateStory` 接口生成故事。
6. 生成结果写入 Pinia `storyStore`，并在 `StoryListDialog` 中以 Markdown 展示。

## 目录结构

```text
Mneme
├─ public/
│  └─ data/                 # 本地示例数据与静态产物
├─ src/
│  ├─ components/           # 通用组件（Konva、弹窗、SVG 等）
│  ├─ views/
│  │  ├─ Home/              # 主业务页面与子组件
│  │  ├─ Index/             # 分层画布实验页面
│  │  └─ *.vue              # 其他画布/实验页面
│  ├─ service/              # Axios 与 API 封装
│  ├─ stores/               # Pinia 状态
│  ├─ utils/                # 画布初始化、节点生成与通用工具
│  ├─ router/               # 路由配置
│  └─ main.ts               # 应用入口
├─ vite.config.ts           # 构建与代理配置
└─ package.json             # 依赖与脚本
```

## 接口与代理说明

### 接口封装

- `src/service/api.ts`
  - `GetPCMList()`：获取 PCM 列表
  - `CreateStory(data)`：创建故事

### 请求基础设置

- `src/service/axios.ts` 中默认 `baseURL` 为 `/api`。
- `src/service/api.ts` 里又创建了指向 Azure 域名的请求实例，并存在完整 URL 调用。

### Vite 代理

`vite.config.ts` 中配置了以下代理：

- `/api` → `http://20.163.194.92:5000/`
- `/image-proxy` → `https://trae-api-cn.mchost.guru`
- `/azure` → `https://mneme-gcakhrgtedbjerhz.westus2-01.azurewebsites.net`

项目中的图片 URL 在 `initPCM.js` 里会根据域名自动转换为代理路径，避免跨域问题。

## 状态管理

- `src/stores/storyStore.js`
  - `storyList`：故事列表
  - `addStory(story)`：新增故事（头插）
  - `clearStoryList()`：清空列表

## 构建与发布

- `npm run build`：执行 `vue-tsc && vite build`。
- `npm run deploy`：将 `dist` 发布到 GitHub Pages（`gh-pages -d dist`）。
- Vite `base` 当前配置为 `./`，适配静态部署场景。

## 开发注意事项

- 代码为 TS/JS 混合风格，修改前建议先确认目标文件语法风格。
- `konvaComponent.vue` 文件较大，承载核心画布交互逻辑，建议分模块阅读与修改。
- 当前项目未提供独立 lint 脚本，如需统一规范可补充 ESLint/Prettier 流程。

## 未来可优化方向

- 统一 API baseURL 与环境变量管理（dev/test/prod）。
- 为 `CreateStory` 返回结构补齐严格类型定义。
- 拆分超大组件（尤其是 `konvaComponent.vue`）以提升可维护性。
- 增加单元测试与端到端测试，保障画布与生成流程稳定性。
