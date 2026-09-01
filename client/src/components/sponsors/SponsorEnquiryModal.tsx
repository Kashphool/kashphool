import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import TurnstileWidget from "@/components/shared/TurnstileWidget";
import { buildSponsorEnquiryMessage } from "@/lib/sponsorEnquiry";
import {
  enquiryAttemptFor,
  EnquirySubmissionError,
  submitEnquiry,
  type EnquiryAttempt,
  type EnquiryErrorCategory,
} from "@/lib/enquiryApi";
import { sponsorPageContent } from "@/content";
import { Send } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

const EMAIL_MESSAGE_TIMEOUT = 3000;

const failureMessages: Record<EnquiryErrorCategory, string> = {
  verification: "Verification failed. Please try again.",
  validation: "Please check your details and try again.",
  temporary: "Failed to send your enquiry. Please try again.",
  unknown: "Failed to send your enquiry. Please try again.",
};

interface SponsorEnquiryModalProps {
  open: boolean;
  tier: string | null;
  tierDetails?: {
    name: string;
    guide: string;
    guidePrefix?: string;
    guideSuffix?: string;
    description: string;
  } | null;
  onOpenChange: (open: boolean) => void;
}

export default function SponsorEnquiryModal({
  open,
  tier,
  tierDetails,
  onOpenChange,
}: SponsorEnquiryModalProps) {
  const { enquiryModal } = sponsorPageContent;
  const formRef = useRef<HTMLFormElement>(null);
  const pendingAttemptRef = useRef<EnquiryAttempt | null>(null);
  const resetChallengeRef = useRef<(() => void) | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [sentMessage, setSentMessage] = useState("");
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setName("");
      setEmail("");
      setNote("");
      setSentMessage("");
      setHasError(false);
      setTurnstileToken(null);
      pendingAttemptRef.current = null;
    }
  }, [open, tier]);

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

  const handleOpenChange = (nextOpen: boolean) => {
    if (!isLoading) onOpenChange(nextOpen);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!turnstileToken) return;

    setIsLoading(true);
    setSentMessage("");
    setHasError(false);
    const payload = {
      type: "sponsorship" as const,
      name: name.trim(),
      email: email.trim(),
      message: buildSponsorEnquiryMessage({ name, note, tier }),
      sponsorshipTier: tier,
      sourcePage: "sponsors" as const,
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
      setName("");
      setEmail("");
      setNote("");
      setHasError(false);
      setSentMessage("Your sponsorship enquiry has been sent!");
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

  const emailMessage = buildSponsorEnquiryMessage({ name, note, tier });

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={!isLoading}
        className="max-h-[calc(100vh-2rem)] overflow-y-auto border-gold/20 bg-charcoal-light p-0 text-ivory shadow-2xl shadow-black/50 sm:max-w-xl"
        onEscapeKeyDown={event => {
          if (isLoading) event.preventDefault();
        }}
        onPointerDownOutside={event => {
          if (isLoading) event.preventDefault();
        }}
      >
        <div className="border-b border-gold/10 bg-gradient-to-r from-gold/10 via-transparent to-saffron/5 px-6 py-6 sm:px-8">
          <DialogHeader>
            <span className="text-xs font-semibold uppercase tracking-[0.24em] text-saffron/80">
              {enquiryModal.eyebrow}
            </span>
            <DialogTitle className="font-[var(--font-display)] text-3xl leading-tight text-ivory sm:text-4xl">
              {tier
                ? `${enquiryModal.tierTitlePrefix} ${tier}`
                : enquiryModal.generalTitle}
            </DialogTitle>
            <DialogDescription className="pt-1 leading-relaxed text-ivory/55">
              {tier
                ? enquiryModal.tierDescription
                : enquiryModal.generalDescription}
            </DialogDescription>
          </DialogHeader>
          {tierDetails && (
            <div className="mt-5 rounded-sm border border-gold/25 bg-charcoal/40 p-4 sm:p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-saffron/80">
                {enquiryModal.selectedPackageLabel}
              </p>
              <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <h3 className="font-[var(--font-display)] text-2xl font-semibold text-ivory sm:text-3xl">
                  {tierDetails.name}
                </h3>
                <p className="font-semibold text-gold">
                  {tierDetails.guidePrefix && `${tierDetails.guidePrefix} `}
                  {tierDetails.guide}
                  {tierDetails.guideSuffix && ` ${tierDetails.guideSuffix}`}
                </p>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-ivory/55">
                {tierDetails.description}
              </p>
            </div>
          )}
        </div>

        <form
          ref={formRef}
          onSubmit={handleSubmit}
          className="space-y-5 px-6 pb-7 sm:px-8 sm:pb-8"
        >
          <input type="hidden" name="message" value={emailMessage} />

          <div>
            <label
              htmlFor="sponsor-name"
              className="mb-2 block text-sm tracking-wide text-ivory/65"
            >
              {enquiryModal.nameLabel}
            </label>
            <input
              id="sponsor-name"
              type="text"
              name="name"
              value={name}
              onChange={event => setName(event.target.value)}
              autoComplete="name"
              required
              disabled={isLoading}
              placeholder={enquiryModal.namePlaceholder}
              className="w-full rounded-sm border border-gold/15 bg-charcoal/60 px-4 py-3 text-ivory/90 outline-none transition-all placeholder:text-ivory/30 focus:border-saffron/50 focus:ring-1 focus:ring-saffron/20 disabled:opacity-60"
            />
          </div>

          <div>
            <label
              htmlFor="sponsor-email"
              className="mb-2 block text-sm tracking-wide text-ivory/65"
            >
              {enquiryModal.emailLabel}
            </label>
            <input
              id="sponsor-email"
              type="email"
              name="email"
              value={email}
              onChange={event => setEmail(event.target.value)}
              autoComplete="email"
              required
              disabled={isLoading}
              placeholder={enquiryModal.emailPlaceholder}
              className="w-full rounded-sm border border-gold/15 bg-charcoal/60 px-4 py-3 text-ivory/90 outline-none transition-all placeholder:text-ivory/30 focus:border-saffron/50 focus:ring-1 focus:ring-saffron/20 disabled:opacity-60"
            />
          </div>

          <div>
            <label
              htmlFor="sponsor-note"
              className="mb-2 block text-sm tracking-wide text-ivory/65"
            >
              {enquiryModal.messageLabel}
            </label>
            <textarea
              id="sponsor-note"
              name="visitor_message"
              value={note}
              onChange={event => setNote(event.target.value)}
              rows={5}
              required
              disabled={isLoading}
              placeholder={enquiryModal.messagePlaceholder}
              className="w-full resize-none rounded-sm border border-gold/15 bg-charcoal/60 px-4 py-3 text-ivory/90 outline-none transition-all placeholder:text-ivory/30 focus:border-saffron/50 focus:ring-1 focus:ring-saffron/20 disabled:opacity-60"
            />
          </div>

          <TurnstileWidget
            onTokenChange={handleTokenChange}
            onFailure={handleVerificationFailure}
            onResetReady={handleResetReady}
          />

          <p className="text-sm leading-relaxed text-ivory/50">
            {enquiryModal.privacyNotice}{" "}
            <a
              href="/privacy"
              className="text-saffron underline underline-offset-4 hover:text-gold"
            >
              {enquiryModal.privacyLinkLabel}
            </a>
          </p>

          {sentMessage && (
            <div
              role="status"
              aria-live="polite"
              className={`rounded-sm border p-3 text-center font-medium ${
                hasError
                  ? "border-red-500/30 bg-red-500/10 text-red-400"
                  : "border-green-500/30 bg-green-500/10 text-green-400"
              }`}
            >
              {sentMessage}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || !turnstileToken}
            className="inline-flex w-full items-center justify-center gap-2 rounded-sm bg-gradient-to-r from-saffron to-gold px-6 py-3.5 font-semibold text-charcoal transition-all hover:scale-[1.01] hover:shadow-lg hover:shadow-saffron/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Send aria-hidden="true" size={17} />
            {isLoading ? enquiryModal.submitting : enquiryModal.submit}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
