# Traseme Certificados — Guia de Instalação

## Pré-requisitos

- Node.js 18+
- Expo CLI: `npm install -g expo-cli`
- Para iOS: Xcode + simulador ou app Expo Go
- Para Android: Android Studio + emulador ou app Expo Go

## Instalação

```bash
# 1. Instalar dependências
npm install

# 2. Iniciar o servidor de desenvolvimento
npx expo start

# 3. Escanear o QR code com o app Expo Go (iOS/Android)
#    ou pressionar 'a' para Android / 'i' para iOS
```

## Assets pendentes

⚠️ Os arquivos em `assets/` existem mas são todos a mesma imagem placeholder (943×265px)
— nenhum está no tamanho certo ainda. Antes de publicar o app, substitua por:
- `traseme-logo.png` — Logo da Traseme (PNG transparente, mín. 512x512)
- `icon.png` — Ícone do app (1024x1024 PNG)
- `splash.png` — Splash screen (1284x2778 PNG)
- `adaptive-icon.png` — Ícone Android adaptativo (1024x1024 PNG)
- `favicon.png` — Favicon web (64x64 PNG)

Ver `assets/README.md` para detalhes.

## Build para produção

```bash
# Build Android APK/AAB
npx eas build --platform android

# Build iOS IPA
npx eas build --platform ios
```

## Funcionalidades

- **Empresas**: Cadastro de clientes com logo, CNPJ e endereço
- **Funcionários**: Vinculados a cada empresa, com CPF e cargo
- **Cursos**: Com carga horária, validade e conteúdo programático
- **Responsáveis Técnicos**: Com registro DSST/MTE
- **Certificados**: Emissão com preview de 2 páginas, exportação PDF e impressão

## Tecnologias

- React Native + Expo (TypeScript)
- SQLite local (expo-sqlite) — funciona 100% offline
- react-hook-form + zod (validação)
- expo-print + expo-sharing (geração e compartilhamento de PDF)
- React Navigation (tabs + stack)
