import heroImage from '../../assets/hero-dogs.png';
import daycare from "../../assets/daycare.jpg";
import boarding from "../../assets/boarding.jpg";
import grooming from "../../assets/grooming.jpg";
import pawwellchoose from "../../assets/pawwellchoose.png";
import about from "../../assets/about.png";
import { Button } from './ui/button';
import { Card } from './ui/card';

import { Phone, Mail, MapPin } from "lucide-react"; //icon for these useing lucide-react library

interface LandingPageProps {
  onNavigateToLogin: () => void;
  onNavigateToSignup: () => void;
}


export default function LandingPage({ onNavigateToLogin, onNavigateToSignup }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-[#FFF8E8] dark:bg-gray-900">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-8 py-4 bg-[#EAB308] dark:bg-gray-800">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🐾</span>
          <span className="text-xl dark:text-gray-100">PawWell</span>
        </div>
        <div className="flex items-center gap-6">
          <a href="#home" className="hover:underline dark:text-gray-300 dark:hover:text-gray-100">Home</a>
          <Button onClick={onNavigateToLogin} className="bg-[#D4A017] hover:bg-[#C49016] text-white hover:text-white dark:bg-gray-700 dark:hover:bg-gray-600">
            Login
          </Button>
          <Button onClick={onNavigateToSignup} className="bg-[#D4A017] hover:bg-[#C49016] dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white">
            Sign Up
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="home" className="relative px-8 py-16 bg-[#EAB308] dark:bg-gray-800 overflow-hidden">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div className="text-center lg:text-left z-10">
            <h1 className="text-5xl mb-4 dark:text-gray-100">Care they Deserve</h1>
            <p className="text-xl mb-6 dark:text-gray-300">
              Because every pet deserves thoughtful care, timely attention, and a happier routine.
            </p>
            <Button 
              onClick={onNavigateToSignup}
              className="bg-white text-black hover:bg-gray-100 px-8 py-6 text-lg dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
            >
              Booking
            </Button>
          </div>
          <div className="flex justify-center">
            <img 
              src={heroImage} 
              alt="Happy dogs" 
              className="max-w-md w-full object-contain"
            />
          </div>
        </div>
        {/* Decorative wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 0L60 10C120 20 240 40 360 46.7C480 53 600 47 720 43.3C840 40 960 40 1080 46.7C1200 53 1320 67 1380 73.3L1440 80V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0V0Z" fill="#FFF8E8"/>
          </svg>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="px-8 py-16">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl text-center mb-12 dark:text-gray-100">Our Services</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* <Card className="bg-[#F4D878] dark:bg-gray-700 p-8 border-0 h-64 flex flex-col items-center justify-center dark:border-gray-600">
              <img src={daycare} alt="Day Care" className="w-16 h-16 mb-4" />
              <h3 className="text-2xl mb-2 dark:text-gray-100">Day Care</h3>
              <p className="text-center text-gray-700 dark:text-gray-300">Daily supervision and activities for your pets</p>
            </Card> */}
            {/* Pet daycare */}
            <Card className="group relative h-72 overflow-hidden rounded-xl border-0 cursor-pointer transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl">

              {/* Background Image */}
              <img
                src={daycare}
                alt="Day Care"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />

              {/* Overlay */}
              <div className="absolute inset-0 bg-black/40 group-hover:bg-black/60 transition-all duration-300"></div>

              {/* Content */}
              <div className="relative z-10 flex flex-col items-center justify-center h-full text-white text-center px-4 transform transition-all duration-300 group-hover:scale-105">
                <h3 className="text-2xl mb-2">Day Care</h3>
                <p className="opacity-90 group-hover:opacity-100">
                  Fun-filled day care with playtime, social interaction, and constant supervision while you are away.
                </p>
                <Button 
                  onClick={onNavigateToSignup}
                  className="opacity-0 translate-y-6 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 bg-yellow-400 text-black px-4 py-2 rounded-lg font-semibold hover:bg-yellow-300"
              >
                  Book Now
              </Button>
              </div>
              
            </Card>

            {/* Pet boarding */}
            <Card className="group relative h-72 overflow-hidden rounded-xl border-0 cursor-pointer transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl">

              {/* Background Image */}
              <img
                src={boarding}
                alt="Pet Boarding"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />

              {/* Overlay */}
              <div className="absolute inset-0 bg-black/40 group-hover:bg-black/60 transition-all duration-300"></div>

              {/* Content */}
              <div className="relative z-10 flex flex-col items-center justify-center h-full text-white text-center px-4 transform transition-all duration-300 group-hover:scale-105">
                <h3 className="text-2xl mb-2">Pet Boarding</h3>
                <p className="opacity-90 group-hover:opacity-100">
                  Safe and comfortable overnight stays with personalized care, feeding, and supervision for your pet.
                </p>
                <Button 
                  onClick={onNavigateToSignup}
                  className="opacity-0 translate-y-6 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 bg-yellow-400 text-black px-4 py-2 rounded-lg font-semibold hover:bg-yellow-300"
              >
                  Book Now
              </Button>
              </div>
              
            </Card>

            {/* pet grooming */}
            <Card className="group relative h-72 overflow-hidden rounded-xl border-0 cursor-pointer transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl">

              {/* Background Image */}
              <img
                src={grooming}
                alt="Pet Grooming"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />

              {/* Overlay */}
              <div className="absolute inset-0 bg-black/40 group-hover:bg-black/60 transition-all duration-300"></div>

              {/* Content */}
              <div className="relative z-10 flex flex-col items-center justify-center h-full text-white text-center px-4 transform transition-all duration-300 group-hover:scale-105">
                <h3 className="text-2xl mb-2">Pet Grooming</h3>
                <p className="opacity-90 group-hover:opacity-100">
                  Professional grooming services including bathing, trimming, and hygiene care to keep your pet clean and healthy.
                </p>
                <Button 
                  onClick={onNavigateToSignup}
                  className="opacity-0 translate-y-6 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 bg-yellow-400 text-black px-4 py-2 rounded-lg font-semibold hover:bg-yellow-300"
              >
                  Book Now
              </Button>
              </div>
              
            </Card>
          </div>
        </div>
      </section>

      
      {/* How PawWell Works */}
      <section id="how-it-works" className="relative overflow-hidden px-8 py-20 bg-[#FFF8E8] dark:bg-gray-800">
        <div className="absolute top-10 left-6 text-4xl opacity-20 rotate-[-20deg]">🐾</div>
        <div className="absolute top-28 left-16 text-2xl opacity-20 rotate-12">🐾</div>
        <div className="absolute top-20 right-10 text-4xl opacity-20 rotate-12">🐾</div>
        <div className="absolute bottom-24 right-8 text-3xl opacity-20 rotate-[-12deg]">🐾</div>
        <div className="absolute bottom-10 left-10 text-3xl opacity-20 rotate-6">🐾</div>

        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            {/* <p className="text-sm tracking-[0.3em] uppercase text-[#D4A017] font-semibold mb-3">
              Easy Process
            </p> */}
            <h2 className="text-4xl md:text-5xl text-[#D4A017] font-bold dark:text-gray-100">
              How PawWell Works
            </h2>
            <p className="mt-4 max-w-2xl mx-auto text-gray-600 dark:text-gray-300">
              A smooth and simple care journey designed to keep both you and your pet stress-free.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left - Circle image */}
            <div className="flex justify-center">
              <div className="relative w-[320px] h-[320px] sm:w-[380px] sm:h-[380px]">
                <div className="absolute inset-0 rounded-full border-[10px] border-[#7ED3E6] dark:border-[#4BAEC2]" />
                <div className="absolute inset-[16px] rounded-full border-2 border-dashed border-[#7ED3E6]/80 dark:border-[#4BAEC2]/70" />
                <div className="absolute inset-[28px] rounded-full overflow-hidden bg-white shadow-2xl">
                  <img
                    src={heroImage}
                    alt="PawWell care process"
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="absolute -top-3 right-10 bg-[#EAB308] text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg">
                  3 EASY STEPS
                </div>

                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-white dark:bg-gray-900 shadow-lg rounded-full px-5 py-2 border border-[#F4D878] dark:border-gray-700">
                  <p className="text-sm font-semibold text-[#0F6FAF] dark:text-gray-100">
                    Safe • Simple • Trusted
                  </p>
                </div>
              </div>
            </div>

            {/* Right - Content */}
            <div>
              <h3 className="text-3xl md:text-4xl font-bold leading-tight text-[#0F6FAF] dark:text-gray-100">
                Fast, Friendly & Convenient
                <br />
                Pet Care for Every Busy Pet Parent
              </h3>

              <div className="flex flex-wrap gap-3 mt-5 mb-6">
                <span className="text-xs md:text-sm font-semibold uppercase tracking-[0.25em] text-[#7ABF6A]">
                  Stress Free
                </span>
                <span className="text-xs md:text-sm font-semibold uppercase tracking-[0.25em] text-[#7ABF6A]">
                  •
                </span>
                <span className="text-xs md:text-sm font-semibold uppercase tracking-[0.25em] text-[#7ABF6A]">
                  Secure
                </span>
                <span className="text-xs md:text-sm font-semibold uppercase tracking-[0.25em] text-[#7ABF6A]">
                  •
                </span>
                <span className="text-xs md:text-sm font-semibold uppercase tracking-[0.25em] text-[#7ABF6A]">
                  Caring
                </span>
              </div>

              <p className="text-gray-600 dark:text-gray-300 leading-7 mb-8">
                PawWell makes pet care simple when work, travel, or daily responsibilities keep you
                busy. From booking trusted services to getting updates about your pet’s stay, every
                step is designed to give you convenience and peace of mind.
              </p>

              <div className="space-y-4">
                <div className="bg-white/80 dark:bg-gray-900 rounded-2xl p-5 shadow-md border border-[#F4D878] dark:border-gray-700">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 shrink-0 rounded-full bg-[#EAB308] text-white flex items-center justify-center font-bold text-lg shadow">
                      1
                    </div>
                    <div>
                      <h4 className="text-xl font-semibold mb-1 dark:text-gray-100">Book Your Service</h4>
                      <p className="text-gray-600 dark:text-gray-300">
                        Sign up, choose a service, and select your preferred drop-off and pickup date.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white/80 dark:bg-gray-900 rounded-2xl p-5 shadow-md border border-[#F4D878] dark:border-gray-700">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 shrink-0 rounded-full bg-[#0F6FAF] text-white flex items-center justify-center font-bold text-lg shadow">
                      2
                    </div>
                    <div>
                      <h4 className="text-xl font-semibold mb-1 dark:text-gray-100">We Care for Your Pet</h4>
                      <p className="text-gray-600 dark:text-gray-300">
                        Our team provides attentive care, comfort, feeding, playtime, and safety
                        throughout the stay.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white/80 dark:bg-gray-900 rounded-2xl p-5 shadow-md border border-[#F4D878] dark:border-gray-700">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 shrink-0 rounded-full bg-[#7ABF6A] text-white flex items-center justify-center font-bold text-lg shadow">
                      3
                    </div>
                    <div>
                      <h4 className="text-xl font-semibold mb-1 dark:text-gray-100">Stay Updated & Relax</h4>
                      <p className="text-gray-600 dark:text-gray-300">
                        Receive updates and enjoy peace of mind knowing your pet is in safe and loving
                        hands.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <Button
                  onClick={onNavigateToSignup}
                  className="bg-[#0F6FAF] hover:bg-[#0c5a8f] text-white px-8 py-6 text-base rounded-xl"
                >
                  Get Started
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Ratings section*/}
      <section id="ratings" className="px-8 py-16">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl text-center mb-12 dark:text-gray-100">What Our Customers Say</h2>

          {/* fetch ratings and reciew from the cutomer posted ratings an reviews in the database and display here */}
        </div>
      </section>

      {/* Why PawWell */ }
      <section id="why-pawwell" className="px-8 py-20 bg-[#FFF8E8] dark:bg-gray-800">
        <div className="max-w-7xl mx-auto">
          <div className="rounded-[32px] bg-[#F4D878] dark:bg-gray-900 px-8 py-10 md:px-12 md:py-12 overflow-hidden relative shadow-sm">
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
              
              {/* Left Content */}
              <div className="z-10">
                <p className="text-sm uppercase tracking-[0.25em] text-[#C49016] font-bold mb-3">
                  Why Choose Us
                </p>

                <h2 className="text-3xl md:text-5xl font-bold leading-tight text-[#FFFFFF] dark:text-gray-100 mb-5">
                  Trusted Pet Care,
                  <br />
                  Comfort for Every Stay
                </h2>

                <p className="text-gray-800 dark:text-gray-300 leading-7 mb-5 max-w-xl">
                  PawWell provides a reliable and stress-free way to care for your pets when you're busy or away. 
                  We focus on safety, comfort, and transparency so you always feel confident about your pet’s care.
                </p>

                {/* Features */}
                <div className="space-y-3 mb-7">
                  <div className="flex items-start gap-3">
                    <span className="mt-1 text-[#C49016] text-lg">✔</span>
                    <p className="text-gray-800 dark:text-gray-300">
                      Verified caretakers and secure pet handling
                    </p>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="mt-1 text-[#C49016] text-lg">✔</span>
                    <p className="text-gray-800 dark:text-gray-300">
                      Easy booking and flexible scheduling
                    </p>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="mt-1 text-[#C49016] text-lg">✔</span>
                    <p className="text-gray-800 dark:text-gray-300">
                      Real-time updates for peace of mind
                    </p>
                  </div>
                </div>

                {/* <Button
                  onClick={onNavigateToSignup}
                  className="bg-[#EAB308] hover:bg-[#D4A017] text-black px-8 py-6 rounded-xl text-base"
                >
                  Book Now
                </Button> */}
              </div>

              {/* Right Image */}
              <div className="relative flex justify-center lg:justify-end">
                <img
                  src={pawwellchoose}
                  alt="Why Choose PawWell"
                  className="w-full max-w-[520px] object-contain drop-shadow-xl"
                />

                {/* Decorative lines (yellow tone) */}
                <div className="absolute -bottom-2 left-8 w-28 h-[3px] bg-[#D4A017] rotate-[-10deg] rounded-full opacity-60"></div>
                <div className="absolute bottom-3 left-20 w-20 h-[3px] bg-[#D4A017] rotate-[-10deg] rounded-full opacity-60"></div>
                <div className="absolute top-8 right-6 w-8 h-[3px] bg-[#D4A017] rotate-[70deg] rounded-full opacity-60"></div>
                <div className="absolute top-12 right-10 w-8 h-[3px] bg-[#D4A017] rotate-[20deg] rounded-full opacity-60"></div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/*gallery section */}

      {/* Booking flow*/}
      <section id="booking-flow" className="px-8 py-16"> 
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl text-center mb-12 dark:text-gray-100">Booking Made Easy</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="bg-[#F4D878] dark:bg-gray-700 p-8 border-0 h-64 flex flex-col items-center justify-center dark:border-gray-600">
              <h3 className="text-2xl mb-2 dark:text-gray-100">Simple Scheduling</h3>
              <p className="text-center text-gray-700 dark:text-gray-300">Book your pet's care in just a few clicks with our user-friendly platform.</p>
            </Card>
            <Card className="bg-[#F4D878] dark:bg-gray-700 p-8 border-0 h-64 flex flex-col items-center justify-center dark:border-gray-600">
              <h3 className="text-2xl mb-2 dark:text-gray-100">Flexible Options</h3>
              <p className="text-center text-gray-700 dark:text-gray-300">Choose from a variety of care options to fit your schedule and your pet's needs.</p>
            </Card>
            <Card className="bg-[#F4D878] dark:bg-gray-700 p-8 border-0 h-64 flex flex-col items-center justify-center dark:border-gray-600">
              <h3 className="text-2xl mb-2 dark:text-gray-100">Secure Payments</h3>
              <p className="text-center text-gray-700 dark:text-gray-300">Enjoy peace of mind with our secure payment system and transparent pricing.</p>
            </Card>
          </div>
        </div>
      </section>

      

      {/*Emergency flow*/}
      <section id="emergency-flow" className="px-8 py-16 bg-[#FFF8E8] dark:bg-gray-800">
        <div className="max-w-6xl mx-auto">
          <div className="relative rounded-[28px] border-2 border-[#EAB308] bg-[#FFFDF5] dark:bg-gray-900 dark:border-[#D4A017] px-8 py-8 md:px-12 md:py-10 overflow-hidden">
            
            {/* top decorative line */}
            {/* <div className="absolute top-5 left-6 right-6 h-[3px] bg-[#EAB308] opacity-50 rounded-full"></div> */}

            {/* bottom decorative line */}
            {/* <div className="absolute bottom-5 left-6 right-6 h-[3px] bg-[#EAB308] opacity-50 rounded-full"></div> */}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center pt-6 pb-6">
              
              {/* Left */}
              <div className="text-center md:text-left">
                <h2 className="text-3xl md:text-4xl font-bold uppercase leading-tight text-[#D97706] dark:text-[#F4D878]">
                  Need Emergency
                  <br />
                  Pet Care?
                </h2>
              </div>

              {/* Middle */}
              <div className="text-center md:text-left">
                <p className="text-lg font-semibold text-[#D4A017] dark:text-[#F4D878] mb-2">
                  We are here to help.
                </p>
                <p className="text-gray-700 dark:text-gray-300 leading-7">
                  Access emergency care for your pet anytime, day or night.
                  <br />
                  Our emergency care providers are trained to handle a wide range of urgent situations.
                  <br />
                  Get quick assistance for your pet in critical moments with our efficient emergency response system.
                  <br />
                  Contact PawWell for urgent pet support, quick guidance, and immediate help when your pet needs attention the most.
                </p>
              </div>

              {/* Right */}
              <div className="text-center md:text-right">
                <div className="flex items-center justify-center md:justify-end gap-2 mb-3">
                  
                  {/* Call Icon */}
                  <div className="w-10 h-10 rounded-full bg-[#EAB308] flex items-center justify-center text-white text-lg shadow-md">
                    <Phone className="w-5 h-5" />
                  </div>

                  {/* Text */}
                  <p className="text-2xl md:text-3xl font-bold uppercase text-[#D97706] dark:text-[#F4D878]">
                    Call Us Now!
                  </p>

                </div>

                {/* <span className="text-2xl md:text-3xl font-bold tracking-wide text-[#B45309] dark:text-gray-100">
                  9703712593
                </span> */}
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* About Section */}
      <section id="about" className="px-8 py-20 bg-[#FFF8E8] dark:bg-gray-800">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center rounded-[32px] bg-white dark:bg-gray-900 shadow-sm p-8 md:p-12 overflow-hidden relative">
            
            {/* decorative paws */}
            <div className="absolute top-6 left-6 text-3xl opacity-10 rotate-[-20deg]">🐾</div>
            <div className="absolute bottom-6 right-6 text-3xl opacity-10 rotate-[15deg]">🐾</div>

            {/* Left Image */}
            <div className="relative">
              
              {/* removed yellow card */}
              <div className="rounded-[28px] overflow-hidden shadow-md">
                <img
                  src={about}
                  alt="About PawWell"
                  className="w-full h-[320px] md:h-[420px] object-contain scale-x-[-1]"
                />
              </div>

              <div className="absolute -bottom-4 left-6 bg-[#EAB308] text-black px-5 py-2 rounded-full shadow-lg font-semibold text-sm">
                Trusted Pet Care
              </div>
            </div>

            {/* Right Content */}
            <div className="relative z-10">
              <p className="text-sm uppercase tracking-[0.25em] text-[#D4A017] font-semibold mb-3">
                About PawWell
              </p>

              <h2 className="text-3xl md:text-5xl font-bold leading-tight text-black dark:text-gray-100 mb-5">
                A caring place for every pet
                <br />
                and every pet parent
              </h2>

              <p className="text-gray-700 dark:text-gray-300 leading-7 mb-6">
                PawWell was created to help pet owners find safe, reliable, and loving care whenever
                work, travel, or emergencies make it difficult to stay with their pets. We believe pets
                are family, which is why our platform is designed to provide comfort, trust, and peace
                of mind through every step of the care journey.
              </p>

              {/* trust points */}
              <div className="space-y-4 mb-8">
                <div>
                  <h3 className="font-semibold text-lg text-black dark:text-gray-100">
                    Compassionate Care
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    Every pet receives thoughtful attention, comfort, and handling with care.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-lg text-black dark:text-gray-100">
                    Clear & Simple Booking
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    Our platform makes scheduling, managing, and tracking pet care easy and stress-free.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-lg text-black dark:text-gray-100">
                    Peace of Mind
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    Stay confident with trusted support, transparent care, and regular updates.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>



      

      {/* FAQ Section */}
      
      <section id="faq" className="px-8 py-20 bg-[#FFF8E8] dark:bg-gray-800">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            {/* <p className="text-sm uppercase tracking-[0.25em] text-[#D4A017] font-semibold mb-3">
              FAQ
            </p> */}
            <h2 className="text-4xl md:text-5xl font-bold text-black dark:text-gray-100 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-7">
              Find quick answers to the most common questions about booking, pet care, and PawWell services.
            </p>
          </div>

          <div className="space-y-5">
            <Card className="rounded-[24px] border border-[#F4D878] bg-white dark:bg-gray-900 dark:border-gray-700 shadow-sm p-6">
              <h3 className="text-xl md:text-2xl font-semibold text-black dark:text-gray-100 mb-3">
                How do I book a service?
              </h3>
              <p className="text-gray-700 dark:text-gray-300 leading-7">
                Simply click the booking button, will redirect you to the signup page, create an account and 
                set up your profile with the valid information and will be redirected to the dashboard.
                Click on Add Pet and create your pet profile account.And you are ready to book service for you pet.
                Click on Book a New service/Booking.
                Choose your pet, preferred service, select your date, and complete the booking process through the platform.
              </p>
            </Card>

            <Card className="rounded-[24px] border border-[#F4D878] bg-white dark:bg-gray-900 dark:border-gray-700 shadow-sm p-6">
              <h3 className="text-xl md:text-2xl font-semibold text-black dark:text-gray-100 mb-3">
                Are PawWell caretakers trusted and verified?
              </h3>
              <p className="text-gray-700 dark:text-gray-300 leading-7">
                Yes, PawWell focuses on trusted pet care by ensuring that caretakers are properly managed and committed to providing safe, reliable, and compassionate support for your pets.
              </p>
            </Card>

            <Card className="rounded-[24px] border border-[#F4D878] bg-white dark:bg-gray-900 dark:border-gray-700 shadow-sm p-6">
              <h3 className="text-xl md:text-2xl font-semibold text-black dark:text-gray-100 mb-3">
                Can I cancel or reschedule my booking?
              </h3>
              <p className="text-gray-700 dark:text-gray-300 leading-7">
                Yes, PawWell allows users to manage their bookings, including cancellation and rescheduling, based on the platform’s booking rules and availability.
              </p>
            </Card>

            <Card className="rounded-[24px] border border-[#F4D878] bg-white dark:bg-gray-900 dark:border-gray-700 shadow-sm p-6">
              <h3 className="text-xl md:text-2xl font-semibold text-black dark:text-gray-100 mb-3">
                Will I receive updates about my pet?
              </h3>
              <p className="text-gray-700 dark:text-gray-300 leading-7">
                Yes, PawWell is designed to keep pet owners informed through activity updates and transparent communication, helping you stay confident while your pet is in our care.
              </p>
            </Card>

            <Card className="rounded-[24px] border border-[#F4D878] bg-white dark:bg-gray-900 dark:border-gray-700 shadow-sm p-6">
              <h3 className="text-xl md:text-2xl font-semibold text-black dark:text-gray-100 mb-3">
                What should I include in my pet profile?
              </h3>
              <p className="text-gray-700 dark:text-gray-300 leading-7">
                You should include important details such as your pet’s name, breed, age, sex, allergies, medical history, behavior triggers, and any special care instructions.
              </p>
            </Card>

            <Card className="rounded-[24px] border border-[#F4D878] bg-white dark:bg-gray-900 dark:border-gray-700 shadow-sm p-6">
              <h3 className="text-xl md:text-2xl font-semibold text-black dark:text-gray-100 mb-3">
                Does PawWell provide emergency support?
              </h3>
              <p className="text-gray-700 dark:text-gray-300 leading-7">
                Yes, PawWell includes emergency support features to help users access urgent guidance and immediate assistance when their pet needs quick attention.
              </p>
            </Card>
          </div>
        </div>
      </section>


     
      {/*  Ready to Give Your Pet the Best Care */}
      <section className="px-8 py-20 bg-[#FFF8E8] dark:bg-gray-800">
        <div className="max-w-5xl mx-auto">
          <div className="relative rounded-[32px] bg-[#F4D878] dark:bg-gray-900 px-8 py-12 md:px-12 md:py-16 text-center shadow-sm overflow-hidden">

            {/* decorative paws */}
            <div className="absolute top-6 left-8 text-3xl opacity-10 rotate-[-20deg]">🐾</div>
            <div className="absolute bottom-6 right-8 text-3xl opacity-10 rotate-[15deg]">🐾</div>

            {/* Heading */}
            <h2 className="text-3xl md:text-5xl font-bold text-black dark:text-gray-100 mb-4">
              Ready to Give Your Pet the Best Care?
            </h2>

            {/* Sub text */}
            <p className="text-lg text-gray-800 dark:text-gray-300 mb-2">
              Trust, transparency, and comfort — all in one place.
            </p>
            <p className="text-gray-700 dark:text-gray-400 mb-8">
              From booking to daily care, everything is handled with reliability and love.
            </p>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
  
              <Button
                onClick={onNavigateToLogin}
                className="bg-white text-black px-8 py-6 rounded-xl text-base border-2 border-transparent transition-all duration-300 hover:border-[#EAB308] hover:bg-white"
              >
                Login
              </Button>

              <Button
                onClick={onNavigateToSignup}
                className="bg-white text-black px-8 py-6 rounded-xl text-base border-2 border-transparent transition-all duration-300 hover:border-[#EAB308] hover:bg-white"
              >
                Get Started
              </Button>

            </div>

          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-8 py-16 bg-[#F4D878] dark:bg-gray-900">
        <div className="max-w-7xl mx-auto">

          {/* Top Section */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">
            
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">🐾</span>
                <span className="text-xl font-semibold text-black dark:text-gray-100">
                  PawWell
                </span>
              </div>
              <p className="text-gray-800 dark:text-gray-300 leading-7">
                Trusted pet care platform connecting pet owners with reliable and caring services for a stress-free experience.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-lg font-semibold text-black dark:text-gray-100 mb-4">
                Quick Links
              </h3>
              <ul className="space-y-2 text-gray-800 dark:text-gray-300">
                <li><a href="#home" className="hover:underline">Home</a></li>
                <li><a href="#services" className="hover:underline">Services</a></li>
                <li><a href="#how-it-works" className="hover:underline">How It Works</a></li>
                <li><a href="#about" className="hover:underline">About</a></li>
              </ul>
            </div>

            {/* Services */}
            <div>
              <h3 className="text-lg font-semibold text-black dark:text-gray-100 mb-4">
                Services
              </h3>
              <ul className="space-y-2 text-gray-800 dark:text-gray-300">
                <li>Pet Daycare</li>
                <li>Pet Boarding</li>
                <li>Pet Grooming</li>
                <li>Emergency Care</li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h3 className="text-lg font-semibold text-black dark:text-gray-100 mb-4">
                Contact
              </h3>
              <ul className="space-y-3 text-gray-800 dark:text-gray-300">
                <li className="flex items-center gap-2">
                  <Phone size={18} />
                  <span>+977-9703712593</span>
                </li>

                <li className="flex items-center gap-2">
                  <MapPin size={18} />
                  <span>Kathmandu, Nepal</span>
                </li>

                <li className="flex items-center gap-2">
                  <Mail size={18} />
                  <span>support@pawwell.com</span>
                </li>
              </ul>
            </div>

          </div>

          {/* Divider */}
          <div className="border-t border-[#D4A017] dark:border-gray-700 my-6"></div>

          {/* Bottom Section */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-800 dark:text-gray-400">
            <p>© {new Date().getFullYear()} PawWell. All rights reserved.</p>

            <div className="flex gap-6">
              <a href="#" className="hover:underline">Privacy Policy</a>
              <a href="#" className="hover:underline">Terms of Service</a>
            </div>
          </div>

        </div>
      </footer>


    </div>
  );
}
