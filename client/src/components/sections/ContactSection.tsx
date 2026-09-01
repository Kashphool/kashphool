/*
  DESIGN: Sacred Geometry Modernism
  - Split layout: contact info left, support/donate right
  - Gold-bordered input fields
  - Gradient donate button with hover glow
  - Alpona pattern background texture
*/

import { useInView } from "@/hooks/useInView";
import { Heart, MapPin, Users } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { IMAGES } from "@/config";
import { homePageContent, siteContent } from "@/content";
import TurnstileWidget from "@/components/shared/TurnstileWidget";
import {
  enquiryAttemptFor,
  EnquirySubmissionError,
  submitEnquiry,
  type EnquiryAttempt,
  type EnquiryErrorCategory,
} from "@/lib/enquiryApi";

const EMAIL_MESSAGE_TIMEOUT = 3000;

const failureMessages: Record<EnquiryErrorCategory, string> = {
  verification: "Verification failed. Please try again.",
  validation: "Please check your details and try again.",
  temporary: "Failed to send message. Please try again.",
  unknown: "Failed to send message. Please try again.",
};

export default function ContactSection() {
  const { ref, isInView } = useInView();
  const { ref: ref2, isInView: isInView2 } = useInView();
  const formRef = useRef<HTMLFormElement>(null);
  const pendingAttemptRef = useRef<EnquiryAttempt | null>(null);
  const resetChallengeRef = useRef<(() => void) | null>(null);
  const [sentMessage, setSentMessage] = useState("");
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  const handleTokenChange = useCallback((token: string | null) => {
    setTurnstileToken(token);
  }, []);

  const handleResetReady = useCallback((reset: (() => void) | null) => {
    resetChallengeRef.current = reset;
  }, []);

  const handleVerificationFailure = useCallback(() => {
    setHasError(true);
    setSentMessage(failureMessages.verification);
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!turnstileToken) return;

    setIsLoading(true);
    setSentMessage("");
    setHasError(false);
    const form = e.currentTarget;
    const formData = new FormData(form);
    const payload = {
      type: "contact" as const,
      name: String(formData.get("name") ?? "").trim(),
      email: String(formData.get("email") ?? "").trim(),
      message: String(formData.get("message") ?? "").trim(),
      sponsorshipTier: null,
      sourcePage: "home" as const,
    };
    const attempt = enquiryAttemptFor(payload, pendingAttemptRef.current);
    pendingAttemptRef.current = attempt;

    try {
      await submitEnquiry({
        ...payload,
        turnstileToken,
        idempotencyKey: attempt.idempotencyKey,
      });
      pendingAttemptRef.current = null;
      form.reset();
      setHasError(false);
      setSentMessage("Your message has been sent!");
    } catch (error) {
      const category =
        error instanceof EnquirySubmissionError ? error.category : "unknown";
      if (category !== "temporary") pendingAttemptRef.current = null;
      setHasError(true);
      setSentMessage(failureMessages[category]);
    } finally {
      setIsLoading(false);
      setTurnstileToken(null);
      resetChallengeRef.current?.();
      setTimeout(() => setSentMessage(""), EMAIL_MESSAGE_TIMEOUT);
    }
  };

  return (
    <section id="contact" className="relative py-24 md:py-32 overflow-hidden">
      {/* Background texture */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
        <img
          src={IMAGES.ALPONA}
          alt=""
          className="w-full h-full object-cover"
        />
      </div>

      <div className="container relative z-10">
        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-20">
          {/* Contact Form */}
          <div ref={ref}>
            <div
              className={`transition-all duration-700 ${
                isInView
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-8"
              }`}
            >
              <span className="text-saffron/80 text-sm font-medium tracking-[0.3em] uppercase">
                {homePageContent.contact.eyebrow}
              </span>
              <h2 className="font-[var(--font-display)] text-4xl md:text-5xl font-bold mt-3 mb-4">
                <span className="text-gold-gradient">
                  {homePageContent.contact.heading}
                </span>
              </h2>
              <div className="h-[2px] w-20 bg-gradient-to-r from-saffron to-transparent mb-8" />

              <form ref={formRef} onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-ivory/60 text-sm mb-2 tracking-wide">
                    {homePageContent.contact.form.nameLabel}
                  </label>
                  <input
                    type="text"
                    name="name"
                    className="w-full bg-charcoal-light/50 border border-gold/15 rounded-sm px-4 py-3 text-ivory/90 placeholder:text-ivory/30 focus:border-saffron/50 focus:outline-none focus:ring-1 focus:ring-saffron/20 transition-all duration-300"
                    placeholder={homePageContent.contact.form.namePlaceholder}
                    required
                  />
                </div>
                <div>
                  <label className="block text-ivory/60 text-sm mb-2 tracking-wide">
                    {homePageContent.contact.form.emailLabel}
                  </label>
                  <input
                    type="email"
                    name="email"
                    className="w-full bg-charcoal-light/50 border border-gold/15 rounded-sm px-4 py-3 text-ivory/90 placeholder:text-ivory/30 focus:border-saffron/50 focus:outline-none focus:ring-1 focus:ring-saffron/20 transition-all duration-300"
                    placeholder={homePageContent.contact.form.emailPlaceholder}
                    required
                  />
                </div>
                <div>
                  <label className="block text-ivory/60 text-sm mb-2 tracking-wide">
                    {homePageContent.contact.form.messageLabel}
                  </label>
                  <textarea
                    name="message"
                    rows={5}
                    className="w-full bg-charcoal-light/50 border border-gold/15 rounded-sm px-4 py-3 text-ivory/90 placeholder:text-ivory/30 focus:border-saffron/50 focus:outline-none focus:ring-1 focus:ring-saffron/20 transition-all duration-300 resize-none"
                    placeholder={
                      homePageContent.contact.form.messagePlaceholder
                    }
                    required
                  />
                </div>

                <TurnstileWidget
                  onTokenChange={handleTokenChange}
                  onFailure={handleVerificationFailure}
                  onResetReady={handleResetReady}
                />

                <p className="text-sm leading-relaxed text-ivory/50">
                  {homePageContent.contact.form.privacyNotice}{" "}
                  <a
                    href="/privacy"
                    className="text-saffron underline underline-offset-4 hover:text-gold"
                  >
                    {homePageContent.contact.form.privacyLinkLabel}
                  </a>
                </p>

                {/* Success/Error Message */}
                {sentMessage && (
                  <div
                    role="status"
                    aria-live="polite"
                    className={`p-3 rounded-sm text-center font-medium transition-all duration-300 ${
                      hasError
                        ? "bg-red-500/10 border border-red-500/30 text-red-400"
                        : "bg-green-500/10 border border-green-500/30 text-green-400"
                    }`}
                  >
                    {sentMessage}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading || !turnstileToken}
                  className="px-8 py-3.5 bg-gradient-to-r from-saffron to-gold text-charcoal font-semibold rounded-sm tracking-wide hover:shadow-lg hover:shadow-saffron/20 transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading
                    ? homePageContent.contact.form.submitting
                    : homePageContent.contact.form.submit}
                </button>
              </form>
            </div>
          </div>

          {/* Support / Donate */}
          <div ref={ref2}>
            <div
              className={`transition-all duration-700 delay-200 ${
                isInView2
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-8"
              }`}
            >
              <span className="text-saffron/80 text-sm font-medium tracking-[0.3em] uppercase">
                {homePageContent.contact.supportEyebrow}
              </span>
              <h2 className="font-[var(--font-display)] text-4xl md:text-5xl font-bold mt-3 mb-4">
                <span className="text-gold-gradient">
                  {homePageContent.contact.supportHeading}
                </span>
              </h2>
              <div className="h-[2px] w-20 bg-gradient-to-r from-saffron to-transparent mb-8" />

              <p className="text-ivory/70 text-lg leading-relaxed mb-8">
                {homePageContent.contact.supportIntro}
              </p>

              {/* Info Cards */}
              <div className="space-y-4 mb-10">
                <div className="flex items-start gap-4 p-4 bg-charcoal-light/30 border border-gold/10 rounded-sm">
                  <Users size={20} className="text-saffron shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-ivory/90 font-medium mb-1">
                      {homePageContent.contact.supportCards[0].title}
                    </h4>
                    <p className="text-ivory/50 text-sm">
                      {homePageContent.contact.supportCards[0].description}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 bg-charcoal-light/30 border border-gold/10 rounded-sm">
                  <Heart
                    size={20}
                    className="text-vermillion shrink-0 mt-0.5"
                  />
                  <div>
                    <h4 className="text-ivory/90 font-medium mb-1">
                      {homePageContent.contact.supportCards[1].title}
                    </h4>
                    <p className="text-ivory/50 text-sm">
                      {homePageContent.contact.supportCards[1].description}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 bg-charcoal-light/30 border border-gold/10 rounded-sm">
                  <MapPin size={20} className="text-gold shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-ivory/90 font-medium mb-1">
                      {homePageContent.contact.supportCards[2].title}
                    </h4>
                    <p className="text-ivory/50 text-sm">
                      {homePageContent.contact.supportCards[2].description}
                    </p>
                  </div>
                </div>
              </div>

              {/* Donate Button */}
              <a
                href={siteContent.links.donate}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 px-10 py-4 bg-gradient-to-r from-vermillion to-saffron text-ivory font-semibold text-lg rounded-sm tracking-wide hover:shadow-xl hover:shadow-vermillion/20 transition-all duration-300 hover:scale-105 group"
              >
                <img
                  src="/images/lopay.png"
                  alt="LoPay"
                  className="w-5 h-5 object-contain group-hover:animate-pulse filter brightness-0 invert"
                />
                {homePageContent.contact.donateCta}
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
