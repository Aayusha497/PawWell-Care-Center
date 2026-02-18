import { useState } from 'react';
import { toast } from 'sonner';
import { createContactMessage } from '../../services/api';
import '../../pages/About.css';

interface ContactPageProps {
  onBack?: () => void;
  onBook?: () => void;
  onActivityLog?: () => void;
  onTimeline?: () => void;
  onAbout?: () => void;
  onEmergency?: () => void;
  onLogout?: () => void;
  userFullName?: string;
}

export default function ContactPage({
  onBack,
  onBook,
  onActivityLog,
  onTimeline,
  onAbout,
  onEmergency,
  onLogout,
  userFullName,
}: ContactPageProps) {
  const [formValues, setFormValues] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    location: '',
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const userInitials = userFullName
    ? userFullName.split(' ').map((name) => name[0]).join('').toUpperCase()
    : null;

  const handleChange = (field: keyof typeof formValues) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormValues((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const { fullName, email, phoneNumber, location, subject, message } = formValues;

    if (!fullName.trim() || !email.trim() || !phoneNumber.trim() || !location.trim() || !subject.trim() || !message.trim()) {
      toast.error('Please complete all fields before sending.');
      return;
    }

    try {
      setIsSubmitting(true);
      await createContactMessage({
        fullName: fullName.trim(),
        email: email.trim(),
        phoneNumber: phoneNumber.trim(),
        location: location.trim(),
        subject: subject.trim(),
        message: message.trim(),
      });
      toast.success('Message sent! We will get back to you soon.');
      setFormValues({
        fullName: '',
        email: '',
        phoneNumber: '',
        location: '',
        subject: '',
        message: '',
      });
    } catch (error: any) {
      toast.error(error.message || 'Failed to send message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="about-page">
      <div className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Contact Us</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            We're here to help! Reach out to us with any questions or concerns.
          </p>
        </div>
      </div>

      <section className="about-contact">
        <div className="contact-info">
          <h2>Contact PawWell</h2>
          <p>Have a question about care, bookings, or availability? Reach out anytime.</p>
          <div className="contact-details">
            <p>📍 Kathmandu, Nepal</p>
            <p>📞 +977-9703712593</p>
            <p>✉️ support@pawwell.com</p>
            <p>⏱️ Emergency support available 24/7</p>
          </div>
        </div>
        <form className="contact-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <label>Full Name</label>
            <input
              type="text"
              placeholder="Your full name"
              value={formValues.fullName}
              onChange={handleChange('fullName')}
            />
          </div>
          <div className="form-row">
            <label>Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={formValues.email}
              onChange={handleChange('email')}
            />
          </div>
          <div className="form-row">
            <label>Phone Number</label>
            <input
              type="tel"
              placeholder="Your phone number"
              value={formValues.phoneNumber}
              onChange={handleChange('phoneNumber')}
            />
          </div>
          <div className="form-row">
            <label>Location</label>
            <input
              type="text"
              placeholder="Your city or location"
              value={formValues.location}
              onChange={handleChange('location')}
            />
          </div>
          <div className="form-row">
            <label>Subject</label>
            <input
              type="text"
              placeholder="How can we help?"
              value={formValues.subject}
              onChange={handleChange('subject')}
            />
          </div>
          <div className="form-row">
            <label>Message</label>
            <textarea
              rows={5}
              placeholder="Tell us about your pet and your needs."
              value={formValues.message}
              onChange={handleChange('message')}
            />
          </div>
          <button type="submit" className="btn-primary" disabled={isSubmitting}>
            {isSubmitting ? 'Sending...' : 'Send Message'}
          </button>
        </form>
      </section>
    </div>
  );
}
