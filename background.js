// background.js
console.log('Background script loading...');

function handleError(error) {
  console.error('Extension error:', error);
  if (chrome.runtime.lastError) {
    console.error('Chrome runtime error:', chrome.runtime.lastError);
  }
}

function setupContextMenu() {
  try {
    chrome.contextMenus.create({
      id: "extractContact",
      title: "Extract Contact Info",
      contexts: ["selection"]
    }, () => {
      if (chrome.runtime.lastError) {
        handleError(chrome.runtime.lastError);
      } else {
        console.log('Context menu created successfully');
      }
    });
  } catch (error) {
    handleError(error);
  }
}

// Create context menu on install
chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed/updated, setting up context menu...');
  try {
    chrome.contextMenus.removeAll(() => {
      if (chrome.runtime.lastError) {
        handleError(chrome.runtime.lastError);
      }
      setupContextMenu();
    });
  } catch (error) {
    handleError(error);
  }
});

// Helper function to extract JSON from text that might contain markdown
function extractJsonFromText(text) {
  try {
    // First attempt: try parsing the text directly
    return JSON.parse(text);
  } catch (e) {
    try {
      // Second attempt: try to find JSON between backticks
      const jsonMatch = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
      if (jsonMatch && jsonMatch[1]) {
        return JSON.parse(jsonMatch[1]);
      }
      
      // Third attempt: try to find anything between curly braces
      const curlyMatch = text.match(/\{[\s\S]*?\}/);
      if (curlyMatch) {
        return JSON.parse(curlyMatch[0]);
      }
      
      throw new Error('Could not parse JSON from response');
    } catch (e2) {
      throw new Error('Failed to parse contact information from response');
    }
  }
}

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  console.log('Context menu clicked:', info.menuItemId);
  if (info.menuItemId === "extractContact") {
    const selectedText = info.selectionText;
    console.log('Selected text:', selectedText);
    
    try {
      // Get settings from storage
      const { modelChoice, geminiKey, openrouterKey } = await chrome.storage.local.get([
        'modelChoice',
        'geminiKey',
        'openrouterKey'
      ]);

      if (!modelChoice) {
        console.error('Model not configured');
        await chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icons/icon128.png',
          title: 'Configuration Required',
          message: 'Please configure your preferred AI model in the extension options.'
        });
        chrome.runtime.openOptionsPage();
        return;
      }

      // Show processing notification
      const processingNotificationId = 'processing_' + Date.now();
      await chrome.notifications.create(processingNotificationId, {
        type: 'basic',
        iconUrl: 'icons/icon128.png',
        title: 'Processing',
        message: 'Please wait while the AI processes your text. This may take 15-20 seconds...',
        requireInteraction: true,
        priority: 2
      });

      const prompt = `You are a contact information extractor. Given the following text, extract information into a JSON object with these fields. Include a field only if information is found, otherwise use empty string. Format carefully and respond with ONLY the JSON object, no other text:
name, email, mobilePhone, landlinePhone, company, title, 
streetAddress, city, postcode, country,
linkedin, wechat, twitter, instagram, facebook.

Extract ALL phone numbers found in the text. For landlinePhone, use the first number with 'T:', 'Tel:', 'Phone:' prefix. For mobilePhone, include any of these:
1. Numbers with 'M:', 'Mobile:', 'Cell:' prefix
2. Additional phone numbers without T/Tel prefix
3. Extension numbers (e.g., "Ext: XXX") should be appended to their associated main number
4. Secondary office numbers (additional T: numbers) should be added to mobilePhone to let user decide

Split any full address into its components. For country, provide the full official country name (e.g., 'United States' not 'USA', 'United Kingdom' not 'UK'). Format social media as full URLs if possible.
Text to process: ${selectedText}`;

      let response;
      
      if (modelChoice === 'gemini') {
        if (!geminiKey) {
          console.error('Gemini API key not configured');
          await chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icons/icon128.png',
            title: 'Configuration Required',
            message: 'Please configure your Gemini API key in the extension options.'
          });
          chrome.runtime.openOptionsPage();
          return;
        }

        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`;
        console.log('Making Gemini API request...');
        
        response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          mode: 'cors',
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: prompt
              }]
            }]
          })
        });
      } else if (modelChoice === 'openrouter') {
        if (!openrouterKey) {
          console.error('OpenRouter API key not configured');
          await chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icons/icon128.png',
            title: 'Configuration Required',
            message: 'Please configure your OpenRouter API key in the extension options.'
          });
          chrome.runtime.openOptionsPage();
          return;
        }

        console.log('Making OpenRouter API request...');
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 30000); // 30 second timeout

        try {
          response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            signal: controller.signal,
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${openrouterKey}`,
              'HTTP-Referer': 'chrome-extension://contact-extractor',
              'X-Title': 'Contact Information Extractor'
            },
            body: JSON.stringify({
              model: 'deepseek/deepseek-r1-0528-qwen3-8b:free',
              messages: [
                {
                  role: 'user',
                  content: prompt
                }
              ]
            })
          });
        } finally {
          clearTimeout(timeout);
        }
      }

      let data;
      try {
        data = await response.json();
      } catch (error) {
        console.error('Error parsing response:', error);
        throw new Error('Failed to parse API response. Please try again.');
      }
      
      if (!response.ok) {
        console.error('API request failed:', response.status, response.statusText);
        console.error('Error response:', data);
        throw new Error(data.error?.message || `Failed to contact ${modelChoice === 'gemini' ? 'Gemini' : 'OpenRouter'} API: ${response.status} ${response.statusText}`);
      }
      console.log('API response:', data);

      let rawText;
      if (modelChoice === 'gemini') {
        if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
          throw new Error('Unexpected Gemini API response format');
        }
        rawText = data.candidates[0].content.parts[0].text;
      } else {
        if (!data.choices?.[0]?.message?.content) {
          throw new Error('Unexpected OpenRouter API response format');
        }
        rawText = data.choices[0].message.content;
      }
      console.log('Raw text from API:', rawText);
      
      const contactInfo = extractJsonFromText(rawText);
      console.log('Parsed contact info:', contactInfo);
      
      // Validate that we have at least some of the required fields
      if (!contactInfo || (typeof contactInfo !== 'object') || (!contactInfo.name && !contactInfo.email && !contactInfo.mobilePhone && !contactInfo.landlinePhone)) {
        throw new Error('Could not extract valid contact information from the text');
      }

      // Update notification to show completion
      await chrome.notifications.clear(processingNotificationId);
      // Then show success notification
      await chrome.notifications.create('success_' + Date.now(), {
        type: 'basic',
        iconUrl: 'icons/icon128.png',
        title: 'Success',
        message: 'Contact information extracted successfully!'
      });

      // Store the contact info temporarily
      await chrome.storage.local.set({ tempContact: contactInfo }, () => {
        if (chrome.runtime.lastError) {
          console.error('Error storing contact info:', chrome.runtime.lastError);
          throw new Error('Failed to store contact information');
        }
        
        console.log('Opening popup with contact info...');
        chrome.windows.create({
          url: 'popup.html',
          type: 'popup',
          width: 400,
          height: 600
        });
      });
    } catch (error) {
      console.error('Error:', error);
      // Clear processing notification if it exists
      if (processingNotificationId) {
        await chrome.notifications.clear(processingNotificationId);
      }
      // Show error notification
      await chrome.notifications.create('error_' + Date.now(), {
        type: 'basic',
        iconUrl: 'icons/icon128.png',
        title: 'Error',
        message: error.message
      });
    }
  }
});
