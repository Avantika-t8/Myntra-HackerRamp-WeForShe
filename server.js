const WebSocket = require('ws');
const readline = require('readline');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');  // Add this line

const server = new WebSocket.Server({ port: 8081 });

const clients = new Set();

function heartbeat() {
    this.isAlive = true;
}
server.on('connection', ws => {
    clients.add(ws);
    ws.isAlive = true;
    ws.on('pong', heartbeat);
    // Send initial message to the client
   

    ws.on('message', message => {
        console.log(`Received: ${message}`);

        // Convert message to string if it's not already
        const messageString = message.toString();
        if (messageString === 'ping') {
            ws.send('pong');
            return;
        }
        // Process the message and send appropriate responses
        if (messageString.startsWith('{USER_RESPONSE}')) {
            // Message from the client
            const userMessage = messageString.replace('{USER_RESPONSE}', '');
            // Here, you could process the userMessage further if needed
            // For simplicity, let's just echo it back to the client for now
            const response = `You said: ${userMessage}`;
            ws.send(response);

            // Simulate server processing delay (e.g., fetching recommendations)
            setTimeout(() => {
                const recommendation = `Based on your preferences, here's a recommendation for you: ...`;
                // Send recommendation to the client
                ws.send(`{SERVER_MESSAGE}${recommendation}`);
            }, 2000);
        } else {
            // Handle other types of messages if needed
            console.log(`Received unexpected message: ${messageString}`);
        }
    });

    ws.on('close', () => {
        clients.delete(ws);
        console.log('Client disconnected');
    });
});

// Set up readline interface for console input
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Function to broadcast message to all clients
function broadcastMessage(message) {
    clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(`{SERVER_MESSAGE}${message}`);
        }
    });
}

// Function to resize and broadcast image to all clients
function broadcastImage(imagePath) {
    sharp(imagePath)
        .resize({ width: 500 }) // Resize to 500px width, maintaining aspect ratio
        .toBuffer((err, buffer) => {
            if (err) {
                console.error('Error resizing image:', err);
                return;
            }
            
            const imageData = buffer.toString('base64');
            const imageExt = path.extname(imagePath).slice(1);
            const fullMessage = `{SERVER_IMAGE}data:image/${imageExt};base64,${imageData}`;
            
            clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(fullMessage);
                }
            });
        });
}

// Listen for input from the console
rl.on('line', (input) => {
    if (input.startsWith('image:')) {
        // If input starts with 'image:', treat it as a local image path
        const imagePath = input.slice(6).trim();
        console.log(`Broadcasting image: ${imagePath}`);
        broadcastImage(imagePath);
    } else {
        console.log(`Broadcasting message: ${input}`);
        broadcastMessage(input);
    }
});
const interval = setInterval(() => {
    server.clients.forEach(ws => {
        if (ws.isAlive === false) return ws.terminate();
        ws.isAlive = false;
        ws.ping();
    });
}, 30000);

server.on('close', () => {
    clearInterval(interval);
});
console.log('Server is running. Type a message and press Enter to broadcast to all clients.');
console.log('To send an image, type "image:" followed by the local image path.');