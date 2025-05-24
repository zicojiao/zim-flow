import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "~components/ui/card";
import { Button } from "~components/ui/button";
import { Badge } from "~components/ui/badge";
import { Textarea } from "~components/ui/textarea";
import { Progress } from "~components/ui/progress";
import {
  Languages,
  ArrowRightLeft,
  Copy,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Download
} from "lucide-react";

interface TranslatorProps {
  sourceLanguage: string;
  targetLanguage: string;
  onLanguageChange?: (source: string, target: string) => void;
}

interface TranslationState {
  isAvailable: boolean | null;
  isCreating: boolean;
  isTranslating: boolean;
  downloadProgress: number;
  error: string | null;
}

// Language options
const languages = [
  { code: "en", name: "English" },
  { code: "zh-CN", name: "Chinese (Simplified)" },
  { code: "zh-TW", name: "Chinese (Traditional)" },
  { code: "es", name: "Spanish" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "ja", name: "Japanese" },
  { code: "ko", name: "Korean" },
  { code: "pt", name: "Portuguese" },
  { code: "ru", name: "Russian" },
  { code: "ar", name: "Arabic" },
  { code: "hi", name: "Hindi" },
  { code: "it", name: "Italian" },
  { code: "nl", name: "Dutch" },
  { code: "sv", name: "Swedish" },
  { code: "da", name: "Danish" },
  { code: "no", name: "Norwegian" },
  { code: "fi", name: "Finnish" },
  { code: "pl", name: "Polish" },
  { code: "tr", name: "Turkish" }
];

