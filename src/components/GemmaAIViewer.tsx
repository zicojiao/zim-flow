import React, { useEffect, useRef, useState } from "react";
import ollama from 'ollama/browser';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "~components/ui/card";
import { Textarea } from "~components/ui/textarea";
import { Button } from "~components/ui/button";
import { Badge } from "~components/ui/badge";
import { Skeleton } from "~components/ui/skeleton";
import { Alert, AlertTitle, AlertDescription } from "~components/ui/alert";
import { Loader2, AlertCircle, MessageCircle, Image as ImageIcon, X, Plus, Camera, Send, MessageCirclePlus } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';

const MODEL = "gemma3:4b";

interface Message {
  role: string;
  content: string;
  images?: string[];
}

export const GemmaAIViewer: React.FC = () => {
  // Multi-conversation management
  const [conversations, setConversations] = useState<Message[][]>([[]]);
  const [activeIndex, setActiveIndex] = useState(0);
  // Current input and images
  const [input, setInput] = useState("");
  const [images, setImages] = useState<string[]>([]); // Store images as base64 data URLs
  // Status
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [streamedContent, setStreamedContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  // Image upload
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversations, activeIndex, streamedContent]);

  // Autofill from context menu
  useEffect(() => {
    if (chrome?.storage?.local) {
      chrome.storage.local.get('gemmaText', (result) => {
        if (result.gemmaText) {
          setInput(result.gemmaText);
          chrome.storage.local.remove('gemmaText');
        }
      });
      const handleStorageChange = (changes: any, areaName: string) => {
        if (areaName === 'local' && changes.gemmaText?.newValue) {
          setInput(changes.gemmaText.newValue);
          chrome.storage.local.remove('gemmaText');
        }
      };
      chrome.storage.onChanged.addListener(handleStorageChange);
      return () => chrome.storage.onChanged.removeListener(handleStorageChange);
    }
  }, []);

  const handleImageIconClick = () => {
    if (!loading) {
      fileInputRef.current?.click();
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const readers = Array.from(files).map(file => {
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
    });
    Promise.all(readers).then(imgs => setImages(prev => [...prev, ...imgs]));
  };

  const removeImage = (idx: number) => {
    setImages(prev => prev.filter((_, i) => i !== idx));
  };

  // New conversation
  const handleNewConversation = () => {
    setConversations(prev => [...prev, []]);
    setActiveIndex(conversations.length);
    setInput("");
    setImages([]);
    setError(null);
    setStreamedContent("");
  };

  const handleInitiateScreenshot = async () => {
    console.log("initiateScreenshot");
    const tabs = await chrome.tabs.query({ active: true })
    if (tabs.length > 0 && tabs[0].id) {
      chrome.runtime.sendMessage({
        type: "initiateScreenshot",
        tabId: tabs[0].id
      })
    }
  };

  useEffect(() => {
    const handler = (msg: any, sender: any, sendResponse: any) => {
      if (msg?.type === "zimflow-cropped-image" && msg.dataUrl) {
        setImages([msg.dataUrl])
        setInput("")
        setTimeout(() => {
          sendMessage()
        }, 100)
      }
    }
    chrome.runtime.onMessage.addListener(handler)
    return () => chrome.runtime.onMessage.removeListener(handler)
  }, [])

  // Send message
  const sendMessage = async () => {
    if (!input.trim() && images.length === 0) return;
    setLoading(true);
    setStreaming(true);
    setError(null);
    setStreamedContent("");

    // Prepare images for AI (pure base64)
    const imagesForAI = images.length ? images.map(img => {
      const base64Data = img.startsWith('data:') ? img.split(',')[1] : img;
      return base64Data;
    }) : undefined;

    // Build new message for display and for AI
    const userMsg: Message = {
      role: "user",
      content: input,
      images: images.length ? images : undefined // Use original data URLs for display
    };

    // Update current conversation for display
    setConversations(prev => prev.map((conv, idx) =>
      idx === activeIndex ? [...conv, userMsg] : conv
    ));
    const messagesForOllama = [...conversations[activeIndex], { ...userMsg, images: imagesForAI }];
    setInput("");
    setImages([]); // Clear images from input area after sending
    try {
      // Get latest conversation with images formatted for Ollama
      const response = await ollama.chat({
        model: MODEL,
        messages: messagesForOllama, // Send messages with pure base64 for AI
        stream: true
      });
      let result = '';
      for await (const part of response) {
        result += part.message.content;
        setStreamedContent(result);
      }
      // AI reply
      const aiMsg: Message = { role: "assistant", content: result };
      setConversations(prev => prev.map((conv, idx) =>
        idx === activeIndex ? [...conv, aiMsg] : conv
      ));
      setStreamedContent("");
    } catch (e) {
      setError("AI response failed, please try again.");
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

  // Message bubble
  const MessageBubble = ({ role, content, images: msgImages }: Message) => (
    <div className={`flex ${role === 'user' ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[85%] px-4 py-2 rounded-lg text-sm whitespace-pre-wrap ${role === 'user' ? 'bg-blue-100 text-blue-900' : 'bg-gray-100 text-gray-900'}`}>
        <ReactMarkdown
          components={{
            h1: ({ children }) => children ? <h1 className="text-lg font-semibold text-slate-900">{children}</h1> : null,
            h2: ({ children }) => children ? <h2 className="text-base font-medium text-slate-800">{children}</h2> : null,
            h3: ({ children }) => children ? <h3 className="text-sm font-medium text-slate-700">{children}</h3> : null,
            p: ({ children }) => children ? <p className="text-sm text-slate-700">{children}</p> : null,
            ul: ({ children }) => children ? <ul className="list-disc list-inside ml-1">{children}</ul> : null,
            ol: ({ children }) => children ? <ol className="list-decimal list-inside ml-1">{children}</ol> : null,
            li: ({ children }) => children ? <li className="text-sm text-slate-700">{children}</li> : null,
            strong: ({ children }) => children ? <strong className="font-medium text-slate-900">{children}</strong> : null,
            em: ({ children }) => children ? <em className="italic text-slate-700">{children}</em> : null,
            blockquote: ({ children }) => children ? <blockquote className="border-l-4 border-slate-300 pl-1 italic text-slate-600">{children}</blockquote> : null,
            code: ({ children }) => children ? <code className="bg-slate-200 px-1 py-0.5 rounded text-xs font-mono text-slate-800">{children}</code> : null,
            pre: ({ children }) => children ? <pre className="bg-slate-800 text-slate-100 p-1 rounded-md text-xs overflow-x-auto">{children}</pre> : null,
          }}
        >
          {typeof content === 'string' ? content : ''}
        </ReactMarkdown>
        {Array.isArray(msgImages) && msgImages.length > 0 && (
          <div className="flex gap-2 mt-1 flex-wrap">
            {msgImages.map((img, i) => (
              <img key={i} src={img} alt="uploaded content" className="max-w-[120px] max-h-[120px] rounded border" />
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <Card className="w-full h-[90vh] flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          AI Tutor
          <Badge variant="outline">Gemma3 AI-Powered</Badge>
        </CardTitle>
        <CardDescription>
          Ask Gemma AI with text and image support.
        </CardDescription>
      </CardHeader>
      {/* Conversation main area only, conversation list removed as per last edit */}
      <div className="flex-1 flex flex-col min-h-0">
        <CardContent className="flex-1 flex flex-col min-h-0 p-0 bg-slate-50">
          {/* Chat history */}
          <div className="flex-1 flex flex-col gap-2 overflow-y-auto min-h-0 px-4 py-2 bg-white">
            {conversations[activeIndex].map((msg, idx) => (
              <MessageBubble key={idx} {...msg} />
            ))}
            {streaming && (
              <div className="flex justify-start">
                <div className="max-w-[80%] px-4 py-2 rounded-lg text-sm bg-gray-100 text-gray-900">
                  {streamedContent || <Skeleton className="h-4 w-32" />}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </CardContent>
        <CardFooter className="border-t bg-white flex flex-col gap-2 p-4">
          {/* Image upload and preview */}
          <div className="flex items-start gap-2">
            <Button variant="outline" size="icon" onClick={handleNewConversation} title="New Chat">
              <MessageCirclePlus className="h-5 w-5" />
            </Button>
            <Button variant="outline" size="icon" onClick={handleInitiateScreenshot} title="Take Screenshot">
              <Camera className="h-5 w-5" />
            </Button>
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              ref={fileInputRef}
              onChange={handleImageUpload}
              disabled={loading}
            />
            <Button
              variant="outline"
              size="icon"
              disabled={loading}
              onClick={handleImageIconClick}
            >
              <ImageIcon className="h-5 w-5" />
            </Button>
            {images.map((img, idx) => (
              <div key={idx} className="relative">
                <img src={img} alt="preview" className="w-10 h-10 rounded border" />
                <Button
                  size="icon"
                  variant="ghost"
                  className="absolute -top-2 -right-2 p-0 h-5 w-5"
                  onClick={() => removeImage(idx)}
                >
                  <X className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            ))}
          </div>
          {/* Input area */}
          <div className="flex gap-2 w-full items-center">
            <Textarea
              className="flex-1 min-h-[80px] max-h-[100px] resize-none"
              placeholder="Type your question or content, image upload supported..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
            />
            <Button
              onClick={sendMessage}
              disabled={loading || (!input.trim() && images.length === 0)}
            >{loading ? <Loader2 className="animate-spin h-4 w-4" /> : "Send"}</Button>
          </div>
          {/* Error alert */}
          {error && (
            <Alert variant="destructive" className="mt-2">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardFooter>
      </div>
    </Card>
  );
};

