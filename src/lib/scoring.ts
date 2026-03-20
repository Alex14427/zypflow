// Intelligent lead scoring system
// Combines contact completeness, behavioral signals, and conversation analysis

interface LeadInput {
  name?: string;
  email?: string;
  phone?: string;
  service_interest?: string;
  urgency?: string;
  source?: string;
}

interface ConversationInput {
  messages?: { role: string; content: string }[];
}

export function scoreLead(lead: LeadInput, conversation?: ConversationInput): number {
  let score = 0;

  // Contact completeness (max 30)
  if (lead.name) score += 10;
  if (lead.email) score += 10;
  if (lead.phone) score += 10;

  // Service intent (max 20)
  if (lead.service_interest) score += 20;

  // Urgency signals (max 30)
  if (lead.urgency === 'high') score += 30;
  else if (lead.urgency === 'medium') score += 15;
  else if (lead.urgency === 'low') score += 5;

  // Source quality (max 10)
  if (lead.source === 'voice') score += 10;
  else if (lead.source === 'sms') score += 8;
  else if (lead.source === 'chat') score += 5;

  // Conversation engagement signals (max 10)
  if (conversation?.messages?.length) {
    const userMessages = conversation.messages.filter(m => m.role === 'user');
    const allContent = userMessages.map(m => m.content.toLowerCase()).join(' ');

    // Engagement depth — more messages = more interested
    if (userMessages.length >= 5) score += 5;
    else if (userMessages.length >= 3) score += 3;

    // Buying intent keywords
    const intentKeywords = ['book', 'appointment', 'schedule', 'available', 'price', 'cost', 'how much', 'when can', 'asap', 'urgent', 'soon', 'today', 'tomorrow', 'this week'];
    const intentMatches = intentKeywords.filter(k => allContent.includes(k)).length;
    if (intentMatches >= 3) score += 5;
    else if (intentMatches >= 1) score += 3;

    // Negative signals (reduce score)
    const negativeKeywords = ['just browsing', 'not sure', 'maybe later', 'too expensive', 'no thanks', 'not interested'];
    const negativeMatches = negativeKeywords.filter(k => allContent.includes(k)).length;
    if (negativeMatches > 0) score -= negativeMatches * 5;
  }

  return Math.max(0, Math.min(score, 100));
}

// Analyze conversation sentiment for dashboard display
export function analyzeConversationSentiment(messages: { role: string; content: string }[]): {
  sentiment: 'positive' | 'neutral' | 'negative';
  buyingIntent: 'high' | 'medium' | 'low';
  keyTopics: string[];
} {
  const userContent = messages
    .filter(m => m.role === 'user')
    .map(m => m.content.toLowerCase())
    .join(' ');

  // Sentiment analysis
  const positiveWords = ['great', 'perfect', 'excellent', 'love', 'thanks', 'amazing', 'wonderful', 'good', 'interested', 'excited', 'please'];
  const negativeWords = ['bad', 'terrible', 'expensive', 'cancel', 'refund', 'complaint', 'disappointed', 'worst', 'awful', 'problem'];

  const positiveCount = positiveWords.filter(w => userContent.includes(w)).length;
  const negativeCount = negativeWords.filter(w => userContent.includes(w)).length;

  let sentiment: 'positive' | 'neutral' | 'negative' = 'neutral';
  if (positiveCount > negativeCount + 1) sentiment = 'positive';
  else if (negativeCount > positiveCount) sentiment = 'negative';

  // Buying intent
  const highIntentWords = ['book', 'appointment', 'schedule', 'sign up', 'start', 'buy', 'purchase', 'asap', 'today', 'now'];
  const mediumIntentWords = ['price', 'cost', 'how much', 'available', 'options', 'when', 'consultation'];
  const highIntentCount = highIntentWords.filter(w => userContent.includes(w)).length;
  const mediumIntentCount = mediumIntentWords.filter(w => userContent.includes(w)).length;

  let buyingIntent: 'high' | 'medium' | 'low' = 'low';
  if (highIntentCount >= 2) buyingIntent = 'high';
  else if (highIntentCount >= 1 || mediumIntentCount >= 2) buyingIntent = 'medium';

  // Key topics extraction
  const topicPatterns = [
    { pattern: /\b(teeth|dental|clean|whitening|crown|filling|implant|braces)\b/gi, topic: 'Dental' },
    { pattern: /\b(botox|filler|skin|facial|treatment|laser|anti.?aging)\b/gi, topic: 'Aesthetics' },
    { pattern: /\b(pain|injury|physio|back|knee|shoulder|rehabilitation|exercise)\b/gi, topic: 'Physiotherapy' },
    { pattern: /\b(lawyer|legal|court|contract|dispute|claim|rights)\b/gi, topic: 'Legal' },
    { pattern: /\b(plumbing|heating|boiler|roof|garden|electrical|painting)\b/gi, topic: 'Home Services' },
    { pattern: /\b(price|cost|quote|estimate|free|discount|offer)\b/gi, topic: 'Pricing' },
    { pattern: /\b(urgent|emergency|asap|immediately|today)\b/gi, topic: 'Urgent' },
  ];

  const keyTopics = topicPatterns
    .filter(p => p.pattern.test(userContent))
    .map(p => p.topic)
    .slice(0, 3);

  return { sentiment, buyingIntent, keyTopics };
}
