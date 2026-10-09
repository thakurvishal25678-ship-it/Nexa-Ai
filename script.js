// ========================================
// NEXA AI - MAIN CHAT
// ========================================

const input = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");
const messages = document.getElementById("messages");
const typing = document.getElementById("typing");
const newChat = document.getElementById("newChat");

let conversationHistory = [];


// ========================================
// AI RESPONSE - STREAMING
// ========================================

async function getAIResponse(message, onChunk) {

    try {

        const response = await fetch("http://localhost:3000/chat", {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                message: message,
                history: conversationHistory
            })
        });


        if (!response.ok) {
            throw new Error("Server error: " + response.status);
        }


        if (!response.body) {
            throw new Error("No response received from server.");
        }


        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        let fullText = "";


        while (true) {

            const { value, done } = await reader.read();

            if (done) break;


            const chunk = decoder.decode(value, {
                stream: true
            });


            fullText += chunk;


            if (onChunk) {
                onChunk(fullText);
            }

        }


        return fullText;


    } catch (error) {

        console.error("Chat Error:", error);

        return "❌ Unable to connect to server.";

    }

}


// ========================================
// FORMAT AI REPLY
// ========================================

function formatAIReply(text) {

    if (!text) return "";

    text = text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");


    // Bold
    text = text.replace(
        /\*\*(.*?)\*\*/g,
        "<strong>$1</strong>"
    );


    // Headings
    text = text.replace(
        /^### (.*)$/gm,
        "<h4>$1</h4>"
    );

    text = text.replace(
        /^## (.*)$/gm,
        "<h3>$1</h3>"
    );

    text = text.replace(
        /^# (.*)$/gm,
        "<h2>$1</h2>"
    );


    // Numbered list
    text = text.replace(
        /^(\d+)\.\s+(.+)$/gm,
        "<div class='ai-list'>$1. $2</div>"
    );


    // New lines
    text = text.replace(
        /\n/g,
        "<br>"
    );


    return text;

}


// ========================================
// SEND MESSAGE
// ========================================

async function sendMessage() {

    if (!input || !messages) return;


    const text = input.value.trim();


    if (text === "") return;


    // User message
    const userMessage =
        document.createElement("div");

    userMessage.className =
        "user-message";

    userMessage.textContent =
        text;

    messages.appendChild(
        userMessage
    );


    // Clear input
    input.value = "";


    // Show typing
    if (typing) {
        typing.style.display = "block";
    }


    messages.scrollTop =
        messages.scrollHeight;


    // Create AI message
    const aiMessage =
        document.createElement("div");

    aiMessage.className =
        "ai-message";


    aiMessage.innerHTML = `
        <strong>🤖 Nexa AI</strong>

        <p class="ai-reply"></p>

        <div class="message-actions">

            <button class="copyBtn">
                📋 Copy
            </button>

            <button class="likeBtn">
                👍
            </button>

            <button class="dislikeBtn">
                👎
            </button>

            <button class="speakBtn">
                🔊 Speak
            </button>

        </div>
    `;


    messages.appendChild(
        aiMessage
    );


    const replyElement =
        aiMessage.querySelector(
            ".ai-reply"
        );


    messages.scrollTop =
        messages.scrollHeight;


    // Get AI response
    const reply =
        await getAIResponse(
            text,
            function(currentText) {

                replyElement.innerHTML =
                    formatAIReply(
                        currentText
                    );


                messages.scrollTop =
                    messages.scrollHeight;

            }
        );


    // Final reply
    replyElement.innerHTML =
        formatAIReply(reply);


    // Conversation memory
    conversationHistory.push({
        user: text,
        assistant: reply
    });


    if (
        conversationHistory.length > 20
    ) {

        conversationHistory.shift();

    }


    // Hide typing
    if (typing) {
        typing.style.display =
            "none";
    }


    messages.scrollTop =
        messages.scrollHeight;


    saveChat();

}


// ========================================
// SEND BUTTON
// ========================================

if (sendBtn) {

    sendBtn.addEventListener(
        "click",
        sendMessage
    );

}


