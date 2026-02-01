import { User, MapPin, Calendar, Settings, Share2, Heart, Camera as CameraIcon } from 'lucide-react';
import { Button } from '@/app/components/ui/button';

export function ProfileScreen() {
  const stats = [
    { label: 'Posts', value: '24' },
    { label: 'Countries', value: '8' },
    { label: 'Followers', value: '342' },
  ];

  return (
    <div className="h-full bg-background flex flex-col">
      {/* Profile Header */}
      <div className="bg-[#4a6fa5] text-white p-6 pb-8">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-white/20 overflow-hidden border-4 border-white/30">
              <img
                src="https://images.unsplash.com/photo-1569913486515-b74bf7751574?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9maWxlJTIwYXZhdGFyJTIwcG9ydHJhaXQlMjBwZXJzb258ZW58MXx8fHwxNzY5OTMzMjY3fDA&ixlib=rb-4.1.0&q=80&w=1080"
                alt="Profile"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h1 className="text-2xl font-semibold mb-1">Alex Rivera</h1>
              <p className="text-white/80 text-sm">@alexplorer</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="text-white">
            <Settings className="h-5 w-5" />
          </Button>
        </div>

        <p className="text-white/90 text-sm mb-4">
          Exploring the world one photo at a time 📸 | Travel enthusiast | AI-powered storyteller
        </p>

        <div className="flex items-center gap-2 text-sm text-white/80 mb-4">
          <MapPin className="h-4 w-4" />
          <span>Currently in Tokyo, Japan</span>
        </div>

        <div className="flex items-center gap-2 text-sm text-white/80">
          <Calendar className="h-4 w-4" />
          <span>Joined January 2026</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 px-6 py-4 border-b border-border bg-white">
        {stats.map((stat) => (
          <div key={stat.label} className="text-center">
            <div className="text-2xl font-bold text-[#4a6fa5]">{stat.value}</div>
            <div className="text-sm text-muted-foreground">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="px-6 py-4 bg-white border-b border-border">
        <div className="grid grid-cols-2 gap-3">
          <Button variant="default" className="bg-[#4a6fa5] hover:bg-[#3d5a85]">
            <User className="h-4 w-4 mr-2" />
            Edit Profile
          </Button>
          <Button variant="outline">
            <Share2 className="h-4 w-4 mr-2" />
            Share Profile
          </Button>
        </div>
      </div>

      {/* Activity Overview */}
      <div className="flex-1 overflow-y-auto p-6">
        <h2 className="text-lg font-semibold mb-4 text-foreground">Recent Activity</h2>
        
        <div className="space-y-3">
          <ActivityItem
            icon={<CameraIcon className="h-5 w-5 text-[#4a6fa5]" />}
            title="New photo captured"
            description="Historic Temple at Dawn"
            time="2 hours ago"
          />
          <ActivityItem
            icon={<Heart className="h-5 w-5 text-red-500" />}
            title="Sarah liked your post"
            description="Mountain Vista Trail"
            time="5 hours ago"
          />
          <ActivityItem
            icon={<MapPin className="h-5 w-5 text-green-600" />}
            title="Visited new location"
            description="Ancient Quarter"
            time="1 day ago"
          />
          <ActivityItem
            icon={<Share2 className="h-5 w-5 text-blue-500" />}
            title="Post shared 3 times"
            description="Vibrant Street Food Market"
            time="2 days ago"
          />
        </div>

        {/* Achievements */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-4 text-foreground">Achievements</h2>
          <div className="grid grid-cols-3 gap-3">
            <Achievement emoji="🌏" label="Explorer" />
            <Achievement emoji="📸" label="Photographer" />
            <Achievement emoji="✍️" label="Storyteller" />
            <Achievement emoji="🗺️" label="Navigator" />
            <Achievement emoji="⭐" label="Rising Star" />
            <Achievement emoji="🔥" label="Streak Master" />
          </div>
        </div>
      </div>
    </div>
  );
}

function ActivityItem({
  icon,
  title,
  description,
  time,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  time: string;
}) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
      <div className="mt-1">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm text-foreground">{title}</p>
        <p className="text-sm text-muted-foreground truncate">{description}</p>
        <p className="text-xs text-muted-foreground mt-1">{time}</p>
      </div>
    </div>
  );
}

function Achievement({ emoji, label }: { emoji: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-2 p-3 rounded-lg bg-gradient-to-br from-[#4a6fa5]/10 to-[#4a6fa5]/5 border border-[#4a6fa5]/20">
      <div className="text-3xl">{emoji}</div>
      <div className="text-xs font-medium text-center text-foreground">{label}</div>
    </div>
  );
}
