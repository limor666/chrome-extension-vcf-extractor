// options.js
document.addEventListener('DOMContentLoaded', () => {
  // Load saved Gemini API key
  chrome.storage.local.get(['geminiKey'], (result) => {
    if (result.geminiKey) {
      document.getElementById('geminiKey').value = result.geminiKey;
    }
  });

  // Toggle credentials visibility
  document.getElementById('showCredentials').addEventListener('click', () => {
    const geminiKey = document.getElementById('geminiKey');
    geminiKey.type = geminiKey.type === 'password' ? 'text' : 'password';
  });

  document.getElementById('settingsForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const geminiKey = document.getElementById('geminiKey').value.trim();
    
    // Validate input
    if (!geminiKey) {
      showStatus('Please enter your Gemini API key', false);
      return;
    }

    try {
      // Test Gemini API key
      const testResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: 'Test connection'
            }]
          }]
        })
      });

      if (!testResponse.ok) {
        throw new Error('Invalid Gemini API key');
      }

      // Save to Chrome storage
      await chrome.storage.local.set({ geminiKey });
      showStatus('Settings saved successfully!', true);
    } catch (error) {
      console.error('Error testing API key:', error);
      showStatus('Error: ' + error.message, false);
    }
  });
});

function showStatus(message, isSuccess) {
  const status = document.getElementById('status');
  status.textContent = message;
  status.style.display = 'block';
  status.className = 'status ' + (isSuccess ? 'success' : 'error');
  
  setTimeout(() => {
    status.style.display = 'none';
  }, 3000);
}
