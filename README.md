<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# MIRA — Migrants' Intelligent Rights Assistant

Plataforma open source, gratuita e sem caráter lucrativo para apoio a imigrantes em Portugal e na Europa.

## Sobre o projeto

A MIRA nasce de uma necessidade urgente: oferecer apoio real, confiável e acessível a imigrantes que enfrentam diariamente barreiras para exercer seus direitos em Portugal e na Europa. Muitos chegam com esperança de construir uma vida melhor, mas se deparam com processos complexos, informações desencontradas e, muitas vezes, pessoas que se aproveitam da sua vulnerabilidade. A MIRA quer mudar isso.

Nosso objetivo é simples, mas poderoso: capacitar cada imigrante com conhecimento, autonomia e segurança. Por meio de inteligência artificial combinada com curadoria humana, a MIRA fornece informações claras sobre documentação, vistos, residência, trabalho, educação, saúde e serviços sociais. Tudo de forma gratuita, multilíngue e confiável. Mais do que um assistente digital, é uma ferramenta de inclusão, proteção e empoderamento.

Investir seu tempo na MIRA significa fazer parte de algo maior. É contribuir para que milhares de pessoas possam viver com dignidade, evitar fraudes, navegar pela burocracia com confiança e se integrar plenamente à sociedade. É também criar uma comunidade segura, onde experiências são compartilhadas, dúvidas são esclarecidas e conhecimento é disseminado de forma responsável.

Ao apoiar a MIRA, você está ajudando a construir um projeto inovador, que não só transforma vidas individuais, mas também fortalece a sociedade como um todo, promovendo justiça, igualdade e solidariedade. Cada interação, cada contribuição e cada hora dedicada ao projeto é um passo concreto para um futuro mais inclusivo e humano.

## Princípios

- **Sem fins lucrativos:** este projeto tem caráter social e comunitário.
- **Open source:** desenvolvimento transparente, colaborativo e auditável.
- **Acesso gratuito:** foco em utilidade pública e inclusão digital.
- **Informação responsável:** IA com curadoria humana e compromisso com segurança.

## Funcionalidades (resumo)

- Assistente de informação para direitos, documentação, trabalho e integração.
- Recursos multilíngues para reduzir barreiras de comunicação.
- Camadas de comunidade, denúncia e suporte orientadas à proteção de usuários.
- Integração com dados e serviços para apoiar decisões práticas no dia a dia.

## Stack técnica

- **Frontend:** React 19 + TypeScript + Vite 6
- **UI e visualização:** Lucide React, Recharts, Leaflet e React-Leaflet
- **Backend/DB/Auth:** Supabase (Auth, Database, Edge Functions)
- **IA:** Google Gemini (via Edge Function `gemini-assistant`)
- **Geração de documentos:** jsPDF + jspdf-autotable

## Como rodar localmente

### Pré-requisitos

- Node.js 20+ (recomendado)
- npm
- Projeto Supabase configurado

### 1) Instalar dependências

```bash
npm install
```

### 2) Configurar variáveis de ambiente

Crie um arquivo `.env.local` na raiz do projeto com:

```env
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

> A chave do Gemini (`GEMINI_API_KEY`) é utilizada na Edge Function do Supabase (`supabase/functions/gemini-assistant`) e deve ser configurada no ambiente do Supabase.

### 3) Rodar em desenvolvimento

```bash
npm run dev
```

Aplicação disponível em: `http://localhost:3000`

### 4) Build de produção (opcional)

```bash
npm run build
npm run preview
```

## Estrutura do projeto (visão geral)

- `components/` — componentes e views da aplicação
- `services/` — integrações e regras de negócio
- `lib/` — clientes e utilitários base (ex.: Supabase)
- `utils/` — utilitários auxiliares
- `supabase/functions/` — funções de borda (Edge Functions)

## Como contribuir

Contribuições são bem-vindas e essenciais para a missão da MIRA.

1. Faça um fork do repositório
2. Crie uma branch para sua melhoria (`feat/minha-melhoria`)
3. Faça commits objetivos e descritivos
4. Abra um Pull Request explicando contexto, motivação e impacto

Boas práticas para PRs:

- Manter mudanças focadas em um único objetivo
- Evitar regressões e validar fluxo principal localmente
- Descrever claramente alterações sensíveis (segurança, autenticação, dados)

## Segurança e uso responsável

- Não publique segredos, chaves ou tokens em issues/PRs.
- Em caso de falhas de segurança, priorize relato responsável.
- Consulte [SECURITY_REPORT.md](SECURITY_REPORT.md) e [PROTECTED_CONTENT.md](PROTECTED_CONTENT.md) para contexto de segurança e proteção de conteúdo.

## Governança e licença

- Este projeto é comunitário e sem fins lucrativos.
- O arquivo de licença ainda deve ser formalizado no repositório para definir os termos oficiais de uso e distribuição.

## Comunidade

Se você acredita em tecnologia como instrumento de justiça social, este projeto é para você.

Cada contribuição de código, revisão, documentação, tradução ou validação com usuários reais ajuda a tornar a MIRA mais útil, segura e humana.


