import { useQuery } from '@tanstack/react-query'
import { MapPin, Briefcase, GraduationCap, Award } from 'lucide-react'
import { portfolioApi } from '@/shared/api/portfolio'

const DEFAULT_BIO = `I'm a passionate Full-Stack Developer and Tech Lead with over 9 years of experience in web development (.NET/C#) and 5 years in mobile development (React Native). Currently serving as Sub Project Lead at FPT Software, where I lead teams of up to 50 engineers on large-scale enterprise projects.

My journey spans from building DICOM medical imaging systems to blockchain loyalty platforms and AI document intelligence solutions. I thrive in challenging environments that require both technical depth and leadership skills.

When I'm not architecting systems or writing code, I enjoy sharing knowledge with the developer community through articles and open-source contributions.`

const highlights = [
  { icon: Briefcase, label: 'Experience', value: '9+ Years' },
  { icon: GraduationCap, label: 'Education', value: 'B.Eng (Excellent)' },
  { icon: MapPin, label: 'Location', value: 'Vietnam' },
  { icon: Award, label: 'Certifications', value: '6+' },
]

export default function About() {
  const { data: portfolio } = useQuery({
    queryKey: ['portfolio'],
    queryFn: portfolioApi.getPortfolio,
    staleTime: 5 * 60 * 1000,
    retry: false,
  })

  const bio = portfolio?.bio ?? DEFAULT_BIO
  const avatarUrl = portfolio?.avatarUrl

  return (
    <section id="about" className="py-20 bg-muted/30">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="mb-12 text-center">
          <p className="mb-2 text-sm font-medium uppercase tracking-widest text-primary">
            About Me
          </p>
          <h2 className="text-3xl font-bold sm:text-4xl">Who Am I?</h2>
        </div>

        <div className="grid gap-12 lg:grid-cols-2 items-center">
          {/* Profile image */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="h-72 w-72 overflow-hidden rounded-2xl border-4 border-border bg-muted shadow-2xl">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Võ Hoàng An"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 to-blue-500/20">
                    <span className="text-8xl font-extrabold bg-gradient-to-br from-primary to-blue-500 bg-clip-text text-transparent select-none">
                      VHA
                    </span>
                  </div>
                )}
              </div>
              {/* Decoration */}
              <div className="absolute -bottom-4 -right-4 h-24 w-24 rounded-xl border-4 border-background bg-primary/10 -z-10" />
              <div className="absolute -top-4 -left-4 h-16 w-16 rounded-xl border-4 border-background bg-blue-500/10 -z-10" />
            </div>
          </div>

          {/* Content */}
          <div className="space-y-6">
            <div className="space-y-4">
              {bio.split('\n\n').map((paragraph, i) => (
                <p key={i} className="text-muted-foreground leading-relaxed">
                  {paragraph}
                </p>
              ))}
            </div>

            {/* Highlight stats */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              {highlights.map(({ icon: Icon, label, value }) => (
                <div
                  key={label}
                  className="flex items-center gap-3 rounded-lg border border-border bg-card p-3"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="text-sm font-semibold">{value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
