<template>
    <button @click="markCompleted" class="create-button">
      Mark Completed
    </button>
  
    <v-dialog v-model="dialogOpen" max-width="600">
      <template v-slot:activator="{ props: activatorProps }">
        <button @click="onQuiz" v-bind="activatorProps" class="create-button">
          Take Quiz
        </button>
      </template>
  
      <v-card>
        <v-card-title>Quiz on {{ props.topic }}</v-card-title>
        <v-card-text v-if="isLoading">
          Loading quiz...
        </v-card-text>
        <v-card-text v-else-if="error">
          {{ error }}
        </v-card-text>
        <v-card-text v-else>
          <div v-for="(quiz, index) in quizzes" :key="index" class="mb-4">
            <p class="font-weight-bold">{{ index + 1 }}. {{ quiz.question }}</p>
            <v-radio-group v-model="userAnswers[index]">
              <v-radio
                v-for="(option, optionIndex) in quiz.options"
                :key="optionIndex"
                :label="option"
                :value="optionIndex + 1"
              ></v-radio>
            </v-radio-group>
          </div>
        </v-card-text>
  
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" @click="submitQuiz" :disabled="!quizReady">Submit</v-btn>
          <v-btn text @click="dialogOpen = false">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  
    <v-dialog v-model="resultDialogOpen" max-width="400">
      <v-card>
        <v-card-title>Quiz Results</v-card-title>
        <v-card-text>
          <p>Correct Answers: {{ correctAnswers }}</p>
          <p>Wrong Answers: {{ wrongAnswers }}</p>
          <p>Score: {{ score }}%</p>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" @click="resultDialogOpen = false">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </template>
  
  <script setup lang="ts">
  import { ref, computed } from "vue";
  import { useGoogleAI } from "~/composables/useGoogleAI";
  const config = useRuntimeConfig();
  
  const props = defineProps({
    topic: {
      type: String,
      required: true,
    }
  });
  
  const result = ref('');
  const error = ref('');
  const isLoading = ref(false);
  const dialogOpen = ref(false);
  const resultDialogOpen = ref(false);
  const quizzes = ref([]);
  const userAnswers = ref([]);
  const correctAnswers = ref(0);
  const wrongAnswers = ref(0);
  const score = ref(0);
  
  const { generateContent } = useGoogleAI();
  
  const onQuiz = async () => {
    isLoading.value = true;
    error.value = '';
    userAnswers.value = [];
  
    try {
      const response = await generateContent(
        `Generate a quiz related to the topic: ${props.topic}. Return 3 fields:
        - quizzes: array of objects. Each object has a question field and an options array with 4 options
        - solution: correct answers of the questions. Encrypt this array with ${config.public.encryptKey}`
      );
  
      const parsedResponse = JSON.parse(response.replace(/```json|```/g, '').trim());
      quizzes.value = parsedResponse.quizzes;
      result.value = parsedResponse.solution;
  
      userAnswers.value = new Array(quizzes.value.length).fill(null);
    } catch (err) {
      console.error("Error in search:", err);
      error.value = err instanceof Error ? err.message : "An unexpected error occurred";
    } finally {
      isLoading.value = false;
    }
  };
  
  const quizReady = computed(() => {
    return userAnswers.value.every(answer => answer !== null);
  });
  
  const decryptSolution = (encrypted) => {
    // Implement your decryption logic here
    // For this example, we'll assume the decryption is just removing the prefix
    return encrypted.split(':')[1].split(',').map(Number);
  };
  
  const submitQuiz = () => {
    const decryptedSolution = decryptSolution(result.value);
    correctAnswers.value = 0;
    wrongAnswers.value = 0;
  
    userAnswers.value.forEach((answer, index) => {
      if (answer === decryptedSolution[index]) {
        correctAnswers.value++;
      } else {
        wrongAnswers.value++;
      }
    });
  
    score.value = Math.round((correctAnswers.value / quizzes.value.length) * 100);
    resultDialogOpen.value = true;
  };
  
  const markCompleted = () => {
    console.log(`Marking the topic ${props.topic} as completed.`);
    // You can add additional logic for marking the topic as completed
  };
  </script>
  
  <style scoped>
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