import { useState } from 'react';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { LogOut, Users, Calendar, DollarSign, ClipboardList, Plus, Check, X } from 'lucide-react';
import { format } from 'date-fns';

interface User {
  id: string;
  email: string;
  role: 'user' | 'admin';
  fullName: string;
}

interface AdminDashboardProps {
  user: User;
  onLogout: () => void;
}

interface Booking {
  id: string;
  petName: string;
  ownerName: string;
  service: string;
  dropOffDate: Date;
  pickupDate: Date;
  status: 'pending' | 'approved' | 'in-progress' | 'completed';
  totalAmount: number;
}

interface StaffShift {
  id: string;
  staffName: string;
  date: Date;
  startTime: string;
  endTime: string;
  role: string;
}

export default function AdminDashboard({ user, onLogout }: AdminDashboardProps) {
  const [bookings, setBookings] = useState<Booking[]>([
    {
      id: '1',
      petName: 'Max',
      ownerName: 'John Doe',
      service: 'Overnight Boarding',
      dropOffDate: new Date(2024, 11, 30),
      pickupDate: new Date(2025, 0, 2),
      status: 'pending',
      totalAmount: 135
    },
    {
      id: '2',
      petName: 'Bella',
      ownerName: 'Jane Smith',
      service: 'Day Care',
      dropOffDate: new Date(2024, 11, 29),
      pickupDate: new Date(2024, 11, 29),
      status: 'approved',
      totalAmount: 25
    },
    {
      id: '3',
      petName: 'Charlie',
      ownerName: 'Mike Johnson',
      service: 'Grooming',
      dropOffDate: new Date(2024, 11, 28),
      pickupDate: new Date(2024, 11, 28),
      status: 'in-progress',
      totalAmount: 40
    }
  ]);

  const [shifts, setShifts] = useState<StaffShift[]>([
    {
      id: '1',
      staffName: 'Sarah Johnson',
      date: new Date(2024, 11, 29),
      startTime: '08:00',
      endTime: '16:00',
      role: 'Caretaker'
    },
    {
      id: '2',
      staffName: 'Mike Chen',
      date: new Date(2024, 11, 29),
      startTime: '09:00',
      endTime: '17:00',
      role: 'Walker'
    },
    {
      id: '3',
      staffName: 'Dr. Emily Parker',
      date: new Date(2024, 11, 29),
      startTime: '10:00',
      endTime: '14:00',
      role: 'Veterinarian'
    }
  ]);

  const [isShiftDialogOpen, setIsShiftDialogOpen] = useState(false);
  const [shiftFormData, setShiftFormData] = useState({
    staffName: '',
    date: '',
    startTime: '',
    endTime: '',
    role: ''
  });

  const handleApproveBooking = (id: string) => {
    setBookings(bookings.map(b => 
      b.id === id ? { ...b, status: 'approved' as const } : b
    ));
  };

  const handleRejectBooking = (id: string) => {
    if (confirm('Are you sure you want to reject this booking?')) {
      setBookings(bookings.filter(b => b.id !== id));
    }
  };

  const handleAddShift = (e: React.FormEvent) => {
    e.preventDefault();
    const newShift: StaffShift = {
      id: Date.now().toString(),
      staffName: shiftFormData.staffName,
      date: new Date(shiftFormData.date),
      startTime: shiftFormData.startTime,
      endTime: shiftFormData.endTime,
      role: shiftFormData.role
    };
    setShifts([...shifts, newShift]);
    setIsShiftDialogOpen(false);
    setShiftFormData({
      staffName: '',
      date: '',
      startTime: '',
      endTime: '',
      role: ''
    });
  };

  const totalRevenue = bookings
    .filter(b => b.status !== 'pending')
    .reduce((sum, b) => sum + b.totalAmount, 0);

  const pendingBookings = bookings.filter(b => b.status === 'pending').length;
  const approvedBookings = bookings.filter(b => b.status === 'approved').length;
  const currentCapacity = bookings.filter(b => b.status === 'in-progress').length;
  const maxCapacity = 20;

  return (
    <div className="min-h-screen bg-[#FFF8E8]">
      {/* Header */}
      <header className="bg-[#EAB308] px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🐾</span>
          <span className="text-xl">PawWell Admin</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="font-medium">Welcome, {user.fullName}!</span>
          <Button onClick={onLogout} variant="ghost" className="flex items-center gap-2">
            <LogOut size={18} />
            Logout
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-8 py-8">
        <h1 className="text-3xl mb-6">Admin Dashboard</h1>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pending Bookings</p>
                  <p className="text-3xl mt-1">{pendingBookings}</p>
                </div>
                <ClipboardList className="text-yellow-500" size={40} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Approved Bookings</p>
                  <p className="text-3xl mt-1">{approvedBookings}</p>
                </div>
                <Check className="text-green-500" size={40} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Current Capacity</p>
                  <p className="text-3xl mt-1">{currentCapacity}/{maxCapacity}</p>
                </div>
                <Users className="text-blue-500" size={40} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Revenue</p>
                  <p className="text-3xl mt-1">${totalRevenue}</p>
                </div>
                <DollarSign className="text-green-500" size={40} />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="bookings" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="bookings">Manage Bookings</TabsTrigger>
            <TabsTrigger value="shifts">Staff Shifts</TabsTrigger>
            <TabsTrigger value="capacity">Capacity</TabsTrigger>
          </TabsList>

          {/* Bookings Tab */}
          <TabsContent value="bookings">
            <Card>
              <CardHeader>
                <CardTitle>Booking Requests</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Pet Name</TableHead>
                      <TableHead>Owner</TableHead>
                      <TableHead>Service</TableHead>
                      <TableHead>Dates</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bookings.map((booking) => (
                      <TableRow key={booking.id}>
                        <TableCell>{booking.petName}</TableCell>
                        <TableCell>{booking.ownerName}</TableCell>
                        <TableCell>{booking.service}</TableCell>
                        <TableCell>
                          {format(booking.dropOffDate, 'MMM dd')} - {format(booking.pickupDate, 'MMM dd')}
                        </TableCell>
                        <TableCell>${booking.totalAmount}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              booking.status === 'approved' ? 'default' :
                              booking.status === 'pending' ? 'secondary' :
                              booking.status === 'in-progress' ? 'default' :
                              'default'
                            }
                          >
                            {booking.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {booking.status === 'pending' && (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleApproveBooking(booking.id)}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <Check size={16} />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleRejectBooking(booking.id)}
                              >
                                <X size={16} />
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Shifts Tab */}
          <TabsContent value="shifts">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Staff Schedules</CardTitle>
                  <Dialog open={isShiftDialogOpen} onOpenChange={setIsShiftDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-[#EAB308] hover:bg-[#D4A017]">
                        <Plus className="mr-2" size={18} />
                        Add Shift
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Assign New Shift</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleAddShift} className="space-y-4">
                        <div>
                          <Label htmlFor="staffName">Staff Name *</Label>
                          <Select
                            value={shiftFormData.staffName}
                            onValueChange={(value) => setShiftFormData({ ...shiftFormData, staffName: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select staff" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Sarah Johnson">Sarah Johnson</SelectItem>
                              <SelectItem value="Mike Chen">Mike Chen</SelectItem>
                              <SelectItem value="Dr. Emily Parker">Dr. Emily Parker</SelectItem>
                              <SelectItem value="Robert Chen">Robert Chen</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label htmlFor="date">Date *</Label>
                          <Input
                            id="date"
                            type="date"
                            value={shiftFormData.date}
                            onChange={(e) => setShiftFormData({ ...shiftFormData, date: e.target.value })}
                            required
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="startTime">Start Time *</Label>
                            <Input
                              id="startTime"
                              type="time"
                              value={shiftFormData.startTime}
                              onChange={(e) => setShiftFormData({ ...shiftFormData, startTime: e.target.value })}
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="endTime">End Time *</Label>
                            <Input
                              id="endTime"
                              type="time"
                              value={shiftFormData.endTime}
                              onChange={(e) => setShiftFormData({ ...shiftFormData, endTime: e.target.value })}
                              required
                            />
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="role">Role *</Label>
                          <Select
                            value={shiftFormData.role}
                            onValueChange={(value) => setShiftFormData({ ...shiftFormData, role: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Caretaker">Caretaker</SelectItem>
                              <SelectItem value="Walker">Walker</SelectItem>
                              <SelectItem value="Veterinarian">Veterinarian</SelectItem>
                              <SelectItem value="Groomer">Groomer</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="flex gap-2 justify-end">
                          <Button type="button" variant="outline" onClick={() => setIsShiftDialogOpen(false)}>
                            Cancel
                          </Button>
                          <Button type="submit" className="bg-[#EAB308] hover:bg-[#D4A017]">
                            Add Shift
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Staff Name</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Role</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {shifts
                      .sort((a, b) => a.date.getTime() - b.date.getTime())
                      .map((shift) => (
                        <TableRow key={shift.id}>
                          <TableCell>{shift.staffName}</TableCell>
                          <TableCell>{format(shift.date, 'MMMM dd, yyyy')}</TableCell>
                          <TableCell>{shift.startTime} - {shift.endTime}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{shift.role}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Capacity Tab */}
          <TabsContent value="capacity">
            <Card>
              <CardHeader>
                <CardTitle>Facility Capacity Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span>Current Occupancy</span>
                      <span className="text-xl">
                        {currentCapacity} / {maxCapacity} spaces
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-4">
                      <div
                        className="bg-[#EAB308] h-4 rounded-full"
                        style={{ width: `${(currentCapacity / maxCapacity) * 100}%` }}
                      ></div>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                      {maxCapacity - currentCapacity} spaces available
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Card className="bg-green-50">
                      <CardContent className="pt-6">
                        <p className="text-sm text-gray-600">Available Spaces</p>
                        <p className="text-3xl text-green-600">{maxCapacity - currentCapacity}</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-blue-50">
                      <CardContent className="pt-6">
                        <p className="text-sm text-gray-600">Occupied Spaces</p>
                        <p className="text-3xl text-blue-600">{currentCapacity}</p>
                      </CardContent>
                    </Card>
                  </div>

                  <div>
                    <h4 className="text-lg mb-3">Current Guests</h4>
                    <div className="space-y-2">
                      {bookings
                        .filter(b => b.status === 'in-progress')
                        .map((booking) => (
                          <div key={booking.id} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                            <div>
                              <p>{booking.petName}</p>
                              <p className="text-sm text-gray-600">{booking.service}</p>
                            </div>
                            <Badge>In Progress</Badge>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
