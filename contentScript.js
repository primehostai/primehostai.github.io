/*******************************************
 * contentScript.js
 *******************************************/
BASE_URL = "https://api.primehost.ai";
//BASE_URL = "http://localhost:8085";

// Create a style tag to hold our CSS
document.addEventListener("DOMContentLoaded", () => {

  const style = document.createElement('style');
  style.textContent = `
    #audio-recorder-container {
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 999999;
    }

    /* Chat panel (hidden by default) */
    #audio-recorder-container #chatPanel {
      position: absolute;
      bottom: 80px;
      right: 0;
      width: 300px;
      height: 400px;
      background: #fff;
      color: #000;
      border: 1px solid #ccc;
      border-radius: 8px;
      display: flex;
      flex-direction: column;
      z-index: 1;
    }
    #audio-recorder-container #chatPanel.hidden {
      display: none;
    }

    /* The close button in the top-right */
    #audio-recorder-container #chatPanel #closeBtn {
      position: absolute;
      top: 10px;
      right: 10px;
      background: none;
      border: none;
      font-size: 20px;
      cursor: pointer;
      color: #000;
    }

    /* The messages area inside the panel */
    #audio-recorder-container .messages-container {
      flex-grow: 1;
      overflow-y: auto;
      padding: 10px;
      margin-top: 40px;
      background-color: #fff;
      border: none;
    }

    /* Record button initially floats at bottom-right (class .bottom-floating) */
    #audio-recorder-container #recordBtn.bottom-floating {
      position: absolute;
      bottom: 0;
      right: 40px;
    }

    /* When the record button is inside the panel (class .in-panel) */
    #audio-recorder-container #chatPanel #recordBtn.in-panel {
      position: absolute;
      top: 10px;
      left: 10px;
      width: 150px; /* Rectangle button */
      height: 50px; /* Rectangle button */
      border-radius: 0; /* Remove border radius */
    }

    /* Common styles for the record button */
    #audio-recorder-container #recordBtn {
      width: 55px; /* 10% larger */
      height: 55px; /* 10% larger */
      border-radius: 50%;
      border: none;
      background-color: #230A4A;
      color: #fff;
      cursor: pointer;
      z-index: 2;
      display: flex;
      justify-content: center;
      align-items: center;
      font-weight: bold;
      visibility: hidden; /* Initially hidden */
      pointer-events: none; /* Initially disabled */
      
    }

    /* Button states (active, playing) */
    #recordBtn.active {
      background-color: #ff6600;
      transform: scale(1.1);
      animation: pulse 1s infinite;
    }
    #recordBtn.playing {
      background-color: #230A4A;
      transform: scale(1.1);
      animation: equalizer 1s infinite;
    }

    /* Example bubble styling */
    .assistant-message-bubble {
      background: #ffffff
      color: #004d40;
      border: 1px solid #004d40;
      border-radius: 15px;
      padding: 10px;
      margin: 5px 0;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    .sender-message-bubble {
      background: gray;
      color: #f57f17;
      border: 1px solid #f57f17;
      border-radius: 15px;
      padding: 10px;
      margin: 5px 0;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
  `;
  document.head.appendChild(style);

  // Create the container
  const container = document.createElement('div');
  container.id = 'audio-recorder-container';

  // Insert HTML for chat panel (hidden) + record button (floating)
  container.innerHTML = `
    <div id="chatPanel" class="hidden">
      <button id="closeBtn">&times;</button>
      <div class="messages-container" id="messages"></div>
    </div>
    <button id="recordBtn" class="bottom-floating" disabled>Ask AI</button>
  `;

  // Add container to the page
  document.body.appendChild(container);

  // Audio + WebSocket logic
  let audioContext;
  let processorNode;
  let sourceNode;
  let ws;
  let isSetup = false;
  let isHoldingButton = false;
  let audioQueue = [];
  let isPlaying = false;
  let currentSource = null;

  const recordBtn = container.querySelector('#recordBtn');
  const closeBtn = container.querySelector('#closeBtn');
  const messagesDiv = container.querySelector('#messages');
  const chatPanel = container.querySelector('#chatPanel');

  // Move the record button into the chat panel (top-left)
  function moveRecordButtonInsidePanel() {
    chatPanel.appendChild(recordBtn);
    recordBtn.classList.remove('bottom-floating');
    recordBtn.classList.add('in-panel');
    recordBtn.textContent = "Press Space to talk";
  }

  // Move the record button back to bottom-floating
  function moveRecordButtonOutsidePanel() {
    container.appendChild(recordBtn);
    recordBtn.classList.remove('in-panel');
    recordBtn.classList.add('bottom-floating');
    recordBtn.textContent = "Ask AI";
  }

  // Close panel + cleanup
  closeBtn.addEventListener('click', () => {
    cleanup();
    chatPanel.classList.add('hidden');
    recordBtn.style.display = 'none'; // Hide the record button completely
  });

  // Display message
  function displayMessage(message, isSender = false, isImage = false) {
    const messageContainer = document.createElement('div');
    const messageElement = document.createElement('div');
    messageElement.textContent = message;
    messageContainer.classList.add('message-container');

    if (isSender) {
      messageContainer.classList.add('sender-message-container');
      messageElement.classList.add('message-bubble', 'sender-message-bubble');
    } else if (isImage) {
      const img = document.createElement('img');
      img.src = message;
      img.alt = "Image message";
      messageElement.textContent = "";
      messageElement.appendChild(img);
      messageContainer.classList.add('assistant-message-container');
      messageElement.classList.add('message-bubble', 'assistant-message-bubble');
    } else {
      messageContainer.classList.add('assistant-message-container');
      messageElement.classList.add('message-bubble', 'assistant-message-bubble');
    }

    messageContainer.appendChild(messageElement);
    messagesDiv.appendChild(messageContainer);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  }

  // Audio playback queue
  function playNext() {
    if (audioQueue.length === 0) {
      isPlaying = false;
      currentSource = null;
      recordBtn.classList.remove('playing');
      return;
    }
    isPlaying = true;
    recordBtn.classList.add('playing');
    const buffer = audioQueue.shift();
    currentSource = audioContext.createBufferSource();
    currentSource.buffer = buffer;
    currentSource.connect(audioContext.destination);
    currentSource.onended = () => {
      currentSource.disconnect();
      currentSource = null;
      playNext();
    };
    currentSource.start();
  }

  // Example newTab / modal
  function newTab(url) {
    window.open(url, '_blank');
  }
  function injectModal(url, call_id = null) {
      // Close any existing modal
      const existingModal = document.querySelector('.custom-modal');
      if (existingModal) {
        document.body.removeChild(existingModal);
      }
    
      const modal = document.createElement('div');
      modal.classList.add('custom-modal');
      modal.style.position = 'fixed';
      modal.style.top = '0';
      modal.style.left = '0';
      modal.style.width = '100%';
      modal.style.height = '100%';
      modal.style.backgroundColor = 'rgba(0,0,0,0.5)';
      modal.style.display = 'flex';
      modal.style.justifyContent = 'center';
      modal.style.alignItems = 'center';
      modal.style.zIndex = '1000';
    
      const iframe = document.createElement('iframe');
      iframe.src = url;
      iframe.style.width = '90%';
      iframe.style.height = '90%';
      iframe.style.border = 'none';
      iframe.style.borderRadius = '10px';
      iframe.style.boxShadow = '0 0 10px rgba(0,0,0,0.25)';
    
      const closeButton = document.createElement('button');
      closeButton.innerHTML = '&times;';
      closeButton.style.position = 'absolute';
      closeButton.style.top = '10px';
      closeButton.style.right = '10px';
      closeButton.style.backgroundColor = 'transparent';
      closeButton.style.border = 'none';
      closeButton.style.fontSize = '30px';
      closeButton.style.color = 'white';
      closeButton.style.cursor = 'pointer';
    
      closeButton.onclick = () => document.body.removeChild(modal);
    
      // Listen for iframe load event
      iframe.addEventListener('load', () => {
        try {
          // Access the iframe content
          const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
    
          if (iframeDoc) {
            // Dispatch custom event with iframe content
            const event = new CustomEvent('iframe_content_complete', {
              detail: { outerHTML: iframeDoc.documentElement.outerHTML, call_id: call_id, url: url },
            });
            document.dispatchEvent(event);
          } else {
            alert('Unable to access iframe content.');
          }
        } catch (error) {
          alert('Error accessing iframe content: ' + error.message);
        }
      });
    
      modal.appendChild(iframe);
      modal.appendChild(closeButton);
      document.body.appendChild(modal);
    }

  // Stop playback
  function stopPlayback() {
    if (currentSource) {
      currentSource.onended = null;
      currentSource.stop();
      currentSource.disconnect();
      currentSource = null;
    }
    audioQueue = [];
    isPlaying = false;
    recordBtn.classList.remove('playing');
  }

  // Handle WS messages
  function handleWsMessage(event) {
    const message = JSON.parse(event.data);
    if (message.event === 'media' && message.media?.payload) {
      const base64Audio = message.media.payload;
      const binaryData = Uint8Array.from(atob(base64Audio), c => c.charCodeAt(0));
      const pcm16 = new Int16Array(binaryData.buffer);
      const audioBuffer = audioContext.createBuffer(1, pcm16.length, 24000);
      const channelData = audioBuffer.getChannelData(0);
      for (let i = 0; i < pcm16.length; i++) {
        channelData[i] = pcm16[i] / 32767;
      }
      audioQueue.push(audioBuffer);
      if (!isPlaying) playNext();
    } else if (message.event === 'user_function_call') {
      if (message.type === 'modal') injectModal(message.media.payload,message.call_id);
      else if (message.type === 'new_tab') newTab(message.media.payload);
      else if (message.type === 'close') {
          // wait for 5seconds and  create a custom event to close the websocket
          const event = new CustomEvent('websocket_close', { detail: ws });
          document.dispatchEvent(event);
          
      };
    } else if (message.event === 'text' && message.text) {
      displayMessage(message.text, false, false);
    } else if (message.event === 'image') {
      displayMessage(message.image, false, true);
    }
  }

  // Handle audio
  function handleAudioProcess(event) {
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    if (!isHoldingButton) return;
    const inputBuffer = event.inputBuffer.getChannelData(0);
    const pcm16 = new Int16Array(inputBuffer.length);
    for (let i = 0; i < inputBuffer.length; i++) {
      pcm16[i] = Math.max(-1, Math.min(1, inputBuffer[i])) * 32767;
    }
    const base64Audio = btoa(String.fromCharCode(...new Uint8Array(pcm16.buffer)));
    ws.send(JSON.stringify({ event: "media", media: { payload: base64Audio } }));
  }

  // Setup
  async function setup() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContext = new AudioContext({ sampleRate: 24000 });
      sourceNode = audioContext.createMediaStreamSource(stream);
      const BUFFER_SIZE = 4096;
      processorNode = audioContext.createScriptProcessor(BUFFER_SIZE, 1, 1);
      processorNode.onaudioprocess = handleAudioProcess;
      sourceNode.connect(processorNode);
      processorNode.connect(audioContext.destination);
      const cookieValue = document.cookie.split('; ')
        .find(row => row.startsWith('realtime-session-id'))?.split('=')[1];
      //get the domain of the current page
      const domain = window.location.hostname;
      ws = new WebSocket(`wss://${BASE_URL}/realtime/${domain}/ws?token=${cookieValue}`);
      ws.addEventListener('open', () => console.log('WebSocket connection established.'));
      ws.addEventListener('message', handleWsMessage);
      ws.addEventListener('error', err => console.error('WebSocket error:', err));
      document.addEventListener('iframe_content_complete', (event) => {
          // Check if the event detail contains the iframe element
          // Send the iframe content as a new websocket message with type html_content
          if (ws && ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ event: 'html_content', html_content: event.detail.outerHTML, call_id: event.detail.call_id, url: event.detail.url }));
          }
      });
      document.addEventListener('websocket_close', (event) => {
          // close the websocket
          ws.close();
      });
      isSetup = true;
      recordBtn.disabled = true;
    } catch (e) {
      console.error('Error accessing microphone or setting up audio:', e);
    }
  }

  // Cleanup
  function cleanup() {
    if (sourceNode) sourceNode.disconnect();
    if (processorNode) processorNode.disconnect();
    if (audioContext) audioContext.close();
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send('stop');
      ws.close();
    }
    audioQueue = [];
    isPlaying = false;
    currentSource = null;
    isSetup = false;
    document.removeEventListener('keydown', pttKeyDown);
    document.removeEventListener('keyup', pttKeyUp);
  }

  // Start/Stop button logic
  recordBtn.addEventListener('click', async function startStopHandler() {
    // Show the chat panel
    chatPanel.classList.remove('hidden');
    // Move the record button inside
    moveRecordButtonInsidePanel();

    // If not set up, do the "start" flow
    if (!isSetup) {
      await setup();
      if (isSetup) {
        recordBtn.textContent = "Press Space to talk";
        recordBtn.removeEventListener('click', startStopHandler);
        // make the record button rectangle
        recordBtn.style.width = "200px"; /* Rectangle button */
        recordBtn.style.height = "30px"; /* Rectangle button */
        recordBtn.style.borderRadius = "0"; /* Remove border radius */

        // Next click is "stop"
        recordBtn.addEventListener('click', function stopHandler() {
          cleanup();
          recordBtn.textContent = "Ask AI";
          recordBtn.style.backgroundColor = "#4E1E7B";
          chatPanel.classList.add('hidden');
          moveRecordButtonOutsidePanel();
          recordBtn.removeEventListener('click', stopHandler);
          recordBtn.addEventListener('click', startStopHandler);
        }, { once: true });

        // Push-to-talk
        document.addEventListener('keydown', pttKeyDown);
        document.addEventListener('keyup', pttKeyUp);
      }
    } else {
      // If already set up, user wants to stop
      cleanup();
      recordBtn.textContent = "Ask AI";
      recordBtn.style.backgroundColor = "#4E1E7B";
      chatPanel.classList.add('hidden');
    }
  });

  // Push-to-Talk
  function pttKeyDown(e) {
    if (e.code === 'Space') {
      e.preventDefault();
      if (isHoldingButton) return;
      if (isPlaying) {
        ws.send(JSON.stringify({ event: 'cancel' }));
        stopPlayback();
      }
      isHoldingButton = true;
      recordBtn.classList.add('active');
      console.log('PTT key down (Space). Recording...');
    }
  }

  function pttKeyUp(e) {
    if (e.code === 'Space') {
      e.preventDefault();
      isHoldingButton = false;
      recordBtn.classList.remove('active');
      console.log('PTT key up (Space). Stopped recording.');
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ event: 'commit' }));
      }
    }
  }

  // Show and enable record button after 2 seconds if mouse movement is detected
  let mouseMoved = false;
  document.addEventListener('mousemove', () => {
    mouseMoved = true;
  });

  setTimeout(() => {
    if (mouseMoved) {
      recordBtn.style.visibility = 'visible';
      recordBtn.style.pointerEvents = 'auto';
      recordBtn.disabled = false;
    }
  }, 2000);
});