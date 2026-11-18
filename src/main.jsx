import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
import { ClerkProvider } from "@clerk/clerk-react";
import { BrowserRouter, useNavigate } from "react-router-dom";
import { MotionConfig } from "motion/react";
import { WORKSPACE_HOME } from "./lib/navigation";

export function AppProviders() {
  const navigate = useNavigate();
  const application = (
    <MotionConfig reducedMotion="user">
      <App />
    </MotionConfig>
  );
  return PUBLISHABLE_KEY ? (
    <ClerkProvider
      publishableKey={PUBLISHABLE_KEY}
      afterSignOutUrl="/sign-in"
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      signInFallbackRedirectUrl={WORKSPACE_HOME}
      signUpFallbackRedirectUrl={WORKSPACE_HOME}
      routerPush={(to) => navigate(to)}
      routerReplace={(to) => navigate(to, { replace: true })}
      appearance={{
        variables: {
          fontFamily: '"Satoshi", sans-serif',
          colorPrimary: "#0d2024",
        },
      }}
    >
      {application}
    </ClerkProvider>
  ) : (
    application
  );
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <AppProviders />
    </BrowserRouter>
  </StrictMode>,
);
