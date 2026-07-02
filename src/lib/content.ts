export const siteConfig = {
  name: "Joben",
  description: "Joben is the only free AI resume builder you'll ever need. Build ATS-optimized resumes and cover letters that pass the screen and get you the interview. Powered by advanced generative AI.",
  url: "https://joben.eu",
};

export const heroContent = {
  heading: {
    prefix: "Your Resume Is Getting Rejected Before a ",
    rotatingWords: ["Recruiter", "Hiring Manager", "Bot"],
    suffix: " Ever Reads It.",
  },
  subheading: "Many applications are filtered out automatically by ATS software, not because you lack experience, but because your resume is not formatted for machines. Joben scores your resume 0-100, rewrites weak bullet points with AI, and tells you exactly what to fix before your next application.",
  cta: "Check My ATS Score. It's Free",
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
    title: "ATS-Optimized Format",
    description: "Templates designed to format cleanly for applicant tracking systems.",
  },
  {
    icon: "FileText",
    title: "Clearer, More Relevant CV",
    description: "Highlight the experience recruiters want to see most.",
  },
];

export const atsPreviewContent = {
  heading: "See What Recruiters See In Your Resume",
  subheading: "Our AI analyzes your resume against millions of job postings to give you an exact match score.",
  score: 93,
  scoreLabel: "Excellent",
  categories: [
    { label: "ATS readability", value: 23, max: 25 },
    { label: "Content quality", value: 32, max: 35 },
    { label: "Writing quality", value: 9, max: 10 },
    { label: "Job optimization", value: 24, max: 25 },
    { label: "Application ready", value: 5, max: 5 },
  ],
  findings: {
    strengths: {
      title: "Strengths identified",
      description: "Strong action verbs and quantified bullet points throughout your experience section.",
    },
    improvements: {
      title: "Improvement suggestions",
      description: "Add a technical skills summary near the top and tighten your most recent role's bullets.",
    },
  },
  strengths: [
    "Strong action verbs used throughout.",
    "Perfectly structured for ATS parsers.",
  ],
  improvement: {
    before: "Helped team increase sales",
    after: "Spearheaded initiative driving a sales increase in Q3.",
  },
};

export const productLoopSteps = [
  {
    number: "01",
    category: "Score",
    heading: "See your score before you apply.",
    description: "Upload your resume and get a 0-100 ATS score across five categories, with the exact strengths and gaps recruiters and parsers will see.",
    bullets: [
      "Every resume scored 0-100 across 5 categories",
      "See exactly what recruiters and ATS parsers see",
      "Know what to fix before you apply, not after",
    ],
  },
  {
    number: "02",
    category: "Tailor",
    heading: "Tailor your resume to the job description.",
    description: "Paste a job description and Joben finds the missing keywords, then rewrites your bullets to fit that specific role.",
    bullets: [
      "Paste any job description, get instant keyword analysis",
      "Bullets rewritten to match the role, not generic AI filler",
      "One click, one tailored variant, one new draft",
    ],
  },
  {
    number: "03",
    category: "Rewrite",
    heading: "Turn weak bullets into quantified wins.",
    description: "One-click AI rewrite for any bullet: adds metrics, strong verbs, and keeps your voice.",
    bullets: [
      "Weak verbs become strong, measurable outcomes",
      "Keeps your voice — never reads like generic AI",
      "Every rewrite tracked live against your monthly limit",
    ],
  },
  {
    number: "04",
    category: "Cover Letter",
    heading: "A cover letter that matches your resume and the job.",
    description: "AI-generated, consistent tone with your resume, tailored to the same job description.",
    bullets: [
      "Matches the tone and facts of your tailored resume",
      "Written for the same job description, not a template",
      "Ready to send in the time it takes to read this",
    ],
  },
  {
    number: "05",
    category: "Export & Manage",
    heading: "Export clean, keep every version organized.",
    description: "Download a clean, ATS-ready PDF and keep multiple tailored resumes managed from one dashboard.",
    bullets: [
      "Clean, unwatermarked PDF exports",
      "Keep multiple tailored versions per role",
      "Manage everything from one dashboard",
    ],
  },
];

export const pricingPlans = [
  {
    name: "Free",
    description: "Best for building your first polished application.",
    price: "$0",
    price_period: "/forever",
    features: [
      "Manual resume builder",
      "Save 1 CV",
      "5 PDF exports",
      "3 AI cover letters / month",
      "3 resume-tailoring runs (CV vs JD) / month",
      "15 AI bullet rewrites / month",
      "1 basic ATS-optimized template",
    ],
    excludedFeatures: [
      "Priority email support",
      "Unlimited saved CVs",
      "Full template library",
    ],
    cta: "Start Free",
    isPrimary: false,
  },
  {
    name: "Pro",
    description: "For active job seekers applying consistently.",
    price: "$12",
    price_period: "/month",
    features: [
      "Everything in Free, plus:",
      "Save up to 3 CVs",
      "Unlimited PDF exports",
      "60 AI cover letters / month",
      "60 resume-tailoring runs (CV vs JD) / month",
      "200 AI bullet rewrites / month",
      "Priority email support",
    ],
    excludedFeatures: [],
    cta: "Upgrade to Pro",
    isPrimary: true,
  },
  {
    name: "Recruiting Plan",
    description: "6-month plan for high-volume applications.",
    price: "$60",
    price_period: "/6 months",
    features: [
      "Everything in Pro included",
      "Save up to 15 CVs",
      "300 AI cover letters / month",
      "300 resume-tailoring runs (CV vs JD) / month",
      "1,000 AI bullet rewrites / month",
      "Unlimited PDF exports",
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
      "Yes. Free includes 1 saved CV, 5 PDF exports, 3 cover letters/month, 3 CV-tailoring runs/month, and 15 bullet rewrites/month.",
  },
  {
    question: "What do I get with Pro?",
    answer:
      "Pro gives you 3 saved CVs, unlimited exports, 60 cover letters/month, 60 CV-tailoring runs/month, and 200 bullet rewrites/month.",
  },
  {
    question: "How do AI limits work?",
    answer:
      "Each plan has clear monthly usage counters for cover letters, CV tailoring, and bullet rewrites. Counters reset at the start of each month.",
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
      "Yes. All plans can generate cover letters, with monthly limits based on your plan.",
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
