import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~components/ui/card";
import { Button } from "~components/ui/button";
import { Badge } from "~components/ui/badge";
import { FileText, Loader2, Sparkles, Copy } from "lucide-react";
import ReactMarkdown from 'react-markdown';
// import remarkGfm from 'remark-gfm';
import { Progress } from "~components/ui/progress";
import { Textarea } from "~components/ui/textarea";

const SUMMARY_SYSTEM_PROMPT = `You are an expert learning assistant and content strategist specializing in transforming complex information into clear, actionable summaries.\n\nYour expertise includes:\n- Identifying key concepts and their relationships\n- Distilling complex information for different audiences\n- Creating structured, scannable content\n- Maintaining accuracy while ensuring clarity\n\nAlways approach each text systematically: first analyze the main themes, then identify supporting details, and finally structure the information for optimal comprehension.`;

const SUMMARY_PROMPT = (text: string) => `Analyze and summarize the following text using a systematic approach:\n\nTEXT TO ANALYZE:\n${text}\n\nINSTRUCTIONS:\n1. First, identify the main topic and primary purpose of this text\n2. Extract 3-5 key concepts or arguments that support the main idea\n3. Note any important details, examples, or data that add context\n4. Consider what a learning-focused audience would find most valuable\n\nFORMAT YOUR SUMMARY as follows:\n\n# Overview\nWrite 2-3 sentences that capture the main topic and its significance for learners.\n\n## Key Concepts\n- **Concept 1**: Brief explanation with why it matters\n- **Concept 2**: Brief explanation with why it matters  \n- **Concept 3**: Brief explanation with why it matters\n[Add more if needed, maximum 5]\n\n## Important Details\n- Critical detail, example, or data point\n- Another significant supporting information\n- Additional context that enhances understanding\n[Maximum 4 details]\n\n## Learning Focus\nOne sentence explaining what readers should remember or apply from this content.\n\nGUIDELINES:\n- Keep total length under 200 words\n- Use clear, accessible language suitable for students and professionals\n- Focus on actionable insights and core understanding\n- Avoid jargon unless essential (then briefly explain it)\n- Ensure each point adds unique value`;

