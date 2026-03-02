
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
            ? `MIRA SUGGESTION: ${data.subject || 'Nova Ideia'}`
            : `MIRA REPORT: Denúncia de Conteúdo`;

        const bodyText = `
--------------------------------------------------
MIRA APP - RELATÓRIO DE ${type.toUpperCase()}
--------------------------------------------------
ENVIADO POR: ${user?.name || 'Anónimo'}
ID UTILIZADOR: ${user?.id || 'N/A'}
EMAIL: ${user?.email || 'N/A'}
DATA: ${new Date().toLocaleString('pt-PT')}

CONTEÚDO:
${data.message || data.content || 'Sem mensagem informada.'}

META:
Relatório gerado automaticamente pelo Mira App Engine 2026.
--------------------------------------------------
    `;

        // Strategy 1: Attempt invisible send via Edge Function (future-proof)
        try {
            // In the future, this would call a real backend
            // const { error } = await supabase.functions.invoke('send-email', { body: { ... } });
        } catch (e) { }

        // Strategy 2: Reliable Mailto link (UI feedback is handled in component)
        const emailSubject = encodeURIComponent(subject);
        const emailBody = encodeURIComponent(bodyText);

        // We use a small delay ensure the user sees the 'Success' feedback in-app first
        setTimeout(() => {
            window.location.href = `mailto:${TO_EMAIL}?subject=${emailSubject}&body=${emailBody}`;
        }, 1500);

        return true;
    }
};
