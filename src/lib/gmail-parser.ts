import { Subscription } from './supabase';

// More specific keywords that indicate subscription-related emails
const SUBSCRIPTION_KEYWORDS = [
  'your subscription',
  'subscription confirmation',
  'subscription receipt',
  'payment receipt',
  'monthly charge',
  'recurring payment',
  'billing receipt',
  'auto-renewal',
  'subscription renewed',
  'payment confirmation'
];

// Common subscription services to look for with more precise patterns
const COMMON_SERVICES = [
  { name: 'Netflix', domain: 'netflix.com', pattern: /netflix\s+subscription|netflix\s+billing|netflix\s+payment/i },
  { name: 'Spotify', domain: 'spotify.com', pattern: /spotify\s+premium|spotify\s+subscription|spotify\s+billing/i },
  { name: 'Amazon Prime', domain: 'amazon.com', pattern: /prime\s+membership|amazon\s+prime\s+renewal|prime\s+video\s+subscription/i },
  { name: 'Disney+', domain: 'disney.com', pattern: /disney\+\s+subscription|disney\s+plus\s+billing/i },
  { name: 'YouTube Premium', domain: 'youtube.com', pattern: /youtube\s+premium\s+subscription|youtube\s+music\s+subscription/i },
  { name: 'Apple Music', domain: 'apple.com', pattern: /apple\s+music\s+subscription|apple\s+music\s+billing/i },
  { name: 'HBO Max', domain: 'hbo.com', pattern: /hbo\s+max\s+subscription|hbo\s+now\s+billing/i },
  { name: 'Hulu', domain: 'hulu.com', pattern: /hulu\s+subscription|hulu\s+billing|hulu\s+plus/i },
  { name: 'Adobe', domain: 'adobe.com', pattern: /adobe\s+creative\s+cloud\s+subscription|adobe\s+subscription/i },
  { name: 'Microsoft', domain: 'microsoft.com', pattern: /microsoft\s+365\s+subscription|office\s+365\s+subscription|xbox\s+game\s+pass/i }
];

// More accurate amount extraction with currency validation
function extractAmount(text: string): number | null {
  // Look for patterns like "$9.99" or "9.99 USD" in the context of billing/payment
  const paymentContextRegex = /(?:payment|charge|bill|subscription|price|cost|fee|paid|amount|total)[^\$\d]*((?:\$|€|£|₹)?\s?\d+(?:\.\d{1,2})?\s?(?:USD|EUR|GBP|INR)?)/i;
  const match = text.match(paymentContextRegex);
  
  if (match && match[1]) {
    // Extract just the numbers
    const amountMatch = match[1].match(/\d+(?:\.\d{1,2})?/);
    if (amountMatch) {
      const amount = parseFloat(amountMatch[0]);
      // Validate reasonable subscription amount (between $0.99 and $500)
      if (amount >= 0.99 && amount <= 500) {
        return amount;
      }
    }
  }
  
  return null;
}

