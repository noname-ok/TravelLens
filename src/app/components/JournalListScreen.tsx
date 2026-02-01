import { ArrowLeft, Calendar, MapPin, Lock, Globe } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Card } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';

interface JournalEntry {
  id: string;
  image: string;
  caption: string;
  thoughts: string;
  date: string;
  isPublic: boolean;
  location?: string;
}

interface JournalListScreenProps {
  entries: JournalEntry[];
  onBack: () => void;
}

export function JournalListScreen({ entries, onBack }: JournalListScreenProps) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-border">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <h2 className="font-semibold flex-1">My Travel Journal</h2>
        <Badge variant="secondary">{entries.length} posts</Badge>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {entries.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-3">
              <div className="text-6xl mb-4">📔</div>
              <h3 className="font-semibold">No Journal Entries Yet</h3>
              <p className="text-sm text-muted-foreground max-w-xs">
                Start capturing moments to build your travel journal
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {entries.map((entry) => (
              <Card key={entry.id} className="overflow-hidden hover:shadow-md transition-shadow">
                <img
                  src={entry.image}
                  alt={entry.caption}
                  className="w-full h-48 object-cover"
                />
                <div className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <h4 className="font-semibold flex-1">{entry.caption}</h4>
                    {entry.isPublic ? (
                      <Globe className="w-4 h-4 text-primary flex-shrink-0" />
                    ) : (
                      <Lock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    )}
                  </div>
                  
                  {entry.thoughts && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {entry.thoughts}
                    </p>
                  )}

                  <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t border-border">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {entry.date}
                    </span>
                    {entry.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {entry.location}
                      </span>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
