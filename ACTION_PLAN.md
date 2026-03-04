# PLANO DE IMPLEMENTAÇÃO E CORREÇÃO DO MIRA APP

Este plano detalha o passo-a-passo e a arquitetura das soluções propostas para garantir o pleno funcionamento da gestão e do download de conteúdos. Nenhuma lógica será apagada, e o UX previamente estabelecido continuará intacto.

## 1. Correção do Download de PDF (`DocumentAssistant.tsx`)
**O Problema**: Atualmente, a aplicação tenta intercetar o output binário (`doc.output('blob')`) com um link temporal (`document.createElement('a')`). Muitos navegadores desrespeitam o atributo `download` e guardam o ficheiro sem extensão (`.pdf`), tornando o arquivo localmente inutilizável pelo sistema operativo.
**A Solução**:
- Substituir o hack de `URL.createObjectURL(blob)` por `pdfResult.doc.save(finalName)`. O método `save()` do próprio `jsPDF` obriga a construção do form-data correspondente a `application/pdf`, resolvendo a codificação de download de forma nativa e sem necessidade de manutenções futuras.

## 2. Aprimorar Vídeo de Splash (`SplashScreen.tsx`)
**O Problema**: A tag `<video>` está com a propriedade estática `muted`, o que anula o áudio. Além disso, as formatações de redimensionamento usam regras standard (`sm:object-contain`), que comprometem o full-screen premium em dispositivos móveis.
**A Solução**:
- Adicionar no state internamente um `isMuted` inicializado a `false`.
- A tag `<video>` passará a obedecer a este state, tocando áudio imediatamente. Para obviar o auto-play (que alguns browsers móveis bloqueiam se tiver som agressivo), adicionar um botão no topo direito/inferior caso a pessoa queira emudecer a experiência facilmente.
- Ajustar a class de redimensionamento do vídeo para `w-full h-full object-cover`, de modo a não exibir distorções ou faixas pretas independentemente do frame rate e size da tela (mobile responsivo).

## 3. Moderação Completa (Deletar Usuários, Posts e Queixas em `AdminHub.tsx` e `adminService.ts`)
**O Problema**:
- **Usuários**: A Central até ao momento apenas tem o painel para *"Bloquear"* (Suspender) utilizadores.
- **Foreign Keys**: Apagar um Post/Sugestão/Denúncia muitas vezes falha no silêncio por falta de regras `ON DELETE CASCADE` ao nível da DB ou de transações aninhadas.
**A Solução**:
- Em `AdminHub.tsx` > Aba "Usuários", integrar um botão `Trash2` chamando o já existente `adminService.deleteUser()`, com re-solicitação visual (Alerta de Confirmação).
- Corrigir relatórios nos métodos de apagar.
- Em `AdminHub.tsx` > Aba "Denúncias", permitir dois botões: [ Descartar Denúncia ] (apaga unicamente o report) e [ Excluir Conteúdo & Report ] (apaga o que a pessoa escreveu + a notificação respetiva).

## 4. Visualização Integral do Conteúdo Denunciado
**O Problema**: As Denúncias vindas de formulários diretos (`reports` rest api format) não enviam de imediato o Post relacionado via foreign keys no client-side `AdminHub`.
**A Solução**:
- Fortalecer a busca no `adminService.fetchCommunityReports()`. Em vez de unicamente dizer "Motivo", iremos associá-lo ativamente a sub-tabelas como "Tópicos de Fórum". E na UI faremos um card duplo: "Motivo" -> "Post Escrito".

## 5. Eliminar Botões Duplicados de Sync
**O Problema**: A sincronização de Vagas de Emprego aparece como botões complexos no `AdminHub.tsx` (aba `sync`) **E** no `DashboardView.tsx` (Gerir). Foi um equívoco arquitetural manter nos dois sítios, causando bugs de concorrência.
**A Solução**:
- Manter o uso dos Botões de Pipelines da AIMA e IEFP estritamente na rota de Automação do Gestor em `DashboardView.tsx`.
- Romper / Excluir inteiramente a tab `sync` dentro de `components/AdminHub.tsx`, deixando a UI do AdminHub para a sua verdadeira especialidade: **A moderação humana**.

---

**Resumo das Operações Próximas**:
✅ `DocumentAssistant.tsx` (Corrigir logic de Save)
✅ `SplashScreen.tsx` (Remover Mute e add Toggles premium + ObjectCover)
✅ `AdminHub.tsx` (Criar buttons e views de Delete)
✅ `adminService.ts` (Corrigir handlers)

Este plano protege integralmente o seu fluxo. Quando aprovado, irei executar cirurgicamente.
