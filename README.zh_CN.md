[English](README.md) | [中文](README.zh_CN.md)

# ZimFlow – 离线 AI 学习助手

ZimFlow 是一款结合谷歌 Gemini Nano 与 Gemma3 的 Chrome 扩展，专为无网络环境下的学习场景设计。

- 利用 Chrome 内置 Gemini Nano AI，实现网页内容的本地化翻译与知识摘要。
- 通过 Chrome 扩展与本地部署的 Gemma3 打通，支持多模态 AI 教学问答、作业解答等。
- 所有 AI 功能均在本地运行，无需联网，帮助无网络覆盖地区的学生离线学习。

---

## 视频演示

https://www.youtube.com/watch?v=591HQWaP2Gg

---

## 功能与技术流程

### 1. AI 离线翻译与知识摘要（基于 Chrome 内置 Gemini Nano AI）

- **离线翻译**：通过 Chrome 内置的 [Translation with built-in AI](https://developer.chrome.com/docs/ai/translator-api)，实现多语言本地离线互译。
- **知识摘要**：调用 Chrome 内置的 [Gemini Nano AI](https://developer.chrome.com/docs/ai/prompt-api)，对网页内容进行本地推理，生成结构化摘要。

**主要流程：**
1. 点击 Zimflow的Chrome 扩展图标，ZimFlow 以 sidepanel 形式打开。
2. 在sidepanel左侧选项选择AI Translate或者AI Summary等功能。
2. 在网页上选中需要处理的文本。
3. 右键菜单选择 ZimFlow 的"Translate"或"Summary"功能。
4. 选中文本自动传递到 ZimFlow sidepanel。
5. 由 Chrome 内置的 Gemini Nano AI 在本地完成翻译或摘要，结果实时展示在Sidepanel面板。

- **所有 AI 功能均在本地运行，无需联网，帮助无网络覆盖地区的学生离线学习**

---

### 2. AI Tutor（基于本地部署的 Gemma3，多模态问答）

- **多模态问答**：调用本地部署的 Gemma3 AI，支持文本输入、网页截图、图片上传等多模态理解与问答，适用于学习指导、作业解答等场景。

**主要流程：**
1. 点击 ZimFlow的Chrome 扩展图标，侧边栏打开，选择 AI Tutor 功能。
2. 用户可直接输入问题，与本地 Gemma3 进行对话，获得学习指导、作业解答等。
3. 支持网页截图、图片上传等多模态输入，Gemma3 可进行理解和解答。

- **所有 AI 功能均在本地运行，无需联网，帮助无网络覆盖地区的学生离线学习**

---

## 安装与使用

1. 需要 Chrome Canary 或 Chrome Beta 138+ 并开启实验性 AI 功能（见下文）。
2. 克隆本仓库并安装依赖：
   ```bash
   git clone https://github.com/zicojiao/zim-flow.git
   cd zim-flow
   pnpm install
   pnpm run dev
   ```
3. 在 Chrome 扩展页面加载 `/build/chrome-mv3-dev` 文件夹为未打包扩展。

### 启用 Chrome build-in AI 功能

进入 `chrome://flags/` 并启用：
- #optimization-guide-on-device-model
- #prompt-api-for-gemini-nano
- #translation-api

参考：https://developer.chrome.com/docs/ai/get-started


### 启动本地部署的 Gemma3

Gemma3 使用 Ollama 进行部署，请确保本地已正确部署并启动 Ollama 服务。

- 安装Ollama: https://ollama.com/download
- 下载Gemma3模型：https://ollama.com/library/gemma3
- 运行：
```bash
   export OLLAMA_ORIGINS=chrome-extension://*
   ollama serve
```

---

## 主要功能代码
- [`src/components/GemmaAIViewer.tsx`](https://github.com/zicojiao/zim-flow/blob/main/src/components/GemmaAIViewer.tsx)（基于 Gemma3 的多模态问答）
- [`src/components/SummaryViewer.tsx`](https://github.com/zicojiao/zim-flow/blob/main/src/components/SummaryViewer.tsx)（基于 Chrome 内置的 Gemini Nano 的知识摘要生成）
- [`src/components/TranslatorViewer.tsx`](https://github.com/zicojiao/zim-flow/blob/main/src/components/TranslatorViewer.tsx)（基于 Chrome 内置的 Gemini Nano 的离线翻译）
- [`src/background.ts`](https://github.com/zicojiao/zim-flow/blob/main/src/background.ts)（负责右键菜单、消息分发等逻辑）
- [`src/content.ts`](https://github.com/zicojiao/zim-flow/blob/main/src/content.ts)（负责网页内容截图、与 background 通信等内容脚本）

---

## 其他说明

- 所有 AI 功能均在本地离线运行，无需联网。
- 需确保使用 Chrome Canary 或 Chrome Beta 138+ 并开启实验性 AI 功能。

---

MIT License. 