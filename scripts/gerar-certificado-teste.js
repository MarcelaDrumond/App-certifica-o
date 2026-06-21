#!/usr/bin/env node
/**
 * Gera um certificado de TESTE em PDF usando dados fictícios.
 * Usa puppeteer (Chrome headless) para renderizar o HTML e exportar PDF A4.
 */

const puppeteer = require('/opt/node22/lib/node_modules/puppeteer');
const fs = require('fs');
const path = require('path');

// ── Logo Traseme em base64 ────────────────────────────────────────────────────
const logoPath = path.join(__dirname, '../assets/traseme-logo.png');
const logoBase64 = `data:image/png;base64,${fs.readFileSync(logoPath).toString('base64')}`;

// ── Dados de teste ────────────────────────────────────────────────────────────
const cert = {
  numeroUnico: 'TRS-2025-482391',
  employee:    { nomeCompleto: 'Maria Fernanda Oliveira Costa', funcao: 'Técnica de Enfermagem do Trabalho' },
  company:     { razaoSocial: 'Indústrias Metalúrgicas São Paulo S.A.', cnpj: '12.345.678/0001-99', endereco: 'Rua das Indústrias, 450', cidade: 'São Paulo', estado: 'SP', logoUri: null },
  course: {
    nome: 'NR-35 — Trabalho em Altura',
    duracaoHoras: 8,
    validadeAnos: 2,
    topicos: [
      { ordem: 1, topico: 'Conceitos e normas regulamentadoras aplicáveis ao trabalho em altura' },
      { ordem: 2, topico: 'Riscos potenciais inerentes ao trabalho em altura e medidas de prevenção e controle' },
      { ordem: 3, topico: 'Análise de Risco e condições impeditivas' },
      { ordem: 4, topico: 'Equipamentos de Proteção Individual (EPI) para trabalho em altura — Seleção, inspeção, conservação e limitações de uso' },
      { ordem: 5, topico: 'Sistemas de proteção coletiva — Guarda-corpos, redes de segurança e plataformas' },
      { ordem: 6, topico: 'Planejamento, organização e execução de trabalho em altura com segurança' },
      { ordem: 7, topico: 'Noções de primeiros socorros e procedimentos de emergência' },
      { ordem: 8, topico: 'Permissão de trabalho em altura (PTA) e sistemas de gestão de SST' },
    ]
  },
  technician:       { nomeCompleto: 'Carlos Eduardo Martins', funcao: 'Técnico de Segurança do Trabalho', registroDSST: 'TST-078432/SP' },
  localRealizacao:  'São Paulo/SP',
  dataRealizacao:   '2025-06-20',
  dataValidade:     '2027-06-20',
};

// ── Formatar data ─────────────────────────────────────────────────────────────
const MONTHS = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
function fmtDate(iso) {
  const [y, m, d] = iso.split('-');
  return `${parseInt(d)} de ${MONTHS[parseInt(m)-1]} de ${y}`;
}

