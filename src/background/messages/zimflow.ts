// ZimFlow AI Assistant - Plasmo Background Message Handler
import type { PlasmoMessaging } from "@plasmohq/messaging"

// Default topK parameter
const DEFAULT_TOP_K = 3;
// Default temperature parameter  
const DEFAULT_TEMPERATURE = 1;
// Maximum tokens per input
const MAX_TOKENS = 1024;
// AI session object for all inference operations
let session: any = null;

// System prompt - ref: https://blog.promptlayer.com/best-prompts-for-text-summarization-guide-to-ai-summaries
const SUMMARY_SYSTEM_PROMPT = `You are an expert learning assistant and content strategist specializing in transforming complex information into clear, actionable summaries. 

Your expertise includes:
- Identifying key concepts and their relationships
- Distilling complex information for different audiences
- Creating structured, scannable content
- Maintaining accuracy while ensuring clarity

Always approach each text systematically: first analyze the main themes, then identify supporting details, and finally structure the information for optimal comprehension.`;

// Text summary prompt template
const SUMMARY_PROMPT = (text: string) => `Analyze and summarize the following text using a systematic approach:

TEXT TO ANALYZE:
${text}

INSTRUCTIONS:
1. First, identify the main topic and primary purpose of this text
2. Extract 3-5 key concepts or arguments that support the main idea
3. Note any important details, examples, or data that add context
4. Consider what a learning-focused audience would find most valuable

FORMAT YOUR SUMMARY as follows:

# Overview
Write 2-3 sentences that capture the main topic and its significance for learners.

## Key Concepts
- **Concept 1**: Brief explanation with why it matters
- **Concept 2**: Brief explanation with why it matters  
- **Concept 3**: Brief explanation with why it matters
[Add more if needed, maximum 5]

## Important Details
- Critical detail, example, or data point
- Another significant supporting information
- Additional context that enhances understanding
[Maximum 4 details]

## Learning Focus
One sentence explaining what readers should remember or apply from this content.

GUIDELINES:
- Keep total length under 200 words
- Use clear, accessible language suitable for students and professionals
- Focus on actionable insights and core understanding
- Avoid jargon unless essential (then briefly explain it)
- Ensure each point adds unique value`;

// Quiz generation system prompt
const QUIZ_SYSTEM_PROMPT = `You are an educational assessment expert specializing in creating effective multiple-choice questions that test comprehension and application of knowledge.

Your expertise includes:
- Designing questions that assess different levels of understanding (recall, comprehension, application)
- Creating plausible distractors that reveal common misconceptions
- Writing clear, unambiguous question stems
- Providing educational explanations that reinforce learning

Focus on creating questions that help learners consolidate their understanding and identify knowledge gaps.`;

// Quiz generation prompt template
const QUIZ_PROMPT = (summary: string) => `Create an effective multiple-choice question based on the following summary:

SUMMARY TO ANALYZE:
${summary}

INSTRUCTIONS:
1. Identify the most important concept that learners should understand
2. Create a question that tests comprehension rather than just recall
3. Design 4 options where ONLY ONE is correct, others must be clearly incorrect
4. Ensure incorrect options represent common misconceptions or partial understanding
5. Randomly place the correct answer among the four options (A, B, C, or D)

QUESTION REQUIREMENTS:
- Focus on key concepts, not minor details
- Test understanding, not memorization
- Use clear, direct language
- Avoid negative phrasing or "all of the above"
- Mix up the position of the correct answer to avoid patterns
- Ensure there is EXACTLY ONE correct answer, no ambiguity

FORMAT:
Q: [Clear, specific question about a key concept]
A) [One of the four options - could be correct or incorrect]
B) [One of the four options - could be correct or incorrect]
C) [One of the four options - could be correct or incorrect]
D) [One of the four options - could be correct or incorrect]
Correct: [A/B/C/D]
Explanation: [2-3 sentences explaining why the correct answer is right and clearly why others are wrong, reinforcing the learning point]`;

