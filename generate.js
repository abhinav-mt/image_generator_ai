import './style.css';

const promptInput = document.getElementById('prompt-input');
const generateBtn = document.getElementById('generate-btn');
const imageArea = document.querySelector('.image-area');
const loader = document.getElementById('loader');
const generatedImage = document.getElementById('generated-image');
const downloadBtn = document.getElementById('download-btn');
const historyGrid = document.getElementById('history-grid');

let currentBlobUrl = null;
const MAX_HISTORY = 10;

// Load history from local storage
function loadHistory() {
    const history = JSON.parse(localStorage.getItem('nicotech_history')) || [];
    historyGrid.innerHTML = '';

    if (history.length === 0) {
        historyGrid.innerHTML = '<p style="grid-column: 1 / -1; color: var(--text-muted); font-size: 0.9rem;">No recent images generated.</p>';
        return;
    }

    history.forEach((item) => {
        const wrapper = document.createElement('div');
        wrapper.className = 'history-item';

        const img = document.createElement('img');
        img.src = item.url;
        img.alt = item.prompt;
        img.title = item.prompt;

        // Allow clicking history to view or download it easily
        img.addEventListener('click', () => {
            if (currentBlobUrl && !history.find(h => h.url === currentBlobUrl)) {
                // We aren't revoking memory here if it's from history, but standard usage requires care.
                // For simplicity in this local version, we'll just display it.
            }
            currentBlobUrl = item.url;
            generatedImage.src = item.url;
            generatedImage.style.display = 'block';
            downloadBtn.style.display = 'flex';
            promptInput.value = item.prompt; // Show what prompted it
        });

        wrapper.appendChild(img);
        historyGrid.appendChild(wrapper);
    });
}

function addToHistory(url, prompt) {
    let history = JSON.parse(localStorage.getItem('nicotech_history')) || [];

    // Add to beginning
    history.unshift({ url, prompt, timestamp: Date.now() });

    // Keep only last 10
    if (history.length > MAX_HISTORY) {
        // Optional: URL.revokeObjectURL for the dropped items to free memory locally
        history = history.slice(0, MAX_HISTORY);
    }

    localStorage.setItem('nicotech_history', JSON.stringify(history));
    loadHistory();
}

// Initial load
loadHistory();

// Handle image generation
generateBtn.addEventListener('click', async () => {
    const prompt = promptInput.value.trim();
    if (!prompt) {
        alert('Please enter a prompt first.');
        return;
    }

    // Update UI state for loading
    generateBtn.disabled = true;
    generateBtn.innerHTML = '<span>Generating...</span>';
    loader.style.display = 'block';
    generatedImage.style.display = 'none';
    downloadBtn.style.display = 'none';

    try {
        const token = import.meta.env.VITE_HF_TOKEN;
        if (!token) {
            throw new Error("Missing Hugging Face API Token. Check your .env file.");
        }

        const response = await fetch(
            "/api/hf/models/black-forest-labs/FLUX.1-schnell",
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                    "x-use-cache": "false"
                },
                method: "POST",
                body: JSON.stringify({ inputs: prompt }),
            }
        );

        if (!response.ok) {
            if (response.status === 503) {
                throw new Error("Model is currently loading on Hugging Face. Please try again in 10 seconds.");
            }
            const errText = await response.text();
            throw new Error(`API error (${response.status}): ${errText}`);
        }

        const blob = await response.blob();

        // Revoke previous blob URL to avoid memory leaks if it's not in history
        // (In a full prod app we'd track references, but for this demo createObjectURL is fine)
        currentBlobUrl = URL.createObjectURL(blob);

        // Display generated image
        generatedImage.src = currentBlobUrl;
        generatedImage.style.display = 'block';
        downloadBtn.style.display = 'flex';

        // Save to history
        addToHistory(currentBlobUrl, prompt);

    } catch (error) {
        console.error("Error generating image:", error);
        alert(`Failed to generate image: ${error.message}`);
    } finally {
        // Revert UI state
        generateBtn.disabled = false;
        generateBtn.innerHTML = '<span>Generate</span>';
        loader.style.display = 'none';
    }
});

// Handle image download
downloadBtn.addEventListener('click', () => {
    if (currentBlobUrl) {
        const a = document.createElement('a');
        a.href = currentBlobUrl;
        a.download = `nicotech-ai-${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }
});
