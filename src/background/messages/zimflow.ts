/// <reference types="dom-chromium-ai" />
import type { PlasmoMessaging } from "@plasmohq/messaging"

// Check AI status (for frontend UI)
async function handleAIStatus(): Promise<{ available: boolean; error?: string }> {
  try {
    const available = await LanguageModel.availability();
    console.log("AI status:", available);
    return { available: available === "available" };
  } catch (error: any) {
    return { available: false, error: error.message };
  }
}

// Plasmo messaging handler
const handler: PlasmoMessaging.MessageHandler = async (req, res) => {
  const { type } = req.body;
  try {
    switch (type) {
      case "checkAIStatus":
        const statusResult = await handleAIStatus();
        res.send(statusResult);
        break;
      default:
        res.send({ success: false, error: "Unknown message type" });
    }
  } catch (error: any) {
    res.send({ success: false, error: error.message });
  }
}

export default handler; 