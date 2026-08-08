# SHA-256 Edu (SDU)

Interactive SHA-256 lab on Next.js: step-by-step padding, message schedule W, compression, and avalanche effect.

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

## Publishing to GitHub

1. Create an **empty** repository on GitHub (no README, no `.gitignore`, to avoid an extra merge commit), e.g. `sha-edu`.
2. From the project root:

```bash
git remote add origin https://github.com/<YOUR_USER>/<REPO_NAME>.git
git push -u origin main
```

If the repo was created with a README, run `git pull origin main --rebase` first, then `git push -u origin main`.

Auth: [HTTPS + Personal Access Token](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens) or [SSH](https://docs.github.com/en/authentication/connecting-to-github-with-ssh).

## Deploy on Vercel

1. Sign in at [vercel.com](https://vercel.com) with GitHub.
2. **Add New… → Project** → **Import** your repository.
3. Framework Preset: **Next.js** (auto-detected), Root Directory: `.`, Build: `next build`, Output: default.
4. **Deploy**. After the build you get a URL like `https://<project>.vercel.app`. test

Environment variables are optional for the base app. Each `git push` to `main` usually triggers a new production deploy (unless disabled in settings).
