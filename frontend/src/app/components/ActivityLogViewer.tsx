import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { ScrollArea } from './ui/scroll-area';
import { UtensilsCrossed, Footprints, Gamepad2, Pill, Bell } from 'lucide-react';
import { format } from 'date-fns';

interface ActivityLog {
  id: string;
  petName: string;
  type: 'feeding' | 'walk' | 'playtime' | 'medication';
  description: string;
  caretakerName: string;
  timestamp: Date;
  notes?: string;
}

export default function ActivityLogViewer() {
  const [selectedPet, setSelectedPet] = useState<string>('all');
  
  const [activities] = useState<ActivityLog[]>([
    {
      id: '1',
      petName: 'Max',
      type: 'feeding',
      description: 'Fed regular meal with chicken and rice',
      caretakerName: 'Sarah Johnson',
      timestamp: new Date(2024, 11, 28, 8, 30),
      notes: 'Ate well, finished entire bowl'
    },
    {
      id: '2',
      petName: 'Max',
      type: 'walk',
      description: '30-minute morning walk in the park',
      caretakerName: 'Mike Chen',
      timestamp: new Date(2024, 11, 28, 10, 0),
      notes: 'Very energetic, played with other dogs'
    },
    {
      id: '3',
      petName: 'Max',
      type: 'playtime',
      description: 'Indoor play session with toys',
      caretakerName: 'Sarah Johnson',
      timestamp: new Date(2024, 11, 28, 14, 30),
      notes: 'Enjoyed fetch and tug-of-war'
    },
    {
      id: '4',
      petName: 'Max',
      type: 'medication',
      description: 'Administered daily vitamin supplement',
      caretakerName: 'Dr. Emily Parker',
      timestamp: new Date(2024, 11, 28, 16, 0)
    },
    {
      id: '5',
      petName: 'Max',
      type: 'feeding',
      description: 'Evening meal with beef and vegetables',
      caretakerName: 'Sarah Johnson',
      timestamp: new Date(2024, 11, 28, 18, 30),
      notes: 'Good appetite'
    },
    {
      id: '6',
      petName: 'Bella',
      type: 'feeding',
      description: 'Morning meal - salmon and rice formula',
      caretakerName: 'Sarah Johnson',
      timestamp: new Date(2024, 11, 28, 9, 0),
      notes: 'Ate slowly but finished'
    },
    {
      id: '7',
      petName: 'Bella',
      type: 'walk',
      description: '20-minute gentle walk',
      caretakerName: 'Mike Chen',
      timestamp: new Date(2024, 11, 28, 11, 0),
      notes: 'Preferred staying in shade'
    }
  ]);

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
    : activities.filter(a => a.petName === selectedPet);

  const groupedActivities = filteredActivities.reduce((groups, activity) => {
    const date = format(activity.timestamp, 'yyyy-MM-dd');
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(activity);
    return groups;
  }, {} as Record<string, ActivityLog[]>);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl">Activity Logs</h2>
        <div className="flex items-center gap-4">
          <Select value={selectedPet} onValueChange={setSelectedPet}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Pets</SelectItem>
              <SelectItem value="Max">Max</SelectItem>
              <SelectItem value="Bella">Bella</SelectItem>
              <SelectItem value="Charlie">Charlie</SelectItem>
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
            {Object.entries(groupedActivities).map(([date, dayActivities]) => (
              <div key={date} className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <h3 className="text-lg">{format(new Date(date), 'EEEE, MMMM dd, yyyy')}</h3>
                  <Badge variant="secondary">{dayActivities.length} activities</Badge>
                </div>
                
                <div className="space-y-3 ml-4 border-l-2 border-gray-200 pl-4">
                  {dayActivities
                    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
                    .map((activity) => (
                      <div key={activity.id} className="relative">
                        <div className="absolute -left-[1.65rem] top-2 w-3 h-3 bg-[#EAB308] rounded-full"></div>
                        <Card className="hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-3">
                                {getActivityIcon(activity.type)}
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h4>{activity.petName}</h4>
                                    <Badge className={getActivityColor(activity.type)}>
                                      {activity.type}
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-gray-600">
                                    by {activity.caretakerName}
                                  </p>
                                </div>
                              </div>
                              <span className="text-sm text-gray-500">
                                {format(activity.timestamp, 'h:mm a')}
                              </span>
                            </div>
                            <p className="text-sm mb-1">{activity.description}</p>
                            {activity.notes && (
                              <p className="text-sm text-gray-600 italic">
                                Note: {activity.notes}
                              </p>
                            )}
                          </CardContent>
                        </Card>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4 mt-6">
        <Card>
          <CardContent className="pt-6 text-center">
            <UtensilsCrossed className="mx-auto mb-2 text-orange-500" size={32} />
            <p className="text-2xl">
              {filteredActivities.filter(a => a.type === 'feeding').length}
            </p>
            <p className="text-sm text-gray-600">Feedings</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <Footprints className="mx-auto mb-2 text-blue-500" size={32} />
            <p className="text-2xl">
              {filteredActivities.filter(a => a.type === 'walk').length}
            </p>
            <p className="text-sm text-gray-600">Walks</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <Gamepad2 className="mx-auto mb-2 text-green-500" size={32} />
            <p className="text-2xl">
              {filteredActivities.filter(a => a.type === 'playtime').length}
            </p>
            <p className="text-sm text-gray-600">Playtime</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <Pill className="mx-auto mb-2 text-red-500" size={32} />
            <p className="text-2xl">
              {filteredActivities.filter(a => a.type === 'medication').length}
            </p>
            <p className="text-sm text-gray-600">Medications</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
