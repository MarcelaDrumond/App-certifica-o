import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { Asset } from 'expo-asset';
import { Certificate } from '../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const TRASEME_NAME = 'TRASEME MEDICINA E SEGURANÇA DO TRABALHO LTDA';
const TRASEME_CNPJ = '34.046.480/0001-43';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const TRASEME_LOGO_MODULE = require('../../assets/traseme-logo.png');

async function getLogoBase64(): Promise<string> {
  const asset = Asset.fromModule(TRASEME_LOGO_MODULE);
  await asset.downloadAsync();
  const localUri = asset.localUri;
  if (!localUri) return '';
  const base64 = await FileSystem.readAsStringAsync(localUri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  return `data:image/png;base64,${base64}`;
}

export async function getCompanyLogoBase64(uri: string): Promise<string> {
  try {
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    const ext = uri.split('.').pop()?.toLowerCase() ?? 'png';
    const mime = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : 'image/png';
    return `data:${mime};base64,${base64}`;
  } catch {
    return '';
  }
}

function formatDateBR(dateStr: string): string {
  try {
    const date = new Date(dateStr + 'T12:00:00');
    return format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  } catch {
    return dateStr;
  }
}

function generateCertificateHtml(
  cert: Certificate,
  trasemeLogoBase64: string,
  companyLogoBase64?: string
): string {
  const topicos = cert.course?.topicos ?? [];
  const employeeName = cert.employee?.nomeCompleto ?? '';
  const employeeCargo = cert.employee?.funcao ?? '';
  const courseName = cert.course?.nome ?? '';
  const duracaoHoras = cert.course?.duracaoHoras ?? 0;
  const localDate = `${cert.localRealizacao}, ${formatDateBR(cert.dataRealizacao)}`;
  const techName = cert.technician?.nomeCompleto ?? '';
  const techDSST = cert.technician?.registroDSST ?? '';
  const techFuncao = cert.technician?.funcao ?? '';
  const companyName = cert.company?.razaoSocial ?? '';

  const trasemeLogoHtml = trasemeLogoBase64
    ? `<img src="${trasemeLogoBase64}" style="height:68px;width:auto;object-fit:contain;display:block;" alt="Traseme" />`
    : `<div style="height:68px;width:140px;background:#1B5E20;border-radius:6px;display:flex;align-items:center;justify-content:center;color:white;font-size:18px;font-weight:900;letter-spacing:2px;">TRASEME</div>`;

  const companyLogoHtml = companyLogoBase64
    ? `<img src="${companyLogoBase64}" style="height:60px;width:auto;max-width:130px;object-fit:contain;display:block;" alt="${companyName}" />`
    : `<div style="height:60px;width:60px;background:#E8F5E9;border-radius:6px;display:flex;align-items:center;justify-content:center;color:#1B5E20;font-size:22px;font-weight:800;">${companyName.charAt(0)}</div>`;

  const topicosHtml = topicos
    .map(
      (t, i) =>
        `<tr style="background:${i % 2 === 0 ? '#FAFAFA' : '#FFFFFF'};">
          <td style="padding:9px 14px;border-bottom:1px solid #E0E0E0;color:#1B5E20;font-weight:700;font-size:13px;width:40px;white-space:nowrap;">${t.ordem}.</td>
          <td style="padding:9px 14px;border-bottom:1px solid #E0E0E0;color:#424242;font-size:13px;line-height:1.5;">${t.topico}</td>
        </tr>`
    )
    .join('');

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8"/>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Inter:wght@400;500;600;700&display=swap');

  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    font-family: 'Inter', Arial, sans-serif;
    background: #FFFFFF;
    color: #212121;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .page {
    width: 210mm;
    min-height: 297mm;
    padding: 0;
    position: relative;
    page-break-after: always;
    overflow: hidden;
  }

  /* Dupla moldura */
  .outer-border {
    position: absolute;
    inset: 10mm;
    border: 3px solid #1B5E20;
    z-index: 0;
  }
  .inner-border {
    position: absolute;
    inset: 13.5mm;
    border: 1px solid #C9A227;
    z-index: 0;
  }

  /* Ornamentos de canto */
  .corner { position: absolute; width: 22px; height: 22px; border-color: #C9A227; border-style: solid; z-index: 1; }
  .tl { top: 13mm; left: 13mm; border-width: 2px 0 0 2px; }
  .tr { top: 13mm; right: 13mm; border-width: 2px 2px 0 0; }
  .bl { bottom: 13mm; left: 13mm; border-width: 0 0 2px 2px; }
  .br { bottom: 13mm; right: 13mm; border-width: 0 2px 2px 0; }

  .page-inner {
    position: relative;
    padding: 18mm 21mm 16mm;
    min-height: 297mm;
    z-index: 2;
    display: flex;
    flex-direction: column;
  }

  /* ── CABEÇALHO ── */
  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-bottom: 12px;
    border-bottom: 2.5px solid #1B5E20;
    margin-bottom: 14px;
    gap: 16px;
  }

  .header-logos {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex: 1;
  }

  .logo-separator {
    width: 1px;
    height: 56px;
    background: #E0E0E0;
    flex-shrink: 0;
  }

  .issuer-block {
    display: flex;
    flex-direction: column;
    gap: 3px;
    flex: 1;
  }

  .issuer-name {
    font-size: 9.5px;
    font-weight: 700;
    color: #1B5E20;
    text-transform: uppercase;
    letter-spacing: 0.3px;
    line-height: 1.4;
  }

  .issuer-cnpj {
    font-size: 9px;
    color: #9E9E9E;
  }

  .header-right {
    text-align: right;
    flex-shrink: 0;
  }

  .cert-n-label {
    font-size: 8px;
    color: #BDBDBD;
    text-transform: uppercase;
    letter-spacing: 1.5px;
  }

  .cert-n-value {
    font-size: 11px;
    font-weight: 700;
    color: #1B5E20;
    letter-spacing: 1px;
    font-family: monospace;
  }

  /* ── TÍTULO ── */
  .title-block {
    text-align: center;
    padding: 14px 0 8px;
  }

  .cert-title {
    font-family: 'Playfair Display', Georgia, serif;
    font-size: 48px;
    font-weight: 700;
    color: #1B5E20;
    letter-spacing: 3px;
    line-height: 1;
    margin-bottom: 8px;
  }

  .cert-subtitle {
    font-size: 10px;
    color: #BDBDBD;
    text-transform: uppercase;
    letter-spacing: 3px;
  }

  /* Linha decorativa âmbar */
  .deco {
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 10px 20px;
  }
  .deco::before, .deco::after {
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

  /* ── CORPO ── */
  .body {
    text-align: center;
    padding: 0 8px;
    flex: 1;
  }

  .certifies-text {
    font-size: 13px;
    color: #757575;
    margin-bottom: 8px;
    line-height: 1.6;
  }

  .employee-name {
    font-family: 'Playfair Display', Georgia, serif;
    font-size: 32px;
    font-weight: 700;
    color: #1B5E20;
    line-height: 1.1;
    margin: 6px 0 4px;
    letter-spacing: 0.5px;
  }

  .employee-role {
    font-size: 13px;
    color: #9E9E9E;
    margin-bottom: 14px;
  }

  /* Bloco do curso */
  .course-block {
    background: #E8F5E9;
    border-left: 4px solid #2E7D32;
    border-radius: 4px;
    padding: 13px 18px;
    margin: 12px 0;
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
    font-family: 'Playfair Display', Georgia, serif;
    font-size: 19px;
    font-weight: 700;
    color: #1B5E20;
    line-height: 1.25;
    margin-bottom: 8px;
  }

  .course-meta {
    display: flex;
    gap: 24px;
  }

  .meta-col {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .meta-lbl {
    font-size: 9px;
    color: #BDBDBD;
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  .meta-val {
    font-size: 14px;
    font-weight: 700;
    color: #212121;
  }

  /* Bloco da empresa cliente */
  .company-block {
    background: #FAFAFA;
    border: 1px solid #EEEEEE;
    border-radius: 4px;
    padding: 10px 16px;
    margin: 10px 0;
    text-align: left;
    display: flex;
    align-items: center;
    gap: 14px;
  }

  .company-logo-cell {
    flex-shrink: 0;
  }

  .company-text {
    flex: 1;
  }

  .company-lbl {
    font-size: 9px;
    color: #BDBDBD;
    text-transform: uppercase;
    letter-spacing: 2px;
    margin-bottom: 3px;
  }

  .company-name {
    font-size: 14px;
    font-weight: 700;
    color: #212121;
  }

  .company-cnpj {
    font-size: 11px;
    color: #9E9E9E;
    font-family: monospace;
  }

  .location-date {
    font-size: 12px;
    color: #9E9E9E;
    text-align: center;
    font-style: italic;
    margin: 12px 0;
  }

  /* ── ASSINATURAS ── */
  .signatures {
    display: flex;
    justify-content: space-around;
    align-items: flex-end;
    gap: 24px;
    margin-top: 18px;
  }

  .sig-block {
    flex: 1;
    text-align: center;
    max-width: 190px;
  }

  .sig-line {
    border-top: 1px solid #616161;
    padding-top: 8px;
    margin-top: 28px;
  }

  .sig-name {
    font-size: 11.5px;
    font-weight: 700;
    color: #212121;
    text-transform: uppercase;
    letter-spacing: 0.3px;
  }

  .sig-role {
    font-size: 10px;
    color: #9E9E9E;
    margin-top: 2px;
  }

  .sig-dsst {
    font-size: 10px;
    color: #1B5E20;
    font-weight: 700;
    margin-top: 2px;
  }

  /* ── RODAPÉ / SELO ── */
  .footer {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    margin-top: 16px;
    padding-top: 12px;
    border-top: 1px solid #EEEEEE;
  }

  .seal {
    width: 76px;
    height: 76px;
    border-radius: 50%;
    border: 2.5px solid #C9A227;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 6px;
    position: relative;
    flex-shrink: 0;
  }

  .seal::before {
    content: '';
    position: absolute;
    inset: 5px;
    border-radius: 50%;
    border: 1px dashed #C9A227;
  }

  .seal-text {
    font-size: 7.5px;
    font-weight: 800;
    color: #C9A227;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    line-height: 1.4;
    position: relative;
    z-index: 1;
  }

  .footer-center {
    flex: 1;
    text-align: center;
    padding: 0 16px;
  }

  .footer-auth {
    font-size: 9px;
    color: #BDBDBD;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 3px;
  }

  .footer-num {
    font-size: 11px;
    font-weight: 700;
    color: #424242;
    font-family: monospace;
  }

  /* ═══════════ PÁGINA 2 ═══════════ */
  .page2 {
    width: 210mm;
    min-height: 297mm;
    padding: 0;
    position: relative;
  }

  .page2-inner {
    position: relative;
    padding: 18mm 21mm 22mm;
    min-height: 297mm;
    z-index: 2;
    display: flex;
    flex-direction: column;
  }

  .page2-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 2.5px solid #1B5E20;
    padding-bottom: 12px;
    margin-bottom: 18px;
    gap: 16px;
  }

  .page2-logo {
    flex-shrink: 0;
  }

  .page2-heading {
    flex: 1;
  }

  .page2-title {
    font-family: 'Playfair Display', Georgia, serif;
    font-size: 22px;
    font-weight: 700;
    color: #1B5E20;
    margin-bottom: 3px;
  }

  .page2-sub {
    font-size: 11px;
    color: #9E9E9E;
  }

  .topics-table {
    width: 100%;
    border-collapse: collapse;
    flex: 1;
  }

  .topics-table thead th {
    background: #1B5E20;
    color: #FFFFFF;
    text-align: left;
    padding: 10px 14px;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  .page2-footer {
    margin-top: auto;
    padding-top: 14px;
    border-top: 1px solid #EEEEEE;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
  }

  .page2-footer-left {
    flex: 1;
  }

  .page2-footer-issuer {
    font-size: 9px;
    color: #BDBDBD;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    line-height: 1.6;
  }

  .validity-badge {
    background: #FFF8E1;
    border: 1px solid #C9A227;
    border-radius: 6px;
    padding: 8px 16px;
    text-align: center;
    flex-shrink: 0;
  }

  .validity-lbl {
    font-size: 9px;
    color: #9E9E9E;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 2px;
  }

  .validity-date {
    font-size: 13px;
    font-weight: 800;
    color: #C9A227;
  }
</style>
</head>
<body>

<!-- ════════════════════ PÁGINA 1 ════════════════════ -->
<div class="page">
  <div class="outer-border"></div>
  <div class="inner-border"></div>
  <div class="corner tl"></div>
  <div class="corner tr"></div>
  <div class="corner bl"></div>
  <div class="corner br"></div>

  <div class="page-inner">

    <!-- Cabeçalho com logo Traseme + logo empresa -->
    <div class="header">
      <div class="header-logos">
        ${trasemeLogoHtml}
        <div class="company-logo-cell">${companyLogoHtml}</div>
      </div>
    </div>

    <!-- Título -->
    <div class="title-block">
      <div class="cert-title">Certificado</div>
      <div class="cert-subtitle">de Conclusão de Treinamento</div>
    </div>

    <div class="deco"><div class="deco-diamond"></div></div>

    <!-- Corpo -->
    <div class="body">
      <div class="certifies-text">
        Certificamos que o profissional abaixo identificado participou e concluiu<br/>
        com aproveitamento o treinamento especificado neste documento.
      </div>

      <div class="employee-name">${employeeName}</div>
      <div class="employee-role">${employeeCargo}</div>

      <div class="course-block">
        <div class="course-label">Treinamento Realizado</div>
        <div class="course-name">${courseName}</div>
        <div class="course-meta">
          <div class="meta-col">
            <span class="meta-lbl">Carga Horária</span>
            <span class="meta-val">${duracaoHoras}h</span>
          </div>
          <div class="meta-col">
            <span class="meta-lbl">Válido até</span>
            <span class="meta-val">${formatDateBR(cert.dataValidade)}</span>
          </div>
        </div>
      </div>

      <div class="location-date">${localDate}</div>
    </div>

    <div class="deco"><div class="deco-diamond"></div></div>

    <!-- Assinaturas -->
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

    <!-- Rodapé -->
    <div class="footer">
      <div class="seal">
        <div class="seal-text">TRASEME<br/>CERTIFICA<br/>✦</div>
      </div>
      <div class="footer-center">
        <div class="footer-auth">Documento autêntico — verifique a autenticidade</div>
      </div>
      ${trasemeLogoBase64 ? `<img src="${trasemeLogoBase64}" style="height:40px;width:auto;object-fit:contain;opacity:0.35;" alt="" />` : ''}
    </div>

  </div>
</div>

<!-- ════════════════════ PÁGINA 2 ════════════════════ -->
<div class="page2">
  <div class="outer-border"></div>
  <div class="inner-border"></div>
  <div class="corner tl"></div>
  <div class="corner tr"></div>
  <div class="corner bl"></div>
  <div class="corner br"></div>

  <div class="page2-inner">

    <div class="page2-header">
      <div class="page2-logo">
        ${trasemeLogoHtml}
      </div>
      <div class="page2-heading">
        <div class="page2-title">Conteúdo Programático</div>
        <div class="page2-sub">
          ${courseName} &nbsp;·&nbsp; ${duracaoHoras} horas
        </div>
      </div>
    </div>

    <table class="topics-table">
      <thead>
        <tr>
          <th style="width:52px;">Item</th>
          <th>Tópico</th>
        </tr>
      </thead>
      <tbody>
        ${topicosHtml || '<tr><td colspan="2" style="padding:20px;text-align:center;color:#9E9E9E;">Nenhum tópico cadastrado.</td></tr>'}
      </tbody>
    </table>

    <div class="page2-footer">
      <div class="validity-badge">
        <div class="validity-lbl">Válido até</div>
        <div class="validity-date">${formatDateBR(cert.dataValidade)}</div>
      </div>
    </div>

  </div>
</div>

</body>
</html>
`;
}

export async function generateAndSharePdf(cert: Certificate): Promise<string> {
  const [trasemeLogo, companyLogo] = await Promise.all([
    getLogoBase64(),
    cert.company?.logoUri ? getCompanyLogoBase64(cert.company.logoUri) : Promise.resolve(''),
  ]);

  const html = generateCertificateHtml(cert, trasemeLogo, companyLogo || undefined);

  const { uri } = await Print.printToFileAsync({ html, base64: false });

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
  const [trasemeLogo, companyLogo] = await Promise.all([
    getLogoBase64(),
    cert.company?.logoUri ? getCompanyLogoBase64(cert.company.logoUri) : Promise.resolve(''),
  ]);

  const html = generateCertificateHtml(cert, trasemeLogo, companyLogo || undefined);
  await Print.printAsync({ html });
}

export function generateCertificateNumber(): string {
  const now = new Date();
  const year = now.getFullYear();
  const seq = Math.floor(Math.random() * 900000) + 100000;
  return `TRS-${year}-${seq}`;
}
