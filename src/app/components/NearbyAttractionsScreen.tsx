import { ArrowLeft, MapPin, Navigation, Star, Clock } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Card } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';

interface Attraction {
  id: string;
  name: string;
  distance: string;
  rating: number;
  category: string;
  description: string;
  recommended: string;
  estimatedTime: string;
}

interface NearbyAttractionsScreenProps {
  attractions: Attraction[];
  onBack: () => void;
  onViewMap: () => void;
}

export function NearbyAttractionsScreen({
  attractions,
  onBack,
  onViewMap,
}: NearbyAttractionsScreenProps) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-border">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <h2 className="font-semibold flex-1">Nearby Attractions</h2>
        <Button variant="ghost" size="icon" onClick={onViewMap}>
          <MapPin className="w-6 h-6" />
        </Button>
      </div>

      {/* Mini Map Preview */}
      <div className="relative h-48 bg-muted/30 border-b border-border">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center space-y-2">
            <MapPin className="w-12 h-12 text-primary mx-auto" />
            <p className="text-sm text-muted-foreground">Map Preview</p>
          </div>
        </div>
        <Button
          onClick={onViewMap}
          size="sm"
          className="absolute bottom-4 right-4 shadow-lg"
        >
          <Navigation className="w-4 h-4 mr-2" />
          Full Map
        </Button>
      </div>

      {/* Attractions List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold">Places Near You</h3>
          <Badge variant="secondary">{attractions.length} found</Badge>
        </div>

        {attractions.map((attraction) => (
          <Card key={attraction.id} className="p-4 hover:shadow-md transition-shadow">
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold">{attraction.name}</h4>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Navigation className="w-3 h-3" />
                      {attraction.distance}
                    </span>
                    <span className="flex items-center gap-1">
                      <Star className="w-3 h-3 fill-primary text-primary" />
                      {attraction.rating}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {attraction.estimatedTime}
                    </span>
                  </div>
                </div>
                <Badge>{attraction.category}</Badge>
              </div>

              <p className="text-sm text-muted-foreground">
                {attraction.description}
              </p>

              <div className="flex items-center gap-2 pt-2 border-t border-border">
                <div className="w-2 h-2 rounded-full bg-primary"></div>
                <span className="text-sm font-medium text-primary">
                  {attraction.recommended}
                </span>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
