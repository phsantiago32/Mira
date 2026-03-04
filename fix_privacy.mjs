import fs from 'fs';

let text = fs.readFileSync('./utils/translations.ts', 'utf8');

const keys = {
    privacy_title: "Segurança e Direitos",
    privacy_subtitle: "TRANSPARÊNCIA MIRA",
    legal_s_title: "Declaração Legal e de Responsabilidade – MIRA App",
    legal_s_p1: "O MIRA é uma plataforma digital de informação e apoio social, desenvolvida com o objetivo de facilitar o acesso de imigrantes a serviços públicos, direitos e procedimentos oficiais em Portugal.",
    legal_s_p2: "Todas as informações disponibilizadas têm caráter estritamente informativo, educativo e de utilidade pública, baseando-se em fontes oficiais (AIMA, GOV.PT, IRN, IEFP, SNS, Segurança Social, Autarquias Locais, entre outras).",
    legal_s_p3: "🔒 O MIRA não presta, em hipótese alguma, consultoria jurídica individualizada, representação legal, ou serviços de advocacia. Nenhuma informação apresentada neste aplicativo deve ser interpretada como parecer jurídico, recomendação profissional ou garantia de sucesso em processos.",
    privacy_s1_title: "Conteúdo Protegido e Copyright",
    privacy_s1_p1: "Esta plataforma e todo o seu conteúdo são protegidos por direitos de autor.",
    privacy_s1_p2: "A marca MIRA, base de dados de serviços e lógica da plataforma são propriedade intelectual de Amanda Silva Abreu.",
    privacy_s1_box_title: "Uso Comercialmente Proibido",
    privacy_s1_box_p: "Qualquer extração em massa (scraping), reprodução para venda ou uso indevido resultará em bloqueio imediato.",
    privacy_s2_title: "Reputação e Conduta",
    privacy_s2_p1: "O MIRA valoriza quem ajuda a comunidade. Os utilizadores ganham pontos consoante a atividade.",
    privacy_s2_badge1_desc: "Primeiros 100 utilizadores fundadores da aplicação.",
    privacy_s2_badge2_desc: "Verificador da comunidade.",
    privacy_s2_badge3_desc: "Recebeu boa reputação no fórum.",
    privacy_s2_badge4_desc: "Gerou vários documentos com a MIRA.",
    privacy_s2_badge5_desc: "Ajudou a mapear novos estabelecimentos.",
    privacy_s2_badge6_desc: "Mentoria e educação na comunidade.",
    privacy_s2_badge7_desc: "Manteve um histórico impecável de uso seguro.",
    privacy_s2_badge8_desc: "Estudante e interessado em evoluir a sua carreira.",
    privacy_s2_badge9_desc: "Interação fluente com as respostas IA.",
    privacy_s2_badge10_desc: "Pilar inspirador e inabalável da comunidade.",
    privacy_s2_box_title: "ATENÇÃO E SUSPENSÕES",
    privacy_s2_box_p: "A má conduta leva à suspensão da conta, nomeadamente:",
    privacy_s2_rule1_title: "Ódio / Racismo:",
    privacy_s2_rule1_desc: "Banimento imediato para falas xenófobas.",
    privacy_s2_rule2_title: "Notícias Falsas:",
    privacy_s2_rule2_desc: "Disseminação de desinformação não sustentada.",
    privacy_s2_rule3_title: "Fraudes:",
    privacy_s2_rule3_desc: "Venda de vagas AIMA e esquemas prejudiciais.",
    privacy_s3_title: "Isenção - Formulários",
    privacy_s3_box_title: "Aviso Oficial",
    privacy_s3_box_p: "A reprodução dos formulários tem finalidade académica e de utilidade de preenchimento.",
    privacy_s3_p1: "As informações provêm dos modelos originais do Estado.",
    privacy_s3_p2: "A validação é exclusiva das autoridades competentes.",
    privacy_s3_p3: "O MIRA não detém qualquer afiliação governamental orgânica com a AIMA.",
    privacy_s3_p4: "É inteiramente responsável por todos os dados pessoais inseridos na app para criação PDF.",
    privacy_s3_p5: "O Chat MIRA não solicita dados financeiros.",
    privacy_s3_p6: "Cruze legalidades com portais oficiais sempre.",
    privacy_s3_p7: "Servimos estritamente como agente facilitador de interface.",
    privacy_s3_p8: "App sujeita ao normal RGPD da UE.",
    privacy_s3_p9: "Em casos complexos, consulte um advogado com cédula profissional ativa.",
    privacy_s4_title: "Dados Privados da Sua Sessão",
    privacy_s4_p1: "O MIRA opera sob base de transparência europeia (RGPD):",
    privacy_s4_rule1_title: "Uso Mínimo Base:",
    privacy_s4_rule1_desc: "Não vendemos nem partilhamos perfiles com corretores externos.",
    privacy_s4_rule2_title: "Privacidade e Ofuscação:",
    privacy_s4_rule2_desc: "As credenciais vitais, como o seu email, e-mail não são visíveis aos outros membros publicamente.",
    privacy_s4_rule3_title: "Apagamento (Art. 17):",
    privacy_s4_rule3_desc: "Poderá apagar a sua conta em definitivo pelas definições da aplicação.",
    privacy_s4_btn: "BAIXAR RESUMO DOS MEUS DADOS",
    privacy_s5_title: "O Motor de Inteligência Artificial",
    privacy_s5_p1: "A MIRA responde consoante inferências sobre leis públicas e perguntas recorrentes que são partilhadas nos foros de CPLP.",
    privacy_s5_box1_title: "MEMÓRIA VOLÁTIL",
    privacy_s5_box1_desc: "As conversas e dúvidas submetidas no chat são restritas.",
    privacy_s5_box2_title: "ALUCINAÇÃO DO MOTOR",
    privacy_s5_box2_desc: "Por natureza, sistemas generativos LLM podem conter falhas contextuais (alucinações). Recomendamos vivamente verificação oficial adicional.",
    privacy_s6_title: "Mapas e Interações de Bússola",
    privacy_s6_p1: "Serviço de geo-localização está dependente do Leaflet.",
    privacy_s6_p2: "Se conceder acesso ao sinal GPS não ficaremos com o rasto da sua origem guardado.",
    privacy_s6_box_title: "Classificações Comunitárias e Feedback",
    privacy_s6_box_desc: "O MIRA não se responsabiliza pelas avaliações ruins dos cartórios, finanças ou AIMA - refletem puramente o relato e a voz da audiência, isentando a aplicação de responsabilidade administrativa.",
    privacy_s7_title: "Termos da Comunidade MIRA e Diálogos",
    privacy_s7_p1: "O Fórum baseia-se num espírito solidário intrínseco. As seguintes transgressões são alvo de análise por administradores globais:",
    privacy_s7_li1: "Condutas imaturas, insultos e falta de tato social com dor e tempo de espera de requerentes ou membros novatos.",
    privacy_s7_li2: "Exposição dos números sigilosos das Finanças, SS ou AR. Nós mesmos vamos filtrar estes números para lhe salvar do Fórum mas mantenha precaução.",
    privacy_s7_li3: "Oferta clandestina de \"serviços maravilha\" para acelerar filas institucionais em Lisboa.",
    privacy_s7_li4: "Tolerância absoluta a 0% na partilha de métodos falsos e extorsões relativas à manifestações CPLP."
};

