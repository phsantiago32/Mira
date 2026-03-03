
export const emailService = {
    /**
     * Send a suggestion or report via email
     * @param type 'suggestion' | 'report'
     * @param data The form data
     * @param user The current user
     */
    async sendEmail(type: 'suggestion' | 'report', data: any, user: any) {
        const TO_EMAIL = 'mira.app@hotmail.com';
        const subject = type === 'suggestion'
            ? `[MIRA SUGGESTION] ${data.subject || 'Nova Ideia'}`
            : `[MIRA REPORT] Denúncia de Conteúdo`;

        const bodyText = `
--------------------------------------------------
MIRA APP - RELATÓRIO DE ${type.toUpperCase()}
--------------------------------------------------
ENVIADO POR: ${user?.name || 'Anónimo'}
ID UTILIZADOR: ${user?.id || 'N/A'}
EMAIL: ${user?.email || 'N/A'}
DATA: ${new Date().toLocaleString('pt-PT')}

ASSUNTO: ${data.subject || 'N/A'}

CONTEÚDO:
${data.message || data.content || 'Sem mensagem informada.'}

META:
Relatório gerado automaticamente pelo Mira App Engine 2026.
--------------------------------------------------
    `;

        const emailSubject = encodeURIComponent(subject);
        const emailBody = encodeURIComponent(bodyText);

        // Feedback visual imediato antes de abrir o cliente de email
        setTimeout(() => {
            window.location.href = `mailto:${TO_EMAIL}?subject=${emailSubject}&body=${emailBody}`;
        }, 1000);

        return true;
    }
};
