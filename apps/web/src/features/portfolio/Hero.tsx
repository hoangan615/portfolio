import { useQuery } from '@tanstack/react-query'
import { Github, Linkedin, FileText, Mail, ArrowDown } from 'lucide-react'
import { portfolioApi } from '@/shared/api/portfolio'

const DEFAULT_PROFILE = {
  name: 'Võ Hoàng Ân',
  title: '.NET Developer & Technical Lead',
  company: 'FPT Software',
  tagline: '10+ years delivering enterprise software — AI/LLM solutions & GitHub Copilot agent development',
  github: 'https://github.com/hoangan615',
  linkedin: 'https://www.linkedin.com/in/an-vo-012359159/',
  tiktok: 'https://www.tiktok.com/@tech.takeaway',
}

const TECH_STACK = [
  { label: '.NET/C#', cls: 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800' },
  { label: 'Azure OpenAI', cls: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800' },
  { label: 'GitHub Copilot', cls: 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800' },
  { label: 'LangChain', cls: 'bg-green-500/10 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800' },
  { label: 'ReactJS', cls: 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800' },
  { label: 'Angular', cls: 'bg-red-500/10 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800' },
  { label: 'Azure', cls: 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800' },
]

const STATS = [
  { value: '10+', label: 'Years' },
  { value: '20+', label: 'Projects' },
  { value: '60+', label: 'Team size' },
  { value: '8', label: 'Certs' },
]

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.73a8.25 8.25 0 0 0 4.83 1.54V6.82a4.85 4.85 0 0 1-1.06-.13z" />
    </svg>
  )
}

export default function Hero() {
  const { data: portfolio } = useQuery({
    queryKey: ['portfolio'],
    queryFn: portfolioApi.getPortfolio,
    staleTime: 5 * 60 * 1000,
    retry: false,
  })

  const name = portfolio?.name ?? DEFAULT_PROFILE.name
  const title = portfolio?.title ?? DEFAULT_PROFILE.title
  const github = portfolio?.github ?? DEFAULT_PROFILE.github
  const linkedin = portfolio?.linkedin ?? DEFAULT_PROFILE.linkedin

  return (
    <section
      id="hero"
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
    >
      {/* ── Background ───────────────────────────────────── */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-blue-600/10 dark:from-primary/10 dark:to-blue-800/20" />
        <div
          className="absolute inset-0 opacity-40"
          style={{ backgroundImage: `radial-gradient(ellipse 80% 50% at 50% -20%, hsl(var(--primary)/0.3), transparent)` }}
        />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `radial-gradient(circle, hsl(var(--foreground)) 1px, transparent 1px)`,
            backgroundSize: '32px 32px',
          }}
        />
        <div className="animate-float absolute top-1/4 left-[8%] h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
        <div className="animate-float-delayed absolute bottom-1/4 right-[10%] h-80 w-80 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="animate-float absolute top-1/2 right-1/3 h-48 w-48 rounded-full bg-purple-500/8 blur-2xl" />
        <div
          className="animate-spin-slow absolute -top-16 -right-16 h-96 w-96 rounded-full border border-primary/10"
          style={{ borderWidth: '1px', borderStyle: 'dashed' }}
        />
      </div>

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-24 text-center">
        {/* Status badge */}
        <div className="mb-8 inline-flex items-center gap-2.5 rounded-full border border-border bg-card/80 backdrop-blur-sm px-4 py-2 text-sm text-muted-foreground shadow-sm">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
          </span>
          Open to Remote &amp; Cần Thơ opportunities
        </div>

        {/* Name */}
        <h1 className="mb-5 text-4xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl">
          <span className="block text-foreground/60 text-xl sm:text-2xl font-semibold mb-3 tracking-normal">
            Hi there, I'm
          </span>
          <span className="animate-gradient bg-gradient-to-r from-primary via-blue-400 to-purple-500 bg-clip-text text-transparent">
            {name}
          </span>
        </h1>

        {/* Title */}
        <p className="mb-2 text-xl sm:text-2xl font-bold text-foreground/90">
          {title}
        </p>
        <p className="mb-3 text-base sm:text-lg font-medium text-primary">
          {DEFAULT_PROFILE.company}
        </p>

        {/* Tagline */}
        <p className="mb-10 mx-auto max-w-2xl text-base sm:text-lg text-muted-foreground leading-relaxed">
          {DEFAULT_PROFILE.tagline}. Specialized in{' '}
          <span className="text-foreground font-medium">Azure OpenAI</span>,{' '}
          <span className="text-foreground font-medium">.NET/C#</span>{' '}
          &amp;{' '}
          <span className="text-foreground font-medium">GitHub Copilot Agents</span>{' '}
          — having led teams of up to 60 engineers on mission-critical enterprise platforms.
        </p>

        {/* CTA buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4 mb-14">
          <a
            href="/cv"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 h-11 px-6 text-base rounded-md font-medium bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm shadow-lg shadow-primary/25 transition-colors whitespace-nowrap"
          >
            <FileText className="h-4 w-4 shrink-0" />
            View / Download CV
          </a>
          <a
            href="#contact"
            className="inline-flex items-center justify-center gap-2 h-11 px-6 text-base rounded-md font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground shadow-sm transition-colors whitespace-nowrap"
          >
            <Mail className="h-4 w-4 shrink-0" />
            Get In Touch
          </a>
        </div>

        {/* Social links */}
        <div className="flex items-center justify-center gap-3 mb-14">
          {github && (
            <a
              href={github}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card/80 text-muted-foreground hover:text-foreground hover:bg-accent hover:scale-110 transition-all"
              aria-label="GitHub"
            >
              <Github className="h-4 w-4" />
            </a>
          )}
          {linkedin && (
            <a
              href={linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card/80 text-muted-foreground hover:text-foreground hover:bg-accent hover:scale-110 transition-all"
              aria-label="LinkedIn"
            >
              <Linkedin className="h-4 w-4" />
            </a>
          )}
          <a
            href={DEFAULT_PROFILE.tiktok}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card/80 text-muted-foreground hover:text-foreground hover:bg-accent hover:scale-110 transition-all"
            aria-label="TikTok"
          >
            <TikTokIcon className="h-4 w-4" />
          </a>
        </div>

        {/* Quick stats */}
        <div className="mx-auto grid max-w-lg grid-cols-4 gap-px overflow-hidden rounded-2xl border border-border bg-border shadow-sm mb-14">
          {STATS.map(({ value, label }) => (
            <div key={label} className="flex flex-col items-center justify-center bg-card py-4 px-2">
              <span className="text-2xl font-extrabold bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent">
                {value}
              </span>
              <span className="text-xs text-muted-foreground mt-0.5">{label}</span>
            </div>
          ))}
        </div>

        {/* Tech stack row */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-12">
          <span className="text-xs text-muted-foreground mr-1">Tech stack:</span>
          {TECH_STACK.map(({ label, cls }) => (
            <span
              key={label}
              className={`rounded-full border px-3 py-1 text-xs font-semibold ${cls}`}
            >
              {label}
            </span>
          ))}
        </div>

        {/* Scroll indicator */}
        <div className="flex justify-center">
          <a
            href="#about"
            className="flex flex-col items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors group"
            aria-label="Scroll down"
          >
            <span className="group-hover:text-primary transition-colors">Scroll down</span>
            <ArrowDown className="h-4 w-4 animate-bounce" />
          </a>
        </div>
      </div>
    </section>
  )
}