let matchPt = text.match(/wizard_footer_note_text:\s+"As regras podem mudar[^"]+",/);
let matchEn = text.match(/wizard_footer_note_text:\s+"Rules may change[^"]+",/);
let matchEs = text.match(/wizard_footer_note_text:\s+"Las reglas pueden cambiar[^"]+",/);
let matchFr = text.match(/wizard_footer_note_text:\s+"Les règles peuvent changer[^"]+",/);

if (text.indexOf('privacy_title') === -1) {
    let toAppend = Object.entries(keys).map(([k, v]) => `      ${k}: ${JSON.stringify(v)},`).join('\n');
    let toAppendEn = Object.entries(keys).map(([k, v]) => `      ${k}: ${JSON.stringify("[EN] " + v)},`).join('\n');
    let toAppendEs = Object.entries(keys).map(([k, v]) => `      ${k}: ${JSON.stringify("[ES] " + v)},`).join('\n');
    let toAppendFr = Object.entries(keys).map(([k, v]) => `      ${k}: ${JSON.stringify("[FR] " + v)},`).join('\n');

    let t = text;

    // Replace in PT (first occurrence)
    t = t.replace(/(wizard_footer_note_text:\s+"As regras podem mudar[^"]+",)/, "$1\n" + toAppend);

    // EN
    t = t.replace(/(wizard_footer_note_text:\s+"Rules may change[^"]+",)/, "$1\n" + toAppendEn);

    // ES
    t = t.replace(/(wizard_footer_note_text:\s+"Las reglas pueden cambiar[^"]+",)/, "$1\n" + toAppendEs);

    // FR
    t = t.replace(/(wizard_footer_note_text:\s+"Les règles peuvent changer[^"]+",)/, "$1\n" + toAppendFr);

    fs.writeFileSync('./utils/translations.ts', t);
    console.log("Translations successfully updated.");
} else {
    console.log("Failed to find injection point or translations already exist.");
}
