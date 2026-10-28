// Every public fact on the site lives here. Edit this file to update the portfolio.

export const profile = {
  name: 'Ehtesham Mehdi',
  role: 'AI Engineer',
  focus: 'Agentic Systems, RAG and LLM Applications',
  location: 'Islamabad, Pakistan',
  availability: 'Open to remote opportunities worldwide',
  email: 'mehdiehtesham2@gmail.com',
  github: 'https://github.com/ehteshambuildagents',
  cv: '/Ehtesham_Mehdi_AI_Engineer_Resume.pdf',
}

export const sections = [
  { id: 'intro', label: 'Intro' },
  { id: 'about', label: 'About' },
  { id: 'work', label: 'Work' },
  { id: 'experience', label: 'Experience' },
  { id: 'capabilities', label: 'Capabilities' },
  { id: 'contact', label: 'Contact' },
] as const

export const hero = {
  headline: ['AI Engineer building ', 'agentic systems', ', RAG and LLM applications.'],
  lede:
    'I work across architecture, tool integration, deployment and the operator review workflows that keep a person in charge.',
}

export const about = {
  statement: 'Agents that do real work, with a human still holding the important decisions.',
  body: [
    'I design how an LLM application is put together: which agents exist, what tools they can call, what they retrieve, and where a person has to approve before anything leaves the system. Then I deploy it and watch where it fails.',
    'Independently, I have delivered an AI SDR platform used by roughly 1,000 people and a local-first desktop assistant used by 100+ people.',
  ],
}

export type Project = {
  id: string
  name: string
  kicker: string
  tags: string[]
  short: string
  summary: string
  problem: string
  contribution: string[]
  flow: string[]
  tech: string[]
  outcome: string
  repo?: string
}

export const projects: Project[] = [
  {
    id: 'saqua',
    name: 'Saqua',
    short: 'Saqua',
    kicker: 'AI SDR platform',
    tags: ['Independent project', '2025 – Sep 2026'],
    summary:
      'Research and writer agents that qualify prospects, personalise outreach and follow up, with a person approving before anything is sent.',
    problem:
      'Outbound sales means researching every prospect, writing a tailored message, sorting replies and remembering to follow up. Automating all of it blindly risks sending the wrong message to the wrong person.',
    contribution: [
      'Delivered Python research and writer agents covering prospect qualification and personalised outreach.',
      'Added inbox classification and a human approval step before outreach goes out.',
      'Scheduled up to five follow-ups at four-day intervals, stopping as soon as a prospect responds.',
      'Deployed on Railway with a Streamlit console where operators review and override agent output.',
    ],
    flow: ['Qualify prospect', 'Research', 'Draft outreach', 'Human approval', 'Send', 'Classify inbox', 'Follow up ≤5× / 4 days', 'Stop on reply'],
    tech: ['Python', 'Multi-agent workflow', 'Human-in-the-loop', 'Streamlit', 'Railway'],
    outcome: 'Used by roughly 1,000 users.',
  },
  {
    id: 'jarvis',
    name: 'JARVIS',
    short: 'JARVIS',
    kicker: 'Open-source voice assistant fork',
    tags: ['Open-source contribution'],
    summary:
      'Windows support, background launchers, voice dismissal and a loopback-only bridge for an existing open-source browser voice assistant driven by Claude Code.',
    problem:
      'The upstream assistant ran its bridge on every network interface and assumed macOS. Running it day to day on Windows, and safely, needed both changed.',
    contribution: [
      'Bound the bridge to 127.0.0.1 so other machines on the network can no longer drive an agent that may have shell access.',
      'Added Windows support, including a system prompt that teaches the assistant Windows command conventions.',
      'Added background launchers that start, recall and stop the assistant without leaving terminals open.',
      'Added a voice dismissal that returns the assistant to standby without being confused with real tasks.',
    ],
    flow: ['Wake word', 'Browser interface', 'Bridge on 127.0.0.1', 'Claude Code', 'Tools', 'Spoken reply'],
    tech: ['TypeScript', 'React', 'Node.js', 'Claude Code', 'Windows'],
    outcome: '25 stars and 11 forks on the fork (snapshot, October 2026).',
    repo: 'https://github.com/ehteshambuildagents/jarvis',
  },
  {
    id: 'desktop-agent',
    name: 'Local-First Desktop Agent',
    short: 'Desktop Agent',
    kicker: 'Self-hosted Llama / Kimi assistant',
    tags: ['Independent project', 'Local inference'],
    summary:
      'A desktop assistant running open-weight Llama and Kimi models on the user’s own hardware, with system-level tool execution.',
    problem:
      'A desktop assistant sees files, commands and personal context. When the model is served elsewhere, all of that leaves the machine and the user has no say in which model runs.',
    contribution: [
      'Shipped a desktop assistant built on open-weight Llama and Kimi models.',
      'Ran inference locally, so prompts, files and tool results stay on the user’s machine.',
      'Implemented system-level tool execution so the assistant can act on the desktop, not just answer.',
    ],
    flow: ['Request', 'Local model (Llama / Kimi)', 'Tool call', 'System action', 'Result'],
    tech: ['Llama', 'Kimi', 'Local inference', 'Tool calling'],
    outcome: 'Used by 100+ people. Model serving stays under the user’s control.',
  },
  {
    id: 'bylinekit',
    name: 'BylineKit',
    short: 'BylineKit',
    kicker: 'LinkedIn content workflow',
    tags: ['Independent project'],
    summary:
      'Twelve specialist Claude skills over shared context for planning, drafting, engagement, outreach and review. Publication stays under human review.',
    problem:
      'Writing consistently on LinkedIn spans planning, drafting, engagement and outreach, each with its own conventions. An autonomous poster would remove the author’s judgement.',
    contribution: [
      'Packaged twelve specialist Claude skills that share context across planning, drafting, engagement, outreach and review.',
      'Wrote two local Python tools for cleaning and scoring drafts.',
      'Covered the repository with 39 tests.',
      'Kept publication a human decision. Nothing is posted automatically.',
    ],
    flow: ['Plan', 'Draft', 'Clean & score', 'Engage / outreach', 'Human review', 'Publish by hand'],
    tech: ['Claude skills', 'Claude Code', 'Python', 'Context engineering'],
    outcome: 'Twelve skills, two local tools and 39 repository tests.',
    repo: 'https://github.com/ehteshambuildagents/automatedlinkedIn',
  },
  {
    id: 'resistive',
    name: 'Resistive',
    short: 'Resistive',
    kicker: 'Creative intelligence',
    tags: ['Prototype'],
    summary:
      'Classical ML and LLM analysis of a brand’s Meta ad data to assess hooks, retention and spend efficiency, then propose creative tests.',
    problem:
      'Ad reporting shows what spent and what converted, but not why a creative held attention or which test to run next.',
    contribution: [
      'Combined classical ML with LLM analysis of brand-specific Meta ad data.',
      'Assessed creative hooks, retention and spend efficiency.',
      'Generated proposed creative tests from the analysis.',
    ],
    flow: ['Meta ad data', 'Classical ML', 'LLM analysis', 'Hooks · retention · spend', 'Proposed tests'],
    tech: ['Classical ML', 'LLM analysis', 'Meta ad data'],
    outcome: 'Prototype. Its output is a set of proposed creative tests, not measured results.',
  },
  {
    id: 'upwork-autopilot',
    name: 'Upwork Autopilot',
    short: 'Upwork Autopilot',
    kicker: 'MCP job pipeline',
    tags: ['Independent project'],
    summary:
      'MCP tools for job monitoring, fit scoring, proposals and replies, with rules that govern bid spending.',
    problem: 'Checking for jobs and messages by hand left response delays of 10–12 hours.',
    contribution: [
      'Used MCP for job monitoring, fit scoring, proposals and replies.',
      'Added rules that control how bids are spent.',
    ],
    flow: ['Monitor jobs', 'Score fit', 'Bid rules', 'Draft proposal', 'Reply'],
    tech: ['Model Context Protocol (MCP)', 'Tool calling', 'LLM APIs'],
    outcome: 'Response delays reduced from 10–12 hours to near-immediate.',
  },
]

