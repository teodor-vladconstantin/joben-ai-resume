export const siteConfig = {
  name: "Joben",
  description: "The Only Free AI Resume Builder You'll Ever Need. Build ATS-optimized resumes that pass the screen and get you the interview. Powered by advanced AI to perfectly tailor your experience.",
  url: "https://joben.ai",
};

export const heroContent = {
  heading: "The Only Free AI Resume Builder You'll Ever Need",
  subheading: "Build ATS-optimized resumes that pass the screen and get you the interview. Powered by advanced AI to perfectly tailor your experience.",
  cta: "Get Started Free",
  features: [
    { text: "No credit card required", icon: "CheckCircle2" },
    { text: "Free forever", icon: "CheckCircle2" },
    { text: "Setup in 2 minutes", icon: "CheckCircle2" },
  ],
};

export const statCards = [
  {
    icon: "Zap",
    title: "AI Powered",
    description: "Automatically generate professional bullet points tailored to your industry.",
  },
  {
    icon: "ShieldCheck",
    title: "100% ATS Pass-Through",
    description: "Templates designed specifically to format perfectly for applicant tracking systems.",
  },
  {
    icon: "FileText",
    title: "50%+ Interview Boost",
    description: "Users report significantly higher callback rates with our optimized formats.",
  },
];

export const atsPreviewContent = {
  heading: "See What Recruiters See In Your Resume",
  subheading: "Our AI analyzes your resume against millions of job postings to give you an exact match score.",
  score: 93,
  strengths: [
    "Strong action verbs used throughout.",
    "Perfectly structured for ATS parsers.",
  ],
  improvement: {
    before: "Helped team increase sales",
    after: "Spearheaded initiative driving a 24% increase in sales Q3.",
  },
};

export const pricingPlans = [
  {
    name: "Free",
    description: "Perfect for building your first professional resume.",
    price: "$0",
    price_period: "/forever",
    features: [
      "Manual resume builder",
      "3 resumes with 1 PDF download",
      "AI bullet rewrites: 2/day, 30/month",
      "1 basic ATS-optimized template",
    ],
    excludedFeatures: [
      "Cover letter generation",
      "Resume vs JD analysis",
      "Unlimited resumes & downloads",
    ],
    cta: "Start Free",
    isPrimary: false,
  },
  {
    name: "Pro",
    description: "Powerful AI limits for the active job seeker.",
    price: "$12",
    price_period: "/month",
    features: [
      "Everything in Free, plus:",
      "Bullet rewrites: 10/day, 150/month",
      "Cover letters: 3/day, 20/month",
      "Resume vs JD analysis: 5/day, 30/month",
      "AI bullet point generator",
      "AI summary & headline writer",
      "ATS keyword optimization & scoring",
      "Unlimited resumes & exports",
      "Priority email support",
    ],
    excludedFeatures: [],
    cta: "Upgrade to Pro",
    isPrimary: true,
  },
  {
    name: "Recruiting Plan",
    description: "Long-term access for serious career builders.",
    price: "$60",
    price_period: "/6 months",
    features: [
      "Everything in Pro included",
      "Higher AI limits",
      "AI bullet point generator",
      "ATS keyword optimization",
      "Unlimited resumes & exports",
      "Full template library access",
      "Priority email support",
    ],
    excludedFeatures: [],
    cta: "Get Recruiting Plan",
    isPrimary: false,
    isBestValue: true,
  },
];

export const faqItems = [
  {
    question: "Is Joben really free to start?",
    answer:
      "Yes. The Free plan lets you build resumes manually, keep up to 3 resumes, and export 1 PDF. You can also try limited AI bullet rewrites.",
  },
  {
    question: "What do I get with Pro?",
    answer:
      "Pro unlocks higher AI limits, resume vs job description analysis, cover letter generation, and unlimited resumes and exports.",
  },
  {
    question: "How do AI limits work?",
    answer:
      "AI features use both daily and monthly limits based on your plan. This keeps performance stable and pricing transparent.",
  },
  {
    question: "Are the resumes ATS-friendly?",
    answer:
      "Yes. Joben templates and formatting are built to work with applicant tracking systems and keep your content readable by recruiters.",
  },
  {
    question: "Can I create multiple versions of my resume?",
    answer:
      "Absolutely. You can create tailored versions for different roles, industries, or job descriptions and manage them from your dashboard.",
  },
  {
    question: "Can I generate cover letters too?",
    answer:
      "Yes, on paid plans. Joben can generate targeted cover letters using your resume and the job details.",
  },
  {
    question: "Can I cancel my paid plan anytime?",
    answer:
      "Yes. You can manage billing from your account and cancel whenever you want. Your current period remains active until it ends.",
  },
  {
    question: "Is my resume data secure?",
    answer:
      "We use modern authentication and secure backend infrastructure. Your data is isolated per account and only used to power your experience.",
  },
];

export const footerContent = {
  heading: "Your career is your most valuable asset. Start building it today.",
  ctaPrimary: "Create Your Resume Now",
  ctaSecondary: "View Dashboard",
  creatorCredit: "Built by a software engineer who understands the job search struggle.",
};
