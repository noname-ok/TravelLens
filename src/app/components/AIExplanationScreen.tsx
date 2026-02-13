import { useState } from 'react';
import {
  ArrowLeft,
  Languages,
  MessageCircle,
  MapPin,
  BookmarkPlus,
  Lightbulb,
} from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { TranslateModal } from './TranslateModal';
import { AIChatSheet } from './AIChatSheet';
import type { AIExplanationResult } from '../services/geminiService';

interface AIExplanationScreenProps {
  image: string;
  explanation: AIExplanationResult;
  onBack: () => void;
  onViewAttractions: () => void;
  onSaveToJournal: () => void;
}

export function AIExplanationScreen({
  image,
  explanation,
  onBack,
  onViewAttractions,
  onSaveToJournal,
}: AIExplanationScreenProps) {
  const [isTranslateOpen, setIsTranslateOpen] = useState(false);
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);

  return (
    <>
      <div className="min-h-screen flex flex-col bg-background">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-border">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <h2 className="font-semibold flex-1">AI Explanation</h2>
          <Button variant="ghost" size="icon" onClick={onSaveToJournal}>
            <BookmarkPlus className="w-6 h-6" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Image Preview */}
          <Card className="overflow-hidden">
            <img
              src={image}
              alt="Captured moment"
              className="w-full h-64 object-cover"
            />
          </Card>

          {/* AI Explanation Card */}
          <Card className="p-6 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary">{explanation.category}</Badge>
                </div>
                <h3 className="text-xl font-semibold mb-2">
                  {explanation.title}
                </h3>
              </div>
            </div>

            <p className="text-foreground leading-relaxed">
              {explanation.description}
            </p>

            {/* Interesting Fact */}
            {explanation.interestingFact && (
              <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 flex gap-3">
                <Lightbulb className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-primary mb-1 uppercase">
                    Fun Fact
                  </p>
                  <p className="text-sm text-primary/90">
                    {explanation.interestingFact}
                  </p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => setIsTranslateOpen(true)}
              >
                <Languages className="w-4 h-4 mr-2" />
                Translate
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => setIsAIChatOpen(true)}
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Ask AI
              </Button>
            </div>
          </Card>

          {/* Cultural Etiquette Alert */}
          {explanation.culturalNote && (
            <Card className="p-4 bg-amber-50 border border-amber-200 dark:bg-amber-950/20 dark:border-amber-900">
              <div className="flex gap-3">
                <div className="text-2xl">⚠️</div>
                <div className="flex-1">
                  <h4 className="font-semibold mb-1 text-amber-900 dark:text-amber-100">
                    Cultural Note
                  </h4>
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    {explanation.culturalNote}
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Nearby Attractions CTA */}
          <Card
            onClick={onViewAttractions}
            className="p-6 cursor-pointer hover:bg-accent/50 transition-all hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold">Nearby Attractions</h4>
                  <p className="text-sm text-muted-foreground">
                    Discover places around you
                  </p>
                </div>
              </div>
              <ArrowLeft className="w-5 h-5 rotate-180 text-muted-foreground" />
            </div>
          </Card>
        </div>
      </div>

      {/* Translate Modal */}
      <TranslateModal
        isOpen={isTranslateOpen}
        onClose={() => setIsTranslateOpen(false)}
        imageData={image}
      />

      {/* AI Chat Sheet */}
      <AIChatSheet
        isOpen={isAIChatOpen}
        onClose={() => setIsAIChatOpen(false)}
        imageData={image}
        explanation={explanation}
      />
    </>
  );
}
