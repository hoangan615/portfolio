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
  'AWS': 'bg-orange-500/10 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800',
  'GCP': 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800',
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
}

const DEFAULT_EXPERIENCES: ExperienceType[] = [
  {
    id: '1',
    company: 'FPT Software',
    role: 'Sub Project Lead',
    startDate: '2024-12-01',
    endDate: null,
    isCurrent: true,
    description: 'Leading end-to-end delivery of an enterprise-grade AI document intelligence platform for a major Japanese financial institution. Responsible for technical architecture, cross-team coordination, and stakeholder management across Vietnam and Japan.',
    highlights: [
      'Architected a multi-stage AI pipeline integrating Azure Cognitive Services, large language models, and custom OCR preprocessing to fully automate document classification, data extraction, and compliance validation — eliminating 80% of manual data-entry effort across the client\'s operations',
      'Achieved 98% OCR accuracy on complex, mixed-format production documents by engineering custom image-enhancement algorithms and domain-specific model fine-tuning on client data',
      'Led and mentored a 30-engineer cross-functional team across backend, frontend, QA, and DevOps tracks; established sprint ceremonies, code-review standards, and a CI/CD pipeline that reduced deployment lead time from days to under an hour',
      'Served as the primary technical liaison between the Vietnamese engineering organisation and Japanese enterprise stakeholders, conducting bi-weekly progress reviews and translating complex technical constraints into clear business-level communication',
    ],
    technologies: ['.NET Core', 'Angular', 'Azure', 'LLM', 'OCR', 'AI'],
  },
  {
    id: '2',
    company: 'FPT Software',
    role: 'Sub Project Lead',
    startDate: '2023-07-01',
    endDate: '2024-11-30',
    isCurrent: false,
    description: 'Led full-cycle development of an integrated real estate contract management and construction-progress monitoring platform for a leading Japanese property developer. Oversaw planning, architecture decisions, and delivery across web and mobile channels.',
    highlights: [
      'Redesigned the end-to-end contract lifecycle workflow and integrated a legally compliant e-signature solution, compressing contract processing time from 7 days to a single business day — a 7× improvement directly measurable in client operational KPIs',
      'Eliminated 95% of paper-based approval processes by digitising document workflows, automated compliance reporting, and role-based approval chains, significantly reducing administrative overhead and audit risk for the client',
      'Delivered a real-time construction-progress monitoring module with geo-tagged photo evidence, milestone dashboards, and automated stakeholder notifications, improving project transparency across multiple active construction sites',
      'Managed a 28-engineer team distributed across web (ReactJS) and mobile (React Native) squads; introduced shared component libraries and unified API contracts that reduced duplicate effort and accelerated feature delivery by 30%',
    ],
    technologies: ['SpringBoot', 'ReactJS', 'React Native', 'GCP'],
  },
  {
    id: '3',
    company: 'FPT Software',
    role: 'Sub Project Lead',
    startDate: '2020-04-01',
    endDate: '2023-07-31',
    isCurrent: false,
    description: 'Spearheaded the architecture and delivery of a blockchain-based enterprise loyalty ecosystem, unifying reward programmes across a network of Japanese corporate partners on a single, auditable distributed ledger. Grew the platform from initial pilot to production at scale.',
    highlights: [
      'Designed a microservice architecture on Azure and AWS supporting near-real-time point issuance, redemption, and settlement across 50+ partner organisations — growing digital transaction volume 3× over the legacy system within the first year of go-live',
      'Engineered the on-chain and off-chain data strategy using a private blockchain network, ensuring immutable audit trails for every reward transaction while maintaining sub-second response times for consumer-facing APIs',
      'Built and shipped consumer web and mobile apps, a merchant administration portal, and a back-office management suite — all on a shared design system and reusable component library that cut UI development time by 40%',
      'Directed a 50-engineer organisation spanning web, mobile, and backend micro-services squads; implemented OKR-based planning, on-call rotation, and a 99.9% SLA monitoring stack that kept production incidents under four hours mean time to recovery',
    ],
    technologies: ['ReactJS', 'React Native', '.NET Core', 'Azure', 'AWS', 'Blockchain'],
  },
  {
    id: '4',
    company: 'FPT Software',
    role: 'Core Member',
    startDate: '2018-02-01',
    endDate: '2020-04-30',
    isCurrent: false,
    description: 'Contributed as a core engineer on a high-throughput OCR document processing system integrated with ABBYY FlexiCapture, serving enterprise clients requiring large-scale, automated document digitisation and quality control.',
    highlights: [
      'Engineered a fully automated OCR ingestion pipeline capable of processing tens of thousands of document pages per day, including multi-format support (PDF, TIFF, JPEG) with automatic deskewing, noise reduction, and contrast normalisation pre-processing',
      'Optimised the recognition pipeline through parallel processing, intelligent caching, and post-processing correction algorithms — improving throughput speed by 40% and reducing character error rates to below 2% on production datasets',
      'Developed Angular-based operator review interfaces with batch-editing, exception queuing, and quality-control dashboards that streamlined manual verification workflows and reduced operator review time per document by 35%',
      'Collaborated closely with QA engineers to establish an automated regression suite covering 500+ document templates, ensuring recognition accuracy was maintained across ABBYY FlexiCapture version upgrades',
    ],
    technologies: ['.NET Core', 'ABBYY', 'Angular'],
  },
  {
    id: '5',
    company: 'FPT Software',
    role: 'Team Lead',
    startDate: '2015-11-01',
    endDate: '2017-12-31',
    isCurrent: false,
    description: 'Led delivery of a DICOM-compliant medical imaging platform for CT and MRI diagnostics, serving hospitals and radiology centres in the Japanese healthcare market. Responsible for regulatory alignment, team leadership, and direct collaboration with medical professionals.',
    highlights: [
      'Architected a DICOM-standards-compliant image processing and visualisation system supporting CT, MRI, and X-Ray modalities — meeting Japan\'s stringent medical device software regulatory requirements and passing clinical validation with zero critical defects',
      'Implemented GPU-accelerated volume rendering and multi-planar reconstruction algorithms that doubled CT scan image resolution compared to the previous release, meaningfully improving diagnostic clarity for radiologists',
      'Led a 40-engineer team across image-processing, viewer, and integration modules; coordinated directly with on-site Japanese radiologists and regulatory reviewers to translate clinical requirements into precise technical specifications',
      'Delivered a PACS (Picture Archiving and Communication System) integration layer enabling seamless exchange of imaging data with hospital information systems, reducing image retrieval time from minutes to seconds',
    ],
    technologies: ['.NET', 'C#', 'DICOM', 'Medical Imaging'],
  },
]

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

export default function Experience() {
  const { data: experiences, isLoading } = useQuery({
    queryKey: ['experiences'],
    queryFn: portfolioApi.getExperiences,
    staleTime: 5 * 60 * 1000,
    retry: false,
  })

  const { ref: headerRef, isVisible: headerVisible } = useIntersection()

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
            10+ years at FPT Software — from Software Engineer to Sub Project Lead.
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
