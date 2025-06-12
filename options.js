// options.js
document.addEventListener('DOMContentLoaded', async () => {
  // Load saved settings
  const settings = await chrome.storage.local.get(['modelChoice', 'geminiKey', 'openrouterKey']);
  
  // Set model choice
  const modelChoice = document.getElementById('modelChoice');
  if (settings.modelChoice) {
    modelChoice.value = settings.modelChoice;
    toggleModelSections(settings.modelChoice);
  }

  // Set saved keys if they exist
  if (settings.geminiKey) {
    document.getElementById('geminiKey').value = settings.geminiKey;
  }
  if (settings.openrouterKey) {
    document.getElementById('openrouterKey').value = settings.openrouterKey;
  }

  // Toggle sections based on model choice
  modelChoice.addEventListener('change', (e) => {
    toggleModelSections(e.target.value);
  });

  // Toggle credentials visibility
  document.getElementById('showCredentials').addEventListener('click', () => {
    const geminiKey = document.getElementById('geminiKey');
    const openrouterKey = document.getElementById('openrouterKey');
    const newType = geminiKey.type === 'password' ? 'text' : 'password';
    geminiKey.type = newType;
    openrouterKey.type = newType;
  });

  // Handle form submission
  document.getElementById('settingsForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const modelChoice = document.getElementById('modelChoice').value;
    const geminiKey = document.getElementById('geminiKey').value.trim();
    const openrouterKey = document.getElementById('openrouterKey').value.trim();

    try {
      // Validate based on selected model
      if (modelChoice === 'gemini') {
        if (!geminiKey) {
          throw new Error('Please enter your Gemini API key');
        }

        // Test Gemini API key
        const testResponse = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{
                parts: [{ text: 'Test connection' }]
              }]
            })
          }
        );

        if (!testResponse.ok) {
          throw new Error('Invalid Gemini API key');
        }
      } else if (modelChoice === 'openrouter') {
        if (!openrouterKey) {
          throw new Error('Please enter your OpenRouter API key');
        }

        // Test OpenRouter API key
        try {
          const testResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${openrouterKey}`,
              'HTTP-Referer': 'chrome-extension://contact-extractor',
              'X-Title': 'Contact Information Extractor'
            },
            body: JSON.stringify({
              model: 'deepseek/deepseek-r1-0528-qwen3-8b:free',  // Use the specific Deepseek model
              messages: [
                {
                  role: 'user',
                  content: 'Say hi'
                }
              ],
              max_tokens: 10  // Limit response size for faster test
            })
          });

          const responseData = await testResponse.json();
          
          if (!testResponse.ok) {
            throw new Error(responseData.error?.message || 'Invalid OpenRouter API key');
          }
        } catch (error) {
          console.error('OpenRouter test error:', error);
          throw new Error(`OpenRouter API key test failed: ${error.message}`);
        }
      }

      // Save settings
      await chrome.storage.local.set({ 
        modelChoice,
        geminiKey: modelChoice === 'gemini' ? geminiKey : '',
        openrouterKey: modelChoice === 'openrouter' ? openrouterKey : ''
      });
      
      showStatus('Settings saved successfully!', true);
    } catch (error) {
      console.error('Error saving settings:', error);
      showStatus('Error: ' + error.message, false);
    }
  });
});

function toggleModelSections(modelChoice) {
  const geminiSection = document.getElementById('geminiSection');
  const openrouterSection = document.getElementById('openrouterSection');
  
  if (modelChoice === 'gemini') {
    geminiSection.style.display = 'block';
    openrouterSection.style.display = 'none';
    document.getElementById('geminiKey').required = true;
    document.getElementById('openrouterKey').required = false;
  } else {
    geminiSection.style.display = 'none';
    openrouterSection.style.display = 'block';
    document.getElementById('geminiKey').required = false;
    document.getElementById('openrouterKey').required = true;
  }
}

function showStatus(message, isSuccess) {
  const status = document.getElementById('status');
  status.textContent = message;
  status.style.display = 'block';
  status.className = 'status ' + (isSuccess ? 'success' : 'error');
  
  setTimeout(() => {
    status.style.display = 'none';
  }, 3000);
}
