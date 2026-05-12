import { useQuery } from '@tanstack/react-query'
import { cn } from '@/lib/utils'
import { portfolioApi } from '@/shared/api/portfolio'
import LoadingSpinner from '@/shared/components/LoadingSpinner'

const DEFAULT_SKILLS = [
  // Frontend
  { id: '1', name: 'ReactJS', category: 'Frontend', level: 95 },
  { id: '2', name: 'React Native', category: 'Frontend', level: 90 },
  { id: '3', name: 'Angular', category: 'Frontend', level: 80 },
  { id: '4', name: 'TypeScript', category: 'Frontend', level: 90 },
  { id: '5', name: 'HTML/CSS', category: 'Frontend', level: 95 },
  // Backend
  { id: '6', name: '.NET Core', category: 'Backend', level: 95 },
  { id: '7', name: 'C#', category: 'Backend', level: 95 },
  { id: '8', name: 'Node.js', category: 'Backend', level: 80 },
  { id: '9', name: 'SpringBoot', category: 'Backend', level: 70 },
  // Database
  { id: '10', name: 'MSSQL', category: 'Database', level: 85 },
  { id: '11', name: 'PostgreSQL', category: 'Database', level: 80 },
  { id: '12', name: 'MongoDB', category: 'Database', level: 75 },
  { id: '13', name: 'MySQL', category: 'Database', level: 80 },
  // Cloud
  { id: '14', name: 'Azure', category: 'Cloud & DevOps', level: 85 },
  { id: '15', name: 'AWS', category: 'Cloud & DevOps', level: 70 },
  { id: '16', name: 'GCP', category: 'Cloud & DevOps', level: 65 },
  { id: '17', name: 'Docker', category: 'Cloud & DevOps', level: 80 },
  // Tools
  { id: '18', name: 'Redis', category: 'Tools', level: 80 },
  { id: '19', name: 'RabbitMQ', category: 'Tools', level: 75 },
  { id: '20', name: 'Elasticsearch', category: 'Tools', level: 70 },
  { id: '21', name: 'Hangfire', category: 'Tools', level: 85 },
]

const categoryColors: Record<string, string> = {
  Frontend: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800',
  Backend: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800',
  Database: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800',
  'Cloud & DevOps': 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800',
  Tools: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800',
}

const categoryBarColors: Record<string, string> = {
  Frontend: 'bg-blue-500',
  Backend: 'bg-green-500',
  Database: 'bg-orange-500',
  'Cloud & DevOps': 'bg-purple-500',
  Tools: 'bg-rose-500',
}

function getLevelLabel(level: number): string {
  if (level >= 90) return 'Expert'
  if (level >= 75) return 'Advanced'
  if (level >= 55) return 'Intermediate'
  return 'Beginner'
}

export default function Skills() {
  const { data: skills, isLoading } = useQuery({
    queryKey: ['skills'],
    queryFn: portfolioApi.getSkills,
    staleTime: 5 * 60 * 1000,
    retry: false,
  })

  const displaySkills = skills ?? DEFAULT_SKILLS

  const categories = Array.from(new Set(displaySkills.map((s) => s.category)))

  return (
    <section id="skills" className="py-20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="mb-12 text-center">
          <p className="mb-2 text-sm font-medium uppercase tracking-widest text-primary">
            Skills
          </p>
          <h2 className="text-3xl font-bold sm:text-4xl">Technical Expertise</h2>
          <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
            Technologies I've worked with across 9+ years of professional software development.
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-2">
            {categories.map((category) => {
              const catSkills = displaySkills.filter((s) => s.category === category)
              const colorClass = categoryColors[category] ?? 'bg-muted text-muted-foreground border-border'
              const barColor = categoryBarColors[category] ?? 'bg-primary'

              return (
                <div
                  key={category}
                  className="rounded-xl border border-border bg-card p-5 shadow-sm"
                >
                  <div className="mb-4 flex items-center gap-2">
                    <span
                      className={cn(
                        'rounded-full border px-2.5 py-0.5 text-xs font-semibold',
                        colorClass
                      )}
                    >
                      {category}
                    </span>
                    <span className="text-xs text-muted-foreground">{catSkills.length} skills</span>
                  </div>

                  <div className="space-y-3">
                    {catSkills.map((skill) => (
                      <div key={skill.id}>
                        <div className="mb-1 flex items-center justify-between">
                          <span className="text-sm font-medium">{skill.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {getLevelLabel(skill.level)} · {skill.level}%
                          </span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                          <div
                            className={cn('h-full rounded-full transition-all duration-700', barColor)}
                            style={{ width: `${skill.level}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