export const TranslatorViewer: React.FC<TranslatorProps> = ({
  sourceLanguage,
  targetLanguage,
  onLanguageChange
}) => {
  const [inputText, setInputText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [translator, setTranslator] = useState<any>(null);
  const [state, setState] = useState<TranslationState>({
    isAvailable: null,
    isCreating: false,
    isTranslating: false,
    downloadProgress: 0,
    error: null
  });

  // Check translator availability when languages change
  useEffect(() => {
    checkTranslatorAvailability();
  }, [sourceLanguage, targetLanguage]);

  const checkTranslatorAvailability = async () => {
    try {
      setState(prev => ({ ...prev, isAvailable: null, error: null }));

      // Check if Translator API is available
      if (!('Translator' in self)) {
        setState(prev => ({
          ...prev,
          isAvailable: false,
          error: "Translator API not available in this browser"
        }));
        return;
      }

      const capabilities = await Translator.availability({
        sourceLanguage,
        targetLanguage,
      });

      const isAvailable = capabilities === "available" || capabilities === "downloadable" || capabilities === "downloading";
      setState(prev => ({
        ...prev,
        isAvailable,
        error: isAvailable ? null : "Language pair not supported"
      }));

      console.log(`Translator availability for ${sourceLanguage} -> ${targetLanguage}:`, capabilities);
    } catch (error) {
      console.error("Error checking translator availability:", error);
      setState(prev => ({
        ...prev,
        isAvailable: false,
        error: "Failed to check translator availability"
      }));
    }
  };

  const createTranslator = async () => {
    try {
      setState(prev => ({ ...prev, isCreating: true, error: null, downloadProgress: 0 }));

      const newTranslator = await Translator.create({
        sourceLanguage,
        targetLanguage,
        monitor(m: any) {
          m.addEventListener('downloadprogress', (e: any) => {
            const progress = Math.round(e.loaded * 100);
            setState(prev => ({ ...prev, downloadProgress: progress }));
            console.log(`Downloaded ${progress}% of translation model`);
          });
        },
      });

      setTranslator(newTranslator);
      setState(prev => ({
        ...prev,
        isCreating: false,
        downloadProgress: 100
      }));

      console.log("Translator created successfully");
    } catch (error) {
      console.error("Error creating translator:", error);
      setState(prev => ({
        ...prev,
        isCreating: false,
        error: "Failed to create translator. Make sure the language pair is supported."
      }));
    }
  };

  const handleTranslate = async () => {
    if (!translator || !inputText.trim()) return;

    try {
      setState(prev => ({ ...prev, isTranslating: true, error: null }));

      const result = await translator.translate(inputText);
      setTranslatedText(result);

      setState(prev => ({ ...prev, isTranslating: false }));
      console.log("Translation completed");
    } catch (error) {
      console.error("Error translating text:", error);
      setState(prev => ({
        ...prev,
        isTranslating: false,
        error: "Translation failed. Please try again."
      }));
    }
  };

  const handleSwapLanguages = () => {
    if (onLanguageChange) {
      onLanguageChange(targetLanguage, sourceLanguage);
    }
    // Clear translator when languages change
    if (translator) {
      translator.destroy();
      setTranslator(null);
    }
    setTranslatedText("");
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (error) {
      console.error("Failed to copy text:", error);
    }
  };

  const getLanguageName = (code: string) => {
    return languages.find(lang => lang.code === code)?.name || code;
  };

  return (
    <div className="space-y-4 w-full max-w-full">
      {/* Language Selection */}
      <Card className="w-full">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Languages className="h-4 w-4" />
            <span className="flex-1">Language Translation</span>
            {state.isAvailable && (
              <Badge variant="default" className="text-xs">
                {getLanguageName(sourceLanguage)} → {getLanguageName(targetLanguage)}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium">{getLanguageName(sourceLanguage)}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSwapLanguages}
              className="h-8 w-8 p-0"
              title="Swap languages"
            >
              <ArrowRightLeft className="h-3 w-3" />
            </Button>
            <span className="font-medium">{getLanguageName(targetLanguage)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Status Card */}
      <Card className="w-full">
        <CardContent className="pt-4">
          <div className="flex items-center gap-2 mb-3">
            {state.isAvailable === null ? (
              <Loader2 className="h-4 w-4 animate-spin text-slate-500" />
            ) : state.isAvailable ? (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-500" />
            )}
            <span className="text-sm font-medium">
              {state.isAvailable === null
                ? "Checking availability..."
                : state.isAvailable
                  ? "Language pair supported"
                  : "Language pair not supported"
              }
            </span>
          </div>

          {/* Download Progress */}
          {state.isCreating && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <Download className="h-3 w-3" />
                <span>Downloading translation model... {state.downloadProgress}%</span>
              </div>
              <Progress value={state.downloadProgress} className="h-2" />
            </div>
          )}

          {/* Error Display */}
          {state.error && (
            <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
              {state.error}
            </div>
          )}

          {/* Create Translator Button */}
          {state.isAvailable && !translator && !state.isCreating && (
            <Button
              onClick={createTranslator}
              className="w-full"
              size="sm"
            >
              Initialize Translator
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Translation Interface */}
      {translator && (
        <div className="space-y-4">
          {/* Input Text */}
          <Card className="w-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">
                Source Text ({getLanguageName(sourceLanguage)})
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <Textarea
                placeholder="Enter text to translate..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="min-h-[120px] resize-none"
                disabled={state.isTranslating}
              />
              <div className="flex gap-2 mt-3">
                <Button
                  onClick={handleTranslate}
                  disabled={!inputText.trim() || state.isTranslating}
                  className="flex-1"
                  size="sm"
                >
                  {state.isTranslating ? (
                    <>
                      <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                      Translating...
                    </>
                  ) : (
                    <>
                      <Languages className="mr-2 h-3 w-3" />
                      Translate
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Translated Text */}
          {translatedText && (
            <Card className="w-full">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-sm">
                  <span>Translation ({getLanguageName(targetLanguage)})</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(translatedText)}
                    className="h-6 px-2"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="bg-slate-50 p-3 rounded-lg border min-h-[120px]">
                  <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
                    {translatedText}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};
