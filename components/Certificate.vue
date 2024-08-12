<template>
    <div class="certificate-generator">
      <h2>Generate Your Certificate</h2>
      <div class="input-group">
        <label for="name">Enter your name:</label>
        <input type="text" id="name" v-model="name" placeholder="John Doe">
      </div>
      <button @click="generateCertificate" :disabled="!name">Download Certificate</button>
      
      <div id="certificate-template" ref="certificateTemplate" v-show="false">
        <div class="certificate">
          <h1>Certificate of Completion</h1>
          <p>This is to certify that</p>
          <h2>{{ name }}</h2>
          <p>has successfully completed the course</p>
          <h3>{{ courseName }}</h3>
          <p>on {{ currentDate }}</p>
          <div class="signature">
            
            <p>Course Instructor</p>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, computed } from 'vue';
  import jsPDF from 'jspdf';
  import html2canvas from 'html2canvas';
  import { useRoute } from 'vue-router'

  const name = ref('');
  const courseName = 'Advanced Web Development';
  const certificateTemplate = ref(null);
  const route = useRoute()

  const props = defineProps({
  marks: {
    type: Number,
    required: true,
    default: 2
  },
  module: {
    type: Number,
    required: true,
  },
  course: {
    type: String,
    required: true,
    default: '',
  },
  totalModule: {
    type: Number,
    required: true,
    default: 8,
  }
});
  
  const currentDate = computed(() => {
    const date = new Date();
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  });
  
  const generateCertificate = async () => {
    if (!name.value) return;
  
    const certificateTemplate = `
      <div id="certificate-template" style="width: 800px; height: 600px; padding: 20px; border: 10px solid #ddd; font-family: 'Arial', sans-serif; position: relative; background-color: #f7f7f7;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="font-size: 40px; margin: 0; color: #333;">Certificate of Completion</h1>
          <p style="font-size: 20px; color: #555;">This certifies that</p>
          <h2 style="font-size: 35px; margin: 10px 0; color: #222;">${name.value}</h2>
        </div>
        
        <div style="text-align: center; margin-bottom: 30px;">
          <p style="font-size: 20px; color: #555;">has successfully completed the Course </p>
          <h3 style="font-size: 28px; margin: 10px 0; color: #333;">${props.course} </h3>
          <p style="font-size: 18px; color: #777;">on August 11, 2024</p>
        </div>
        
       
        
        <div style="text-align: center;">
          <p style="font-size: 18px; color: #555;">Score: <strong>${props.marks}%</strong></p>
        </div>

        <div style="text-align: center;">
          <p style="font-size: 18px; color: #555;">Completed Module: <strong>${props.module}/${props.totalModule}</strong></p>
        </div>
  
        <div style="position: absolute; bottom: 20px; right: 20px;">
          <p style="font-size: 16px; color: #999;">Authorized by: <strong>Geminify</strong></p>
        </div>
      </div>
    `;
  
    const element = document.createElement('div');
    element.innerHTML = certificateTemplate;
    document.body.appendChild(element);
  
    const canvas = await html2canvas(element, {
      scale: 2,
      logging: false,
      useCORS: true
    });
  
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });
  
    pdf.addImage(imgData, 'PNG', 10, 10, 277, 190);
    pdf.save(`${name.value}_certificate.pdf`);
  
    document.body.removeChild(element);
  };
  
  </script>
  
  <style scoped>
  .certificate-generator {
    max-width: 600px;
    margin: 0 auto;
    padding: 20px;
    text-align: center;
  }
  
  .input-group {
    margin-bottom: 20px;
  }
  
  label {
    display: block;
    margin-bottom: 5px;
  }
  
  input {
    width: 100%;
    padding: 8px;
    font-size: 16px;
  }
  
  button {
    background-color: #4CAF50;
    color: white;
    padding: 10px 20px;
    font-size: 16px;
    border: none;
    cursor: pointer;
    transition: background-color 0.3s;
  }
  
  button:hover {
    background-color: #45a049;
  }
  
  button:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }
  
  .certificate {
    width: 297mm;
    height: 210mm;
    padding: 15mm;
    background-color: #f9f9f9;
    border: 2mm solid #gold;
    text-align: center;
    font-family: 'Arial', sans-serif;
  }
  
  .certificate h1 {
    font-size: 48px;
    color: #333;
    margin-bottom: 20px;
  }
  
  .certificate h2 {
    font-size: 36px;
    color: #4CAF50;
    margin: 20px 0;
  }
  
  .certificate h3 {
    font-size: 24px;
    color: #666;
    margin: 15px 0;
  }
  
  .certificate p {
    font-size: 18px;
    color: #333;
    margin: 10px 0;
  }
  
  .signature {
    margin-top: 40px;
  }
  
  .signature img {
    max-width: 150px;
    margin-bottom: 10px;
  }
  </style>