import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "~components/ui/card";
import { Button } from "~components/ui/button";
import { Badge } from "~components/ui/badge";
import { CheckCircle2, XCircle, Info } from "lucide-react";

interface Quiz {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

interface QuizViewerProps {
  quiz: Quiz | null;
}

export const QuizViewer: React.FC<QuizViewerProps> = ({ quiz }) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);

  if (!quiz) {
    return (
      <div className="text-center p-6 text-slate-500">
        <p className="text-sm">No quiz available. Generate a summary first.</p>
      </div>
    );
  }

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

  const isCorrect = selectedIndex === quiz.correctIndex;

  return (
    <div className="space-y-4 w-full max-w-full">
      {/* Question */}
      <Card className="w-full">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-start gap-2 text-base">
            <span className="flex-1">Quiz Question</span>
            {showResult && (
              <Badge variant={isCorrect ? "default" : "destructive"} className="text-xs">
                {isCorrect ? "Correct!" : "Incorrect"}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-sm text-slate-800 leading-relaxed break-words">{quiz.question}</p>
        </CardContent>
      </Card>

      {/* Options */}
      <div className="space-y-2">
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
              className={`w-full justify-start h-auto p-3 text-left min-h-[44px] whitespace-normal ${
                showResult ? "cursor-default" : "cursor-pointer"
              }`}
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
      <div className="flex gap-2">
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

      {/* Explanation */}
      {showResult && quiz.explanation && (
        <Card className="w-full">
          <CardContent className="pt-4">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-slate-900 mb-1 text-sm">Explanation</h4>
                <p className="text-xs text-slate-700 leading-relaxed break-words">
                  {quiz.explanation}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}; 