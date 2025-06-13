[English](README.md) | [中文](README.zh_CN.md)

# ZimFlow – Offline AI Learning Assistant

ZimFlow is a Chrome extension that combines Google Gemini Nano and Gemma3, designed specifically for learning scenarios in offline environments.

- Utilizes Chrome's built-in Gemini Nano AI for local translation and knowledge summarization of web content.
- Integrates with a locally deployed Gemma3 via the Chrome extension, supporting multimodal AI tutoring, Q&A, and homework assistance.
- All AI features run locally, requiring no internet connection, helping students in areas without network coverage to learn offline.

---

## Demo Video

https://www.youtube.com/watch?v=Iyux9iH8nHI

---

## Features & Technical Workflow

### 1. Offline Translation & Knowledge Summarization (Powered by Chrome Gemini Nano AI)

- **Offline Translation:** Uses Chrome's [Translation with built-in AI](https://developer.chrome.com/docs/ai/translator-api) for local, multi-language translation.
- **Knowledge Summarization:** Leverages Chrome's [Gemini Nano AI](https://developer.chrome.com/docs/ai/prompt-api) for local inference and structured summarization of web content.

**Main Workflow:**
1. Click the ZimFlow Chrome extension icon to open the sidepanel.
2. In the sidepanel, select the "AI Translate" or "AI Summary" feature from the left menu.
3. Select the text you want to process on the web page.
4. Right-click and choose "Translate" or "Summary" from the ZimFlow context menu.
5. The selected text is automatically sent to the ZimFlow sidepanel.
6. Chrome's built-in Gemini Nano AI processes the translation or summary locally, and the result is displayed in the sidepanel in real time.

- **All AI features run locally, with no internet required, ensuring privacy and serving students in offline areas.**

---

### 2. AI Tutor (Powered by Locally Deployed Gemma3, Multimodal Q&A)

- **Multimodal Q&A:** Connects to a locally deployed Gemma3 AI, supporting text input, webpage screenshots, and image uploads for multimodal understanding and Q&A—ideal for tutoring and homework help.

**Main Workflow:**
1. Click the ZimFlow Chrome extension icon, open the sidepanel, and select the "AI Tutor" feature.
2. Enter your question directly to chat with the local Gemma3 for learning guidance or homework help.
3. Supports multimodal input such as webpage screenshots and image uploads, which Gemma3 can understand and answer.

- **All AI features run locally, with no internet required, ensuring privacy and serving students in offline areas.**

---

## Installation & Usage

1. Chrome Canary or Chrome Beta 138+ is required, with experimental AI features enabled (see below).
2. Clone this repository and install dependencies:
   ```bash
   git clone https://github.com/zicojiao/zim-flow.git
   cd zim-flow
   pnpm install
   pnpm run dev
   ```
3. Load the `/build/chrome-mv3-dev` folder as an unpacked extension in the Chrome Extensions page.

### Enable Chrome Built-in AI Features

Go to `chrome://flags/` and enable:
- #optimization-guide-on-device-model
- #prompt-api-for-gemini-nano
- #translation-api

Reference: https://developer.chrome.com/docs/ai/get-started

### Deploying Gemma3 Locally

Gemma3 is deployed using Ollama. Please ensure Ollama is installed and running locally.

- Install Ollama: https://ollama.com/download
- Download the Gemma3 model: https://ollama.com/library/gemma3
- Run:
```bash
   export OLLAMA_ORIGINS=chrome-extension://*
   ollama serve
```

---

## Key Source Files
- [`src/components/GemmaAIViewer.tsx`](https://github.com/zicojiao/zim-flow/blob/main/src/components/GemmaAIViewer.tsx) (Gemma3-based multimodal Q&A)
- [`src/components/SummaryViewer.tsx`](https://github.com/zicojiao/zim-flow/blob/main/src/components/SummaryViewer.tsx) (Knowledge summarization using Chrome built-in Gemini Nano)
- [`src/components/TranslatorViewer.tsx`](https://github.com/zicojiao/zim-flow/blob/main/src/components/TranslatorViewer.tsx) (Offline translation using Chrome built-in Gemini Nano)
- [`src/background.ts`](https://github.com/zicojiao/zim-flow/blob/main/src/background.ts) (Handles context menu, message dispatch, etc.)
- [`src/content.ts`](https://github.com/zicojiao/zim-flow/blob/main/src/content.ts) (Handles webpage screenshot, communication with background, etc.)

---

## Additional Notes

- All AI features run fully offline, with no internet required.
- Make sure to use Chrome Canary or Chrome Beta 138+ with experimental AI features enabled.

---

MIT License. 