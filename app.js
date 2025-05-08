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

const firebaseConfig = {
  apiKey: "AIzaSyDPCMHKcX8A9nDotgftqHMzqRN1W7rvcPA",
  authDomain: "textme-ae3dc.firebaseapp.com",
  projectId: "textme-ae3dc",
  storageBucket: "textme-ae3dc.firebasestorage.app",
  messagingSenderId: "461630294646",
  appId: "1:461630294646:web:d305cdf10e098649fb2d57",
  measurementId: "G-GZ35R77RJP"
};

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

  // Handle Default Folder
  const defaultNotes = notes.filter(note => note.folderId === 'default');
  if (defaultNotes.length > 0) {
    const defaultFolder = createFolderElement({
      id: 'default',
      name: 'Default Folder'
    }, defaultNotes);
    foldersContainer.appendChild(defaultFolder);
  }

  // Handle Other Folders
  folders.forEach(folder => {
    const folderNotes = notes.filter(note => note.folderId === folder.id);
    if (folderNotes.length > 0) {
      const folderElement = createFolderElement(folder, folderNotes);
      foldersContainer.appendChild(folderElement);
    }
  });
};

const createFolderElement = (folder, notes) => {
  const folderDiv = document.createElement('div');
  folderDiv.className = 'folder';

  // Folder Header
  const header = document.createElement('div');
  header.className = 'folder-header';

  // Toggle Button
  const toggleBtn = document.createElement('button');
  toggleBtn.className = 'toggle-btn';
  toggleBtn.textContent = '▼';
  
  // Folder Title
  const title = document.createElement('div');
  title.className = 'folder-title';
  title.innerHTML = `
    <span>${folder.name}</span>
  `;

  // Delete Button
  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'delete-folder-btn';
  deleteBtn.textContent = 'Delete';
  deleteBtn.onclick = async () => {
    // Remove from dropdown
    const options = Array.from(folderSelect.options);
    const optionToRemove = options.find(opt => opt.value === folder.id);
    if (optionToRemove) optionToRemove.remove();
    
    // Delete folder from Firestore
    await deleteDoc(doc(db, 'folders', folder.id));
  };

  // Notes Container
  const notesDiv = document.createElement('div');
  notesDiv.className = 'folder-notes';

  // Toggle Functionality
  let isExpanded = true;
  toggleBtn.addEventListener('click', () => {
    isExpanded = !isExpanded;
    notesDiv.style.display = isExpanded ? 'block' : 'none';
    toggleBtn.textContent = isExpanded ? '▼' : '▶';
  });

  // Add Notes
  notes.forEach(note => {
    const noteElement = document.createElement('div');
    noteElement.className = 'note';
    noteElement.innerHTML = `
      <pre>${note.text}</pre>
      <div class="note-actions">
        <button class="copy-btn">📋</button>
        <button class="delete-note-btn">🗑️</button>
      </div>
    `;

    // Copy Functionality
    noteElement.querySelector('.copy-btn').addEventListener('click', () => {
      navigator.clipboard.writeText(note.text);
      statusMsg.textContent = 'Copied to clipboard!';
      statusMsg.style.display = 'block';
      setTimeout(() => statusMsg.style.display = 'none', 2000);
    });

    // Delete Note
    noteElement.querySelector('.delete-note-btn').addEventListener('click', () => {
      deleteDoc(doc(db, 'notes', note.id));
    });

    notesDiv.appendChild(noteElement);
  });

  // Assemble Folder
  header.appendChild(toggleBtn);
  header.appendChild(title);
  header.appendChild(deleteBtn);
  folderDiv.appendChild(header);
  folderDiv.appendChild(notesDiv);

  return folderDiv;
};

// Real-Time Listeners
// Folder Listener (also updates dropdown)
onSnapshot(query(collection(db, 'folders'), orderBy('timestamp')), (snapshot) => {
  // Update dropdown
  folderSelect.innerHTML = '<option value="default">Default Folder</option>';
  snapshot.docs.forEach(doc => {
    const option = document.createElement('option');
    option.value = doc.id;
    option.textContent = doc.data().name;
    folderSelect.appendChild(option);
  });

  // Get updated notes
  onSnapshot(query(collection(db, 'notes'), orderBy('timestamp', 'desc')), (notesSnapshot) => {
    const notes = notesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const folders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    displayData(folders, notes);
  });
});
