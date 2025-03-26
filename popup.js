document.addEventListener('DOMContentLoaded', async () => {
  try {
    const { tempContact } = await chrome.storage.local.get(['tempContact']);
    if (tempContact) {
      Object.keys(tempContact).forEach(field => {
        const input = document.getElementById(field);
        if (input) {
          input.value = tempContact[field];
        }
      });
    }

    document.getElementById('downloadVcf').addEventListener('click', generateVcf);
    document.getElementById('saveToGoogle').addEventListener('click', saveToGoogleContacts);
  } catch (error) {
    console.error('Error:', error);
    showStatus(error.message, false);
  }
});

function generateVcf() {
  const contact = getFormData();
  if (!validateContact(contact)) {
    showStatus('Name is required', false);
    return;
  }

  const addressFields = [];
  if (contact.streetAddress) addressFields.push(contact.streetAddress);
  if (contact.city) addressFields.push(contact.city);
  if (contact.postcode) addressFields.push(contact.postcode);
  if (contact.country) addressFields.push(contact.country);
  const fullAddress = addressFields.join(', ');

  const vcf = `BEGIN:VCARD
VERSION:3.0
FN:${contact.name}
${contact.email ? `EMAIL:${contact.email}` : ''}
${contact.phone ? `TEL:${contact.phone}` : ''}
${contact.company ? `ORG:${contact.company}` : ''}
${contact.title ? `TITLE:${contact.title}` : ''}
${addressFields.length > 0 ? `ADR:;;${contact.streetAddress};${contact.city};${contact.postcode};${contact.country}` : ''}
${contact.linkedin ? `URL;type=LinkedIn:${contact.linkedin}` : ''}
${contact.twitter ? `URL;type=Twitter:${contact.twitter}` : ''}
${contact.wechat ? `X-WECHAT:${contact.wechat}` : ''}
END:VCARD`;

  const blob = new Blob([vcf], { type: 'text/vcard' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${contact.name}.vcf`;
  a.click();
  URL.revokeObjectURL(url);
  showStatus('VCF file downloaded!', true);
}

async function saveToGoogleContacts() {
  const contact = getFormData();
  if (!validateContact(contact)) {
    showStatus('Name is required', false);
    return;
  }
  
  try {
    const token = await new Promise((resolve, reject) => {
      chrome.identity.getAuthToken({ 
        interactive: true
      }, (token) => {
        if (chrome.runtime.lastError) {
          console.error('Chrome identity error:', chrome.runtime.lastError);
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        resolve(token);
      });
    });

    console.log('Got auth token, creating contact...');

    // Create contact using Google People API
    const response = await fetch('https://people.googleapis.com/v1/people:createContact', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        names: [{
          givenName: contact.name
        }],
        emailAddresses: contact.email ? [{
          value: contact.email
        }] : [],
        phoneNumbers: contact.phone ? [{
          value: contact.phone
        }] : [],
        organizations: contact.company ? [{
          name: contact.company,
          title: contact.title || ''
        }] : [],
        addresses: (contact.streetAddress || contact.city || contact.postcode || contact.country) ? [{
          streetAddress: contact.streetAddress || '',
          city: contact.city || '',
          postalCode: contact.postcode || '',
          country: contact.country || '',
          countryCode: contact.country || '',
          type: 'home',
          formattedValue: [
            contact.streetAddress,
            contact.city,
            contact.postcode,
            contact.country
          ].filter(Boolean).join(', ')
        }] : [],
        urls: [
          ...(contact.linkedin ? [{type: 'profile', value: contact.linkedin}] : []),
          ...(contact.twitter ? [{type: 'twitter', value: contact.twitter}] : [])
        ],
        userDefined: contact.wechat ? [{
          key: 'WeChat',
          value: contact.wechat
        }] : []
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Google Contacts API error:', errorData);
      throw new Error(`Failed to save contact: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    console.log('Contact created:', result);
    showStatus('Contact saved to Google Contacts!', true);
  } catch (error) {
    console.error('Error saving to Google Contacts:', error);
    showStatus('Failed to save contact: ' + error.message, false);
  }
}

function getFormData() {
  return {
    name: document.getElementById('name').value.trim(),
    email: document.getElementById('email').value.trim(),
    phone: document.getElementById('phone').value.trim(),
    company: document.getElementById('company').value.trim(),
    title: document.getElementById('title').value.trim(),
    streetAddress: document.getElementById('streetAddress').value.trim(),
    city: document.getElementById('city').value.trim(),
    postcode: document.getElementById('postcode').value.trim(),
    country: document.getElementById('country').value.trim(),
    linkedin: document.getElementById('linkedin').value.trim(),
    wechat: document.getElementById('wechat').value.trim(),
    twitter: document.getElementById('twitter').value.trim()
  };
}

function validateContact(contact) {
  return contact.name !== '';
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
