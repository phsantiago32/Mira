
import { jsPDF } from 'jspdf';

/**
 * Gerador de PDF MIRA v9.0 - Padrão de Declaração Jurídica Oficial
 * Garante que o texto respeite rigorosamente as margens laterais (160mm de largura útil).
 * Agora utiliza a cidade preenchida no formulário para a assinatura.
 */
export async function generateOfficialPDF(templateTitle: string, data: Record<string, any>) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });

  const margin = 25;
  const pageWidth = 210;
  const contentWidth = pageWidth - (margin * 2); // 160mm exatos
  let y = 35;

  // --- TÍTULO DO DOCUMENTO ---
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');

  // Split title manually to ensure it never overflows
  const titleLines = doc.splitTextToSize(templateTitle.toUpperCase(), contentWidth);
  doc.text(titleLines, margin, y);
  y += (titleLines.length * 8) + 15;

  // --- SAUDAÇÃO ---
  doc.setFontSize(11);
  doc.setTextColor(20, 20, 20);
  doc.text('EXCELENTÍSSIMOS SENHORES,', margin, y);
  y += 15;

  // --- CORPO DO TEXTO (NARRATIVA INTEGRADA) ---
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(40, 40, 40);

  const n = data.full_name?.toUpperCase() || '___________________________';
  const nac = data.nationality || '___________________________';
  const id = data.passport_num || data.id_number || '___________________________';
  const nif = data.nif || '___________________________';
  const niss = data.niss || '___________________________';
  const morada = data.address || '___________________________';
  const city = data.city || 'PORTUGAL'; // Default se não preenchido

  let narrative = `Eu, ${n}, de nacionalidade ${nac}, titular do documento de identificação n.º ${id}, contribuinte fiscal n.º ${nif} e beneficiário da Segurança Social n.º ${niss}, residente para todos os efeitos legais na morada sita em ${morada}, venho por este meio e na melhor forma de direito, apresentar o presente requerimento de ${templateTitle}.`;

  const skipFields = ['full_name', 'nationality', 'passport_num', 'id_number', 'nif', 'niss', 'address', 'city'];
  const extraDetails = Object.entries(data)
    .filter(([key, value]) => !skipFields.includes(key) && value)
    .map(([key, value]) => {
      const label = key.replace(/_/g, ' ').toLowerCase();
      return `Relativamente ao campo ${label}, declara-se o seguinte: ${value}.`;
    }).join(' ');

  if (extraDetails) {
    narrative += ` ${extraDetails}`;
  }

  narrative += ` O signatário declara, sob compromisso de honra, que os dados acima indicados são verdadeiros e assume total responsabilidade legal sobre os mesmos, em conformidade com a legislação portuguesa vigente.`;

  // Renderização com maxWidth garante que a margem direita seja respeitada
  doc.text(narrative, margin, y, {
    maxWidth: contentWidth,
    align: 'justify'
  });

  // Calcula o espaço ocupado pelo texto para posicionar os próximos elementos
  const textHeight = doc.getTextDimensions(narrative, { maxWidth: contentWidth }).h;
  y += textHeight + 20;

  // --- FECHAMENTO ---
  doc.text('Pede Deferimento.', margin, y);
  y += 15;

  doc.setFont('helvetica', 'bold');
  // Alterado para Cidade, Data conforme solicitado
  doc.text(`${city.toUpperCase()}, ${new Date().toLocaleDateString('pt-PT')}`, margin, y);
  y += 30;

  // --- LINHA DE ASSINATURA ---
  doc.setDrawColor(0, 0, 0);
  doc.line(margin, y, margin + 85, y);
  y += 6;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'italic');
  doc.text('(Assinatura do Requerente)', margin, y);

  // --- RODAPÉ ---
  const footerY = 285;
  doc.setDrawColor(240, 240, 240);
  doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);
  doc.setFontSize(7);
  doc.setTextColor(180, 180, 180);
  doc.setFont('helvetica', 'normal');
  doc.text('MIRA APP © 2026 - DOCUMENTO PARA INSTRUÇÃO DE PROCESSO ADMINISTRATIVO', pageWidth / 2, footerY, { align: 'center' });

  const blob = doc.output('blob');
  const url = URL.createObjectURL(blob);

  // Nome do arquivo mais seguro (slugify)
  const safeTitle = templateTitle
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_') // Remove caracteres especiais
    .replace(/_+/g, '_') // Remove sublinhados duplos
    .replace(/^_|_$/g, ''); // Remove sublinhados no início/fim

  return {
    pdfUrl: url,
    filename: `${safeTitle}.pdf`,
    blob,
    doc
  };
}
