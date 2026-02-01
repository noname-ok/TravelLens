import { useState } from 'react';
import { ArrowLeft, Share2, Lock, Globe } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Card } from '@/app/components/ui/card';
import { Textarea } from '@/app/components/ui/textarea';
import { Switch } from '@/app/components/ui/switch';
import { Label } from '@/app/components/ui/label';

interface JournalPostScreenProps {
  image: string;
  aiCaption: string;
  onBack: () => void;
  onShare: (post: { caption: string; thoughts: string; isPublic: boolean }) => void;
}

export function JournalPostScreen({
  image,
  aiCaption,
  onBack,
  onShare,
}: JournalPostScreenProps) {
  const [caption, setCaption] = useState(aiCaption);
  const [thoughts, setThoughts] = useState('');
  const [isPublic, setIsPublic] = useState(false);

  const handleShare = () => {
    onShare({ caption, thoughts, isPublic });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <h2 className="font-semibold">Create Journal Post</h2>
        <Button onClick={handleShare} size="sm">
          <Share2 className="w-4 h-4 mr-2" />
          Share
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Image Preview */}
        <Card className="overflow-hidden">
          <img
            src={image}
            alt="Journal post"
            className="w-full h-64 object-cover"
          />
        </Card>

        {/* AI-Generated Caption */}
        <Card className="p-4 space-y-3">
          <Label>AI-Generated Caption</Label>
          <Textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Edit the AI-generated caption..."
            className="min-h-20 resize-none"
          />
        </Card>

        {/* Personal Thoughts */}
        <Card className="p-4 space-y-3">
          <Label>Your Thoughts</Label>
          <Textarea
            value={thoughts}
            onChange={(e) => setThoughts(e.target.value)}
            placeholder="Add your personal thoughts and experiences..."
            className="min-h-32 resize-none"
          />
        </Card>

        {/* Privacy Settings */}
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isPublic ? (
                <Globe className="w-5 h-5 text-primary" />
              ) : (
                <Lock className="w-5 h-5 text-muted-foreground" />
              )}
              <div>
                <Label>Make Public</Label>
                <p className="text-sm text-muted-foreground">
                  Share this post with others
                </p>
              </div>
            </div>
            <Switch
              checked={isPublic}
              onCheckedChange={setIsPublic}
            />
          </div>
        </Card>

        {/* Metadata Info */}
        <Card className="p-4 bg-muted/30">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>📍 Location will be saved</span>
            <span>📅 {new Date().toLocaleDateString()}</span>
          </div>
        </Card>
      </div>
    </div>
  );
}
