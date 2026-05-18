import { useEffect } from 'react'
import { Printer, ArrowLeft } from 'lucide-react'

const CONTACT = {
  email: 'hoangan615@gmail.com',
  location: 'Cần Thơ, Vietnam',
  linkedin: 'linkedin.com/in/an-vo-012359159',
  linkedinHref: 'https://www.linkedin.com/in/an-vo-012359159/',
  github: 'github.com/hoangan615',
  githubHref: 'https://github.com/hoangan615',
  tiktok: '@tech.takeaway',
  tiktokHref: 'https://www.tiktok.com/@tech.takeaway',
}

const EXPERIENCE = [
  {
    role: 'Sub Project Lead / AI Engineer',
    company: 'FPT Software',
    period: 'Dec 2024 — Present',
    tech: '.NET Core · .NET 8 · Angular · Azure OpenAI · Azure Document Intelligence · GitHub Copilot · LangChain · RAG · OCR (ABBYY) · SQLServer · MongoDB · Redis · RabbitMQ · Elasticsearch',
    bullets: [
      'Built and deployed custom GitHub Copilot agents in VS Code: code generation for .NET & ReactJS (−15–25% implementation effort), automated code review & refactoring (−20–30% review time, −40% review-related bugs), and unit test (xUnit) generation (−40% UT creation effort).',
      'Leveraged Azure OpenAI and Azure Document Intelligence to enhance the core data capture engine, increasing accuracy to 99% on production documents.',
      'Architected a RAG-powered AI Chatbot from a knowledge base of user manuals, architectural docs, FAQs, and resolved issues — significantly reducing customer support tickets.',
      'Led the AI feature sub-team across a 60-member organisation: requirements analysis, technical solutions, code reviews, and bi-weekly reporting to Japanese stakeholders.',
    ],
  },
  {
    role: 'Sub Leader',
    company: 'FPT Software',
    period: 'Jan 2026 — Apr 2026',
    tech: '.NET Framework · VB.NET · SQL Server',
    bullets: [
      'Concurrent assignment within a 112-member project delivering a Carton Production Management System for a Japanese manufacturing client.',
      'Delivered feature development and code reviews aligned to detailed design specifications on a legacy .NET Framework / VB.NET stack.',
    ],
  },
  {
    role: 'Sub Project Lead',
    company: 'FPT Software',
    period: 'Jul 2023 — Nov 2024',
    tech: 'Java · SpringBoot · Angular · ReactJS · React Native · GCP · SQLServer · Redis',
    bullets: [
      'Led a 28-engineer cross-functional team delivering real estate contract management and construction monitoring systems for a Japanese property developer.',
      'Compressed contract processing from 7 days to 1 day (7×) via integrated e-signature; eliminated 95% of paper-based approval workflows.',
      'Delivered a real-time construction monitoring module with geo-tagged photo evidence, milestone dashboards, and automated stakeholder notifications.',
      'Introduced shared component libraries that accelerated feature delivery by 30%.',
    ],
  },
  {
    role: 'Sub Project Lead',
    company: 'FPT Software',
    period: 'Apr 2020 — Jul 2023',
    tech: 'ReactJS · React Native · .NET Core · ABP · Azure · AWS · Blockchain · PostgreSQL · MySQL · MongoDB · RabbitMQ · Redis',
    bullets: [
      'Directed a 50-engineer organisation building a blockchain-based loyalty ecosystem connecting 50+ enterprise partners.',
      'Grew digital transaction volume 3× over the legacy system within the first year; maintained 99.9% SLA with under four hours MTTR.',
      'Built consumer web and mobile apps, merchant portal, and back-office suite on a shared design system — cutting UI development time by 40%.',
    ],
  },
  {
    role: 'Core Member',
    company: 'FPT Software',
    period: 'Feb 2018 — Apr 2020',
    tech: '.NET Core · ABBYY FineReader Engine · Angular · SQLServer · MongoDB · Elasticsearch · Redis · RabbitMQ · Hangfire · Azure',
    bullets: [
      'Engineered a fully automated OCR ingestion pipeline processing tens of thousands of pages per day with multi-format support.',
      'Improved recognition throughput by 40% and reduced character error rates below 2% via parallel processing and post-processing algorithms.',
      'Built Angular-based operator interfaces with batch-editing and QC dashboards, reducing manual review time per document by 35%.',
    ],
  },
  {
    role: 'Project Manager',
    company: 'FPT Software',
    period: 'Feb 2019 — Apr 2019',
    tech: 'C · C++ · QT Creator · macOS · Windows',
    bullets: [
      'Managed upgrade of a legacy virtual printer driver to modern macOS and Windows APIs for a Japanese hardware client (5-member team).',
      'Resolved a critical macOS device testing blocker enabling on-time delivery; achieved a perfect 100 CSS (Customer Satisfaction Score).',
    ],
  },
  {
    role: 'Team Lead',
    company: 'FPT Software',
    period: 'Nov 2015 — Dec 2017',
    tech: '.NET · C# · WPF · WCF · SQL Server · C++ · Git · SVN',
    bullets: [
      'Led a 40-engineer team delivering a DICOM-compliant CT/MRI imaging platform for the Japanese healthcare market.',
      'Implemented volume rendering algorithms that doubled CT scan resolution, meaningfully improving diagnostic clarity for radiologists.',
      'Delivered a PACS integration layer reducing image retrieval from minutes to seconds; zero critical defects in clinical validation.',
    ],
  },
]

