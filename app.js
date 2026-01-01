import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, where, getDocs, doc, setDoc, getDoc, deleteDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

const firebaseConfig = {
  apiKey: "AIzaSyDbaCn_eskoXDYAYhFPu9xI3__j_c7TO5Q",
  authDomain: "azerian.firebaseapp.com",
  projectId: "azerian",
  storageBucket: "azerian.firebasestorage.app",
  messagingSenderId: "35625238968",
  appId: "1:35625238968:web:b03f18593fde80427c8f4d",
  measurementId: "G-LZ08TH2CM7"
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let currentUser = null;
let selectedFriend = null;
document.getElementById('signupBtn').onclick = async () => {
  const username = document.getElementById('username').value.trim();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  
  if (!username || !email || !password) {
    showMsg('authMsg', 'Fill all fields!');
    return;
  }
  
  if (password.length < 6) {
    showMsg('authMsg', 'Password too short!');
    return;
  }
  
  try {
    const user = await createUserWithEmailAndPassword(auth, email, password);
    
    await setDoc(doc(db, 'users', user.user.uid), {
      username: username,
      email: email
    });
    
    showMsg('authMsg', 'Account created! ✅');
  } catch (error) {
    showMsg('authMsg', 'Email already used!');
  }
};

document.getElementById('loginBtn').onclick = async () => {
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  
  if (!email || !password) {
    showMsg('authMsg', 'Enter email and password!');
    return;
  }
  
  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
    showMsg('authMsg', 'Wrong email or password!');
  }
};

document.getElementById('logoutBtn').onclick = () => {
  signOut(auth);
};

onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentUser = user;
    
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    const username = userDoc.data().username;
    
    document.getElementById('authScreen').classList.add('hidden');
    document.getElementById('mainScreen').classList.remove('hidden');
    document.getElementById('myName').textContent = username;
    
    loadFriends();
    loadRequests();
  } else {
    document.getElementById('authScreen').classList.remove('hidden');
    document.getElementById('mainScreen').classList.add('hidden');
  }
});

window.sendRequest = async () => {
  const email = document.getElementById('friendEmail').value.trim();
  
  if (!email) {
    showMsg('addMsg', 'Enter an email!');
    return;
  }
  
  try {
    const q = query(collection(db, 'users'), where('email', '==', email));
    const snap = await getDocs(q);
    
    if (snap.empty) {
      showMsg('addMsg', 'User not found!');
      return;
    }
    
    const friendId = snap.docs[0].id;
    
    const friendshipId = [currentUser.uid, friendId].sort().join('_');
    const friendDoc = await getDoc(doc(db, 'friendships', friendshipId));
    
    if (friendDoc.exists()) {
      showMsg('addMsg', 'Already friends!');
      return;
    }
    
    await setDoc(doc(db, 'requests', `${currentUser.uid}_${friendId}`), {
      from: currentUser.uid,
      to: friendId,
      time: serverTimestamp()
    });
    
    showMsg('addMsg', 'Request sent! ✅');
    document.getElementById('friendEmail').value = '';
  } catch (error) {
    showMsg('addMsg', 'Error!');
  }
};

function loadFriends() {
  const q = query(collection(db, 'friendships'), where('users', 'array-contains', currentUser.uid));
  
  onSnapshot(q, async (snapshot) => {
    const list = document.getElementById('friendsList');
    list.innerHTML = '';
    
    if (snapshot.empty) {
      list.innerHTML = '<p style="text-align:center;color:#999">No friends yet</p>';
      return;
    }
    
    for (const docSnap of snapshot.docs) {
      const friendship = docSnap.data();
      const friendId = friendship.users.find(id => id !== currentUser.uid);
      
      const friendDoc = await getDoc(doc(db, 'users', friendId));
      const friend = friendDoc.data();
      
      const item = document.createElement('div');
      item.className = 'friend-item';
      item.innerHTML = `
        <div class="friend-name">${friend.username}</div>
        <div class="friend-email">${friend.email}</div>
      `;
      item.onclick = () => openChat(friendId, friend.username);
      list.appendChild(item);
    }
  });
}

