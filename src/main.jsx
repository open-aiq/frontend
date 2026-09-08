import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider } from 'next-themes'
import { ClerkProvider } from '@clerk/react'
import { shadcn } from '@clerk/ui/themes'
import './index.css'
import App from './App.jsx'

const clerkKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY
if (!clerkKey) throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY')

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ClerkProvider
      publishableKey={clerkKey}
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      signInFallbackRedirectUrl="/app"
      signUpFallbackRedirectUrl="/app"
      afterSignOutUrl="/"
      appearance={{ theme: shadcn }}
    >
      <BrowserRouter>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <App />
        </ThemeProvider>
      </BrowserRouter>
    </ClerkProvider>
  </StrictMode>,
)
