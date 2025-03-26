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
      // Get API key from storage
      const { geminiKey } = await chrome.storage.local.get(['geminiKey']);
      
      if (!geminiKey) {
        console.error('Gemini API key not configured');
        alert('Please configure your Gemini API key in the extension options.');
        chrome.runtime.openOptionsPage();
        return;
      }

      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`;
      console.log('Making API request...');
      
      const requestBody = {
        contents: [{
          parts: [{
            text: `Extract only the following fields from this text and respond with ONLY a JSON object containing these fields (no other text or formatting):
name, email, phone, company, title, 
streetAddress, city, postcode, country,
linkedin, wechat, twitter.

Split any full address into its components. For country, provide the full official country name (e.g., 'United States' not 'USA', 'United Kingdom' not 'UK'). Format social media as full URLs if possible.
Text to process: ${selectedText}`
          }]
        }]
      };

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        mode: 'cors',
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        console.error('API request failed:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`Failed to contact Gemini API: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('API response:', data);
      
      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts || !data.candidates[0].content.parts[0].text) {
        throw new Error('Unexpected API response format');
      }

      const rawText = data.candidates[0].content.parts[0].text;
      console.log('Raw text from API:', rawText);
      
      const contactInfo = extractJsonFromText(rawText);
      console.log('Parsed contact info:', contactInfo);
      
      // Validate that we have at least some of the required fields
      if (!contactInfo || (typeof contactInfo !== 'object') || (!contactInfo.name && !contactInfo.email && !contactInfo.phone)) {
        throw new Error('Could not extract valid contact information from the text');
      }

      // Store the contact info temporarily
      chrome.storage.local.set({ tempContact: contactInfo }, () => {
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
      alert(error.message);
    }
  }
});
