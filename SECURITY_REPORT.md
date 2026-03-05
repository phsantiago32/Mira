# Relatório de Vulnerabilidades e Correções de Segurança

**Projeto:** MIRA  
**Data:** Março de 2026  
**Tipo de Auditoria:** Revisão de Segurança — Exposição de Credenciais em Repositório Git  
**Severidade Geral:** 🔴 Crítica

---

## Resumo Executivo

Foi identificada a exposição de credenciais sensíveis diretamente no código-fonte do repositório. Tokens de API, senhas de contas de utilizador e chaves SMTP estavam armazenados em texto simples em ficheiros rastreados pelo Git, o que constitui uma vulnerabilidade crítica. Um actor malicioso com acesso ao repositório (mesmo que privado, bastaria uma fuga de acesso ou um colaborador desonesto) poderia usar essas credenciais para comprometer totalmente a base de dados, os dados dos utilizadores e os serviços de e-mail.

Todas as vulnerabilidades identificadas foram corrigidas neste pull request.

---

## Vulnerabilidades Identificadas

### VUL-01 — Token Supabase Hardcoded em Scripts de Administração
- **Severidade:** 🔴 Crítica  
- **Ficheiros afetados:**
  - `check_admin_rls.mjs`
  - `check_all_fk.mjs`
  - `check_denied_rls.mjs`
  - `check_fk.mjs`
  - `check_profile_rls.mjs`
  - `check_tables.mjs`
  - `check_users.mjs`
  - `fix_admin_deletes_all.mjs`
  - `fix_deletes_rls.mjs`
  - `fix_rls.mjs`
  - `prep_test.mjs`
  - `query_rls.mjs`
- **Descrição:** Um token pessoal de acesso à API de gestão do Supabase (`sbp_94aeed3...`) estava codificado diretamente em 12 scripts de administração. Esse token concede acesso privilegiado à Management API do Supabase, permitindo operações como leitura e modificação de políticas RLS, gestão de utilizadores e alterações de configuração do projeto.
- **Impacto potencial:** Acesso total à base de dados de produção, capacidade de alterar ou eliminar políticas de segurança RLS, exfiltração de dados de utilizadores.

---

### VUL-02 — Credenciais de Utilizadores de Teste Hardcoded
- **Severidade:** 🔴 Crítica  
- **Ficheiros afetados:**
  - `test_login.cjs`
  - `test_login2.cjs`
  - `test_login3.cjs`
  - `test_supabase_auth.mjs`
- **Descrição:** Endereços de e-mail e senhas de contas reais (utilizador comum e administrador) estavam escritos em texto simples nos scripts de teste automatizado.
  - Utilizador comum: `amandajhonnes@yahoo.com.br` / `Britney`
  - Administrador: `amandasabreu@gmail.com` / `Britney`
- **Impacto potencial:** Acesso não autorizado à aplicação como utilizador comum ou como administrador, incluindo acesso ao painel AdminHub com permissões totais de gestão.

---

### VUL-03 — Senha SMTP do Serviço de E-mail Exposta
- **Severidade:** 🔴 Crítica  
- **Ficheiro afetado:** `auth_config.json`
- **Descrição:** O ficheiro `auth_config.json` continha a configuração completa de autenticação do Supabase, incluindo a senha do servidor SMTP (serviço Resend) — um token de 64 caracteres em texto simples. Este ficheiro era rastreado pelo Git.
- **Impacto potencial:** Uso não autorizado do serviço de e-mail para envio de spam, phishing ou e-mails fraudulentos em nome do projeto MIRA.

---

### VUL-04 — Credenciais de Acesso Armazenadas em Ficheiro de Documentação
- **Severidade:** 🟠 Alta  
- **Ficheiro afetado:** `PROTECTED_CONTENT.md`
- **Descrição:** Credenciais de contas (e-mail e senha) de utilizador comum e de administrador estavam documentadas em texto simples no ficheiro `PROTECTED_CONTENT.md`, rastreado pelo Git.
- **Impacto potencial:** Mesmo impacto da VUL-02 — acesso não autorizado à aplicação e ao painel de administração.

---

### VUL-05 — Ausência de `.gitignore` para Ficheiros Sensíveis
- **Severidade:** 🟡 Média  
- **Descrição:** O ficheiro `.gitignore` não excluía ficheiros potencialmente sensíveis como `.env`, `auth_config.json`, ficheiros de resultado de queries RLS e screenshots de testes. Isso aumentava o risco de exposição acidental de credenciais em futuras alterações.
- **Impacto potencial:** Exposição inadvertida de credenciais em commits futuros.

---

## Correções Aplicadas

### FIX-01 — Substituição de Tokens Hardcoded por Variáveis de Ambiente
- **Resolve:** VUL-01  
- **Descrição:** Nos 12 scripts de administração afetados, as linhas com o token e o `ref` do projeto foram substituídas por leitura de variáveis de ambiente:
  ```js
  // Antes (vulnerável)
  const token = 'sbp_94aeed3fe712bdf7ff4a5c4301037568675fd933';
  const ref = 'ychwhxkxsxmuvabxlyjn';

  // Depois (seguro)
  const token = process.env.SUPABASE_TOKEN;
  const ref = process.env.SUPABASE_PROJECT_REF;

  if (!token || !ref) {
    console.error('Error: SUPABASE_TOKEN and SUPABASE_PROJECT_REF environment variables must be set.');
    process.exit(1);
  }
  ```

