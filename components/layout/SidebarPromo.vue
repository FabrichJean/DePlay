<template>
  <div class="promo">
    <!-- Fusée en décor de fond : atténuée, sans interaction -->
    <RocketIllustration class="promo-bg" />
    <p class="promo-title">Small steps<br />build big things.</p>
    <p class="promo-text">Every deployment<br />is a step closer to your goals.</p>
  </div>
</template>

<style scoped>
.promo {
  position: relative;
  overflow: hidden;
  margin: auto 0 16px;
  padding: 20px;
  border-radius: var(--radius-lg);
  border: 1px solid var(--border);
  background: linear-gradient(180deg, rgba(59, 130, 246, 0.06), transparent 70%), var(--card);
}

.promo-bg {
  position: absolute;
  left: 62%;
  bottom: -26px;
  transform: translateX(-50%);
}

.promo-title {
  font-size: 16px;
  font-weight: 600;
  line-height: 1.35;
  margin-bottom: 14px;
}

.promo-text {
  font-size: 12px;
  color: var(--muted);
  line-height: 1.5;
}
</style>
