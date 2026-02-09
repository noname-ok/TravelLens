import LoginScreen from '@/app/components/LoginScreen';
import { Toaster } from '@/app/components/ui/sonner';

export default function App() {
  return (
    <div className="h-screen overflow-hidden bg-background flex items-center justify-center">
      <div className="w-full h-full max-w-md mx-auto border-x border-border shadow-2xl flex flex-col">
        <Toaster position="top-center" />
        <LoginScreen />
      </div>
    </div>
  );
}
