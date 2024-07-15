
const questions = [
    {
        text: "Hello there! I'm Hannah, your personal fashion assistant at Myntra. I'm excited to help you find the perfect outfit! First, may I know your name?",
        type: "text"
    },
    {
        text: "It's wonderful to meet you, {0}! Now, what's the special occasion you're shopping for today?",
        type: "options",
        options: ["Wedding", "Party", "Office", "Casual", "Vacation", "Other"]
    },
    {
        text: "Ah, {1}! How exciting! Do you have any specific requirements for this {1}, {0}?",
        type: "options",
        options: ["Formal", "Semi-formal", "Traditional", "Casual", "No specific requirements"]
    },
    {
        text: "Got it! Now, let's talk about your personal style, {0}. What kind of look are you going for?",
        type: "options",
        options: ["Trendy", "Classic", "Bohemian", "Minimalistic", "Eclectic", "Not sure"]
    },
    {
        text: "I love your {3} taste, {0}! Now, do you have a preferred type of dress in mind?",
        type: "options",
        options: ["Maxi", "Midi", "Mini", "A-line", "Sheath", "No preference"]
    },
    {
        text: "Great choice! Colors can really make an outfit pop. Any particular colors you love or want to avoid, {0}?",
        type: "text"
    },
    {
        text: "Noted! Fabric can make all the difference in comfort and style. Any fabric preferences?",
        type: "options",
        options: ["Cotton", "Silk", "Chiffon", "Satin", "Linen", "No preference"]
    },
    {
        text: "Perfect! To ensure the best fit, could you tell me your size or measurements, {0}?",
        type: "text"
    },
    {
        text: "Thanks for sharing that, {0}. Now, let's talk about fit. What's your preference?",
        type: "options",
        options: ["Slim fit", "Regular fit", "Loose fit", "No preference"]
    },
    {
        text: "Excellent! Is this outfit for a specific season or weather?",
        type: "options",
        options: ["Summer", "Winter", "Spring", "Fall", "All-season"]
    },
    {
        text: "We're almost there, {0}! Would you like to add any accessories to complete your look?",
        type: "options",
        options: ["Shoes", "Bags", "Jewelry", "Belts", "All of the above", "No accessories"]
    },
    {
        text: "You've got great taste, {0}! Is there anything else you'd like me to keep in mind while selecting outfits for you?",
        type: "text"
    }
];

let currentQuestion = 0;
let userResponses = [];
let socket;
let reconnectInterval = 1000; // Start with 1 second interval
const maxReconnectInterval = 30000;
function setupWebSocket() {
    socket = new WebSocket('ws://localhost:8081');

    socket.onopen = function(event) {
        console.log('WebSocket is connected.');
        reconnectInterval = 1000; // Reset reconnect interval on successful connection
        startPingInterval();
        askQuestion(); 
    };

    socket.onmessage = function(event) {
        const message = event.data;
        if (message === 'pong') {
            console.log('Received pong from server');
            return;
        }
        if (message.startsWith('{SERVER_MESSAGE}')) {
            // Message from server
            const serverMessage = message.replace('{SERVER_MESSAGE}', '');
            displayMessage(serverMessage, 'bot-message');
        } else if (message.startsWith('{SERVER_IMAGE}')) {
            // Image from server
            const imageData = message.replace('{SERVER_IMAGE}', '');
            displayImage(imageData);
        } else {
            // User response echoed back or other message handling
            displayMessage(message, 'bot-message');
        }
    };

    socket.onclose = function(event) {
        console.log('WebSocket is closed. Reconnecting...');
        clearInterval(pingInterval);
        setTimeout(setupWebSocket, reconnectInterval);
        reconnectInterval = Math.min(reconnectInterval * 2, maxReconnectInterval);
    };

    socket.onerror = function(event) {
        console.error('WebSocket error:', event);
    };
}
let pingInterval;

function startPingInterval() {
    pingInterval = setInterval(() => {
        if (socket.readyState === WebSocket.OPEN) {
            socket.send('ping');
        }
    }, 15000);
}
window.onload = function() {
    setupWebSocket();
};
function sendMessage() {
    const userInput = document.getElementById('userInput');
    const message = userInput.value.trim();
    
    if (message !== '') {
        displayMessage(message, 'user-message');
        processUserInput(message);
        userInput.value = '';
        // Send message to WebSocket server
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(message);
        }
    }
}