// Create new AI session with customizable initial prompt, topK, temperature
async function createAISession({ initialPrompts, topK, temperature }: any = {}) {
  // Only check string, don't destructure object, always use local default parameters
  // @ts-ignore - Chrome Built-in AI API
  const available = await LanguageModel.availability();
  if (available === "no") {
    throw new Error('AI not available');
  }
  const params = {
    monitor(monitor: any) {
      monitor.addEventListener('downloadprogress', (event: any) => {
        console.log(`Downloaded: ${event.loaded} of ${event.total} bytes.`);
      });
    },
    initialPrompts: initialPrompts || '',
    topK: topK ?? DEFAULT_TOP_K,
    temperature: temperature ?? DEFAULT_TEMPERATURE,
  };
  // @ts-ignore - Chrome Built-in AI API
  session = await LanguageModel.create(params);
  return session;
}

// Update (destroy and rebuild) AI session to ensure clean inference environment
async function updateSession({ initialPrompts, topK, temperature }: any = {
  topK: DEFAULT_TOP_K,
  temperature: DEFAULT_TEMPERATURE,
}) {
  if (session) {
    // Destroy old session to free resources
    session.destroy();
    session = null;
  }
  // Create new session
  session = await createAISession({
    initialPrompts,
    topK,
    temperature,
  });
}

// Text processing (generate structured summary)
async function handleTextProcessing(text: string): Promise<{ success: boolean; summary?: string; error?: string }> {
  try {
    // Create new session with system prompt
    await updateSession({
      initialPrompts: [
        { role: 'system', content: SUMMARY_SYSTEM_PROMPT }
      ]
    });
    // Check if token count exceeds limit
    const usage = await session.measureInputUsage(text);
    if (usage.inputUsage > MAX_TOKENS) {
      throw new Error("Text too long, please shorten and try again.");
    }
    // Construct summary prompt
    const prompt = SUMMARY_PROMPT(text);
    // Send prompt and get result
    const result = await session.prompt(prompt);
    return { success: true, summary: result };
  } catch (error: any) {
    // Error handling
    console.error("Text processing error:", error);
    return { success: false, error: error.message };
  }
}

// Quiz generation (generate multiple choice questions based on summary)
async function handleQuizGeneration(summary: string): Promise<{ success: boolean; quiz?: any; error?: string }> {
  try {
    // Create new session with custom system prompt
    await updateSession({
      initialPrompts: [
        { role: 'system', content: QUIZ_SYSTEM_PROMPT }
      ]
    });
    // Construct quiz prompt
    const prompt = QUIZ_PROMPT(summary);
    // Send prompt and get result
    const result = await session.prompt(prompt);
    // Parse quiz text into object
    const quiz = parseQuiz(result);
    return { success: true, quiz };
  } catch (error: any) {
    // Error handling
    console.error("Quiz generation error:", error);
    return { success: false, error: error.message };
  }
}

// Utility function: parse quiz text into object
function parseQuiz(text: string) {
  const lines = text.split("\n").map((l) => l.trim());
  return {
    question: lines[0].replace("Q:", "").trim(), // Question text
    options: lines.slice(1, 5).map((l) => l.substring(2).trim()), // Options
    correctIndex: "ABCD".indexOf(lines[5].replace("Correct:", "").trim()), // Correct answer index
    explanation: lines[6] ? lines[6].replace("Explanation:", "").trim() : '', // Explanation
  };
}

// Check AI status (for frontend UI)
async function handleAIStatus(): Promise<{ available: boolean; error?: string }> {
  try {
    // @ts-ignore - Chrome Built-in AI API
    const available = await LanguageModel.availability();
    console.log("AI status:", available);
    return { available: available === "available" };
  } catch (error: any) {
    return { available: false, error: error.message };
  }
}

// Cleanup session and free resources
function cleanup() {
  if (session) {
    session.destroy();
    session = null;
  }
}

// Plasmo messaging handler
const handler: PlasmoMessaging.MessageHandler = async (req, res) => {
  const { type, data } = req.body;

  try {
    switch (type) {
      case "processText":
        console.log("processText", data.text);
        const summaryResult = await handleTextProcessing(data.text);
        res.send(summaryResult);
        break;

      case "generateQuiz":
        const quizResult = await handleQuizGeneration(data.summary);
        res.send(quizResult);
        break;

      case "checkAIStatus":
        const statusResult = await handleAIStatus();
        res.send(statusResult);
        break;

      case "cleanup":
        cleanup();
        res.send({ success: true });
        break;

      default:
        res.send({ success: false, error: "Unknown message type" });
    }
  } catch (error: any) {
    res.send({ success: false, error: error.message });
  }
}

export default handler; 