const SKILLS = [
  { cat: 'AI & LLM', items: ['Azure OpenAI (Expert)', 'GitHub Copilot Agent Dev (Expert)', 'Azure Document Intelligence (Expert)', 'LangChain / RAG (Advanced)', 'ABBYY Fine Reader (Advanced)'] },
  { cat: 'Backend', items: ['.NET Core / .NET 8 (Expert)', 'C# (Expert)', 'Entity Framework (Advanced)', 'Node.js (Advanced)', 'Spring Boot (Intermediate)'] },
  { cat: 'Frontend', items: ['Angular (Advanced)', 'ReactJS (Advanced)', 'TypeScript (Expert)', 'HTML / CSS (Expert)'] },
  { cat: 'Mobile', items: ['React Native (Advanced)'] },
  { cat: 'Cloud & DevOps', items: ['Azure (Advanced)', 'AWS (Intermediate)', 'GCP (Intermediate)', 'Docker (Advanced)'] },
  { cat: 'Database', items: ['MSSQL (Advanced)', 'MySQL (Advanced)', 'MongoDB (Advanced)', 'Elasticsearch (Advanced)', 'Redis (Advanced)'] },
  { cat: 'Tools', items: ['RabbitMQ (Advanced)', 'Azure Service Bus (Advanced)', 'Hangfire (Advanced)', 'Datadog / Sentry (Intermediate)'] },
]

const LANGUAGES = [
  { lang: 'Vietnamese', level: 'Native / Bilingual' },
  { lang: 'English', level: 'B1 — Working proficiency' },
  { lang: 'Japanese', level: 'N4 — Elementary' },
]

