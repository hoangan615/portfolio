import { useForm } from 'react-hook-form'
import { useMutation } from '@tanstack/react-query'
import { Mail, MapPin, Github, Linkedin, Send } from 'lucide-react'
import { cn } from '@/lib/utils'
import { portfolioApi, type ContactMessage } from '@/shared/api/portfolio'
import { toast } from '@/shared/stores/notificationStore'
import Button from '@/shared/components/Button'

const CONTACT_INFO = [
  {
    icon: Mail,
    label: 'Email',
    value: 'hoangan@portfolio.local',
    href: 'mailto:hoangan@portfolio.local',
  },
  {
    icon: MapPin,
    label: 'Location',
    value: 'Vietnam',
    href: null,
  },
  {
    icon: Github,
    label: 'GitHub',
    value: 'github.com/hoangan615',
    href: 'https://github.com/hoangan615',
  },
  {
    icon: Linkedin,
    label: 'LinkedIn',
    value: 'linkedin.com/in/hoangan615',
    href: 'https://linkedin.com/in/hoangan615',
  },
]

export default function Contact() {
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
      toast.success(
        'Message sent!',
        "Thanks for reaching out. I'll get back to you soon."
      )
    },
    onError: () => {
      toast.error('Failed to send', 'Please try again or contact me via email directly.')
    },
  })

  return (
    <section id="contact" className="py-20 bg-muted/30">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="mb-12 text-center">
          <p className="mb-2 text-sm font-medium uppercase tracking-widest text-primary">
            Contact
          </p>
          <h2 className="text-3xl font-bold sm:text-4xl">Get In Touch</h2>
          <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
            Whether you have a project idea, job opportunity, or just want to say hi — I'm
            always happy to connect.
          </p>
        </div>

        <div className="grid gap-10 lg:grid-cols-2">
          {/* Contact info */}
          <div className="space-y-5">
            <h3 className="text-lg font-semibold">Contact Information</h3>
            <div className="space-y-4">
              {CONTACT_INFO.map(({ icon: Icon, label, value, href }) => (
                <div key={label} className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-card">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{label}</p>
                    {href ? (
                      <a
                        href={href}
                        target="_blank"
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

            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Response time:</span> I typically
                respond within 24–48 hours. For urgent inquiries, please reach out via email
                directly.
              </p>
            </div>
          </div>

          {/* Contact form */}
          <form
            onSubmit={handleSubmit((data) => mutation.mutate(data))}
            className="space-y-4"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label htmlFor="contact-name" className="block text-sm font-medium">
                  Name
                </label>
                <input
                  id="contact-name"
                  type="text"
                  placeholder="John Doe"
                  className={cn(
                    'w-full rounded-md border border-border bg-background px-3 py-2 text-sm',
                    'placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring',
                    'transition-colors',
                    errors.name && 'border-destructive'
                  )}
                  {...register('name', { required: 'Name is required' })}
                />
                {errors.name && (
                  <p className="text-xs text-destructive">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="contact-email" className="block text-sm font-medium">
                  Email
                </label>
                <input
                  id="contact-email"
                  type="email"
                  placeholder="you@example.com"
                  className={cn(
                    'w-full rounded-md border border-border bg-background px-3 py-2 text-sm',
                    'placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring',
                    'transition-colors',
                    errors.email && 'border-destructive'
                  )}
                  {...register('email', {
                    required: 'Email is required',
                    pattern: { value: /^\S+@\S+\.\S+$/, message: 'Invalid email' },
                  })}
                />
                {errors.email && (
                  <p className="text-xs text-destructive">{errors.email.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="contact-subject" className="block text-sm font-medium">
                Subject <span className="text-muted-foreground">(optional)</span>
              </label>
              <input
                id="contact-subject"
                type="text"
                placeholder="Project collaboration, job opportunity…"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
                {...register('subject')}
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="contact-message" className="block text-sm font-medium">
                Message
              </label>
              <textarea
                id="contact-message"
                rows={5}
                placeholder="Tell me about your project or opportunity…"
                className={cn(
                  'w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-sm',
                  'placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring',
                  'transition-colors',
                  errors.message && 'border-destructive'
                )}
                {...register('message', {
                  required: 'Message is required',
                  minLength: { value: 20, message: 'At least 20 characters' },
                })}
              />
              {errors.message && (
                <p className="text-xs text-destructive">{errors.message.message}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full gap-2"
              loading={mutation.isPending}
            >
              <Send className="h-4 w-4" />
              Send Message
            </Button>
          </form>
        </div>
      </div>
    </section>
  )
}
