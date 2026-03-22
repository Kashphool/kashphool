/*
  DESIGN: Sacred Geometry Modernism
  - Split layout: contact info left, support/donate right
  - Gold-bordered input fields
  - Gradient donate button with hover glow
  - Alpona pattern background texture
*/

import { useInView } from "@/hooks/useInView";
import { Heart, Mail, MapPin, Users } from "lucide-react";
import { useState, useRef } from "react";
import emailjs from '@emailjs/browser';
import { IMAGES, EMAILJS_CONFIG, EMAIL_MESSAGE_TIMEOUT, EXTERNAL_LINKS } from "@/config";

export default function ContactSection() {
  const { ref, isInView } = useInView();
  const { ref: ref2, isInView: isInView2 } = useInView();
  const formRef = useRef<HTMLFormElement>(null);
  const [sentMessage, setSentMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    emailjs
      .sendForm(
        EMAILJS_CONFIG.SERVICE_ID,
        EMAILJS_CONFIG.TEMPLATE_ID,
        formRef.current!,
        { publicKey: EMAILJS_CONFIG.PUBLIC_KEY }
      )
      .then(
        () => {
          setIsLoading(false);
          setSentMessage('Your message has been sent!');
          setTimeout(() => setSentMessage(''), EMAIL_MESSAGE_TIMEOUT);
          formRef.current?.reset();
        },
        (error) => {
          setIsLoading(false);
          setSentMessage('Failed to send message. Please try again.');
          setTimeout(() => setSentMessage(''), EMAIL_MESSAGE_TIMEOUT);
          console.error('EmailJS Error:', error);
        }
      );
  };

  return (
    <section id="contact" className="relative py-24 md:py-32 overflow-hidden">
      {/* Background texture */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
        <img src={IMAGES.ALPONA} alt="" className="w-full h-full object-cover" />
      </div>

      <div className="container relative z-10">
        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-20">
          {/* Contact Form */}
          <div ref={ref}>
            <div
              className={`transition-all duration-700 ${
                isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              }`}
            >
              <span className="text-saffron/80 text-sm font-medium tracking-[0.3em] uppercase">
                Get in Touch
              </span>
              <h2 className="font-[var(--font-display)] text-4xl md:text-5xl font-bold mt-3 mb-4">
                <span className="text-gold-gradient">Contact Us</span>
              </h2>
              <div className="h-[2px] w-20 bg-gradient-to-r from-saffron to-transparent mb-8" />

              <form ref={formRef} onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-ivory/60 text-sm mb-2 tracking-wide">
                    Your Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    className="w-full bg-charcoal-light/50 border border-gold/15 rounded-sm px-4 py-3 text-ivory/90 placeholder:text-ivory/30 focus:border-saffron/50 focus:outline-none focus:ring-1 focus:ring-saffron/20 transition-all duration-300"
                    placeholder="Enter your name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-ivory/60 text-sm mb-2 tracking-wide">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    className="w-full bg-charcoal-light/50 border border-gold/15 rounded-sm px-4 py-3 text-ivory/90 placeholder:text-ivory/30 focus:border-saffron/50 focus:outline-none focus:ring-1 focus:ring-saffron/20 transition-all duration-300"
                    placeholder="Enter your email"
                    required
                  />
                </div>
                <div>
                  <label className="block text-ivory/60 text-sm mb-2 tracking-wide">
                    Message
                  </label>
                  <textarea
                    name="message"
                    rows={5}
                    className="w-full bg-charcoal-light/50 border border-gold/15 rounded-sm px-4 py-3 text-ivory/90 placeholder:text-ivory/30 focus:border-saffron/50 focus:outline-none focus:ring-1 focus:ring-saffron/20 transition-all duration-300 resize-none"
                    placeholder="Your message..."
                    required
                  />
                </div>
                
                {/* Success/Error Message */}
                {sentMessage && (
                  <div
                    className={`p-3 rounded-sm text-center font-medium transition-all duration-300 ${
                      sentMessage.startsWith('Failed')
                        ? 'bg-red-500/10 border border-red-500/30 text-red-400'
                        : 'bg-green-500/10 border border-green-500/30 text-green-400'
                    }`}
                  >
                    {sentMessage}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-8 py-3.5 bg-gradient-to-r from-saffron to-gold text-charcoal font-semibold rounded-sm tracking-wide hover:shadow-lg hover:shadow-saffron/20 transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            </div>
          </div>

          {/* Support / Donate */}
          <div ref={ref2}>
            <div
              className={`transition-all duration-700 delay-200 ${
                isInView2 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              }`}
            >
              <span className="text-saffron/80 text-sm font-medium tracking-[0.3em] uppercase">
                Make a Difference
              </span>
              <h2 className="font-[var(--font-display)] text-4xl md:text-5xl font-bold mt-3 mb-4">
                <span className="text-gold-gradient">Support Us</span>
              </h2>
              <div className="h-[2px] w-20 bg-gradient-to-r from-saffron to-transparent mb-8" />

              <p className="text-ivory/70 text-lg leading-relaxed mb-8">
                Your contribution helps us make a bigger impact. Every donation supports
                our cultural events, community programs, and the preservation of our
                Bengali heritage in North Kent. Thank you for your generous support!
              </p>

              {/* Info Cards */}
              <div className="space-y-4 mb-10">
                <div className="flex items-start gap-4 p-4 bg-charcoal-light/30 border border-gold/10 rounded-sm">
                  <Users size={20} className="text-saffron shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-ivory/90 font-medium mb-1">Community Events</h4>
                    <p className="text-ivory/50 text-sm">
                      Fund our Durga Puja, Saraswati Puja, and other cultural celebrations
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 bg-charcoal-light/30 border border-gold/10 rounded-sm">
                  <Heart size={20} className="text-vermillion shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-ivory/90 font-medium mb-1">Cultural Preservation</h4>
                    <p className="text-ivory/50 text-sm">
                      Help us keep Bengali traditions alive for future generations
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 bg-charcoal-light/30 border border-gold/10 rounded-sm">
                  <MapPin size={20} className="text-gold shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-ivory/90 font-medium mb-1">Venue & Logistics</h4>
                    <p className="text-ivory/50 text-sm">
                      Support venue bookings, decorations, and event logistics
                    </p>
                  </div>
                </div>
              </div>

              {/* Donate Button */}
              <a
                href={EXTERNAL_LINKS.DONATE}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 px-10 py-4 bg-gradient-to-r from-vermillion to-saffron text-ivory font-semibold text-lg rounded-sm tracking-wide hover:shadow-xl hover:shadow-vermillion/20 transition-all duration-300 hover:scale-105 group"
              >
                <Heart size={20} className="group-hover:animate-pulse" />
                Donate Now
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
