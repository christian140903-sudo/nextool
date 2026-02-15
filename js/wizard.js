/* ==========================================================================
   NexTool Revolution — Wizard JavaScript
   The Intent-to-Expertise Engine flow.

   Phase 1: Template-based generation with dynamic questions
   Phase 3+: Dynamic generation via API (Claude/OpenAI)
   ========================================================================== */

(function() {
  'use strict';

  /* --------------------------------------------------------------------------
     STATE
     -------------------------------------------------------------------------- */

  const state = {
    step: 1,
    goal: '',
    category: null,
    model: 'chatgpt',
    answers: {},
    generatedPack: null
  };


  /* --------------------------------------------------------------------------
     LABEL MAP — Human-readable labels for answer keys (used in prompts)
     -------------------------------------------------------------------------- */

  const LABEL_MAP = {
    audience: 'Target audience', conversion: 'Conversion action', style: 'Style',
    pages: 'Sections needed', constraints: 'Constraints', type: 'Type',
    voice: 'Tone & voice', objective: 'Objective', context: 'Additional context',
    industry: 'Industry & stage', metrics: 'Key metrics', ask: 'Decision/ask',
    stack: 'Tech stack', requirements: 'Core features', quality: 'Quality standards',
    topic: 'Topic', depth: 'Depth & format', sources: 'Sources/methodology',
    output: 'Output use', tools: 'Current tools', trigger: 'Trigger',
    volume: 'Scale & frequency', brand: 'Brand personality', colors: 'Colors',
    inspiration: 'Inspiration', learners: 'Learners', method: 'Teaching method',
    duration: 'Duration & assessment', jurisdiction: 'Jurisdiction',
    parties: 'Parties involved', specifics: 'Specific requirements',
    priority: 'Priority', situation: 'Current situation', outcome: 'Desired outcome',
    preferences: 'Preferences', tried: 'Already tried'
  };


  /* --------------------------------------------------------------------------
     QUESTION BANK — Tailored per category
     -------------------------------------------------------------------------- */

  const questionBank = {
    website: [
      { id: 'audience', text: 'Who is this website for?', hint: 'Be specific: demographics, needs, tech-savviness.', type: 'text', placeholder: 'e.g. SaaS founders aged 25-45, tech-savvy, value speed...' },
      { id: 'conversion', text: 'What should visitors DO on this site?', hint: 'The single most important conversion action.', type: 'text', placeholder: 'e.g. Sign up for free trial, book a demo, buy the product...' },
      { id: 'style', text: 'What style and tone?', hint: 'Pick all that match your vision.', type: 'chips', options: ['Minimalist', 'Bold', 'Professional', 'Playful', 'Luxury', 'Technical', 'Warm', 'Dark'] },
      { id: 'pages', text: 'What pages or sections do you need?', hint: 'Check all that apply.', type: 'chips', options: ['Hero / Landing', 'Features', 'Pricing', 'Testimonials', 'FAQ', 'Contact', 'Blog', 'Dashboard'] },
      { id: 'constraints', text: 'Any technical requirements or constraints?', hint: 'Framework, timeline, integrations, etc.', type: 'textarea', placeholder: 'e.g. Next.js, must launch in 2 weeks, integrate Stripe...' }
    ],
    content: [
      { id: 'type', text: 'What type of content?', hint: 'Select the primary format.', type: 'chips', options: ['Blog post', 'Social media', 'Newsletter', 'Ad copy', 'Email sequence', 'Video script', 'Whitepaper', 'Case study'] },
      { id: 'audience', text: 'Who is the target audience?', hint: 'The more specific, the better the output.', type: 'text', placeholder: 'e.g. B2B marketing managers at mid-size companies...' },
      { id: 'voice', text: 'What tone and voice?', hint: 'Pick all that match your brand.', type: 'chips', options: ['Professional', 'Conversational', 'Authoritative', 'Witty', 'Empathetic', 'Bold', 'Educational', 'Provocative'] },
      { id: 'objective', text: 'What should this content achieve?', hint: 'The specific outcome you want.', type: 'text', placeholder: 'e.g. Drive 500 signups, establish thought leadership, go viral...' },
      { id: 'context', text: 'Any brand guidelines or examples to follow?', hint: 'Reference competitors, style guides, or examples you love.', type: 'textarea', placeholder: 'e.g. Write like Basecamp\'s blog — direct, opinionated, no fluff...' }
    ],
    business: [
      { id: 'type', text: 'What business document?', hint: 'Select the primary deliverable.', type: 'chips', options: ['Business plan', 'Pitch deck', 'Market analysis', 'SWOT', 'Financial model', 'Go-to-market', 'Competitive analysis', 'Executive summary'] },
      { id: 'industry', text: 'What industry and stage?', hint: 'Context helps us tailor the framework.', type: 'text', placeholder: 'e.g. B2B SaaS, pre-seed, fintech space...' },
      { id: 'audience', text: 'Who will read this?', hint: 'This shapes the depth and format.', type: 'chips', options: ['Investors / VCs', 'Board / Executives', 'Co-founders', 'Employees', 'Partners', 'Customers', 'Government', 'Self'] },
      { id: 'metrics', text: 'What key metrics or data do you have?', hint: 'Revenue, users, growth rate, market size, etc.', type: 'textarea', placeholder: 'e.g. $15K MRR, 200 users, 15% MoM growth, $4.2B TAM...' },
      { id: 'ask', text: 'What is the specific ask or decision?', hint: 'What should the reader do after reading?', type: 'text', placeholder: 'e.g. Invest $500K at $5M valuation, approve budget...' }
    ],
    code: [
      { id: 'type', text: 'What are you building?', hint: 'Select the primary project type.', type: 'chips', options: ['Web app', 'API / Backend', 'Mobile app', 'CLI tool', 'Database', 'DevOps / CI/CD', 'Chrome extension', 'Automation script'] },
      { id: 'stack', text: 'What tech stack?', hint: 'Languages, frameworks, databases.', type: 'text', placeholder: 'e.g. TypeScript, Next.js, PostgreSQL, Vercel...' },
      { id: 'requirements', text: 'What are the core features?', hint: 'List the must-have functionality.', type: 'textarea', placeholder: 'e.g. User auth (OAuth + email), real-time dashboard, Stripe billing, admin panel...' },
      { id: 'quality', text: 'What quality standards?', hint: 'Select all that apply.', type: 'chips', options: ['Tests required', 'TypeScript strict', 'CI/CD pipeline', 'Documentation', 'Performance focus', 'Security audit', 'Accessibility', 'Mobile-first'] },
      { id: 'context', text: 'Anything else the AI should know?', hint: 'Existing codebase, team size, deadline, etc.', type: 'textarea', placeholder: 'e.g. Migrating from PHP monolith, team of 3, launch in March...' }
    ],
    research: [
      { id: 'type', text: 'What type of research?', hint: 'Select the primary research format.', type: 'chips', options: ['Market research', 'Academic paper', 'Competitive intel', 'User research', 'Literature review', 'Data analysis', 'Trend report', 'Feasibility study'] },
      { id: 'topic', text: 'What is the specific research question?', hint: 'The more precise, the better.', type: 'text', placeholder: 'e.g. What is the market size for AI-powered code review tools in 2025?' },
      { id: 'depth', text: 'What depth and format?', hint: 'Select the level of analysis.', type: 'chips', options: ['Quick overview', 'Detailed report', 'Executive summary', 'Full analysis', 'Data-heavy', 'Visual / Charts', 'Actionable insights', 'Academic rigor'] },
      { id: 'sources', text: 'Any preferred sources or methodologies?', hint: 'Databases, frameworks, or approaches to use.', type: 'textarea', placeholder: 'e.g. Use Porter\'s Five Forces, cite recent Gartner/McKinsey reports...' },
      { id: 'output', text: 'How will you use this research?', hint: 'This shapes the output format and recommendations.', type: 'text', placeholder: 'e.g. Present to board for market-entry decision, write blog series...' }
    ],
    automation: [
      { id: 'type', text: 'What do you want to automate?', hint: 'Select the primary automation area.', type: 'chips', options: ['Email workflows', 'CRM automation', 'Report generation', 'Data pipeline', 'Social posting', 'Customer onboarding', 'Invoice processing', 'Monitoring / Alerts'] },
      { id: 'tools', text: 'What tools do you currently use?', hint: 'List your current tech stack.', type: 'text', placeholder: 'e.g. Zapier, Google Sheets, Slack, HubSpot, Stripe...' },
      { id: 'trigger', text: 'What triggers the automation?', hint: 'What event or condition starts the workflow.', type: 'text', placeholder: 'e.g. New form submission, daily at 9am, when payment received...' },
      { id: 'volume', text: 'What scale and frequency?', hint: 'How often and how much data.', type: 'chips', options: ['< 10/day', '10-100/day', '100-1000/day', '1000+/day', 'Real-time', 'Batch daily', 'Batch weekly', 'On-demand'] },
      { id: 'constraints', text: 'Any constraints or requirements?', hint: 'Budget, security, compliance, existing systems.', type: 'textarea', placeholder: 'e.g. GDPR compliant, no-code preferred, budget under $50/month...' }
    ],
    design: [
      { id: 'type', text: 'What are you designing?', hint: 'Select the primary deliverable.', type: 'chips', options: ['Logo', 'UI/UX', 'Brand identity', 'Illustration', 'Social graphics', 'Presentation', 'Icon set', 'Marketing materials'] },
      { id: 'brand', text: 'Describe the brand personality.', hint: 'If it were a person, how would you describe them?', type: 'text', placeholder: 'e.g. Innovative, trustworthy, young, premium but accessible...' },
      { id: 'style', text: 'Visual style preferences?', hint: 'Select all that resonate.', type: 'chips', options: ['Minimalist', 'Bold / Graphic', 'Organic / Natural', 'Geometric', 'Retro / Vintage', 'Futuristic', 'Handmade', 'Corporate'] },
      { id: 'colors', text: 'Any color or visual constraints?', hint: 'Existing brand colors, do\'s and don\'ts.', type: 'text', placeholder: 'e.g. Primary: #635BFF, avoid red, dark mode preferred...' },
      { id: 'inspiration', text: 'Any brands or designs you admire?', hint: 'References help us calibrate the output.', type: 'textarea', placeholder: 'e.g. Apple for minimalism, Stripe for illustrations, Linear for UI...' }
    ],
    education: [
      { id: 'type', text: 'What educational content?', hint: 'Select the primary format.', type: 'chips', options: ['Course plan', 'Lesson plan', 'Study guide', 'Tutorial', 'Quiz / Assessment', 'Workshop', 'Curriculum', 'Flashcards'] },
      { id: 'topic', text: 'What subject and level?', hint: 'Be specific about the topic and student level.', type: 'text', placeholder: 'e.g. Intro to Python for complete beginners, ages 16-20...' },
      { id: 'learners', text: 'Who are the learners?', hint: 'Age, background, motivation.', type: 'text', placeholder: 'e.g. College freshmen, no programming experience, visual learners...' },
      { id: 'method', text: 'Teaching approach?', hint: 'Select preferred methods.', type: 'chips', options: ['Hands-on / Projects', 'Lecture-based', 'Discussion', 'Gamified', 'Self-paced', 'Peer learning', 'Case studies', 'Flipped classroom'] },
      { id: 'duration', text: 'Duration and assessment needs?', hint: 'How long and how to measure success.', type: 'textarea', placeholder: 'e.g. 8-week course, weekly quizzes, final project, certificate...' }
    ],
    legal: [
      { id: 'type', text: 'What legal/finance document?', hint: 'Select the primary deliverable.', type: 'chips', options: ['Contract', 'Terms of Service', 'Privacy Policy', 'NDA', 'Tax planning', 'Budget', 'Compliance review', 'Invoice template'] },
      { id: 'jurisdiction', text: 'What jurisdiction or context?', hint: 'Country, state, industry regulations.', type: 'text', placeholder: 'e.g. EU/GDPR, US Delaware LLC, Austrian tax law...' },
      { id: 'parties', text: 'Who are the parties involved?', hint: 'Describe the entities and relationship.', type: 'text', placeholder: 'e.g. SaaS company (us) and enterprise client (them)...' },
      { id: 'specifics', text: 'Any specific clauses or requirements?', hint: 'Key terms, amounts, special conditions.', type: 'textarea', placeholder: 'e.g. 30-day termination, IP ownership stays with us, liability cap at contract value...' },
      { id: 'priority', text: 'What matters most?', hint: 'Select your priorities.', type: 'chips', options: ['Protection', 'Simplicity', 'Fairness', 'Compliance', 'Flexibility', 'Speed', 'Cost savings', 'Thoroughness'] }
    ],
    personal: [
      { id: 'type', text: 'What do you need help with?', hint: 'Select the primary area.', type: 'chips', options: ['Travel plan', 'Fitness routine', 'Meal plan / Recipes', 'Coaching', 'Journaling', 'Goal setting', 'Habit building', 'Life organization'] },
      { id: 'situation', text: 'Describe your current situation.', hint: 'Context helps personalize the output.', type: 'text', placeholder: 'e.g. 30yo, desk job, want to get fit, 3x/week available...' },
      { id: 'outcome', text: 'What specific outcome do you want?', hint: 'The more specific, the better.', type: 'text', placeholder: 'e.g. Lose 10kg in 6 months, visit 5 countries in 3 weeks...' },
      { id: 'preferences', text: 'Any preferences or constraints?', hint: 'Select all that apply.', type: 'chips', options: ['Budget-friendly', 'Time-efficient', 'Science-based', 'Fun / Creative', 'Structured', 'Flexible', 'Social', 'Solo'] },
      { id: 'context', text: 'Anything else important?', hint: 'Allergies, injuries, travel dates, etc.', type: 'textarea', placeholder: 'e.g. Vegetarian, bad knees, traveling in July, budget $3000...' }
    ]
  };

  // Default questions for when no category is selected
  const defaultQuestions = [
    { id: 'audience', text: 'Who is this for?', hint: 'The primary audience or end user.', type: 'text', placeholder: 'e.g. My team, my clients, myself...' },
    { id: 'outcome', text: 'What is the ideal outcome?', hint: 'What does success look like?', type: 'text', placeholder: 'e.g. A complete, ready-to-use deliverable...' },
    { id: 'style', text: 'What tone and style?', hint: 'Pick all that match.', type: 'chips', options: ['Professional', 'Friendly', 'Bold', 'Minimalist', 'Playful', 'Technical', 'Casual', 'Authoritative'] },
    { id: 'constraints', text: 'Any constraints or requirements?', hint: 'Timeline, budget, tools, etc.', type: 'textarea', placeholder: 'e.g. Need it by Friday, use Google Docs format...' },
    { id: 'tried', text: 'What have you tried so far?', hint: 'Helps us avoid generic suggestions.', type: 'textarea', placeholder: 'e.g. I asked ChatGPT but the output was too vague...' }
  ];


  /* --------------------------------------------------------------------------
     PACK TEMPLATES — System prompts + tasks per category
     -------------------------------------------------------------------------- */

  const packTemplates = {
    website: {
      role: 'senior web designer and conversion specialist with 15+ years of experience building high-converting websites',
      systemPrefix: 'You specialize in the intersection of visual design, user psychology, and conversion rate optimization.',
      tasks: [
        { title: 'Hero Section', desc: 'Design the above-the-fold experience that captures attention in 3 seconds and drives the primary CTA.' },
        { title: 'Value Proposition', desc: 'Craft the messaging framework: headline, sub-headline, and supporting copy that communicates unique value.' },
        { title: 'Social Proof Section', desc: 'Design the trust layer: testimonials, logos, metrics, and case study snippets that eliminate doubt.' },
        { title: 'CTA & Conversion Flow', desc: 'Optimize the conversion path: button copy, form design, micro-interactions, and friction reduction.' },
        { title: 'Mobile Optimization', desc: 'Ensure the design works flawlessly on mobile: touch targets, load speed, responsive layout.' },
        { title: 'SEO Foundation', desc: 'Set up the technical SEO: meta tags, heading structure, schema markup, and page speed optimization.' }
      ],
      checklist: ['Mobile responsive', 'Load time < 3s', 'Clear conversion path', 'Consistent brand', 'Accessible (WCAG 2.1)', 'SEO meta tags']
    },
    content: {
      role: 'senior content strategist and copywriter who has driven millions in revenue through words',
      systemPrefix: 'You understand that great content is strategy made visible — every word serves the goal.',
      tasks: [
        { title: 'Content Strategy Brief', desc: 'Define the content angle, hook, structure, and distribution plan aligned with the goal.' },
        { title: 'Headline Variations', desc: 'Generate 10 headline options using proven frameworks: AIDA, PAS, curiosity gap, benefit-driven.' },
        { title: 'Full Draft', desc: 'Write the complete first draft following the approved strategy, with proper formatting and flow.' },
        { title: 'CTA & Distribution', desc: 'Craft the call-to-action copy and plan the distribution across channels for maximum reach.' },
        { title: 'SEO Optimization', desc: 'Optimize for search: keyword placement, meta description, internal linking, and featured snippet targeting.' },
        { title: 'Repurpose Plan', desc: 'Create a repurposing strategy: turn one piece into 5+ formats (social, email, video script, etc.).' }
      ],
      checklist: ['Hooks reader in first line', 'Matches brand voice', 'Clear CTA', 'SEO optimized', 'Scannable formatting', 'Proofread']
    },
    business: {
      role: 'senior business strategist and management consultant from a top-tier firm (McKinsey/BCG level)',
      systemPrefix: 'You think in frameworks, communicate with data, and always tie analysis to actionable recommendations.',
      tasks: [
        { title: 'Executive Summary', desc: 'Write a compelling 1-page summary that captures the opportunity, strategy, and ask.' },
        { title: 'Market Analysis', desc: 'Size the market (TAM/SAM/SOM), identify trends, and map the competitive landscape.' },
        { title: 'Strategy Framework', desc: 'Apply the appropriate strategic framework and derive concrete, actionable recommendations.' },
        { title: 'Financial Projections', desc: 'Build the financial model: revenue forecast, unit economics, and key assumptions.' },
        { title: 'Risk Assessment', desc: 'Identify top risks, mitigation strategies, and scenario analysis (best/base/worst case).' },
        { title: 'Action Plan', desc: 'Create a 90-day action plan with milestones, owners, and success metrics.' }
      ],
      checklist: ['Data-backed claims', 'Clear recommendations', 'Realistic financials', 'Risk mitigation', 'Professional formatting', 'Compelling narrative']
    },
    code: {
      role: 'senior software engineer and architect with expertise across the full stack',
      systemPrefix: 'You write clean, maintainable, well-tested code. You think about edge cases, scalability, and developer experience.',
      tasks: [
        { title: 'Architecture Design', desc: 'Design the system architecture: components, data flow, API contracts, and technology choices.' },
        { title: 'Data Model', desc: 'Design the database schema: tables/collections, relationships, indexes, and migrations.' },
        { title: 'Core Implementation', desc: 'Implement the primary feature with proper error handling, typing, and documentation.' },
        { title: 'API Design', desc: 'Design RESTful or GraphQL endpoints: routes, request/response schemas, authentication.' },
        { title: 'Testing Strategy', desc: 'Write unit tests, integration tests, and define the testing strategy and CI pipeline.' },
        { title: 'Deployment & DevOps', desc: 'Set up the deployment pipeline: containerization, CI/CD, monitoring, and environment management.' }
      ],
      checklist: ['Type-safe', 'Error handling', 'Tests passing', 'Documentation', 'Security reviewed', 'Performance optimized']
    },
    research: {
      role: 'senior research analyst with expertise in systematic research methodology and data-driven insights',
      systemPrefix: 'You conduct thorough, methodical research and present findings with clarity and actionable conclusions.',
      tasks: [
        { title: 'Research Framework', desc: 'Define the research question, methodology, scope, and success criteria.' },
        { title: 'Data Collection Plan', desc: 'Identify sources, data collection methods, and quality criteria.' },
        { title: 'Analysis Framework', desc: 'Apply the appropriate analytical framework and synthesize key findings.' },
        { title: 'Key Findings', desc: 'Present the top insights with supporting evidence and visualizations.' },
        { title: 'Recommendations', desc: 'Derive actionable recommendations ranked by impact and feasibility.' },
        { title: 'Executive Report', desc: 'Compile the final report with executive summary, methodology, findings, and appendix.' }
      ],
      checklist: ['Sources cited', 'Methodology clear', 'Data reliable', 'Insights actionable', 'Bias acknowledged', 'Well-structured']
    },
    automation: {
      role: 'senior automation engineer and workflow architect who builds systems that run themselves',
      systemPrefix: 'You design robust, maintainable automations that save time and eliminate human error.',
      tasks: [
        { title: 'Workflow Map', desc: 'Map the complete automation workflow: triggers, conditions, actions, and error handling.' },
        { title: 'Tool Selection', desc: 'Select the optimal tools and integrations for each step of the workflow.' },
        { title: 'Implementation Plan', desc: 'Step-by-step implementation guide with code snippets and configuration details.' },
        { title: 'Error Handling', desc: 'Design the error handling and notification system for when things go wrong.' },
        { title: 'Testing Plan', desc: 'Create test scenarios: happy path, edge cases, failure modes, and load testing.' },
        { title: 'Monitoring & Maintenance', desc: 'Set up monitoring dashboards, alerts, and a maintenance schedule.' }
      ],
      checklist: ['Idempotent', 'Error handling', 'Monitoring', 'Documentation', 'Scalable', 'Cost-efficient']
    },
    design: {
      role: 'senior creative director and brand designer with a portfolio of award-winning work',
      systemPrefix: 'You understand that great design is invisible — it solves problems while looking effortless.',
      tasks: [
        { title: 'Creative Brief', desc: 'Define the design direction: mood, references, constraints, and success criteria.' },
        { title: 'Concept Exploration', desc: 'Generate 3-5 distinct design concepts with rationale for each direction.' },
        { title: 'Design System', desc: 'Define the visual language: colors, typography, spacing, components, and usage rules.' },
        { title: 'Primary Deliverable', desc: 'Create the main design asset with variations and usage guidelines.' },
        { title: 'Brand Guidelines', desc: 'Document the brand rules: do\'s and don\'ts, spacing, color usage, and examples.' },
        { title: 'Asset Package', desc: 'List all deliverable formats, sizes, and file types needed for production.' }
      ],
      checklist: ['Brand consistent', 'Scalable / Vector', 'Accessible colors', 'Multiple formats', 'Usage guidelines', 'Print + digital ready']
    },
    education: {
      role: 'senior instructional designer and educator who makes complex topics accessible and engaging',
      systemPrefix: 'You apply proven learning science: spaced repetition, active recall, scaffolding, and engagement techniques.',
      tasks: [
        { title: 'Learning Objectives', desc: 'Define SMART learning objectives using Bloom\'s taxonomy.' },
        { title: 'Curriculum Map', desc: 'Structure the content: modules, lessons, progression, and prerequisite mapping.' },
        { title: 'Lesson Content', desc: 'Create engaging lesson content with explanations, examples, and activities.' },
        { title: 'Assessments', desc: 'Design formative and summative assessments that measure actual understanding.' },
        { title: 'Engagement Plan', desc: 'Add interactive elements: discussions, projects, gamification, and real-world applications.' },
        { title: 'Resources & Materials', desc: 'Compile supplementary materials: readings, videos, tools, and reference guides.' }
      ],
      checklist: ['Clear objectives', 'Progressive difficulty', 'Active learning', 'Assessment aligned', 'Inclusive design', 'Feedback loops']
    },
    legal: {
      role: 'senior legal consultant specializing in business law, contracts, and regulatory compliance',
      systemPrefix: 'You draft precise, clear legal language that protects interests while remaining accessible to non-lawyers.',
      tasks: [
        { title: 'Requirements Analysis', desc: 'Identify all legal requirements, regulations, and compliance needs.' },
        { title: 'Document Structure', desc: 'Outline the document with all necessary sections, clauses, and definitions.' },
        { title: 'Core Clauses', desc: 'Draft the key clauses with appropriate legal language and protections.' },
        { title: 'Risk Provisions', desc: 'Add limitation of liability, indemnification, and dispute resolution clauses.' },
        { title: 'Compliance Check', desc: 'Review against applicable regulations (GDPR, industry-specific, jurisdictional).' },
        { title: 'Plain Language Summary', desc: 'Create a non-lawyer-friendly summary of the key terms and obligations.' }
      ],
      checklist: ['Jurisdiction correct', 'All parties named', 'Terms defined', 'Liability limited', 'Compliance met', 'Plain language available']
    },
    personal: {
      role: 'senior life coach and personal strategist who helps people achieve their goals systematically',
      systemPrefix: 'You combine behavioral science with practical planning to create sustainable, enjoyable paths to goals.',
      tasks: [
        { title: 'Goal Definition', desc: 'Define SMART goals with clear metrics and timeline.' },
        { title: 'Current State Assessment', desc: 'Assess the starting point: strengths, gaps, resources, and constraints.' },
        { title: 'Action Plan', desc: 'Create a structured weekly/monthly plan with specific, manageable steps.' },
        { title: 'Habit System', desc: 'Design the habit stack: triggers, routines, rewards, and tracking method.' },
        { title: 'Progress Tracking', desc: 'Set up milestones, check-ins, and adjustment criteria.' },
        { title: 'Motivation & Accountability', desc: 'Build in accountability mechanisms and motivational strategies for tough days.' }
      ],
      checklist: ['Realistic timeline', 'Specific actions', 'Built-in flexibility', 'Progress measurable', 'Sustainability focus', 'Enjoyable process']
    }
  };

  // Model-specific optimization tips
  const modelTips = {
    chatgpt: {
      name: 'ChatGPT',
      format: 'Use markdown headers (##) for structure. ChatGPT responds best to clear role assignments and step-by-step instructions.',
      tip: 'Start with "You are..." and use numbered lists for multi-step tasks. Use "Let\'s think step by step" for complex reasoning.',
      systemTag: '## System Prompt'
    },
    claude: {
      name: 'Claude',
      format: 'Use XML tags (<role>, <context>, <task>) for structure. Claude excels with explicit constraints and examples.',
      tip: 'Claude responds exceptionally well to XML-structured prompts and explicit thinking instructions. Use <thinking> tags for complex analysis.',
      systemTag: '<system>'
    },
    gemini: {
      name: 'Gemini',
      format: 'Use clear sections with bold headers. Gemini works best with specific examples and source-requesting patterns.',
      tip: 'Ask Gemini to cite sources and verify claims. Use "Based on current data..." prefixes for factual queries.',
      systemTag: '## System Instructions'
    }
  };


  /* --------------------------------------------------------------------------
     DOM REFS
     -------------------------------------------------------------------------- */

  const dom = {
    panels: document.querySelectorAll('.wizard__panel'),
    stepIndicators: document.querySelectorAll('.wizard__step-indicator'),
    connectors: document.querySelectorAll('.wizard__step-connector'),
    progressFill: document.querySelector('.wizard__progress-fill'),

    // Step 1
    goalInput: document.getElementById('goal-input'),
    charCount: document.getElementById('char-count'),
    categoryChips: document.querySelectorAll('.step-goal__chip'),
    modelButtons: document.querySelectorAll('.step-goal__model'),
    continueBtn: document.getElementById('btn-continue-goal'),

    // Step 2
    contextLabel: document.getElementById('context-label'),
    questionsList: document.getElementById('questions-list'),
    generateBtn: document.getElementById('btn-generate'),
    skipBtn: document.getElementById('btn-skip-questions'),

    // Step 3
    generatingState: document.getElementById('generating-state'),
    generatingStep: document.getElementById('generating-step'),
    packResult: document.getElementById('pack-result'),
    copyAllBtn: document.getElementById('btn-copy-all')
  };


  /* --------------------------------------------------------------------------
     URL PARAMS — Pre-fill from landing page
     -------------------------------------------------------------------------- */

  function loadUrlParams() {
    const params = new URLSearchParams(window.location.search);

    const query = params.get('q');
    if (query && dom.goalInput) {
      dom.goalInput.value = query;
      state.goal = query;
      updateCharCount();
      updateContinueButton();
    }

    const cat = params.get('cat');
    if (cat) {
      selectCategory(cat);
    }
  }


  /* --------------------------------------------------------------------------
     STEP NAVIGATION
     -------------------------------------------------------------------------- */

  function goToStep(stepNumber) {
    state.step = stepNumber;

    dom.panels.forEach(panel => panel.classList.remove('active'));
    const targetPanel = document.getElementById(
      stepNumber === 1 ? 'step-goal' :
      stepNumber === 2 ? 'step-questions' :
      'step-pack'
    );
    if (targetPanel) {
      targetPanel.classList.add('active');
    }

    dom.stepIndicators.forEach((indicator, index) => {
      const step = index + 1;
      indicator.classList.remove('active', 'completed');
      if (step < stepNumber) indicator.classList.add('completed');
      if (step === stepNumber) indicator.classList.add('active');
    });

    dom.connectors.forEach((connector, index) => {
      connector.classList.toggle('completed', index + 1 < stepNumber);
    });

    const progress = (stepNumber / 3) * 100;
    if (dom.progressFill) {
      dom.progressFill.style.width = progress + '%';
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }


  /* --------------------------------------------------------------------------
     STEP 1 — Goal Input
     -------------------------------------------------------------------------- */

  function updateCharCount() {
    if (!dom.goalInput || !dom.charCount) return;
    dom.charCount.textContent = dom.goalInput.value.length;
  }

  function updateContinueButton() {
    if (!dom.continueBtn) return;
    const hasInput = dom.goalInput && dom.goalInput.value.trim().length > 5;
    const hasCategory = state.category !== null;
    dom.continueBtn.disabled = !(hasInput || hasCategory);
  }

  function selectCategory(cat) {
    state.category = cat;
    dom.categoryChips.forEach(chip => {
      chip.classList.toggle('selected', chip.dataset.category === cat);
    });
    updateContinueButton();
  }

  function selectModel(model) {
    state.model = model;
    dom.modelButtons.forEach(btn => {
      btn.classList.toggle('selected', btn.dataset.model === model);
    });
  }

  function initStep1() {
    if (dom.goalInput) {
      dom.goalInput.addEventListener('input', () => {
        state.goal = dom.goalInput.value;
        updateCharCount();
        updateContinueButton();
      });
    }

    dom.categoryChips.forEach(chip => {
      chip.addEventListener('click', () => {
        const cat = chip.dataset.category;
        if (state.category === cat) {
          state.category = null;
          chip.classList.remove('selected');
        } else {
          selectCategory(cat);
        }
        updateContinueButton();
      });
    });

    dom.modelButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        selectModel(btn.dataset.model);
      });
    });

    if (dom.continueBtn) {
      dom.continueBtn.addEventListener('click', () => {
        if (dom.continueBtn.disabled) return;

        const catName = state.category
          ? state.category.charAt(0).toUpperCase() + state.category.slice(1)
          : 'Custom';
        const modelName = modelTips[state.model]?.name || state.model;
        if (dom.contextLabel) {
          dom.contextLabel.textContent = catName + ' \u2014 ' + modelName;
        }

        renderQuestions();
        goToStep(2);
      });
    }
  }


  /* --------------------------------------------------------------------------
     STEP 2 — Dynamic Questions
     -------------------------------------------------------------------------- */

  function renderQuestions() {
    if (!dom.questionsList) return;

    const questions = state.category && questionBank[state.category]
      ? questionBank[state.category]
      : defaultQuestions;

    dom.questionsList.innerHTML = '';

    questions.forEach((q, index) => {
      const card = document.createElement('div');
      card.className = 'question-card';
      card.dataset.questionId = q.id;

      let inputHtml = '';
      if (q.type === 'text') {
        inputHtml = `<input type="text" class="question-card__input" data-qid="${q.id}" placeholder="${escapeHtml(q.placeholder || '')}">`;
      } else if (q.type === 'textarea') {
        inputHtml = `<textarea class="question-card__input" data-qid="${q.id}" rows="3" placeholder="${escapeHtml(q.placeholder || '')}"></textarea>`;
      } else if (q.type === 'chips') {
        inputHtml = '<div class="question-card__options">' +
          q.options.map(opt => `<button class="question-card__option" data-qid="${q.id}">${escapeHtml(opt)}</button>`).join('') +
          '</div>';
      }

      card.innerHTML = `
        <div class="question-card__number">Question ${index + 1} of ${questions.length}</div>
        <div class="question-card__text">${escapeHtml(q.text)}</div>
        <div class="question-card__hint">${escapeHtml(q.hint)}</div>
        ${inputHtml}
      `;

      dom.questionsList.appendChild(card);
    });

    // Bind chip selection
    dom.questionsList.querySelectorAll('.question-card__option').forEach(btn => {
      btn.addEventListener('click', () => {
        btn.classList.toggle('selected');
      });
    });
  }

  function collectAnswers() {
    state.answers = {};

    // Collect text/textarea inputs
    document.querySelectorAll('.question-card__input').forEach(input => {
      const qid = input.dataset.qid;
      if (qid && input.value.trim()) {
        state.answers[qid] = input.value.trim();
      }
    });

    // Collect chip selections per question
    const chipsByQuestion = {};
    document.querySelectorAll('.question-card__option.selected').forEach(btn => {
      const qid = btn.dataset.qid;
      if (qid) {
        if (!chipsByQuestion[qid]) chipsByQuestion[qid] = [];
        chipsByQuestion[qid].push(btn.textContent.trim());
      }
    });
    Object.assign(state.answers, chipsByQuestion);
  }

  function initStep2() {
    if (dom.generateBtn) {
      dom.generateBtn.addEventListener('click', () => {
        collectAnswers();
        goToStep(3);
        startGeneration();
      });
    }

    if (dom.skipBtn) {
      dom.skipBtn.addEventListener('click', () => {
        goToStep(3);
        startGeneration();
      });
    }
  }


  /* --------------------------------------------------------------------------
     STEP 3 — Pack Generation
     -------------------------------------------------------------------------- */

  function startGeneration() {
    if (!dom.generatingState || !dom.packResult) return;

    dom.generatingState.style.display = 'flex';
    dom.packResult.classList.remove('visible');

    const modelName = modelTips[state.model]?.name || state.model;
    const steps = [
      'Analyzing your goal and context',
      'Mapping expertise requirements',
      'Designing prompt architecture',
      'Building system prompt',
      'Creating task-specific prompts',
      'Optimizing for ' + modelName,
      'Adding quality checks',
      'Finalizing your pack'
    ];

    let currentStep = 0;

    function nextStep() {
      if (currentStep < steps.length) {
        if (dom.generatingStep) {
          dom.generatingStep.textContent = steps[currentStep];
        }
        currentStep++;
        setTimeout(nextStep, 500 + Math.random() * 500);
      } else {
        generatePack();
        showResult();
      }
    }

    nextStep();
  }

  function generatePack() {
    const cat = state.category || 'website';
    const template = packTemplates[cat] || packTemplates.website;
    const model = modelTips[state.model] || modelTips.chatgpt;

    // Build context from answers
    const contextParts = [];
    if (state.goal) contextParts.push('Goal: ' + state.goal);
    Object.entries(state.answers).forEach(([key, value]) => {
      const val = Array.isArray(value) ? value.join(', ') : value;
      if (val) {
        const label = LABEL_MAP[key] || key.charAt(0).toUpperCase() + key.slice(1);
        contextParts.push(label + ': ' + val);
      }
    });
    const contextBlock = contextParts.join('\n');

    // Build system prompt based on model
    let systemPrompt = '';
    if (state.model === 'claude') {
      systemPrompt = `<role>
You are a ${template.role}.
${template.systemPrefix}
</role>

<context>
${contextBlock || 'The user wants a high-quality deliverable tailored to their specific needs.'}
</context>

<instructions>
- Apply industry best practices at every step
- Ask clarifying questions if requirements are ambiguous
- Provide specific, actionable output (not generic advice)
- Consider edge cases and potential issues proactively
- Optimize for the stated goal and audience
</instructions>

<format>
Use clear sections with headers. Provide concrete examples where helpful.
Think through your approach in <thinking> tags before delivering the final output.
</format>`;
    } else if (state.model === 'gemini') {
      systemPrompt = `## Role & Expertise
You are a ${template.role}.
${template.systemPrefix}

## Context
${contextBlock || 'The user wants a high-quality deliverable tailored to their specific needs.'}

## Instructions
- Apply industry best practices at every step
- Cite sources and data when making claims
- Provide specific, actionable output (not generic advice)
- Consider edge cases and potential issues proactively
- When uncertain, note your confidence level and suggest verification steps

## Output Format
Use clear sections with **bold headers**. Include concrete examples and reference current best practices (2024-2025).`;
    } else {
      // ChatGPT default
      systemPrompt = `## Role & Expertise
You are a ${template.role}.
${template.systemPrefix}

## Context
${contextBlock || 'The user wants a high-quality deliverable tailored to their specific needs.'}

## Approach
- Apply industry best practices at every step
- Provide specific, actionable output (not generic advice)
- Consider edge cases and potential issues proactively
- Optimize for the stated goal and audience
- When in doubt, ask clarifying questions before proceeding

## Output Format
Use markdown with clear ## headers for sections. Use numbered lists for sequential steps and bullet points for options. Include concrete examples.`;
    }

    // Build task prompts (free = 3 tasks)
    const freeTasks = template.tasks.slice(0, 3).map((task, i) => {
      return {
        title: `Task ${i + 1}: ${task.title}`,
        prompt: buildTaskPrompt(task, template, model)
      };
    });

    const proTasks = template.tasks.slice(3).map((task, i) => {
      return {
        title: `Task ${i + 4}: ${task.title}`,
        prompt: buildTaskPrompt(task, template, model),
        locked: true
      };
    });

    // Build quick-start guide
    const quickStart = buildQuickStartGuide(template, model, cat);

    state.generatedPack = {
      systemPrompt,
      freeTasks,
      proTasks,
      quickStart,
      checklist: template.checklist,
      model: model.name,
      category: cat
    };
  }

  function buildTaskPrompt(task, template, model) {
    // Build rich context from user answers
    const contextLines = [];
    if (state.goal) contextLines.push(`Goal: ${state.goal}`);

    // Add relevant answers as context for each task
    const answers = state.answers || {};
    Object.entries(answers).forEach(([key, value]) => {
      const val = Array.isArray(value) ? value.join(', ') : value;
      if (val) {
        const label = LABEL_MAP[key] || key.charAt(0).toUpperCase() + key.slice(1);
        contextLines.push(`${label}: ${val}`);
      }
    });

    const contextBlock = contextLines.length
      ? '\n\nContext from user:\n' + contextLines.map(l => `- ${l}`).join('\n')
      : '';

    if (state.model === 'claude') {
      return `<task>
## ${task.title}
${task.desc}${contextBlock}
</task>

<requirements>
- Follow the system prompt context and guidelines above
- Be specific and actionable — no generic filler
- Include concrete examples, code, or templates where applicable
- Consider all stated constraints from the context
- Deliver output ready to use, not just advice
- Tailor everything to the user's specific situation described above
</requirements>`;
    }

    if (state.model === 'gemini') {
      return `## ${task.title}

${task.desc}${contextBlock}

**Requirements:**
- Follow the system prompt guidelines above
- Tailor output to the user's specific situation described above
- Cite sources and current best practices (2024-2025)
- Be specific and actionable — no generic filler
- Include concrete examples where helpful
- Note confidence level where claims are uncertain
- Format with **bold headers** for scannability`;
    }

    // ChatGPT default
    return `## ${task.title}

${task.desc}${contextBlock}

**Requirements:**
- Follow the system prompt guidelines above
- Tailor output to the user's specific situation described above
- Be specific and actionable — no generic filler
- Include concrete examples where helpful
- Consider the stated audience and constraints
- Format the output for easy implementation`;
  }

  function buildQuickStartGuide(template, model, cat) {
    const catName = cat.charAt(0).toUpperCase() + cat.slice(1);
    return `## Quick-Start Guide: ${catName} Pack

### How to use this pack:

1. **Copy the System Prompt** into your AI's system/custom instructions
2. **Start with Task 1** — paste it as your first message
3. **Review the output** and provide feedback if needed
4. **Continue with Task 2-3** sequentially
5. **Run the Quality Checklist** before finalizing

### ${model.name}-Specific Tips:
${model.tip}

### Quality Checklist:
${template.checklist.map(item => '- [ ] ' + item).join('\n')}

### Pro Tip:
After completing all tasks, paste this: "Review everything you've created against the quality checklist. Fix any issues and provide a final summary of what was delivered."`;
  }


  /* --------------------------------------------------------------------------
     RENDER PACK RESULT
     -------------------------------------------------------------------------- */

  function showResult() {
    if (!dom.generatingState || !dom.packResult || !state.generatedPack) return;

    dom.generatingState.style.display = 'none';

    const pack = state.generatedPack;

    // Build the result HTML
    dom.packResult.innerHTML = `
      <div class="step-pack__header">
        <h2 class="step-pack__title">Your pack is ready.</h2>
        <p class="step-pack__subtitle">Copy each section into ${pack.model}. Start with the System Prompt.</p>
      </div>

      <!-- System Prompt -->
      <div class="pack-preview" data-section="system">
        <div class="pack-preview__header">
          <span class="pack-preview__label">SYSTEM PROMPT</span>
          <span class="pack-preview__title">The AI's brain — paste this first</span>
          <button class="btn btn--ghost btn--sm pack-copy-btn" data-target="pack-system">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
            Copy
          </button>
        </div>
        <pre class="pack-preview__content" id="pack-system">${escapeHtml(pack.systemPrompt)}</pre>
      </div>

      <!-- Free Task Prompts -->
      ${pack.freeTasks.map((task, i) => `
        <div class="pack-preview" data-section="task-${i}">
          <div class="pack-preview__header">
            <span class="pack-preview__label">TASK PROMPT</span>
            <span class="pack-preview__title">${escapeHtml(task.title)}</span>
            <button class="btn btn--ghost btn--sm pack-copy-btn" data-target="pack-task-${i}">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
              Copy
            </button>
          </div>
          <pre class="pack-preview__content" id="pack-task-${i}">${escapeHtml(task.prompt)}</pre>
        </div>
      `).join('')}

      <!-- Quick-Start Guide -->
      <div class="pack-preview" data-section="guide">
        <div class="pack-preview__header">
          <span class="pack-preview__label">GUIDE</span>
          <span class="pack-preview__title">Quick-start guide</span>
          <button class="btn btn--ghost btn--sm pack-copy-btn" data-target="pack-guide">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
            Copy
          </button>
        </div>
        <pre class="pack-preview__content" id="pack-guide">${escapeHtml(pack.quickStart)}</pre>
      </div>

      <!-- Pro Locked Sections -->
      <div class="pack-locked">
        <div class="pack-locked__header">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
          <span>Unlock the full pack with Pro</span>
        </div>
        <div class="pack-locked__items">
          ${pack.proTasks.map(task => `
            <div class="pack-locked__item">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
              ${escapeHtml(task.title)}
            </div>
          `).join('')}
          <div class="pack-locked__item">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
            Few-shot examples
          </div>
          <div class="pack-locked__item">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
            Cross-model variants
          </div>
          <div class="pack-locked__item">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
            Quality checklists with scoring
          </div>
        </div>
        <a href="../#pricing" class="btn btn--primary btn--lg pack-locked__cta">
          Upgrade to Pro — $9.99/mo
        </a>
      </div>

      <!-- Made with NexTool -->
      <div class="pack-branding">
        <span class="pack-branding__text">Generated with</span>
        <a href="https://nextool.app" class="pack-branding__link">NexTool</a>
        <span class="pack-branding__divider">&middot;</span>
        <span class="pack-branding__text">Your AI deserves expertise</span>
      </div>

      <!-- Actions -->
      <div class="step-pack__actions">
        <button class="btn btn--primary btn--lg step-pack__copy-all" id="btn-copy-all-new">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
          Copy entire free pack
        </button>
        <button class="btn btn--ghost btn--lg" id="btn-new-pack">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
          Create another pack
        </button>
      </div>

      <!-- Share -->
      <div class="step-pack__share">
        <span class="step-pack__share-label">Share your pack:</span>
        <div class="step-pack__share-buttons">
          <button class="btn btn--ghost btn--sm" id="btn-share-x">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            Post on X
          </button>
          <button class="btn btn--ghost btn--sm" id="btn-share-linkedin">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
            LinkedIn
          </button>
          <button class="btn btn--ghost btn--sm" id="btn-share-copy-link">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>
            Copy link
          </button>
        </div>
      </div>
    `;

    // Bind copy buttons
    dom.packResult.querySelectorAll('.pack-copy-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.dataset.target;
        const content = document.getElementById(targetId);
        if (content) copyToClipboard(content.textContent, btn);
      });
    });

    // Bind copy all
    const copyAllBtn = document.getElementById('btn-copy-all-new');
    if (copyAllBtn) {
      copyAllBtn.addEventListener('click', () => {
        const allContent = [
          state.generatedPack.systemPrompt,
          '',
          '---',
          '',
          ...state.generatedPack.freeTasks.map(t => t.prompt),
          '',
          '---',
          '',
          state.generatedPack.quickStart,
          '',
          '---',
          'Generated with NexTool — https://nextool.app'
        ].join('\n\n');
        copyToClipboard(allContent, copyAllBtn);
      });
    }

    // Bind new pack button
    const newPackBtn = document.getElementById('btn-new-pack');
    if (newPackBtn) {
      newPackBtn.addEventListener('click', () => {
        state.answers = {};
        state.generatedPack = null;
        if (dom.goalInput) dom.goalInput.value = '';
        state.goal = '';
        updateCharCount();
        updateContinueButton();
        goToStep(1);
      });
    }

    // Share buttons
    const catName = (state.category || 'custom').charAt(0).toUpperCase() + (state.category || 'custom').slice(1);
    const shareText = encodeURIComponent('Just generated a free ' + catName + ' expertise pack for ' + pack.model + ' with NexTool. This is incredible.\n\n');
    const shareUrl = encodeURIComponent('https://nextool.app/create/');

    const shareX = document.getElementById('btn-share-x');
    if (shareX) {
      shareX.addEventListener('click', () => {
        window.open('https://x.com/intent/tweet?text=' + shareText + '&url=' + shareUrl, '_blank', 'width=550,height=420');
      });
    }

    const shareLI = document.getElementById('btn-share-linkedin');
    if (shareLI) {
      shareLI.addEventListener('click', () => {
        window.open('https://www.linkedin.com/sharing/share-offsite/?url=' + shareUrl, '_blank', 'width=550,height=420');
      });
    }

    const shareCopyLink = document.getElementById('btn-share-copy-link');
    if (shareCopyLink) {
      shareCopyLink.addEventListener('click', () => {
        copyToClipboard('https://nextool.app/create/', shareCopyLink);
      });
    }

    dom.packResult.classList.add('visible');
  }


  /* --------------------------------------------------------------------------
     COPY FUNCTIONALITY
     -------------------------------------------------------------------------- */

  function copyToClipboard(text, button) {
    const cleanText = text.trim();

    navigator.clipboard.writeText(cleanText).then(() => {
      showCopySuccess(button);
    }).catch(() => {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = cleanText;
      textarea.style.cssText = 'position:fixed;opacity:0;pointer-events:none';
      document.body.appendChild(textarea);
      textarea.select();
      try { document.execCommand('copy'); } catch (e) { /* silent */ }
      document.body.removeChild(textarea);
      showCopySuccess(button);
    });
  }

  function showCopySuccess(button) {
    const originalHTML = button.innerHTML;
    button.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg> Copied!';
    button.style.color = 'var(--success)';

    setTimeout(() => {
      button.innerHTML = originalHTML;
      button.style.color = '';
    }, 2000);
  }


  /* --------------------------------------------------------------------------
     KEYBOARD SHORTCUTS
     -------------------------------------------------------------------------- */

  function initKeyboard() {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (state.step > 1) {
          goToStep(state.step - 1);
        } else {
          window.location.href = '../';
        }
      }

      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        if (state.step === 1 && dom.continueBtn && !dom.continueBtn.disabled) {
          dom.continueBtn.click();
        } else if (state.step === 2 && dom.generateBtn) {
          dom.generateBtn.click();
        }
      }
    });
  }


  /* --------------------------------------------------------------------------
     UTILITIES
     -------------------------------------------------------------------------- */

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }


  /* --------------------------------------------------------------------------
     INIT
     -------------------------------------------------------------------------- */

  function init() {
    loadUrlParams();
    initStep1();
    initStep2();
    initKeyboard();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
