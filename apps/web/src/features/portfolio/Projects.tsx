import { useQuery } from '@tanstack/react-query'
import { ExternalLink, Github, Layers } from 'lucide-react'
import { cn } from '@/lib/utils'
import { portfolioApi, type Project } from '@/shared/api/portfolio'
import LoadingSpinner from '@/shared/components/LoadingSpinner'

const DEFAULT_PROJECTS: Project[] = [
  {
    id: '1',
    title: 'CPE2024 – AI Document Intelligence',
    description:
      'Enterprise-grade AI-powered document processing platform with OCR, LLM integration, and automated workflows.',
    longDescription:
      'Led as Sub Project Lead for a 30-member team. Integrated Azure Cognitive Services and large language models to automate document classification, extraction, and validation for enterprise clients.',
    thumbnailUrl: null,
    demoUrl: null,
    repoUrl: null,
    technologies: ['.NET Core', 'Angular', 'Azure', 'LLM', 'OCR', 'AI', 'ABBYY'],
    tags: ['AI', 'Enterprise', 'OCR'],
    featured: true,
    order: 1,
  },
  {
    id: '2',
    title: 'FCTAKC – Blockchain Loyalty Platform',
    description:
      'Blockchain-based enterprise loyalty system connecting businesses and customers with transparent point management.',
    longDescription:
      'Sub Project Lead for 50+ member team. Built on blockchain infrastructure for transparent point issuance, redemption, and transfer across enterprise partners. Web and mobile apps for consumers and admin portals.',
    thumbnailUrl: null,
    demoUrl: null,
    repoUrl: null,
    technologies: ['ReactJS', 'React Native', '.NET Core', 'Azure', 'AWS', 'Blockchain'],
    tags: ['Blockchain', 'Mobile', 'Enterprise'],
    featured: true,
    order: 2,
  },
  {
    id: '3',
    title: 'KIZUNA – Real Estate Management',
    description:
      'Real estate contract management and construction monitoring platform for property developers and contractors.',
    longDescription:
      'Sub Project Lead for 28-member team. Comprehensive platform for managing real estate contracts, tracking construction progress, digital signatures, and compliance reporting.',
    thumbnailUrl: null,
    demoUrl: null,
    repoUrl: null,
    technologies: ['SpringBoot', 'ReactJS', 'React Native', 'GCP', 'PostgreSQL'],
    tags: ['Real Estate', 'Mobile', 'GCP'],
    featured: true,
    order: 3,
  },
]

const techColors: Record<string, string> = {
  '.NET Core': 'bg-purple-500/10 text-purple-700 dark:text-purple-300',
  'C#': 'bg-purple-500/10 text-purple-700 dark:text-purple-300',
  ReactJS: 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-300',
  'React Native': 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-300',
  Angular: 'bg-red-500/10 text-red-700 dark:text-red-300',
  Azure: 'bg-blue-500/10 text-blue-700 dark:text-blue-300',
  AWS: 'bg-orange-500/10 text-orange-700 dark:text-orange-300',
  GCP: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-300',
  SpringBoot: 'bg-green-500/10 text-green-700 dark:text-green-300',
  TypeScript: 'bg-blue-500/10 text-blue-700 dark:text-blue-300',
  Blockchain: 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
  AI: 'bg-rose-500/10 text-rose-700 dark:text-rose-300',
  LLM: 'bg-rose-500/10 text-rose-700 dark:text-rose-300',
  OCR: 'bg-teal-500/10 text-teal-700 dark:text-teal-300',
}

function ProjectCard({ project }: { project: Project }) {
  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-xl border border-border bg-card shadow-sm',
        'transition-all duration-300 hover:shadow-lg hover:-translate-y-1',
        project.featured && 'ring-2 ring-primary/20'
      )}
    >
      {/* Thumbnail / placeholder */}
      <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-primary/10 via-blue-500/5 to-purple-500/10">
        {project.thumbnailUrl ? (
          <img
            src={project.thumbnailUrl}
            alt={project.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Layers className="h-16 w-16 text-primary/30" />
          </div>
        )}
        {project.featured && (
          <div className="absolute top-3 right-3 rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-primary-foreground">
            Featured
          </div>
        )}
      </div>

      <div className="p-5">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="text-base font-semibold leading-snug">{project.title}</h3>
          <div className="flex items-center gap-1.5 shrink-0">
            {project.repoUrl && (
              <a
                href={project.repoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                aria-label="View repository"
              >
                <Github className="h-4 w-4" />
              </a>
            )}
            {project.demoUrl && (
              <a
                href={project.demoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                aria-label="View demo"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            )}
          </div>
        </div>

        <p className="text-sm text-muted-foreground leading-relaxed mb-4">
          {project.description}
        </p>

        {/* Tags */}
        {project.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {project.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Technologies */}
        <div className="flex flex-wrap gap-1.5">
          {project.technologies.slice(0, 6).map((tech) => (
            <span
              key={tech}
              className={cn(
                'rounded-md px-2 py-0.5 text-xs font-medium',
                techColors[tech] ?? 'bg-muted text-muted-foreground'
              )}
            >
              {tech}
            </span>
          ))}
          {project.technologies.length > 6 && (
            <span className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              +{project.technologies.length - 6}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

export default function Projects() {
  const { data: projects, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: portfolioApi.getProjects,
    staleTime: 5 * 60 * 1000,
    retry: false,
  })

  const displayProjects = projects ?? DEFAULT_PROJECTS

  return (
    <section id="projects" className="py-20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="mb-12 text-center">
          <p className="mb-2 text-sm font-medium uppercase tracking-widest text-primary">
            Work
          </p>
          <h2 className="text-3xl font-bold sm:text-4xl">Featured Projects</h2>
          <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
            Enterprise projects I've led and contributed to over my career at FPT Software.
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {displayProjects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
