import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Home } from 'lucide-react';
import { Button } from '@/app/components/ui/button';

export function AppBar() {
  const location = useLocation();
  const navigate = useNavigate();

  // Map paths to titles
  const getPageTitle = () => {
    const path = location.pathname;
    
    if (path === '/') return 'TravelLens';
    if (path === '/camera') return 'Take Photo';
    if (path === '/map') return 'Map View';
    if (path === '/journal') return 'My Journal';
    if (path === '/profile') return 'Profile';
    if (path === '/processing') return 'Processing...';
    if (path === '/explanation') return 'AI Explanation';
    if (path === '/attractions') return 'Nearby Attractions';
    if (path === '/journal-post') return 'Create Post';
    
    return 'TravelLens';
  };

  // Determine if we should show back button
  const showBackButton = () => {
    const mainPaths = ['/', '/camera', '/map', '/journal', '/profile'];
    return !mainPaths.includes(location.pathname);
  };

  // Determine if we should show home button
  const showHomeButton = () => {
    return location.pathname !== '/';
  };

  const handleBack = () => {
    navigate(-1);
  };

  const handleHome = () => {
    navigate('/');
  };

  return (
    <header className="bg-[#4a6fa5] text-white px-4 py-3 shadow-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {showBackButton() && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBack}
              className="text-white hover:bg-white/20 h-9 w-9"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <h1 className="text-lg font-semibold truncate">{getPageTitle()}</h1>
        </div>
        
        {showHomeButton() && !showBackButton() && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleHome}
            className="text-white hover:bg-white/20 h-9 w-9"
          >
            <Home className="h-5 w-5" />
          </Button>
        )}
      </div>
    </header>
  );
}
