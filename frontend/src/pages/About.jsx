import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './About.css';

const About = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const whyItems = useMemo(() => ([
    'Pet profiles store allergies and medical needs for safer care.',
    'Admin approval ensures safety and controlled capacity.',
    'Booking calendar prevents overbooking and conflicts.',
    'Care updates with photos and an activity timeline.',
    'Secure login with role-based access.'
  ]), []);

  const handleBookService = () => {
    if (isAuthenticated) {
      navigate('/booking');
      return;
    }

    navigate('/login', { state: { from: '/booking' } });
  };

  const handleContact = () => {
    const section = document.getElementById('contact');
    if (section) {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleAddPet = () => {
    if (isAuthenticated) {
      navigate('/pets/add');
      return;
    }

    navigate('/login', { state: { from: '/pets/add' } });
  };

  return (
    <div className="about-page">
      <section className="about-hero">
        <div className="about-hero-content">
          <p className="about-pill">About PawWell Pet Care</p>
          <h1>Safe care when you are busy or traveling.</h1>
          <p className="about-hero-subtitle">
            PawWell keeps pet owners connected with verified caretakers, structured care, and daily activity updates.
          </p>
          <div className="about-hero-actions">
            <button className="btn-primary" onClick={handleBookService}>Book a Service</button>
            <button className="btn-outline" onClick={handleContact}>Contact Us</button>
          </div>
        </div>
        <div className="about-hero-card">
          <div className="about-hero-highlight">
            <span>Verified Care</span>
            <h3>Transparency you can trust</h3>
            <p>Every log, photo, and update is tracked in one secure place.</p>
          </div>
          <div className="about-hero-badge">
            <span>24/7</span>
            <small>Emergency support</small>
          </div>
        </div>
      </section>

      <section className="about-cards">
        <div className="section-title">
          <h2>Trusted care, built for real life</h2>
          <p>Everything you need to book with confidence.</p>
        </div>
        <div className="card-grid">
          <article className="trust-card">
            <h3>Verified Care & Secure Facility</h3>
            <p>Approved caretakers, secure check-ins, and monitored spaces for peace of mind.</p>
          </article>
          <article className="trust-card">
            <h3>Daily Activity Updates</h3>
            <p>Meals, walks, playtime, and wellness updates delivered with photos.</p>
          </article>
          <article className="trust-card">
            <h3>Emergency Support</h3>
            <p>Clear escalation paths, emergency protocols, and caretaker readiness.</p>
          </article>
        </div>
      </section>

      <section className="about-why">
        <div className="section-title">
          <h2>Why PawWell?</h2>
          <p>Human-friendly explanations of the platform features.</p>
        </div>
        <div className="why-grid">
          <ul>
            {whyItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <div className="why-panel">
            <h3>Always in the loop</h3>
            <p>View activity timelines and photos the moment a caretaker posts them.</p>
            <button className="btn-outline" onClick={handleAddPet}>Add Pet Profile</button>
          </div>
        </div>
      </section>

      <section className="about-steps">
        <div className="section-title">
          <h2>How it works</h2>
          <p>From sign-up to daily updates in three simple steps.</p>
        </div>
        <div className="steps-grid">
          <div className="step-card">
            <span>01</span>
            <h3>Create account + add pet</h3>
            <p>Save medical notes, allergies, and care preferences.</p>
          </div>
          <div className="step-card">
            <span>02</span>
            <h3>Book service + choose dates</h3>
            <p>Availability checks keep scheduling seamless.</p>
          </div>
          <div className="step-card">
            <span>03</span>
            <h3>Drop off pet + receive updates</h3>
            <p>Follow activity logs and photos throughout their stay.</p>
          </div>
        </div>
      </section>

      <section className="about-mv">
        <div className="mv-card">
          <h3>Mission</h3>
          <p>Deliver safe, transparent pet care with technology that builds trust.</p>
        </div>
        <div className="mv-card">
          <h3>Vision</h3>
          <p>Become the most reliable pet care partner for families and caretakers.</p>
        </div>
      </section>

      <section className="about-team">
        <div className="section-title">
          <h2>Team / Project</h2>
          <p>Final year project details.</p>
        </div>
        <div className="team-grid">
          <article>
            <h3>Developed by</h3>
            <p>Your Name Here</p>
            <span>Full-Stack Developer</span>
          </article>
          <article>
            <h3>Supervised by</h3>
            <p>Supervisor Name</p>
            <span>Project Supervisor</span>
          </article>
        </div>
      </section>

      <section id="contact" className="about-contact">
        <div className="contact-info">
          <h2>Contact PawWell</h2>
          <p>Have a question about care, bookings, or availability? Reach out anytime.</p>
          <div className="contact-details">
            <p>📍 Kathmandu, Nepal</p>
            <p>📞 +977-1-XXXXXXX</p>
            <p>✉️ support@pawwell.com</p>
            <p>⏱️ Emergency support available 24/7</p>
          </div>
        </div>
        <form className="contact-form">
          <div className="form-row">
            <label>Full Name</label>
            <input type="text" placeholder="Your full name" />
          </div>
          <div className="form-row">
            <label>Email</label>
            <input type="email" placeholder="you@example.com" />
          </div>
          <div className="form-row">
            <label>Subject</label>
            <input type="text" placeholder="How can we help?" />
          </div>
          <div className="form-row">
            <label>Message</label>
            <textarea rows="5" placeholder="Tell us about your pet and your needs." />
          </div>
          <button type="button" className="btn-primary">Send Message</button>
        </form>
      </section>
    </div>
  );
};

export default About;
