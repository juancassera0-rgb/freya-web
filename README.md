# Freya Web

Recreación moderna del sitio de **Freya** (desarrolladora inmobiliaria), basada en la auditoría de `estudiofreya.com`.

## Qué incluye

- Homepage con hero, desarrollos activos, diferenciales, cifras estáticas, finalizados, caminos vivir/invertir, FAQ y contacto
- Hub `/desarrollos` + fichas individuales
- `/nosotros`, `/como-trabajamos`, `/faq`, `/contacto` (funcional)
- WhatsApp flotante + formulario que abre WhatsApp con el mensaje armado
- Diseño arquitectónico sobrio (Cormorant + Outfit), mobile-first
- Sin placeholders Lorem / emails falsos visibles como “reales” (datos de demo claramente marcados)

## Arranque

```bash
npm install
npm run dev
```

Abrí [http://localhost:3000](http://localhost:3000).

## Configurar contacto real

Editá `src/data/site.ts` (`email`, `phoneDisplay`, `phoneTel`, `whatsapp`, `address`).

## Stack

Next.js 16 (App Router) · TypeScript · CSS Modules
