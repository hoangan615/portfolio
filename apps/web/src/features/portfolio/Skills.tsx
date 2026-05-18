import { useQuery } from '@tanstack/react-query'
import { cn } from '@/lib/utils'
import { portfolioApi } from '@/shared/api/portfolio'
import LoadingSpinner from '@/shared/components/LoadingSpinner'
import { useIntersection } from '@/shared/hooks/useIntersection'

const DEFAULT_SKILLS = [
  // AI & LLM — primary differentiator
  { id: '1', name: 'Azure OpenAI', category: 'AI & LLM', level: 95 },
  { id: '2', name: 'GitHub Copilot Agent Dev', category: 'AI & LLM', level: 93 },
  { id: '3', name: 'Azure Document Intelligence', category: 'AI & LLM', level: 90 },
  { id: '4', name: 'LangChain / RAG', category: 'AI & LLM', level: 85 },
  { id: '5', name: 'Embeddings / Vector DB', category: 'AI & LLM', level: 82 },
  { id: '6', name: 'ABBYY Fine Reader', category: 'AI & LLM', level: 85 },
  // Backend
  { id: '7', name: 'C#', category: 'Backend', level: 95 },
  { id: '8', name: '.NET Core / .NET 8', category: 'Backend', level: 95 },
  { id: '9', name: 'Entity Framework', category: 'Backend', level: 88 },
  { id: '10', name: 'Node.js', category: 'Backend', level: 75 },
  { id: '11', name: 'SignalR / Azure Service Bus', category: 'Backend', level: 80 },
  // Frontend
  { id: '12', name: 'Angular', category: 'Frontend', level: 85 },
  { id: '13', name: 'ReactJS', category: 'Frontend', level: 85 },
  { id: '14', name: 'React Native', category: 'Frontend', level: 83 },
  { id: '15', name: 'TypeScript', category: 'Frontend', level: 87 },
  { id: '16', name: 'HTML / CSS', category: 'Frontend', level: 88 },
  // Database
  { id: '17', name: 'MSSQL', category: 'Database', level: 90 },
  { id: '18', name: 'MySQL', category: 'Database', level: 82 },
  { id: '19', name: 'MongoDB', category: 'Database', level: 80 },
  { id: '20', name: 'Elasticsearch', category: 'Database', level: 78 },
  // Cloud & DevOps
  { id: '21', name: 'Azure', category: 'Cloud & DevOps', level: 88 },
  { id: '22', name: 'AWS', category: 'Cloud & DevOps', level: 72 },
  { id: '23', name: 'GCP', category: 'Cloud & DevOps', level: 68 },
  { id: '24', name: 'Docker', category: 'Cloud & DevOps', level: 80 },
  // Tools
  { id: '25', name: 'Redis', category: 'Tools', level: 85 },
  { id: '26', name: 'RabbitMQ', category: 'Tools', level: 80 },
  { id: '27', name: 'Hangfire', category: 'Tools', level: 82 },
  { id: '28', name: 'Datadog / Sentry', category: 'Tools', level: 72 },
]

const categoryConfig: Record<string, { pill: string; bar: string; icon: string }> = {
  Frontend: {
    pill: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800',
    bar: 'bg-gradient-to-r from-blue-500 to-cyan-400',
    icon: '🎨',
  },
  Backend: {
    pill: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800',
    bar: 'bg-gradient-to-r from-green-500 to-emerald-400',
    icon: '⚙️',
  },
  Database: {
    pill: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800',
    bar: 'bg-gradient-to-r from-orange-500 to-amber-400',
    icon: '🗄️',
  },
  'Cloud & DevOps': {
    pill: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800',
    bar: 'bg-gradient-to-r from-purple-500 to-violet-400',
    icon: '☁️',
  },
  Tools: {
    pill: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800',
    bar: 'bg-gradient-to-r from-rose-500 to-pink-400',
    icon: '🛠️',
  },
  'AI & LLM': {
    pill: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800',
    bar: 'bg-gradient-to-r from-amber-500 to-orange-400',
    icon: '🤖',
  },
}

function getLevelLabel(level: number): string {
  if (level >= 90) return 'Expert'
  if (level >= 75) return 'Advanced'
  /* c8 ignore next 3 */
  if (level >= 55) return 'Intermediate'
  return 'Beginner'
}

function SkillCard({
  category,
  skills,
}: {
  category: string
  skills: typeof DEFAULT_SKILLS
}) {
  const { ref, isVisible } = useIntersection()
  /* c8 ignore next */
  const cfg = categoryConfig[category] ?? { pill: 'bg-muted text-muted-foreground border-border', bar: 'bg-primary', icon: '•' }

  return (
    <div
      ref={ref}
      className={cn(
        'reveal rounded-2xl border border-border bg-card p-5 shadow-sm hover:shadow-md transition-shadow',
        isVisible && 'visible'
      )}
    >
      <div className="mb-5 flex items-center gap-2.5">
        <span className="text-xl">{cfg.icon}</span>
        <span className={cn('rounded-full border px-2.5 py-0.5 text-xs font-semibold', cfg.pill)}>
          {category}
        </span>
        <span className="text-xs text-muted-foreground ml-auto">{skills.length} skills</span>
      </div>

      <div className="space-y-4">
        {skills.map((skill, i) => (
          <div key={skill.id}>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-sm font-medium">{skill.name}</span>
              <span className="text-xs text-muted-foreground">
                {getLevelLabel(skill.level)} · {skill.level}%
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={cn('h-full rounded-full', cfg.bar)}
                style={{
                  width: isVisible ? `${skill.level}%` : '0%',
                  transition: `width 0.8s cubic-bezier(0.22, 1, 0.36, 1) ${i * 60}ms`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Skills() {
  const { data: skills, isLoading } = useQuery({
    queryKey: ['skills'],
    queryFn: portfolioApi.getSkills,
    staleTime: 5 * 60 * 1000,
    retry: false,
  })

  const { ref: headerRef, isVisible: headerVisible } = useIntersection()

  const displaySkills = skills ?? DEFAULT_SKILLS
  const categories = Array.from(new Set(displaySkills.map((s) => s.category)))

  return (
    <section id="skills" className="py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div
          ref={headerRef}
          className={cn('mb-14 text-center reveal', headerVisible && 'visible')}
        >
          <p className="mb-2 text-sm font-medium uppercase tracking-widest text-primary">
            Skills
          </p>
          <h2 className="text-3xl font-bold sm:text-4xl">Technical Skills</h2>
          <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
            Technologies I've worked with across 10+ years in enterprise software development.
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {categories.map((category) => (
              <SkillCard
                key={category}
                category={category}
                skills={displaySkills.filter((s) => s.category === category)}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
