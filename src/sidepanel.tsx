import React, { useState, useEffect } from "react"
import "~main.css"
import { Button } from "~components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~components/ui/card"
import { Badge } from "~components/ui/badge"
import { Separator } from "~components/ui/separator"
import { Textarea } from "~components/ui/textarea"
import { Progress } from "~components/ui/progress"
import { Copy, FileText, Brain, Settings, Sparkles, AlertCircle, CheckCircle2, Loader2, MousePointer2, Languages } from "lucide-react"
import { sendToBackground } from "@plasmohq/messaging"

import { QuizViewer } from "~components/QuizViewer"
import { TranslatorViewer } from "~components/TranslatorViewer"
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

const menuItems = [
  {
    key: "summary",
    label: "Summary",
    icon: FileText,
    description: "Content Summary & Analysis"
  },
  {
    key: "quiz",
    label: "Quiz",
    icon: Brain,
    description: "Interactive Quiz Generator"
  },
  {
    key: "translator",
    label: "Translator",
    icon: Languages,
    description: "AI-powered Translation"
  },
  {
    key: "settings",
    label: "Settings",
    icon: Settings,
    description: "Personalization Settings"
  }
]

interface ProcessingState {
  isProcessing: boolean;
  progress: number;
  status: string;
}

const Sidepanel = () => {
  const [active, setActive] = useState("summary")
  const [summary, setSummary] = useState("")
  const [quiz, setQuiz] = useState<any>(null)
  const [selectedText, setSelectedText] = useState("")
  const [processing, setProcessing] = useState<ProcessingState>({
    isProcessing: false,
    progress: 0,
    status: "Ready to help you study!"
  })
  const [aiAvailable, setAiAvailable] = useState<boolean | null>(null)
  const [sourceLanguage, setSourceLanguage] = useState("en")
  const [targetLanguage, setTargetLanguage] = useState("fr")

  // Check AI availability and set up storage listener on component mount
  useEffect(() => {
    checkAIStatus()
    loadSelectedTextFromStorage()

    // Listen for storage changes (when user uses context menu)
    const handleStorageChange = (changes: any, areaName: string) => {
      if (areaName === 'local' && changes.selectedText && changes.selectedText.newValue) {
        console.log('📥 New text received from context menu')
        loadSelectedTextFromStorage()
      }
    }

    chrome.storage.onChanged.addListener(handleStorageChange)

    // Cleanup listener on unmount
    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange)
    }
  }, [])

  // Load selected text from storage (from context menu)
  const loadSelectedTextFromStorage = async () => {
    try {
      const result = await chrome.storage.local.get(['selectedText', 'timestamp'])
      if (result.selectedText && result.timestamp) {
        // Check if the text is recent (within 30 seconds)
        const isRecent = Date.now() - result.timestamp < 30000
        if (isRecent) {
          setSelectedText(result.selectedText)
          updateProgress(100, `Loaded ${result.selectedText.length} characters from context menu`)
          setActive("summary") // Switch to summary tab automatically

          // Clear the storage after loading
          await chrome.storage.local.remove(['selectedText', 'timestamp'])

          setTimeout(() => {
            setProcessing({ isProcessing: false, progress: 0, status: "Ready to help you study!" })
          }, 1500)

          console.log('✅ Text loaded from context menu:', result.selectedText.substring(0, 50) + '...')
        }
      }
    } catch (error) {
      console.error("Error loading selected text from storage:", error)
    }
  }

  const checkAIStatus = async () => {
    try {
      const result = await sendToBackground({
        name: "zimflow",
        body: { type: "checkAIStatus" }
      })
      setAiAvailable(result.available)
    } catch (error) {
      console.error("Error checking AI status:", error)
      setAiAvailable(false)
    }
  }

  const updateProgress = (progress: number, status: string) => {
    setProcessing(prev => ({ ...prev, progress, status }))
  }

  const handleLanguageChange = (newSource: string, newTarget: string) => {
    setSourceLanguage(newSource)
    setTargetLanguage(newTarget)
  }

  const handleGenerateSummary = async () => {
    if (!selectedText.trim()) {
      updateProgress(0, "Please enter some text to summarize")
      setTimeout(() => {
        setProcessing({ isProcessing: false, progress: 0, status: "Ready to help you study!" })
      }, 2000)
      return
    }

    setSummary("")
    setQuiz(null)
    setProcessing({ isProcessing: true, progress: 0, status: "Generating summary..." })

    try {
      updateProgress(50, "Processing text...")

      const result = await sendToBackground({
        name: "zimflow",
        body: {
          type: "processText",
          data: { text: selectedText }
        }
      })

      if (result.success) {
        setSummary(result.summary)
        updateProgress(100, "Summary generated successfully!")
        setTimeout(() => {
          setProcessing({ isProcessing: false, progress: 0, status: "Ready to help you study!" })
        }, 1000)
      } else {
        throw new Error(result.error)
      }
    } catch (error: any) {
      console.error("Error generating summary:", error)
      updateProgress(0, `Error: ${error.message}`)
      setProcessing(prev => ({ ...prev, isProcessing: false }))
    }
  }

  const handleGenerateQuiz = async () => {
    if (!summary) {
      updateProgress(0, "Please generate a summary first")
      setTimeout(() => {
        setProcessing({ isProcessing: false, progress: 0, status: "Ready to help you study!" })
      }, 2000)
      return
    }

    setProcessing({ isProcessing: true, progress: 0, status: "Creating quiz..." })

    try {
      updateProgress(50, "Designing questions...")

      const result = await sendToBackground({
        name: "zimflow",
        body: {
          type: "generateQuiz",
          data: { summary }
        }
      })
      console.log("Quiz result", result);

      if (result.success) {
        setQuiz(result.quiz)
        updateProgress(100, "Quiz created successfully!")
        setActive("quiz")
        setTimeout(() => {
          setProcessing({ isProcessing: false, progress: 0, status: "Ready to help you study!" })
        }, 1000)
      } else {
        throw new Error(result.error)
      }
    } catch (error: any) {
      console.error("Error generating quiz:", error)
      updateProgress(0, `Error: ${error.message}`)
      setProcessing(prev => ({ ...prev, isProcessing: false }))
    }
  }

  const contentMap = {
    summary: (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Content Summary
            <Badge variant="outline">Gemini AI-Powered</Badge>
          </CardTitle>
          <CardDescription>
            Intelligently analyze web content and generate clear, concise summaries
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Selected Text Display */}
            <div className="space-y-2">
              <div className="text-md text-slate-600 mb-1">Selected Text:</div>
              <Textarea
                placeholder="Or paste text here to summarize..."
                value={selectedText}
                onChange={(e) => setSelectedText(e.target.value)}
                className="min-h-[150px]"
                disabled={processing.isProcessing}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                onClick={handleGenerateSummary}
                disabled={processing.isProcessing}
                className="flex-1"
              >
                {processing.isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Generate Summary"
                )}
              </Button>
            </div>

            {/* Summary Display */}
            {summary ? (
              <div className="space-y-4">
                <div className="prose prose-sm max-w-none p-4 bg-slate-50 rounded-lg border custom-scrollbar max-h-96 overflow-y-auto">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
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
                <div className="flex gap-2">
                  <Button
                    onClick={handleGenerateQuiz}
                    disabled={processing.isProcessing}
                    size="sm">
                    {processing.isProcessing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create Quiz"
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-2 text-slate-500">
                <p className="text-sm">Select text on any webpage and right click 'Generate Summary' to begin.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    ),
    quiz: (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Smart Quiz
            <Badge variant="outline">Gemini AI-Powered</Badge>
          </CardTitle>
          <CardDescription>
            Test your understanding with AI-generated quiz questions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {quiz ? (
            <QuizViewer quiz={quiz} />
          ) : (
            <div className="text-center py-6">
              <div className="p-4 bg-muted rounded-lg mb-4">
                <p className="text-sm text-slate-600">🧠 Generate quiz questions from your summary</p>
              </div>
              <Button onClick={handleGenerateQuiz} disabled={!summary || processing.isProcessing}>
                {processing.isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Quiz
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>),
    translator: (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Languages className="h-5 w-5" />
            AI Translator
            <Badge variant="outline">Chrome Built-in AI</Badge>
          </CardTitle>
          <CardDescription>
            Translate text using Chrome's built-in AI translation models
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TranslatorViewer
            sourceLanguage={sourceLanguage}
            targetLanguage={targetLanguage}
            onLanguageChange={handleLanguageChange}
          />
        </CardContent>
      </Card>
    ),
    settings: (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Settings
          </CardTitle>
          <CardDescription>
            AI status and configuration options
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* AI Status */}
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-2">
                {aiAvailable === null ? (
                  <Loader2 className="h-4 w-4 animate-spin text-slate-500" />
                ) : aiAvailable ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-500" />
                )}
                <span className="text-sm font-medium">Chrome Built-in AI</span>
              </div>
              <Badge variant={aiAvailable ? "default" : "destructive"}>
                {aiAvailable === null ? "Checking..." : aiAvailable ? "Available" : "Unavailable"}
              </Badge>
            </div>

            <div className="text-sm text-slate-600 space-y-1">
              <p>• Powered by Chrome's Built-in Gemini Nano</p>
              <p>• Requires Chrome 138+ with AI features enabled</p>
              <p>• All processing happens locally for privacy</p>
            </div>

            <Button onClick={checkAIStatus} variant="outline" className="w-full">
              Refresh AI Status
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="min-h-screen w-full flex bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Sidebar */}
      <div className="flex flex-col w-16 bg-white border-r shadow-sm py-6">
        <div className="flex flex-col space-y-2 px-2">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = active === item.key
            return (
              <Button
                key={item.key}
                variant={isActive ? "default" : "ghost"}
                size="icon"
                className={`h-12 w-12 p-0 rounded-xl transition-all duration-200 ${isActive
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "hover:bg-slate-100"
                  }`}
                onClick={() => setActive(item.key)}
                title={item.description}
              >
                <Icon className="h-5 w-5" />
              </Button>
            )
          })}
        </div>
        <Separator className="my-6" />
        <div className="flex-1" />
      </div>

      {/* Content Area */}
      <div className="flex-1 flex flex-col items-center justify-start p-4 overflow-y-auto">
        <div className="w-full max-w-xl">
          {contentMap[active as keyof typeof contentMap]}
        </div>
      </div>

      {/* Progress Footer */}
      {(processing.isProcessing || processing.progress > 0) && (
        <div className="fixed bottom-0 left-16 right-0 bg-white border-t p-4">
          <div className="max-w-2xl mx-auto space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">{processing.status}</span>
              {processing.isProcessing && <span className="text-slate-500">{processing.progress}%</span>}
            </div>
            <Progress value={processing.progress} className="h-2" />
          </div>
        </div>
      )}
    </div>
  )
}

export default Sidepanel
