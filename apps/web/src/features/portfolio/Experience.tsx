import { useQuery } from '@tanstack/react-query'
import { Briefcase, Calendar, ChevronRight } from 'lucide-react'
import { cn, formatDate } from '@/lib/utils'
import { portfolioApi, type Experience as ExperienceType } from '@/shared/api/portfolio'
import LoadingSpinner from '@/shared/components/LoadingSpinner'
import { useIntersection } from '@/shared/hooks/useIntersection'

const TECH_COLORS: Record<string, string> = {
  '.NET Core': 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800',
  '.NET': 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800',
  'C#': 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800',
  'Angular': 'bg-red-500/10 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800',
  'Azure': 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800',
  'Azure OpenAI': 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800',
  'AWS': 'bg-orange-500/10 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800',
  'GCP': 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800',
  'GitHub Copilot': 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800',
  'LangChain': 'bg-green-500/10 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800',
  'LLM': 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800',
  'OCR': 'bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800',
  'AI': 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800',
  'ABBYY': 'bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800',
  'ReactJS': 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800',
  'React Native': 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800',
  'SpringBoot': 'bg-green-500/10 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800',
  'Blockchain': 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800',
  'DICOM': 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800',
  'Medical Imaging': 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800',
  'WPF': 'bg-gray-500/10 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-800',
  'C++': 'bg-gray-500/10 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-800',
}

