import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { Certificate } from '../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const TRASEME_NAME = 'TRASEME MEDICINA E SEGURANÇA DO TRABALHO LTDA';
const TRASEME_CNPJ = '34.046.480/0001-43';

function formatDateBR(dateStr: string): string {
  try {
    const date = new Date(dateStr + 'T12:00:00');
    return format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  } catch {
    return dateStr;
  }
}

function generateCertificateHtml(cert: Certificate, qrDataUrl?: string): string {
  const topicos = cert.course?.topicos ?? [];
  const employeeName = cert.employee?.nomeCompleto ?? '';
  const employeeCargo = cert.employee?.funcao ?? '';
  const courseName = cert.course?.nome ?? '';
  const duracaoHoras = cert.course?.duracaoHoras ?? 0;
  const localDate = `${cert.localRealizacao}, ${formatDateBR(cert.dataRealizacao)}`;
  const validadeFormatted = formatDateBR(cert.dataValidade);
  const techName = cert.technician?.nomeCompleto ?? '';
  const techDSST = cert.technician?.registroDSST ?? '';
  const techFuncao = cert.technician?.funcao ?? '';
  const companyName = cert.company?.razaoSocial ?? '';
  const companyCNPJ = cert.company?.cnpj ?? '';
  const certNumber = cert.numeroUnico;

  const qrSection = qrDataUrl
    ? `<img src="${qrDataUrl}" width="80" height="80" style="display:block;" />`
    : `<div style="width:80px;height:80px;border:2px solid #C9A227;display:flex;align-items:center;justify-content:center;font-size:8px;color:#9E9E9E;">QR</div>`;

  const topicosHtml = topicos
    .map(
      (t, i) =>
        `<tr style="background:${i % 2 === 0 ? '#FAFAFA' : '#FFFFFF'};">
          <td style="padding:8px 12px;border-bottom:1px solid #E0E0E0;color:#1B5E20;font-weight:700;font-size:13px;width:36px;">${t.ordem}.</td>
          <td style="padding:8px 12px;border-bottom:1px solid #E0E0E0;color:#424242;font-size:13px;">${t.topico}</td>
        </tr>`
    )
    .join('');

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Inter:wght@400;500;600;700&display=swap');

  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    font-family: 'Inter', sans-serif;
    background: #FFFFFF;
    color: #212121;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  /* ── PAGE 1 ── */
  .page {
    width: 210mm;
    min-height: 297mm;
    padding: 0;
    position: relative;
    page-break-after: always;
    overflow: hidden;
  }

  .outer-border {
    position: absolute;
    inset: 12mm;
    border: 3px solid #1B5E20;
    pointer-events: none;
    z-index: 0;
  }

  .inner-border {
    position: absolute;
    inset: 15mm;
    border: 1px solid #C9A227;
    pointer-events: none;
    z-index: 0;
  }

  .corner-ornament {
    position: absolute;
    width: 20px;
    height: 20px;
    border-color: #C9A227;
    border-style: solid;
    z-index: 1;
  }
  .corner-ornament.tl { top: 14mm; left: 14mm; border-width: 2px 0 0 2px; }
  .corner-ornament.tr { top: 14mm; right: 14mm; border-width: 2px 2px 0 0; }
  .corner-ornament.bl { bottom: 14mm; left: 14mm; border-width: 0 0 2px 2px; }
  .corner-ornament.br { bottom: 14mm; right: 14mm; border-width: 0 2px 2px 0; }

  .page-content {
    position: relative;
    padding: 20mm 22mm 18mm;
    min-height: 297mm;
    z-index: 2;
    display: flex;
    flex-direction: column;
  }

  /* Header */
  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-bottom: 12px;
    border-bottom: 2px solid #1B5E20;
    margin-bottom: 14px;
  }

  .header-logos {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .logo-placeholder {
    width: 72px;
    height: 72px;
    background: #1B5E20;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 9px;
    font-weight: 700;
    text-align: center;
    padding: 4px;
    line-height: 1.3;
  }

  .logo-divider {
    width: 1px;
    height: 60px;
    background: #E0E0E0;
  }

  .traseme-info {
    display: flex;
    flex-direction: column;
    gap: 3px;
  }

  .traseme-name {
    font-family: 'Inter', sans-serif;
    font-size: 10px;
    font-weight: 700;
    color: #1B5E20;
    text-transform: uppercase;
    letter-spacing: 0.3px;
  }

  .traseme-cnpj {
    font-size: 9px;
    color: #757575;
  }

  .header-number {
    text-align: right;
  }

  .cert-label-small {
    font-size: 8px;
    color: #9E9E9E;
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  .cert-number {
    font-family: 'Inter', sans-serif;
    font-size: 11px;
    font-weight: 700;
    color: #1B5E20;
    letter-spacing: 1px;
  }

  /* Title block */
  .title-block {
    text-align: center;
    padding: 18px 0 12px;
  }

  .cert-title {
    font-family: 'Playfair Display', serif;
    font-size: 46px;
    font-weight: 700;
    color: #1B5E20;
    letter-spacing: 2px;
    line-height: 1;
    margin-bottom: 8px;
  }

  .cert-subtitle {
    font-size: 10px;
    color: #9E9E9E;
    text-transform: uppercase;
    letter-spacing: 3px;
  }

  /* Decorative line */
  .deco-line {
    display: flex;
    align-items: center;
    gap: 12px;
    margin: 10px 0;
  }
  .deco-line::before, .deco-line::after {
    content: '';
    flex: 1;
    height: 1px;
    background: linear-gradient(to right, transparent, #C9A227, transparent);
  }
  .deco-diamond {
    width: 8px;
    height: 8px;
    background: #C9A227;
    transform: rotate(45deg);
    flex-shrink: 0;
  }

  /* Body */
  .cert-body {
    text-align: center;
    padding: 0 12px;
  }

  .certifica-text {
    font-size: 13px;
    color: #616161;
    margin-bottom: 14px;
    line-height: 1.6;
  }

  .employee-name {
    font-family: 'Playfair Display', serif;
    font-size: 34px;
    font-weight: 700;
    color: #1B5E20;
    line-height: 1.1;
    margin: 10px 0 6px;
  }

  .employee-info {
    font-size: 13px;
    color: #757575;
    margin-bottom: 16px;
  }

  .course-block {
    background: #E8F5E9;
    border-left: 4px solid #1B5E20;
    border-radius: 4px;
    padding: 14px 20px;
    margin: 14px 0;
    text-align: left;
  }

  .course-label {
    font-size: 9px;
    color: #9E9E9E;
    text-transform: uppercase;
    letter-spacing: 2px;
    margin-bottom: 4px;
  }

  .course-name {
    font-family: 'Playfair Display', serif;
    font-size: 20px;
    font-weight: 700;
    color: #1B5E20;
    line-height: 1.2;
  }

  .course-meta {
    display: flex;
    gap: 24px;
    margin-top: 8px;
  }

  .meta-item {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .meta-label {
    font-size: 9px;
    color: #9E9E9E;
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  .meta-value {
    font-size: 13px;
    font-weight: 600;
    color: #212121;
  }

  .company-block {
    background: #FAFAFA;
    border: 1px solid #E0E0E0;
    border-radius: 4px;
    padding: 10px 16px;
    margin: 14px 0;
    text-align: left;
  }

  .company-label {
    font-size: 9px;
    color: #9E9E9E;
    text-transform: uppercase;
    letter-spacing: 2px;
    margin-bottom: 3px;
  }

  .company-name {
    font-size: 14px;
    font-weight: 600;
    color: #212121;
  }

  .company-cnpj {
    font-size: 11px;
    color: #757575;
  }

  /* Location + date */
  .location-date {
    font-size: 12px;
    color: #616161;
    text-align: center;
    margin: 16px 0;
    font-style: italic;
  }

  /* Signatures */
  .signatures {
    display: flex;
    justify-content: space-around;
    align-items: flex-end;
    margin-top: 24px;
    gap: 20px;
  }

  .sig-block {
    flex: 1;
    text-align: center;
    max-width: 200px;
  }

  .sig-line {
    border-top: 1px solid #424242;
    padding-top: 8px;
    margin-top: 32px;
  }

  .sig-name {
    font-size: 12px;
    font-weight: 600;
    color: #212121;
    text-transform: uppercase;
  }

  .sig-role {
    font-size: 10px;
    color: #757575;
    margin-top: 2px;
  }

  .sig-dsst {
    font-size: 10px;
    color: #1B5E20;
    font-weight: 600;
    margin-top: 2px;
  }

  /* Footer + seal */
  .footer {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    margin-top: 20px;
    padding-top: 14px;
    border-top: 1px solid #E0E0E0;
  }

  .seal {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    border: 3px solid #C9A227;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 6px;
    position: relative;
  }

  .seal::before {
    content: '';
    position: absolute;
    inset: 4px;
    border-radius: 50%;
    border: 1px dashed #C9A227;
  }

  .seal-text {
    font-size: 7px;
    font-weight: 700;
    color: #C9A227;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    line-height: 1.3;
    position: relative;
    z-index: 1;
  }

  .qr-block {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
  }

  .qr-label {
    font-size: 8px;
    color: #9E9E9E;
    text-align: center;
  }

  /* ── PAGE 2 ── */
  .page2 {
    width: 210mm;
    min-height: 297mm;
    padding: 0;
    position: relative;
  }

  .page2-content {
    position: relative;
    padding: 20mm 22mm 18mm;
    min-height: 297mm;
    z-index: 2;
  }

  .page2-header {
    border-bottom: 2px solid #1B5E20;
    padding-bottom: 12px;
    margin-bottom: 20px;
  }

  .page2-title {
    font-family: 'Playfair Display', serif;
    font-size: 22px;
    font-weight: 700;
    color: #1B5E20;
    margin-bottom: 4px;
  }

  .page2-subtitle {
    font-size: 11px;
    color: #757575;
  }

  .topics-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 8px;
  }

  .topics-table th {
    background: #1B5E20;
    color: white;
    text-align: left;
    padding: 10px 12px;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  .page2-footer {
    position: absolute;
    bottom: 18mm;
    left: 22mm;
    right: 22mm;
    border-top: 1px solid #E0E0E0;
    padding-top: 10px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .page2-footer-text {
    font-size: 9px;
    color: #9E9E9E;
  }

  .validity-badge {
    background: #FFF8E1;
    border: 1px solid #C9A227;
    border-radius: 4px;
    padding: 6px 12px;
    text-align: center;
  }

  .validity-label {
    font-size: 9px;
    color: #9E9E9E;
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  .validity-date {
    font-size: 12px;
    font-weight: 700;
    color: #C9A227;
  }
</style>
</head>
<body>

<!-- ═══════════════════════════ PAGE 1 ═══════════════════════════ -->
<div class="page">
  <div class="outer-border"></div>
  <div class="inner-border"></div>
  <div class="corner-ornament tl"></div>
  <div class="corner-ornament tr"></div>
  <div class="corner-ornament bl"></div>
  <div class="corner-ornament br"></div>

  <div class="page-content">
    <!-- Header -->
    <div class="header">
      <div class="header-logos">
        <div class="logo-placeholder">TRASEME</div>
        <div class="logo-divider"></div>
        <div class="traseme-info">
          <div class="traseme-name">${TRASEME_NAME}</div>
          <div class="traseme-cnpj">CNPJ: ${TRASEME_CNPJ}</div>
        </div>
      </div>
      <div class="header-number">
        <div class="cert-label-small">Certificado Nº</div>
        <div class="cert-number">${certNumber}</div>
      </div>
    </div>

    <!-- Title -->
    <div class="title-block">
      <div class="cert-title">Certificado</div>
      <div class="cert-subtitle">de Conclusão de Treinamento</div>
    </div>

    <div class="deco-line"><div class="deco-diamond"></div></div>

    <!-- Body -->
    <div class="cert-body">
      <div class="certifica-text">
        Certificamos que o profissional abaixo identificado participou e concluiu<br/>
        com aproveitamento o treinamento especificado neste documento.
      </div>

      <div class="employee-name">${employeeName}</div>
      <div class="employee-info">${employeeCargo}</div>

      <div class="course-block">
        <div class="course-label">Treinamento Realizado</div>
        <div class="course-name">${courseName}</div>
        <div class="course-meta">
          <div class="meta-item">
            <span class="meta-label">Carga Horária</span>
            <span class="meta-value">${duracaoHoras}h</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Validade</span>
            <span class="meta-value">${formatDateBR(cert.dataValidade)}</span>
          </div>
        </div>
      </div>

      <div class="company-block">
        <div class="company-label">Empresa</div>
        <div class="company-name">${companyName}</div>
        <div class="company-cnpj">CNPJ: ${companyCNPJ}</div>
      </div>

      <div class="location-date">${localDate}</div>
    </div>

    <div class="deco-line"><div class="deco-diamond"></div></div>

    <!-- Signatures -->
    <div class="signatures">
      <div class="sig-block">
        <div class="sig-line">
          <div class="sig-name">${employeeName}</div>
          <div class="sig-role">Participante</div>
        </div>
      </div>
      <div class="sig-block">
        <div class="sig-line">
          <div class="sig-name">${techName}</div>
          <div class="sig-role">${techFuncao}</div>
          <div class="sig-dsst">Reg. DSST/MTE: ${techDSST}</div>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <div class="seal">
        <div class="seal-text">TRASEME<br/>CERTIFICA<br/>★</div>
      </div>

      <div style="text-align:center;flex:1;">
        <div style="font-size:9px;color:#9E9E9E;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">
          Autenticidade verificável por QR Code
        </div>
        <div style="font-size:10px;color:#424242;font-weight:600;">${certNumber}</div>
      </div>

      <div class="qr-block">
        ${qrSection}
        <div class="qr-label">Verificar<br/>Autenticidade</div>
      </div>
    </div>
  </div>
</div>

<!-- ═══════════════════════════ PAGE 2 ═══════════════════════════ -->
<div class="page2">
  <div class="outer-border"></div>
  <div class="inner-border"></div>
  <div class="corner-ornament tl"></div>
  <div class="corner-ornament tr"></div>
  <div class="corner-ornament bl"></div>
  <div class="corner-ornament br"></div>

  <div class="page2-content">
    <div class="page2-header">
      <div class="page2-title">Conteúdo Programático</div>
      <div class="page2-subtitle">
        ${courseName} &nbsp;·&nbsp; ${duracaoHoras} horas &nbsp;·&nbsp; Cert. Nº ${certNumber}
      </div>
    </div>

    <table class="topics-table">
      <thead>
        <tr>
          <th style="width:48px;">Item</th>
          <th>Tópico</th>
        </tr>
      </thead>
      <tbody>
        ${topicosHtml || '<tr><td colspan="2" style="padding:16px;text-align:center;color:#9E9E9E;">Nenhum tópico cadastrado.</td></tr>'}
      </tbody>
    </table>

    <div class="page2-footer">
      <div class="page2-footer-text">
        ${TRASEME_NAME} · CNPJ ${TRASEME_CNPJ}
      </div>
      <div class="validity-badge">
        <div class="validity-label">Válido até</div>
        <div class="validity-date">${validadeFormatted}</div>
      </div>
    </div>
  </div>
</div>

</body>
</html>
`;
}

export async function generateAndSharePdf(cert: Certificate): Promise<string> {
  const html = generateCertificateHtml(cert);

  const { uri } = await Print.printToFileAsync({
    html,
    base64: false,
  });

  const fileName = `Certificado_${cert.numeroUnico.replace(/\//g, '-')}.pdf`;
  const destUri = FileSystem.documentDirectory + fileName;

  await FileSystem.copyAsync({ from: uri, to: destUri });

  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(destUri, {
      mimeType: 'application/pdf',
      dialogTitle: 'Compartilhar Certificado',
      UTI: 'com.adobe.pdf',
    });
  }

  return destUri;
}

export async function printCertificate(cert: Certificate): Promise<void> {
  const html = generateCertificateHtml(cert);
  await Print.printAsync({ html });
}

export function generateCertificateNumber(): string {
  const now = new Date();
  const year = now.getFullYear();
  const seq = Math.floor(Math.random() * 900000) + 100000;
  return `TRS-${year}-${seq}`;
}
