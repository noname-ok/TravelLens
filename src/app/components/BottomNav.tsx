import { useLocation, useNavigate } from 'react-router-dom';
import { Camera, Map, BookOpen, User } from 'lucide-react';
import { cn } from '@/app/components/ui/utils';

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  const tabs = [
    { id: 'camera', label: 'Camera', icon: Camera, path: '/camera' },
    { id: 'map', label: 'Map', icon: Map, path: '/map' },
    { id: 'journal', label: 'Journal', icon: BookOpen, path: '/journal' },
    { id: 'profile', label: 'Profile', icon: User, path: '/profile' },
  ];

  const isActive = (path: string) => {
    if (path === '/camera') {
      return location.pathname === '/camera';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-border shadow-lg z-50">
      <div className="max-w-md mx-auto px-4">
        <div className="flex items-center justify-around h-16">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = isActive(tab.path);
            
            return (
              <button
                key={tab.id}
                onClick={() => navigate(tab.path)}
                className={cn(
                  'flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-lg transition-all',
                  active
                    ? 'text-[#4a6fa5]'
                    : 'text-slate-400 hover:text-slate-600'
                )}
              >
                <Icon
                  className={cn(
                    'h-6 w-6 transition-all',
                    active && 'scale-110'
                  )}
                  strokeWidth={active ? 2.5 : 2}
                />
                <span
                  className={cn(
                    'text-xs transition-all',
                    active ? 'font-semibold' : 'font-medium'
                  )}
                >
                  {tab.label}
                </span>
                {active && (
                  <div className="absolute bottom-0 w-12 h-1 bg-[#4a6fa5] rounded-t-full" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
