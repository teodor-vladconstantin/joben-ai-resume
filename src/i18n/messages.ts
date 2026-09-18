export type Messages = {
  Metadata: {
    home: { title: string; description: string }
    pricing: { title: string; description: string }
    atsChecker: { title: string; description: string }
    resumeExamplesHub: { title: string; description: string }
    resumeExampleRole: { title: string; description: string }
  }
  Common: { home: string; bestValue: string; joben: string }
  Nav: {
    aiResumeBuilder: string
    atsAnalysis: string
    examples: string
    pricing: string
    faq: string
    dashboard: string
    resumes: string
    coverLetters: string
    aiReview: string
    logIn: string
    getStartedFree: string
    createNew: string
  }
  Home: {
    heroPrefix: string
    heroRotatingWords: string[]
    heroSuffix: string
    subheading: string
    cta: string
    features: string[]
    platformFeaturesHeading: string
    statCards: { title: string; description: string }[]
    atsPreview: {
      heading: string
      subheading: string
      scoreLabel: string
      categories: string[]
      whatWeFoundLabel: string
      categoryBreakdownLabel: string
      strengthsTitle: string
      strengthsDescription: string
      improvementsTitle: string
      improvementsDescription: string
      strengths: string[]
      improvementBefore: string
      improvementAfter: string
      mockResume: {
        name: string
        contact: string
        summaryHeading: string
        summary: string
        experienceHeading: string
        job1Title: string
        job1Dates: string
        job1Bullet1: string
        job1Bullet2: string
        job2Title: string
        job2Dates: string
        job2Bullet1: string
        job2Bullet2: string
        educationHeading: string
        education: string
        skillsHeading: string
        skills: string
      }
    }
    productLoop: { category: string; heading: string; description: string; bullets: string[] }[]
    pricingTeaserHeading: string
    pricingTeaserSubheading: string
    faqHeading: string
    faqSubheading: string
    faqOpen: string
    faqClose: string
  }
  Pricing: {
    heading: string
    subheading: string
    plans: {
      name: string
      description: string
      price: string
      pricePeriod: string
      features: string[]
      excludedFeatures: string[]
      cta: string
    }[]
  }
  AtsChecker: {
    eyebrow: string
    heading: string
    subheading: string
    categoryLabels: { formatting: string; structure: string; keywords: string; clarity: string }
    ctaByCategory: Record<'formatting' | 'structure' | 'keywords' | 'clarity', { headline: string; cta: string }>
    errors: {
      fileType: string
      fileSize: string
      generic: string
      networkScan: string
      emailGeneric: string
      emailNetwork: string
    }
    wantRewriting: string
    proPrice: string
    proPricePeriod: string
    whatToFix: string
    reportSentTo: string
    sendDifferentEmail: string
    getReportByEmail: string
    emailExplainer: string
    emailPlaceholder: string
    emailMeThisReport: string
    freeIncludes: string
    strongScore: string
    strongScoreSubtext: string
    createFreeAccount: string
    scanAnother: string
    usedFreeScan: string
    usedFreeScanBody1: string
    usedFreeScanBody2: string
    createFreeAccountShort: string
    readyToScan: string
    dragAndDrop: string
    fileHint: string
    optional: string
    neverRequired: string
    scanning: string
    scanButton: string
    scanDisclaimer: string
  }
  ResumeExamplesHub: {
    eyebrow: string
    heading: string
    subheading: string
    seeExamples: string
    itemListName: string
  }
  ResumeExampleRole: {
    breadcrumbHub: string
    heading: string
    subheading: string
    keywordsHeading: string
    keywordsHint: string
    mistakesHeading: string
    bulletExampleHeading: string
    weak: string
    strong: string
    scoreCtaHeading: string
    scoreCtaSubheading: string
    scoreCtaButton: string
    faqKeywordsQuestion: string // EN: {roleLowerWithArticle}; RO: {roleLower}
    faqMistakesQuestion: string
  }
  Faq: { question: string; answer: string }[]
  Grade: {
    labels: Record<'Poor' | 'Fair' | 'Good' | 'Excellent', string>
    descriptions: Record<'Poor' | 'Fair' | 'Good' | 'Excellent', string>
    fallbackDescription: string
  }
  Billing: {
    couldNotStartCheckout: string
    couldNotOpenPortal: string
    redirectingToCheckout: string
    somethingWentWrong: string
    manageBilling: string
    upgradeToPro: string
  }
  Footer: {
    heading: string
    ctaPrimary: string
    ctaSecondary: string
    tagline: string
    productHeading: string
    legalHeading: string
    productLinks: { href: string; label: string }[]
    legalLinks: { href: string; label: string }[]
    salBadgeAlt: string
    productHuntLabel: string
    creatorCredit: string
  }
  CookieConsent: {
    ariaLabel: string
    messagePrefix: string
    cookiePolicyLinkText: string
    rejectNonEssential: string
    acceptAll: string
  }
}