// More accurate date extraction with validation
function extractDate(text: string): string | null {
  // First look for "next billing date" or "renewal date" context
  const dateContextRegex = /(?:next\s+billing|renewal|payment|due)\s+date\s*(?:is|:|\son)?[:\s]*([A-Za-z]+\s+\d{1,2}(?:st|nd|rd|th)?,?\s+\d{4}|\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i;
  const contextMatch = text.match(dateContextRegex);
  
  if (contextMatch && contextMatch[1]) {
    // Try to parse the date
    const dateText = contextMatch[1];
    let date: Date | null = null;
    
    // Try different formats
    if (/\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}/.test(dateText)) {
      // Format: MM/DD/YYYY or DD/MM/YYYY
      const dateRegex = /(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/;
      const match = dateText.match(dateRegex);
      
      if (match) {
        // Assume MM/DD/YYYY format is more common in emails
        const [, first, second, yearPart] = match;
        const year = yearPart.length === 2 ? `20${yearPart}` : yearPart;
        // Try both MM/DD and DD/MM interpretations and keep the one that's valid
        const mmddDate = new Date(`${first}/${second}/${year}`);
        const ddmmDate = new Date(`${second}/${first}/${year}`);
        
        if (!isNaN(mmddDate.getTime())) {
          date = mmddDate;
        } else if (!isNaN(ddmmDate.getTime())) {
          date = ddmmDate;
        }
      }
    } else {
      // Format: Month Day, Year (e.g., "April 15, 2023")
      date = new Date(dateText);
    }
    
    if (date && !isNaN(date.getTime())) {
      // Validate the date is in a reasonable range (not more than 2 years in the future)
      const now = new Date();
      const twoYearsFromNow = new Date();
      twoYearsFromNow.setFullYear(now.getFullYear() + 2);
      
      if (date >= now && date <= twoYearsFromNow) {
        return date.toISOString().split('T')[0]; // YYYY-MM-DD format
      }
    }
  }
  
  // Fallback to just looking for any date-like patterns, with validation
  const dateRegex = /(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/;
  const match = text.match(dateRegex);
  
  if (match) {
    try {
      const [, first, second, yearPart] = match;
      const year = yearPart.length === 2 ? `20${yearPart}` : yearPart;
      
      // Try different date formats
      let date: Date | null = null;
      const formats = [
        `${first}/${second}/${year}`, // MM/DD/YYYY
        `${second}/${first}/${year}`, // DD/MM/YYYY
      ];
      
      for (const format of formats) {
        const testDate = new Date(format);
        if (!isNaN(testDate.getTime())) {
          date = testDate;
          break;
        }
      }
      
      if (date) {
        // Validate the date is reasonable
        const now = new Date();
        const twoYearsFromNow = new Date();
        twoYearsFromNow.setFullYear(now.getFullYear() + 2);
        
        if (date >= now && date <= twoYearsFromNow) {
          return date.toISOString().split('T')[0];
        }
      }
    } catch (e) {
      // If date parsing fails, return null
      return null;
    }
  }
  
  return null;
}

// More accurate service name extraction with validation
function extractService(text: string, from: string, subject: string): string | null {
  // Check from email header first (most reliable source)
  const fromDomain = from.includes('@') ? from.split('@')[1].toLowerCase() : '';
  
  // Match against known services first
  for (const service of COMMON_SERVICES) {
    // Check domain match
    if (fromDomain && fromDomain.includes(service.domain)) {
      return service.name;
    }
    
    // Check for service pattern in subject line (more reliable than body)
    if (service.pattern.test(subject)) {
      return service.name;
    }
    
    // Check in full text as fallback
    if (service.pattern.test(text)) {
      return service.name;
    }
  }
  
  // Extract from "your subscription to [service]" pattern
  const subscriptionToPattern = /(?:your\s+subscription\s+to|subscribed\s+to|membership\s+with|billing\s+for)\s+([A-Za-z0-9\s]+?)(?:was|has|will|is)/i;
  const subscriptionMatch = text.match(subscriptionToPattern);
  if (subscriptionMatch && subscriptionMatch[1]) {
    const serviceName = subscriptionMatch[1].trim();
    // Validate service name (min 3 chars, no generic terms)
    if (serviceName.length >= 3 && !['service', 'subscription', 'platform', 'website'].includes(serviceName.toLowerCase())) {
      return serviceName;
    }
  }
  
  // Only extract from sender domain as last resort, and apply stricter validation
  if (fromDomain && !['gmail.com', 'outlook.com', 'hotmail.com', 'yahoo.com', 'mail.com', 'aol.com'].includes(fromDomain)) {
    // Extract first part of domain
    const domainParts = fromDomain.split('.');
    if (domainParts[0] && domainParts[0].length >= 3) {
      // Capitalize first letter
      const serviceName = domainParts[0].charAt(0).toUpperCase() + domainParts[0].slice(1);
      
      // Exclude common generic sender names
      const excludedSenders = ['noreply', 'donotreply', 'newsletter', 'info', 'contact', 'support', 'hello', 'admin', 'team', 'billing'];
      if (!excludedSenders.includes(domainParts[0].toLowerCase())) {
        return serviceName;
      }
    }
  }
  
  return null;
}

// More accurate billing cycle detection
function extractBillingCycle(text: string): 'monthly' | 'yearly' | 'quarterly' | 'weekly' {
  const lowerText = text.toLowerCase();
  
  // Look for explicit billing cycle mentions
  if (/annual\s+subscription|yearly\s+subscription|billed\s+yearly|billed\s+annually|12\s+month|per\s+year|\/year|subscription\s+renews\s+yearly/i.test(lowerText)) {
    return 'yearly';
  } else if (/quarterly\s+subscription|billed\s+quarterly|3\s+month|every\s+3\s+months|per\s+quarter|\/quarter/i.test(lowerText)) {
    return 'quarterly';
  } else if (/weekly\s+subscription|billed\s+weekly|per\s+week|\/week|subscription\s+renews\s+weekly/i.test(lowerText)) {
    return 'weekly';
  } else if (/monthly\s+subscription|billed\s+monthly|per\s+month|\/month|subscription\s+renews\s+monthly/i.test(lowerText)) {
    return 'monthly';
  }
  
  // Try to infer from the context
  if (lowerText.includes('year') || lowerText.includes('annual') || lowerText.includes('12 month') || lowerText.includes('12-month')) {
    return 'yearly';
  } else if (lowerText.includes('quarter') || lowerText.includes('3 month') || lowerText.includes('3-month')) {
    return 'quarterly';
  } else if (lowerText.includes('week') || lowerText.includes('7 day') || lowerText.includes('7-day')) {
    return 'weekly';
  } else {
    // Default to monthly as it's most common
    return 'monthly';
  }
}

// Evaluate subscription confidence score (0-10)
function calculateConfidenceScore(
  serviceName: string | null, 
  amount: number | null, 
  nextDueDate: string | null, 
  billingCycle: string,
  fromDomain: string,
  subject: string,
  fullText: string
): number {
  let score = 0;
  
  // Service name factors
  if (serviceName) {
    score += 2; // Base points for having a service name
    
    // Check if service name is from our verified list
    if (COMMON_SERVICES.some(s => s.name === serviceName)) {
      score += 2;
    }
  }
  
  // Amount factors
  if (amount !== null) {
    score += 2; // Base points for having an amount
    
    // Additional point for reasonable subscription amount
    if (amount >= 1 && amount <= 100) {
      score += 1;
    }
  }
  
  // Due date factors
  if (nextDueDate) {
    score += 2; // Base points for having a next due date
  }
  
  // Context validation
  const lowerSubject = subject.toLowerCase();
  const lowerText = fullText.toLowerCase();
  
  // Strong subscription indicators in subject
  if (/subscription|receipt|invoice|payment|billing|renewal|charged/i.test(lowerSubject)) {
    score += 1;
  }
  
  // Strong subscription phrases in text
  if (/your\s+subscription\s+to|subscribed\s+to|thank\s+you\s+for\s+your\s+subscription|thank\s+you\s+for\s+your\s+payment|payment\s+receipt|subscription\s+confirmation|billing\s+receipt|invoice\s+for\s+your\s+subscription/i.test(lowerText)) {
    score += 2;
  }
  
  // Domain validation (emails from service domains are more reliable)
  if (fromDomain && 
      !['gmail.com', 'outlook.com', 'hotmail.com', 'yahoo.com', 'mail.com', 'aol.com'].includes(fromDomain) &&
      COMMON_SERVICES.some(s => fromDomain.includes(s.domain))) {
    score += 1;
  }
  
  return Math.min(score, 10); // Cap at 10
}

// Main function to scan Gmail for subscriptions
export async function scanSubscriptionsFromGmail(accessToken: string): Promise<Partial<Subscription>[]> {
  try {
    // Create search query for subscription-related emails
    const searchQuery = SUBSCRIPTION_KEYWORDS.map(keyword => `"${keyword}"`).join(' OR ');
    
    console.log('Searching Gmail with query:', searchQuery);
    
    // Fetch messages matching our search query
    const messagesResponse = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(searchQuery)}&maxResults=50`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );
    
    if (!messagesResponse.ok) {
      // Log detailed error information for debugging
      const errorText = await messagesResponse.text().catch(() => 'Unable to get error text');
      console.error('Gmail API Error Status:', messagesResponse.status);
      console.error('Gmail API Error Text:', errorText);
      
      // Different error handling based on status code
      if (messagesResponse.status === 401) {
        throw new Error('Authentication error: Please sign out and sign in again to refresh your Google access token.');
      } else if (messagesResponse.status === 403) {
        throw new Error('Permission denied: You may need to grant additional permissions to access your Gmail.');
      } else if (messagesResponse.status === 404) {
        throw new Error('API endpoint not found. Please check the API URL.');
      } else {
        throw new Error(`Gmail API error (${messagesResponse.status}): ${messagesResponse.statusText || 'Unknown error'}`);
      }
    }
    
    const messagesData = await messagesResponse.json();
    
    console.log('Gmail API returned data:', messagesData);
    
    if (!messagesData.messages || messagesData.messages.length === 0) {
      console.log('No messages found matching the search criteria');
      return [];
    }
    
    console.log(`Found ${messagesData.messages.length} potential subscription emails`);
    
    // Process each message to extract subscription details
    const subscriptions: (Partial<Subscription> & { confidence: number })[] = [];
    
    for (const message of messagesData.messages) {
      try {
        // Fetch full message details
        const messageResponse = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${message.id}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
          }
        );
        
        if (!messageResponse.ok) {
          console.error(`Error fetching message ${message.id}:`, messageResponse.status, messageResponse.statusText);
          continue;
        }
        
        const messageData = await messageResponse.json();
        
        // Extract headers and content
        const headers = messageData.payload.headers;
        const from = headers.find((h: { name: string; value: string }) => h.name === 'From')?.value || '';
        const subject = headers.find((h: { name: string; value: string }) => h.name === 'Subject')?.value || '';
        const fromDomain = from.includes('@') ? from.split('@')[1].toLowerCase() : '';
        
        console.log(`Processing email: "${subject}" from ${from}`);
        
        // Get message body
        let body = '';
        if (messageData.payload.parts && messageData.payload.parts.length > 0) {
          // Find the text/plain part
          const textPart = messageData.payload.parts.find((part: { mimeType: string; body?: { data: string } }) => part.mimeType === 'text/plain');
          if (textPart && textPart.body && textPart.body.data) {
            // Decode from base64
            body = atob(textPart.body.data.replace(/-/g, '+').replace(/_/g, '/'));
          }
        } else if (messageData.payload.body && messageData.payload.body.data) {
          // Decode from base64
          body = atob(messageData.payload.body.data.replace(/-/g, '+').replace(/_/g, '/'));
        }
        
        // Combine subject and body for processing
        const fullText = `${subject} ${body}`;
        
        // Extract subscription data
        const serviceName = extractService(fullText, from, subject);
        const amount = extractAmount(fullText);
        const nextDueDate = extractDate(fullText);
        const billingCycle = extractBillingCycle(fullText);
        
        // Calculate confidence score
        const confidence = calculateConfidenceScore(
          serviceName, 
          amount, 
          nextDueDate, 
          billingCycle, 
          fromDomain,
          subject,
          fullText
        );
        
        // Only add if we have at least a service name and a reasonable confidence score
        if (serviceName && confidence >= 5) {
          console.log(`Detected subscription: ${serviceName}, Amount: ${amount}, Cycle: ${billingCycle}, Confidence: ${confidence}/10`);
          
          // Use today's date + 30 days as fallback if no next due date found
          const today = new Date();
          const fallbackDate = new Date(today);
          fallbackDate.setDate(today.getDate() + 30);
          
          subscriptions.push({
            service_name: serviceName,
            amount: amount || 0,
            next_due_date: nextDueDate || fallbackDate.toISOString().split('T')[0],
            billing_cycle: billingCycle,
            auto_detected: true,
            confidence
          });
        } else if (serviceName) {
          console.log(`Low confidence subscription skipped: ${serviceName}, Confidence: ${confidence}/10`);
        }
      } catch (messageError) {
        // Continue processing other messages even if one fails
        console.error('Error processing message:', messageError);
        continue;
      }
    }
    
    // Sort by confidence (highest first) then remove duplicates
    const sortedSubscriptions = subscriptions.sort((a, b) => b.confidence - a.confidence);
    
    // Remove duplicates, keeping the highest confidence entry for each service
    const uniqueServiceNames = new Set<string>();
    const uniqueSubscriptions = sortedSubscriptions.filter(sub => {
      if (sub.service_name && !uniqueServiceNames.has(sub.service_name)) {
        uniqueServiceNames.add(sub.service_name);
        return true;
      }
      return false;
    });
    
    // Remove confidence property before returning
    const finalSubscriptions = uniqueSubscriptions.map(({ confidence, ...rest }) => rest);
    
    console.log(`Found ${finalSubscriptions.length} unique valid subscriptions`);
    return finalSubscriptions;
  } catch (error) {
    console.error('Error scanning Gmail for subscriptions:', error);
    // Re-throw the error so it's properly handled by the component
    throw error;
  }
} 