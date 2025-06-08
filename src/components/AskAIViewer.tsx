import React, { useEffect, useRef, useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter
} from "~components/ui/card";
import { Textarea } from "~components/ui/textarea";
import { Button } from "~components/ui/button";
import { Progress } from "~components/ui/progress";
import { Alert, AlertTitle, AlertDescription } from "~components/ui/alert";
import { Badge } from "~components/ui/badge";
import { Skeleton } from "~components/ui/skeleton";
import { Loader2, AlertCircle, CheckCircle2, Download, MessageCircle } from "lucide-react";

const SYSTEM_PROMPT = "You are a helpful and patient AI teacher. Answer the user's questions in a clear and concise way.";
const DEFAULT_TOP_K = 1;
const DEFAULT_TEMPERATURE = 0.2;

export const AskAIViewer: React.FC = () => {
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modelStatus, setModelStatus] = useState<'checking' | 'ready' | 'downloading' | 'unavailable'>('checking');
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [streaming, setStreaming] = useState(false);
  const [streamedContent, setStreamedContent] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamedContent]);

  // Read askaiText from storage on mount and listen for changes
  useEffect(() => {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get('askaiText', (result) => {
        if (result.askaiText) {
          setInput(result.askaiText);
          chrome.storage.local.remove('askaiText');
        }
      });
      const handleStorageChange = (changes: any, areaName: string) => {
        if (areaName === 'local' && changes.askaiText && changes.askaiText.newValue) {
          setInput(changes.askaiText.newValue);
          chrome.storage.local.remove('askaiText');
        }
      };
      chrome.storage.onChanged.addListener(handleStorageChange);
      return () => {
        chrome.storage.onChanged.removeListener(handleStorageChange);
      };
    }
  }, []);

  // Check model availability and create session
  useEffect(() => {
    let isMounted = true;
    setModelStatus('checking');
    setError(null);
    setSession(null);
    setDownloadProgress(0);
    setStreaming(false);
    setStreamedContent("");
    (async () => {
      try {
        if (!('LanguageModel' in window)) {
          setModelStatus('unavailable');
          setError('Prompt API is not available in this browser.');
          return;
        }
        const availability = await LanguageModel.availability();
        if (availability === 'unavailable') {
          setModelStatus('unavailable');
          setError('Prompt API is not available. Check your browser settings.');
          return;
        }
        if (availability === 'downloading') {
          setModelStatus('downloading');
        } else {
          setModelStatus('ready');
        }
        const newSession = await LanguageModel.create({
          initialPrompts: [
            { role: "system", content: SYSTEM_PROMPT }
          ],
          topK: DEFAULT_TOP_K,
          temperature: DEFAULT_TEMPERATURE,
          monitor(monitor: any) {
            monitor.addEventListener("downloadprogress", (e: any) => {
              const percent = e.total ? Math.round((e.loaded / e.total) * 100) : 0;
              setDownloadProgress(percent);
            });
          }
        });
        if (isMounted) {
          setSession(newSession);
          setModelStatus('ready');
        }
      } catch (e) {
        setModelStatus('unavailable');
        setError('Failed to initialize the model.');
      }
    })();
    return () => { isMounted = false; };
  }, []);

  // Send message to AI (streaming)
  const sendMessage = async () => {
    if (!input.trim() || !session) return;
    setLoading(true);
    setError(null);
    setStreaming(true);
    setStreamedContent("");
    const newMessages = [...messages, { role: "user", content: input }];
    setMessages(newMessages);
    setInput("");
    try {
      // Use promptStreaming for streaming output
      const stream = session.promptStreaming(input);
      let result = '';
      let previousChunk = '';
      for await (const chunk of stream) {
        // Chrome Prompt API: chunk is cumulative, so diff it
        const newChunk = chunk.startsWith(previousChunk) ? chunk.slice(previousChunk.length) : chunk;
        result += newChunk;
        previousChunk = chunk;
        setStreamedContent(result);
      }
      setMessages([...newMessages, { role: "assistant", content: result }]);
      setStreamedContent("");
    } catch (e) {
      setError('AI failed to respond. Please try again.');
    } finally {
      setLoading(false);
      setStreaming(false);
    }
  };

  // Send on Enter
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Message bubble component
  const MessageBubble = ({ role, content }: { role: string; content: string }) => (
    <div className={`flex ${role === 'user' ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[80%] px-4 py-2 rounded-lg text-sm whitespace-pre-wrap ${role === 'user' ? 'bg-blue-100 text-blue-900' : 'bg-gray-100 text-gray-900'}`}>
        {content}
      </div>
    </div>
  );

  return (
    <Card className="w-full h-[90vh] flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          AI Tutor
          <Badge variant="outline">Gemini AI-Powered</Badge>
        </CardTitle>
        <CardDescription>
          AI-powered Q&A Tutor
        </CardDescription>
      </CardHeader>
      <div className="flex-1 flex flex-col min-h-0 overflow-y-auto bg-slate-50">
        <CardContent className="flex-1 flex flex-col min-h-0 p-0 bg-slate-50">
          {modelStatus === 'checking' && (
            <div className="flex items-center gap-2 text-sm text-slate-500 px-4 pt-2"><Loader2 className="animate-spin h-4 w-4" /> Checking model availability...</div>
          )}
          {modelStatus === 'downloading' && (
            <div className="space-y-2 px-4 pt-2">
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <Download className="h-3 w-3" />
                Downloading language model... {downloadProgress}%
              </div>
              <Progress value={downloadProgress} className="h-2" />
            </div>
          )}
          {modelStatus === 'unavailable' && (
            <Alert variant="destructive" className="my-2 mx-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Model unavailable</AlertTitle>
              <AlertDescription>{error || 'Prompt API is not available in this browser.'}</AlertDescription>
            </Alert>
          )}
          {modelStatus === 'ready' && (
            <div className="flex-1 flex flex-col gap-2 overflow-y-auto min-h-0 px-4 py-2 bg-white">
              {messages.map((msg, idx) => (
                <MessageBubble key={idx} role={msg.role} content={msg.content} />
              ))}
              {/* Streaming output */}
              {streaming && (
                <div className="flex justify-start">
                  <div className="max-w-[80%] px-4 py-2 rounded-lg text-sm bg-gray-100 text-gray-900">
                    {streamedContent || <Skeleton className="h-4 w-32" />}
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </CardContent>
      </div>
      <CardFooter className="border-t bg-white flex gap-2 p-4">
        <Textarea
          className="flex-1 min-h-[40px] max-h-[120px] resize-none"
          placeholder="Type your question..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading || modelStatus !== 'ready'}
        />
        <Button
          onClick={sendMessage}
          disabled={loading || !input.trim() || !session || modelStatus !== 'ready'}
        >{loading ? <Loader2 className="animate-spin h-4 w-4" /> : "Send"}</Button>
      </CardFooter>
    </Card>
  );
}; 