export default function CVPage() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('print') === '1') {
      /* c8 ignore next 1 */
      setTimeout(window.print.bind(window), 600)
    }
  }, [])

  return (
    <>
      {/* Screen-only controls */}
      <div className="print:hidden sticky top-0 z-50 flex items-center justify-between gap-3 border-b border-border bg-background/95 backdrop-blur-sm px-4 py-2.5">
        <a
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Portfolio
        </a>
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
        >
          <Printer className="h-4 w-4" />
          Save as PDF
        </button>
      </div>

      {/* CV Document */}
      <div className="cv-page mx-auto max-w-[900px] bg-white text-gray-900 print:max-w-none print:shadow-none shadow-xl my-6 print:my-0">

        {/* ── HEADER ── */}
        <header className="flex gap-6 items-start p-8 pb-6 border-b-2 border-gray-100">
          <img
            src="/avatar.jpeg"
            alt="Võ Hoàng Ân"
            className="h-24 w-24 rounded-xl object-cover object-top border border-gray-200 shrink-0"
            onError={/* c8 ignore next */ (e) => { e.currentTarget.style.display = 'none' }}
          />
          <div className="flex-1">
            <h1 className="text-3xl font-extrabold text-gray-900 leading-tight">Võ Hoàng Ân</h1>
            <p className="text-base font-semibold text-blue-600 mt-0.5">
              .NET Developer &amp; Technical Lead · FPT Software
            </p>

            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-gray-600">
              <span>📧 <a href={`mailto:${CONTACT.email}`} className="hover:text-blue-600">{CONTACT.email}</a></span>
              <span>📍 {CONTACT.location}</span>
              <span>🔗 <a href={CONTACT.linkedinHref} className="hover:text-blue-600">{CONTACT.linkedin}</a></span>
              <span>🐙 <a href={CONTACT.githubHref} className="hover:text-blue-600">{CONTACT.github}</a></span>
              <span>🎵 <a href={CONTACT.tiktokHref} className="hover:text-blue-600">{CONTACT.tiktok}</a></span>
            </div>

            <div className="mt-2 flex flex-wrap gap-2">
              {['Open to Remote Worldwide', 'On-site · Cần Thơ, VN'].map((tag) => (
                <span key={tag} className="rounded-full bg-blue-50 border border-blue-200 px-2.5 py-0.5 text-[10px] font-semibold text-blue-700">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </header>

        <div className="p-8 pt-6 space-y-7">

          {/* ── SUMMARY ── */}
          <section>
            <h2 className="cv-section-title">Professional Summary</h2>
            <p className="text-sm text-gray-700 leading-relaxed">
              Results-driven Technical Lead and AI Engineer with over <strong>10 years</strong> of professional experience
              at FPT Software. Specializes in leveraging AI and Large Language Models to optimize the SDLC — with
              hands-on expertise building custom <strong>GitHub Copilot agents</strong> that automate code generation,
              automated code reviews, refactoring, and unit test creation. Deep expertise in the{' '}
              <strong>.NET ecosystem</strong> (C#, .NET Core, .NET 8) combined with applied AI engineering:{' '}
              <strong>Azure OpenAI</strong>, Azure Document Intelligence, LangChain, and RAG architectures.
              Has managed teams of up to <strong>60 engineers</strong> across enterprise projects for Japanese clients.
              Multilingual: Vietnamese (Native) · English (B1) · Japanese (N4).
            </p>
          </section>

          {/* ── EXPERIENCE ── */}
          <section>
            <h2 className="cv-section-title">Work Experience</h2>
            <div className="space-y-5">
              {EXPERIENCE.map((exp, i) => (
                <div key={i} className={i < EXPERIENCE.length - 1 ? 'pb-5 border-b border-gray-100' : ''}>
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3 mb-1">
                    <div>
                      <span className="font-bold text-sm text-gray-900">{exp.role}</span>
                      <span className="text-gray-500 text-sm"> · {exp.company}</span>
                    </div>
                    <span className="text-xs text-gray-500 shrink-0">{exp.period}</span>
                  </div>
                  <p className="text-[11px] text-blue-600 font-medium mb-2">{exp.tech}</p>
                  <ul className="space-y-1">
                    {exp.bullets.map((b, j) => (
                      <li key={j} className="flex gap-2 text-xs text-gray-700 leading-relaxed">
                        <span className="text-blue-500 mt-0.5 shrink-0">▸</span>
                        {b}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          {/* ── SKILLS ── */}
          <section>
            <h2 className="cv-section-title">Technical Skills</h2>
            <div className="grid grid-cols-2 gap-x-8 gap-y-2">
              {SKILLS.map(({ cat, items }) => (
                <div key={cat} className="flex gap-2 text-xs">
                  <span className="font-semibold text-gray-700 shrink-0 w-28">{cat}:</span>
                  <span className="text-gray-600">{items.join(' · ')}</span>
                </div>
              ))}
            </div>
          </section>

          {/* ── LANGUAGES + EDUCATION + CERTS ── */}
          <div className="grid grid-cols-2 gap-8">
            <section>
              <h2 className="cv-section-title">Languages</h2>
              <div className="space-y-1.5">
                {LANGUAGES.map(({ lang, level }) => (
                  <div key={lang} className="flex items-baseline gap-2 text-xs">
                    <span className="font-semibold text-gray-800 w-24 shrink-0">{lang}:</span>
                    <span className="text-gray-600">{level}</span>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 className="cv-section-title">Education</h2>
              <div className="text-xs text-gray-700 space-y-0.5">
                <p className="font-semibold">B.Eng. in Software Engineering</p>
                <p className="text-gray-500">Can Tho University · Graduated with Distinction (Excellent)</p>
              </div>
            </section>
          </div>

          <section>
            <h2 className="cv-section-title">Certifications &amp; Training</h2>
            <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-xs text-gray-600">
              <span>▸ Oracle Cloud Infrastructure 2023 Certified Foundations Associate (Sep 2023)</span>
              <span>▸ Oracle Cloud Infrastructure 2023 AI Certified Foundations Associate (Sep 2023)</span>
              <span>▸ Oracle Cloud Data Management 2023 Certified Foundations Associate (Sep 2023)</span>
              <span>▸ Full Stack JavaScript Developer (Feb 2024)</span>
              <span>▸ Backend Development with Node.js (Feb 2024)</span>
              <span>▸ Intermediate JavaScript (Feb 2024)</span>
              <span>▸ OutSystems Associate Web Developer (Jun 2020)</span>
              <span>▸ Predix Certified Developer (Feb 2018)</span>
            </div>
          </section>
        </div>
      </div>

      <style>{`
        @media print {
          @page { size: A4; margin: 12mm 14mm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .cv-page { box-shadow: none !important; margin: 0 !important; max-width: 100% !important; }
        }
        .cv-section-title {
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #1d4ed8;
          border-bottom: 1.5px solid #dbeafe;
          padding-bottom: 4px;
          margin-bottom: 12px;
        }
      `}</style>
    </>
  )
}