// ========================================
// ENTER KEY
// ========================================

if (input) {

    input.addEventListener(
        "keydown",
        function(e) {

            if (e.key === "Enter") {

                e.preventDefault();

                sendMessage();

            }

        }
    );

}


// ========================================
// NEW CHAT
// ========================================

if (newChat) {

    newChat.addEventListener(
        "click",
        function() {

            if (!messages) return;


            messages.innerHTML = `
                <div class="ai-message">

                    👋 Hello! I am Nexa AI.
                    How can I help you today?

                </div>

                <div
                    id="typing"
                    style="display:none;"
                >
                    🤖 Nexa AI is typing...
                </div>
            `;


            input.value = "";

            conversationHistory = [];


            saveChat();

            displayChatHistory();

        }
    );

}


// ========================================
// SAVE CHAT
// ========================================

function saveChat() {

    if (!messages) return;


    const chatData =
        messages.innerHTML;


    if (!chatData.trim()) return;


    let history =
        JSON.parse(
            localStorage.getItem(
                "nexaChatHistory"
            )
        ) || [];


    const firstUserMessage =
        messages.querySelector(
            ".user-message"
        );


    let title =
        "New Chat";


    if (firstUserMessage) {

        title =
            firstUserMessage.innerText.trim();


        if (title.length > 30) {

            title =
                title.substring(
                    0,
                    30
                ) + "...";

        }

    }


    const chat = {

        id: Date.now(),

        title: title,

        messages: chatData

    };


    history.push(chat);


    // Keep only last 30 chats
    if (history.length > 30) {

        history =
            history.slice(-30);

    }


    localStorage.setItem(
        "nexaChatHistory",
        JSON.stringify(history)
    );

}


// ========================================
// DISPLAY CHAT HISTORY
// ========================================

function displayChatHistory() {

    const chatList =
        document.getElementById(
            "chatList"
        );


    if (!chatList || !messages)
        return;


    const history =
        JSON.parse(
            localStorage.getItem(
                "nexaChatHistory"
            )
        ) || [];


    chatList.innerHTML = "";


    history.forEach(
        function(chat) {

            const li =
                document.createElement(
                    "li"
                );


            li.textContent =
                "💬 " + chat.title;


            li.addEventListener(
                "click",
                function() {

                    messages.innerHTML =
                        chat.messages;


                    messages.scrollTop =
                        messages.scrollHeight;

                }
            );


            chatList.appendChild(li);

        }
    );

}


// ========================================
// LOAD HISTORY
// ========================================

window.addEventListener(
    "load",
    function() {

        displayChatHistory();

    }
);


// ========================================
// COPY / LIKE / DISLIKE / SPEAK
// ========================================

document.addEventListener(
    "click",
    function(e) {


        // COPY
        if (
            e.target.classList.contains(
                "copyBtn"
            )
        ) {

            const aiBox =
                e.target.closest(
                    ".ai-message"
                );


            const reply =
                aiBox
                    ? aiBox.querySelector(
                        ".ai-reply"
                    )
                    : null;


            if (reply) {

                navigator.clipboard.writeText(
                    reply.innerText
                );


                e.target.textContent =
                    "✅ Copied";


                setTimeout(
                    function() {

                        e.target.textContent =
                            "📋 Copy";

                    },
                    1200
                );

            }

        }


        // SPEAK
        if (
            e.target.classList.contains(
                "speakBtn"
            )
        ) {

            const aiBox =
                e.target.closest(
                    ".ai-message"
                );


            const reply =
                aiBox
                    ? aiBox.querySelector(
                        ".ai-reply"
                    )
                    : null;


            if (
                reply &&
                "speechSynthesis" in window
            ) {

                window.speechSynthesis.cancel();


                const speech =
                    new SpeechSynthesisUtterance(
                        reply.innerText
                    );


                speech.lang =
                    "en-US";


                window.speechSynthesis.speak(
                    speech
                );

            }

        }


        // LIKE
        if (
            e.target.classList.contains(
                "likeBtn"
            )
        ) {

            e.target.textContent =
                "👍✓";

        }


        // DISLIKE
        if (
            e.target.classList.contains(
                "dislikeBtn"
            )
        ) {

            e.target.textContent =
                "👎✓";

        }

    }
);


