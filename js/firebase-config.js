// Firebase Configuration
// ВАЖНО: Замените эти значения на ваши реальные данные из Firebase Console
// https://console.firebase.google.com/

const firebaseConfig = {
    apiKey: "AIzaSyDMao13nYT7VZ3aLtB4xD9uVerKxYEbxCU",
    authDomain: "jastarapartments-25234.firebaseapp.com",
    projectId: "jastarapartments-25234",
    storageBucket: "jastarapartments-25234.firebasestorage.app",
    messagingSenderId: "1086671506511",
    appId: "1:1086671506511:web:b9c5977d82c772ba5fee3a",
  };

// Инициализация Firebase
firebase.initializeApp(firebaseConfig);

// Инициализация сервисов
const db = firebase.firestore();
const auth = firebase.auth();

// Экспорт для использования в других файлах
window.db = db;
window.auth = auth;