function displayMessage(message, className) {
    const chatMessages = document.getElementById('chatMessages');
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', className);
    messageElement.textContent = message;
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function processUserInput(input) {
    userResponses.push(input);
    currentQuestion++;
    if (currentQuestion < questions.length) {
        setTimeout(() => {
            askQuestion();
        }, 500);
    } else {
        setTimeout(() => {
            displayRecommendation();
        }, 1000);
    }
}

function askQuestion() {
    let question = questions[currentQuestion].text;
    for (let i = 0; i < userResponses.length; i++) {
        question = question.replace(new RegExp(`\\{${i}\\}`, 'g'), userResponses[i]);
    }
    displayMessage(question, 'bot-message');
    
    if (questions[currentQuestion].type === 'options') {
        displayOptions(questions[currentQuestion].options);
    }
}

function displayOptions(options) {
    const chatMessages = document.getElementById('chatMessages');
    const optionsContainer = document.createElement('div');
    optionsContainer.classList.add('options-container');
    
    options.forEach(option => {
        const button = document.createElement('button');
        button.classList.add('option-button');
        button.textContent = option;
        button.onclick = () => {
            displayMessage(option, 'user-message');
            processUserInput(option);
            if (socket && socket.readyState === WebSocket.OPEN) {
                socket.send(option);
            }
        };
        optionsContainer.appendChild(button);
    });
    
    chatMessages.appendChild(optionsContainer);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function displayRecommendation() {
    const recommendation = `Thank you so much, ${userResponses[0]}! Based on your fantastic preferences, I've got some amazing options for you. 
    I'm thinking a beautiful ${userResponses[4]} dress in ${userResponses[5]} would be perfect for your ${userResponses[1]}. 
    The ${userResponses[6]} fabric will keep you comfortable, and the ${userResponses[8]} fit will flatter your figure beautifully. 
    Don't forget to check out our ${userResponses[10]} to complete your stunning look!

    I'm so excited for you to see these options. Would you like me to show you some specific recommendations now?`;
    
    displayMessage(recommendation, 'bot-message');
    
    // Generate and display image (this part can be adapted based on your project needs)
    generateAndDisplayImage();
}

function generateAndDisplayImage() {
    const imagePrompt = `${userResponses[4]} dress in ${userResponses[5]} color, ${userResponses[6]} fabric, ${userResponses[8]} fit, for ${userResponses[1]} occasion`;
    
    displayMessage("Generating image based on your preferences...", 'bot-message');
    
    // Simulating image generation delay
    setTimeout(() => {
        const imageUrl = `https://source.unsplash.com/random/400x300/?${encodeURIComponent(imagePrompt)}`;
        const imageElement = document.createElement('img');
        imageElement.src = imageUrl;
        imageElement.alt = "Generated outfit recommendation";
        imageElement.classList.add('generated-image');
        
        const chatMessages = document.getElementById('chatMessages');
        chatMessages.appendChild(imageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        displayMessage("Here's a visual representation of an outfit based on your preferences. What do you think?", 'bot-message');
    }, 2000);
}

// Add event listener for Enter key
document.getElementById('userInput').addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        sendMessage();
    }
});

// Initial greeting
window.onload = function() {
    setupWebSocket();
};

// Toggle chatbot
document.querySelector('.chatbot-toggler').addEventListener('click', function() {
    document.querySelector('.chatbot').classList.toggle('show');
    document.querySelector('.chatbot-toggler').classList.toggle('hide');
});

// Close chatbot
document.querySelector('.close-btn').addEventListener('click', function() {
    document.querySelector('.chatbot').classList.toggle('show');
    document.querySelector('.chatbot-toggler').classList.toggle('hide');
});

// Add event listener for send button
document.getElementById('send-btn').addEventListener('click', sendMessage);
function displayImage(imageData) {
    const chatMessages = document.getElementById('chatMessages');
    const imageElement = document.createElement('img');
    imageElement.src = imageData;
    imageElement.alt = "Server sent image";
    imageElement.classList.add('server-image');
    imageElement.style.maxWidth = '100%';
    imageElement.style.maxHeight = '300px'; // Adjust this value as needed
    imageElement.style.objectFit = 'contain';
    chatMessages.appendChild(imageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}