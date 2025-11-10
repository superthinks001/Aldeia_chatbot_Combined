/**
 * Interest-Based Suggestions Service
 *
 * Analyzes user browse patterns and conversation history to provide
 * personalized content recommendations (Sprint 3)
 */

export interface Suggestion {
  id: string;
  type: 'topic' | 'document' | 'resource' | 'action';
  title: string;
  description: string;
  relevanceScore: number; // 0-1
  category: string;
  url?: string;
  icon?: string;
  estimatedTime?: string; // e.g., "5 min read"
  priority: 'low' | 'medium' | 'high';
}

export interface UserInterestProfile {
  topics: { [topic: string]: number }; // topic -> interest score (0-1)
  locations: string[];
  documentTypes: string[];
  recentIntents: string[];
  sessionDuration?: number;
  pageViews?: number;
}

/**
 * Analyze user conversation history to build interest profile
 */
export function analyzeUserInterests(data: {
  conversationHistory?: any[];
  pageContext?: any;
  userProfile?: any;
}): UserInterestProfile {
  const profile: UserInterestProfile = {
    topics: {},
    locations: [],
    documentTypes: [],
    recentIntents: []
  };

  // Analyze conversation history
  if (data.conversationHistory && data.conversationHistory.length > 0) {
    const userMessages = data.conversationHistory.filter((msg: any) => msg.sender === 'user');

    // Extract topics from messages
    const topicPatterns = {
      'debris-removal': /(debris|removal|cleanup|hazardous|waste|ash)/i,
      'insurance': /(insurance|claim|policy|coverage|payout)/i,
      'permits': /(permit|building|construction|zoning|approval)/i,
      'rebuilding': /(rebuild|reconstruct|contractor|architecture|design)/i,
      'financial-assistance': /(financial|aid|grant|fema|assistance|fund|loan)/i,
      'housing': /(housing|shelter|temporary|rental|displacement|accommodation)/i,
      'health-services': /(health|medical|mental|counseling|therapy|stress)/i,
      'legal': /(legal|law|attorney|court|liability|lawsuit)/i,
      'utilities': /(utility|power|water|gas|electric|sewer)/i,
      'inspection': /(inspection|assess|damage|evaluate|survey)/i
    };

    for (const msg of userMessages) {
      const text = msg.text?.toLowerCase() || '';

      // Score topics
      for (const [topic, pattern] of Object.entries(topicPatterns)) {
        if (pattern.test(text)) {
          profile.topics[topic] = (profile.topics[topic] || 0) + 0.2;
        }
      }

      // Extract intents
      if (msg.intent && !profile.recentIntents.includes(msg.intent)) {
        profile.recentIntents.push(msg.intent);
      }
    }

    // Normalize topic scores to 0-1
    const maxScore = Math.max(...Object.values(profile.topics), 1);
    for (const topic in profile.topics) {
      profile.topics[topic] = Math.min(1, profile.topics[topic] / maxScore);
    }
  }

  // Extract location from page context
  if (data.pageContext?.location) {
    const location = data.pageContext.location;
    if (location.city) profile.locations.push(location.city);
    if (location.county) profile.locations.push(location.county);
  }

  // Extract user profile data
  if (data.userProfile?.county) {
    if (!profile.locations.includes(data.userProfile.county)) {
      profile.locations.push(data.userProfile.county);
    }
  }

  return profile;
}

/**
 * Generate personalized suggestions based on interest profile
 */
export function generateSuggestions(profile: UserInterestProfile): Suggestion[] {
  const suggestions: Suggestion[] = [];

  // Topic-based suggestions
  const topTopics = Object.entries(profile.topics)
    .filter(([_, score]) => score > 0.3)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  for (const [topic, score] of topTopics) {
    const topicSuggestions = getTopicSuggestions(topic, score);
    suggestions.push(...topicSuggestions);
  }

  // Location-based suggestions
  for (const location of profile.locations.slice(0, 2)) {
    const locationSuggestions = getLocationSuggestions(location);
    suggestions.push(...locationSuggestions);
  }

  // Intent-based suggestions
  for (const intent of profile.recentIntents.slice(-3)) {
    const intentSuggestions = getIntentSuggestions(intent);
    suggestions.push(...intentSuggestions);
  }

  // Remove duplicates and sort by relevance
  const uniqueSuggestions = Array.from(
    new Map(suggestions.map(s => [s.id, s])).values()
  );

  return uniqueSuggestions
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, 8);
}

