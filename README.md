# 🎓 Traseme Certificados

**Aplicativo de emissão e gestão de certificados de treinamento** — cadastro de
empresas, funcionários, cursos e responsáveis técnicos, com geração de certificados em
PDF prontos para impressão. Desenvolvido em React Native + Expo com TypeScript.

![React Native](https://img.shields.io/badge/React%20Native-Expo-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-local--first-07405E?logo=sqlite&logoColor=white)

## ⚠️ Status do projeto

Os ícones e a logo em `assets/` ainda são placeholders (veja
[`assets/README.md`](assets/README.md)) — o app builda e funciona normalmente, mas
precisa dos arquivos reais da Traseme antes de ir para produção/loja.

## Sobre o projeto

Traseme Certificados centraliza o cadastro de empresas clientes, seus funcionários e os
cursos realizados, permitindo emitir certificados de treinamento com validade, conteúdo
programático e assinatura de um responsável técnico (DSST/MTE) — tudo em PDF pronto para
impressão ou compartilhamento.

## Funcionalidades

- **Empresas**: cadastro de clientes com logo, CNPJ e endereço
- **Funcionários**: vinculados a cada empresa, com CPF e cargo
- **Cursos**: carga horária, validade e conteúdo programático
- **Responsáveis Técnicos**: com registro DSST/MTE
- **Certificados**: emissão com preview de 2 páginas, exportação em PDF e impressão

## Stack técnica

| Camada | Tecnologia |
|---|---|
| Framework | React Native + Expo |
| Linguagem | TypeScript |
| Banco de dados | SQLite local (`expo-sqlite`) — funciona 100% offline |
| Formulários | `react-hook-form` + `zod` |
| PDF | `expo-print` + `expo-sharing` |
| Navegação | React Navigation (tabs + stack) |

## Rodando o projeto

Pré-requisitos: Node.js 18+, Expo CLI (`npm install -g expo-cli`), e o app **Expo Go**
no celular (ou Xcode/Android Studio para simulador).

```bash
npm install
npx expo start
```

Escaneie o QR code com o Expo Go, ou pressione `a` (Android) / `i` (iOS) no terminal.

Build de produção:

```bash
npx eas build --platform android
npx eas build --platform ios
```

Veja [`SETUP.md`](SETUP.md) para mais detalhes de instalação.

## Autor

Desenvolvido por **Marcela Drumond** — estudante de Análise e Desenvolvimento de
Sistemas, focada em backend e boas práticas de código.

[LinkedIn](https://linkedin.com/in/marcela-p-abreu) · [GitHub](https://github.com/MarcelaDrumond)
