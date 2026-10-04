<template>
  <!-- Illustration décorative : image statique servie depuis public/ -->
  <img
    src="/images/rocket.png"
    alt=""
    aria-hidden="true"
    width="453"
    height="480"
    loading="lazy"
    decoding="async"
    class="rocket-img"
  />
</template>

<style scoped>
.rocket-img {
  /* Pas de largeur ici : le parent décide de la taille (sinon il ne peut plus la réduire) */
  display: block;
  max-width: 100%;
  height: auto;
}
</style>
