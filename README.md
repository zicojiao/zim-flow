# ZimFlow – Offline AI Learning Assistant

ZimFlow is a Chrome extension powered by Gemini Nano AI, providing offline summarization, quiz generation, translation, and AI Q&A.

## Main Features

- **AI Summarization**: Instantly generate structured summaries from selected or input text.
- **Offline Translation**: Translate between 20+ languages locally, no internet required.
- **Gemma AI Chat & Image**: Chat with AI using text, images, or screenshots for multimodal understanding.

## Installation & Usage

1. Requires Chrome Canary 138+ with experimental AI features enabled (see below).
2. Clone this repo and install dependencies:
   ```bash
   git clone https://github.com/zicojiao/zim-flow.git
   cd zim-flow
   pnpm install
   pnpm run dev
   ```
3. Load the `/build/chrome-mv3-dev` folder as an unpacked extension in Chrome Extensions page.

## Enable Chrome AI Features

Go to `chrome://flags/` and enable:
- #optimization-guide-on-device-model
- #prompt-api-for-gemini-nano
- #translation-api

Ref: https://developer.chrome.com/docs/ai/get-started

## Notes

- All AI features run locally and offline for privacy.
- Requires Chrome experimental built-in AI support.

MIT License. 