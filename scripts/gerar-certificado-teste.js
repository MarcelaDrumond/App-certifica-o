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
  company:     { razaoSocial: 'Indústrias Metalúrgicas São Paulo S.A.', cnpj: '12.345.678/0001-99', logoUri: null },
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
  const topicosRows = cert.course.topicos.map((t, i) => `
    <tr style="background:${i%2===0?'#FAFAFA':'#FFFFFF'}">
      <td style="padding:9px 14px;border-bottom:1px solid #E0E0E0;color:#1B5E20;font-weight:700;font-size:13px;width:40px;">${t.ordem}.</td>
      <td style="padding:9px 14px;border-bottom:1px solid #E0E0E0;color:#424242;font-size:13px;line-height:1.6;">${t.topico}</td>
    </tr>`).join('');

  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"/>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet"/>
<style>
  *{margin:0;padding:0;box-sizing:border-box;}
  body{font-family:'Inter',Arial,sans-serif;background:#fff;color:#212121;-webkit-print-color-adjust:exact;print-color-adjust:exact;}

  /* ── PAGE WRAPPER ── */
  .page{width:210mm;min-height:297mm;padding:0;position:relative;page-break-after:always;overflow:hidden;}
  .outer-border{position:absolute;inset:10mm;border:3px solid #1B5E20;z-index:0;}
  .inner-border{position:absolute;inset:13.5mm;border:1px solid #C9A227;z-index:0;}
  .corner{position:absolute;width:22px;height:22px;border-color:#C9A227;border-style:solid;z-index:1;}
  .tl{top:13mm;left:13mm;border-width:2px 0 0 2px;}
  .tr{top:13mm;right:13mm;border-width:2px 2px 0 0;}
  .bl{bottom:13mm;left:13mm;border-width:0 0 2px 2px;}
  .br{bottom:13mm;right:13mm;border-width:0 2px 2px 0;}
  .page-inner{position:relative;padding:18mm 21mm 16mm;min-height:297mm;z-index:2;display:flex;flex-direction:column;}

  /* ── HEADER ── */
  .header{display:flex;align-items:center;justify-content:space-between;padding-bottom:12px;border-bottom:2.5px solid #1B5E20;margin-bottom:14px;gap:16px;}
  .header-logos{display:flex;align-items:center;justify-content:space-between;flex:1;}
  .logo-sep{width:1px;height:56px;background:#E0E0E0;flex-shrink:0;}
  .issuer{display:flex;flex-direction:column;gap:3px;flex:1;}
  .issuer-name{font-size:9.5px;font-weight:700;color:#1B5E20;text-transform:uppercase;letter-spacing:.3px;line-height:1.4;}
  .issuer-cnpj{font-size:9px;color:#9E9E9E;}
  .cert-num{text-align:right;flex-shrink:0;}
  .cert-num-lbl{font-size:8px;color:#BDBDBD;text-transform:uppercase;letter-spacing:1.5px;}
  .cert-num-val{font-size:11px;font-weight:700;color:#1B5E20;letter-spacing:1px;font-family:monospace;}

  /* ── TITLE ── */
  .title-block{text-align:center;padding:14px 0 8px;}
  .cert-title{font-family:'Playfair Display',Georgia,serif;font-size:48px;font-weight:700;color:#1B5E20;letter-spacing:3px;line-height:1;margin-bottom:8px;}
  .cert-subtitle{font-size:10px;color:#BDBDBD;text-transform:uppercase;letter-spacing:3px;}

  /* ── DECO ── */
  .deco{display:flex;align-items:center;gap:10px;margin:10px 20px;}
  .deco::before,.deco::after{content:'';flex:1;height:1px;background:linear-gradient(to right,transparent,#C9A227,transparent);}
  .diamond{width:8px;height:8px;background:#C9A227;transform:rotate(45deg);flex-shrink:0;}

  /* ── BODY ── */
  .body{text-align:center;padding:0 8px;flex:1;}
  .certifies{font-size:13px;color:#757575;margin-bottom:8px;line-height:1.6;}
  .emp-name{font-family:'Playfair Display',Georgia,serif;font-size:32px;font-weight:700;color:#1B5E20;line-height:1.1;margin:6px 0 4px;letter-spacing:.5px;}
  .emp-role{font-size:13px;color:#9E9E9E;margin-bottom:14px;}

  .course-block{background:#E8F5E9;border-left:4px solid #2E7D32;border-radius:4px;padding:13px 18px;margin:12px 0;text-align:left;}
  .course-label{font-size:9px;color:#9E9E9E;text-transform:uppercase;letter-spacing:2px;margin-bottom:4px;}
  .course-name{font-family:'Playfair Display',Georgia,serif;font-size:19px;font-weight:700;color:#1B5E20;line-height:1.25;margin-bottom:8px;}
  .course-meta{display:flex;gap:24px;}
  .meta-col{display:flex;flex-direction:column;gap:2px;}
  .meta-lbl{font-size:9px;color:#BDBDBD;text-transform:uppercase;letter-spacing:1px;}
  .meta-val{font-size:14px;font-weight:700;color:#212121;}

  .company-block{background:#FAFAFA;border:1px solid #EEEEEE;border-radius:4px;padding:10px 16px;margin:10px 0;text-align:left;}
  .company-lbl{font-size:9px;color:#BDBDBD;text-transform:uppercase;letter-spacing:2px;margin-bottom:3px;}
  .company-name{font-size:14px;font-weight:700;color:#212121;}
  .company-cnpj{font-size:11px;color:#9E9E9E;font-family:monospace;}

  .loc-date{font-size:12px;color:#9E9E9E;text-align:center;font-style:italic;margin:12px 0;}

  /* ── SIGNATURES ── */
  .sigs{display:flex;justify-content:space-around;align-items:flex-end;gap:24px;margin-top:18px;}
  .sig-block{flex:1;text-align:center;max-width:190px;}
  .sig-line{border-top:1px solid #616161;padding-top:8px;margin-top:28px;}
  .sig-name{font-size:11.5px;font-weight:700;color:#212121;text-transform:uppercase;letter-spacing:.3px;}
  .sig-role{font-size:10px;color:#9E9E9E;margin-top:2px;}
  .sig-dsst{font-size:10px;color:#1B5E20;font-weight:700;margin-top:2px;}

  /* ── FOOTER ── */
  .footer{display:flex;align-items:flex-end;justify-content:space-between;margin-top:16px;padding-top:12px;border-top:1px solid #EEEEEE;}
  .seal{width:76px;height:76px;border-radius:50%;border:2.5px solid #C9A227;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:6px;position:relative;flex-shrink:0;}
  .seal::before{content:'';position:absolute;inset:5px;border-radius:50%;border:1px dashed #C9A227;}
  .seal-text{font-size:7.5px;font-weight:800;color:#C9A227;text-transform:uppercase;letter-spacing:.5px;line-height:1.4;position:relative;z-index:1;}
  .footer-center{flex:1;text-align:center;padding:0 16px;}
  .footer-auth{font-size:9px;color:#BDBDBD;text-transform:uppercase;letter-spacing:1px;margin-bottom:3px;}
  .footer-num{font-size:11px;font-weight:700;color:#424242;font-family:monospace;}
  .footer-logo{height:40px;width:auto;opacity:.35;}

  /* ── PAGE 2 ── */
  .p2-inner{position:relative;padding:18mm 21mm 22mm;min-height:297mm;z-index:2;display:flex;flex-direction:column;}
  .p2-header{display:flex;align-items:center;justify-content:space-between;border-bottom:2.5px solid #1B5E20;padding-bottom:12px;margin-bottom:18px;gap:16px;}
  .p2-heading{}
  .p2-title{font-family:'Playfair Display',Georgia,serif;font-size:22px;font-weight:700;color:#1B5E20;margin-bottom:3px;}
  .p2-sub{font-size:11px;color:#9E9E9E;}
  .topics-table{width:100%;border-collapse:collapse;flex:1;}
  .topics-table thead th{background:#1B5E20;color:#fff;text-align:left;padding:10px 14px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;}
  .p2-footer{margin-top:auto;padding-top:14px;border-top:1px solid #EEEEEE;display:flex;align-items:center;justify-content:space-between;gap:16px;}
  .p2-footer-issuer{font-size:9px;color:#BDBDBD;text-transform:uppercase;letter-spacing:.5px;line-height:1.6;}
  .validity-badge{background:#FFF8E1;border:1px solid #C9A227;border-radius:6px;padding:8px 16px;text-align:center;flex-shrink:0;}
  .validity-lbl{font-size:9px;color:#9E9E9E;text-transform:uppercase;letter-spacing:1px;margin-bottom:2px;}
  .validity-date{font-size:13px;font-weight:800;color:#C9A227;}
</style>
</head>
<body>

<!-- ════════════════════ PÁGINA 1 ════════════════════ -->
<div class="page">
  <div class="outer-border"></div><div class="inner-border"></div>
  <div class="corner tl"></div><div class="corner tr"></div>
  <div class="corner bl"></div><div class="corner br"></div>
  <div class="page-inner">

    <div class="header">
      <div class="header-logos">
        <img src="${logoBase64}" style="height:68px;width:auto;object-fit:contain;" alt="Traseme"/>
        <div style="height:60px;width:60px;background:#E8F5E9;border-radius:6px;display:flex;align-items:center;justify-content:center;color:#1B5E20;font-size:22px;font-weight:800;">${cert.company.razaoSocial.charAt(0)}</div>
      </div>
    </div>

    <div class="title-block">
      <div class="cert-title">Certificado</div>
      <div class="cert-subtitle">de Conclusão de Treinamento</div>
    </div>

    <div class="deco"><div class="diamond"></div></div>

    <div class="body">
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

      <div class="loc-date">${cert.localRealizacao}, ${fmtDate(cert.dataRealizacao)}</div>
    </div>

    <div class="deco"><div class="diamond"></div></div>

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
        <div class="footer-auth">Documento autêntico — verifique a autenticidade</div>
      </div>
      <img src="${logoBase64}" class="footer-logo" alt=""/>
    </div>

  </div>
</div>

<!-- ════════════════════ PÁGINA 2 ════════════════════ -->
<div class="page">
  <div class="outer-border"></div><div class="inner-border"></div>
  <div class="corner tl"></div><div class="corner tr"></div>
  <div class="corner bl"></div><div class="corner br"></div>
  <div class="p2-inner">

    <div class="p2-header">
      <img src="${logoBase64}" style="height:56px;width:auto;object-fit:contain;flex-shrink:0;" alt="Traseme"/>
      <div class="p2-heading">
        <div class="p2-title">Conteúdo Programático</div>
        <div class="p2-sub">${cert.course.nome} &nbsp;·&nbsp; ${cert.course.duracaoHoras} horas</div>
      </div>
    </div>

    <table class="topics-table">
      <thead><tr><th style="width:52px;">Item</th><th>Tópico</th></tr></thead>
      <tbody>${topicosRows}</tbody>
    </table>

    <div class="p2-footer">
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
