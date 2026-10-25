This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Prisma with MySQL

Prisma is configured to use MySQL. Copy `.env.example` to `.env` and replace
`USER` and `PASSWORD` with your MySQL credentials. Make sure the database
`trello_clone` exists and the MySQL server is running.

Generate Prisma Client after changing `prisma/schema.prisma`:

```bash
npm run db:generate
```

Create and apply a development migration after adding your Prisma models:

```bash
npm run db:migrate -- --name init
```

Import the shared Prisma Client instance from `@/lib/prisma` in server-side
code. Do not import it into Client Components.

## Google sign-in

Create an OAuth 2.0 Client ID of type **Web application** in Google Cloud
Console. Add the following authorized redirect URI for local development:

```text
http://localhost:3000/api/auth/callback/google
```

For each deployed environment, add
`https://your-domain.example/api/auth/callback/google` as an authorized redirect
URI. Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `.env` or the
deployment's secret environment configuration. The sign-in button remains
available when these variables are absent, but displays a setup message rather
than starting an incomplete OAuth flow.

Google sign-in requires a verified Google email. It reuses the existing local
user with that email, or creates one when no matching account exists. Never
commit OAuth client secrets.

If an existing database was created before Google sign-in support, apply the
pending Prisma migration with `npx prisma migrate deploy` after configuring
`DATABASE_URL`.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
