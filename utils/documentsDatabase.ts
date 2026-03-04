import { DocumentTemplate, CATEGORIES } from '../types';

export const standardFields = [
    { id: 'full_name', label: 'Nome Completo', placeholder: 'Conforme documento de identificação', type: 'text' },
    { id: 'nationality', label: 'Nacionalidade', placeholder: 'País de origem', type: 'text' },
    { id: 'passport_num', label: 'N.º de Passaporte / ID', placeholder: 'Número oficial do documento', type: 'text' },
    { id: 'nif', label: 'NIF (Opcional)', placeholder: 'Número de Identificação Fiscal', type: 'text' },
    { id: 'niss', label: 'NISS (Opcional)', placeholder: 'Segurança Social', type: 'text' },
    { id: 'address', label: 'Morada de Residência', placeholder: 'Rua, n.º, CP e Localidade', type: 'text' },
    { id: 'city', label: 'Localidade de Assinatura', placeholder: 'Ex: Lisboa', type: 'text' }
];

export const templates: DocumentTemplate[] = [
    // --- RESIDÊNCIA E LEGALIZAÇÃO ---
    {
        id: 'aima_ar_temp', title: 'Requerimento de Autorização de Residência Temporária (Modelo AIMA)', category: CATEGORIES.IMMIGRATION, complexity: 'Hard', authority: 'AIMA', location: 'Balcão AIMA',
        description: 'Modelo oficial para pedido de concessão de Autorização de Residência Temporária.',
        explanation: 'expl_aima_ar_temp',
        purpose: 'Concessão inicial de residência legal em território português.',
        tips: 'Obtido de aima.gov.pt. Verifique se tem todos os anexos de meios de subsistência.',
        requirements: ['Passaporte Válido', 'Visto de Entrada', 'Meios de Subsistência', 'Atestado de Morada'],
        fields: [...standardFields, { id: 'visa_entry', label: 'Tipo de Visto de Entrada', placeholder: 'Ex: D3, D7, CPLP', type: 'text' }]
    },
    {
        id: 'aima_ar_renovacao', title: 'Requerimento de Renovação de Autorização de Residência', category: CATEGORIES.IMMIGRATION, complexity: 'Medium', authority: 'AIMA', location: 'Portal/Balcão AIMA',
        description: 'Pedido para renovar o título de residência antes do fim da sua validade.',
        explanation: 'expl_aima_ar_renovacao',
        purpose: 'Renovação da validade do título de residência atual.',
        tips: 'Deve ser solicitado entre 90 a 30 dias antes da caducidade.',
        requirements: ['Título de Residência Atual', 'Prova de Manutenção de Condições'],
        fields: [...standardFields]
    },
    {
        id: 'aima_dec_alojamento', title: 'Declaração de Alojamento (Residência / Hospitalidade)', category: CATEGORIES.IMMIGRATION, complexity: 'Easy', authority: 'AIMA', location: 'Balcão AIMA / Portal',
        description: 'Documento onde um residente legal atesta que providencia alojamento ao migrante.',
        explanation: 'expl_aima_dec_alojamento',
        purpose: 'Comprovar morada perante as autoridades de imigração.',
        tips: 'Deve ser acompanhado de cópia do BI/CC de quem assina.',
        requirements: ['Identificação do Alojador'],
        fields: [...standardFields, { id: 'host_name', label: 'Nome de quem aloja', placeholder: 'Proprietário ou Residente', type: 'text' }]
    },
    {
        id: 'aima_dec_responsabilidade', title: 'Declaração de Responsabilidade (Reagrupamento Familiar)', category: CATEGORIES.IMMIGRATION, complexity: 'Medium', authority: 'AIMA', location: 'Notário / AIMA',
        description: 'Termo onde o residente se responsabiliza pelos encargos do familiar a reagrupar.',
        explanation: 'expl_aima_dec_responsabilidade',
        purpose: 'Reagrupamento familiar legal sob responsabilidade do residente.',
        tips: 'Necessário para processos de artigo 98.º.',
        requirements: ['ID do Responsável', 'Comprovativo de Rendimentos'],
        fields: [...standardFields, { id: 'family_member', label: 'Nome do Familiar', placeholder: 'A reagrupar', type: 'text' }]
    },
    {
        id: 'aima_dec_sustento', title: 'Declaração de Sustento / Garantia Financeira', category: CATEGORIES.IMMIGRATION, complexity: 'Easy', authority: 'AIMA', location: 'Portal/Balcão AIMA',
        description: 'Prova sob compromisso de honra da posse de meios de subsistência.',
        explanation: 'expl_aima_dec_sustento',
        purpose: 'Demonstrar autonomia financeira perante o Estado.',
        tips: 'Deve bater certo com os extratos bancários apresentados.',
        requirements: ['Extratos Bancários', 'Contrato de Trabalho'],
        fields: [...standardFields, { id: 'income_val', label: 'Valor Mensal (€)', placeholder: 'Ex: 820.00', type: 'number' }]
    },
    {
        id: 'aima_ar_humanitaria', title: 'Requerimento de AR por Razões Humanitárias (Proteção Internacional)', category: CATEGORIES.IMMIGRATION, complexity: 'Hard', authority: 'AIMA', location: 'Balcão AIMA',
        description: 'Pedido de autorização de residência ao abrigo do regime de proteção internacional.',
        explanation: 'expl_aima_ar_humanitaria',
        purpose: 'Proteção legal por motivos de grave risco ou asilo.',
        tips: 'Utilizado em casos de asilo ou proteção subsidiária.',
        requirements: ['Prova de Grave Risco', 'Documento de Identificação'],
        fields: [...standardFields, { id: 'reason_humanitarian', label: 'Motivo do Pedido', placeholder: 'Asilo, Razões Humanitárias', type: 'text' }]
    },
    {
        id: 'crue_req', title: 'Certificado de Registo de Cidadão da União Europeia (UE/EEE)', category: CATEGORIES.IMMIGRATION, complexity: 'Easy', authority: 'Câmara Municipal', location: 'Câmara Municipal Local',
        description: 'Registo obrigatório para cidadãos europeus após 3 meses em Portugal.',
        explanation: 'expl_crue_req',
        purpose: 'Formalizar a residência legal de cidadãos da UE.',
        tips: 'Feito na hora em muitas Câmaras Municipais.',
        requirements: ['Documento ID Europeu', 'Prova de Meios ou Trabalho'],
        fields: [...standardFields]
    },

    {
        id: 'carta_atraso_aima', title: 'Carta Registada: Reclamação Atraso AIMA', category: CATEGORIES.IMMIGRATION, complexity: 'Medium', authority: 'AIMA', location: 'Correios (CTT)',
        description: 'Carta formal registada para instar a AIMA a decidir o processo fora do prazo legal.',
        explanation: 'expl_carta_atraso_aima',
        purpose: 'Fazer prova de contacto e exigir andamento do processo.',
        tips: 'Enviar sempre por Carta Registada com Aviso de Receção (C/AR) e guardar o comprovativo CTT.',
        requirements: ['Número do Processo', 'Comprovativo de Pedido Inicial'],
        fields: [...standardFields, { id: 'process_number', label: 'N.º de Processo/Recibo', placeholder: 'Ex: 123456/2023', type: 'text' }]
    },
    {
        id: 'carta_pedido_informacao', title: 'Carta Registada: Pedido de Informação (Entidades)', category: CATEGORIES.RIGHTS, complexity: 'Easy', authority: 'Entidades Públicas', location: 'Correios (CTT)',
        description: 'Modelo geral para solicitar o estado do processo ou informações a entidades.',
        explanation: 'expl_carta_pedido_informacao',
        purpose: 'Obter justificação por escrito de uma entidade pública (ao abrigo do CPA).',
        tips: 'As entidades têm o dever de responder no prazo legal. Envie por C/AR.',
        requirements: ['Dados de Identificação', 'Destinatário'],
        fields: [...standardFields, { id: 'destination_entity', label: 'Entidade Destinatária', placeholder: 'Ex: Centro Distrital de Lisboa', type: 'text' }]
    },
    {
        id: 'carta_provedor_justica', title: 'Queixa Formal ao Provedor de Justiça', category: CATEGORIES.RIGHTS, complexity: 'Medium', authority: 'Provedor de Justiça', location: 'Correios / Online',
        description: 'Participação por inércia ou má conduta de serviços públicos (ex: AIMA, SS).',
        explanation: 'expl_carta_provedor_justica',
        purpose: 'Recorrer a uma entidade isenta para mediar conflitos estruturais com o Estado.',
        tips: 'Junte cópias de todas as reclamações anteriores (cartas registadas, e-mails).',
        requirements: ['Provas da Inércia', 'Cópia de Cartas Anteriores'],
        fields: [...standardFields, { id: 'complaint_reason', label: 'Motivo da Queixa', placeholder: 'Ex: Atraso abusivo', type: 'text' }]
    },

    // --- REGISTOS E NACIONALIDADE ---
    {
        id: 'irn_nacionalidade_casamento', title: 'Pedido de Nacionalidade Portuguesa (Por Casamento/União)', category: CATEGORIES.RIGHTS, complexity: 'Hard', authority: 'IRN', location: 'Conservatória do Registo Civil',
        description: 'Nacionalidade para cônjuges de portugueses há mais de 3 anos.',
        explanation: 'expl_irn_nacionalidade_casamento',
        purpose: 'Obtenção de cidadania por via do cônjuge.',
        tips: 'A ligação à comunidade é presumida se houver filhos comuns ou tempo de residência.',
        requirements: ['Certidões de Nascimento e Casamento', 'Registo Criminal'],
        fields: [...standardFields, { id: 'spouse_name', label: 'Nome do Cônjuge', placeholder: 'Nome completo', type: 'text' }]
    },
    {
        id: 'irn_nacionalidade_residencia', title: 'Pedido de Nacionalidade Portuguesa (Por Residência)', category: CATEGORIES.RIGHTS, complexity: 'Hard', authority: 'IRN', location: 'Conservatória IRN',
        description: 'Naturalização após 5 anos de residência legal.',
        explanation: 'expl_irn_nacionalidade_residencia',
        purpose: 'Naturalização portuguesa por tempo de permanência.',
        tips: 'O exame CIPLE é obrigatório para falantes de línguas não lusófonas.',
        requirements: ['Certificado Habilitações', 'Registo Criminal'],
        fields: [...standardFields]
    },
    {
        id: 'certidao_civil_req', title: 'Requerimento de Certidão de Nascimento / Casamento / Óbito', category: CATEGORIES.RIGHTS, complexity: 'Easy', authority: 'IRN', location: 'Civil Online / Conservatória',
        description: 'Pedido oficial de atos do registo civil.',
        explanation: 'expl_certidao_civil_req',
        purpose: 'Obtenção de cópias oficiais de atos civis.',
        tips: 'O código de acesso online é válido por 6 meses.',
        requirements: ['Dados do Ato', 'Identificação do Requerente'],
        fields: [...standardFields, { id: 'cert_type', label: 'Tipo de Certidão', placeholder: 'Nacionalidade, Casamento, etc.', type: 'text' }]
    },
    {
        id: 'nacionalidade_filhos', title: 'Nacionalidade para Filhos de Estrangeiros Nascidos em Portugal', category: CATEGORIES.RIGHTS, complexity: 'Medium', authority: 'IRN', location: 'Conservatória',
        description: 'Direito por nascimento (Jus Soli) sob condições de residência dos pais.',
        explanation: 'expl_nacionalidade_filhos',
        purpose: 'Atribuição de nacionalidade originária a descendentes.',
        tips: 'Bastante rápido se um dos pais tiver residência há 1 ano.',
        requirements: ['Assento Nascimento Menor', 'ID Pais'],
        fields: [...standardFields, { id: 'child_name', label: 'Nome da Criança', placeholder: 'Nome completo', type: 'text' }]
    },
    {
        id: 'procuracao_registo', title: 'Formulário de Procuração (Representação Conservatória)', category: CATEGORIES.RIGHTS, complexity: 'Medium', authority: 'IRN', location: 'Notário / Advogado',
        description: 'Dá poderes a outrem para tratar de registos em seu nome.',
        explanation: 'expl_procuracao_registo',
        purpose: 'Representação legal para atos oficiais.',
        tips: 'A tradução é necessária se for feita no estrangeiro.',
        requirements: ['Dados do Procurador'],
        fields: [...standardFields, { id: 'attorney_name', label: 'Nome do Procurador', placeholder: 'Nome completo', type: 'text' }]
    },
    {
        id: 'irn_cc_resident', title: 'Requerimento de Cartão de Cidadão / Renovação (Residentes)', category: CATEGORIES.RIGHTS, complexity: 'Medium', authority: 'IRN', location: 'Loja Cidadão',
        description: 'Emissão de ID para quem tem direitos equiparados ou nacionalidade.',
        explanation: 'expl_irn_cc_resident',
        purpose: 'Identificação oficial em território português.',
        tips: 'Agende via Siga ou portal da justiça.',
        requirements: ['Título Residência / CC Anterior'],
        fields: [...standardFields]
    },

    // --- EMPREGO E FORMAÇÃO ---
    {
        id: 'iefp_inscricao', title: 'Inscrição para Oferta de Emprego IEFP', category: CATEGORIES.WORK, complexity: 'Easy', authority: 'IEFP', location: 'iefponline',
        description: 'Registo no centro de emprego para ofertas e formação.',
        explanation: 'expl_iefp_inscricao',
        purpose: 'Acesso a emprego e formação profissional subsidiada.',
        tips: 'Esteja atento ao e-mail para convocatórias.',
        requirements: ['Identificação', 'CV'],
        fields: [...standardFields]
    },
    {
        id: 'iefp_reembolso_formacao', title: 'Pedido de Reembolso de Despesas (IEFP)', category: CATEGORIES.WORK, complexity: 'Easy', authority: 'IEFP', location: 'Centro Emprego',
        description: 'Reembolso de transportes e alimentação em cursos do IEFP.',
        explanation: 'expl_iefp_reembolso_formacao',
        purpose: 'Apoio social para formandos ativos.',
        tips: 'Deve ser submetido mensalmente.',
        requirements: ['Faturas', 'Folhas de Presença'],
        fields: [...standardFields, { id: 'course_code', label: 'Cód. Curso', placeholder: 'Ex: 1234', type: 'text' }]
    },
    {
        id: 'ss_dec_desemprego', title: 'Declaração de Situação de Desemprego (RP 5044)', category: CATEGORIES.WORK, complexity: 'Medium', authority: 'Segurança Social', location: 'Empresa / SS',
        description: 'Prova de fim de contrato para acesso a subsídio.',
        explanation: 'expl_ss_dec_desemprego',
        purpose: 'Formalização de fim de contrato para efeitos de proteção no desemprego.',
        tips: 'A empresa tem obrigação de entregar ao trabalhador.',
        requirements: ['Dados Empresa', 'Motivo Fim Contrato'],
        fields: [...standardFields, { id: 'company_name', label: 'Empresa', placeholder: 'Nome da entidade', type: 'text' }]
    },

    // --- SEGURANÇA SOCIAL ---
    {
        id: 'ss_abono_familia', title: 'Requerimento de Abono de Família / Apoio Social / RSI', category: CATEGORIES.SOCIAL_SECURITY, complexity: 'Medium', authority: 'Segurança Social', location: 'SS Direta',
        description: 'Apoio monetário mensal para famílias e crianças.',
        explanation: 'expl_ss_abono_familia',
        purpose: 'Apoio à maternidade e encargos familiares.',
        tips: 'O escalão depende do rendimento médio do agregado.',
        requirements: ['Agregado Familiar', 'Rendimentos'],
        fields: [...standardFields, { id: 'num_agregado', label: 'N.º Membros', placeholder: 'Ex: 3', type: 'number' }]
    },
    {
        id: 'ss_dec_situacao_economica', title: 'Declaração de Situação Económica', category: CATEGORIES.SOCIAL_SECURITY, complexity: 'Medium', authority: 'Segurança Social', location: 'SS Direta',
        description: 'Provar insuficiência económica para isenções ou apoios.',
        explanation: 'expl_ss_dec_situacao_economica',
        purpose: 'Demonstração de carência para acesso a isenções públicas.',
        tips: 'Muito usado para isenção de taxas moderadoras.',
        requirements: ['IRS / Prova Rendimentos'],
        fields: [...standardFields]
    },
    {
        id: 'ss_niss', title: 'Inscrição na Segurança Social (Atribuição NISS)', category: CATEGORIES.SOCIAL_SECURITY, complexity: 'Medium', authority: 'Segurança Social', location: 'Loja Cidadão / Online',
        description: 'Pedido de número para trabalhar e descontar.',
        explanation: 'expl_ss_niss',
        purpose: 'Inscrição no sistema contributivo e de proteção social.',
        tips: 'Se for trabalhador independente, o processo é diferente.',
        requirements: ['Identificação', 'NIF'],
        fields: [...standardFields]
    },

    // --- SAÚDE (SNS) ---
    {
        id: 'sns_inscricao', title: 'Inscrição no Centro de Saúde (N.º Utente)', category: CATEGORIES.HEALTH, complexity: 'Medium', authority: 'SNS', location: 'Centro de Saúde',
        description: 'Registo no RNUT para acesso a cuidados médicos.',
        explanation: 'expl_sns_inscricao',
        purpose: 'Acesso ao Serviço Nacional de Saúde público.',
        tips: 'Pode ser difícil em zonas com muita pressão migratória; insista no direito à saúde.',
        requirements: ['ID', 'NIF', 'Atestado Freguesia'],
        fields: [...standardFields]
    },
    {
        id: 'sns_alteracao_dados', title: 'Alteração de Morada ou Contacto no SNS', category: CATEGORIES.HEALTH, complexity: 'Easy', authority: 'SNS', location: 'Centro Saúde / Online',
        description: 'Atualizar telefone ou casa no registo de utente.',
        explanation: 'expl_sns_alteracao_dados',
        purpose: 'Garantir que os registos de saúde estão atualizados para contactos médicos.',
        tips: 'Garanta que recebe SMS para consultas.',
        requirements: ['N.º Utente'],
        fields: [...standardFields, { id: 'phone', label: 'Novo Telefone', placeholder: '9 dígitos', type: 'text' }]
    },
    {
        id: 'sns_reembolso_despesas', title: 'Pedido de Reembolso de Despesas de Saúde', category: CATEGORIES.HEALTH, complexity: 'Medium', authority: 'SNS', location: 'ACES',
        description: 'Devolução de taxas ou exames em regime convencionado.',
        explanation: 'expl_sns_reembolso_despesas',
        purpose: 'Recuperação de custos com cuidados de saúde externos.',
        tips: 'Anexe sempre prescrição médica.',
        requirements: ['Faturas NIF', 'Prescrição'],
        fields: [...standardFields, { id: 'invoice', label: 'N.º Fatura', placeholder: 'Ex: 123/2024', type: 'text' }]
    },

    // --- FINANÇAS ---
    {
        id: 'nif_req', title: 'Pedido de Número de Identificação Fiscal (NIF)', category: CATEGORIES.FINANCE, complexity: 'Easy', authority: 'AT', location: 'Finanças',
        description: 'Atribuição de número fiscal português.',
        explanation: 'expl_nif_req',
        purpose: 'Número fundamental para qualquer transação financeira em Portugal.',
        tips: 'Traga um representative fiscal se vier de fora da UE.',
        requirements: ['Passaporte'],
        fields: [...standardFields]
    },
    {
        id: 'at_rep_fiscal', title: 'Declaração de Representante Fiscal', category: CATEGORIES.FINANCE, complexity: 'Medium', authority: 'AT', location: 'Finanças Online',
        description: 'Nomear quem responde por si perante o fisco.',
        explanation: 'expl_at_rep_fiscal',
        purpose: 'Obrigatoriedade legal para residentes fora da UE/EEE.',
        tips: 'O representante tem de validar no portal dele.',
        requirements: ['ID Representante'],
        fields: [...standardFields, { id: 'rep_nif', label: 'NIF Representante', placeholder: '9 dígitos', type: 'text' }]
    },
    {
        id: 'at_alteracao_morada', title: 'Alteração de Morada Fiscal', category: CATEGORIES.FINANCE, complexity: 'Easy', authority: 'AT', location: 'Portal Finanças',
        description: 'Atualizar domicílio oficial nas Finanças.',
        explanation: 'expl_at_alteracao_morada',
        purpose: 'Manter a conformidade tributária e o domicílio correto.',
        tips: 'Se tiver Chave Móvel Digital, faz-se em 2 minutos.',
        requirements: ['Nova Morada'],
        fields: [...standardFields, { id: 'new_addr', label: 'Morada Nova', placeholder: 'Rua, n.º, CP', type: 'text' }]
    },

    // --- EDUCAÇÃO E RECONHECIMENTO ---
    {
        id: 'dges_reconhecimento', title: 'Requerimento de Habilitações Académicas Estrangeiras', category: CATEGORIES.EDUCATION, complexity: 'Hard', authority: 'DGES', location: 'Portal DGES',
        description: 'Validar diplomas superiores do estrangeiro.',
        explanation: 'expl_dges_reconhecimento',
        purpose: 'Equivalência de grau académico para o mercado português.',
        tips: 'A tradução certificada é obrigatória se não estiver em PT/EN/FR/ES.',
        requirements: ['Diploma Apostilado', 'Histórico'],
        fields: [...standardFields, { id: 'course', label: 'Curso', placeholder: 'Nome da Licenciatura/Mestrado', type: 'text' }]
    },
    {
        id: 'dge_secundario_equivalencia', title: 'Equivalência de Estudos do Ensino Secundário', category: CATEGORIES.EDUCATION, complexity: 'Medium', authority: 'DGE', location: 'Escola Secundária',
        description: 'Validar o 12.º ano para trabalhar ou estudar.',
        explanation: 'expl_dge_secundario_equivalencia',
        purpose: 'Reconhecimento do nível secundário de ensino.',
        tips: 'Necessário para tirar carta de condução em alguns casos.',
        requirements: ['Certificado Notas Apostilado'],
        fields: [...standardFields]
    },

    // --- DIREITOS E APOIOS SOCIAIS ---
    {
        id: 'denuncia_discriminacao', title: 'Denúncia de Discriminação Racial ou Étnica', category: CATEGORIES.SOCIAL_SUPPORT, complexity: 'Medium', authority: 'CICDR', location: 'Online',
        description: 'Relatar atos de racismo ou xenofobia.',
        explanation: 'expl_denuncia_discriminacao',
        purpose: 'Lutar contra o racismo e garantir a defesa dos direitos humanos.',
        tips: 'Não tenha medo de denunciar; o MIRA apoia a sua voz.',
        requirements: ['Relato do Ocorrido'],
        fields: [...standardFields, { id: 'incident_date', label: 'Data', placeholder: 'AAAA-MM-DD', type: 'date' }]
    },
    {
        id: 'dec_violencia_domestica', title: 'Pedido de Estatuto de Vítima de Violência Doméstica', category: CATEGORIES.SOCIAL_SUPPORT, complexity: 'Medium', authority: 'PSP / GNR', location: 'Esquadra',
        description: 'Proteção legal imediata para vítimas.',
        explanation: 'expl_dec_violencia_domestica',
        purpose: 'Proteção estatal urgente contra violência doméstica.',
        tips: 'Confidencial e urgente.',
        requirements: ['Denúncia / Queixa'],
        fields: [...standardFields]
    },

    // --- HABITAÇÃO ---
    {
        id: 'apoio_arrendamento', title: 'Pedido de Apoio ao Arrendamento (Porta de Entrada)', category: CATEGORIES.HOUSING, complexity: 'Hard', authority: 'IHRU', location: 'Portal Habitação',
        description: 'Apoio financeiro governamental para pagar a renda.',
        explanation: 'expl_apoio_arrendamento',
        purpose: 'Acesso a subsídios públicos de habitação.',
        tips: 'O contrato deve estar registado nas Finanças.',
        requirements: ['Contrato Arrendamento', 'Rendimentos'],
        fields: [...standardFields, { id: 'rent', label: 'Valor Renda (€)', placeholder: 'Ex: 500', type: 'number' }]
    },
    {
        id: 'junta_morada', title: 'Atestado de Residência (Junta de Freguesia)', category: CATEGORIES.HOUSING, complexity: 'Easy', authority: 'Junta Freguesia', location: 'Junta Freguesia',
        description: 'Comprovativo oficial de morada local.',
        explanation: 'expl_junta_morada',
        purpose: 'Prova administrativa de habitação na freguesia.',
        tips: 'Pode precisar de testemunhas locais se não tiver contrato.',
        requirements: ['ID', 'Prova Morada'],
        fields: [...standardFields]
    },

    // --- TÁTICOS MIRA (SOBREVIVÊNCIA E DEFESA LEGAIS) ---
    {
        id: 'aima_deferimento_tacito', title: 'Requerimento de Deferimento Tácito (AIMA)', category: CATEGORIES.IMMIGRATION, complexity: 'Hard', authority: 'AIMA', location: 'Balcão / Correio',
        description: 'Petição legal para forçar resposta após os 90 dias úteis legais do CPA.',
        explanation: 'O Código de Procedimento Administrativo protege-o quando o Estado excede os prazos legais sem decisão. Com esta minuta invoca o deferimento tácito.',
        purpose: 'Forçar emissão de cartão por quebra de prazos.',
        tips: 'Envie sempre via Correio Registado com Aviso de Receção.',
        requirements: ['Comprovativo Submissão Original', 'Passaporte'],
        fields: [...standardFields, { id: 'process_number', label: 'N.º Processo / Recibo', placeholder: 'Ex: 12345/2023', type: 'text' }]
    },
    {
        id: 'aima_audiencia_previa', title: 'Resposta a Indeferimento (Audiência Prévia)', category: CATEGORIES.IMMIGRATION, complexity: 'Hard', authority: 'AIMA', location: 'Portal / Correio',
        description: 'Minuta de pronúncia para responder a uma Carta de Intenção de Indeferimento/Abandono.',
        explanation: 'Quando a AIMA ameaça arquivar o processo, tem tipicamente 10 dias úteis para se pronunciar (Direito de Audiência Prévia) ou juntar os documentos em falta.',
        purpose: 'Travar o arquivamento legal de um processo na AIMA.',
        tips: 'O relógio começa a contar poucos dias após a data no envelope. Não falhe o prazo!',
        requirements: ['Cópia da Notificação', 'Novos Docs Anexos'],
        fields: [...standardFields, { id: 'notification_date', label: 'Data da Notificação', placeholder: 'AAAA-MM-DD', type: 'date' }]
    },
    {
        id: 'promessa_trabalho_art88', title: 'Contrato de Trabalho Formato AIMA (Art. 88)', category: CATEGORIES.WORK, complexity: 'Medium', authority: 'Empregador', location: 'Empresa',
        description: 'Contrato de promessa aceite pelas imigrações sem cláusulas nulas.',
        explanation: 'Use esta minuta padrão se o patrão quiser contratar mas não tiver um advogado para redigir um contrato com o formato que a Segurança Social e AIMA aceitam.',
        purpose: 'Minuta perfeita para vincular o Artigo 88.º.',
        tips: 'Deve ter assinaturas reconhecidas caso não tenha carimbo da empresa.',
        requirements: ['Dados Empresa', 'Dados Trabalhador'],
        fields: [...standardFields, { id: 'company_nif', label: 'NIF Empresa', placeholder: 'Ex: 500000000', type: 'text' }]
    },
    {
        id: 'sef_declaracao_entrada', title: 'Declaração de Entrada em Território', category: CATEGORIES.IMMIGRATION, complexity: 'Easy', authority: 'PSP / GNR / AIMA', location: 'Esquadra',
        description: 'Para quem entrou via voo com escala em Schengen (sem carimbo PT).',
        explanation: 'Muitos ficam ilegais por meses sem saber que tinham 3 dias úteis para informar o estado Português de que chegaram (art. 14º da Lei de Imigração).',
        purpose: 'Evitar multas e problemas no arranque de processos.',
        tips: 'Anexe o bilhete de avião ao formulário para provar a data.',
        requirements: ['Passaporte', 'Bilhete de Viagem'],
        fields: [...standardFields, { id: 'entry_date', label: 'Data de Chegada', placeholder: 'AAAA-MM-DD', type: 'date' }, { id: 'border_point', label: 'Ponto de Escala', placeholder: 'Ex: Madrid', type: 'text' }]
    }
];

