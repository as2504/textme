// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
  onSnapshot,
  query,
  orderBy,
} from "https://www.gstatic.com/firebasejs/10.1.0/firebase-firestore.js";

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyDPCMHKcX8A9nDotgftqHMzqRN1W7rvcPA",
  authDomain: "textme-ae3dc.firebaseapp.com",
  projectId: "textme-ae3dc",
  storageBucket: "textme-ae3dc.firebasestorage.app",
  messagingSenderId: "461630294646",
  appId: "1:461630294646:web:d305cdf10e098649fb2d57",
  measurementId: "G-GZ35R77RJP"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// DOM Elements
const noteInput = document.getElementById("noteInput");
const addNoteBtn = document.getElementById("addNoteBtn");
const notesContainer = document.getElementById("notesContainer");

// Add Note Function
addNoteBtn.addEventListener("click", async () => {
  const noteText = noteInput.value.trim();
  if (noteText !== "") {
    try {
      // Add note to Firestore
      await addDoc(collection(db, "notes"), {
        text: noteText,
        timestamp: serverTimestamp(),
      });
      noteInput.value = ""; // Clear input
    } catch (error) {
      console.error("Error adding note: ", error);
    }
  }
});

// Display Notes Function
const displayNotes = (notes) => {
  notesContainer.innerHTML = ""; // Clear existing notes
  notes.forEach((note) => {
    const noteElement = document.createElement("div");
    noteElement.classList.add("note");

    // Add note text
    const noteText = document.createElement("pre");
    noteText.textContent = note.text;
    noteElement.appendChild(noteText);

    // Add copy button
    const copyBtn = document.createElement("button");
    copyBtn.classList.add("copy-btn");
    copyBtn.textContent = "Copy";
    copyBtn.addEventListener("click", () => {
      navigator.clipboard.writeText(note.text).then(() => {
        alert("Note copied to clipboard!");
      });
    });
    noteElement.appendChild(copyBtn);

    notesContainer.appendChild(noteElement);
  });
};

// Real-Time Listener for Notes
const q = query(collection(db, "notes"), orderBy("timestamp", "desc"));
onSnapshot(q, (snapshot) => {
  const notes = [];
  snapshot.forEach((doc) => {
    notes.push({ id: doc.id, ...doc.data() });
  });
  displayNotes(notes);
});