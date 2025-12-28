import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Calendar } from './ui/calendar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { CalendarDays, MapPin, Clock, CreditCard } from 'lucide-react';
import { format, isBefore, startOfDay } from 'date-fns';

interface Booking {
  id: string;
  petName: string;
  service: string;
  dropOffDate: Date;
  pickupDate: Date;
  dropOffLocation?: string;
  pickupLocation?: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  totalAmount: number;
}

export default function BookingSystem() {
  const [selectedDropOffDate, setSelectedDropOffDate] = useState<Date>();
  const [selectedPickupDate, setSelectedPickupDate] = useState<Date>();
  const [bookings, setBookings] = useState<Booking[]>([
    {
      id: '1',
      petName: 'Max',
      service: 'Overnight Boarding',
      dropOffDate: new Date(2024, 11, 30),
      pickupDate: new Date(2025, 0, 2),
      status: 'confirmed',
      totalAmount: 135
    }
  ]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [formData, setFormData] = useState({
    petName: '',
    service: '',
    needsPickup: false,
    dropOffLocation: '',
    pickupLocation: '',
    specialRequests: ''
  });

  const today = startOfDay(new Date());

  const services = [
    { name: 'Day Care', price: 25 },
    { name: 'Overnight Boarding', price: 45 },
    { name: 'Grooming', price: 40 },
    { name: 'Extended Stay (Week)', price: 280 }
  ];

  const calculateTotal = () => {
    if (!selectedDropOffDate || !selectedPickupDate || !formData.service) return 0;
    
    const days = Math.ceil((selectedPickupDate.getTime() - selectedDropOffDate.getTime()) / (1000 * 60 * 60 * 24));
    const servicePrice = services.find(s => s.name === formData.service)?.price || 0;
    return days * servicePrice;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedDropOffDate || !selectedPickupDate) {
      alert('Please select both drop-off and pickup dates');
      return;
    }

    const newBooking: Booking = {
      id: Date.now().toString(),
      petName: formData.petName,
      service: formData.service,
      dropOffDate: selectedDropOffDate,
      pickupDate: selectedPickupDate,
      dropOffLocation: formData.needsPickup ? formData.dropOffLocation : undefined,
      pickupLocation: formData.needsPickup ? formData.pickupLocation : undefined,
      status: 'pending',
      totalAmount: calculateTotal()
    };

    setSelectedBooking(newBooking);
    setIsDialogOpen(false);
    setPaymentDialogOpen(true);
  };

  const handlePayment = (method: 'khalti' | 'esewa') => {
    if (selectedBooking) {
      setBookings([...bookings, { ...selectedBooking, status: 'confirmed' }]);
      setPaymentDialogOpen(false);
      setSelectedBooking(null);
      alert(`Payment via ${method === 'khalti' ? 'Khalti' : 'eSewa'} successful! Booking confirmed.`);
      resetForm();
    }
  };

  const resetForm = () => {
    setFormData({
      petName: '',
      service: '',
      needsPickup: false,
      dropOffLocation: '',
      pickupLocation: '',
      specialRequests: ''
    });
    setSelectedDropOffDate(undefined);
    setSelectedPickupDate(undefined);
  };

  const handleCancelBooking = (id: string) => {
    if (confirm('Are you sure you want to cancel this booking?')) {
      setBookings(bookings.map(b => 
        b.id === id ? { ...b, status: 'cancelled' } : b
      ));
    }
  };

  const handleReschedule = (booking: Booking) => {
    setFormData({
      petName: booking.petName,
      service: booking.service,
      needsPickup: !!booking.dropOffLocation,
      dropOffLocation: booking.dropOffLocation || '',
      pickupLocation: booking.pickupLocation || '',
      specialRequests: ''
    });
    setSelectedDropOffDate(booking.dropOffDate);
    setSelectedPickupDate(booking.pickupDate);
    setIsDialogOpen(true);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl">Book a Service</h2>
        <Button onClick={() => setIsDialogOpen(true)} className="bg-[#EAB308] hover:bg-[#D4A017]">
          <CalendarDays className="mr-2" size={18} />
          New Booking
        </Button>
      </div>

      {/* Booking Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Booking</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="petName">Pet Name *</Label>
                <Select 
                  value={formData.petName}
                  onValueChange={(value) => setFormData({ ...formData, petName: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select your pet" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Max">Max</SelectItem>
                    <SelectItem value="Bella">Bella</SelectItem>
                    <SelectItem value="Charlie">Charlie</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="service">Service *</Label>
                <Select 
                  value={formData.service}
                  onValueChange={(value) => setFormData({ ...formData, service: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select service" />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map(service => (
                      <SelectItem key={service.name} value={service.name}>
                        {service.name} - ${service.price}/day
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label>Drop-off Date *</Label>
                <Calendar
                  mode="single"
                  selected={selectedDropOffDate}
                  onSelect={setSelectedDropOffDate}
                  disabled={(date) => isBefore(date, today)}
                  className="rounded-md border mt-2"
                />
              </div>

              <div>
                <Label>Pickup Date *</Label>
                <Calendar
                  mode="single"
                  selected={selectedPickupDate}
                  onSelect={setSelectedPickupDate}
                  disabled={(date) => 
                    isBefore(date, today) || 
                    (selectedDropOffDate ? isBefore(date, selectedDropOffDate) : false)
                  }
                  className="rounded-md border mt-2"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="needsPickup"
                checked={formData.needsPickup}
                onChange={(e) => setFormData({ ...formData, needsPickup: e.target.checked })}
                className="w-4 h-4"
              />
              <Label htmlFor="needsPickup">I need pickup/drop-off service</Label>
            </div>

            {formData.needsPickup && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="dropOffLocation">Drop-off Location</Label>
                  <Input
                    id="dropOffLocation"
                    value={formData.dropOffLocation}
                    onChange={(e) => setFormData({ ...formData, dropOffLocation: e.target.value })}
                    placeholder="Enter address..."
                  />
                </div>
                <div>
                  <Label htmlFor="pickupLocation">Pickup Location</Label>
                  <Input
                    id="pickupLocation"
                    value={formData.pickupLocation}
                    onChange={(e) => setFormData({ ...formData, pickupLocation: e.target.value })}
                    placeholder="Enter address..."
                  />
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="specialRequests">Special Requests</Label>
              <Textarea
                id="specialRequests"
                value={formData.specialRequests}
                onChange={(e) => setFormData({ ...formData, specialRequests: e.target.value })}
                placeholder="Any special requirements or instructions..."
              />
            </div>

            {selectedDropOffDate && selectedPickupDate && formData.service && (
              <Card className="bg-[#FFF8E8]">
                <CardContent className="pt-6">
                  <div className="flex justify-between items-center">
                    <span>Estimated Total:</span>
                    <span className="text-2xl">${calculateTotal()}</span>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-[#EAB308] hover:bg-[#D4A017]">
                Proceed to Payment
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Payment</DialogTitle>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-4">
              <Card className="bg-[#FFF8E8]">
                <CardContent className="pt-6 space-y-2">
                  <div className="flex justify-between">
                    <span>Pet:</span>
                    <span>{selectedBooking.petName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Service:</span>
                    <span>{selectedBooking.service}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Duration:</span>
                    <span>
                      {format(selectedBooking.dropOffDate, 'MMM dd')} - {format(selectedBooking.pickupDate, 'MMM dd, yyyy')}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t text-xl">
                    <span>Total Amount:</span>
                    <span>${selectedBooking.totalAmount}</span>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-2">
                <p className="text-sm text-gray-600">Select Payment Method:</p>
                <div className="grid grid-cols-2 gap-4">
                  <Button
                    onClick={() => handlePayment('khalti')}
                    className="h-16 bg-purple-600 hover:bg-purple-700"
                  >
                    <CreditCard className="mr-2" />
                    Khalti
                  </Button>
                  <Button
                    onClick={() => handlePayment('esewa')}
                    className="h-16 bg-green-600 hover:bg-green-700"
                  >
                    <CreditCard className="mr-2" />
                    eSewa
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Existing Bookings */}
      <div className="mt-8">
        <h3 className="text-xl mb-4">My Bookings</h3>
        <div className="space-y-4">
          {bookings.map((booking) => (
            <Card key={booking.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-3">
                      <h4 className="text-lg">{booking.petName} - {booking.service}</h4>
                      <Badge 
                        variant={booking.status === 'confirmed' ? 'default' : booking.status === 'pending' ? 'secondary' : 'destructive'}
                      >
                        {booking.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <CalendarDays size={16} />
                        <span>{format(booking.dropOffDate, 'MMM dd')} - {format(booking.pickupDate, 'MMM dd, yyyy')}</span>
                      </div>
                      {booking.dropOffLocation && (
                        <div className="flex items-center gap-1">
                          <MapPin size={16} />
                          <span>Pickup service included</span>
                        </div>
                      )}
                    </div>
                    <div className="text-lg">
                      Total: ${booking.totalAmount}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {booking.status === 'confirmed' && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReschedule(booking)}
                        >
                          Reschedule
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleCancelBooking(booking.id)}
                        >
                          Cancel
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
