import { Camera, Map, BookOpen } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Card } from '@/app/components/ui/card';
import { motion } from 'motion/react';

interface HomeScreenProps {
  onTakePhoto: () => void;
  onViewMap: () => void;
  onViewJournal: () => void;
}

export function HomeScreen({ onTakePhoto, onViewMap, onViewJournal }: HomeScreenProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-background to-muted/30">
      <div className="w-full max-w-md space-y-8">
        {/* Hero Section */}
        <motion.div
          className="text-center space-y-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <motion.div
            className="relative inline-block"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full"></div>
            <Camera className="relative w-20 h-20 mx-auto text-primary" />
          </motion.div>
          <h1 className="text-4xl font-semibold text-foreground font-[Poly]">TravelLens</h1>
          <p className="text-muted-foreground font-[Ponnala]">
            Understand the world around you with AI
          </p>
        </motion.div>

        {/* Primary CTA */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.4 }}
        >
          <Button
            onClick={onTakePhoto}
            size="lg"
            className="w-full h-14 text-lg shadow-lg hover:shadow-xl transition-all"
          >
            <Camera className="w-6 h-6 mr-2" />
            Take a Photo
          </Button>
        </motion.div>

        {/* Secondary Actions */}
        <motion.div
          className="grid grid-cols-2 gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <Card
            onClick={onViewMap}
            className="p-6 cursor-pointer hover:bg-accent/50 transition-all hover:shadow-md"
          >
            <Map className="w-8 h-8 text-primary mb-2" />
            <p className="font-medium">View Map</p>
            <p className="text-sm text-muted-foreground">Explore nearby</p>
          </Card>

          <Card
            onClick={onViewJournal}
            className="p-6 cursor-pointer hover:bg-accent/50 transition-all hover:shadow-md"
          >
            <BookOpen className="w-8 h-8 text-primary mb-2" />
            <p className="font-medium">My Journal</p>
            <p className="text-sm text-muted-foreground">Your memories</p>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}