import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface FAQProps {
  question: string;
  answer: string;
  value: string;
}

const FAQList: FAQProps[] = [
  {
    question: "Is it free to post a listing?",
    answer:
      "Yes, posting a listing is completely free. We may introduce optional paid promotions later to help listings get more visibility, but basic posting will always stay free.",
    value: "item-1",
  },
  {
    question: "How do I know a buyer or seller is genuine?",
    answer:
      "Look for verified profile badges, check ratings from past deals, and always chat within the app before sharing personal details. We recommend meeting in a public place and inspecting items before paying.",
    value: "item-2",
  },
  {
    question: "Do you handle payments between buyers and sellers?",
    answer:
      "Currently, payments happen directly between buyer and seller (cash or UPI/bank transfer) when you meet. We're working on an optional secure payment option for select categories.",
    value: "item-3",
  },
  {
    question: "Can I edit or remove a listing after posting it?",
    answer:
      "Yes. Go to 'My Listings' from your profile, and you can edit the price, description, or photos, or mark it as sold/remove it anytime.",
    value: "item-4",
  },
  {
    question: "What should I do if I suspect a scam?",
    answer:
      "Use the 'Report' button on the listing or chat immediately. Never pay in advance for an item you haven't seen, and avoid sharing OTPs or banking passwords with anyone.",
    value: "item-5",
  },
];

export const FAQ = () => {
  return (
    <section id="faq" className="container py-24 sm:py-6">
      <h2
        className="text-3xl md:text-4xl font-bold mb-4 text-[#14213D] dark:text-white"
        style={{ fontFamily: "'Fraunces', ui-serif, Georgia, serif" }}
      >
        Frequently Asked <span className="text-[#C4432B]">Questions</span>
      </h2>

      <Accordion type="single" collapsible className="w-full AccordionRoot">
        {FAQList.map(({ question, answer, value }: FAQProps) => (
          <AccordionItem key={value} value={value}>
            <AccordionTrigger className="text-left">
              {question}
            </AccordionTrigger>
            <AccordionContent>{answer}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      <h3 className="font-medium mt-4 text-[#14213D] dark:text-white">
        Still have questions?{" "}
        <a
          rel="noreferrer noopener"
          href="#"
          className="text-[#C4432B] transition-all border-[#C4432B] hover:border-b-2"
        >
          Contact us
        </a>
      </h3>
    </section>
  );
};