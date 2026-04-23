# SHA-256 Edu (SDU)

Интерактивная лаборатория SHA-256 на Next.js: пошаговый разбор padding, расписания W, сжатия и эффекта лавины.

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

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Публикация в GitHub

1. Создайте **пустой** репозиторий на GitHub (без README, без `.gitignore`, чтобы не было лишнего merge-коммита), например `sha-edu`.
2. В корне проекта:

```bash
git remote add origin https://github.com/<ВАШ_НИК>/<ИМЯ_РЕПО>.git
git push -u origin main
```

Если репозиторий уже создан с README — сначала `git pull origin main --rebase`, затем `git push -u origin main`.

Авторизация: [HTTPS + Personal Access Token](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens) или [SSH](https://docs.github.com/en/authentication/connecting-to-github-with-ssh).

## Деплой на Vercel

1. Войдите на [vercel.com](https://vercel.com) через GitHub.
2. **Add New… → Project** → **Import** ваш репозиторий.
3. Framework Preset: **Next.js** (определится сам), Root Directory: `.`, Build: `next build`, Output: по умолчанию.
4. **Deploy**. После сборки получите URL вида `https://<проект>.vercel.app`.

Переменные окружения для этого проекта не обязательны. Каждый `git push` в `main` обычно даёт новый production deploy (если не отключили в настройках).
