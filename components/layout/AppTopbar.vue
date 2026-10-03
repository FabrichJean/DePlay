<template>
  <header class="topbar">
    <label class="search">
      <AppIcon name="search" :size="18" />
      <input type="search" placeholder="Search applications, servers, or deployments..." />
      <kbd>⌘ K</kbd>
    </label>

    <div class="topbar-actions">
      <button class="icon-btn notif" type="button" aria-label="Notifications">
        <AppIcon name="bell" :size="18" />
        <span class="notif-dot" />
      </button>
      <button class="icon-btn" type="button" aria-label="Toggle theme">
        <AppIcon name="sun" :size="18" />
      </button>

      <div class="auth">
        <Show when="signed-out">
          <SignInButton mode="modal">
            <button class="btn btn-small" type="button">Sign in</button>
          </SignInButton>
          <SignUpButton mode="modal">
            <button class="btn btn-primary btn-small" type="button">Sign up</button>
          </SignUpButton>
        </Show>
        <Show when="signed-in">
          <UserButton />
        </Show>
      </div>
    </div>
  </header>
</template>

<style scoped>
.topbar {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  height: 74px;
  padding: 0 36px;
  background: rgba(10, 15, 20, 0.85);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--border);
}

.search {
  display: flex;
  align-items: center;
  gap: 12px;
  width: min(560px, 100%);
  height: 42px;
  padding: 0 14px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--card);
  color: var(--muted);
}

.search:focus-within {
  border-color: var(--primary-border);
}

.search input {
  flex: 1;
  min-width: 0;
  background: none;
  border: 0;
  outline: 0;
  color: var(--text);
}

.search input::placeholder {
  color: var(--subtle);
}

kbd {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--muted);
  padding: 2px 6px;
  border: 1px solid var(--border);
  border-radius: 6px;
}

.topbar-actions {
  display: flex;
  gap: 10px;
}

.notif {
  position: relative;
}

.notif-dot {
  position: absolute;
  top: 9px;
  right: 10px;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--primary);
}

.auth {
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-small {
  height: 36px;
  padding: 0 14px;
  font-size: 13px;
}

@media (max-width: 900px) {
  .topbar {
    padding: 0 16px;
  }

  kbd {
    display: none;
  }
}
</style>
