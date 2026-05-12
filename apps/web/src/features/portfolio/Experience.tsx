import { useQuery } from '@tanstack/react-query'
import { Briefcase, Calendar, Users, ChevronRight } from 'lucide-react'
import { cn, formatDate } from '@/lib/utils'
import { portfolioApi, type Experience as ExperienceType } from '@/shared/api/portfolio'
import LoadingSpinner from '@/shared/components/LoadingSpinner'

const DEFAULT_EXPERIENCES: ExperienceType[] = [
  {
    id: '1',
    company: 'FPT Software',
    role: 'Sub Project Lead',
    startDate: '2024-12-01',
    endDate: null,
    isCurrent: true,
    description: 'Leading the CPE2024 AI Document Intelligence platform.',
    highlights: [
      'Sub Project Lead for AI Document Intelligence platform',
      'Team of 30 members',
      'Technologies: AI, OCR, .NET Core, Angular, Azure, LLM',
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
    description: 'Led Real Estate Contract Management + Construction Monitoring system (KIZUNA23/24).',
    highlights: [
      'Real Estate Contract Management & Construction Monitoring',
      'Sub Project Lead, team of 28 members',
      'Technologies: SpringBoot, ReactJS, React Native, GCP',
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
    description: 'Led Blockchain Loyalty System for enterprises (FCTAKC).',
    highlights: [
      'Blockchain-based Loyalty Platform for enterprise clients',
      'Sub Project Lead, team of 50 members',
      'Technologies: ReactJS, React Native, .NET Core, Azure, AWS',
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
    description: 'OCR System with ABBYY integration (CPE Phase 2/3).',
    highlights: [
      'OCR document processing system with ABBYY',
      'Core Member, team of 20 members',
      'Technologies: .NET Core, ABBYY, Angular',
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
    description: 'DICOM Medical Imaging System (CT_CAD).',
    highlights: [
      'DICOM standard medical imaging system',
      'Team Lead, team of 40 members',
      'Technologies: .NET, C#, DICOM',
    ],
    technologies: ['.NET', 'C#', 'DICOM', 'Medical Imaging'],
  },
]

function ExperienceCard({
  experience,
  isLast,
}: {
  experience: ExperienceType
  isLast: boolean
}) {
  const startFormatted = formatDate(experience.startDate, 'MMM yyyy')
  const endFormatted = experience.isCurrent
    ? 'Present'
    : experience.endDate
    ? formatDate(experience.endDate, 'MMM yyyy')
    : ''

  return (
    <div className="relative flex gap-4 pb-8">
      {/* Timeline connector */}
      {!isLast && (
        <div className="absolute left-5 top-10 bottom-0 w-0.5 bg-border" />
      )}

      {/* Timeline dot */}
      <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-border bg-card shadow-sm">
        <Briefcase
          className={cn(
            'h-4 w-4',
            experience.isCurrent ? 'text-primary' : 'text-muted-foreground'
          )}
        />
      </div>

      {/* Content */}
      <div className="flex-1 rounded-xl border border-border bg-card p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
          <div>
            <h3 className="text-base font-semibold">{experience.role}</h3>
            <p className="text-sm text-muted-foreground font-medium">{experience.company}</p>
          </div>

          <div className="flex flex-col items-end gap-1">
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              {startFormatted} — {endFormatted}
            </span>
            {experience.isCurrent && (
              <span className="rounded-full bg-green-500/15 px-2 py-0.5 text-xs font-medium text-green-600 dark:text-green-400">
                Current
              </span>
            )}
          </div>
        </div>

        <p className="text-sm text-muted-foreground mb-3">{experience.description}</p>

        {experience.highlights.length > 0 && (
          <ul className="space-y-1.5 mb-3">
            {experience.highlights.map((h, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <ChevronRight className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                {h}
              </li>
            ))}
          </ul>
        )}

        {experience.technologies.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {experience.technologies.map((tech) => (
              <span
                key={tech}
                className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground"
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

  const displayExperiences = experiences ?? DEFAULT_EXPERIENCES

  return (
    <section id="experience" className="py-20 bg-muted/30">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="mb-12 text-center">
          <p className="mb-2 text-sm font-medium uppercase tracking-widest text-primary">
            Career
          </p>
          <h2 className="text-3xl font-bold sm:text-4xl">Work Experience</h2>
          <p className="mt-3 text-muted-foreground">
            9+ years at FPT Software, growing from developer to Sub Project Lead.
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
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