/**
 * Get suggestions for a specific topic
 */
function getTopicSuggestions(topic: string, relevanceScore: number): Suggestion[] {
  const topicData: { [key: string]: Suggestion[] } = {
    'debris-removal': [
      {
        id: 'debris-1',
        type: 'document',
        title: 'Debris Removal Program Overview',
        description: 'Learn about county-managed debris removal and how to participate',
        relevanceScore: relevanceScore * 0.9,
        category: 'Debris Removal',
        icon: '🏗️',
        estimatedTime: '5 min read',
        priority: 'high'
      },
      {
        id: 'debris-2',
        type: 'action',
        title: 'Opt Out of Debris Removal',
        description: 'Complete the opt-out form if you prefer private debris removal',
        relevanceScore: relevanceScore * 0.8,
        category: 'Debris Removal',
        icon: '📝',
        priority: 'medium'
      }
    ],
    'insurance': [
      {
        id: 'insurance-1',
        type: 'resource',
        title: 'Filing Insurance Claims',
        description: 'Step-by-step guide to filing fire damage insurance claims',
        relevanceScore: relevanceScore * 0.95,
        category: 'Insurance',
        icon: '📋',
        estimatedTime: '8 min read',
        priority: 'high'
      },
      {
        id: 'insurance-2',
        type: 'resource',
        title: 'Document Damage for Insurance',
        description: 'How to properly document property damage for your claim',
        relevanceScore: relevanceScore * 0.85,
        category: 'Insurance',
        icon: '📸',
        estimatedTime: '6 min read',
        priority: 'medium'
      }
    ],
    'permits': [
      {
        id: 'permits-1',
        type: 'document',
        title: 'Building Permit Application',
        description: 'Required permits for rebuilding after fire damage',
        relevanceScore: relevanceScore * 0.9,
        category: 'Permits',
        icon: '📄',
        estimatedTime: '10 min read',
        priority: 'high'
      },
      {
        id: 'permits-2',
        type: 'action',
        title: 'Fast-Track Permit Process',
        description: 'Expedited permit review for fire recovery rebuilding',
        relevanceScore: relevanceScore * 0.85,
        category: 'Permits',
        icon: '⚡',
        priority: 'medium'
      }
    ],
    'financial-assistance': [
      {
        id: 'financial-1',
        type: 'resource',
        title: 'FEMA Individual Assistance',
        description: 'Apply for federal disaster assistance for individuals and families',
        relevanceScore: relevanceScore * 1.0,
        category: 'Financial Assistance',
        icon: '💰',
        url: 'https://www.fema.gov/assistance/individual',
        estimatedTime: '7 min read',
        priority: 'high'
      },
      {
        id: 'financial-2',
        type: 'resource',
        title: 'SBA Disaster Loans',
        description: 'Low-interest disaster loans for homeowners and renters',
        relevanceScore: relevanceScore * 0.9,
        category: 'Financial Assistance',
        icon: '🏦',
        estimatedTime: '12 min read',
        priority: 'high'
      }
    ],
    'rebuilding': [
      {
        id: 'rebuild-1',
        type: 'document',
        title: 'Rebuild Planning Guide',
        description: 'Complete guide to planning your home reconstruction',
        relevanceScore: relevanceScore * 0.95,
        category: 'Rebuilding',
        icon: '🏠',
        estimatedTime: '15 min read',
        priority: 'high'
      },
      {
        id: 'rebuild-2',
        type: 'resource',
        title: 'Finding Licensed Contractors',
        description: 'How to verify and select qualified rebuilding contractors',
        relevanceScore: relevanceScore * 0.85,
        category: 'Rebuilding',
        icon: '👷',
        estimatedTime: '8 min read',
        priority: 'medium'
      }
    ]
  };

  return topicData[topic] || [];
}

