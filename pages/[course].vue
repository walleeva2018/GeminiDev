<script setup lang="ts">
import { useRoute } from '#app';
import { useGoogleAI } from "~/composables/useGoogleAI";

const route= useRoute()
const { generateContent } = useGoogleAI();



</script>

<template>
    Hello {{ route.params.course }}
</template>