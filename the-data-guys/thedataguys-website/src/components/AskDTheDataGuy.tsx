import { useState, useRef, useEffect } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import FounderPhoto from './FounderPhoto';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

const faqItems: FAQItem[] = [
  {
    id: 'ai-readiness',
    question: 'What is AI readiness?',
    answer:
      "AI readiness means having clean, connected, and governed data before AI can deliver real value. Most organizations rush to implement AI tools without realizing their data foundation is fractured. True readiness requires a unified data architecture, consistent data quality standards, proper governance frameworks, and clear ownership across teams. Without these fundamentals, AI projects fail 87% of the time.",
  },
  {
    id: 'dashboards-fail',
    question: 'Why do dashboards fail?',
    answer:
      "Dashboards fail for three core reasons: they're built on bad data, there's no governance ensuring accuracy, and there's no user adoption strategy. A beautiful dashboard showing wrong numbers is worse than no dashboard at all. We see organizations spend $200K+ on BI tools only to have teams revert to spreadsheets within months because nobody trusts the numbers.",
  },
  {
    id: 'implementation-time',
    question: 'How long does implementation take?',
    answer:
      "Implementation typically takes 30-90 days depending on complexity. Phase 1 is discovery and architecture design (1-2 weeks). Phase 2 is core data infrastructure buildout (3-6 weeks). Phase 3 is integration, testing, and team training (2-4 weeks). We deliver working value at each phase — you don't wait 90 days to see results.",
  },
  {
    id: 'tools-recommend',
    question: 'What tools do you recommend?',
    answer:
      "We're completely tool-agnostic. Our focus is on architecture, not specific vendor products. The right tool depends on your team's capabilities, existing stack, budget, and growth trajectory. We've implemented solutions across Snowflake, Databricks, Azure, AWS, dbt, Fivetran, and dozens more. The architecture decision comes first — tools are just the implementation layer.",
  },
  {
    id: 'data-warehouse',
    question: 'What is a data warehouse?',
    answer:
      "A data warehouse is a centralized repository that connects all your systems into one source of truth. Instead of having sales data in one place, marketing in another, and finance in a third, a warehouse brings everything together in a structured, queryable format. It's the foundation that makes dashboards accurate, reports trustworthy, and AI actually possible.",
  },
  {
    id: 'prepare-for-ai',
    question: 'How do I prepare for AI?',
    answer:
      "Start with our Data House framework: get the foundation right first. That means auditing your current data landscape, identifying gaps and silos, establishing governance and quality standards, building the integration layer, and then — only then — layering intelligence on top. Organizations that skip straight to AI waste an average of $4.2M before realizing they needed the foundation all along.",
  },
];

interface MostAskedQuestion {
  id: string;
  question: string;
  answer: string;
}

const mostAskedQuestions: MostAskedQuestion[] = [
  {
    id: 'what-is-warehouse',
    question: 'What is a data warehouse?',
    answer:
      "Think of it as a single, organized library for all your organization's data. Instead of information scattered across spreadsheets, databases, and tools, a warehouse brings it all together so you can find answers in seconds, not days.",
  },
  {
    id: 'reporting-cost',
    question: 'How much should reporting cost?',
    answer:
      'If your team spends more than 2 hours per week on manual reporting, you\'re overpaying. Automated reporting typically saves organizations $140,000+ per year in staff time alone.',
  },
  {
    id: 'do-i-need-ai',
    question: 'Do I need AI?',
    answer:
      "Not yet — and that's okay. AI needs clean, organized data to work. Most organizations should focus on getting their Data House in order first. AI becomes powerful once your foundation is solid.",
  },
  {
    id: 'first-dashboard',
    question: 'What dashboard should I build first?',
    answer:
      "Start with the one question your leadership asks most often. Usually it's 'How are we performing against budget?' or 'What's our impact?' Build that answer first, then expand.",
  },
  {
    id: 'prove-impact',
    question: 'How do I prove impact?',
    answer:
      "Connect your program activities to measurable outcomes. Track: who you served, what you did, what changed, and what it cost. That's the Impact Equation.",
  },
  {
    id: 'data-quality',
    question: 'How do I know if my data is good?',
    answer:
      'Ask three questions: Can two people pull the same report and get the same number? Can you get an answer in under 5 minutes? Do you trust the numbers enough to make a decision? If any answer is no, your data needs work.',
  },
];

