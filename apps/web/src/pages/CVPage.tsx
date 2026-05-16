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
    role: 'Sub Project Lead',
    company: 'FPT Software',
    period: 'Dec 2024 — Present',
    tech: '.NET Core · Angular · Azure · LLM · OCR · AI · ABBYY',
    bullets: [
      'Leading a 30-engineer team delivering an AI-powered document intelligence platform for Japanese enterprise clients.',
      'Integrated Azure Cognitive Services and large language models to automate document classification, extraction, and validation — reducing manual data entry by 80%.',
      'Achieved 98% OCR accuracy on production data through custom preprocessing pipelines and model fine-tuning.',
      'Facilitated requirements alignment between the Vietnamese engineering team and Japanese stakeholders.',
    ],
  },
  {
    role: 'Sub Project Lead',
    company: 'FPT Software',
    period: 'Jul 2023 — Nov 2024',
    tech: 'SpringBoot · ReactJS · React Native · GCP · PostgreSQL',
    bullets: [
      'Led a 28-engineer cross-functional team across web (ReactJS) and mobile (React Native) platforms for a Japanese real estate client.',
      'Shortened contract processing cycles from 7 days to 1 day by implementing integrated digital signature workflows.',
      'Eliminated 95% of paper-based processes through a comprehensive digitisation and compliance-reporting system.',
      'Delivered a construction progress monitoring module with real-time dashboards and photo evidence tracking.',
    ],
  },
  {
    role: 'Sub Project Lead',
    company: 'FPT Software',
    period: 'Apr 2020 — Jul 2023',
    tech: 'ReactJS · React Native · .NET Core · Azure · AWS · Blockchain',
    bullets: [
      'Managed a 50-engineer team architecting a blockchain-based enterprise loyalty ecosystem connecting 50+ partner organisations.',
      'Grew digital transaction volume by 3× over the legacy system through improved UX and near-real-time point settlement.',
      'Designed microservice architecture across Azure and AWS; oversaw CI/CD pipelines and on-call rotation for a production SLA of 99.9%.',
      'Delivered consumer-facing web and mobile apps alongside merchant admin portals and a back-office management suite.',
    ],
  },
  {
    role: 'Core Member',
    company: 'FPT Software',
    period: 'Feb 2018 — Apr 2020',
    tech: '.NET Core · ABBYY · Angular',
    bullets: [
      'Contributed to a 20-engineer team building an OCR document processing system integrated with ABBYY FlexiCapture.',
      'Optimised recognition speed by 40% and reduced error rates to below 2% through image-preprocessing and post-processing algorithms.',
      'Developed Angular-based operator review interfaces for manual quality-control workflows.',
    ],
  },
  {
    role: 'Team Lead',
    company: 'FPT Software',
    period: 'Nov 2015 — Dec 2017',
    tech: '.NET · C# · DICOM · WPF',
    bullets: [
      'Led a 40-engineer team delivering a DICOM-compliant medical imaging platform (CT/MRI) for the Japanese healthcare market.',
      'Doubled CT scan rendering resolution compared to the previous release through GPU-accelerated rendering optimisations.',
      'Served as primary technical liaison with on-site Japanese medical professionals and regulatory reviewers.',
    ],
  },
]

const SKILLS = [
  { cat: 'Backend', items: ['.NET Core (Expert)', 'C# (Expert)', 'SpringBoot (Intermediate)', 'Node.js (Advanced)'] },
  { cat: 'Frontend', items: ['ReactJS (Expert)', 'Angular (Advanced)', 'TypeScript (Expert)', 'HTML/CSS (Expert)'] },
  { cat: 'Mobile', items: ['React Native (Expert)'] },
  { cat: 'Cloud & DevOps', items: ['Azure (Advanced)', 'AWS (Intermediate)', 'GCP (Intermediate)', 'Docker (Advanced)', 'CI/CD (Advanced)'] },
  { cat: 'Database', items: ['MSSQL (Advanced)', 'PostgreSQL (Advanced)', 'MongoDB (Advanced)', 'MySQL (Advanced)', 'Redis (Advanced)'] },
  { cat: 'Tools', items: ['RabbitMQ (Advanced)', 'Elasticsearch (Intermediate)', 'Hangfire (Advanced)', 'Blockchain (Intermediate)'] },
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
              Full-Stack Developer &amp; Sub Project Lead · FPT Software
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
              Seasoned Full-Stack Software Engineer and Tech Lead with over <strong>10 years</strong> of professional experience
              delivering enterprise-grade web and mobile applications at FPT Software. Proven track record of leading
              cross-functional teams of <strong>20–50 engineers</strong> across complex, high-stakes engagements for
              Japanese enterprise clients. Deep expertise in <strong>.NET/C#</strong>, <strong>ReactJS</strong>,{' '}
              <strong>React Native</strong>, and cloud platforms (Azure, AWS, GCP). Experienced in AI/OCR integration,
              blockchain architecture, real estate tech, and medical imaging systems. Multilingual communicator
              (Vietnamese · English B1 · Japanese N4) with strong cross-cultural collaboration skills. Open to fully
              remote opportunities or on-site roles in Cần Thơ, Vietnam.
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
              <span>▸ Microsoft Azure Developer Associate</span>
              <span>▸ Microsoft Azure Fundamentals (AZ-900)</span>
              <span>▸ AWS Cloud Practitioner</span>
              <span>▸ Professional Scrum Master (PSM I)</span>
              <span>▸ JLPT N4 — Japanese Language Proficiency</span>
              <span>▸ FPT Software Internal Leadership Program</span>
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
