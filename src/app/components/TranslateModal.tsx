import { useState } from 'react';
import { X, Loader2, Copy, Check } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Card } from '@/app/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { translateImageText } from '@/app/services/geminiService';
import { toast } from 'sonner';

interface TranslateModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageData: string;
}

const SUPPORTED_LANGUAGES = [
  { code: 'English', label: 'English' },
  { code: 'Spanish', label: 'Spanish (Español)' },
  { code: 'French', label: 'French (Français)' },
  { code: 'German', label: 'German (Deutsch)' },
  { code: 'Italian', label: 'Italian (Italiano)' },
  { code: 'Portuguese', label: 'Portuguese (Português)' },
  { code: 'Japanese', label: 'Japanese (日本語)' },
  { code: 'Chinese', label: 'Chinese (中文)' },
  { code: 'Korean', label: 'Korean (한국어)' },
  { code: 'Russian', label: 'Russian (Русский)' },
  { code: 'Arabic', label: 'Arabic (العربية)' },
  { code: 'Hindi', label: 'Hindi (हिंदी)' },
  { code: 'Thai', label: 'Thai (ไทย)' },
  { code: 'Vietnamese', label: 'Vietnamese (Tiếng Việt)' },
];

export function TranslateModal({ isOpen, onClose, imageData }: TranslateModalProps) {
  const [targetLanguage, setTargetLanguage] = useState('English');
  const [translation, setTranslation] = useState<{
    originalText: string;
    translatedText: string;
    sourceLanguage: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleTranslate = async () => {
    if (!imageData) {
      toast.error('No image available');
      return;
    }

    setIsLoading(true);
    try {
      const result = await translateImageText(imageData, targetLanguage);
      setTranslation(result);
    } catch (error) {
      console.error('Translation error:', error);
      toast.error('Failed to translate. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (translation?.translatedText) {
      try {
        await navigator.clipboard.writeText(translation.translatedText);
        setCopied(true);
        toast.success('Copied to clipboard!');
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        toast.error('Failed to copy');
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Translate Text</DialogTitle>
          <DialogDescription>
            Extract and translate text from your image to any language
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Language Selector */}
          <div className="space-y-2">
            <label className="block text-sm font-medium">Target Language</label>
            <Select value={targetLanguage} onValueChange={setTargetLanguage} disabled={isLoading}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SUPPORTED_LANGUAGES.map(lang => (
                  <SelectItem key={lang.code} value={lang.code}>
                    {lang.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Translate Button */}
          {!translation && (
            <Button
              onClick={handleTranslate}
              disabled={isLoading}
              className="w-full"
              size="lg"
            >
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isLoading ? 'Translating...' : 'Translate'}
            </Button>
          )}

          {/* Results */}
          {translation && (
            <div className="space-y-4">
              {translation.sourceLanguage && (
                <div className="text-xs text-muted-foreground text-center">
                  Detected: {translation.sourceLanguage} → {targetLanguage}
                </div>
              )}

              {translation.originalText !== 'No text found' && (
                <Card className="p-4 bg-muted/50">
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase">
                      Original Text
                    </p>
                    <p className="text-sm leading-relaxed">
                      {translation.originalText}
                    </p>
                  </div>
                </Card>
              )}

              <Card className="p-4 border-primary/50 bg-primary/5">
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase">
                    Translation
                  </p>
                  <p className="text-sm leading-relaxed font-medium">
                    {translation.translatedText}
                  </p>
                  {translation.translatedText !== 'No text found' && (
                    <Button
                      onClick={copyToClipboard}
                      variant="ghost"
                      size="sm"
                      className="w-full"
                    >
                      {copied ? (
                        <>
                          <Check className="w-4 h-4 mr-2 text-green-600" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 mr-2" />
                          Copy Translation
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </Card>

              <Button
                onClick={() => {
                  setTranslation(null);
                  setTargetLanguage('English');
                }}
                variant="outline"
                className="w-full"
              >
                Translate Again
              </Button>
            </div>
          )}

          {translation?.translatedText === 'No text found' && (
            <Card className="p-4 bg-amber-50 border-amber-200">
              <p className="text-sm text-amber-800">
                No text was found in this image. Try with an image that contains text like signs,
                menus, or labels.
              </p>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
