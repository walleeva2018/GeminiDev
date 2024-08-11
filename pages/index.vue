<script setup lang="ts">
import { ref } from "vue";
import { useGoogleAI } from "~/composables/useGoogleAI";

interface CourseItem {
  title: string;
  value: number;
}

const searchQuery = ref("");
const result = ref("");
const isLoading = ref(false);
const error = ref("");

const items = ref<CourseItem[]>([]); // Explicitly type items as CourseItem[]

const { generateContent } = useGoogleAI();

const onSearch = async () => {
  if (searchQuery.value.trim() === "") return;

  isLoading.value = true;
  error.value = "";

  try {
    result.value = await generateContent(
      `Suggest Some Course based on ${searchQuery.value}. Only return a array of suggested course title nothing else []. Do not add extra quote or anything is resp`
    );

    // Parse the result and update items
    try {
      const parsedResult = JSON.parse(result.value);
      if (Array.isArray(parsedResult)) {
        items.value = parsedResult.map((title, index) => ({
          title,
          value: index + 1,
        }));
      } else {
        throw new Error("Try again with meaningful keyword");
      }
    } catch (parseError) {
      console.error("Error parsing result:", parseError);
      error.value = "Failed to parse the generated courses";
    }
  } catch (err) {
    console.error("Error in search:", err);
    error.value =
      err instanceof Error ? err.message : "An unexpected error occurred";
  } finally {
    isLoading.value = false;
  }
};
function listClicked(name: string) {
  navigateTo(`/${name}`)
}

function savedCourse(){
  navigateTo('/myCourse')
}
</script>
<template>
  <div class="container">
    <div class="content-wrapper">
      <h1 class="heading">Type what you want to learn?</h1>
      <div class="search-box">
        <input
          type="text"
          class="search-input"
          placeholder="Search..."
          v-model="searchQuery"
        />
        <i class="fas fa-search search-icon"></i>
      </div>
      <div class="flex space-between">
      <button @click="onSearch" class="create-button" :disabled="isLoading">
        {{ isLoading ? "Creating..." : "Create Course" }}
      </button>

      <button @click="savedCourse" class="create-button ml-5" :disabled="isLoading">
              My Course
      </button>
    </div>

      <div v-if="isLoading" class="mt-10">
        <v-skeleton-loader :elevation="13" type="article"></v-skeleton-loader>
      </div>
      <div v-else-if="error" class="error">{{ error }}</div>
      <div v-else-if="items.length > 0" class="result">
        <h2>Suggested Courses:</h2>
        <v-card class="mx-auto" max-width="800">
          <v-list>
            <v-list-item
              v-for="(item, index) in items"
              :key="index"
              @click="listClicked(item.title)"
            >
              <v-list-item-title>{{ item.title }}</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-card>
      </div>
    </div>
  </div>
</template>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 40px 20px; /* Increased padding top and bottom */
}

/* Add this new class */
.content-wrapper {
  flex-grow: 1;
  width: 100%;
  max-width: 800px; /* Adjust as needed */
  display: flex;
  flex-direction: column;
  align-items: center;
}

.heading {
  color: #ffd52d;
  font-size: 2.5rem;
  margin-bottom: 2rem;
  text-align: center;
}

.search-box {
  position: relative;
  margin-bottom: 2rem;
}

.search-input {
  padding: 10px 45px 10px 15px;
  width: 300px;
  height: 50px;
  background: none;
  border: 4px solid #ffd52d;
  border-radius: 50px;
  box-sizing: border-box;
  font-size: 18px;
  color: #ffd52d;
  outline: none;
  transition: 0.5s;
}

.search-input:focus {
  width: 350px;
  background: #19161c;
}

.search-icon {
  position: absolute;
  top: 50%;
  right: 15px;
  transform: translateY(-50%);
  font-size: 20px;
  color: #ffd52d;
  pointer-events: none;
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
.loading,
.error,
.result {
  margin-top: 2rem;
  text-align: center;
  color: #ffd52d;
}

.error {
  color: #ff4040;
}

.result {
  max-width: 600px;
  word-wrap: break-word;
}

.result h2 {
  color: #ffd52d;
  margin-bottom: 1rem;
}

.result p {
  color: #ffffff;
  line-height: 1.6;
}
</style>