/**
 * Get location-specific suggestions
 */
function getLocationSuggestions(location: string): Suggestion[] {
  const locationLower = location.toLowerCase();

  if (locationLower.includes('pasadena')) {
    return [
      {
        id: 'loc-pasadena-1',
        type: 'resource',
        title: 'Pasadena Fire Recovery Center',
        description: 'Visit the local recovery center for in-person assistance',
        relevanceScore: 0.8,
        category: 'Local Resources',
        icon: '🏢',
        priority: 'medium'
      }
    ];
  }

  if (locationLower.includes('altadena')) {
    return [
      {
        id: 'loc-altadena-1',
        type: 'resource',
        title: 'Altadena Community Resources',
        description: 'Local community support and recovery resources',
        relevanceScore: 0.8,
        category: 'Local Resources',
        icon: '🤝',
        priority: 'medium'
      }
    ];
  }

  return [
    {
      id: 'loc-general-1',
      type: 'resource',
      title: 'LA County Recovery Hotline',
      description: 'Call (833) 238-4450 for personalized assistance',
      relevanceScore: 0.7,
      category: 'Local Resources',
      icon: '📞',
      priority: 'low'
    }
  ];
}

/**
 * Get intent-based suggestions
 */
function getIntentSuggestions(intent: string): Suggestion[] {
  const intentData: { [key: string]: Suggestion } = {
    'emergency': {
      id: 'intent-emergency-1',
      type: 'action',
      title: 'Emergency Contacts',
      description: 'Access emergency services and crisis hotlines',
      relevanceScore: 1.0,
      category: 'Emergency',
      icon: '🚨',
      priority: 'high'
    },
    'legal': {
      id: 'intent-legal-1',
      type: 'resource',
      title: 'Free Legal Aid',
      description: 'Connect with free legal services for fire recovery issues',
      relevanceScore: 0.9,
      category: 'Legal',
      icon: '⚖️',
      estimatedTime: '10 min read',
      priority: 'high'
    },
    'financial': {
      id: 'intent-financial-1',
      type: 'resource',
      title: 'Financial Assistance Programs',
      description: 'Overview of all available financial aid programs',
      relevanceScore: 0.95,
      category: 'Financial',
      icon: '💵',
      estimatedTime: '12 min read',
      priority: 'high'
    },
    'emotional_support': {
      id: 'intent-emotional-1',
      type: 'resource',
      title: 'Mental Health Services',
      description: 'Free counseling and mental health support for fire survivors',
      relevanceScore: 0.9,
      category: 'Health',
      icon: '💚',
      estimatedTime: '5 min read',
      priority: 'high'
    }
  };

  return intentData[intent] ? [intentData[intent]] : [];
}

/**
 * Filter suggestions based on user history to avoid repetition
 */
export function filterSuggestions(
  suggestions: Suggestion[],
  viewedSuggestionIds: string[]
): Suggestion[] {
  return suggestions.filter(s => !viewedSuggestionIds.includes(s.id));
}

/**
 * Get comprehensive suggestions for a user
 */
export function getUserSuggestions(data: {
  conversationHistory?: any[];
  pageContext?: any;
  userProfile?: any;
  viewedSuggestions?: string[];
}): Suggestion[] {
  // Build interest profile
  const profile = analyzeUserInterests({
    conversationHistory: data.conversationHistory,
    pageContext: data.pageContext,
    userProfile: data.userProfile
  });

  // Generate suggestions
  let suggestions = generateSuggestions(profile);

  // Filter out viewed suggestions
  if (data.viewedSuggestions && data.viewedSuggestions.length > 0) {
    suggestions = filterSuggestions(suggestions, data.viewedSuggestions);
  }

  return suggestions;
}
