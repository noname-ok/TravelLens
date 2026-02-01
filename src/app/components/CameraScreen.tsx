import { useState, useRef } from 'react';
import { Camera, Upload, X, Check } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Card } from '@/app/components/ui/card';

interface CameraScreenProps {
  onCapture: (imageData: string) => void;
  onBack: () => void;
}

export function CameraScreen({ onCapture, onBack }: CameraScreenProps) {
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCapturedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleConfirm = () => {
    if (capturedImage) {
      onCapture(capturedImage);
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <X className="w-6 h-6" />
        </Button>
        <h2 className="font-semibold">Capture Moment</h2>
        <div className="w-10"></div>
      </div>

      {/* Camera Preview / Captured Image */}
      <div className="flex-1 flex items-center justify-center bg-muted/20 p-4">
        {capturedImage ? (
          <Card className="w-full max-w-2xl overflow-hidden">
            <img
              src={capturedImage}
              alt="Captured"
              className="w-full h-auto"
            />
          </Card>
        ) : (
          <div className="text-center space-y-6">
            <div className="w-64 h-64 mx-auto rounded-3xl bg-card border-2 border-dashed border-border flex items-center justify-center">
              <Camera className="w-24 h-24 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">
              Snap anything to understand it
            </p>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="p-6 border-t border-border space-y-4">
        {capturedImage ? (
          <div className="flex gap-4">
            <Button
              onClick={handleRetake}
              variant="outline"
              size="lg"
              className="flex-1"
            >
              Retake
            </Button>
            <Button
              onClick={handleConfirm}
              size="lg"
              className="flex-1"
            >
              <Check className="w-5 h-5 mr-2" />
              Confirm
            </Button>
          </div>
        ) : (
          <>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*"
              capture="environment"
              className="hidden"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              size="lg"
              className="w-full h-16 rounded-full"
            >
              <Camera className="w-6 h-6 mr-2" />
              Take Photo
            </Button>
            <Button
              onClick={() => {
                const input = fileInputRef.current;
                if (input) {
                  input.removeAttribute('capture');
                  input.click();
                }
              }}
              variant="outline"
              size="lg"
              className="w-full"
            >
              <Upload className="w-5 h-5 mr-2" />
              Upload from Gallery
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
