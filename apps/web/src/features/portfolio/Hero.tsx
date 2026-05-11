import { useQuery } from '@tanstack/react-query'
import { Github, Linkedin, Download, Mail, ArrowDown } from 'lucide-react'
import { portfolioApi } from '@/shared/api/portfolio'
import Button from '@/shared/components/Button'

const DEFAULT_PROFILE = {
  name: 'Võ Hoàng An',
  title: 'Full-Stack Developer & Tech Lead at FPT Software',
  tagline: '9+ years building scalable web & mobile applications',
  github: 'https://github.com/hoangan615',
  linkedin: 'https://linkedin.com/in/hoangan615',
  cvUrl: '/cv.pdf',
  email: 'hoangan@portfolio.local',
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
  const tagline = portfolio?.tagline ?? DEFAULT_PROFILE.tagline
  const github = portfolio?.github ?? DEFAULT_PROFILE.github
  const linkedin = portfolio?.linkedin ?? DEFAULT_PROFILE.linkedin
  const cvUrl = portfolio?.cvUrl ?? DEFAULT_PROFILE.cvUrl

  return (
    <section
      id="hero"
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
    >
      {/* Animated gradient background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-blue-600/10 dark:from-primary/10 dark:to-blue-800/20" />
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage: `radial-gradient(ellipse 80% 50% at 50% -20%, hsl(var(--primary)/0.3), transparent)`,
          }}
        />
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(hsl(var(--foreground)) 1px, transparent 1px),
                             linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-24 text-center">
        {/* Greeting badge */}
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card/80 backdrop-blur-sm px-4 py-1.5 text-sm text-muted-foreground">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
          </span>
          Available for exciting projects
        </div>

        {/* Name */}
        <h1 className="mb-4 text-4xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl">
          <span className="bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent">
            Hi, I'm{' '}
          </span>
          <span className="bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent">
            {name}
          </span>
        </h1>

        {/* Title */}
        <p className="mb-4 text-xl sm:text-2xl font-semibold text-foreground/90">
          {title}
        </p>

        {/* Tagline */}
        <p className="mb-10 mx-auto max-w-2xl text-base sm:text-lg text-muted-foreground leading-relaxed">
          {tagline}. Specialized in{' '}
          <span className="text-foreground font-medium">.NET/C#</span>,{' '}
          <span className="text-foreground font-medium">React</span> &amp;{' '}
          <span className="text-foreground font-medium">React Native</span>, with experience
          leading teams of 20–50 engineers on enterprise-grade platforms.
        </p>

        {/* CTAs */}
        <div className="flex flex-wrap items-center justify-center gap-4 mb-12">
          <Button asChild size="lg" className="gap-2 shadow-lg shadow-primary/20">
            <a href={cvUrl} download>
              <Download className="h-4 w-4" />
              Download CV
            </a>
          </Button>
          <Button asChild variant="outline" size="lg" className="gap-2">
            <a href="#contact">
              <Mail className="h-4 w-4" />
              Contact Me
            </a>
          </Button>
        </div>

        {/* Social links */}
        <div className="flex items-center justify-center gap-3">
          {github && (
            <a
              href={github}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card/80 text-muted-foreground hover:text-foreground hover:bg-accent transition-all hover:scale-110"
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
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card/80 text-muted-foreground hover:text-foreground hover:bg-accent transition-all hover:scale-110"
              aria-label="LinkedIn"
            >
              <Linkedin className="h-4 w-4" />
            </a>
          )}
        </div>

        {/* Scroll indicator */}
        <div className="mt-16 flex justify-center">
          <a
            href="#about"
            className="flex flex-col items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Scroll down"
          >
            <span>Scroll down</span>
            <ArrowDown className="h-4 w-4 animate-bounce" />
          </a>
        </div>
      </div>
    </section>
  )
}