const DEFAULT_EXPERIENCES: ExperienceType[] = [
  {
    id: '1',
    company: 'FPT Software',
    role: 'Sub Project Lead / AI Engineer',
    startDate: '2024-12-01',
    endDate: null,
    isCurrent: true,
    description: 'Leading AI feature development for an enterprise document intelligence platform (CPE2024/CPE2025) serving a major Japanese financial institution. Spearheaded the initiative to integrate GitHub Copilot agents and Azure OpenAI into both the product and the engineering workflow across a 60-member team.',
    highlights: [
      'Built and deployed custom GitHub Copilot agents in VS Code: a code generation agent for .NET & ReactJS (−15–25% implementation effort), an automated code review & refactoring agent (−20–30% review time, −40% review-related bugs), and a unit test (xUnit) generation agent (−40% UT creation effort)',
      'Leveraged Azure OpenAI (LLM) and Azure Document Intelligence to enhance the core data capture engine, increasing overall data extraction accuracy to 99% on production documents',
      'Architected and built an AI Chatbot powered by a RAG knowledge base — covering user manuals, architectural docs, FAQs, and resolved issues — that significantly reduced inbound customer support tickets',
      'Led the AI feature sub-team: analysed business requirements, provided technical solutions, conducted code reviews, and reported progress to stakeholders across Vietnam and Japan',
    ],
    technologies: ['.NET Core', 'Azure OpenAI', 'GitHub Copilot', 'LangChain', 'Angular', 'OCR', 'Azure'],
  },
  {
    id: '2',
    company: 'FPT Software',
    role: 'Sub Leader',
    startDate: '2026-01-01',
    endDate: '2026-04-30',
    isCurrent: false,
    description: 'Concurrent assignment as Sub Leader on COPATIS26 — a Carton Production Management System for a Japanese manufacturing client (112-member project). Handled feature delivery alongside the main CPE2024/2025 engagement.',
    highlights: [
      'Delivered feature development and modifications aligned to detailed design specifications within a 112-member project organisation',
      'Reviewed code against detailed design documentation, ensuring correctness and adherence to functional requirements',
      'Implemented complex production management features on the legacy .NET Framework / VB.NET stack',
    ],
    technologies: ['.NET', 'C#'],
  },
  {
    id: '3',
    company: 'FPT Software',
    role: 'Sub Project Lead',
    startDate: '2023-07-01',
    endDate: '2024-11-30',
    isCurrent: false,
    description: 'Led full-cycle development of an integrated real estate contract management and construction-progress monitoring platform (KIZUNA) for a leading Japanese property developer. Oversaw planning, architecture, and delivery across web and mobile channels for a 28-member team.',
    highlights: [
      'Redesigned the end-to-end contract lifecycle workflow with integrated e-signature, compressing contract processing time from 7 days to 1 day — a measurable 7× improvement in client operational KPIs',
      'Eliminated 95% of paper-based approval processes by digitising document workflows, automated compliance reporting, and role-based approval chains',
      'Delivered a real-time construction-progress monitoring module with geo-tagged photo evidence, milestone dashboards, and automated stakeholder notifications',
      'Managed 28 engineers across web (ReactJS) and mobile (React Native) squads; introduced shared component libraries that accelerated feature delivery by 30%',
    ],
    technologies: ['SpringBoot', 'ReactJS', 'React Native', 'GCP'],
  },
  {
    id: '4',
    company: 'FPT Software',
    role: 'Sub Project Lead',
    startDate: '2020-04-01',
    endDate: '2023-07-31',
    isCurrent: false,
    description: 'Spearheaded architecture and delivery of a blockchain-based enterprise loyalty ecosystem (FCTAKC), unifying reward programmes across a network of Japanese corporate partners on a distributed ledger. Led a 50-member organisation from pilot to full production scale.',
    highlights: [
      'Designed a microservice architecture on Azure and AWS supporting near-real-time point issuance, redemption, and settlement across 50+ partner organisations — growing transaction volume 3× over the legacy system within the first year',
      'Engineered an on-chain and off-chain data strategy using a private blockchain, ensuring immutable audit trails with sub-second response times for consumer-facing APIs',
      'Built consumer web and mobile apps, a merchant administration portal, and back-office management suite on a shared design system — cutting UI development time by 40%',
      'Directed 50 engineers across web, mobile, and backend squads; implemented OKR-based planning and a 99.9% SLA monitoring stack with under four hours MTTR on production incidents',
    ],
    technologies: ['ReactJS', 'React Native', '.NET Core', 'Azure', 'AWS', 'Blockchain'],
  },
  {
    id: '5',
    company: 'FPT Software',
    role: 'Core Member',
    startDate: '2018-02-01',
    endDate: '2020-04-30',
    isCurrent: false,
    description: 'Contributed as a core engineer on a high-throughput OCR document processing system (CPE Phase 2/3) integrated with ABBYY FineReader Engine, serving enterprise clients requiring large-scale automated document digitisation and quality control.',
    highlights: [
      'Engineered a fully automated OCR ingestion pipeline processing tens of thousands of pages per day with multi-format support (PDF, TIFF, JPEG) and automatic pre-processing — deskewing, noise reduction, contrast normalisation',
      'Optimised the recognition pipeline via parallel processing and post-processing correction algorithms — improving throughput by 40% and reducing character error rates below 2% on production datasets',
      'Developed Angular-based operator interfaces with batch-editing, exception queuing, and QC dashboards that reduced manual review time per document by 35%',
      'Trained new team members and built an automated regression suite covering 500+ document templates to maintain accuracy across ABBYY version upgrades',
    ],
    technologies: ['.NET Core', 'ABBYY', 'Angular'],
  },
  {
    id: '6',
    company: 'FPT Software',
    role: 'Project Manager',
    startDate: '2019-02-01',
    endDate: '2019-04-30',
    isCurrent: false,
    description: 'Managed delivery of a virtual printer driver project (VPD) targeting macOS and Windows — upgrading a legacy codebase to use modern platform APIs for a Japanese hardware client. 5-member team, concurrent with CPE Phase 2/3.',
    highlights: [
      'Led estimation, planning, and progress tracking for a fixed-scope 3-month engagement',
      'Resolved a critical testing blocker related to macOS device provisioning, unblocking the QA phase and enabling on-time delivery',
      'Delivered the project with a perfect 100 CSS (Customer Satisfaction Score) from the client',
    ],
    technologies: ['.NET', 'C++'],
  },
  {
    id: '7',
    company: 'FPT Software',
    role: 'Team Lead / Member',
    startDate: '2015-11-01',
    endDate: '2017-12-31',
    isCurrent: false,
    description: 'Led delivery of a DICOM-compliant medical imaging platform (CT_CAD series) for CT and MRI diagnostics, serving hospitals and radiology centres in the Japanese healthcare market. Responsible for regulatory alignment, team leadership, and direct collaboration with medical professionals.',
    highlights: [
      'Architected a DICOM-standards-compliant image processing and visualisation system (CT, MRI, X-Ray) — met Japan\'s medical device software regulatory requirements with zero critical defects in clinical validation',
      'Implemented volume rendering and multi-planar reconstruction algorithms that doubled CT scan resolution versus the prior release, meaningfully improving diagnostic clarity for radiologists',
      'Led a 40-engineer team across image-processing, viewer, and integration modules; coordinated with on-site Japanese radiologists to translate clinical requirements into precise technical specifications',
      'Delivered a PACS integration layer for seamless exchange with hospital information systems, reducing image retrieval time from minutes to seconds',
    ],
    technologies: ['.NET', 'C#', 'DICOM', 'Medical Imaging'],
  },
]

