# Paradize Client - React + TypeScript + Vite

Web client for the Paradize ERP/CRM platform for education organizations.

## Environment Variables

### Required for Production

**`VITE_API_BASE_URL`** - The base URL for the API server
- **Development**: Defaults to `http://localhost:3101` if not set
- **Production**: **MUST be set** to your production API URL (e.g., `https://api.paradize.com`)
- Set this in your deployment platform (Vercel, Netlify, Railway, etc.)

### Example Configuration

Create a `.env.local` file for local development (optional):
```env
VITE_API_BASE_URL=http://localhost:3101
```

For production deployment, set the environment variable in your platform:
- **Vercel**: Settings → Environment Variables
- **Netlify**: Site settings → Environment variables
- **Railway**: Variables tab in your service

## Getting Started

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type aware lint rules:

- Configure the top-level `parserOptions` property like this:

```js
export default tseslint.config({
  languageOptions: {
    // other options...
    parserOptions: {
      project: ['./tsconfig.node.json', './tsconfig.app.json'],
      tsconfigRootDir: import.meta.dirname,
    },
  },
})
```

- Replace `tseslint.configs.recommended` to `tseslint.configs.recommendedTypeChecked` or `tseslint.configs.strictTypeChecked`
- Optionally add `...tseslint.configs.stylisticTypeChecked`
- Install [eslint-plugin-react](https://github.com/jsx-eslint/eslint-plugin-react) and update the config:

```js
// eslint.config.js
import react from 'eslint-plugin-react'

export default tseslint.config({
  // Set the react version
  settings: { react: { version: '18.3' } },
  plugins: {
    // Add the react plugin
    react,
  },
  rules: {
    // other rules...
    // Enable its recommended rules
    ...react.configs.recommended.rules,
    ...react.configs['jsx-runtime'].rules,
  },
})
```
