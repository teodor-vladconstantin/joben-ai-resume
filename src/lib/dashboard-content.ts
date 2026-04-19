export const dashboardContent = {
  greeting: (name: string) => `Good ${new Date().getHours() < 12 ? 'morning' : 'evening'}, ${name}`,
  subGreeting: "Here's an overview of your resume and career progress.",
  
  industryBenchmark: {
    title: "Industry Benchmark",
    description: "See how your resumes compare to successful candidates.",
    noData: "Create a resume to unlock industry benchmarking.",
    hireZoneLabel: "Hire Zone (92+)",
    hireZoneInfo: "Resumes scoring 92+ get 3x more callbacks",
    yourScoreLabel: (score: number) => `You (${score})`,
  },

  scoreBreakdown: {
    title: "Score Breakdown",
    noData: "No score available yet. Generating a resume and requesting an AI Review will update this section.",
    cta: "See how to improve →",
    categories: [
      { label: 'ATS & Structure', max: 20, key: 'ats' },
      { label: 'Content Quality', max: 40, key: 'content' },
      { label: 'Writing Quality', max: 10, key: 'writing' },
      { label: 'Job Match', max: 25, key: 'match' },
      { label: 'Application Ready', max: 5, key: 'ready' }
    ]
  },

  quickActions: [
    { label: "New Resume", href: "/resumes", icon: "Plus", isPrimary: true },
    { label: "Cover Letter", href: "/cover-letters", icon: "Mail", isPrimary: false },
    { label: "AI Review", href: "/ai-review", icon: "FileSearch", isPrimary: false },
  ],

  yourScore: {
    title: "Your Score",
    noData: "We need a resume to calculate score",
    noDataSub: "N/A",
    cta: "See how to improve →",
  },
};
