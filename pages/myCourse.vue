<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useGoogleAI } from "~/composables/useGoogleAI";
import QuizComponent from "~/components/QuizComponent.vue"; // Adjust the import path as needed
import certificate from "~/components/Certificate.vue";

const config = useRuntimeConfig();
const courseSections = ref([]);
const courseName = ref("");
const totalMarks = ref(0);
const error = ref("");
const { generateContent } = useGoogleAI();
const isLoading = ref(false);
const isYoutube = ref(false);
const refVideo = ref([]);
const totalModule = ref(0);
const isCert = ref(false)

onMounted(() => {
  loadSavedCourse();
});

function loadSavedCourse() {
  try {
    const savedCourseData = localStorage.getItem("savedCourse");
    if (savedCourseData) {
      courseSections.value = JSON.parse(savedCourseData);
      calculateTotalMarks();
      courseSections.value.forEach((item) => {
        if (item?.marked) {
          totalModule.value = totalModule.value + 1;
        }
      });
      courseName.value = getCourseNameFromSections();
    } else {
      error.value = "No saved course found.";
    }
  } catch (err) {
    console.error("Failed to load the course:", err);
    error.value = "Failed to load the saved course. Please try again.";
  }
}

function calculateTotalMarks() {
  totalMarks.value = courseSections.value.reduce((total, section) => {
    return total + (section.score || 0);
  }, 0);
}

function getCourseNameFromSections() {
  if (courseSections.value.length > 0) {
    const firstSection = courseSections.value[0];
    return firstSection.name.split("-")[0].trim() || "Saved Course";
  }
  return "Saved Course";
}

function generateCertificate() {
  const totalSections = courseSections.value.length;
  const percentage = (totalMarks.value / (totalSections * 100)) * 100;

  if (percentage >= 80) {
    console.log("Certificate generated!");
    isCert.value = true
    // Implement certificate generation logic here
  } else {
    alert(
      "Your score is less than 80%. You need to score higher to generate a certificate."
    );
  }
}

function deleteSavedCourse() {
  if (confirm("Are you sure you want to delete this saved course?")) {
    localStorage.removeItem("savedCourse");
    courseSections.value = [];
    totalMarks.value = 0;
    error.value = "Course deleted. You can now start a new course.";
  }
}

function saveCourse() {
  try {
    const courseData = JSON.stringify(courseSections.value);
    localStorage.setItem("savedCourse", courseData);
    console.log("Course successfully saved to local storage!");
  } catch (err) {
    console.error("Failed to save the course:", err);
  }
}

function handleMarked(index: number) {
  totalModule.value = 0;
  courseSections.value[index].marked = !courseSections.value[index].marked;
  courseSections.value.forEach((item) => {
    if (item?.marked) {
      totalModule.value = totalModule.value + 1;
    }
  });
  saveCourse();
}

function handleScore(score: number, index: number) {
  totalMarks.value += score.value;
  courseSections.value[index].score = score;
  saveCourse();
}

const refreshVideo = async (sectionName: string, sectionIndex: number) => {
  isYoutube.value = true;
  try {
    const { data, error } = await useFetch(
      "https://www.googleapis.com/youtube/v3/search",
      {
        params: {
          part: "snippet",
          q: `${courseName.value}-${sectionName}`,
          type: "video",
          maxResults: 2,
          key: config.public.youtubeApiKey,
        },
      }
    );

    if (error.value) {
      throw new Error(error.value.message);
    }

    refVideo.value = [];
    data.value.items.forEach((item) => {
      refVideo.value.push({
        link: item.id.videoId,
        desc: item.snippet.title,
      });
    });
    courseSections.value[sectionIndex].refVideos = refVideo.value;
    saveCourse();
  } catch (err) {
    console.error("Error fetching YouTube video:", err);
    error.value = "Failed to fetch a new video. Please try again later.";
  } finally {
    isYoutube.value = false;
  }
};
</script>

<template>
  <div class="course-container">
    <h1>{{ courseName }}</h1>

    <div v-if="error" class="error">
      {{ error }}
    </div>

    <div v-else>
      <div class="button-container">
        <button @click="generateCertificate" class="action-button">
          Generate Certificate
        </button>
        <button @click="deleteSavedCourse" class="action-button delete-button">
          Delete Saved Course
        </button>
      </div>
      <certificate
        v-if="isCert"
        :marks="(totalMarks / (courseSections.length * 100)) * 100"
        :module="totalModule"
        :course="courseName"
        :total-module="courseSections.length"
      />
      <div
        v-for="(section, index) in courseSections"
        :key="index"
        class="accordion"
      >
        <details>
          <summary>
            {{ section.name }}
            <span
              :class="['mark-indicator', { marked: section.marked }]"
              @click.stop="handleMarked(index)"
            >
              {{ section.marked ? "★" : "☆" }}
            </span>
          </summary>
          <div class="accordion-content">
            <p>{{ section.explanation }}</p>

            <div v-if="section.resources && section.resources.length > 0">
              <h3>Additional Resources:</h3>
              <ul>
                <li
                  v-for="(resource, rIndex) in section.resources"
                  :key="rIndex"
                >
                  <strong>{{ resource.type }}:</strong>
                  <a
                    v-if="resource.link"
                    :href="resource.link"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {{ resource.description }}
                  </a>
                  <span v-else>{{ resource.description }}</span>
                </li>
              </ul>
            </div>

            <div v-if="section.refVideos && section.refVideos.length > 0">
              <h3>Referenced Videos:</h3>
              <ul>
                <li v-for="(video, vIndex) in section.refVideos" :key="vIndex">
                  <a
                    :href="'https://www.youtube.com/watch?v=' + video.link"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {{ video.desc }}
                  </a>
                </li>
              </ul>
            </div>

            <div @click="refreshVideo(section.name, index)" class="flex mb-8">
              <span>If video is Broken Refresh </span>
              <v-btn icon="mdi-refresh" size="small"></v-btn>
            </div>

            <v-skeleton-loader
              v-if="isYoutube"
              :elevation="10"
              type="article"
              :key="section.name"
            ></v-skeleton-loader>

            <quiz-component
              :topic="section.explanation"
              :parentScore="section.score"
              :parentMarked="section.marked"
              @marked="handleMarked(index)"
              @score="handleScore($event, index)"
            />
          </div>
        </details>
      </div>

      <div class="total-score">
        <h2>
          Total Score: {{ totalMarks }} / {{ courseSections.length * 100 }}
        </h2>
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

.error {
  color: red;
  text-align: center;
  font-size: 1.2em;
  margin: 30px 0;
}

.button-container {
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
}

.action-button {
  padding: 10px 20px;
  background-color: #ffd52d;
  color: #000000;
  border: none;
  border-radius: 25px;
  font-size: 18px;
  cursor: pointer;
  transition: 0.3s;
  margin: 0 10px;
}

.action-button:hover {
  background-color: #ffea00;
  transform: scale(1.05);
}

.delete-button {
  background-color: #ff4d4d;
  color: white;
}

.delete-button:hover {
  background-color: #ff3333;
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
  display: flex;
  justify-content: space-between;
  align-items: center;
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

.total-score {
  text-align: center;
  margin-top: 30px;
  font-size: 1.2em;
  font-weight: bold;
}

.mark-indicator {
  cursor: pointer;
  font-size: 1.2em;
  color: #ffd700;
}

.mark-indicator.marked {
  color: #ffa500;
}

.flex {
  display: flex;
  align-items: center;
}

.mb-8 {
  margin-bottom: 8px;
}
</style>
