import { initializeApp } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
  onSnapshot,
  query,
  orderBy,
  doc,
  deleteDoc
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
const folderInput = document.getElementById('folderInput');
const createFolderBtn = document.getElementById('createFolderBtn');
const folderSelect = document.getElementById('folderSelect');
const noteInput = document.getElementById('noteInput');
const addNoteBtn = document.getElementById('addNoteBtn');
const foldersContainer = document.getElementById('foldersContainer');
const statusMsg = document.getElementById('statusMsg');

let selectedFolderId = 'default';

// Create Folder
createFolderBtn.addEventListener('click', async () => {
  const folderName = folderInput.value.trim();
  if (folderName) {
    try {
      const folderDoc = await addDoc(collection(db, 'folders'), {
        name: folderName,
        timestamp: serverTimestamp()
      });
      
      // Add to folder dropdown
      const option = document.createElement('option');
      option.value = folderDoc.id;
      option.textContent = folderName;
      folderSelect.appendChild(option);
      
      folderInput.value = '';
    } catch (error) {
      console.error("Error creating folder:", error);
    }
  }
});

// Select Folder
folderSelect.addEventListener('change', (e) => {
  selectedFolderId = e.target.value;
});

// Add Note
addNoteBtn.addEventListener('click', async () => {
  const noteText = noteInput.value.trim();
  if (noteText) {
    try {
      await addDoc(collection(db, 'notes'), {
        text: noteText,
        folderId: selectedFolderId,
        timestamp: serverTimestamp()
      });
      noteInput.value = '';
    } catch (error) {
      console.error("Error adding note:", error);
    }
  }
});

// Display Folders & Notes
const displayData = (folders, notes) => {
  foldersContainer.innerHTML = '';
  
  folders.forEach(folder => {
    const folderDiv = document.createElement('div');
    folderDiv.className = 'folder';
    
    // Folder Header
    const header = document.createElement('div');
    header.className = 'folder-header';
    
    const title = document.createElement('h3');
    title.className = 'folder-title';
    title.textContent = folder.name;
    
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-folder-btn';
    deleteBtn.textContent = 'Delete';
    deleteBtn.onclick = () => deleteDoc(doc(db, 'folders', folder.id));
    
    header.appendChild(title);
    header.appendChild(deleteBtn);
    
    // Folder Notes
    const notesDiv = document.createElement('div');
    notes
      .filter(note => note.folderId === folder.id)
      .forEach(note => {
        const noteElement = document.createElement('div');
        noteElement.className = 'note';
        noteElement.innerHTML = `
          <pre>${note.text}</pre>
          <button class="copy-btn">Copy</button>
          <button class="delete-note-btn">Delete</button>
        `;
        
        noteElement.querySelector('.copy-btn').onclick = () => {
          navigator.clipboard.writeText(note.text);
          statusMsg.textContent = 'Copied to clipboard!';
          statusMsg.style.display = 'block';
          setTimeout(() => statusMsg.style.display = 'none', 2000);
        };
        
        noteElement.querySelector('.delete-note-btn').onclick = () => {
          deleteDoc(doc(db, 'notes', note.id));
        };
        
        notesDiv.appendChild(noteElement);
      });
    
    folderDiv.appendChild(header);
    folderDiv.appendChild(notesDiv);
    foldersContainer.appendChild(folderDiv);
  });
};

// Real-Time Listeners
onSnapshot(query(collection(db, 'folders'), orderBy('timestamp')), (snapshot) => {
  const folders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  
  onSnapshot(query(collection(db, 'notes'), orderBy('timestamp', 'desc')), (notesSnapshot) => {
    const notes = notesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    displayData(folders, notes);
  });
});
