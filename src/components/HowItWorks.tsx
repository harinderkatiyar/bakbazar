import { Camera, MessageCircle, Handshake } from "lucide-react";

const steps = [
  {
    icon: Camera,
    title: "Snap a photo, post it",
    description: "Listing goes live in under 2 minutes.",
  },
  {
    icon: MessageCircle,
    title: "Chat with buyers",
    description: "No need to share your phone number.",
  },
  {
    icon: Handshake,
    title: "Meet up and close the deal",
    description: "Pay with cash or a digital payment.",
  },
];

export const HowItWorks = () => {
  return (
    <section id="about" className="container py-6">
      <div className="rounded-2xl border border-[#14213D]/10 bg-[#FBF7F0] px-6 py-8 dark:bg-white/[0.02] dark:border-white/10">
        <div className="text-center mb-8">
          <h2
            className="text-2xl md:text-3xl font-bold text-[#14213D] dark:text-white"
            style={{ fontFamily: "'Fraunces', ui-serif, Georgia, serif" }}
          >
            How it <span className="text-[#C4432B]">works</span>
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <div key={step.title} className="flex items-start gap-3">
                <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#0F5257]/10 text-[#0F5257] dark:bg-[#0F5257]/20 dark:text-[#5fb8bd]">
                  <Icon className="h-5 w-5" />
                  <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#E9A319] text-[10px] font-bold text-[#14213D]">
                    {i + 1}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-[#14213D] dark:text-white">
                    {step.title}
                  </h3>
                  <p className="text-xs text-muted-foreground">{step.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};