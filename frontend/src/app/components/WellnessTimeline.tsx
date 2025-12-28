import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Syringe, Calendar, Stethoscope, Plus } from 'lucide-react';
import { format } from 'date-fns';

interface HealthRecord {
  id: string;
  petName: string;
  type: 'vaccination' | 'appointment' | 'checkup';
  title: string;
  date: Date;
  veterinarian?: string;
  notes: string;
  nextDueDate?: Date;
}

export default function WellnessTimeline() {
  const [selectedPet, setSelectedPet] = useState<string>('Max');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [records, setRecords] = useState<HealthRecord[]>([
    {
      id: '1',
      petName: 'Max',
      type: 'vaccination',
      title: 'Rabies Vaccination',
      date: new Date(2024, 5, 15),
      veterinarian: 'Dr. Emily Parker',
      notes: 'Annual rabies vaccine administered. No adverse reactions.',
      nextDueDate: new Date(2025, 5, 15)
    },
    {
      id: '2',
      petName: 'Max',
      type: 'vaccination',
      title: 'DHPP Vaccine',
      date: new Date(2024, 5, 15),
      veterinarian: 'Dr. Emily Parker',
      notes: 'Distemper, Hepatitis, Parainfluenza, Parvovirus vaccine.',
      nextDueDate: new Date(2025, 5, 15)
    },
    {
      id: '3',
      petName: 'Max',
      type: 'checkup',
      title: 'Annual Physical Examination',
      date: new Date(2024, 8, 10),
      veterinarian: 'Dr. Emily Parker',
      notes: 'Overall health excellent. Weight: 30kg. Heart and lungs clear. Dental cleaning recommended.',
      nextDueDate: new Date(2025, 8, 10)
    },
    {
      id: '4',
      petName: 'Max',
      type: 'appointment',
      title: 'Dental Cleaning',
      date: new Date(2024, 10, 5),
      veterinarian: 'Dr. Robert Chen',
      notes: 'Professional dental cleaning performed. Two minor tartar removals. Teeth in good condition.'
    }
  ]);

  const [formData, setFormData] = useState({
    type: 'vaccination' as const,
    title: '',
    date: '',
    veterinarian: '',
    notes: '',
    nextDueDate: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newRecord: HealthRecord = {
      id: Date.now().toString(),
      petName: selectedPet,
      type: formData.type,
      title: formData.title,
      date: new Date(formData.date),
      veterinarian: formData.veterinarian,
      notes: formData.notes,
      nextDueDate: formData.nextDueDate ? new Date(formData.nextDueDate) : undefined
    };

    setRecords([...records, newRecord]);
    setIsDialogOpen(false);
    setFormData({
      type: 'vaccination',
      title: '',
      date: '',
      veterinarian: '',
      notes: '',
      nextDueDate: ''
    });
  };

  const filteredRecords = records
    .filter(r => r.petName === selectedPet)
    .sort((a, b) => b.date.getTime() - a.date.getTime());

  const getRecordIcon = (type: string) => {
    switch (type) {
      case 'vaccination':
        return <Syringe className="text-blue-500" size={24} />;
      case 'appointment':
        return <Calendar className="text-green-500" size={24} />;
      case 'checkup':
        return <Stethoscope className="text-purple-500" size={24} />;
      default:
        return <Calendar size={24} />;
    }
  };

  const getRecordColor = (type: string) => {
    switch (type) {
      case 'vaccination':
        return 'bg-blue-100 text-blue-700';
      case 'appointment':
        return 'bg-green-100 text-green-700';
      case 'checkup':
        return 'bg-purple-100 text-purple-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const upcomingRecords = records.filter(r => 
    r.nextDueDate && r.nextDueDate > new Date() && r.petName === selectedPet
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl">Pet Wellness Timeline</h2>
        <div className="flex items-center gap-4">
          <Select value={selectedPet} onValueChange={setSelectedPet}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Max">Max</SelectItem>
              <SelectItem value="Bella">Bella</SelectItem>
              <SelectItem value="Charlie">Charlie</SelectItem>
            </SelectContent>
          </Select>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#EAB308] hover:bg-[#D4A017]">
                <Plus className="mr-2" size={18} />
                Add Record
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add Health Record for {selectedPet}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="type">Record Type *</Label>
                    <Select 
                      value={formData.type}
                      onValueChange={(value: any) => setFormData({ ...formData, type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="vaccination">Vaccination</SelectItem>
                        <SelectItem value="appointment">Appointment</SelectItem>
                        <SelectItem value="checkup">Checkup</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="date">Date *</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="title">Title/Description *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Rabies Vaccination"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="veterinarian">Veterinarian</Label>
                  <Input
                    id="veterinarian"
                    value={formData.veterinarian}
                    onChange={(e) => setFormData({ ...formData, veterinarian: e.target.value })}
                    placeholder="e.g., Dr. Smith"
                  />
                </div>

                <div>
                  <Label htmlFor="notes">Notes *</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Details about the visit or procedure..."
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="nextDueDate">Next Due Date (if applicable)</Label>
                  <Input
                    id="nextDueDate"
                    type="date"
                    value={formData.nextDueDate}
                    onChange={(e) => setFormData({ ...formData, nextDueDate: e.target.value })}
                  />
                </div>

                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-[#EAB308] hover:bg-[#D4A017]">
                    Add Record
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Upcoming Reminders */}
      {upcomingRecords.length > 0 && (
        <Card className="mb-6 bg-yellow-50 border-yellow-200">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="text-yellow-600" size={20} />
              Upcoming Reminders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {upcomingRecords.map(record => (
                <div key={record.id} className="flex items-center justify-between p-3 bg-white rounded-lg">
                  <div>
                    <p>{record.title}</p>
                    <p className="text-sm text-gray-600">Due: {format(record.nextDueDate!, 'MMMM dd, yyyy')}</p>
                  </div>
                  <Badge className="bg-yellow-100 text-yellow-700">
                    {Math.ceil((record.nextDueDate!.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Health Records Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Health History</CardTitle>
          <p className="text-sm text-gray-600">
            Complete medical history and vaccination records
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 ml-4 border-l-2 border-gray-200 pl-6">
            {filteredRecords.map((record) => (
              <div key={record.id} className="relative">
                <div className="absolute -left-[2.15rem] top-2 w-4 h-4 bg-[#EAB308] rounded-full border-4 border-white"></div>
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {getRecordIcon(record.type)}
                        <div>
                          <h4 className="text-lg">{record.title}</h4>
                          <p className="text-sm text-gray-600">
                            {format(record.date, 'MMMM dd, yyyy')}
                          </p>
                        </div>
                      </div>
                      <Badge className={getRecordColor(record.type)}>
                        {record.type}
                      </Badge>
                    </div>
                    
                    {record.veterinarian && (
                      <p className="text-sm mb-2">
                        <span className="text-gray-600">Veterinarian:</span> {record.veterinarian}
                      </p>
                    )}
                    
                    <p className="text-sm text-gray-700 mb-2">{record.notes}</p>
                    
                    {record.nextDueDate && (
                      <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                        <Calendar size={16} className="text-gray-500" />
                        <p className="text-sm text-gray-600">
                          Next due: {format(record.nextDueDate, 'MMMM dd, yyyy')}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>

          {filteredRecords.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p>No health records for {selectedPet} yet.</p>
              <p className="text-sm">Click "Add Record" to create the first entry.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mt-6">
        <Card>
          <CardContent className="pt-6 text-center">
            <Syringe className="mx-auto mb-2 text-blue-500" size={32} />
            <p className="text-2xl">
              {filteredRecords.filter(r => r.type === 'vaccination').length}
            </p>
            <p className="text-sm text-gray-600">Vaccinations</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <Stethoscope className="mx-auto mb-2 text-purple-500" size={32} />
            <p className="text-2xl">
              {filteredRecords.filter(r => r.type === 'checkup').length}
            </p>
            <p className="text-sm text-gray-600">Checkups</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <Calendar className="mx-auto mb-2 text-green-500" size={32} />
            <p className="text-2xl">
              {filteredRecords.filter(r => r.type === 'appointment').length}
            </p>
            <p className="text-sm text-gray-600">Appointments</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
