-- EXECUTAR NO EDITOR SQL DO SUPABASE
-- Este script cria as tabelas para Sugestões, Denúncias e Conhecimento da IA

-- 1. Tabela de Sugestões
CREATE TABLE IF NOT EXISTS public.suggestions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id),
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Tabela de Denúncias/Queixas
CREATE TABLE IF NOT EXISTS public.complaints (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id),
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Tabela de Conhecimento Manual para IA
CREATE TABLE IF NOT EXISTS public.chat_knowledge (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  topic TEXT NOT NULL,
  information TEXT NOT NULL,
  category TEXT,
  source TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_knowledge ENABLE ROW LEVEL SECURITY;

-- Políticas para Sugestões
CREATE POLICY "Users can insert their own suggestions" ON public.suggestions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all suggestions" ON public.suggestions
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins can delete suggestions" ON public.suggestions
  FOR DELETE USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Políticas para Denúncias
CREATE POLICY "Users can insert their own complaints" ON public.complaints
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all complaints" ON public.complaints
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins can delete complaints" ON public.complaints
  FOR DELETE USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Políticas para Conhecimento AI
CREATE POLICY "Everyone can view AI knowledge" ON public.chat_knowledge
  FOR SELECT USING (true);
CREATE POLICY "Admins can manage AI knowledge" ON public.chat_knowledge
  FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