/* c8 ignore start */
function ExperienceCard({
  experience,
  isLast,
  index,
}: {
  experience: ExperienceType
  isLast: boolean
  index: number
}) {
  const { ref, isVisible } = useIntersection()

  const startFormatted = formatDate(experience.startDate, 'MMM yyyy')
  const endFormatted = experience.isCurrent
    ? 'Present'
    : experience.endDate
    ? formatDate(experience.endDate, 'MMM yyyy')
    : ''

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${index * 80}ms` }}
      className={cn('reveal relative flex gap-4 pb-10', isVisible && 'visible')}
    >
      {/* Timeline line */}
      {!isLast && (
        <div className="absolute left-5 top-11 bottom-0 w-px bg-gradient-to-b from-border to-transparent" />
      )}

      {/* Timeline dot */}
      <div
        className={cn(
          'relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 bg-card shadow-sm',
          experience.isCurrent
            ? 'border-primary bg-primary/10'
            : 'border-border'
        )}
      >
        <Briefcase
          className={cn('h-4 w-4', experience.isCurrent ? 'text-primary' : 'text-muted-foreground')}
        />
        {experience.isCurrent && (
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-60" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-primary" />
          </span>
        )}
      </div>

      {/* Card */}
      <div className="flex-1 rounded-2xl border border-border bg-card p-5 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
          <div>
            <h3 className="text-base font-bold">{experience.role}</h3>
            <p className="text-sm text-primary font-semibold">{experience.company}</p>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              {startFormatted} — {endFormatted}
            </span>
            {experience.isCurrent && (
              <span className="rounded-full bg-green-500/15 px-2.5 py-0.5 text-xs font-semibold text-green-600 dark:text-green-400">
                Present
              </span>
            )}
          </div>
        </div>

        <p className="text-sm text-muted-foreground mb-3">{experience.description}</p>

        {experience.highlights.length > 0 && (
          <ul className="space-y-2 mb-4">
            {experience.highlights.map((h, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <ChevronRight className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <span>{h}</span>
              </li>
            ))}
          </ul>
        )}

        {experience.technologies.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {experience.technologies.map((tech) => (
              <span
                key={tech}
                className={cn(
                  'rounded-full px-2.5 py-0.5 text-xs font-medium',
                  TECH_COLORS[tech] ?? 'bg-muted text-muted-foreground border border-border'
                )}
              >
                {tech}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
/* c8 ignore stop */

export default function Experience() {
  const { data: experiences, isLoading } = useQuery({
    queryKey: ['experiences'],
    queryFn: portfolioApi.getExperiences,
    staleTime: 5 * 60 * 1000,
    retry: false,
  })

  const { ref: headerRef, isVisible: headerVisible } = useIntersection()

  /* c8 ignore next */
  const displayExperiences = experiences ?? DEFAULT_EXPERIENCES

  return (
    <section id="experience" className="py-24 bg-muted/30">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div
          ref={headerRef}
          className={cn('mb-14 text-center reveal', headerVisible && 'visible')}
        >
          <p className="mb-2 text-sm font-medium uppercase tracking-widest text-primary">
            Career
          </p>
          <h2 className="text-3xl font-bold sm:text-4xl">Work Experience</h2>
          <p className="mt-3 text-muted-foreground">
            10+ years at FPT Software — growing from Software Engineer to Technical Lead & AI Engineer.
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <div>
            {displayExperiences.map((exp, i) => (
              <ExperienceCard
                key={exp.id}
                experience={exp}
                isLast={i === displayExperiences.length - 1}
                index={i}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
