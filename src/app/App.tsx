import { useState } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { HomeScreen } from '@/app/components/HomeScreen';
import { CameraScreen } from '@/app/components/CameraScreen';
import { AIProcessingScreen } from '@/app/components/AIProcessingScreen';
import { AIExplanationScreen } from '@/app/components/AIExplanationScreen';
import { NearbyAttractionsScreen } from '@/app/components/NearbyAttractionsScreen';
import { JournalPostScreen } from '@/app/components/JournalPostScreen';
import { MapViewScreen } from '@/app/components/MapViewScreen';
import { JournalListScreen } from '@/app/components/JournalListScreen';
import { ProfileScreen } from '@/app/components/ProfileScreen';
import { BottomNav } from '@/app/components/BottomNav';
import { AppBar } from '@/app/components/AppBar';
import { getRandomExplanation, getMockAttractions } from '@/app/data/mockData';
import type { AIExplanation, Attraction } from '@/app/data/mockData';
import { toast } from 'sonner';
import { Toaster } from '@/app/components/ui/sonner';

interface JournalEntry {
  id: string;
  image: string;
  caption: string;
  thoughts: string;
  date: string;
  isPublic: boolean;
  location?: string;
}

interface AppState {
  capturedImage: string | null;
  currentExplanation: AIExplanation | null;
  attractions: Attraction[];
  journalEntries: JournalEntry[];
}

function AppContent() {
  const navigate = useNavigate();
  const [state, setState] = useState<AppState>({
    capturedImage: null,
    currentExplanation: null,
    attractions: getMockAttractions(),
    journalEntries: [
      {
        id: '1',
        image: 'https://images.unsplash.com/photo-1668948824982-37c263b8dfb4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhbmNpZW50JTIwdGVtcGxlJTIwYXJjaGl0ZWN0dXJlfGVufDF8fHx8MTc2OTkzMTY1Mnww&ixlib=rb-4.1.0&q=80&w=1080',
        caption: 'Historic Temple at Dawn',
        thoughts: 'The intricate carvings and peaceful atmosphere made this a truly memorable experience. The early morning light created perfect conditions for photography.',
        date: 'Jan 28, 2026',
        isPublic: true,
        location: 'Ancient Quarter',
      },
      {
        id: '2',
        image: 'https://images.unsplash.com/photo-1644668523901-f32433ca057c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdHJlZXQlMjBmb29kJTIwbWFya2V0JTIwYXNpYXxlbnwxfHx8fDE3Njk5MzE2NTJ8MA&ixlib=rb-4.1.0&q=80&w=1080',
        caption: 'Vibrant Street Food Market',
        thoughts: 'Amazing local flavors! The vendors were so friendly and the food was absolutely delicious. A must-visit for any food lover.',
        date: 'Jan 29, 2026',
        isPublic: true,
        location: 'Downtown Market',
      },
      {
        id: '3',
        image: 'https://images.unsplash.com/photo-1643892151836-07fe5562d0f2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb3VudGFpbiUyMGxhbmRzY2FwZSUyMHRyYXZlbHxlbnwxfHx8fDE3Njk4NjU4NTV8MA&ixlib=rb-4.1.0&q=80&w=1080',
        caption: 'Mountain Vista Trail',
        thoughts: 'The hike was challenging but the panoramic views at the summit made every step worthwhile.',
        date: 'Jan 30, 2026',
        isPublic: false,
        location: 'Highland Trails',
      },
    ],
  });

  // Camera handler
  const handleCapture = (imageData: string) => {
    setState(prev => ({
      ...prev,
      capturedImage: imageData,
    }));
    
    navigate('/processing');

    // Simulate AI processing
    setTimeout(() => {
      const explanation = getRandomExplanation();
      setState(prev => ({
        ...prev,
        currentExplanation: explanation,
      }));
      navigate('/explanation');
    }, 2500);
  };

  // Journal post handler
  const handleSharePost = (post: { caption: string; thoughts: string; isPublic: boolean }) => {
    const newEntry: JournalEntry = {
      id: Date.now().toString(),
      image: state.capturedImage!,
      caption: post.caption,
      thoughts: post.thoughts,
      date: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
      isPublic: post.isPublic,
      location: 'Current Location',
    };

    setState(prev => ({
      ...prev,
      journalEntries: [newEntry, ...prev.journalEntries],
      capturedImage: null,
      currentExplanation: null,
    }));

    toast.success('Journal entry saved successfully!');
    navigate('/journal');
  };

  // Map pins data
  const mapPins = [
    ...state.journalEntries.map(entry => ({
      id: entry.id,
      type: 'post' as const,
      name: entry.caption,
      lat: 0,
      lng: 0,
    })),
    ...state.attractions.map(attraction => ({
      id: attraction.id,
      type: 'attraction' as const,
      name: attraction.name,
      lat: 0,
      lng: 0,
    })),
  ];

  return (
    <div className="h-screen overflow-hidden bg-background flex items-center justify-center">
      <div className="w-full h-full max-w-md mx-auto border-x border-border shadow-2xl flex flex-col">
        <Toaster position="top-center" />
        
        <AppBar />
        
        <div className="flex-1 overflow-hidden pb-16">
          <Routes>
            <Route
              path="/"
              element={
                <HomeScreen
                  onTakePhoto={() => navigate('/camera')}
                  onViewMap={() => navigate('/map')}
                  onViewJournal={() => navigate('/journal')}
                />
              }
            />
            
            <Route
              path="/camera"
              element={
                <CameraScreen
                  onCapture={handleCapture}
                  onBack={() => navigate('/')}
                />
              }
            />
            
            <Route
              path="/processing"
              element={<AIProcessingScreen />}
            />
            
            <Route
              path="/explanation"
              element={
                state.capturedImage && state.currentExplanation ? (
                  <AIExplanationScreen
                    image={state.capturedImage}
                    explanation={state.currentExplanation}
                    onBack={() => navigate('/')}
                    onViewAttractions={() => navigate('/attractions')}
                    onSaveToJournal={() => navigate('/journal-post')}
                  />
                ) : (
                  <div className="h-full flex items-center justify-center p-6">
                    <p className="text-muted-foreground text-center">No explanation available</p>
                  </div>
                )
              }
            />
            
            <Route
              path="/attractions"
              element={
                <NearbyAttractionsScreen
                  attractions={state.attractions}
                  onBack={() => navigate('/explanation')}
                  onViewMap={() => navigate('/map')}
                />
              }
            />
            
            <Route
              path="/journal-post"
              element={
                state.capturedImage && state.currentExplanation ? (
                  <JournalPostScreen
                    image={state.capturedImage}
                    aiCaption={state.currentExplanation.title}
                    onBack={() => navigate('/explanation')}
                    onShare={handleSharePost}
                  />
                ) : (
                  <div className="h-full flex items-center justify-center p-6">
                    <p className="text-muted-foreground text-center">No image to post</p>
                  </div>
                )
              }
            />
            
            <Route
              path="/map"
              element={
                <MapViewScreen
                  pins={mapPins}
                  onBack={() => navigate('/')}
                />
              }
            />
            
            <Route
              path="/journal"
              element={
                <JournalListScreen
                  entries={state.journalEntries}
                  onBack={() => navigate('/')}
                />
              }
            />
            
            <Route
              path="/profile"
              element={<ProfileScreen />}
            />
          </Routes>
        </div>
        
        <BottomNav />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
