export interface CaseStudy {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  company: string;
  industry: string;
  logo?: string;
  image: string;
  replayUrl: string;
  metrics: {
    timeSaved?: string;
    efficiency?: string;
    revenue?: string;
    other?: string;
  };
  tags: string[];
}

export const caseStudies: CaseStudy[] = [
  {
    id: "competitor-analysis",
    title: "Competitor Analysis",
    subtitle: "Healthcare Market Research",
    description: "Analyze the market for my next company in the healthcare industry, located in the UK. Give me the...",
    company: "Healthcare Startup",
    industry: "Healthcare",
    image: "/violet.png",
    replayUrl: "#",
    metrics: {
      timeSaved: "8 hours",
      efficiency: "5X faster"
    },
    tags: ["Research", "Healthcare", "Market Analysis"]
  },
  {
    id: "vc-list",
    title: "VC List",
    subtitle: "Investment Research",
    description: "Give me the list of the most important VC Funds in the United States based on Assets Under...",
    company: "Startup Accelerator",
    industry: "Finance",
    image: "/violet.png",
    replayUrl: "#",
    metrics: {
      timeSaved: "12 hours",
      efficiency: "10X faster"
    },
    tags: ["Research", "Finance", "Investment"]
  },
  {
    id: "linkedin-sourcing",
    title: "Looking for...",
    subtitle: "Talent Sourcing",
    description: "Go on LinkedIn, and find 10 profiles available - they are not working right now - for a junior software...",
    company: "Tech Company",
    industry: "Technology",
    image: "/violet.png",
    replayUrl: "#",
    metrics: {
      timeSaved: "6 hours",
      efficiency: "8X faster"
    },
    tags: ["Recruitment", "LinkedIn", "Sourcing"]
  },
  {
    id: "company-planning",
    title: "Planning Company...",
    subtitle: "Business Planning",
    description: "Generate a route plan for my company. We should go to California. We'll be 8 people...",
    company: "Travel Agency",
    industry: "Travel",
    image: "/violet.png",
    replayUrl: "#",
    metrics: {
      timeSaved: "4 hours",
      efficiency: "6X faster"
    },
    tags: ["Planning", "Travel", "Business"]
  },
  {
    id: "excel-automation",
    title: "Working on Excel",
    subtitle: "Data Processing",
    description: "My company asked to set up an Excel spreadsheet with all the information about Italian lottery...",
    company: "Data Analytics Firm",
    industry: "Analytics",
    image: "/violet.png",
    replayUrl: "#",
    metrics: {
      timeSaved: "10 hours",
      efficiency: "12X faster"
    },
    tags: ["Excel", "Automation", "Data"]
  },
  {
    id: "event-automation",
    title: "Automate Event...",
    subtitle: "Event Management",
    description: "Find 20 AI ethics speakers from Europe who've spoken at conferences in the past year...",
    company: "Event Management",
    industry: "Events",
    image: "/violet.png",
    replayUrl: "#",
    metrics: {
      timeSaved: "15 hours",
      efficiency: "20X faster"
    },
    tags: ["Events", "Automation", "Research"]
  },
  {
    id: "research-papers",
    title: "Summarize and...",
    subtitle: "Academic Research",
    description: "Research and compare scientific papers talking about Alcohol effects on our bodies during the last 5...",
    company: "Research Institution",
    industry: "Academic",
    image: "/violet.png",
    replayUrl: "#",
    metrics: {
      timeSaved: "20 hours",
      efficiency: "25X faster"
    },
    tags: ["Research", "Academic", "Analysis"]
  },
  {
    id: "customer-research",
    title: "Research + First...",
    subtitle: "Customer Development",
    description: "Research my potential customers (B2B) on LinkedIn. They should be in the clean tech industry. Find their...",
    company: "CleanTech Startup",
    industry: "CleanTech",
    image: "/violet.png",
    replayUrl: "#",
    metrics: {
      timeSaved: "18 hours",
      efficiency: "15X faster"
    },
    tags: ["Research", "B2B", "LinkedIn"]
  },
  {
    id: "seo-analysis",
    title: "SEO Analysis",
    subtitle: "Website Optimization",
    description: "Based on my website suna.so, generate an SEO report analysis, find top-ranking pages by keyword...",
    company: "Digital Agency",
    industry: "Marketing",
    image: "/violet.png",
    replayUrl: "#",
    metrics: {
      timeSaved: "8 hours",
      efficiency: "10X faster"
    },
    tags: ["SEO", "Marketing", "Analysis"]
  },
  {
    id: "personal-trip",
    title: "Generate a Personal...",
    subtitle: "Travel Planning",
    description: "Generate a personal trip to London, with departure from Bangkok on the 1st of May. Trip will last 10 days...",
    company: "Travel Enthusiast",
    industry: "Personal",
    image: "/violet.png",
    replayUrl: "#",
    metrics: {
      timeSaved: "5 hours",
      efficiency: "8X faster"
    },
    tags: ["Travel", "Planning", "Personal"]
  },
  {
    id: "funding-research",
    title: "Recently Funded...",
    subtitle: "Investment Research",
    description: "Go on Crunchbase, Dealroom, and TechCrunch, filter by Series A funding rounds in the SaaS Finance...",
    company: "Investment Firm",
    industry: "Finance",
    image: "/violet.png",
    replayUrl: "#",
    metrics: {
      timeSaved: "12 hours",
      efficiency: "15X faster"
    },
    tags: ["Research", "Investment", "SaaS"]
  },
  {
    id: "forum-scraping",
    title: "Scrape Forum...",
    subtitle: "Market Research",
    description: "I need to find the best beauty centers in Rome, but I want to find them by using open forums that...",
    company: "Beauty Business",
    industry: "Beauty",
    image: "/violet.png",
    replayUrl: "#",
    metrics: {
      timeSaved: "6 hours",
      efficiency: "12X faster"
    },
    tags: ["Research", "Forums", "Local Business"]
  }
];

export const caseStudyCategories = [
  { id: "all", label: "All Cases" },
  { id: "research", label: "Research" },
  { id: "automation", label: "Automation" },
  { id: "planning", label: "Planning" },
  { id: "analysis", label: "Analysis" },
  { id: "recruitment", label: "Recruitment" },
  { id: "marketing", label: "Marketing" }
];
