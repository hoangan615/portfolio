import { cn } from '@/lib/utils'
import { useIntersection } from '@/shared/hooks/useIntersection'

interface ImpactMetric {
  value: string
  label: string
}

interface ProjectData {
  id: string
  emoji: string
  domain: string
  tagline: string
  description: string
  impacts: ImpactMetric[]
  technologies: string[]
  gradient: string
}

const PROJECTS: ProjectData[] = [
  {
    id: '1',
    emoji: '🤖',
    domain: 'AI / Document Intelligence',
    tagline: 'Enterprise AI Document Intelligence Platform',
    description:
      'Built an AI-powered document intelligence platform using Azure OpenAI and Azure Document Intelligence, achieving 99% data capture accuracy. Engineered custom GitHub Copilot agents that reduced implementation effort by 15–25% and code review time by 20–30% across the 60-member team.',
    impacts: [
      { value: '99%', label: 'Data accuracy' },
      { value: '−40%', label: 'Dev effort' },
      { value: '60', label: 'Team members' },
    ],
    technologies: ['.NET Core', 'Azure OpenAI', 'GitHub Copilot', 'LangChain', 'Angular', 'OCR'],
    gradient: 'from-rose-500/20 via-orange-500/10 to-amber-500/5',
  },
  {
    id: '2',
    emoji: '⛓️',
    domain: 'Blockchain / Fintech',
    tagline: 'Enterprise Blockchain Loyalty Ecosystem',
    description:
      'Architected and delivered a blockchain-based enterprise loyalty ecosystem connecting business partners — growing reward transaction volume 3× over the legacy system while serving web and mobile apps for both consumers and administrators.',
    impacts: [
      { value: '3×', label: 'Transaction volume' },
      { value: '50+', label: 'Enterprise partners' },
      { value: '50', label: 'Team members' },
    ],
    technologies: ['ReactJS', 'React Native', '.NET Core', 'Azure', 'AWS', 'Blockchain'],
    gradient: 'from-amber-500/20 via-yellow-500/10 to-lime-500/5',
  },
  {
    id: '3',
    emoji: '🏢',
    domain: 'Real Estate / PropTech',
    tagline: 'Real Estate Contract & Construction Management',
    description:
      'Built a comprehensive real estate contract management system, shortening contract processing from 7 days to 1 day via integrated digital signatures and eliminating 95% of paper-based workflows.',
    impacts: [
      { value: '7×', label: 'Faster contracts' },
      { value: '−95%', label: 'Paper processes' },
      { value: '28', label: 'Team members' },
    ],
    technologies: ['SpringBoot', 'ReactJS', 'React Native', 'GCP', 'PostgreSQL'],
    gradient: 'from-emerald-500/20 via-teal-500/10 to-cyan-500/5',
  },
]

const techColors: Record<string, string> = {
  '.NET Core': 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800',
  ReactJS: 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800',
  'React Native': 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800',
  Angular: 'bg-red-500/10 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800',
  Azure: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800',
  AWS: 'bg-orange-500/10 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800',
  GCP: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800',
  SpringBoot: 'bg-green-500/10 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800',
  Blockchain: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800',
  'Azure OpenAI': 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800',
  'GitHub Copilot': 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800',
  LangChain: 'bg-green-500/10 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800',
  AI: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800',
  LLM: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800',
  OCR: 'bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800',
  ABBYY: 'bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800',
  PostgreSQL: 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800',
}

function ProjectCard({ project, delay }: { project: ProjectData; delay: number }) {
  const { ref, isVisible } = useIntersection()

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={cn(
        'reveal group relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm',
        'hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300',
        isVisible && 'visible'
      )}
    >
      {/* Gradient header */}
      <div className={cn('relative h-36 bg-gradient-to-br', project.gradient, 'overflow-hidden')}>
        {/* Decorative circles */}
        <div className="absolute -top-6 -right-6 h-32 w-32 rounded-full bg-white/5 dark:bg-white/3" />
        <div className="absolute -bottom-8 -left-4 h-24 w-24 rounded-full bg-white/5 dark:bg-white/3" />
        {/* Emoji + domain */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
          <span className="text-5xl drop-shadow-sm">{project.emoji}</span>
          <span className="rounded-full bg-background/60 backdrop-blur-sm px-3 py-1 text-xs font-semibold text-foreground border border-border/50">
            {project.domain}
          </span>
        </div>
      </div>

      {/* Impact metrics */}
      <div className="grid grid-cols-3 divide-x divide-border border-b border-border">
        {project.impacts.map(({ value, label }) => (
          <div key={label} className="flex flex-col items-center py-3 px-2 bg-muted/30">
            <span className="text-lg font-extrabold bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent leading-none">
              {value}
            </span>
            <span className="text-[10px] text-muted-foreground mt-0.5 text-center leading-tight">
              {label}
            </span>
          </div>
        ))}
      </div>

      {/* Body */}
      <div className="p-5">
        <h3 className="text-sm font-semibold text-foreground mb-2">{project.tagline}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed mb-4">
          {project.description}
        </p>

        {/* Technologies */}
        <div className="flex flex-wrap gap-1.5">
          {project.technologies.map((tech) => (
            <span
              key={tech}
              className={cn(
                'rounded-full px-2.5 py-0.5 text-xs font-medium',
                /* c8 ignore next */
                techColors[tech] ?? 'bg-muted text-muted-foreground border border-border'
              )}
            >
              {tech}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function Projects() {
  const { ref: headerRef, isVisible: headerVisible } = useIntersection()

  return (
    <section id="projects" className="py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div
          ref={headerRef}
          className={cn('mb-14 text-center reveal', headerVisible && 'visible')}
        >
          <p className="mb-2 text-sm font-medium uppercase tracking-widest text-primary">
            Work
          </p>
          <h2 className="text-3xl font-bold sm:text-4xl">Featured Projects</h2>
          <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
            20+ sub-projects delivered across 5 major enterprise engagements at FPT Software — here are the flagship platforms.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {PROJECTS.map((project, i) => (
            <ProjectCard key={project.id} project={project} delay={i * 100} />
          ))}
        </div>
      </div>
    </section>
  )
}
