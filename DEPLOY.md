# Guia de Deploy - Zapia AI na Vercel

Este documento serve como um guia definitivo para colocar o Zapia AI em produção. 

## 1. Pré-Requisitos

Antes de iniciar, certifique-se de ter contas ativas e configuradas nos seguintes serviços:

*   **Vercel:** (Hospedagem Frontend/Backend)
*   **Neon / Supabase:** (Banco de Dados Postgres)
*   **Clerk:** (Autenticação)
*   **OpenAI:** (API Key)
*   **Stripe:** (Pagamentos)
*   **Inngest:** (Filas/Eventos)
*   **Meta For Developers:** (WhatsApp Cloud API)

## 2. Configuração de Variáveis de Ambiente

No painel da Vercel (Settings > Environment Variables), adicione todas as chaves listadas em `env.example`. 

⚠️ **Atenção:**
*   `DATABASE_URL`: Use a string de conexão "Transaction Pooler" (porta 6543) se usar Neon/Supabase em Serverless.
*   `NEXT_PUBLIC_APP_URL`: Defina como `https://seu-projeto.vercel.app`.

## 3. Deploy na Vercel

1.  Dê push do código para o GitHub/GitLab.
2.  Importe o projeto na Vercel.
3.  O framework "Next.js" será detectado automaticamente.
4.  Substitua o comando de Build se necessário, mas o padrão `next build` é suficiente.
5.  Clique em **Deploy**.

## 4. Migração do Banco de Dados

Após o deploy ter sucesso (ou durante a build), precisamos criar as tabelas no banco de produção.

**Opção A: Via Script Local (Recomendado)**
Se você tem o `DATABASE_URL` de produção no seu `.env` local:
```bash
npm run db:migrate:prod
```

**Opção B: Via Drizzle Studio**
```bash
npm run db:studio
```

## 5. Configuração de Webhooks

Para que o sistema reaja a eventos externos, configure as URLs de Webhook nos provedores:

*   **Clerk:**
    *   Endpoint: `https://seu-dominio.vercel.app/api/webhooks/clerk`
    *   Eventos: `organization.created`, `organizationMembership.created`, `user.created`.
*   **Stripe:**
    *   Endpoint: `https://seu-dominio.vercel.app/api/webhooks/stripe`
    *   Eventos: `checkout.session.completed`, `invoice.payment_succeeded`.
*   **WhatsApp (Meta):**
    *   Endpoint: `https://seu-dominio.vercel.app/api/webhooks/whatsapp`
    *   Verify Token: O mesmo definido em `WHATSAPP_VERIFY_TOKEN`.
    *   Campos: `messages`.

## 6. Sincronização Inngest

1.  Acesse o Dashboard do Inngest (inngest.com).
2.  Conecte sua conta Vercel.
3.  O Inngest detectará automaticamente suas funções em `/api/inngest`.
4.  Se necessário, faça um "Sync" manual no dashboard.

---

**Parabéns!** Seu SaaS de IA está em produção. 🚀
