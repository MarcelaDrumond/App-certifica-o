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

// ── Shared CSS for all certificate pages ─────────────────────────────────────

const CERT_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Inter:wght@400;500;600;700&display=swap');

  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    font-family: 'Inter', Arial, sans-serif;
    background: #FFFFFF;
    color: #212121;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .cert-page {
    width: 210mm;
    height: 297mm;
    overflow: hidden;
    position: relative;
  }

  .half {
    width: 210mm;
    height: 148mm;
    position: relative;
    overflow: hidden;
  }

  .outer-border {
    position: absolute;
    inset: 5mm;
    border: 2.5px solid #1B5E20;
    z-index: 0;
    pointer-events: none;
  }

  .inner-border {
    position: absolute;
    inset: 8mm;
    border: 1px solid #C9A227;
    z-index: 0;
    pointer-events: none;
  }

  .corner { position: absolute; width: 14px; height: 14px; border-color: #C9A227; border-style: solid; z-index: 1; }
  .tl { top: 7.5mm; left: 7.5mm; border-width: 2px 0 0 2px; }
  .tr { top: 7.5mm; right: 7.5mm; border-width: 2px 2px 0 0; }
  .bl { bottom: 7.5mm; left: 7.5mm; border-width: 0 0 2px 2px; }
  .br { bottom: 7.5mm; right: 7.5mm; border-width: 0 2px 2px 0; }

  .half-inner {
    position: relative;
    padding: 10mm 12mm 8mm;
    height: 148mm;
    z-index: 2;
    display: flex;
    flex-direction: column;
  }

  .fold-line {
    width: 210mm;
    height: 1mm;
    border-top: 1px dashed #BDBDBD;
  }

  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-bottom: 7px;
    border-bottom: 2px solid #1B5E20;
    margin-bottom: 7px;
  }

  .cert-title {
    font-family: 'Playfair Display', Georgia, serif;
    font-size: 30px;
    font-weight: 700;
    color: #1B5E20;
    letter-spacing: 2px;
    text-align: center;
    line-height: 1;
    margin-bottom: 3px;
  }

  .cert-subtitle {
    font-size: 8px;
    color: #BDBDBD;
    text-transform: uppercase;
    letter-spacing: 2.5px;
    text-align: center;
  }

  .deco {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 5px 10px;
  }
  .deco::before, .deco::after {
    content: '';
    flex: 1;
    height: 1px;
    background: linear-gradient(to right, transparent, #C9A227, transparent);
  }
  .deco-diamond {
    width: 6px;
    height: 6px;
    background: #C9A227;
    transform: rotate(45deg);
    flex-shrink: 0;
  }

  .cert-body { text-align: center; flex: 1; }

  .certifies-text {
    font-size: 9px;
    color: #757575;
    margin-bottom: 3px;
    line-height: 1.5;
  }

  .employee-name {
    font-family: 'Playfair Display', Georgia, serif;
    font-size: 20px;
    font-weight: 700;
    color: #1B5E20;
    line-height: 1.15;
    margin: 3px 0 2px;
  }

  .employee-role { font-size: 9px; color: #9E9E9E; margin-bottom: 5px; }

  .course-block {
    background: #E8F5E9;
    border-left: 3px solid #2E7D32;
    border-radius: 3px;
    padding: 7px 12px;
    margin: 4px 0;
    text-align: center;
  }

  .course-label { font-size: 7px; color: #9E9E9E; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 2px; }

  .course-name {
    font-family: 'Playfair Display', Georgia, serif;
    font-size: 13px;
    font-weight: 700;
    color: #1B5E20;
    line-height: 1.2;
    margin-bottom: 4px;
  }

  .course-meta { display: flex; gap: 18px; justify-content: center; }
  .meta-col { display: flex; flex-direction: column; gap: 1px; }
  .meta-lbl { font-size: 7px; color: #BDBDBD; text-transform: uppercase; letter-spacing: 0.8px; }
  .meta-val { font-size: 11px; font-weight: 700; color: #212121; }

  .company-block {
    background: #FAFAFA;
    border: 1px solid #EEEEEE;
    border-radius: 3px;
    padding: 5px 12px;
    margin: 4px 0;
    text-align: center;
  }

  .company-lbl { font-size: 7px; color: #BDBDBD; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 2px; }
  .company-name-val { font-size: 11px; font-weight: 700; color: #212121; line-height: 1.3; }
  .company-detail { font-size: 8.5px; color: #9E9E9E; margin-top: 1px; }

  .location-date { font-size: 8px; color: #9E9E9E; text-align: center; font-style: italic; margin: 4px 0; }

  .signatures {
    display: flex;
    justify-content: space-around;
    align-items: flex-end;
    gap: 12px;
    margin-top: 4px;
  }

  .sig-block { flex: 1; text-align: center; }

  .sig-line { border-top: 1px solid #616161; padding-top: 5px; margin-top: 14px; }
  .sig-name { font-size: 9px; font-weight: 700; color: #212121; text-transform: uppercase; letter-spacing: 0.2px; }
  .sig-role { font-size: 8px; color: #9E9E9E; margin-top: 1px; }
  .sig-dsst { font-size: 8px; color: #1B5E20; font-weight: 700; margin-top: 1px; }

  .cert-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 5px;
    padding-top: 5px;
    border-top: 1px solid #EEEEEE;
    gap: 8px;
  }

  .seal {
    width: 50px;
    height: 50px;
    border-radius: 50%;
    border: 2px solid #C9A227;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 4px;
    position: relative;
    flex-shrink: 0;
  }

  .seal::before {
    content: '';
    position: absolute;
    inset: 4px;
    border-radius: 50%;
    border: 1px dashed #C9A227;
  }

  .seal-text {
    font-size: 6px;
    font-weight: 800;
    color: #C9A227;
    text-transform: uppercase;
    letter-spacing: 0.3px;
    line-height: 1.4;
    position: relative;
    z-index: 1;
  }

  .footer-center { flex: 1; text-align: center; }

  .cert-num-label {
    font-size: 7px;
    color: #BDBDBD;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    margin-bottom: 2px;
  }

  .cert-num-value {
    font-size: 10px;
    font-weight: 700;
    color: #1B5E20;
    letter-spacing: 1px;
    font-family: monospace;
    margin-bottom: 3px;
  }

  .footer-auth { font-size: 7px; color: #BDBDBD; text-transform: uppercase; letter-spacing: 0.8px; }

  .p2-heading { flex: 1; padding-left: 12px; }

  .p2-title {
    font-family: 'Playfair Display', Georgia, serif;
    font-size: 18px;
    font-weight: 700;
    color: #1B5E20;
    margin-bottom: 2px;
  }

  .p2-sub { font-size: 9px; color: #9E9E9E; }

  .topics-table { width: 100%; border-collapse: collapse; flex: 1; margin-top: 6px; }

  .topics-table thead th {
    background: #1B5E20;
    color: #FFFFFF;
    text-align: left;
    padding: 6px 10px;
    font-size: 9px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.8px;
  }

  .p2-footer {
    margin-top: auto;
    padding-top: 7px;
    border-top: 1px solid #EEEEEE;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .p2-footer-issuer {
    font-size: 8px;
    color: #BDBDBD;
    text-transform: uppercase;
    letter-spacing: 0.4px;
    line-height: 1.6;
    flex: 1;
  }

  .validity-badge {
    background: #FFF8E1;
    border: 1px solid #C9A227;
    border-radius: 5px;
    padding: 5px 12px;
    text-align: center;
    flex-shrink: 0;
  }

  .validity-lbl { font-size: 7px; color: #9E9E9E; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 1px; }
  .validity-date { font-size: 11px; font-weight: 800; color: #C9A227; }
`;

// ── Builds the body content (two halves) for one certificate ─────────────────

function buildCertPageHtml(
  cert: Certificate,
  trasemeLogoBase64: string,
  companyLogoBase64?: string,
  technicianPhotoBase64?: string
): string {
  const topicos = cert.course?.topicos ?? [];
  const employeeName = cert.employee?.nomeCompleto ?? '';
  const employeeCargo = cert.employee?.funcao ?? '';
  const employeeCPF = cert.employee?.cpf ?? '';
  const courseName = cert.course?.nome ?? '';
  const duracaoHoras = cert.course?.duracaoHoras ?? 0;
  const localDate = `${cert.localRealizacao}, ${formatDateBR(cert.dataRealizacao)}`;
  const techName = cert.technician?.nomeCompleto ?? '';
  const techDSST = cert.technician?.registroDSST ?? '';
  const techFuncao = cert.technician?.funcao ?? '';
  const companyName = cert.company?.razaoSocial ?? '';
  const companyCNPJ = cert.company?.cnpj ?? '';
  const companyEndereco = cert.company?.endereco ?? '';
  const companyCidade = cert.company?.cidade ?? '';
  const companyEstado = cert.company?.estado ?? '';
  const certNumber = cert.numeroUnico;

  const addressLine = [
    companyEndereco,
    [companyCidade, companyEstado].filter(Boolean).join('/'),
  ].filter(Boolean).join(' — ');

  const trasemeLogoHtml = trasemeLogoBase64
    ? `<img src="${trasemeLogoBase64}" style="height:44px;width:auto;object-fit:contain;display:block;" alt="Traseme" />`
    : `<div style="height:44px;width:110px;background:#1B5E20;border-radius:4px;display:flex;align-items:center;justify-content:center;color:white;font-size:14px;font-weight:900;letter-spacing:1px;">TRASEME</div>`;

  const companyLogoHtml = companyLogoBase64
    ? `<img src="${companyLogoBase64}" style="height:40px;width:auto;max-width:110px;object-fit:contain;display:block;" alt="${companyName}" />`
    : `<div style="height:40px;width:40px;background:#E8F5E9;border-radius:4px;display:flex;align-items:center;justify-content:center;color:#1B5E20;font-size:18px;font-weight:800;">${companyName.charAt(0)}</div>`;

  const topicosHtml = topicos
    .map(
      (t, i) =>
        `<tr style="background:${i % 2 === 0 ? '#FAFAFA' : '#FFFFFF'};">
          <td style="padding:5px 10px;border-bottom:1px solid #E0E0E0;color:#1B5E20;font-weight:700;font-size:10px;width:36px;white-space:nowrap;">${t.ordem}.</td>
          <td style="padding:5px 10px;border-bottom:1px solid #E0E0E0;color:#424242;font-size:10px;line-height:1.4;">${t.topico}</td>
        </tr>`
    )
    .join('');

  return `
<!-- ════════════════════ FRENTE ════════════════════ -->
<div class="half">
  <div class="outer-border"></div>
  <div class="inner-border"></div>
  <div class="corner tl"></div><div class="corner tr"></div>
  <div class="corner bl"></div><div class="corner br"></div>

  <div class="half-inner">
    <div class="header">
      ${trasemeLogoHtml}
      ${companyLogoHtml}
    </div>

    <div style="text-align:center;padding:3px 0 2px;">
      <div class="cert-title">Certificado</div>
      <div class="cert-subtitle">de Conclusão de Treinamento</div>
    </div>

    <div class="deco"><div class="deco-diamond"></div></div>

    <div class="cert-body">
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

      <div class="company-block">
        <div class="company-lbl">Empresa</div>
        <div class="company-name-val">${companyName}</div>
        <div class="company-detail">CNPJ: ${companyCNPJ}</div>
        ${addressLine ? `<div class="company-detail">${addressLine}</div>` : ''}
      </div>

      <div class="location-date">${localDate}</div>
    </div>

    <div class="signatures">
      <div class="sig-block">
        <div class="sig-line">
          <div class="sig-name">${employeeName}</div>
          <div class="sig-role">${employeeCargo}</div>
          <div class="sig-dsst">CPF: ${employeeCPF}</div>
        </div>
      </div>
      <div class="sig-block">
        ${technicianPhotoBase64 ? `<img src="${technicianPhotoBase64}" style="width:48px;height:48px;object-fit:cover;border-radius:50%;border:2px solid #1B5E20;display:block;margin:0 auto 4px;" />` : ''}
        <div class="sig-line">
          <div class="sig-name">${techName}</div>
          <div class="sig-role">${techFuncao}</div>
          <div class="sig-dsst">Reg. DSST/MTE: ${techDSST}</div>
        </div>
      </div>
    </div>

    <div class="cert-footer">
      <div class="seal">
        <div class="seal-text">TRASEME<br/>CERTIFICA<br/>✦</div>
      </div>
      <div class="footer-center">
        <div class="cert-num-label">Certificado Nº</div>
        <div class="cert-num-value">${certNumber}</div>
        <div class="footer-auth">Documento autêntico — verifique a autenticidade</div>
      </div>
      ${trasemeLogoBase64 ? `<img src="${trasemeLogoBase64}" style="height:28px;width:auto;opacity:0.3;" alt="" />` : ''}
    </div>
  </div>
</div>

<!-- ════════════════════ DOBRA ════════════════════ -->
<div class="fold-line"></div>

<!-- ════════════════════ VERSO ════════════════════ -->
<div class="half">
  <div class="outer-border"></div>
  <div class="inner-border"></div>
  <div class="corner tl"></div><div class="corner tr"></div>
  <div class="corner bl"></div><div class="corner br"></div>

  <div class="half-inner">
    <div class="header">
      ${trasemeLogoHtml}
      <div class="p2-heading">
        <div class="p2-title">Conteúdo Programático</div>
        <div class="p2-sub">${courseName} &nbsp;·&nbsp; ${duracaoHoras} horas</div>
      </div>
    </div>

    <table class="topics-table">
      <thead>
        <tr>
          <th style="width:42px;">Item</th>
          <th>Tópico</th>
        </tr>
      </thead>
      <tbody>
        ${topicosHtml || '<tr><td colspan="2" style="padding:14px;text-align:center;color:#9E9E9E;font-size:10px;">Nenhum tópico cadastrado.</td></tr>'}
      </tbody>
    </table>

    <div class="p2-footer">
      <div class="p2-footer-issuer">
        ${TRASEME_NAME}<br/>
        CNPJ: ${TRASEME_CNPJ}
      </div>
      <div class="validity-badge">
        <div class="validity-lbl">Válido até</div>
        <div class="validity-date">${formatDateBR(cert.dataValidade)}</div>
      </div>
    </div>
  </div>
</div>`;
}

// ── Full HTML wrappers ────────────────────────────────────────────────────────

function wrapHtml(bodyContent: string): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8"/>
<style>
@page { size: A4 portrait; margin: 0; }
${CERT_CSS}
</style>
</head>
<body>
${bodyContent}
</body>
</html>`;
}

function generateCertificateHtml(
  cert: Certificate,
  trasemeLogoBase64: string,
  companyLogoBase64?: string,
  technicianPhotoBase64?: string
): string {
  return wrapHtml(
    `<div class="cert-page">${buildCertPageHtml(cert, trasemeLogoBase64, companyLogoBase64, technicianPhotoBase64)}</div>`
  );
}

function generateBatchCertificateHtml(
  certs: Certificate[],
  trasemeLogoBase64: string,
  companyLogoBase64?: string,
  technicianPhotoBase64?: string
): string {
  const pages = certs
    .map((cert, i) => {
      const isLast = i === certs.length - 1;
      return `<div class="cert-page" style="${isLast ? '' : 'page-break-after:always;'}">
  ${buildCertPageHtml(cert, trasemeLogoBase64, companyLogoBase64, technicianPhotoBase64)}
</div>`;
    })
    .join('\n');
  return wrapHtml(pages);
}

// ── Filename helpers ──────────────────────────────────────────────────────────

function toSlug(str: string, maxLen = 15): string {
  return str
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')  // remove accents
    .replace(/[^a-zA-Z0-9]/g, '')     // keep only alphanumeric
    .substring(0, maxLen);
}

function buildFilename(cert: Certificate, batch?: { date: string; count: number }): string {
  const courseSlug = cert.course?.codigo
    ? toSlug(cert.course.codigo, 12)
    : toSlug(cert.course?.nome ?? 'Curso', 12);

  const companySlug = cert.company?.nomeFantasia
    ? toSlug(cert.company.nomeFantasia, 15)
    : toSlug(cert.company?.razaoSocial ?? 'Empresa', 15);

  if (batch) {
    return `TRA_${courseSlug}_${companySlug}_Turma${batch.date}_${batch.count}cert.pdf`;
  }

  const firstName = toSlug(
    (cert.employee?.nomeCompleto ?? 'Funcionario').split(' ')[0],
    12
  );
  return `TRA_${courseSlug}_${companySlug}_${firstName}.pdf`;
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function generateAndSharePdf(cert: Certificate): Promise<string> {
  const [trasemeLogo, companyLogo, techPhoto] = await Promise.all([
    getLogoBase64(),
    cert.company?.logoUri ? getCompanyLogoBase64(cert.company.logoUri) : Promise.resolve(''),
    cert.technician?.fotoUri ? getCompanyLogoBase64(cert.technician.fotoUri) : Promise.resolve(''),
  ]);

  const html = generateCertificateHtml(cert, trasemeLogo, companyLogo || undefined, techPhoto || undefined);
  const { uri } = await Print.printToFileAsync({ html, base64: false });

  const fileName = buildFilename(cert);
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

export async function generateBatchAndSharePdf(certs: Certificate[]): Promise<void> {
  if (certs.length === 0) return;

  const companyLogoUri = certs[0]?.company?.logoUri ?? '';
  const techFotoUri = certs[0]?.technician?.fotoUri ?? '';
  const [trasemeLogo, companyLogo, techPhoto] = await Promise.all([
    getLogoBase64(),
    companyLogoUri ? getCompanyLogoBase64(companyLogoUri) : Promise.resolve(''),
    techFotoUri ? getCompanyLogoBase64(techFotoUri) : Promise.resolve(''),
  ]);

  const html = generateBatchCertificateHtml(certs, trasemeLogo, companyLogo || undefined, techPhoto || undefined);
  const { uri } = await Print.printToFileAsync({ html, base64: false });

  const date = format(new Date(), 'yyyyMMdd');
  const fileName = buildFilename(certs[0], { date, count: certs.length });
  const destUri = FileSystem.documentDirectory + fileName;
  await FileSystem.copyAsync({ from: uri, to: destUri });

  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(destUri, {
      mimeType: 'application/pdf',
      dialogTitle: `Compartilhar ${certs.length} Certificados`,
      UTI: 'com.adobe.pdf',
    });
  }
}

export async function printCertificate(cert: Certificate): Promise<void> {
  const [trasemeLogo, companyLogo, techPhoto] = await Promise.all([
    getLogoBase64(),
    cert.company?.logoUri ? getCompanyLogoBase64(cert.company.logoUri) : Promise.resolve(''),
    cert.technician?.fotoUri ? getCompanyLogoBase64(cert.technician.fotoUri) : Promise.resolve(''),
  ]);

  const html = generateCertificateHtml(cert, trasemeLogo, companyLogo || undefined, techPhoto || undefined);
  await Print.printAsync({ html });
}

export function generateCertificateNumber(): string {
  const now = new Date();
  const year = now.getFullYear();
  const seq = Math.floor(Math.random() * 900000) + 100000;
  return `TRS-${year}-${seq}`;
}
