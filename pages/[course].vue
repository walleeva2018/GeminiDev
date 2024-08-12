<script setup lang="ts">
import { useRoute } from "#app";
import { useGoogleAI } from "~/composables/useGoogleAI";

const config = useRuntimeConfig();
const route = useRoute();
const { generateContent } = useGoogleAI();
const isLoading = ref(true);
const error = ref("");
const courseSections = ref([]);
const refVideo = ref([]);
const isYoutube = ref(false);
const totalMarks = ref(0);
const totalModule = ref(0);
const isCert = ref(false)

const isValidUrl = (url: string) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

const onInitialized = async () => {
  error.value = "";

  try {
    const result = await generateContent(
      `Create a course on ${route.params.course}. Provide an array of objects, with each object representing a section. Limit to 8 sections maximum. Each section should have these fields:
      - "name": the title of the section
      - "resources": an array of objects, each containing ( at least 1 valid video from youtube or any platform  type and 1 valid article from wikipedia or any platform link type. Make sure they are not broken. They have to exist and if not return empty):
        - "type":  "video" Or "article"
        - "link": a valid live working URL to the resource (leave empty if not found)
        - "description": Name to show what this resource is
      - "explanation": a comprehensive text explanation of the topic
      Ensure all links are functional and relevant. If no suitable external resources are available, provide a more detailed explanation instead. Return only a plain array.`
    );

    console.log("raw result", result);

    const cleanedResult = result
      .replace(/^```json\n/, "")
      .replace(/\n```$/, "");
    const parsedResult = JSON.parse(cleanedResult);

    console.log("parsed result", parsedResult);

    courseSections.value = parsedResult.map((section) => ({
      ...section,
      resources: section.resources.filter(
        (resource) => isValidUrl(resource.link) || resource.type === "other"
      ),
    }));
  } catch (err) {
    console.error("Error in search:", err);
    error.value =
      err instanceof Error ? err.message : "An unexpected error occurred";
  } finally {
    isLoading.value = false;
  }
};

const refreshVideo = async (sectionName: string, sectionIndex: number) => {
  isYoutube.value = true;
  try {
    const { data, error } = await useFetch(
      "https://www.googleapis.com/youtube/v3/search",
      {
        params: {
          part: "snippet",
          q: `${route.params.course}-${sectionName}`,
          type: "video",
          maxResults: 2,
          key: config.public.youtubeApiKey,
        },
      }
    );

    console.log("came here");
    console.log(
      data.value.items[0],
      error.value,
      courseSections.value[sectionIndex]
    );

    refVideo.value = [];
    data.value.items.forEach((item) => {
      refVideo.value.push({
        link: item.id.videoId,
        desc: item.snippet.title,
      });
    });
    courseSections.value[sectionIndex]["refVideos"] = refVideo.value;
    isYoutube.value = false;

    console.log(refVideo.value, courseSections.value);
  } catch (err) {
    console.error("Error fetching YouTube video:", err);
    error.value = "Failed to fetch a new video. Please try again later.";
  }
};
onInitialized();

function handleMarked(index: number) {
  if (courseSections.value[index]["marked"])
    totalModule.value = totalModule.value + 1;
  if (courseSections.value[index]["marked"] === false)
    totalModule.value = totalModule.value - 1;
  courseSections.value[index]["marked"] = courseSections.value[index]["marked"]
    ? !courseSections.value[index]["marked"]
    : true;
}

function handleScore(score: number, index: number) {
  console.log(totalMarks.value, score, totalMarks.value + score);
  totalMarks.value += score.value; // Add the score to the current total
  courseSections.value[index].score = score;
}

function saveCourse() {
  try {
    const courseData = JSON.stringify(courseSections.value);
    localStorage.setItem("savedCourse", courseData);
    console.log("Course successfully saved to local storage!");
    navigateTo("/");
  } catch (err) {
    console.error("Failed to save the course:", err);
  }
}

function generateCertificate() {
  const totalSections = courseSections.value.length;
  const percentage = (totalMarks.value / (totalSections * 100)) * 100;

  console.log(totalMarks.value, totalSections, percentage);

  if (percentage >= 80) {
    // Logic to generate the certificate
    console.log("Certificate generated!");
    isCert.value = true
  } else {
    alert(
      "Your score is less than 80%. You need to score higher to generate a certificate."
    );
  }
}
</script>