// ── Gerar HTML (mesma lógica de pdfService.ts) ─────────────────────────────
function buildHtml() {
  const addressLine = [
    cert.company.endereco,
    [cert.company.cidade, cert.company.estado].filter(Boolean).join('/'),
  ].filter(Boolean).join(' — ');

  const companyLogoHtml = `<div style="height:40px;width:40px;background:#E8F5E9;border-radius:4px;display:flex;align-items:center;justify-content:center;color:#1B5E20;font-size:18px;font-weight:800;">${cert.company.razaoSocial.charAt(0)}</div>`;

  const topicosRows = cert.course.topicos.map((t, i) => `
    <tr style="background:${i%2===0?'#FAFAFA':'#FFFFFF'}">
      <td style="padding:5px 10px;border-bottom:1px solid #E0E0E0;color:#1B5E20;font-weight:700;font-size:10px;width:36px;">${t.ordem}.</td>
      <td style="padding:5px 10px;border-bottom:1px solid #E0E0E0;color:#424242;font-size:10px;line-height:1.4;">${t.topico}</td>
    </tr>`).join('');

  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"/>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet"/>
<style>
  *{margin:0;padding:0;box-sizing:border-box;}
  body{font-family:'Inter',Arial,sans-serif;background:#fff;color:#212121;-webkit-print-color-adjust:exact;print-color-adjust:exact;width:210mm;height:297mm;overflow:hidden;}

  .half{width:210mm;height:148mm;position:relative;overflow:hidden;}
  .outer-border{position:absolute;inset:5mm;border:2.5px solid #1B5E20;z-index:0;pointer-events:none;}
  .inner-border{position:absolute;inset:8mm;border:1px solid #C9A227;z-index:0;pointer-events:none;}
  .corner{position:absolute;width:14px;height:14px;border-color:#C9A227;border-style:solid;z-index:1;}
  .tl{top:7.5mm;left:7.5mm;border-width:2px 0 0 2px;}
  .tr{top:7.5mm;right:7.5mm;border-width:2px 2px 0 0;}
  .bl{bottom:7.5mm;left:7.5mm;border-width:0 0 2px 2px;}
  .br{bottom:7.5mm;right:7.5mm;border-width:0 2px 2px 0;}
  .half-inner{position:relative;padding:10mm 12mm 8mm;height:148mm;z-index:2;display:flex;flex-direction:column;}

  .fold-line{width:210mm;height:1mm;border-top:1px dashed #BDBDBD;}

  .header{display:flex;align-items:center;justify-content:space-between;padding-bottom:7px;border-bottom:2px solid #1B5E20;margin-bottom:7px;}

  .cert-title{font-family:'Playfair Display',Georgia,serif;font-size:30px;font-weight:700;color:#1B5E20;letter-spacing:2px;text-align:center;line-height:1;margin-bottom:3px;}
  .cert-subtitle{font-size:8px;color:#BDBDBD;text-transform:uppercase;letter-spacing:2.5px;text-align:center;}

  .deco{display:flex;align-items:center;gap:8px;margin:5px 10px;}
  .deco::before,.deco::after{content:'';flex:1;height:1px;background:linear-gradient(to right,transparent,#C9A227,transparent);}
  .diamond{width:6px;height:6px;background:#C9A227;transform:rotate(45deg);flex-shrink:0;}

  .cert-body{text-align:center;flex:1;}
  .certifies{font-size:9px;color:#757575;margin-bottom:3px;line-height:1.5;}
  .emp-name{font-family:'Playfair Display',Georgia,serif;font-size:20px;font-weight:700;color:#1B5E20;line-height:1.15;margin:3px 0 2px;}
  .emp-role{font-size:9px;color:#9E9E9E;margin-bottom:5px;}

  .course-block{background:#E8F5E9;border-left:3px solid #2E7D32;border-radius:3px;padding:7px 12px;margin:4px 0;text-align:left;}
  .course-label{font-size:7px;color:#9E9E9E;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:2px;}
  .course-name{font-family:'Playfair Display',Georgia,serif;font-size:13px;font-weight:700;color:#1B5E20;line-height:1.2;margin-bottom:4px;}
  .course-meta{display:flex;gap:18px;}
  .meta-col{display:flex;flex-direction:column;gap:1px;}
  .meta-lbl{font-size:7px;color:#BDBDBD;text-transform:uppercase;letter-spacing:.8px;}
  .meta-val{font-size:11px;font-weight:700;color:#212121;}

  .company-block{background:#FAFAFA;border:1px solid #EEEEEE;border-radius:3px;padding:5px 12px;margin:4px 0;text-align:left;}
  .company-lbl{font-size:7px;color:#BDBDBD;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:2px;}
  .company-name-val{font-size:11px;font-weight:700;color:#212121;line-height:1.3;}
  .company-detail{font-size:8.5px;color:#9E9E9E;margin-top:1px;}

  .loc-date{font-size:8px;color:#9E9E9E;text-align:center;font-style:italic;margin:4px 0;}

  .sigs{display:flex;justify-content:space-around;align-items:flex-end;gap:12px;margin-top:4px;}
  .sig-block{flex:1;text-align:center;}
  .sig-line{border-top:1px solid #616161;padding-top:5px;margin-top:14px;}
  .sig-name{font-size:9px;font-weight:700;color:#212121;text-transform:uppercase;letter-spacing:.2px;}
  .sig-role{font-size:8px;color:#9E9E9E;margin-top:1px;}
  .sig-dsst{font-size:8px;color:#1B5E20;font-weight:700;margin-top:1px;}

  .footer{display:flex;align-items:center;justify-content:space-between;margin-top:5px;padding-top:5px;border-top:1px solid #EEEEEE;gap:8px;}
  .seal{width:50px;height:50px;border-radius:50%;border:2px solid #C9A227;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:4px;position:relative;flex-shrink:0;}
  .seal::before{content:'';position:absolute;inset:4px;border-radius:50%;border:1px dashed #C9A227;}
  .seal-text{font-size:6px;font-weight:800;color:#C9A227;text-transform:uppercase;letter-spacing:.3px;line-height:1.4;position:relative;z-index:1;}
  .footer-center{flex:1;text-align:center;}
  .cert-num-label{font-size:7px;color:#BDBDBD;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:2px;}
  .cert-num-value{font-size:10px;font-weight:700;color:#1B5E20;letter-spacing:1px;font-family:monospace;margin-bottom:3px;}
  .footer-auth{font-size:7px;color:#BDBDBD;text-transform:uppercase;letter-spacing:.8px;}

  .p2-heading{flex:1;padding-left:12px;}
  .p2-title{font-family:'Playfair Display',Georgia,serif;font-size:18px;font-weight:700;color:#1B5E20;margin-bottom:2px;}
  .p2-sub{font-size:9px;color:#9E9E9E;}
  .topics-table{width:100%;border-collapse:collapse;flex:1;margin-top:6px;}
  .topics-table thead th{background:#1B5E20;color:#fff;text-align:left;padding:6px 10px;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;}
  .p2-footer{margin-top:auto;padding-top:7px;border-top:1px solid #EEEEEE;display:flex;align-items:center;justify-content:space-between;gap:12px;}
  .p2-issuer{font-size:8px;color:#BDBDBD;text-transform:uppercase;letter-spacing:.4px;line-height:1.6;flex:1;}
  .validity-badge{background:#FFF8E1;border:1px solid #C9A227;border-radius:5px;padding:5px 12px;text-align:center;flex-shrink:0;}
  .validity-lbl{font-size:7px;color:#9E9E9E;text-transform:uppercase;letter-spacing:.8px;margin-bottom:1px;}
  .validity-date{font-size:11px;font-weight:800;color:#C9A227;}
</style>
</head>
<body>

<!-- ════════ FRENTE: CERTIFICADO ════════ -->
<div class="half">
  <div class="outer-border"></div><div class="inner-border"></div>
  <div class="corner tl"></div><div class="corner tr"></div>
  <div class="corner bl"></div><div class="corner br"></div>
  <div class="half-inner">

    <div class="header">
      <img src="${logoBase64}" style="height:44px;width:auto;object-fit:contain;" alt="Traseme"/>
      ${companyLogoHtml}
    </div>

    <div style="text-align:center;padding:3px 0 2px;">
      <div class="cert-title">Certificado</div>
      <div class="cert-subtitle">de Conclusão de Treinamento</div>
    </div>

    <div class="deco"><div class="diamond"></div></div>

    <div class="cert-body">
      <div class="certifies">Certificamos que o profissional abaixo identificado participou e concluiu<br/>com aproveitamento o treinamento especificado neste documento.</div>
      <div class="emp-name">${cert.employee.nomeCompleto}</div>
      <div class="emp-role">${cert.employee.funcao}</div>

      <div class="course-block">
        <div class="course-label">Treinamento Realizado</div>
        <div class="course-name">${cert.course.nome}</div>
        <div class="course-meta">
          <div class="meta-col"><span class="meta-lbl">Carga Horária</span><span class="meta-val">${cert.course.duracaoHoras}h</span></div>
          <div class="meta-col"><span class="meta-lbl">Válido até</span><span class="meta-val">${fmtDate(cert.dataValidade)}</span></div>
        </div>
      </div>

      <div class="company-block">
        <div class="company-lbl">Empresa</div>
        <div class="company-name-val">${cert.company.razaoSocial}</div>
        <div class="company-detail">CNPJ: ${cert.company.cnpj}</div>
        ${addressLine ? `<div class="company-detail">${addressLine}</div>` : ''}
      </div>

      <div class="loc-date">${cert.localRealizacao}, ${fmtDate(cert.dataRealizacao)}</div>
    </div>

    <div class="sigs">
      <div class="sig-block">
        <div class="sig-line">
          <div class="sig-name">${cert.employee.nomeCompleto}</div>
          <div class="sig-role">Participante</div>
        </div>
      </div>
      <div class="sig-block">
        <div class="sig-line">
          <div class="sig-name">${cert.technician.nomeCompleto}</div>
          <div class="sig-role">${cert.technician.funcao}</div>
          <div class="sig-dsst">Reg. DSST/MTE: ${cert.technician.registroDSST}</div>
        </div>
      </div>
    </div>

    <div class="footer">
      <div class="seal"><div class="seal-text">TRASEME<br/>CERTIFICA<br/>✦</div></div>
      <div class="footer-center">
        <div class="cert-num-label">Certificado Nº</div>
        <div class="cert-num-value">${cert.numeroUnico}</div>
        <div class="footer-auth">Documento autêntico — verifique a autenticidade</div>
      </div>
      <img src="${logoBase64}" style="height:28px;width:auto;opacity:.3;" alt=""/>
    </div>

  </div>
</div>

<!-- ════════ LINHA DE DOBRA ════════ -->
<div class="fold-line"></div>

<!-- ════════ VERSO: CONTEÚDO PROGRAMÁTICO ════════ -->
<div class="half">
  <div class="outer-border"></div><div class="inner-border"></div>
  <div class="corner tl"></div><div class="corner tr"></div>
  <div class="corner bl"></div><div class="corner br"></div>
  <div class="half-inner">

    <div class="header">
      <img src="${logoBase64}" style="height:44px;width:auto;object-fit:contain;flex-shrink:0;" alt="Traseme"/>
      <div class="p2-heading">
        <div class="p2-title">Conteúdo Programático</div>
        <div class="p2-sub">${cert.course.nome} &nbsp;·&nbsp; ${cert.course.duracaoHoras} horas</div>
      </div>
    </div>

    <table class="topics-table">
      <thead><tr><th style="width:42px;">Item</th><th>Tópico</th></tr></thead>
      <tbody>${topicosRows}</tbody>
    </table>

    <div class="p2-footer">
      <div class="p2-issuer">
        TRASEME MEDICINA E SEGURANÇA DO TRABALHO LTDA<br/>
        CNPJ: 34.046.480/0001-43
      </div>
      <div class="validity-badge">
        <div class="validity-lbl">Válido até</div>
        <div class="validity-date">${fmtDate(cert.dataValidade)}</div>
      </div>
    </div>

  </div>
</div>

</body></html>`;
}

// ── Gerar PDF com Puppeteer ───────────────────────────────────────────────────
(async () => {
  console.log('⏳  Iniciando Chrome headless...');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security'],
  });

  const page = await browser.newPage();
  const html = buildHtml();

  // Salvar HTML para inspeção
  fs.writeFileSync('/tmp/certificado_teste.html', html);
  console.log('✅  HTML salvo em /tmp/certificado_teste.html');

  await page.setContent(html, { waitUntil: 'networkidle0', timeout: 30000 });

  // Aguardar fontes do Google carregarem
  await page.evaluateHandle('document.fonts.ready');

  const pdfBuffer = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: { top: '0', right: '0', bottom: '0', left: '0' },
  });

  const outPath = '/tmp/certificado_teste.pdf';
  fs.writeFileSync(outPath, pdfBuffer);
  console.log(`✅  PDF salvo em ${outPath} (${(pdfBuffer.length / 1024).toFixed(0)} KB)`);

  await browser.close();
  console.log('🎉  Concluído!');
})().catch(err => {
  console.error('❌  Erro:', err.message);
  process.exit(1);
});
