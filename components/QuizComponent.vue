<template>
  <button
    @click="markCompleted"
    :class="['create-button', marked || parentMarked ? 'marked' : 'unmarked']"
    class="mr-5"
  >
    {{ marked || parentMarked ? 'Mark Incomplete' : 'Mark Completed' }}
  </button>

  <v-dialog v-model="dialogOpen" max-width="600" persistent>
    <template v-slot:activator="{ props: activatorProps }">
      <button 
      v-if="score === -1 && !parentScore" 
      @click="onQuiz" 
      v-bind="activatorProps" 
      class="create-button unmarked"
    >
      Take Quiz
    </button>
    <span v-else class="text-lg font-semibold text-green-500 bg-green-100 px-4 py-2 rounded-lg">
      Score: {{ score===-1 ? parentScore : score }}%
    </span>
    </template>

    <v-card>
      <v-card-title>Quiz on {{ props.topic }}</v-card-title>
      <v-card-text v-if="isLoading">
      
        <v-skeleton-loader

              :elevation="8"
              type="article"
            ></v-skeleton-loader>
      </v-card-text>
      <v-card-text v-else-if="error">{{ error }}</v-card-text>
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
        
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-dialog v-model="resultDialogOpen" max-width="400" persistent>
  <v-card>
    <v-card-title>Quiz Results</v-card-title>
    <v-card-text>
      <p>Correct Answers: {{ correctAnswers }}</p>
      <p>Wrong Answers: {{ wrongAnswers }}</p>
      <p>Score: {{ score }}%</p>
      <v-divider class="my-3"></v-divider>
      <p style="color: #f44336; font-size: 14px;">
        ⚠️ Note: These results are AI-judged and may not always be 100% accurate.
      </p>
    </v-card-text>
    <v-card-actions>
      <v-spacer></v-spacer>
      <v-btn color="primary" @click="handleClose">Close</v-btn>
    </v-card-actions>
  </v-card>
</v-dialog>

</template>

<script setup lang="ts">
import { ref, computed, defineEmits } from "vue";
import { useGoogleAI } from "~/composables/useGoogleAI";
const config = useRuntimeConfig();

const props = defineProps({
  topic: {
    type: String,
    required: true,
  },
  parentScore: {
    type: Number,
    required: false,
  },
  parentMarked: {
    type: Boolean,
    required: false
  }
});

const emit = defineEmits(['marked' , 'score']);

const result = ref('');
const error = ref('');
const isLoading = ref(false);
const dialogOpen = ref(false);
const resultDialogOpen = ref(false);
const quizzes = ref([]);
const userAnswers = ref([]);
const correctAnswers = ref(0);
const wrongAnswers = ref(0);
const marked = ref(false);
const score = ref(-1);

const { generateContent } = useGoogleAI();

const onQuiz = async () => {
  isLoading.value = true;
  error.value = '';
  userAnswers.value = [];

  try {
    const response = await generateContent(
      `Generate a quiz with exact 5 questions related to the topic: ${props.topic}. Return 3 fields:
      - quizzes: array of objects. Each object has a question field and an options array with 4 options
      - solution: correct answers of the questions in a array in correct order only the index(0-indexing)`
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



const submitQuiz = () => {

  correctAnswers.value = 0;
  wrongAnswers.value = 0;

  console.log(userAnswers, result.value)
  userAnswers.value.forEach((answer, index) => {
    if (answer === result.value[index]) {
      correctAnswers.value++;
    } else {
      wrongAnswers.value++;
    }
  });

  score.value = Math.round((correctAnswers.value / quizzes.value.length) * 100);
  resultDialogOpen.value = true;
};

const markCompleted = () => {
  marked.value = !marked.value;
  emit('marked', marked.value);
};

function handleClose() {
  resultDialogOpen.value = false
  dialogOpen.value = false
  emit('score', score)
  emit('marked', true);
  marked.value= true
}

</script>

<style scoped>
.create-button {
  padding: 10px 20px;
  color: #000000;
  border: none;
  border-radius: 25px;
  font-size: 18px;
  cursor: pointer;
  transition: 0.3s;
}

.create-button.unmarked {
  background-color: #ffd52d;
}

.create-button.marked {
  background-color: #4caf50; /* Green color when marked */
}

.create-button:hover {
  transform: scale(1.05);
}
</style>
