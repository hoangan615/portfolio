import Hero from '@/features/portfolio/Hero'
import About from '@/features/portfolio/About'
import Skills from '@/features/portfolio/Skills'
import Experience from '@/features/portfolio/Experience'
import Projects from '@/features/portfolio/Projects'
import Contact from '@/features/portfolio/Contact'

export default function HomePage() {
  return (
    <main>
      <Hero />
      <About />
      <Skills />
      <Experience />
      <Projects />
      <Contact />
    </main>
  )
}
