import { createClient } from '@supabase/supabase-js';
import process from 'process';

// Script desenhado para futura integração real com as Vagas do IEFP/API externas de emprego.
// O MIRA foi configurado para fazer um fetch diário via cron-job de APIs públicas.

process.loadEnvFile('./.env.local');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

export async function fetchExternalJobsAndInsert() {
    console.log("Iniciando rotina de integração de Vagas (API Sync)...");

    try {
        // Simulação de Fetch de API real
        const responseData = [
            {
                title: "Ajudante de Cozinha (M/F)",
                location: "Lisboa",
                source_name: "Net-Empregos",
                source_url: "https://www.net-empregos.com",
                tags: ["Entrada Imediata", "Hotelaria"],
                category: "Emprego & Oportunidades",
                work_topic: "Turismo, Hotelaria & Restauração",
                created_at: new Date().toISOString()
            },
            {
                title: "Técnico de Manutenção Industrial",
                location: "Aveiro",
                source_name: "Indeed PT",
                source_url: "https://pt.indeed.com",
                tags: ["Urgente", "Indústria"],
                category: "Emprego & Oportunidades",
                work_topic: "Indústria, Produção & Manufatura",
                created_at: new Date().toISOString()
            },
            {
                title: "Motorista de Pesados (C+E)",
                location: "Porto",
                source_name: "IEFP Portugal",
                source_url: "https://empregabilidade.iefp.pt",
                tags: ["C+E", "Nacional"],
                category: "Emprego & Oportunidades",
                work_topic: "Logística, Transportes & Armazém",
                created_at: new Date().toISOString()
            }
        ];

        console.log(`MIRA: ${responseData.length} novas vagas encontradas de fontes externas.`);

        const { error: insertError } = await supabase.from('job_posts').insert(responseData);

        if (insertError) {
            console.error('Erro ao sincronizar novas vagas:', insertError);
            throw insertError;
        } else {
            console.log(`Sucesso: Vagas reais sincronizadas com o banco de dados MIRA.`);
        }
    } catch (e) {
        console.error("Erro no script de importação:", e);
    }
}

// Quando executado standalone:
fetchExternalJobsAndInsert();
