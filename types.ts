
export enum ViewType {
  HOME = 'home',
  COMMUNITY = 'community',
  ASSISTANT = 'assistant',
  LEARNING = 'learning',
  DOCUMENTS = 'documents',
  DASHBOARD = 'dashboard',
  PROFILE = 'profile',
  CURATOR = 'curator',
  JOBS = 'jobs',
  MAP = 'map',
  PRIVACY = 'privacy',
  ADMIN_HUB = 'admin_hub'
}

export type TrustLevel = "Observador" | "Colaborador" | "Curador Comunitário";
export type ValidationStatus = "pending" | "validated" | "under_review" | "hidden";

export interface Badge {
  id: string;
  name: string;
  icon: string;
  description: string;
  unlocked: boolean;
  category: 'social' | 'legal' | 'trust' | 'help';
}

export interface NotificationPreferences {
  OFFICIAL_AIMA: boolean; // Alertas oficiais diretos da AIMA
  LEGAL_CHANGES: boolean; // Mudanças legislativas (DRE/Conselho de Ministros)
  DOC_EXPIRATION: boolean; // Prazos de validade dos seus documentos
  JOB_MATCHES: boolean; // Vagas urgentes compatíveis com seu perfil
  COMMUNITY_REPUTATION: boolean; // Conquistas de selos e pontos
  MAP_URGENCY: boolean; // Alertas de balcões abertos ou greves em serviços
  MIRA_INSIGHTS: boolean; // Novos artigos e guias práticos do Learning Hub
  SOCIAL_CONNECT: boolean; // Quando alguém responde ou valida seus posts
  MIRA_ARTICLE: boolean; // Novo Artigo MIRA
  COMMUNITY_REPLY: boolean; // Novo comentário no seu Post
  COMMUNITY_FOLLOW_UP: boolean; // Novo comentário em Post que comentou
}

export const UNIFIED_CATEGORIES = [
  "Residência e Legalização",
  "Registos e Nacionalidade",
  "Emprego e Formação",
  "Segurança Social",
  "Saúde (SNS)",
  "Finanças",
  "Educação e Reconhecimento",
  "Direitos e Apoios Sociais",
  "Habitação",
  "Comunidade & Apoio",
  "Tecnologia & Ética Digital",
  "Histórias & Vozes Migrantes"
] as const;

export type UnifiedCategory = typeof UNIFIED_CATEGORIES[number];

export const CATEGORIES = {
  IMMIGRATION: UNIFIED_CATEGORIES[0],
  RIGHTS: UNIFIED_CATEGORIES[1],
  WORK: UNIFIED_CATEGORIES[2],
  SOCIAL_SECURITY: UNIFIED_CATEGORIES[3],
  HEALTH: UNIFIED_CATEGORIES[4],
  FINANCE: UNIFIED_CATEGORIES[5],
  EDUCATION: UNIFIED_CATEGORIES[6],
  SOCIAL_SUPPORT: UNIFIED_CATEGORIES[7],
  HOUSING: UNIFIED_CATEGORIES[8],
  COMMUNITY: UNIFIED_CATEGORIES[9],
  TECH: UNIFIED_CATEGORIES[10],
  STORIES: UNIFIED_CATEGORIES[11],
};

export const MAP_CATEGORIES = [
  UNIFIED_CATEGORIES[0], // Residência e Legalização
  UNIFIED_CATEGORIES[1], // Registos e Nacionalidade
  UNIFIED_CATEGORIES[2], // Emprego e Formação
  UNIFIED_CATEGORIES[3], // Segurança Social
  UNIFIED_CATEGORIES[4], // Saúde (SNS)
  UNIFIED_CATEGORIES[5], // Finanças
  UNIFIED_CATEGORIES[6], // Educação e Reconhecimento
  UNIFIED_CATEGORIES[7], // Direitos e Apoios Sociais
  UNIFIED_CATEGORIES[8], // Habitação
  UNIFIED_CATEGORIES[9], // Comunidade & Apoio
] as const;

