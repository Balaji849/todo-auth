import PropTypes from "prop-types";
import { useEffect } from "react";
import { SignIn, SignUp } from "@clerk/clerk-react";
import { Link, useLocation } from "react-router-dom";
import { Check, RefreshCw } from "lucide-react";
import AuthShowcase from "./AuthShowcase";
import { signInDestination } from "../lib/navigation";
import "./WelcomeScreen.css";

const appearance = {
  layout: {
    socialButtonsPlacement: "bottom",
    socialButtonsVariant: "iconButton",
  },
  variables: {
    fontFamily: '"Satoshi", sans-serif',
    fontSize: "14px",
    colorPrimary: "#0d2024",
    colorText: "#101a1c",
    colorTextSecondary: "#627580",
    colorBackground: "#ffffff",
    colorInputBackground: "#ffffff",
    colorInputText: "#101a1c",
    borderRadius: "12px",
  },
  elements: {
    rootBox: "welcome-clerk-root",
    cardBox: "welcome-clerk-card-box",
    card: "welcome-clerk-card",
    formFieldInput: "welcome-clerk-input",
    formButtonPrimary: "welcome-clerk-primary",
    socialButtonsIconButton: "welcome-clerk-social",
    footerActionLink: "welcome-clerk-link",
  },
};

export default function WelcomeScreen({
  mode = "sign-in",
  configured = true,
  loading = false,
  loadFailed = false,
  destination: requestedDestination,
}) {
  const location = useLocation();
  const registration = mode === "sign-up";
  const initialStep = /^\/(sign-in|sign-up)\/?$/.test(location.pathname);
  const destination =
    requestedDestination || signInDestination(location.search);
  const returnQuery = `?returnTo=${encodeURIComponent(destination)}`;

  useEffect(() => {
    document.title = `${registration ? "Create your account" : "Welcome back"} · Tasky`;
  }, [registration]);

  return (
    <main className="welcome-shell">
      <section
        className={`welcome-form-panel ${initialStep ? "auth-initial-step" : ""}`}
        aria-labelledby="welcome-title"
      >
        <nav className="welcome-navigation" aria-label="Welcome navigation">
          <Link
            className="welcome-brand"
            to={`/sign-in${returnQuery}`}
            aria-label="Tasky welcome screen"
          >
            <span className="welcome-brand-icon" aria-hidden="true">
              <Check size={19} strokeWidth={3} />
            </span>
            tasky<span className="welcome-brand-dot">.</span>
          </Link>
        </nav>
        <div className="welcome-form-content">
          <header className="welcome-heading">
            <h1 id="welcome-title">
              {registration ? "Create your account." : "Welcome back."}
            </h1>
            <p>
              {registration
                ? "Get started with your Tasky workspace."
                : "Sign in to your Tasky workspace."}
            </p>
          </header>
          {!configured || loadFailed ? (
            <div className="auth-unavailable" role="alert">
              <h2>Sign-in is currently unavailable</h2>
              <p>
                {!configured
                  ? "This workspace’s sign-in service needs to be configured by its owner. Please contact your workspace administrator."
                  : "We couldn’t connect to the sign-in service. Check your connection and try again."}
              </p>
              <button
                className="button primary"
                onClick={() => window.location.reload()}
              >
                <RefreshCw size={15} />
                Try again
              </button>
            </div>
          ) : loading ? (
            <div
              className="auth-skeleton"
              role="status"
              aria-label="Loading sign-in"
            >
              <div />
              <div />
              <div />
              <span>Preparing your sign-in...</span>
            </div>
          ) : (
            <div className="welcome-auth-widget">
              {registration ? (
                <SignUp
                  routing="path"
                  path="/sign-up"
                  signInUrl={`/sign-in${returnQuery}`}
                  forceRedirectUrl={destination}
                  appearance={appearance}
                />
              ) : (
                <SignIn
                  routing="path"
                  path="/sign-in"
                  signUpUrl={`/sign-up${returnQuery}`}
                  forceRedirectUrl={destination}
                  signUpForceRedirectUrl={destination}
                  appearance={appearance}
                />
              )}
            </div>
          )}
        </div>
      </section>
      <AuthShowcase />
    </main>
  );
}

WelcomeScreen.propTypes = {
  mode: PropTypes.oneOf(["sign-in", "sign-up"]),
  configured: PropTypes.bool,
  loading: PropTypes.bool,
  loadFailed: PropTypes.bool,
  destination: PropTypes.string,
};
