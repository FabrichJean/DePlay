<template>
  <div class="landing">
    <header class="landing-head">
      <div class="brand">
        <span class="brand-logo" aria-hidden="true">
          <svg width="26" height="26" viewBox="12 26 103 108" fill="none"><defs><linearGradient id="dpl-hero" x1="20" y1="20" x2="115" y2="135" gradientUnits="userSpaceOnUse"><stop stop-color="#3B82F6"/><stop offset="1" stop-color="#06B6D4"/></linearGradient></defs><path d="M28 35C24.7 33.1 20.5 35.5 20.5 39.3V61.1C20.5 63.5 21.8 65.7 23.9 66.9L67.4 92.1C70.7 94 74.8 91.6 74.8 87.8V66C74.8 63.6 73.6 61.4 71.5 60.2L28 35Z" fill="url(#dpl-hero)"/><path d="M28 125C24.7 126.9 20.5 124.5 20.5 120.7V98.9C20.5 96.5 21.8 94.3 23.9 93.1L67.4 67.9C70.7 66 74.8 68.4 74.8 72.2V94C74.8 96.4 73.6 98.6 71.5 99.8L28 125Z" fill="url(#dpl-hero)" opacity="0.92"/><path d="M67.4 92.1L103.2 71.4C106.5 69.5 106.5 64.7 103.2 62.8L67.4 42.1C64.1 40.2 60 42.6 60 46.4V87.8C60 91.6 64.1 94 67.4 92.1Z" fill="url(#dpl-hero)"/></svg>
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