// ========================================
// MICROPHONE
// ========================================

const micBtn =
    document.getElementById(
        "micBtn"
    );


if (micBtn) {

    const SpeechRecognition =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;


    if (SpeechRecognition) {

        const recognition =
            new SpeechRecognition();


        recognition.lang =
            "en-US";


        recognition.continuous =
            false;


        recognition.interimResults =
            false;


        micBtn.addEventListener(
            "click",
            function() {

                try {

                    recognition.start();

                } catch (error) {

                    console.log(
                        "Microphone already running."
                    );

                }

            }
        );


        recognition.onresult =
            function(event) {

                if (input) {

                    input.value =
                        event.results[0][0]
                            .transcript;


                    input.focus();

                }

            };

    }

}


// ========================================
// THEME
// ========================================

const themeBtn =
    document.getElementById(
        "themeBtn"
    );


if (themeBtn) {

    themeBtn.addEventListener(
        "click",
        function() {

            document.body.classList.toggle(
                "light"
            );

        }
    );

}


// ========================================
// PDF UPLOAD
// ========================================

const uploadBtn =
    document.getElementById(
        "uploadBtn"
    );


const fileInput =
    document.getElementById(
        "fileInput"
    );


if (
    uploadBtn &&
    fileInput
) {

    uploadBtn.addEventListener(
        "click",
        function() {

            fileInput.click();

        }
    );


    fileInput.addEventListener(
        "change",
        async function() {

            const file =
                fileInput.files[0];


            if (!file) return;


            if (
                file.type !==
                "application/pdf"
            ) {

                alert(
                    "Please upload a PDF file."
                );

                return;

            }


            if (!messages) return;


            const fileMessage =
                document.createElement(
                    "div"
                );


            fileMessage.className =
                "user-message";


            fileMessage.innerHTML = `
                📎 <strong>
                    ${file.name}
                </strong>

                <br>

                ⏳ Nexa AI is analyzing
                your PDF...
            `;


            messages.appendChild(
                fileMessage
            );


            messages.scrollTop =
                messages.scrollHeight;


            try {

                const formData =
                    new FormData();


                formData.append(
                    "file",
                    file
                );


                const response =
                    await fetch(
                        "http://localhost:3000/upload-pdf",
                        {
                            method: "POST",
                            body: formData
                        }
                    );


                if (!response.ok) {

                    throw new Error(
                        "PDF server error"
                    );

                }


                const data =
                    await response.json();


                const aiMessage =
                    document.createElement(
                        "div"
                    );


                aiMessage.className =
                    "ai-message";


                aiMessage.innerHTML = `
                    <strong>
                        🤖 Nexa AI
                    </strong>

                    <p>
                        ${
                            data.reply ||
                            "PDF processed."
                        }
                    </p>
                `;


                messages.appendChild(
                    aiMessage
                );


                messages.scrollTop =
                    messages.scrollHeight;


                saveChat();


            } catch (error) {

                console.error(
                    "PDF Upload Error:",
                    error
                );


                const errorMessage =
                    document.createElement(
                        "div"
                    );


                errorMessage.className =
                    "ai-message";


                errorMessage.innerHTML = `
                    ❌ PDF process nahi ho paya.

                    <br>

                    Please check that the
                    server is running.
                `;


                messages.appendChild(
                    errorMessage
                );

            }

        }
    );

}


// ========================================
// IMAGE ANALYSIS
// ========================================

const imageBtn =
    document.getElementById(
        "imageBtn"
    );


const imageInput =
    document.getElementById(
        "imageInput"
    );


