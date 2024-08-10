<script setup lang="ts">
import { useRoute } from '#app';
import { useGoogleAI } from "~/composables/useGoogleAI";

const route = useRoute();
const { generateContent } = useGoogleAI();
const isLoading = ref(true);
const error = ref('');
const courseSections = ref([]);
const refVideo = ref('')

const isValidUrl = (url: string) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

const refreshResources = async (sectionName: string, sectionIndex: number) => {
  try {
    isLoading.value = true;
    error.value = "";

    const refreshResult = await generateContent(
      `Suggest additional resources for the "${sectionName}" section of a course on ${route.params.course}. Provide an array of objects, with each object containing:
      - "type": either "video", "article", "book", or "other"
      - "link": a valid URL to the resource (leave empty if not applicable)
      - "description": a brief description of the resource
      Ensure all links are functional and relevant.`
    );

    console.log('refresh result', refreshResult);

    const cleanedResult = refreshResult.replace(/^```json\n/, '').replace(/\n```$/, '');
    const parsedRefreshResult = JSON.parse(cleanedResult);

    courseSections.value[sectionIndex].resources.push(
      ...parsedRefreshResult.filter(resource => isValidUrl(resource.link) || resource.type === 'other')
    );
  } catch (err) {
    console.error("Error in refresh:", err);
    error.value = err instanceof Error ? err.message : "An unexpected error occurred";
  } finally {
    isLoading.value = false;
  }
};

const onInitialized = async () => {
  error.value = "";

  try {
    const result = await generateContent(
      `Create a course on ${route.params.course}. Provide an array of objects, with each object representing a section. Limit to 8 sections maximum. Each section should have these fields:
      - "name": the title of the section
      - "resources": an array of objects, each containing:
        - "type": either "video", "article", "book", or "other"
        - "link": a valid URL to the resource (leave empty if not applicable)
        - "description": a brief description of the resource
      - "explanation": a comprehensive text explanation of the topic
      Ensure all links are functional and relevant. If no suitable external resources are available, provide a more detailed explanation instead. Return only a plain array.`
    );

    console.log('raw result', result);
    
    const cleanedResult = result.replace(/^```json\n/, '').replace(/\n```$/, '');
    const parsedResult = JSON.parse(cleanedResult);
    
    console.log('parsed result', parsedResult);

    courseSections.value = parsedResult.map(section => ({
      ...section,
      resources: section.resources.filter(resource => isValidUrl(resource.link) || resource.type === 'other')
    }));
  } catch (err) {
    console.error("Error in search:", err);
    error.value =
      err instanceof Error ? err.message : "An unexpected error occurred";
  } finally {
    isLoading.value = false;
  }
};


const refreshVideo = async (videoName: string)=>{
    refVideo.value = await generateContent(
      `Suggest Me a valid working Youtube video link of ${videoName}. Just the link nothing else`
    );
    console.log(refVideo.value)
}
onInitialized();
</script>


<template>
  <div class="course-container">
    <h1>Course: {{ route.params.course }}</h1>
    
    <div v-if="isLoading" class="loader">
        <v-skeleton-loader :elevation="20" type="article"></v-skeleton-loader>
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
            <div v-if="section.resources.length > 0">
              <h3>Additional Resources:</h3>
              <ul>
                <li v-for="(resource, rIndex) in section.resources" :key="rIndex">
                  <strong>{{ resource.type }}:</strong>
                  <template v-if="resource.link">
                    <a :href="resource.link" target="_blank" rel="noopener noreferrer">{{ resource.description }}</a>
                  </template>
                  <template v-else>
                    {{ resource.description }}
                  </template>
                </li>
              </ul>
              <div @click="refreshVideo(section.name)" class="flex">    <span class="bg-color=red">If video is Broken Refresh </span>  <v-btn icon="mdi-refresh" size="small" ></v-btn> </div> 
            </div>
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
