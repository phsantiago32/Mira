# 🔒 Relatório de Auditoria de Segurança — MIRA

**Data:** 05 de Março de 2026  
**Repositório:** `phsantiago32/Mira`  
**Branch auditada:** `copilot/conduct-security-audit`  
**Auditor:** GitHub Copilot Coding Agent  

---

## Resumo Executivo

Foi realizada uma auditoria de segurança completa no código-fonte do repositório MIRA com foco na deteção de **credenciais, tokens de API e segredos expostos em texto simples**. Foram identificadas **5 categorias de vulnerabilidades**, afetando **20 ficheiros**, com gravidade entre Alta e Crítica. Todas as vulnerabilidades foram corrigidas neste Pull Request.

> ⚠️ **Ação obrigatória pela proprietária:** como os segredos estiveram presentes no histórico Git, **todos os tokens e palavras-passe afetados devem ser revogados/alterados imediatamente**, independentemente da visibilidade do repositório.

---

## Índice

1. [VUL-01 — Token de Acesso Pessoal do Supabase exposto](#vul-01)
2. [VUL-02 — Chave SMTP / API do Resend exposta](#vul-02)
3. [VUL-03 — Credenciais de contas de teste em texto simples](#vul-03)
4. [VUL-04 — Credenciais de produção no ficheiro de documentação](#vul-04)
5. [VUL-05 — Ficheiros sensíveis não excluídos pelo `.gitignore`](#vul-05)
6. [Ficheiro `.env.example` adicionado](#env-example)
7. [Ações de resposta obrigatórias](#acoes)
8. [Resumo das alterações por ficheiro](#tabela)

---

## VUL-01 — Token de Acesso Pessoal do Supabase exposto {#vul-01}

| Atributo      | Detalhe |
|---------------|---------|
| **Gravidade** | 🔴 Crítica |
| **Tipo**      | Credencial de serviço (Personal Access Token) |
| **CWE**       | CWE-312 — Armazenamento em texto simples de informação sensível |

### Descrição

O **Personal Access Token (PAT)** do Supabase (`sbp_94aeed3fe712bdf7ff4a5c4301037568675fd933`) e a **referência do projeto** (`ychwhxkxsxmuvabxlyjn`) estavam codificados diretamente em 12 scripts de manutenção/migração. Este token permite acesso administrativo total à base de dados via Supabase Management API, incluindo execução arbitrária de queries SQL e modificação de políticas RLS.

### Ficheiros afetados

| Ficheiro | Tipo de acesso exposto |
|---|---|
| `check_admin_rls.mjs` | Leitura de políticas RLS |
| `check_all_fk.mjs` | Leitura de chaves estrangeiras |
| `check_fk.mjs` | Leitura de chaves estrangeiras |
| `check_denied_rls.mjs` | Leitura de políticas RLS |
| `check_profile_rls.mjs` | Leitura de políticas RLS de perfis |
| `check_tables.mjs` | Listagem de tabelas |
| `check_users.mjs` | Consulta de utilizadores |
| `fix_rls.mjs` | **Modificação** de políticas RLS |
| `fix_admin_deletes_all.mjs` | **Modificação** de políticas RLS |
| `fix_deletes_rls.mjs` | **Modificação** de políticas RLS |
| `query_rls.mjs` | Leitura de políticas RLS |
| `prep_test.mjs` | Inserção de dados de teste |

### Código vulnerável (exemplo)

```js
// ANTES — token exposto em texto simples
const token = 'sbp_94aeed3fe712bdf7ff4a5c4301037568675fd933';
const ref   = 'ychwhxkxsxmuvabxlyjn';
```

### Correção aplicada

```js
// DEPOIS — leitura de variáveis de ambiente com validação obrigatória
const token = process.env.SUPABASE_TOKEN;
const ref   = process.env.SUPABASE_PROJECT_REF;

if (!token || !ref) {
  console.error('Erro: as variáveis SUPABASE_TOKEN e SUPABASE_PROJECT_REF devem estar definidas.');
  process.exit(1);
}
```

**Ação de resposta:** Revogar o token em [Supabase Dashboard → Account → Tokens](https://supabase.com/dashboard/account/tokens) e gerar um novo.

---

## VUL-02 — Chave SMTP / API do Resend exposta {#vul-02}

| Atributo      | Detalhe |
|---------------|---------|
| **Gravidade** | 🔴 Crítica |
| **Tipo**      | Chave de API de serviço de e-mail |
| **CWE**       | CWE-312 — Armazenamento em texto simples de informação sensível |

### Descrição

O ficheiro `auth_config.json` (exportação da configuração do Supabase Auth) continha a chave de API do serviço **Resend** em texto simples no campo `smtp_pass`. Esta chave permite ao portador enviar e-mails em nome da aplicação MIRA, potencialmente usada para phishing ou spam, e pode gerar custos não autorizados.

```json
// ANTES — chave de API real exposta
"smtp_pass": "5b343ad1e76dbf87b8f204c5e01afcf831fbe46b055ca7926573e5bd7f108fec"
```

### Correção aplicada

```json
// DEPOIS — valor redacted com indicação de rotação obrigatória
"smtp_pass": "REDACTED_ROTATE_THIS_TOKEN"
```

Adicionalmente, `auth_config.json`, `auth_config_after.json` e `auth_update.json` foram adicionados ao `.gitignore` para impedir futuros commits acidentais.

**Ação de resposta:** Aceder ao painel do [Resend](https://resend.com/api-keys) e revogar a chave comprometida, criando uma nova.

---

## VUL-03 — Credenciais de contas de teste em texto simples {#vul-03}

| Atributo      | Detalhe |
|---------------|---------|
| **Gravidade** | 🟠 Alta |
| **Tipo**      | Credenciais de autenticação (email + senha) |
| **CWE**       | CWE-798 — Uso de credenciais codificadas diretamente |

### Descrição

Quatro scripts de teste continham os endereços de e-mail reais e a senha das contas de utilizador e administrador da aplicação MIRA codificados diretamente no código-fonte.

### Ficheiros afetados e código vulnerável

```js
// test_login.cjs e test_login2.cjs
await page.type('input[type="text"]',     'amandajhonnes@yahoo.com.br');
await page.type('input[type="password"]', 'Britney');

// test_login3.cjs
await page.type('input[type="text"]',     'amandasabreu@gmail.com');
await page.type('input[type="password"]', 'Britney');

// test_supabase_auth.mjs
await supabase.auth.signInWithPassword({
    email:    'amandasabreu@gmail.com',
    password: 'Britney'
});
```

### Correção aplicada

```js
// DEPOIS — variáveis de ambiente com validação
const testEmail    = process.env.TEST_USER_EMAIL;
const testPassword = process.env.TEST_USER_PASSWORD;

if (!testEmail || !testPassword) {
    console.error('Erro: TEST_USER_EMAIL e TEST_USER_PASSWORD devem estar definidas.');
    process.exit(1);
}
```

**Ação de resposta:** Alterar a senha das duas contas afetadas no Supabase Auth.

---

## VUL-04 — Credenciais de produção no ficheiro de documentação {#vul-04}

| Atributo      | Detalhe |
|---------------|---------|
| **Gravidade** | 🟠 Alta |
| **Tipo**      | Credenciais de autenticação (email + senha) em Markdown |
| **CWE**       | CWE-312 — Armazenamento em texto simples de informação sensível |

### Descrição

O ficheiro `PROTECTED_CONTENT.md` continha uma secção intitulada **"ACESSOS E CREDENCIAIS OFICIAIS"** com os e-mails e a senha de ambas as contas (utilizador comum e administrador) em texto simples, versionados no repositório.

```markdown
<!-- ANTES -->
**Utilizador Comum:**
- **Email**: `amandajhonnes@yahoo.com.br`
- **Senha**: `Britney`

**Admin Hub (Acesso Total):**
- **Email**: `amandasabreu89@gmail.com`
- **Senha**: `Britney`
```

### Correção aplicada

```markdown
<!-- DEPOIS -->
**Utilizador Comum:**
- **Email**: *(ver gestor de palavras-passe)*
- **Senha**: *(ver gestor de palavras-passe)*

**Admin Hub (Acesso Total):**
- **Email**: *(ver gestor de palavras-passe)*
- **Senha**: *(ver gestor de palavras-passe)*
```

Adicionado aviso a recomendar o uso de um gestor de palavras-passe (ex: Bitwarden, 1Password).

---

## VUL-05 — Ficheiros sensíveis não excluídos pelo `.gitignore` {#vul-05}

| Atributo      | Detalhe |
|---------------|---------|
| **Gravidade** | 🟡 Média |
| **Tipo**      | Configuração incorreta de controlo de versão |
| **CWE**       | CWE-200 — Exposição de informação sensível |

### Descrição

O `.gitignore` não excluía vários ficheiros que não deveriam ser versionados:

- **Ficheiros de configuração de autenticação** (`auth_config.json`, `auth_config_after.json`, `auth_update.json`) — exportações do Supabase Auth que podem conter tokens, segredos de OAuth e chaves SMTP.
- **Artefactos de output de scripts** (`rls_checked.json`, `rls_out.json`, `fk_checked.json`, `all_fk_checked.json`, `tables_checked.json`) — resultados de queries à base de dados que expõem a estrutura interna do esquema.
- **Capturas de ecrã de testes** (`test_admin_screenshot.png`) — podem revelar dados de utilizadores reais.
- **Ficheiros de variáveis de ambiente** (`.env`, `.env.local`, `.env.*.local`) — não estavam totalmente cobertos pela regra `*.local` existente.

### Correção aplicada

Adicionadas as seguintes entradas ao `.gitignore`:

```gitignore
# Environment files – never commit secrets
.env
.env.local
.env.*.local

# Supabase auth config exports – may contain SMTP tokens and other secrets
auth_config.json
auth_config_after.json
auth_update.json

# Script output / query result artifacts
rls_checked.json
rls_out.json
fk_checked.json
all_fk_checked.json
tables_checked.json

# Test screenshots
test_admin_screenshot.png
```

---

## Ficheiro `.env.example` adicionado {#env-example}

Foi criado o ficheiro `.env.example` para documentar todas as variáveis de ambiente necessárias ao projeto, facilitando a configuração por novos colaboradores sem necessidade de partilhar segredos reais:

```dotenv
# Supabase (frontend)
VITE_SUPABASE_URL=https://<your-project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-supabase-anon-key>

# Supabase Management API (scripts lado servidor)
SUPABASE_TOKEN=<your-supabase-personal-access-token>
SUPABASE_PROJECT_REF=<your-supabase-project-ref>

# Credenciais de teste
TEST_USER_EMAIL=<test-user@example.com>
TEST_USER_PASSWORD=<test-user-password>
TEST_ADMIN_EMAIL=<admin@example.com>
TEST_ADMIN_PASSWORD=<admin-password>
```

---

## ⚠️ Ações de Resposta Obrigatórias {#acoes}

Como os segredos estiveram presentes no histórico Git, a sua simples remoção do código não é suficiente — **os tokens devem ser revogados e substituídos imediatamente**.

| Prioridade | Ação | Serviço |
|---|---|---|
| 🔴 **Urgente** | Revogar o Personal Access Token `sbp_94aeed...` | [Supabase → Account → Tokens](https://supabase.com/dashboard/account/tokens) |
| 🔴 **Urgente** | Revogar a chave de API Resend `5b343ad1...` | [Resend → API Keys](https://resend.com/api-keys) |
| 🟠 **Alta** | Alterar a senha da conta `amandajhonnes@yahoo.com.br` | Supabase Auth / e-mail |
| 🟠 **Alta** | Alterar a senha da conta `amandasabreu89@gmail.com` | Supabase Auth / e-mail |
| 🟡 **Recomendado** | Considerar fazer `git filter-repo` ou contactar o GitHub para expurgar o histórico | GitHub Support |
| 🟡 **Recomendado** | Configurar o [GitHub Secret Scanning](https://docs.github.com/en/code-security/secret-scanning) para alertas automáticos futuros | GitHub Settings → Security |

---

## Resumo das Alterações por Ficheiro {#tabela}

| Ficheiro | Alteração | Vulnerabilidade corrigida |
|---|---|---|
| `check_admin_rls.mjs` | Token e ref → variáveis de ambiente | VUL-01 |
| `check_all_fk.mjs` | Token e ref → variáveis de ambiente | VUL-01 |
| `check_fk.mjs` | Token e ref → variáveis de ambiente | VUL-01 |
| `check_denied_rls.mjs` | Token e ref → variáveis de ambiente | VUL-01 |
| `check_profile_rls.mjs` | Token e ref → variáveis de ambiente | VUL-01 |
| `check_tables.mjs` | Token e ref → variáveis de ambiente | VUL-01 |
| `check_users.mjs` | Token e ref → variáveis de ambiente | VUL-01 |
| `fix_rls.mjs` | Token e ref → variáveis de ambiente | VUL-01 |
| `fix_admin_deletes_all.mjs` | Token e ref → variáveis de ambiente | VUL-01 |
| `fix_deletes_rls.mjs` | Token e ref → variáveis de ambiente | VUL-01 |
| `query_rls.mjs` | Token e ref → variáveis de ambiente | VUL-01 |
| `prep_test.mjs` | Token e ref → variáveis de ambiente | VUL-01 |
| `auth_config.json` | `smtp_pass` redacted | VUL-02 |
| `test_login.cjs` | Email/senha → variáveis de ambiente | VUL-03 |
| `test_login2.cjs` | Email/senha → variáveis de ambiente | VUL-03 |
| `test_login3.cjs` | Email/senha → variáveis de ambiente | VUL-03 |
| `test_supabase_auth.mjs` | Email/senha → variáveis de ambiente | VUL-03 |
| `PROTECTED_CONTENT.md` | Credenciais removidas | VUL-04 |
| `.gitignore` | Regras adicionadas para ficheiros sensíveis | VUL-05 |
| `.env.example` | Criado (novo ficheiro) | Boas práticas |

---

*Relatório gerado automaticamente pelo GitHub Copilot Coding Agent · MIRA Security Audit · 2026-03-05*
