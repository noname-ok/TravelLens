import { ArrowLeft, MapPin, Camera } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Card } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';

interface MapPin {
  id: string;
  type: 'post' | 'attraction';
  name: string;
  lat: number;
  lng: number;
}

interface MapViewScreenProps {
  pins: MapPin[];
  onBack: () => void;
}

export function MapViewScreen({ pins, onBack }: MapViewScreenProps) {
  const postPins = pins.filter(p => p.type === 'post');
  const attractionPins = pins.filter(p => p.type === 'attraction');

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-border">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <h2 className="font-semibold flex-1">Map View</h2>
        <div className="flex gap-2">
          <Badge variant="secondary">
            <Camera className="w-3 h-3 mr-1" />
            {postPins.length}
          </Badge>
          <Badge variant="secondary">
            <MapPin className="w-3 h-3 mr-1" />
            {attractionPins.length}
          </Badge>
        </div>
      </div>

      {/* Map Area */}
      <div className="flex-1 relative bg-muted/20">
        {/* Map Placeholder */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full"></div>
              <MapPin className="relative w-20 h-20 text-primary mx-auto" />
            </div>
            <div>
              <h3 className="font-semibold mb-2">Interactive Map</h3>
              <p className="text-sm text-muted-foreground max-w-xs">
                Your posts and nearby attractions would appear here
              </p>
            </div>
          </div>
        </div>

        {/* Map Controls */}
        <div className="absolute top-4 right-4 space-y-2">
          <Button size="icon" variant="secondary" className="shadow-lg">
            <span className="text-lg">+</span>
          </Button>
          <Button size="icon" variant="secondary" className="shadow-lg">
            <span className="text-lg">−</span>
          </Button>
        </div>
      </div>

      {/* Pin Legend */}
      <div className="p-4 border-t border-border space-y-3">
        <h3 className="font-semibold text-sm">Legend</h3>
        <div className="grid grid-cols-2 gap-3">
          <Card className="p-3 flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary"></div>
            <span className="text-sm">Your Posts</span>
          </Card>
          <Card className="p-3 flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-secondary"></div>
            <span className="text-sm">Attractions</span>
          </Card>
        </div>
      </div>
    </div>
  );
}
