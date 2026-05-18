import { useQuery } from '@tanstack/react-query'
import { MapPin, Briefcase, GraduationCap, Award, Globe, Wifi } from 'lucide-react'
import { portfolioApi } from '@/shared/api/portfolio'
import { useIntersection } from '@/shared/hooks/useIntersection'
import { cn } from '@/lib/utils'

const DEFAULT_BIO = [
  `Võ Hoàng Ân is a results-driven Technical Lead and AI Engineer with over 10 years of professional experience at FPT Software — one of Vietnam's leading IT services companies. He specializes in leveraging AI and Large Language Models (LLMs) to optimize the Software Development Lifecycle, with hands-on expertise in building custom AI agents for GitHub Copilot that automate code generation, automated code reviews, refactoring, and unit test creation.`,

  `His core technical foundation is built on deep expertise in the .NET ecosystem (C#, .NET Core, .NET 8) combined with applied AI engineering — Azure OpenAI, Azure Document Intelligence, LangChain, RAG architectures, and vector databases. He has architected and delivered enterprise-scale solutions across diverse domains: an AI-powered document intelligence platform achieving 99% data capture accuracy, a blockchain-based enterprise loyalty ecosystem, real estate contract management and construction monitoring systems, OCR document processing pipelines, and DICOM medical imaging platforms.`,

  `As a Sub Project Lead, he has managed teams of up to 60 engineers, owning the full project lifecycle from business requirements analysis and technical architecture through to estimation, sprint planning, code reviews, and customer reporting. His extensive collaboration with Japanese enterprise clients has sharpened his cross-cultural communication skills, enabling him to bridge technical teams with international stakeholders effectively.`,

  `He is currently open to fully remote opportunities worldwide, as well as on-site or hybrid roles located in Cần Thơ, Vietnam.`,
]

const HIGHLIGHTS = [
  { icon: Briefcase, label: 'Experience', value: '10+ Years' },
  { icon: GraduationCap, label: 'Education', value: 'B.Eng — Excellent' },
  { icon: MapPin, label: 'Location', value: 'Cần Thơ, Vietnam' },
  { icon: Award, label: 'Certifications', value: '6+' },
]

const LANGUAGES = [
  { flag: '🇻🇳', lang: 'Vietnamese', level: 'Native', pct: 100 },
  { flag: '🇬🇧', lang: 'English', level: 'B1', pct: 55 },
  { flag: '🇯🇵', lang: 'Japanese', level: 'N4', pct: 35 },
]

const JOB_PREFS = [
  { icon: Wifi, label: 'Remote Worldwide' },
  { icon: MapPin, label: 'On-site · Cần Thơ, VN' },
  { icon: Globe, label: 'Hybrid · Flexible' },
]

export default function About() {
  const { data: portfolio } = useQuery({
    queryKey: ['portfolio'],
    queryFn: portfolioApi.getPortfolio,
    staleTime: 5 * 60 * 1000,
    retry: false,
  })

  const { ref: headerRef, isVisible: headerVisible } = useIntersection()
  const { ref: imgRef, isVisible: imgVisible } = useIntersection()
  const { ref: textRef, isVisible: textVisible } = useIntersection()
  const { ref: langRef, isVisible: langVisible } = useIntersection()

  const avatarUrl = portfolio?.avatarUrl ?? '/avatar.jpeg'

  return (
    <section id="about" className="py-24 bg-muted/30">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div ref={headerRef} className={cn('mb-14 text-center reveal', headerVisible && 'visible')}>
          <p className="mb-2 text-sm font-medium uppercase tracking-widest text-primary">About Me</p>
          <h2 className="text-3xl font-bold sm:text-4xl">Who Am I?</h2>
        </div>

        <div className="grid gap-14 lg:grid-cols-2 items-start">
          {/* Photo col */}
          <div ref={imgRef} className={cn('flex flex-col items-center gap-6 reveal-left', imgVisible && 'visible')}>
            <div className="relative">
              <div className="absolute -inset-3 rounded-3xl bg-gradient-to-br from-primary/30 to-blue-500/20 blur-xl opacity-60" />
              <div className="relative h-72 w-72 overflow-hidden rounded-2xl border-2 border-border shadow-2xl bg-muted">
                <img
                  src={avatarUrl}
                  alt="Võ Hoàng Ân"
                  className="h-full w-full object-cover object-top"
                  onError={
                    /* c8 ignore start */
                    (e) => {
                      const target = e.currentTarget
                      target.style.display = 'none'
                      const fallback = target.nextElementSibling as HTMLElement | null
                      if (fallback) fallback.style.display = 'flex'
                    }
                    /* c8 ignore stop */
                  }
                />
                {/* Fallback */}
                <div
                  style={{ display: 'none' }}
                  className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-primary/20 via-blue-500/10 to-purple-500/20"
                >
                  <span className="text-7xl font-extrabold bg-gradient-to-br from-primary to-blue-500 bg-clip-text text-transparent select-none leading-none">
                    VHÂ
                  </span>
                  <span className="mt-3 text-xs font-medium text-muted-foreground tracking-widest uppercase">
                    Võ Hoàng Ân
                  </span>
                </div>
              </div>
              <div className="absolute -bottom-5 -right-5 h-20 w-20 rounded-xl border-4 border-background bg-primary/15 -z-10 animate-float" />
              <div className="absolute -top-5 -left-5 h-14 w-14 rounded-xl border-4 border-background bg-blue-500/15 -z-10 animate-float-delayed" />
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-border bg-card px-4 py-1.5 shadow-lg text-xs font-semibold">
                📍 Cần Thơ, Vietnam
              </div>
            </div>

            {/* Highlight stats */}
            <div className="w-full grid grid-cols-2 gap-2.5 mt-4">
              {HIGHLIGHTS.map(({ icon: Icon, label, value }) => (
                <div
                  key={label}
                  className="flex items-center gap-2.5 rounded-xl border border-border bg-card p-3 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground leading-none mb-0.5">{label}</p>
                    <p className="text-xs font-bold leading-none">{value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Job preferences */}
            <div className="w-full rounded-xl border border-border bg-card p-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
                Open To
              </p>
              <div className="flex flex-wrap gap-2">
                {JOB_PREFS.map(({ icon: Icon, label }) => (
                  <span
                    key={label}
                    className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
                  >
                    <Icon className="h-3 w-3" />
                    {label}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Content col */}
          <div ref={textRef} className={cn('space-y-6 reveal-right', textVisible && 'visible')}>
            <div className="space-y-4">
              {DEFAULT_BIO.map((paragraph, i) => (
                <p key={i} className="text-muted-foreground leading-relaxed text-sm sm:text-base">
                  {paragraph}
                </p>
              ))}
            </div>

            {/* Language proficiency */}
            <div
              ref={langRef}
              className={cn('rounded-xl border border-border bg-card p-5 reveal', langVisible && 'visible')}
            >
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4">
                Language Proficiency
              </p>
              <div className="space-y-3">
                {LANGUAGES.map(({ flag, lang, level, pct }, i) => (
                  <div key={lang}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium flex items-center gap-1.5">
                        <span>{flag}</span> {lang}
                      </span>
                      <span className="text-xs font-semibold text-primary">{level}</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-primary to-blue-400"
                        style={{
                          width: langVisible ? `${pct}%` : '0%',
                          transition: `width 0.8s cubic-bezier(0.22, 1, 0.36, 1) ${i * 120}ms`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
