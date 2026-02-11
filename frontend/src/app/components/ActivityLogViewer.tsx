import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { ScrollArea } from './ui/scroll-area';
import { UtensilsCrossed, Footprints, Gamepad2, Pill, Bell } from 'lucide-react';
import { format } from 'date-fns';
import { getActivityLogs, getUserPets } from '../../services/api';

interface Pet {
  pet_id: number;
  name: string;
}

interface ActivityLog {
  activity_id: number;
  activity_type: 'feeding' | 'walk' | 'playtime' | 'medication' | 'grooming' | 'training' | 'veterinary' | 'other';
  detail?: string | null;
  timestamp: string;
  pet?: {
    pet_id: number;
    name: string;
  };
  user?: {
    first_name?: string;
    last_name?: string;
  };
}

interface ActivityLogViewerProps {
  onBack?: () => void;
  onLogout?: () => void;
  userFullName?: string;
  onBook?: () => void;
}

export default function ActivityLogViewer({ onBack, onLogout, userFullName, onBook }: ActivityLogViewerProps) {
  const userInitials = userFullName
    ? userFullName.split(' ').map((name) => name[0]).join('').toUpperCase()
    : 'U';
  const [selectedPet, setSelectedPet] = useState<string>('all');
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [petsResponse, logsResponse] = await Promise.all([
          getUserPets(),
          getActivityLogs(),
        ]);

        const petList = petsResponse.pets || petsResponse.data || [];
        setPets(Array.isArray(petList) ? petList : []);

        const logList = logsResponse.data || [];
        setActivities(Array.isArray(logList) ? logList : []);
      } catch (err: any) {
        console.error('Error fetching activity logs:', err);
        setError(err.message || 'Failed to load activity logs');
        setActivities([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'feeding':
        return <UtensilsCrossed className="text-orange-500" size={20} />;
      case 'walk':
        return <Footprints className="text-blue-500" size={20} />;
      case 'playtime':
        return <Gamepad2 className="text-green-500" size={20} />;
      case 'medication':
        return <Pill className="text-red-500" size={20} />;
      default:
        return <Bell size={20} />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'feeding':
        return 'bg-orange-100 text-orange-700';
      case 'walk':
        return 'bg-blue-100 text-blue-700';
      case 'playtime':
        return 'bg-green-100 text-green-700';
      case 'medication':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const filteredActivities = selectedPet === 'all'
    ? activities
    : activities.filter((activity) => activity.pet?.pet_id === Number(selectedPet));

  const groupedActivities = filteredActivities.reduce((groups, activity) => {
    const date = format(new Date(activity.timestamp), 'yyyy-MM-dd');
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(activity);
    return groups;
  }, {} as Record<string, ActivityLog[]>);

  return (
    <div className="min-h-screen bg-[#FFF9F5]">
      <nav className="bg-white border-b px-8 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🐾</span>
            </div>
            <div className="flex items-center gap-6">
              <button
                type="button"
                onClick={onBack}
                className="px-4 py-2 rounded-full bg-[#FFE4A3] font-medium"
              >
                Home
              </button>
              <button
                type="button"
                onClick={onBook}
                className="px-4 py-2 hover:bg-gray-100 rounded-full"
              >
                Booking
              </button>
              <button type="button" className="px-4 py-2 hover:bg-gray-100 rounded-full">
                Activity Log
              </button>
              <button type="button" className="px-4 py-2 hover:bg-gray-100 rounded-full">
                About
              </button>
              <button type="button" className="px-4 py-2 hover:bg-gray-100 rounded-full">
                Contact
              </button>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
              <span className="text-sm font-medium">{userInitials}</span>
            </div>
            <button className="px-4 py-2 bg-[#FF6B6B] text-white rounded-full text-sm flex items-center gap-2">
              <span>📞</span> Emergency
            </button>
            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="px-4 py-2.5 bg-red-50 text-red-600 rounded-lg font-medium hover:bg-red-100 transition-colors"
              >
                Logout
              </button>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl">Activity Logs</h2>
          </div>
          <div className="flex items-center gap-4">
            <Select value={selectedPet} onValueChange={setSelectedPet}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Pets</SelectItem>
                {pets.map((pet) => (
                  <SelectItem key={pet.pet_id} value={String(pet.pet_id)}>
                    {pet.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Card>
        <CardHeader>
          <CardTitle>Recent Activities</CardTitle>
          <p className="text-sm text-gray-600">
            Daily updates about your pet's care, activities, and wellbeing
          </p>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px] pr-4">
            {loading ? (
              <div className="py-10 text-center text-gray-500">Loading activity logs...</div>
            ) : error ? (
              <div className="py-10 text-center text-red-600">{error}</div>
            ) : Object.keys(groupedActivities).length === 0 ? (
              <div className="py-10 text-center text-gray-500">
                No activity updates yet. Your pet's daily activities will appear here once our caretakers log them.
              </div>
            ) : (
              Object.entries(groupedActivities).map(([date, dayActivities]) => (
                <div key={date} className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <h3 className="text-lg">{format(new Date(date), 'EEEE, MMMM dd, yyyy')}</h3>
                    <Badge variant="secondary">{dayActivities.length} activities</Badge>
                  </div>

                  <div className="space-y-3 ml-4 border-l-2 border-gray-200 pl-4">
                    {dayActivities
                      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                      .map((activity) => (
                        <div key={activity.activity_id} className="relative">
                          <div className="absolute -left-[1.65rem] top-2 w-3 h-3 bg-[#EAB308] rounded-full"></div>
                          <Card className="hover:shadow-md transition-shadow">
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-3">
                                  {getActivityIcon(activity.activity_type)}
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <h4>{activity.pet?.name || 'Unknown Pet'}</h4>
                                      <Badge className={getActivityColor(activity.activity_type)}>
                                        {activity.activity_type}
                                      </Badge>
                                    </div>
                                    <p className="text-sm text-gray-600">
                                      by {activity.user?.first_name || 'Caretaker'} {activity.user?.last_name || ''}
                                    </p>
                                  </div>
                                </div>
                                <span className="text-sm text-gray-500">
                                  {format(new Date(activity.timestamp), 'h:mm a')}
                                </span>
                              </div>
                              {activity.detail && <p className="text-sm mb-1">{activity.detail}</p>}
                            </CardContent>
                          </Card>
                        </div>
                      ))}
                  </div>
                </div>
              ))
            )}
          </ScrollArea>
        </CardContent>
        </Card>
      </main>
    </div>
  );
}
