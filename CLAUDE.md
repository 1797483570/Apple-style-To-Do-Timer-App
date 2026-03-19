# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 常用命令

```bash
# 安装依赖
npm i

# 启动开发服务器（手动在终端运行）
npm run dev

# 构建生产版本
npm run build
```

> 注意：此项目使用 pnpm overrides 锁定 vite 版本，但可以用 npm 安装。

## 技术栈

- **框架**：React 18 + TypeScript，通过 Vite 构建
- **样式**：Tailwind CSS v4（`@tailwindcss/vite` 插件），主题变量定义在 `src/styles/theme.css`
- **动画**：`motion/react`（Framer Motion）
- **UI 组件库**：shadcn/ui 风格组件，位于 `src/app/components/ui/`，基于 Radix UI 原语
- **通知**：`sonner` Toast
- **路径别名**：`@` 映射到 `src/`

## 架构概览

应用是一个单页番茄钟 + 待办事项 App，仿 Apple 风格设计。

### 状态管理

所有状态集中在 `App.tsx`，通过 props 向下传递：
- `activeTab`：控制当前显示 Timer 还是 Todo
- `focusDuration` / `breakDuration`：计时器时长（秒），可通过 TimeSettings 修改
- 持久化：`PomodoroTimer` 和 `TodoList` 各自直接读写 `localStorage`（key：`pomodoro-sessions`、`pomodoro-todos`）

### 核心组件

| 组件 | 路径 | 职责 |
|------|------|------|
| `App` | `src/app/App.tsx` | 根组件，持有全局状态，协调各子组件 |
| `PomodoroTimer` | `src/app/components/PomodoroTimer.tsx` | 倒计时圆环、专注/休息模式切换、session 计数 |
| `TodoList` | `src/app/components/TodoList.tsx` | 任务增删改查，localStorage 持久化 |
| `TabBar` | `src/app/components/TabBar.tsx` | 底部 Tab 导航 |
| `TimeSettings` | `src/app/components/TimeSettings.tsx` | 弹出式时长设置面板 |

### 样式约定

- 主题 CSS 变量定义在 `src/styles/theme.css`，通过 `@theme inline` 映射为 Tailwind 颜色 token（如 `text-foreground`、`bg-background`）
- 支持 `.dark` 类切换深色模式
- 毛玻璃效果：`bg-white/60 backdrop-blur-sm`
- 圆角统一使用 `rounded-2xl` 或 `rounded-full`
- 动画使用 `motion.div` + `AnimatePresence`，避免直接操作 CSS transition（除简单 hover 外）

### 注意事项

- `vite.config.ts` 中 React 和 Tailwind 插件均为必须，不可移除
- `assetsInclude` 仅支持 `.svg` 和 `.csv`，不要添加 `.css`/`.tsx`/`.ts`
- `src/app/components/ui/` 下的组件是 shadcn/ui 生成的基础组件，一般不需要修改
