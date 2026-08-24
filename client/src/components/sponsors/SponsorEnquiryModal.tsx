import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EMAILJS_CONFIG, EMAIL_MESSAGE_TIMEOUT } from "@/config";
import { buildSponsorEnquiryMessage } from "@/lib/sponsorEnquiry";
import emailjs from "@emailjs/browser";
import { Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface SponsorEnquiryModalProps {
  open: boolean;
  tier: string | null;
  onOpenChange: (open: boolean) => void;
}

export default function SponsorEnquiryModal({
  open,
  tier,
  onOpenChange,
}: SponsorEnquiryModalProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [sentMessage, setSentMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setName("");
      setEmail("");
      setNote("");
      setSentMessage("");
    }
  }, [open, tier]);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!isLoading) onOpenChange(nextOpen);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setSentMessage("");

    emailjs
      .sendForm(
        EMAILJS_CONFIG.SERVICE_ID,
        EMAILJS_CONFIG.TEMPLATE_ID,
        formRef.current!,
        { publicKey: EMAILJS_CONFIG.PUBLIC_KEY },
      )
      .then(
        () => {
          setIsLoading(false);
          setSentMessage("Your sponsorship enquiry has been sent!");
          setName("");
          setEmail("");
          setNote("");
          setTimeout(() => setSentMessage(""), EMAIL_MESSAGE_TIMEOUT);
        },
        (error) => {
          setIsLoading(false);
          setSentMessage("Failed to send your enquiry. Please try again.");
          setTimeout(() => setSentMessage(""), EMAIL_MESSAGE_TIMEOUT);
          console.error("EmailJS Error:", error);
        },
      );
  };

  const emailMessage = buildSponsorEnquiryMessage({ name, note, tier });

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={!isLoading}
        className="max-h-[calc(100vh-2rem)] overflow-y-auto border-gold/20 bg-charcoal-light p-0 text-ivory shadow-2xl shadow-black/50 sm:max-w-xl"
        onEscapeKeyDown={(event) => {
          if (isLoading) event.preventDefault();
        }}
        onPointerDownOutside={(event) => {
          if (isLoading) event.preventDefault();
        }}
      >
        <div className="border-b border-gold/10 bg-gradient-to-r from-gold/10 via-transparent to-saffron/5 px-6 py-6 sm:px-8">
          <DialogHeader>
            <span className="text-xs font-semibold uppercase tracking-[0.24em] text-saffron/80">
              Sponsorship enquiry
            </span>
            <DialogTitle className="font-[var(--font-display)] text-3xl leading-tight text-ivory sm:text-4xl">
              {tier ? `Enquire about ${tier}` : "Start a conversation"}
            </DialogTitle>
            <DialogDescription className="pt-1 leading-relaxed text-ivory/55">
              {tier
                ? "Tell us a little about your organisation and what you would like to discuss."
                : "Tell us how you would like to partner with Kashphool."}
            </DialogDescription>
          </DialogHeader>
          {tier && (
            <div className="mt-5 inline-flex rounded-full border border-gold/25 bg-charcoal/40 px-3 py-1.5 text-sm font-semibold text-gold">
              Selected: {tier}
            </div>
          )}
        </div>

        <form ref={formRef} onSubmit={handleSubmit} className="space-y-5 px-6 pb-7 sm:px-8 sm:pb-8">
          <input type="hidden" name="message" value={emailMessage} />

          <div>
            <label htmlFor="sponsor-name" className="mb-2 block text-sm tracking-wide text-ivory/65">
              Your name
            </label>
            <input
              id="sponsor-name"
              type="text"
              name="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              autoComplete="name"
              required
              disabled={isLoading}
              placeholder="Enter your name"
              className="w-full rounded-sm border border-gold/15 bg-charcoal/60 px-4 py-3 text-ivory/90 outline-none transition-all placeholder:text-ivory/30 focus:border-saffron/50 focus:ring-1 focus:ring-saffron/20 disabled:opacity-60"
            />
          </div>

          <div>
            <label htmlFor="sponsor-email" className="mb-2 block text-sm tracking-wide text-ivory/65">
              Email address
            </label>
            <input
              id="sponsor-email"
              type="email"
              name="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
              disabled={isLoading}
              placeholder="Enter your email"
              className="w-full rounded-sm border border-gold/15 bg-charcoal/60 px-4 py-3 text-ivory/90 outline-none transition-all placeholder:text-ivory/30 focus:border-saffron/50 focus:ring-1 focus:ring-saffron/20 disabled:opacity-60"
            />
          </div>

          <div>
            <label htmlFor="sponsor-note" className="mb-2 block text-sm tracking-wide text-ivory/65">
              Message
            </label>
            <textarea
              id="sponsor-note"
              name="visitor_message"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              rows={5}
              required
              disabled={isLoading}
              placeholder="Tell us what you would like to discuss..."
              className="w-full resize-none rounded-sm border border-gold/15 bg-charcoal/60 px-4 py-3 text-ivory/90 outline-none transition-all placeholder:text-ivory/30 focus:border-saffron/50 focus:ring-1 focus:ring-saffron/20 disabled:opacity-60"
            />
          </div>

          {sentMessage && (
            <div
              role="status"
              aria-live="polite"
              className={`rounded-sm border p-3 text-center font-medium ${
                sentMessage.startsWith("Failed")
                  ? "border-red-500/30 bg-red-500/10 text-red-400"
                  : "border-green-500/30 bg-green-500/10 text-green-400"
              }`}
            >
              {sentMessage}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-sm bg-gradient-to-r from-saffron to-gold px-6 py-3.5 font-semibold text-charcoal transition-all hover:scale-[1.01] hover:shadow-lg hover:shadow-saffron/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Send aria-hidden="true" size={17} />
            {isLoading ? "Sending..." : "Send enquiry"}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
