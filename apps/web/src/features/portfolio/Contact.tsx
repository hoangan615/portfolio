import { useForm } from 'react-hook-form'
import { useMutation } from '@tanstack/react-query'
import { Mail, MapPin, Github, Linkedin, Send } from 'lucide-react'
import { cn } from '@/lib/utils'
import { portfolioApi, type ContactMessage } from '@/shared/api/portfolio'
import { toast } from '@/shared/stores/notificationStore'
import Button from '@/shared/components/Button'
import { useIntersection } from '@/shared/hooks/useIntersection'

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.73a8.25 8.25 0 0 0 4.83 1.54V6.82a4.85 4.85 0 0 1-1.06-.13z" />
    </svg>
  )
}

const CONTACT_INFO = [
  {
    icon: Mail,
    label: 'Email',
    value: 'hoangan615@gmail.com',
    href: 'mailto:hoangan615@gmail.com',
  },
  {
    icon: MapPin,
    label: 'Location',
    value: 'Cần Thơ, Vietnam',
    href: null,
  },
  {
    icon: Linkedin,
    label: 'LinkedIn',
    value: 'linkedin.com/in/an-vo-012359159',
    href: 'https://www.linkedin.com/in/an-vo-012359159/',
  },
  {
    icon: Github,
    label: 'GitHub',
    value: 'github.com/hoangan615',
    href: 'https://github.com/hoangan615',
  },
]

export default function Contact() {
  const { ref: headerRef, isVisible: headerVisible } = useIntersection()
  const { ref: infoRef, isVisible: infoVisible } = useIntersection()
  const { ref: formRef, isVisible: formVisible } = useIntersection()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactMessage>()

  const mutation = useMutation({
    mutationFn: portfolioApi.createContactMessage,
    onSuccess: () => {
      reset()
      toast.success('Message sent!', "Thanks for reaching out. I'll get back to you within 24–48 hours.")
    },
    onError: () => {
      toast.error('Failed to send', 'Please try again or email me directly at hoangan615@gmail.com.')
    },
  })

  return (
    <section id="contact" className="py-24 bg-muted/30">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div ref={headerRef} className={cn('mb-14 text-center reveal', headerVisible && 'visible')}>
          <p className="mb-2 text-sm font-medium uppercase tracking-widest text-primary">Contact</p>
          <h2 className="text-3xl font-bold sm:text-4xl">Get In Touch</h2>
          <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
            Whether you have a project, a job opportunity, or just want to connect — I'm always happy to chat.
            I'm open to <span className="font-medium text-foreground">remote roles worldwide</span> or positions in{' '}
            <span className="font-medium text-foreground">Cần Thơ, Vietnam</span>.
          </p>
        </div>

        <div className="grid gap-10 lg:grid-cols-2">
          {/* Contact info */}
          <div ref={infoRef} className={cn('space-y-5 reveal-left', infoVisible && 'visible')}>
            <h3 className="text-lg font-semibold">Contact Information</h3>
            <div className="space-y-3">
              {CONTACT_INFO.map(({ icon: Icon, label, value, href }) => (
                <div key={label} className="flex items-center gap-3 group">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-card shadow-sm group-hover:bg-primary/10 group-hover:border-primary/30 transition-colors">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{label}</p>
                    {href ? (
                      <a
                        href={href}
                        target={href.startsWith('mailto') ? undefined : '_blank'}
                        rel="noopener noreferrer"
                        className="text-sm font-medium hover:text-primary transition-colors"
                      >
                        {value}
                      </a>
                    ) : (
                      <p className="text-sm font-medium">{value}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* TikTok / social extra */}
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
                Also find me on
              </p>
              <a
                href="https://www.tiktok.com/@tech.takeaway"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium hover:text-primary hover:border-primary/40 transition-colors"
              >
                <TikTokIcon className="h-4 w-4" />
                @tech.takeaway
                <span className="text-xs text-muted-foreground">· Tech content (TikTok)</span>
              </a>
            </div>

            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">Response time:</span>{' '}
                I typically reply within 24–48 hours. For urgent matters, reach me directly at{' '}
                <a href="mailto:hoangan615@gmail.com" className="text-primary underline underline-offset-2">
                  hoangan615@gmail.com
                </a>.
              </p>
            </div>
          </div>

          {/* Contact form */}
          <form
            ref={formRef as React.RefObject<HTMLFormElement>}
            onSubmit={handleSubmit((data) => mutation.mutate(data))}
            className={cn('space-y-4 reveal-right', formVisible && 'visible')}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label htmlFor="contact-name" className="block text-sm font-medium">Name</label>
                <input
                  id="contact-name"
                  type="text"
                  placeholder="John Doe"
                  className={cn(
                    'w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm',
                    'placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors',
                    errors.name && 'border-destructive'
                  )}
                  {...register('name', { required: 'Name is required' })}
                />
                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="contact-email" className="block text-sm font-medium">Email</label>
                <input
                  id="contact-email"
                  type="email"
                  placeholder="you@example.com"
                  className={cn(
                    'w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm',
                    'placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors',
                    errors.email && 'border-destructive'
                  )}
                  {...register('email', {
                    required: 'Email is required',
                    pattern: { value: /^\S+@\S+\.\S+$/, message: 'Invalid email' },
                  })}
                />
                {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="contact-subject" className="block text-sm font-medium">
                Subject <span className="text-muted-foreground">(optional)</span>
              </label>
              <input
                id="contact-subject"
                type="text"
                placeholder="Project collaboration, job opportunity, remote role…"
                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
                {...register('subject')}
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="contact-message" className="block text-sm font-medium">Message</label>
              <textarea
                id="contact-message"
                rows={5}
                placeholder="Tell me about your project, opportunity, or anything else…"
                className={cn(
                  'w-full resize-none rounded-xl border border-border bg-background px-3 py-2.5 text-sm',
                  'placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors',
                  errors.message && 'border-destructive'
                )}
                {...register('message', {
                  required: 'Message is required',
                  minLength: { value: 20, message: 'At least 20 characters' },
                })}
              />
              {errors.message && <p className="text-xs text-destructive">{errors.message.message}</p>}
            </div>

            <Button type="submit" className="w-full gap-2" loading={mutation.isPending}>
              <Send className="h-4 w-4" />
              Send Message
            </Button>
          </form>
        </div>
      </div>
    </section>
  )
}