<template>
  <div class="course-container">
    <button @click="navigateTo('/')" class="back-button">  <v-icon
          icon="mdi-arrow-left"
          start
        ></v-icon> Back</button>
    <h1>Course: {{ route.params.course }}</h1>
    <button
      @click="generateCertificate"
      class="create-button mb-5"
      :disabled="isLoading"
    >
      Generate Certificate
    </button>
    <button
      @click="saveCourse"
      class="create-button mb-5 ml-5"
      :disabled="isLoading"
    >
      Save Course
    </button>
    <certificate
      v-if="isCert"
      :marks="(totalMarks / courseSections.length) * 100 * 100"
      :module="0"
      :course="route.params.course"
      :total-module="courseSections.length"
    />
    <div v-if="isLoading" class="loader">
      <v-skeleton-loader :elevation="20" type="article"></v-skeleton-loader>
    </div>

    <div v-else-if="error" class="error">
      {{ error }}
    </div>

    <div v-else>
      <div
        v-for="(section, index) in courseSections"
        :key="index"
        class="accordion"
      >
        <details>
          <summary>{{ section.name }}</summary>
          <div class="accordion-content">
            <p>{{ section.explanation }}</p>

            <v-skeleton-loader
              v-if="isYoutube"
              :elevation="10"
              type="article"
              :key="section.name"
            ></v-skeleton-loader>
            <div v-else-if="section.resources.length > 0">
              <h3>Additional Resources:</h3>

              <ul>
                <li>
                  <div
                    v-for="(resource, rIndex) in section.resources"
                    :key="rIndex"
                  >
                    <div v-if="resource.type === 'article'">
                      <strong>{{ resource.type }}:</strong>
                      <template v-if="resource.link">
                        <a
                          :href="resource.link"
                          target="_blank"
                          rel="noopener noreferrer"
                          >{{ resource.description }}</a
                        >
                      </template>
                    </div>
                  </div>
                </li>
                <li v-if="!section.refVideos">
                  <div
                    v-for="(resource, rIndex) in section.resources"
                    :key="rIndex"
                  >
                    <div v-if="resource.type === 'video'">
                      <strong>{{ resource.type }}:</strong>
                      <template v-if="resource.link">
                        <a
                          :href="resource.link"
                          target="_blank"
                          rel="noopener noreferrer"
                          >{{ resource.description }}</a
                        >
                      </template>
                    </div>
                  </div>
                </li>
                <div v-else>
                  <li
                    v-for="(resource, rIndex) in section.refVideos"
                    :key="rIndex"
                  >
                    <div>
                      <strong>Video: </strong>
                      <template v-if="resource.link">
                        <a
                          :href="
                            'https://www.youtube.com/watch?v=' + resource.link
                          "
                          target="_blank"
                          rel="noopener noreferrer"
                          >{{ resource.desc }}</a
                        >
                      </template>
                    </div>
                  </li>
                </div>
              </ul>
              <div
                @click="refreshVideo(section.explanation, index)"
                class="flex mb-8"
              >
                <span class="bg-color=red">If video is Broken Refresh </span>
                <v-btn icon="mdi-refresh" size="small"></v-btn>
              </div>

              <quiz-component
                :topic="section.explanation"
                @marked="handleMarked(index)"
                @score="handleScore($event, index)"
              />
            </div>
          </div>
        </details>
      </div>
    </div>
  </div>
</template>

<style scoped>

.back-button {
  padding: 8px 15px;
  background-color: #007bff;
  color: #fff;
  border: none;
  border-radius: 5px;
  font-size: 16px;
  cursor: pointer;
  margin-bottom: 20px;
  transition: background-color 0.3s ease;
}

.back-button:hover {
  background-color: #0056b3;
}

@media (max-width: 600px) {
  .back-button {
    width: 100%;
    text-align: center;
    padding: 10px;
    font-size: 18px;
  }
}


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
  color: #007bff;
  text-decoration: none;
}

.accordion-content a:hover {
  text-decoration: underline;
}

.create-button {
  padding: 10px 20px;
  background-color: #ffd52d;
  color: #000000;
  border: none;
  border-radius: 25px;
  font-size: 18px;
  cursor: pointer;
  transition: 0.3s;
}

.create-button:hover {
  background-color: #ffea00;
  transform: scale(1.05);
}
</style>
