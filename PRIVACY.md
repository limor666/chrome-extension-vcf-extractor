# Privacy Policy

Last Updated: June 12, 2025

## Introduction

This Privacy Policy explains how the Contact Information Extractor Chrome Extension ("we", "our", or "the extension") handles user data. We are committed to protecting your privacy and complying with the General Data Protection Regulation (GDPR) and other applicable data protection laws.

## Data Collection and Processing

### Local Storage
- API keys (Google Gemini or OpenRouter) are stored locally in your browser using Chrome's storage API
- Extracted contact information is temporarily stored in local browser storage
- No data is transmitted to our servers

### Text Processing
- When you select text and use the extension's features, the selected text is processed to extract contact information
- Text processing is performed through third-party AI services (Google Gemini API or OpenRouter API)
- Only the specific text you select is sent to these services for processing

### Google Contacts Integration
- If you choose to save contacts to Google Contacts, the extension uses Google's OAuth 2.0 for authentication
- Contact information is sent directly to Google's servers using their official API
- We do not store or process your Google credentials

## Data Sharing and Third-Party Services

The extension integrates with the following third-party services:

1. Google Services
   - Gemini API for text processing (if selected)
   - Google Contacts API for saving contacts (optional)
   - Privacy policy: https://policies.google.com/privacy

2. OpenRouter
   - AI text processing service (if selected)
   - Privacy policy: https://openrouter.ai/privacy

## Legal Basis for Processing

Under GDPR Article 6, we process data based on:
- Your consent when you choose to use the extension
- The necessity to perform the contract (providing contact information extraction services)
- Legitimate interests in providing and improving the extension's functionality

## Data Security

We implement appropriate security measures including:
- Storing API keys only in local browser storage
- Using HTTPS for all API communications
- No collection or storage of personal data on external servers

## Your Rights Under GDPR

You have the right to:
- Access your personal data
- Rectify inaccurate personal data
- Erase your personal data ("right to be forgotten")
- Restrict processing
- Data portability
- Object to processing
- Withdraw consent

## Contact Information

For any privacy-related concerns or to exercise your GDPR rights, please:
1. Open an issue on our GitHub repository: https://github.com/limor666/chrome-extension-vcf-extractor/issues
2. Label the issue as "Privacy"
3. Describe your concern or request

We will respond to all legitimate requests within 30 days.

## Changes to This Privacy Policy

We may update this Privacy Policy from time to time. We will notify users of any material changes through the Chrome extension or our GitHub repository. Your continued use of the extension after such modifications constitutes your acknowledgment of the modified Privacy Policy.

## Data Protection Authority

If you are in the EU and believe we have not adequately addressed your privacy concerns, you have the right to lodge a complaint with your local Data Protection Authority.
