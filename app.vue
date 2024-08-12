<template>
  <v-app>
    <v-app-bar app color="primary" dark>
      <NuxtLink to="/" class="text-decoration-none">
        <div class="d-flex align-center">
          <v-icon large color="amber">mdi-atom</v-icon>
          <span class="geminify-text ml-2">Geminify</span>
        </div>
      </NuxtLink>
      
      <v-spacer></v-spacer>
      
      <v-btn
        href="https://github.com/walleeva2018/GeminiDev"
        target="_blank"
        text
        class="d-none d-sm-flex"
      >
        <v-icon left>mdi-github</v-icon>
        Contribute
      </v-btn>
      <v-btn
        icon
        href="https://github.com/walleeva2018/GeminiDev"
        target="_blank"
        class="d-flex d-sm-none"
      >
        <v-icon>mdi-github</v-icon>
      </v-btn>
    </v-app-bar>

    <v-main>
      <NuxtPage />
    </v-main>
  </v-app>
</template>

<script setup>
// No additional script needed for this component
</script>

<style scoped>
.geminify-text {
  font-family: 'Roboto', sans-serif;
  font-size: 24px;
  font-weight: 700;
  background: linear-gradient(45deg, #FFC107, #FF5722);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.1);
}

.v-application a {
  color: inherit;
  text-decoration: none;
}
</style>