---

### FIX-02 — Substituição de Credenciais de Teste por Variáveis de Ambiente
- **Resolve:** VUL-02  
- **Descrição:** Nos 4 scripts de teste, as credenciais hardcoded foram substituídas por variáveis de ambiente com validação de presença:
  ```js
  // Antes (vulnerável)
  await page.type('input[type="text"]', 'amandajhonnes@yahoo.com.br');
  await page.type('input[type="password"]', 'Britney');

  // Depois (seguro)
  const testEmail = process.env.TEST_USER_EMAIL;
  const testPassword = process.env.TEST_USER_PASSWORD;
  if (!testEmail || !testPassword) {
    console.error('Error: TEST_USER_EMAIL and TEST_USER_PASSWORD environment variables must be set.');
    process.exit(1);
  }
  await page.type('input[type="text"]', testEmail);
  await page.type('input[type="password"]', testPassword);
  ```
  O mesmo padrão foi aplicado para as credenciais de administrador (`TEST_ADMIN_EMAIL` / `TEST_ADMIN_PASSWORD`).

---

### FIX-03 — Redação da Senha SMTP e Exclusão do Ficheiro de Configuração
- **Resolve:** VUL-03  
- **Descrição:** O valor da senha SMTP em `auth_config.json` foi substituído pelo marcador `REDACTED_ROTATE_THIS_TOKEN` e o ficheiro foi adicionado ao `.gitignore` para não ser rastreado em commits futuros.
  > ⚠️ **Ação Necessária:** O token SMTP original foi exposto no histórico Git. **É obrigatório revogar e regenerar o token no painel do Resend** (<https://resend.com/api-keys>), mesmo que o repositório seja privado.

---

### FIX-04 — Remoção de Credenciais do Ficheiro de Documentação
- **Resolve:** VUL-04  
- **Descrição:** As credenciais de e-mail e senha foram removidas do `PROTECTED_CONTENT.md` e substituídas por referência a um gestor de palavras-passe:
  ```markdown
  // Antes
  **Email**: `amandajhonnes@yahoo.com.br`
  **Senha**: `Britney`

  // Depois
  **Email**: *(ver gestor de palavras-passe)*
  **Senha**: *(ver gestor de palavras-passe)*
  ```

---

### FIX-05 — Atualização do `.gitignore` e Criação do `.env.example`
- **Resolve:** VUL-05  
- **Descrição:** O ficheiro `.gitignore` foi atualizado para excluir:
  - Ficheiros `.env` e variantes (`.env.local`, `.env.*.local`)
  - Ficheiros de configuração de autenticação (`auth_config.json`, `auth_config_after.json`, `auth_update.json`)
  - Ficheiros de resultado de queries (`rls_checked.json`, `rls_out.json`, `fk_checked.json`, `all_fk_checked.json`, `tables_checked.json`)
  - Screenshots de testes (`test_admin_screenshot.png`)
- Foi criado um ficheiro `.env.example` como template documentado com todas as variáveis de ambiente necessárias, sem valores reais.

---

## Ações Recomendadas Pós-Correção

| Prioridade | Ação | Responsável |
|------------|------|-------------|
| 🔴 Imediata | Revogar e regenerar o token Supabase (`sbp_94aeed3...`) no painel do Supabase → Settings → API | Proprietária do projeto |
| 🔴 Imediata | Revogar e regenerar o token SMTP no painel do Resend | Proprietária do projeto |
| 🔴 Imediata | Alterar a senha das contas `amandajhonnes@yahoo.com.br` e `amandasabreu@gmail.com` / `amandasabreu89@gmail.com` | Proprietária do projeto |
| 🟠 Alta | Verificar o histórico Git para garantir que não há outros segredos expostos em commits anteriores (usar ferramentas como `git-secrets` ou `truffleHog`) | Proprietária do projeto |
| 🟡 Média | Configurar o ficheiro `.env` com as variáveis corretas em todos os ambientes de desenvolvimento e produção | Equipa de desenvolvimento |
| 🟡 Média | Considerar a adoção de um gestor de segredos (ex: GitHub Secrets, Vercel Environment Variables, HashiCorp Vault) | Equipa de desenvolvimento |

---

## Resumo de Segurança Final

| ID | Vulnerabilidade | Severidade | Status |
|----|----------------|------------|--------|
| VUL-01 | Token Supabase hardcoded em scripts | 🔴 Crítica | ✅ Corrigido |
| VUL-02 | Credenciais de teste hardcoded | 🔴 Crítica | ✅ Corrigido |
| VUL-03 | Senha SMTP exposta em auth_config.json | 🔴 Crítica | ✅ Corrigido (redacted + gitignored) |
| VUL-04 | Credenciais em ficheiro de documentação | 🟠 Alta | ✅ Corrigido |
| VUL-05 | Ausência de .gitignore para ficheiros sensíveis | 🟡 Média | ✅ Corrigido |

> **Nota Importante:** As correções neste PR eliminam a exposição futura das credenciais. No entanto, como os valores estavam no histórico Git, **é essencial revogar e regenerar todos os tokens e senhas afetados** listados acima, independentemente de o repositório ser público ou privado.
