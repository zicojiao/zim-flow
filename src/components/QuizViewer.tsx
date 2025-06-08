import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~components/ui/card";
import { Button } from "~components/ui/button";
import { Badge } from "~components/ui/badge";
import { Brain, CheckCircle2, XCircle, Info, Loader2, Sparkles } from "lucide-react";
import { Textarea } from "./ui/textarea";

interface Quiz {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

const QUIZ_SYSTEM_PROMPT = `You are an educational assessment expert specializing in creating effective multiple-choice questions that test comprehension and application of knowledge.
Your expertise includes:
- Designing questions that assess different levels of understanding (recall, comprehension, application)
- Creating plausible distractors that reveal common misconceptions
- Writing clear, unambiguous question stems
- Providing educational explanations that reinforce learning
Focus on creating questions that help learners consolidate their understanding and identify knowledge gaps.`;

const QUIZ_PROMPT = (text: string) => `Create an effective multiple-choice question based on the following content:
CONTENT TO ANALYZE:
${text}
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
- Avoid negative phrasing or \"all of the above\"
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

function parseQuiz(text: string): Quiz | null {
  const lines = text.split("\n").map((l) => l.trim());
  if (!lines[0]?.startsWith("Q:")) return null;
  return {
    question: lines[0].replace("Q:", "").trim(),
    options: lines.slice(1, 5).map((l) => l.substring(2).trim()),
    correctIndex: "ABCD".indexOf(lines[5]?.replace("Correct:", "").trim()),
    explanation: lines[6] ? lines[6].replace("Explanation:", "").trim() : '',
  };
}

export const QuizViewer: React.FC = () => {
  const [inputText, setInputText] = useState("");
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get('quizText', (result) => {
        if (result.quizText) {
          setInputText(result.quizText);
          chrome.storage.local.remove('quizText');
        }
      });
      const handleStorageChange = (changes: any, areaName: string) => {
        if (areaName === 'local' && changes.quizText && changes.quizText.newValue) {
          setInputText(changes.quizText.newValue);
          chrome.storage.local.remove('quizText');
        }
      };
      chrome.storage.onChanged.addListener(handleStorageChange);
      return () => {
        chrome.storage.onChanged.removeListener(handleStorageChange);
      };
    }
  }, []);

  const handleGenerateQuiz = async () => {
    if (!inputText.trim()) {
      setStatus("Please enter some content");
      return;
    }
    setIsProcessing(true);
    setStatus("Generating with AI...");
    setQuiz(null);
    setShowResult(false);
    setSelectedIndex(null);
    try {
      const availability = await LanguageModel.availability();
      if (availability === 'unavailable') {
        setStatus("AI not available. Check your browser settings.");
        setIsProcessing(false);
        return;
      }
      const session = await LanguageModel.create({
        initialPrompts: [
          { role: "system", content: QUIZ_SYSTEM_PROMPT }
        ],
        topK: 3,
        temperature: 1,
        monitor(monitor: any) {
          monitor.addEventListener("downloadprogress", (e: any) => { });
        }
      });
      setStatus("Generating with Gemini AI...");
      const prompt = QUIZ_PROMPT(inputText);
      const quizResult = await session.prompt(prompt);
      const quizObj = parseQuiz(quizResult);
      setQuiz(quizObj);
      setStatus("Quiz generated!");
    } catch (error: any) {
      setStatus("Failed to generate: " + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOptionSelect = (index: number) => {
    if (showResult) return;
    setSelectedIndex(index);
  };

  const handleSubmit = () => {
    if (selectedIndex === null) return;
    setShowResult(true);
  };

  const handleReset = () => {
    setSelectedIndex(null);
    setShowResult(false);
  };

  const isCorrect = selectedIndex === quiz?.correctIndex;

  return (
    <div className="space-y-4 w-full max-w-full">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Quiz
            <Badge variant="outline">Gemini AI-Powered</Badge>
          </CardTitle>
          <CardDescription>
            Test your understanding with AI-generated questions
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4">
          <Textarea
            className="w-full border rounded p-2 min-h-[100px] mb-2"
            placeholder="Enter or paste content to generate a quiz..."
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            disabled={isProcessing}
          />
          <div className="flex gap-2 mb-2">
            <Button onClick={handleGenerateQuiz} disabled={isProcessing || !inputText.trim()} className="flex-1">
              {isProcessing ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Generating...</>
              ) : (
                <><Sparkles className="mr-2 h-4 w-4" />Generate Quiz</>
              )}
            </Button>
          </div>
          {status && <div className="text-xs text-slate-500 mb-2">{status}</div>}
        </CardContent>
      </Card>
      {quiz && (
        <>
          {/* Question */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-start gap-2 mb-2">
                <span className="font-semibold text-base flex-1">Quiz Question</span>
                {showResult && (
                  <Badge variant={isCorrect ? "default" : "destructive"} className="text-xs">
                    {isCorrect ? "Correct!" : "Incorrect"}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-slate-800 leading-relaxed break-words">{quiz.question}</p>

              {/* Options */}
              <div className="space-y-2 py-2">
                {quiz.options.map((option, index) => {
                  const isSelected = selectedIndex === index;
                  const isCorrectOption = index === quiz.correctIndex;
                  let variant: "outline" | "default" | "destructive" = "outline";
                  let icon = null;
                  if (showResult) {
                    if (isCorrectOption) {
                      variant = "default";
                      icon = <CheckCircle2 className="h-3 w-3 flex-shrink-0" />;
                    } else if (isSelected && !isCorrectOption) {
                      variant = "destructive";
                      icon = <XCircle className="h-3 w-3 flex-shrink-0" />;
                    }
                  } else if (isSelected) {
                    variant = "default";
                  }
                  return (
                    <Button
                      key={index}
                      variant={variant}
                      className={`w-full justify-start h-auto p-3 text-left min-h-[44px] whitespace-normal ${showResult ? "cursor-default" : "cursor-pointer"}`}
                      onClick={() => handleOptionSelect(index)}
                      disabled={showResult}
                    >
                      <div className="flex items-start gap-2 w-full">
                        <div className="flex items-center gap-1.5 flex-shrink-0 mt-0.5">
                          <span className="font-medium text-xs">
                            {String.fromCharCode(65 + index)})
                          </span>
                          {icon}
                        </div>
                        <span className="flex-1 text-xs leading-relaxed break-words text-left whitespace-normal">
                          {option}
                        </span>
                      </div>
                    </Button>
                  );
                })}
              </div>
              {/* Controls */}
              <div className="flex gap-2 py-2">
                {!showResult ? (
                  <Button
                    onClick={handleSubmit}
                    disabled={selectedIndex === null}
                    className="flex-1 text-sm"
                    size="sm"
                  >
                    Submit Answer
                  </Button>
                ) : (
                  <Button
                    onClick={handleReset}
                    variant="outline"
                    className="flex-1 text-sm"
                    size="sm"
                  >
                    Try Again
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
          {/* Explanation */}
          {showResult && quiz.explanation && (
            <Card className="w-full">
              <CardContent className="pt-4">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="font-medium text-slate-900 mb-1 text-sm">Explanation</span>
                    <p className="text-xs text-slate-700 leading-relaxed break-words">
                      {quiz.explanation}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}; 