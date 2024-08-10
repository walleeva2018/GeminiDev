<script setup lang="ts">
import { useRoute } from '#app';
import { useGoogleAI } from "~/composables/useGoogleAI";

const route = useRoute();
const { generateContent } = useGoogleAI();
const isLoading = ref(true);
const error = ref('');
const courseSections = ref([]);

const onInitialized = async () => {
  error.value = "";

  try {
    const result = await generateContent(
  `Create a course on ${route.params.course}. Provide an array of objects, with each object representing a section. Limit to 8 sections maximum. Each section should have three fields: "name" (the title of the section), "video" (a valid  relavent resource link if available relevant to the topic), and "explanation" (a brief, clear text explanation of the topic). Ensure the YouTube links are functional and the explanations are concise. Return only a plain array.`
);

    console.log('raw result', result);
    
    // Remove ```json from the start and ``` from the end
    const cleanedResult = result.replace(/^```json\n/, '').replace(/\n```$/, '');
    
    // Parse the JSON string into an object
    const parsedResult = JSON.parse(cleanedResult);
    
    console.log('parsed result', parsedResult);
    courseSections.value = parsedResult;
  } catch (err) {
    console.error("Error in search:", err);
    error.value =
      err instanceof Error ? err.message : "An unexpected error occurred";
  } finally {
    isLoading.value = false;
  }
};

onInitialized();
</script>

<template>
  <div class="course-container">
    <h1>Course: {{ route.params.course }}</h1>
    
    <div v-if="isLoading" class="loader">
      Loading...
    </div>
    
    <div v-else-if="error" class="error">
      {{ error }}
    </div>
    
    <div v-else>
      <div v-for="(section, index) in courseSections" :key="index" class="accordion">
        <details>
          <summary>{{ section.name }}</summary>
          <div class="accordion-content">
            <p>{{ section.explanation }}</p>
            <p>Related video: <a :href="section.video" target="_blank" rel="noopener noreferrer">Watch on YouTube</a></p>
          </div>
        </details>
      </div>
    </div>
  </div>
</template>

<style scoped>
.course-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  font-family: Arial, sans-serif;
}

h1 {
  text-align: center;
  color: #333;
  margin-bottom: 30px;
}

.loader {
  text-align: center;
  font-size: 1.5em;
  color: #333;
  margin: 30px 0;
}

.error {
  color: red;
  text-align: center;
  font-size: 1.2em;
  margin: 30px 0;
}

.accordion {
  border: 1px solid #ddd;
  border-radius: 5px;
  overflow: hidden;
  margin-bottom: 15px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.accordion summary {
  padding: 15px;
  cursor: pointer;
  background-color: #f7f7f7;
  font-weight: bold;
  font-size: 1.1em;
  border-bottom: 1px solid #ddd;
  transition: background-color 0.3s ease;
}

.accordion summary:hover {
  background-color: #e2e2e2;
}

.accordion summary::marker {
  font-size: 1.5em;
}

.accordion-content {
  padding: 15px;
  background-color: #fafafa;
}

.accordion-content p {
  margin: 10px 0;
  line-height: 1.6;
}

.accordion-content a {
  color: #007BFF;
  text-decoration: none;
}

.accordion-content a:hover {
  text-decoration: underline;
}
</style>
