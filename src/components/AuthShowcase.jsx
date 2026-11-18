import AuthIllustration from "./AuthIllustration";

export default function AuthShowcase() {
  return (
    <section className="welcome-visual-panel" aria-labelledby="welcome-showcase-title">
      <div className="welcome-showcase-copy">
        <h2 id="welcome-showcase-title">Your day, in order.</h2>
        <p>Keep your tasks and projects in one place.</p>
      </div>
      <AuthIllustration />
    </section>
  );
}
