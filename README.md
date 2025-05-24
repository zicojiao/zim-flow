# ZimFlow – AI Learning Without Internet

**ZimFlow** is a Chrome extension that provides Gemini Nano AI-powered learning and translation capabilities using Chrome's Built-in AI APIs - completely offline and privacy-focused.

## ✨ Features

### 🧠 Text Summarization
- **Context Menu Integration**: Right-click on selected text to instantly generate summaries
- **Structured Output**: Get organized summaries with key concepts, important details, and learning focus

### 🎯 Interactive Quiz Generation
- **Auto-Generated Quizzes**: Create multiple-choice questions based on your summaries
- **Educational Focus**: Questions test comprehension rather than memorization

### 🌐 Offline AI Translation
- **Real-time Translation**: Instant translation without internet connection

## 🧪 Built-In AI APIs

This project leverages Chrome's cutting-edge Built-in AI capabilities:

- **[Prompt API](https://developer.chrome.com/docs/ai/built-in)**: For text summarization using Gemini Nano
- **[Translator API](https://developer.chrome.com/docs/ai/built-in)**: For offline translation between 20+ languages

All documentation for the built-in AI APIs can be found at: https://developer.chrome.com/docs/ai/built-in

## ⚙️ Setup

### Prerequisites

- **Chrome Canary** (version 138+)

### Enable Chrome Flags

Before using ZimFlow, enable the following experimental flags in Chrome:

1. Navigate to `chrome://flags/` in your browser
2. Enable these flags:
   ```
   chrome://flags/#optimization-guide-on-device-model
   chrome://flags/#prompt-api-for-gemini-nano
   chrome://flags/#translation-api
   ```
3. Restart Chrome

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/zicojiao/zim-flow.git
   cd zim-flow
   ```

2. **Install dependencies**:
   ```bash
   pnpm install
   ```

3. **Development mode**:
   ```bash
   pnpm run dev
   ```

4. **Build for production**:
   ```bash
   pnpm run build
   ```

5. **Load extension in Chrome**:
   - Open Chrome Canary
   - Navigate to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `/build` folder

## 🚀 Usage

### Text Summarization

1. **Context Menu Method**:
   - Select any text on a webpage
   - Right-click and choose "Generate Summary"
   - The side panel will open with your summary

2. **Manual Input Method**:
   - Click the ZimFlow extension icon
   - Go to the "Summary" tab
   - Enter or paste your text
   - Click "Generate Summary"

### Quiz Generation

1. Generate a summary first
2. Navigate to the "Quiz" tab
3. Click "Generate Quiz"
4. Answer the multiple-choice question
5. View explanations and try again

### Translation

1. Go to the "Translator" tab
2. Select source and target languages
3. Click "Create Translator" (first time only)
4. Enter text and click "Translate"

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Note**: This extension requires Chrome's experimental Built-in AI features. These APIs are currently in development and subject to change. 