export const serviceGuides = [
    {
        id: 'g_manifestacao_cima', category: CATEGORIES.IMMIGRATION, title: 'Nova Autorização de Residência (Pós-MI)', authority: 'AIMA',
        description: 'Como transitar da antiga Manifestação de Interesse para os novos fluxos CPLP/Vistos em 2026.',
        explanation: 'Para quem deu entrada antes das alterações governamentais e deve agora atualizar documentação nos balcões ou services.aima.gov.pt.',
        steps: [
            { docName: 'Agendamento Prévio', whereToGet: 'Via call center CNAIM (Contactar a Linha de Apoio a Migrantes) ou site AIMA.' },
            { docName: 'SS e Finanças', whereToGet: 'Cadastros sem dívidas.' }
        ],
        faq: [{ q: 'O portal SAPA continua?', a: 'Siga sempre as orientações do portal oficial aima.gov.pt para a transição dos antigos Arts 88 e 89.' }]
    },
    {
        id: 'g_cnaim_triagem', category: CATEGORIES.IMMIGRATION, title: 'Agendamento Diário no CNAIM', authority: 'CNAIM (gov.pt)',
        description: 'O processo passo a passo para ser atendido presencialmente.',
        explanation: 'Devido à alta afluência, o agendamento através da Linha de Apoio a Migrantes (218 106 191) é obrigatório.',
        steps: [
            { docName: 'Ligar para a Linha', whereToGet: 'Via telefone.' },
            { docName: 'Registo Prévio', whereToGet: 'Identificação básica e motivo da ida ao CNAIM.' }
        ],
        faq: [{ q: 'Posso ir sem marcação?', a: 'Normalmente não, salvo emergências documentadas.' }]
    },
    {
        id: 'g_irn_cidadania', category: CATEGORIES.RIGHTS, title: 'Nacionalidade Portuguesa Online', authority: 'IRN / gov.pt',
        description: 'Guia de submissão de Nacionalidade por Tempo de Residência via online.',
        explanation: 'O IRN modernizou o sistema. Agora os advogados podem submeter no portal, poupando meses de filas e papéis.',
        steps: [
            { docName: 'Passaporte', whereToGet: 'Cópia integral e traduzida se aplicável.' },
            { docName: 'Certificado de Nível A2 de Português', whereToGet: 'CIPLE ou escola oficial certificada.' },
            { docName: 'Registo Criminal', whereToGet: 'País de origem e países onde habitou mais de 1 ano.' }
        ],
        faq: [{ q: 'Onde encontro as leis base?', a: 'Toda a jurisprudência está em diariodarepublica.pt ou eur-lex.europa.eu para diretivas europeias.' }]
    },
    {
        id: 'g_dges_reconhecimento', category: CATEGORIES.EDUCATION, title: 'Reconhecimento de Graus Estrangeiros', authority: 'DGES',
        description: 'Como usar a plataforma de Reconhecimento de Qualificações Estrangeiras.',
        explanation: 'A DGES facilita o reconhecimento automático, de nível ou específico dependendo da sua faculdade de origem.',
        steps: [
            { docName: 'Criar conta na DGES', whereToGet: 'Em dges.gov.pt/pt' },
            { docName: 'Preparar Diploma com Apostila de Haia', whereToGet: 'Emitido no país onde estudou.' },
            { docName: 'Pagar a Taxa de Serviço', whereToGet: 'Referência Multibanco gerada na plataforma.' }
        ],
        faq: [{ q: 'É imediato?', a: 'O Reconhecimento Automático leva até 30 dias; os específicos podem levar vários meses.' }]
    },
    {
        id: 'g_ss_direta', category: CATEGORIES.FINANCE, title: 'Guia SS Direta: Apoios', authority: 'Segurança Social',
        description: 'Navegar no portal Segurança Social (seg-social.pt) de forma simples.',
        explanation: 'Desde solicitar abonos a Subsídios Familiares, a SS Direta é onde o migrante controla as suas contribuições.',
        steps: [
            { docName: 'Chave Móvel Digital ou Senha SS', whereToGet: 'gov.pt (Chave Móvel) ou no balcão físico da SS.' },
            { docName: 'IBAN na plataforma', whereToGet: 'Obrigatório para receber qualquer valor.' }
        ],
        faq: [{ q: 'Como sei se os descontos estão registados?', a: 'Na SS Direta, vá a Remunerações > Conta-Corrente.' }]
    },
    {
        id: 'g_sns_24', category: CATEGORIES.HEALTH, title: 'Como utilizar o portal SNS 24', authority: 'SNS',
        description: 'Gestão da sua saúde pública online: consultas, receitas e teleatendimento.',
        explanation: 'O SNS 24 permite agendar consultas no centro de saúde, renovar receitas e consultar o boletim de vacinas sem sair de casa.',
        steps: [
            { docName: 'Chave Móvel Digital', whereToGet: 'Ativada remotamente ou no Espaço Cidadão.' },
            { docName: 'App SNS 24', whereToGet: 'Instalar na App Store ou Play Store.' }
        ],
        faq: [{ q: 'O que é a Triagem da Linha SNS 24?', a: 'Ligue 808 24 24 24 antes de ir às urgências para ser aconselhado e triado.' }]
    },
    {
        id: 'g_estatuto_igualdade', category: CATEGORIES.RIGHTS, title: 'CC (Estatuto de Igualdade - Brasileiros)', authority: 'IRN / AIMA',
        description: 'Tratado de Porto Seguro: Direitos e deveres iguais aos dos cidadãos portugueses.',
        explanation: 'Cidadãos brasileiros residentes podem pedir o Estatuto de Igualdade de Direitos e Deveres para ter o Cartão de Cidadão português.',
        steps: [
            { docName: 'Certificado de Residência', whereToGet: 'Emitido pela AIMA.' },
            { docName: 'Requerimento de Igualdade', whereToGet: 'Submetido online ou via Conservatória.' }
        ],
        faq: [{ q: 'Dá direito a passaporte?', a: 'Não. O Estatuto não concede nacionalidade, apenas igualdade de direitos civis/políticos.' }]
    },
    {
        id: 'g_direitos_politicos', category: CATEGORIES.RIGHTS, title: 'Direitos Iguais e Direitos Políticos', authority: 'IRN / CNE',
        description: 'Votar e ser eleito em Portugal (para estrangeiros sob reciprocidade).',
        explanation: 'Migrantes de países com acordos de reciprocidade (Brasil, Cabo Verde, etc.) podem votar nas eleições autárquicas após certo tempo de residência.',
        steps: [
            { docName: 'Recenseamento Eleitoral', whereToGet: 'Automático para portadores de CC ou via Comissão de Recenseamento.' },
            { docName: 'Declaração de Opção', whereToGet: 'Apenas necessária em casos específicos de múltiplas nacionalidades.' }
        ],
        faq: [{ q: 'Quando posso votar?', a: 'Depende da nacionalidade. Brasileiros com Estatuto de Direitos Políticos e outros com 2-5 anos de residência.' }]
    },
    {
        id: 'g_indeferimento_ajuda', category: CATEGORIES.IMMIGRATION, title: 'Recebi Carta de Abandono (Indeferimento). E agora?', authority: 'AIMA / CPA',
        description: 'Passo a passo legal de como usar o Direito a Audiência Prévia.',
        explanation: 'Qualquer notificação do Estado a dizer "Vamos arquivar o seu pedido" NÃO é o fim. Tem o Direito à Audiência Prévia (Art 121.º do CPA) de 10 dias úteis para justificar a falta ou anexar documentos.',
        steps: [
            { docName: 'Minuta de Audiência Prévia (Resposta a Indeferimento)', whereToGet: 'Disponível acima no gerador de documentos MIRA.' },
            { docName: 'Anexos a Pedidos na Notificação', whereToGet: 'Junte NIF, Passaporte Novo ou SS se era isso que faltava e envie via CTT Registado urgente.' }
        ],
        faq: [{ q: 'Posso pedir ajuda a advogado?', a: 'Sim, mas se o prazo for curto, preencha o MIRA, assine, envie com CTT registado, e procure advogado DEPOIS. O prazo não pausa!' }]
    }
];