if (
    imageBtn &&
    imageInput
) {

    imageBtn.addEventListener(
        "click",
        function() {

            imageInput.click();

        }
    );


    imageInput.addEventListener(
        "change",
        async function() {

            const image =
                imageInput.files[0];


            if (!image) return;


            if (!messages) return;


            const userImage =
                document.createElement(
                    "div"
                );


            userImage.className =
                "user-message";


            userImage.innerHTML = `
                🖼️ <strong>
                    ${image.name}
                </strong>

                <br>

                ⏳ Nexa AI is analyzing
                the image...
            `;


            messages.appendChild(
                userImage
            );


            messages.scrollTop =
                messages.scrollHeight;


            try {

                const formData =
                    new FormData();


                formData.append(
                    "image",
                    image
                );


                const response =
                    await fetch(
                        "http://localhost:3000/analyze-image",
                        {
                            method: "POST",
                            body: formData
                        }
                    );


                if (!response.ok) {

                    throw new Error(
                        "Image server error"
                    );

                }


                const data =
                    await response.json();


                const aiMessage =
                    document.createElement(
                        "div"
                    );


                aiMessage.className =
                    "ai-message";


                aiMessage.innerHTML = `
                    🤖 <strong>
                        Nexa AI
                    </strong>

                    <p>
                        ${
                            data.reply ||
                            "Image processed."
                        }
                    </p>
                `;


                messages.appendChild(
                    aiMessage
                );


                messages.scrollTop =
                    messages.scrollHeight;


                saveChat();


            } catch (error) {

                console.error(
                    "Image Error:",
                    error
                );


                const errorMessage =
                    document.createElement(
                        "div"
                    );


                errorMessage.className =
                    "ai-message";


                errorMessage.innerHTML = `
                    ❌ Image analysis
                    nahi ho paya.

                    <br>

                    Please check that the
                    server is running.
                `;


                messages.appendChild(
                    errorMessage
                );

            }

        }
    );

}


// ========================================
// SETTINGS
// ========================================

const settingsBtn =
    document.getElementById(
        "settingsBtn"
    );


const settingsPanel =
    document.getElementById(
        "settingsPanel"
    );


const closeSettings =
    document.getElementById(
        "closeSettings"
    );


if (
    settingsBtn &&
    settingsPanel
) {

    settingsBtn.addEventListener(
        "click",
        function() {

            settingsPanel.classList.add(
                "active"
            );

        }
    );

}


if (
    closeSettings &&
    settingsPanel
) {

    closeSettings.addEventListener(
        "click",
        function() {

            settingsPanel.classList.remove(
                "active"
            );

        }
    );

}


// ========================================
// PROFILE
// ========================================

const profileBtn =
    document.getElementById(
        "profileBtn"
    );


const profilePanel =
    document.getElementById(
        "profilePanel"
    );


const closeProfile =
    document.getElementById(
        "closeProfile"
    );


if (
    profileBtn &&
    profilePanel
) {

    profileBtn.addEventListener(
        "click",
        function() {

            profilePanel.classList.add(
                "active"
            );

        }
    );

}


if (
    closeProfile &&
    profilePanel
) {

    closeProfile.addEventListener(
        "click",
        function() {

            profilePanel.classList.remove(
                "active"
            );

        }
    );

}


// ========================================
// CLOSE POPUPS OUTSIDE
// ========================================

if (settingsPanel) {

    settingsPanel.addEventListener(
        "click",
        function(e) {

            if (
                e.target ===
                settingsPanel
            ) {

                settingsPanel.classList.remove(
                    "active"
                );

            }

        }
    );

}


if (profilePanel) {

    profilePanel.addEventListener(
        "click",
        function(e) {

            if (
                e.target ===
                profilePanel
            ) {

                profilePanel.classList.remove(
                    "active"
                );

            }

        }
    );

}


// ========================================
// CLEAR CHAT HISTORY
// ========================================

const clearHistoryBtn =
    document.getElementById(
        "clearHistoryBtn"
    );


if (clearHistoryBtn) {

    clearHistoryBtn.addEventListener(
        "click",
        function() {

            const confirmClear =
                confirm(
                    "Are you sure you want to clear chat history?"
                );


            if (confirmClear) {

                localStorage.removeItem(
                    "nexaChatHistory"
                );


                localStorage.removeItem(
                    "nexaChat"
                );


                alert(
                    "✅ Chat history cleared!"
                );


                location.reload();

            }

        }
    );

}
