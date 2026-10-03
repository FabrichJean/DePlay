<template>
  <div class="landing">
    <header class="landing-head">
      <div class="brand">
        <span class="brand-logo" aria-hidden="true">
          <svg viewBox="0 0 32 32" width="26" height="26">
            <path d="M16 4 28 26H4Z" fill="var(--primary)" />
            <path d="M16 14 22 26H10Z" fill="#0b1e3f" />
          </svg>
        </span>
        <span class="brand-name">Deplay</span>
      </div>

      <div class="auth">
        <SignInButton mode="modal">
          <button class="btn btn-small" type="button">Sign in</button>
        </SignInButton>
      </div>
    </header>

    <main class="hero">
      <RocketIllustration class="hero-rocket" />

      <h1 class="hero-title">Ship your ideas, <span class="accent">live in minutes.</span></h1>

      <p class="hero-text">
        Deplay builds, tests and deploys your applications, then keeps an eye on them once they are live.
      </p>

      <div class="hero-actions">
        <SignUpButton mode="modal">
          <button class="btn btn-primary btn-large" type="button">Get started</button>
        </SignUpButton>
        <SignInButton mode="modal">
          <button class="btn btn-large" type="button">Sign in</button>
        </SignInButton>
      </div>
    </main>
  </div>
</template>

<style scoped>
.landing {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  padding: 0 32px;
}

.landing-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 74px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 700;
}

.brand-logo {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: var(--primary-soft);
}

.btn-small {
  height: 36px;
  padding: 0 14px;
  font-size: 13px;
}

.hero {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 40px 0 80px;
}

.hero-rocket {
  width: 200px;
  margin-bottom: 28px;
}

.hero-title {
  max-width: 720px;
  font-size: clamp(34px, 5vw, 56px);
  font-weight: 700;
  letter-spacing: -0.03em;
  line-height: 1.1;
}

.accent {
  color: var(--primary);
}

.hero-text {
  max-width: 560px;
  margin-top: 20px;
  font-size: 17px;
  color: var(--muted);
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 12px;
  margin-top: 36px;
}

.btn-large {
  height: 48px;
  padding: 0 24px;
  font-size: 15px;
}

@media (max-width: 560px) {
  .landing {
    padding: 0 16px;
  }

  .hero-rocket {
    width: 150px;
  }
}
</style>