export const experience = [
  {
    role: 'Chief AI Engineer',
    org: '10x.ai',
    period: '2026',
    points: [
      'Led architecture and delivery of LLM applications, translating product requirements into agent workflows, retrieval strategies and tool integrations.',
      'Coordinated technical priorities across implementation, integration and deployment; reviewed model selection, reliability trade-offs and human approval boundaries.',
      'Defined evaluation checks for groundedness, tool success, latency and inference cost; investigated failures and drove iterative improvements.',
    ],
  },
  {
    role: 'Machine Learning Engineer Intern',
    org: 'CodeAlpha',
    period: '',
    points: [
      'Prepared and explored datasets in Python/pandas; built baseline ML models and compared results using task-appropriate validation and metrics.',
      'Investigated prediction errors and data-quality issues; documented experiments, limitations and recommendations for model improvement.',
    ],
  },
]

// evidence: a project id (opens its detail view) or a section anchor.
export const capabilities = [
  {
    title: 'Agentic AI',
    items: ['LangGraph', 'Multi-agent orchestration', 'Tool / function calling', 'Model Context Protocol (MCP)', 'Claude Agent SDK', 'Human-in-the-loop approval'],
    evidence: [
      { label: 'Saqua: agents with a human approval step', project: 'saqua' },
      { label: 'Upwork Autopilot: MCP tools', project: 'upwork-autopilot' },
    ],
  },
  {
    title: 'Retrieval & memory',
    items: ['Retrieval-augmented generation (RAG)', 'pgvector', 'Semantic search', 'Persistent memory', 'Context engineering', 'PostgreSQL / SQL'],
    evidence: [
      { label: '10x.ai: retrieval strategies and groundedness checks', anchor: 'experience' },
      { label: 'BylineKit: shared context across twelve skills', project: 'bylinekit' },
    ],
  },
  {
    title: 'LLM applications',
    items: ['Prompt / system-prompt design', 'OpenAI and Claude APIs', 'Multi-provider routing', 'Cost-aware model selection', 'Open-weight models: Llama, Kimi, DeepSeek'],
    evidence: [
      { label: 'Desktop agent: Llama and Kimi served locally', project: 'desktop-agent' },
      { label: '10x.ai: model selection and inference cost', anchor: 'experience' },
    ],
  },
  {
    title: 'Engineering & delivery',
    items: ['Python', 'FastAPI', 'Async services', 'REST APIs', 'pandas', 'Streamlit', 'Railway', 'Local inference', 'Claude Code', 'ElevenLabs'],
    evidence: [
      { label: 'Saqua: deployed on Railway with Streamlit', project: 'saqua' },
      { label: 'BylineKit: Python tools and 39 tests', project: 'bylinekit' },
    ],
  },
] as const