const credentials = [
  'Former AWS Analytics & AI Specialist',
  'Seattle Community Technology Advisory Board Commissioner',
  'Washington State AI Task Force Member',
  '40 Under 40 Honoree',
  'Data Engineer',
  'AI Strategist',
  'Social Impact Architect',
];

const bioHighlights = [
  { icon: '🏗️', text: 'Built systems supporting $400M+ tracked funding' },
  { icon: '🏛️', text: 'Worked across government, construction, nonprofits & economic development' },
  { icon: '☁️', text: 'Former AWS Analytics Specialist turned founder' },
];

interface Message {
  id: string;
  type: 'user' | 'assistant';
  text: string;
}

export default function AskDTheDataGuy() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [displayedText, setDisplayedText] = useState('');
  const [currentTypingId, setCurrentTypingId] = useState<string | null>(null);
  const sectionRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-100px' });

  const suggestedChips = [
    'What is AI readiness?',
    'Why do dashboards fail?',
    'How long does implementation take?',
    'What tools do you recommend?',
    'What is a data warehouse?',
    'How do I prepare for AI?',
  ];

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, displayedText]);

  const findAnswer = (query: string): string => {
    const lowerQuery = query.toLowerCase();
    const match = faqItems.find(
      (item) =>
        item.question.toLowerCase().includes(lowerQuery) ||
        lowerQuery.includes(item.id.replace('-', ' ')) ||
        item.question.toLowerCase().split(' ').some((word) => lowerQuery.includes(word) && word.length > 3)
    );
    if (match) return match.answer;

    const keywords: Record<string, string> = {
      'ai': faqItems[0].answer,
      'ready': faqItems[0].answer,
      'dashboard': faqItems[1].answer,
      'fail': faqItems[1].answer,
      'time': faqItems[2].answer,
      'long': faqItems[2].answer,
      'implement': faqItems[2].answer,
      'tool': faqItems[3].answer,
      'recommend': faqItems[3].answer,
      'warehouse': faqItems[4].answer,
      'prepare': faqItems[5].answer,
      'start': faqItems[5].answer,
    };

    for (const [key, answer] of Object.entries(keywords)) {
      if (lowerQuery.includes(key)) return answer;
    }

    return "Great question! That's something I'd love to dive deeper into with you. Every organization's data journey is unique — let's schedule a quick call so I can give you a personalized answer based on your specific situation.";
  };

  const simulateTyping = (text: string, messageId: string) => {
    setIsTyping(true);
    setCurrentTypingId(messageId);
    setDisplayedText('');

    let index = 0;
    const interval = setInterval(() => {
      if (index < text.length) {
        setDisplayedText(text.slice(0, index + 1));
        index++;
      } else {
        clearInterval(interval);
        setIsTyping(false);
        setCurrentTypingId(null);
        setMessages((prev) =>
          prev.map((m) => (m.id === messageId ? { ...m, text } : m))
        );
        setDisplayedText('');
      }
    }, 15);
  };

  const handleSubmit = (query: string) => {
    if (!query.trim() || isTyping) return;

    const userMsg: Message = { id: `user-${Date.now()}`, type: 'user', text: query };
    const assistantId = `assistant-${Date.now()}`;
    const assistantMsg: Message = { id: assistantId, type: 'assistant', text: '' };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setInputValue('');

    const answer = findAnswer(query);
    setTimeout(() => simulateTyping(answer, assistantId), 600);
  };

  const scrollToContact = () => {
    const el = document.getElementById('contact');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section ref={sectionRef} className="relative py-28 md:py-36 px-6 overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-[#00f0ff]/[0.02] blur-[180px]" />
        <div className="absolute bottom-1/3 right-1/3 w-[500px] h-[500px] rounded-full bg-[#3b82f6]/[0.02] blur-[150px]" />
      </div>

      <div className="relative max-w-3xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-8"
        >
          <p className="text-[#00f0ff] font-mono text-sm tracking-[0.3em] uppercase mb-4">
            Your Data Questions, Answered
          </p>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black mb-4 text-white">
            Ask D.{' '}
            <span className="bg-gradient-to-r from-[#00f0ff] via-[#06b6d4] to-[#3b82f6] bg-clip-text text-transparent">
              The Data Guy™
            </span>
          </h2>
          <p className="text-gray-300 text-lg md:text-xl max-w-2xl mx-auto italic">
            &ldquo;Ask me anything about your data challenges. I&apos;ve seen it all — and fixed most of it.&rdquo;
          </p>
        </motion.div>

        {/* Most Asked Questions Accordion */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="mb-12"
        >
          <div className="rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl p-6 md:p-8 shadow-[0_0_60px_rgba(0,240,255,0.04)]">
            <h3 className="text-xl font-bold text-white mb-1">Most Asked Questions</h3>
            <p className="text-gray-500 text-sm mb-6 font-mono">Instant answers to the questions we hear every week.</p>
            <Accordion type="single" collapsible className="space-y-2">
              {mostAskedQuestions.map((q) => (
                <AccordionItem
                  key={q.id}
                  value={q.id}
                  className="border border-white/[0.06] rounded-xl bg-white/[0.02] px-5 data-[state=open]:border-[#00f0ff]/20 data-[state=open]:bg-[#00f0ff]/[0.03] transition-all duration-300"
                >
                  <AccordionTrigger className="text-left text-[#00f0ff] hover:text-[#22d3ee] font-semibold text-sm md:text-base py-4 hover:no-underline">
                    {q.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-300 text-sm leading-relaxed pb-4">
                    {q.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </motion.div>

        {/* Founder Bio Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.25 }}
          className="mb-10"
        >
          <div className="max-w-2xl mx-auto rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl p-6 md:p-8 shadow-[0_0_60px_rgba(0,240,255,0.04)]">
            {/* Top: Avatar + Name */}
            <div className="flex items-center gap-4 mb-5">
              <FounderPhoto size="md" />
              <div className="text-left">
                <p className="text-white font-bold text-lg">Dei&apos;Marlon Scisney</p>
                <p className="text-[#00f0ff]/70 text-sm font-medium">Founder &amp; Chief Data Architect, The Data Guys™</p>
              </div>
            </div>

            {/* Bio Highlights */}
            <div className="space-y-3 mb-5">
              {bioHighlights.map((item) => (
                <div key={item.text} className="flex items-start gap-3">
                  <span className="text-lg flex-shrink-0 mt-0.5">{item.icon}</span>
                  <p className="text-gray-300 text-sm leading-relaxed">{item.text}</p>
                </div>
              ))}
            </div>

            {/* Credential Pills */}
            <div className="flex flex-wrap gap-2 pt-4 border-t border-white/[0.06]">
              {credentials.map((cred) => (
                <span
                  key={cred}
                  className="px-3 py-1.5 rounded-full bg-[#00f0ff]/[0.06] border border-[#00f0ff]/15 text-[#00f0ff]/80 text-[10px] font-medium tracking-wide uppercase"
                >
                  {cred}
                </span>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Chat Interface */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.35 }}
          className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl overflow-hidden"
        >
          {/* Chat Messages Area */}
          <div className="min-h-[200px] max-h-[400px] overflow-y-auto p-6 space-y-4">
            {messages.length === 0 && (
              <div className="text-center py-8">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#00f0ff]/20 to-[#3b82f6]/20 border border-[#00f0ff]/20 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">💬</span>
                </div>
                <p className="text-gray-500 text-sm">
                  Ask me anything about data strategy, readiness, or getting your data house in order.
                </p>
              </div>
            )}

            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={`flex gap-3 ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.type === 'assistant' && (
                  <FounderPhoto size="sm" className="flex-shrink-0" />
                )}
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    msg.type === 'user'
                      ? 'bg-[#00f0ff]/15 border border-[#00f0ff]/30 text-white'
                      : 'bg-white/[0.05] border border-white/10 text-gray-300'
                  }`}
                >
                  <p className="text-sm leading-relaxed">
                    {currentTypingId === msg.id ? displayedText : msg.text}
                    {currentTypingId === msg.id && (
                      <motion.span
                        animate={{ opacity: [1, 0] }}
                        transition={{ duration: 0.5, repeat: Infinity }}
                        className="inline-block w-0.5 h-4 bg-[#00f0ff] ml-0.5 align-middle"
                      />
                    )}
                  </p>
                </div>
              </motion.div>
            ))}

            {/* Typing indicator */}
            <AnimatePresence>
              {isTyping && !currentTypingId && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex gap-3 items-start"
                >
                  <FounderPhoto size="sm" className="flex-shrink-0" />
                  <div className="bg-white/[0.05] border border-white/10 rounded-2xl px-4 py-3">
                    <div className="flex gap-1">
                      <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: 0 }} className="w-2 h-2 rounded-full bg-[#00f0ff]" />
                      <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: 0.2 }} className="w-2 h-2 rounded-full bg-[#00f0ff]" />
                      <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: 0.4 }} className="w-2 h-2 rounded-full bg-[#00f0ff]" />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <div ref={chatEndRef} />
          </div>

          {/* Suggested Chips */}
          {messages.length === 0 && (
            <div className="px-6 pb-4">
              <p className="text-gray-500 text-xs font-mono uppercase tracking-wider mb-3">Suggested Questions</p>
              <div className="flex flex-wrap gap-2">
                {suggestedChips.map((chip) => (
                  <motion.button
                    key={chip}
                    whileHover={{ scale: 1.03, borderColor: 'rgba(0,240,255,0.4)' }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleSubmit(chip)}
                    className="px-3 py-2 rounded-lg border border-white/10 bg-white/[0.03] text-gray-400 text-xs hover:text-[#00f0ff] hover:bg-[#00f0ff]/[0.05] transition-all duration-300 cursor-pointer"
                  >
                    {chip}
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="border-t border-white/10 p-4">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSubmit(inputValue);
              }}
              className="flex gap-3"
            >
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask D. anything about data..."
                disabled={isTyping}
                className="flex-1 px-4 py-3 rounded-xl bg-white/[0.05] border border-white/10 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-[#00f0ff]/40 focus:bg-white/[0.07] transition-all disabled:opacity-50"
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="submit"
                disabled={isTyping || !inputValue.trim()}
                className="px-5 py-3 rounded-xl bg-gradient-to-r from-[#00f0ff] to-[#3b82f6] text-[#0a0e1a] font-bold text-sm disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Ask
              </motion.button>
            </form>
          </div>
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.5 }}
          className="text-center mt-10"
        >
          <p className="text-gray-500 text-sm mb-4 font-mono">
            Want a deeper conversation? Let&apos;s talk directly.
          </p>
          <motion.button
            whileHover={{ scale: 1.05, boxShadow: '0 0 40px rgba(0,240,255,0.3)' }}
            whileTap={{ scale: 0.95 }}
            onClick={scrollToContact}
            className="px-8 py-4 rounded-xl bg-gradient-to-r from-[#00f0ff] to-[#3b82f6] text-[#0a0e1a] font-bold text-lg shadow-[0_0_30px_rgba(0,240,255,0.2)] hover:shadow-[0_0_50px_rgba(0,240,255,0.4)] transition-all duration-300"
          >
            Book a Conversation with D. →
          </motion.button>
          <p className="text-gray-600 text-xs mt-3">
            Free 30-minute strategy session • No sales pitch • Just answers
          </p>
        </motion.div>
      </div>
    </section>
  );
}