const matchScreen = document.getElementById('match-screen');
const chatScreen = document.getElementById('chat-screen');
const matchBtn = document.getElementById('match-btn');
const cancelBtn = document.getElementById('cancel-btn'); // YENİ EKLENDİ
const statusText = document.getElementById('status-text');
const leaveBtn = document.getElementById('leave-btn');
const sendBtn = document.getElementById('send-btn');
const messageInput = document.getElementById('message-input');
const chatBox = document.getElementById('chat-box');
const typingIndicator = document.getElementById('typing-indicator'); // YENİ EKLENDİ

let searchInterval;
let typingTimeout; // Yazıyor animasyonunun süresini tutmak için

const connection = new signalR.HubConnectionBuilder()
    .withUrl("/chatHub")
    .build();

connection.start().catch(err => console.error("SignalR Hatası: ", err));

// --- SİGNALR DİNLEYİCİLERİ ---

connection.on("MatchFound", () => {
    clearInterval(searchInterval);
    
    matchScreen.classList.remove('active');
    setTimeout(() => {
        chatScreen.classList.add('active');
        chatBox.innerHTML = ''; 
        addMessage('Sistem', 'Yabancı ile eşleştiniz. Merhaba deyin!', 'received');
        messageInput.disabled = false;
        sendBtn.disabled = false;
        messageInput.focus();
    }, 200);
});

connection.on("ReceiveMessage", (message) => {
    // Mesaj geldiğinde "yazıyor..." ibaresini anında gizle
    typingIndicator.style.display = 'none';
    clearTimeout(typingTimeout);
    addMessage('Yabancı', message, 'received');
});

connection.on("PartnerLeft", () => {
    addMessage('Sistem', 'Yabancı sohbetten ayrıldı.', 'received');
    typingIndicator.style.display = 'none';
    messageInput.disabled = true;
    sendBtn.disabled = true;
});

// YENİ: Karşı taraf yazarken tetiklenir
connection.on("ShowTyping", () => {
    typingIndicator.style.display = 'block';
    chatBox.scrollTop = chatBox.scrollHeight;
    
    // 1.5 saniye boyunca yeni harf girilmezse "yazıyor..." ibaresini kaldır
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
        typingIndicator.style.display = 'none';
    }, 1500);
});


// --- BUTON VE INPUT OLAYLARI ---

matchBtn.addEventListener('click', () => {
    matchBtn.style.display = 'none';
    cancelBtn.style.display = 'inline-block'; // Eşleş butonu gidip İptal butonu geliyor
    
    let dots = 0;
    searchInterval = setInterval(() => {
        dots = (dots + 1) % 4;
        statusText.textContent = 'Uygun bir yabancı aranıyor' + '.'.repeat(dots);
    }, 500);

    connection.invoke("FindMatch").catch(err => console.error(err));
});

// YENİ: İptal Butonu
cancelBtn.addEventListener('click', () => {
    connection.invoke("CancelMatch").catch(err => console.error(err));
    clearInterval(searchInterval);
    resetUI();
});

leaveBtn.addEventListener('click', () => {
    connection.invoke("LeaveMatch").catch(err => console.error(err));
    resetUI();
});

sendBtn.addEventListener('click', sendMessage);

// YENİ: Klavyede harfe basıldığında "Yazıyor..." tetiklemesini sunucuya gönder
messageInput.addEventListener('input', () => {
    connection.invoke("Typing").catch(err => console.error(err));
});

messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});

function sendMessage() {
    const text = messageInput.value.trim();
    if (!text) return;

    addMessage('Sen', text, 'sent');
    messageInput.value = '';

    connection.invoke("SendMessage", text).catch(err => console.error(err));
}

function addMessage(sender, text, type) {
    const msgDiv = document.createElement('div');
    msgDiv.classList.add('message', type);
    msgDiv.textContent = text;
    chatBox.appendChild(msgDiv);
    chatBox.scrollTop = chatBox.scrollHeight; 
}

function resetUI() {
    chatScreen.classList.remove('active');
    setTimeout(() => {
        matchScreen.classList.add('active');
        matchBtn.style.display = 'inline-block';
        cancelBtn.style.display = 'none';
        statusText.textContent = 'Sohbet etmek için butona tıkla.';
        messageInput.disabled = true;
        sendBtn.disabled = true;
        typingIndicator.style.display = 'none';
        messageInput.value = '';
    }, 200);
}