export const WORK_TOPICS = [
  "Tecnologia, Dados & IA",
  "Saúde & Cuidados Continuados",
  "Construção Civil & Engenharia",
  "Turismo, Hotelaria & Restauração",
  "Indústria, Produção & Manufatura",
  "Logística, Transportes & Armazém",
  "Comércio, Vendas & Retalho",
  "Administrativo, Gestão & RH",
  "Limpeza, Segurança & Facility Management",
  "Agricultura, Pesca & Pecuária",
  "Artes, Design & Multimédia",
  "Apoio Social & Terceiro Setor",
  "Energia & Sustentabilidade",
  "Trabalho Remoto & Freelancing"
] as const;

export interface User {
  id: string;
  name: string;
  avatar?: string;
  bio?: string;
  email?: string;
  nationality?: string;
  ageRange?: string;
  location?: string;
  mainChallenge?: string;
  dataConsent?: boolean;
  registrationDate?: string;
  isMuted?: boolean;
  reputation: number;
  trustLevel: TrustLevel;
  isVerified?: boolean;
  role?: 'member' | 'mentor' | 'admin';
  isBlocked?: boolean;
  badges?: Badge[];
}

export interface Comment {
  id: string;
  authorId: string;
  authorName?: string;
  authorAvatar?: string;
  content: string;
  timestamp: string;
  likes: number;
  isValidated?: boolean;
  isLikedByUser?: boolean;
}

export interface Post {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  authorBio?: string;
  title: string;
  content: string;
  isLikedByUser?: boolean;
  userVote?: 'true' | 'false';
  category: string;
  workTopic?: string;
  geoTag?: string;
  backgroundImage?: string;
  tags: string[];
  likes: number;
  comments: Comment[];
  isVerified: boolean;
  isFraudWarning: boolean;
  location?: string;
  timestamp: string;
  reports: number;
  urgency: number; // 0-5
  validationStatus: ValidationStatus;
  usefulVotes: number;
  fakeVotes: number;
  reviewVotes: number;
}

export interface JobPost {
  id: string;
  title: string;
  location: string;
  sourceName: string;
  sourceUrl: string;
  datePosted: string;
  tags: string[];
  category: string;
  workTopic: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  type: string;
  duration: string;
  image: string;
  link?: string;
  isIefpSynced?: boolean;
}

export interface Rating {
  stars: number;
  comment: string;
}

export interface MapAlert {
  id: string;
  title: string;
  category: string;
  lat: number;
  lng: number;
  distance: string;
  ratings: Rating[];
  avgRating: number;
  address: string;
  city: string;
  image?: string;
  phone?: string;
  email?: string;
  website?: string;
  type?: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: Date;
}

export interface AppActivityLog {
  id: string;
  userId: string;
  action: 'post_created' | 'comment_created' | 'ai_query' | 'view_changed' | 'fraud_report' | 'doc_generated' | 'vote_cast' | 'job_click' | 'course_view' | 'admin_delete' | 'admin_include' | 'admin_topic_suggestion' | 'admin_job_sync' | 'admin_course_sync' | 'admin_delete_all_posts' | 'admin_delete_all_comments' | 'admin_delete_all_users' | 'europass_click';
  category?: string;
  timestamp: string;
  metadata?: any;
}

export interface DocumentTask {
  id: string;
  title: string;
  completed: boolean;
  category: UnifiedCategory;
}

export interface DocumentField {
  id: string;
  label: string;
  placeholder: string;
  type: string;
}

export interface DocumentTemplate {
  id: string;
  title: string;
  category: UnifiedCategory;
  complexity: 'Easy' | 'Medium' | 'Hard';
  description: string;
  explanation?: string;
  purpose: string;
  requirements: string[];
  fields: DocumentField[];
  authority: string;
  location: string;
  tips: string;
}

export interface ChatSession {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: Date;
}

export interface ForumPost {
  id: string;
  authorId: string;
  title: string;
  content: string;
  category: string;
  likes: number;
  comments: any[];
}

export interface GeneratedDocument {
  id: string;
  title: string;
  date: string;
  url?: string;
  formData?: Record<string, string>;
  isDraft?: boolean;
  authority?: string;
}