// Load friend requests
function loadRequests() {
  const q = query(collection(db, 'requests'), where('to', '==', currentUser.uid));
  
  onSnapshot(q, async (snapshot) => {
    const list = document.getElementById('requestsList');
    const badge = document.getElementById('reqBadge');
    
    list.innerHTML = '';
    
    if (snapshot.empty) {
      list.innerHTML = '<p style="text-align:center;color:#999">No requests</p>';
      badge.classList.add('hidden');
      return;
    }
    
    badge.textContent = snapshot.size;
    badge.classList.remove('hidden');
    
    for (const docSnap of snapshot.docs) {
      const request = docSnap.data();
      
      const userDoc = await getDoc(doc(db, 'users', request.from));
      const user = userDoc.data();
      
      const item = document.createElement('div');
      item.className = 'request-item';
      item.innerHTML = `
        <div>
          <div class="friend-name">${user.username}</div>
          <div class="friend-email">${user.email}</div>
        </div>
        <div class="request-btns">
          <button class="accept-btn" onclick="acceptReq('${docSnap.id}', '${request.from}')">✓</button>
          <button class="reject-btn" onclick="rejectReq('${docSnap.id}')">✕</button>
        </div>
      `;
      list.appendChild(item);
    }
  });
}

// Accept request
window.acceptReq = async (reqId, friendId) => {
  const friendshipId = [currentUser.uid, friendId].sort().join('_');
  
  await setDoc(doc(db, 'friendships', friendshipId), {
    users: [currentUser.uid, friendId]
  });
  
  await deleteDoc(doc(db, 'requests', reqId));
};

window.rejectReq = async (reqId) => {
  await deleteDoc(doc(db, 'requests', reqId));
};

function openChat(friendId, friendName) {
  selectedFriend = friendId;
  
  document.getElementById('welcome').classList.add('hidden');
  document.getElementById('chatBox').classList.remove('hidden');
  document.getElementById('chatName').textContent = friendName;
  
  document.querySelectorAll('.friend-item').forEach(item => {
    item.classList.remove('active');
  });
  event.target.closest('.friend-item').classList.add('active');
  
  loadMessages(friendId);
}

window.closeChat = () => {
  selectedFriend = null;
  document.getElementById('chatBox').classList.add('hidden');
  document.getElementById('welcome').classList.remove('hidden');
  document.querySelectorAll('.friend-item').forEach(item => {
    item.classList.remove('active');
  });
};

function loadMessages(friendId) {
  const chatId = [currentUser.uid, friendId].sort().join('_');
  const q = query(collection(db, 'chats', chatId, 'messages'), orderBy('time', 'asc'));
  
  onSnapshot(q, (snapshot) => {
    const msgs = document.getElementById('messages');
    msgs.innerHTML = '';
    
    if (snapshot.empty) {
      msgs.innerHTML = '<p style="text-align:center;color:#999">No messages</p>';
      return;
    }
    
    snapshot.forEach(doc => {
      const msg = doc.data();
      const div = document.createElement('div');
      div.className = `msg ${msg.from === currentUser.uid ? 'sent' : 'received'}`;
      
      const time = msg.time ? new Date(msg.time.toDate()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '';
      
      div.innerHTML = `
        <div>${msg.text}</div>
        <div class="msg-time">${time}</div>
      `;
      msgs.appendChild(div);
    });
    
    msgs.scrollTop = msgs.scrollHeight;
  });
}

window.sendMsg = async () => {
  const input = document.getElementById('msgInput');
  const text = input.value.trim();
  
  if (!text || !selectedFriend) return;
  
  const chatId = [currentUser.uid, selectedFriend].sort().join('_');
  
  await addDoc(collection(db, 'chats', chatId, 'messages'), {
    text: text,
    from: currentUser.uid,
    time: serverTimestamp()
  });
  
  input.value = '';
};

document.getElementById('msgInput').onkeypress = (e) => {
  if (e.key === 'Enter') sendMsg();
};

window.showTab = (tabName) => {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(tc => tc.classList.add('hidden'));
  
  document.querySelector(`[onclick="showTab('${tabName}')"]`).classList.add('active');
  document.getElementById(tabName + 'Tab').classList.remove('hidden');
};

document.getElementById('searchBox').oninput = (e) => {
  const search = e.target.value.toLowerCase();
  document.querySelectorAll('.friend-item').forEach(item => {
    const text = item.textContent.toLowerCase();
    item.style.display = text.includes(search) ? 'flex' : 'none';
  });
};

function showMsg(id, text) {
  document.getElementById(id).textContent = text;
}