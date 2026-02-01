import { ArrowLeft, Languages, MessageCircle, MapPin, BookmarkPlus } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Card } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';

interface AIExplanation {
  title: string;
  description: string;
  category: string;
  culturalNote?: string;
}

interface AIExplanationScreenProps {
  image: string;
  explanation: AIExplanation;
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
  return (
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
              <h3 className="text-xl font-semibold mb-2">{explanation.title}</h3>
            </div>
          </div>
          
          <p className="text-foreground leading-relaxed">
            {explanation.description}
          </p>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button variant="outline" size="sm" className="flex-1">
              <Languages className="w-4 h-4 mr-2" />
              Translate
            </Button>
            <Button variant="outline" size="sm" className="flex-1">
              <MessageCircle className="w-4 h-4 mr-2" />
              Ask AI
            </Button>
          </div>
        </Card>

        {/* Cultural Etiquette Alert */}
        {explanation.culturalNote && (
          <Card className="p-4 bg-accent/30 border-accent">
            <div className="flex gap-3">
              <div className="text-2xl">⚠️</div>
              <div className="flex-1">
                <h4 className="font-semibold mb-1">Cultural Note</h4>
                <p className="text-sm text-muted-foreground">
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
  );
}