export const SummaryViewer: React.FC = () => {
  const [inputText, setInputText] = useState("");
  const [summary, setSummary] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState("");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get('selectedText', (result) => {
        if (result.selectedText) {
          setInputText(result.selectedText);
          chrome.storage.local.remove('selectedText');
        }
      });
      const handleStorageChange = (changes: any, areaName: string) => {
        if (areaName === 'local' && changes.selectedText && changes.selectedText.newValue) {
          setInputText(changes.selectedText.newValue);
          chrome.storage.local.remove('selectedText');
        }
      };
      chrome.storage.onChanged.addListener(handleStorageChange);
      return () => {
        chrome.storage.onChanged.removeListener(handleStorageChange);
      };
    }
  }, []);

  const handleGenerateSummary = async () => {
    if (!inputText.trim()) {
      setStatus("Please enter some text to summarize");
      return;
    }
    setSummary("");
    setIsProcessing(true);
    setProgress(0);
    setStatus("Initializing AI...");
    try {
      const availability = await LanguageModel.availability();
      if (availability === 'unavailable') {
        setStatus("AI not available. Check your browser settings.");
        setIsProcessing(false);
        setProgress(0);
        return;
      }
      const session = await LanguageModel.create({
        initialPrompts: [
          { role: "system", content: SUMMARY_SYSTEM_PROMPT }
        ],
        topK: 3,
        temperature: 1,
        monitor(monitor: any) {
          monitor.addEventListener("downloadprogress", (e: any) => {
            // setStatus(`Downloading model: ${e.loaded}/${e.total}`)
          });
        }
      });
      const prompt = SUMMARY_PROMPT(inputText);
      const stream = session.promptStreaming(prompt);
      let result = "";
      let previousChunk = "";
      const reader = stream.getReader();
      while (true) {
        const { value: chunk, done } = await reader.read();
        if (done) break;
        const newChunk = chunk.startsWith(previousChunk)
          ? chunk.slice(previousChunk.length)
          : chunk;
        result += newChunk;
        previousChunk = chunk;
        setSummary(result);
        setStatus("Generating summary...");
        setProgress(50);
      }
      setStatus("Summary generated successfully!");
      setProgress(100);
    } catch (error: any) {
      setStatus("Error: " + error.message);
      setProgress(0);
    } finally {
      setIsProcessing(false);
      setTimeout(() => setProgress(0), 2000);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (error) {
      console.error("Failed to copy text:", error);
    }
  };

  return (
    <div className="space-y-4 w-full max-w-full">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            AI Summary
            <Badge variant="outline">Gemini AI-Powered</Badge>
          </CardTitle>
          <CardDescription>
            Transform complex knowledge into clear summaries
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4">
          <Textarea
            className="w-full border rounded p-2 min-h-[150px] mb-2"
            placeholder="Paste text here to summarize..."
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            disabled={isProcessing}
          />
          <div className="flex gap-2 mb-2">
            <Button onClick={handleGenerateSummary} disabled={isProcessing || !inputText.trim()} className="flex-1">
              {isProcessing ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Processing...</>
              ) : (
                <><Sparkles className="mr-2 h-4 w-4" />Generate Summary</>
              )}
            </Button>
          </div>
          {status && <div className="text-xs text-slate-500 my-3">{status}</div>}
          {(isProcessing || progress > 0) && (
            <div className="mb-2">
              <Progress value={progress} className="h-2" />
            </div>
          )}
          {summary ? (
            <div className="space-y-4">
              <div className="relative">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(summary)}
                  className="absolute top-2 right-2 h-6 px-2 z-10"
                  title="Copy to Clipboard"
                >
                  <Copy className="h-3 w-3" />
                </Button>
                <div className="prose prose-sm max-w-none p-4 bg-slate-50 rounded-lg border custom-scrollbar max-h-96 overflow-y-auto">
                  <ReactMarkdown
                    // remarkPlugins={[remarkGfm]}
                    components={{
                      h1: ({ children }) => <h1 className="text-lg font-semibold text-slate-900 mb-3 leading-tight">{children}</h1>,
                      h2: ({ children }) => <h2 className="text-base font-medium text-slate-800 mb-2 leading-tight">{children}</h2>,
                      h3: ({ children }) => <h3 className="text-sm font-medium text-slate-700 mb-2 leading-tight">{children}</h3>,
                      p: ({ children }) => <p className="text-sm text-slate-700 mb-3 leading-relaxed">{children}</p>,
                      ul: ({ children }) => <ul className="list-disc list-inside space-y-1 mb-3 ml-2">{children}</ul>,
                      ol: ({ children }) => <ol className="list-decimal list-inside space-y-1 mb-3 ml-2">{children}</ol>,
                      li: ({ children }) => <li className="text-sm text-slate-700 leading-relaxed">{children}</li>,
                      strong: ({ children }) => <strong className="font-medium text-slate-900">{children}</strong>,
                      em: ({ children }) => <em className="italic text-slate-700">{children}</em>,
                      blockquote: ({ children }) => <blockquote className="border-l-4 border-slate-300 pl-4 italic text-slate-600 my-3">{children}</blockquote>,
                      code: ({ children }) => <code className="bg-slate-200 px-1 py-0.5 rounded text-xs font-mono text-slate-800">{children}</code>,
                      pre: ({ children }) => <pre className="bg-slate-800 text-slate-100 p-3 rounded-md text-xs overflow-x-auto my-3">{children}</pre>,
                    }}
                  >
                    {summary}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-2 text-slate-500">
              <p className="text-sm">Select text on any webpage and right click 'Generate Summary' to begin.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
