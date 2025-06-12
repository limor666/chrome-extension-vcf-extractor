# Contact Information Extractor Chrome Extension

This extension extracts contact information from selected text using either Google's Gemini AI or OpenRouter's free Deepseek AI model, and allows saving to VCF files or Google Contacts.

## Features

- Extract contact details from any selected text
- Parse structured address components (street, city, postal code, country)
- Detect social media profiles (LinkedIn, WeChat, X/Twitter)
- Save as VCF file
- Save directly to Google Contacts
- Custom icon in toolbar and context menu

## Setup

1. Choose your AI model and get API key:

   Option A - Google Gemini (free tier, no credit card):
   - Go to https://console.cloud.google.com , type in the search box "create project" and select the resulting link
   - Give it a name such as "chrome-extension-vcf-extractor"
   - Go to APIs and Services panel and press "Create Credentials" and edit this new credentials item
   - Set Application Restrictions to None and Restrict Key to "Generative Language API" and Save
   - The credentials page will show the newly created one
   - Press Show Key and copy the key

   Option B - OpenRouter (free tier, no credit card, slower responses):
   - Visit https://openrouter.ai/keys
   - Sign in with Google to create account
   - Click "+ Create Key" and give it a name
   - Copy your API key

2. Configure the extension:
   - Click the extension icon in Chrome toolbar
   - Select "Options"
   - Choose your preferred model (Gemini or OpenRouter)
   - Paste your API key
   - Click Save
   - Settings will be saved in your Chrome storage

## Usage

1. Select text containing contact information
2. Right-click and choose "Extract Contact Info"
3. Review and edit the extracted information
4. Choose to:
   - Download as VCF file
   - Save to Google Contacts (requires Google account sign-in)

## Contact Fields Supported

Basic Information:
- Name
- Email
- Phone
- Company
- Title

Address (structured):
- Street Address
- City
- Postal Code
- Country

Social Media:
- LinkedIn
- WeChat
- X/Twitter

## Permissions

The extension requires:
- Access to selected text for contact extraction
- API access (Gemini or OpenRouter) for AI processing
- Google Contacts API for saving contacts (optional)

## Privacy

For detailed information about how we handle your data, please read our [Privacy Policy](https://github.com/limor666/chrome-extension-vcf-extractor/blob/main/PRIVACY.md). Key points:

- Your API keys (Gemini or OpenRouter) are stored locally in Chrome
- Google Contacts integration uses standard OAuth2 authentication
- No data is stored on external servers
- GDPR compliant
- Privacy concerns can be reported via GitHub Issues
