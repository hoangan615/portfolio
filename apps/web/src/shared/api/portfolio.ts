import apiClient from './client'

export interface PortfolioProfile {
  id: string
  name: string
  title: string
  tagline: string
  bio: string
  avatarUrl: string | null
  coverUrl: string | null
  email: string
  phone: string | null
  location: string
  website: string | null
  github: string | null
  linkedin: string | null
  cvUrl: string | null
}

export interface Skill {
  id: string
  name: string
  category: string
  level: number // 0-100
  icon?: string
}

export interface Experience {
  id: string
  company: string
  role: string
  startDate: string
  endDate: string | null
  isCurrent: boolean
  description: string
  highlights: string[]
  technologies: string[]
}

export interface Project {
  id: string
  title: string
  description: string
  longDescription?: string
  thumbnailUrl: string | null
  demoUrl: string | null
  repoUrl: string | null
  technologies: string[]
  tags: string[]
  featured: boolean
  order: number
}

export interface ContactMessage {
  name: string
  email: string
  subject?: string
  message: string
}

export const portfolioApi = {
  getPortfolio: async (): Promise<PortfolioProfile> => {
    const { data } = await apiClient.get<PortfolioProfile>('/portfolio')
    return data
  },

  updatePortfolio: async (payload: Partial<PortfolioProfile>): Promise<PortfolioProfile> => {
    const { data } = await apiClient.put<PortfolioProfile>('/portfolio', payload)
    return data
  },

  getSkills: async (): Promise<Skill[]> => {
    const { data } = await apiClient.get<Skill[]>('/portfolio/skills')
    return data
  },

  createSkill: async (payload: Omit<Skill, 'id'>): Promise<Skill> => {
    const { data } = await apiClient.post<Skill>('/portfolio/skills', payload)
    return data
  },

  updateSkill: async (id: string, payload: Partial<Omit<Skill, 'id'>>): Promise<Skill> => {
    const { data } = await apiClient.put<Skill>(`/portfolio/skills/${id}`, payload)
    return data
  },

  deleteSkill: async (id: string): Promise<void> => {
    await apiClient.delete(`/portfolio/skills/${id}`)
  },

  getExperiences: async (): Promise<Experience[]> => {
    const { data } = await apiClient.get<Experience[]>('/portfolio/experiences')
    return data
  },

  getProjects: async (): Promise<Project[]> => {
    const { data } = await apiClient.get<Project[]>('/portfolio/projects')
    return data
  },

  createContactMessage: async (payload: ContactMessage): Promise<{ success: boolean }> => {
    const { data } = await apiClient.post<{ success: boolean }>('/contact', payload)
    return data
  },
}
