const chatbox = document.getElementById("chatbox");
const userInput = document.getElementById("user-input");
const sendButton = document.getElementById("send-button");
const voiceButton = document.getElementById("voice-button");
const modelSelector = document.getElementById("model-selector");

let conversationHistory = [];
let selectedModel = "gpt";
let isVoiceMode = false;

// Speech Recognition Setup
const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;

if (SpeechRecognition) {
  recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = "en-US";

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    userInput.value = transcript;
    sendMessage();
  };

  recognition.onerror = (event) => {
    console.error("Speech recognition error:", event.error);
    appendMessage(
      "bot",
      "Sorry, I couldn’t understand that. Please try again."
    );
    toggleVoiceMode(false);
  };

  recognition.onend = () => {
    if (isVoiceMode) {
      recognition.start();
    }
  };
}

// Speech Synthesis Setup (for speaking responses)
const synth = window.speechSynthesis;

// Update selected model when changed
modelSelector.addEventListener("change", () => {
  selectedModel = modelSelector.value;
  conversationHistory = [];
  const switchMessage = `Switched to ${
    modelSelector.options[modelSelector.selectedIndex].text
  } model.`;
  appendMessage("bot", switchMessage);
  if (synth && isVoiceMode) {
    speak(switchMessage);
  }
});

// Function to append messages to the chatbox
function appendMessage(sender, text) {
  const messageElement = document.createElement("div");
  messageElement.classList.add("message", `${sender}-message`);

  const avatarImg = document.createElement("img");
  avatarImg.classList.add("avatar", `${sender}-avatar`);
  avatarImg.src = sender === "user" ? "user.png" : "bot.png";
  avatarImg.alt = `${sender} avatar`;

  const messageContent = document.createElement("div");
  messageContent.classList.add("message-content");

  if (text === "Typing...") {
    const typingIndicator = document.createElement("div");
    typingIndicator.classList.add("typing");
    for (let i = 0; i < 3; i++) {
      const dot = document.createElement("div");
      dot.classList.add("dot");
      typingIndicator.appendChild(dot);
    }
    messageContent.appendChild(typingIndicator);
  } else {
    const messageText = document.createElement("span");
    messageText.textContent = text;
    messageContent.appendChild(messageText);
  }

  if (sender === "user") {
    messageElement.appendChild(messageContent);
    messageElement.appendChild(avatarImg);
  } else {
    messageElement.appendChild(avatarImg);
    messageElement.appendChild(messageContent);
  }

  chatbox.appendChild(messageElement);
  chatbox.scrollTop = chatbox.scrollHeight;
}

// Function to speak text
function speak(text) {
  if (synth && isVoiceMode) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    synth.speak(utterance);
  }
}

// Function to toggle voice mode
function toggleVoiceMode(forceOff = false) {
  if (!recognition || !synth) {
    appendMessage(
      "bot",
      "Sorry, voice features are not supported in your browser."
    );
    return;
  }

  if (forceOff || isVoiceMode) {
    recognition.stop();
    synth.cancel(); // Stop any ongoing speech
    isVoiceMode = false;
    voiceButton.style.backgroundColor = "#2c2c2c";
    appendMessage("bot", "Voice mode turned off.");
  } else {
    isVoiceMode = true;
    recognition.start();
    voiceButton.style.backgroundColor = "#ff4444";
    appendMessage("bot", activationMessage);
    speak(activationMessage);
  }
}

// Function to handle sending messages
async function sendMessage() {
  const message = userInput.value.trim();
  if (!message) return;

  appendMessage("user", message);
  conversationHistory.push(`User: ${message}`);
  userInput.value = "";
  userInput.focus();

  appendMessage("bot", "Typing...");

  const prompt = conversationHistory.join("\n");

  try {
    let response = "";

    if (selectedModel === "gpt") {
      const gptResponse = await puter.ai.chat(prompt);
      response = gptResponse;
    } else {
      const deepSeekResponse = await puter.ai.chat(prompt, {
        model: selectedModel,
        stream: true,
      });
      response = "";
      for await (const part of deepSeekResponse) {
        response += part?.text || "";
      }
    }

    chatbox.removeChild(chatbox.lastChild);
    appendMessage("bot", response);
    conversationHistory.push(`Bot: ${response}`);
    speak(response); // Speak the bot's response
  } catch (error) {
    console.error("Error:", error);
    chatbox.removeChild(chatbox.lastChild);
    const errorMessage = "Oops! Something went wrong.";
    appendMessage("bot", errorMessage);
    speak(errorMessage);
  }
}

// Event listeners
sendButton.addEventListener("click", sendMessage);
voiceButton.addEventListener("click", () => toggleVoiceMode());
userInput.addEventListener("keypress", function (e) {
  if (e.key === "Enter") {
    sendMessage();
  }
});

// Welcome message on page load
window.onload = function () {
  const welcomeMessage =
    "Ask Me Any Question? Or You Can Switch between other AI. Try voice mode with the 🎤 button!";
  appendMessage("bot", welcomeMessage);
  if (synth) {
    speak(welcomeMessage); // Speak welcome message only if voice mode is on later
  }
  userInput.focus();
};
