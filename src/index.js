/**
 * Feedback Aggregation & Analysis Tool
 * Prototype for Cloudflare PM Intern Assignment
 * 
 * AI Integration:
 * - Uses Llama 3.1 70B Instruct (@cf/meta/llama-3.1-70b-instruct) for feedback analysis and explanations
 * - Falls back to Llama 3.1 8B Instruct (@cf/meta/llama-3.1-8b-instruct) if 70B is unavailable
 * - Uses Llama 3.1 8B Instruct for validation (faster, sufficient for simple task)
 * 
 * All analysis is performed using Meta's Llama models via Cloudflare Workers AI
 */

// In-memory storage for new feedback (when database not available)
let userFeedback = [];

// Mock feedback data from various sources
const mockFeedback = [
	// Customer Support Tickets
	{
		id: 'CS-001',
		source: 'support',
		title: 'API rate limiting too restrictive',
		content: 'We keep hitting rate limits on the API. The current 1000 requests per hour is way too low for our use case. This is blocking our production deployment.',
		author: 'sarah@company.com',
		timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
		metadata: { priority: 'high', category: 'api' }
	},
	{
		id: 'CS-002',
		source: 'support',
		title: 'Dashboard loading slowly',
		content: 'The dashboard takes over 10 seconds to load. This has been happening for the past week. Very frustrating for our team.',
		author: 'mike@startup.io',
		timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
		metadata: { priority: 'medium', category: 'performance' }
	},
	{
		id: 'CS-003',
		source: 'support',
		title: 'Great documentation!',
		content: 'Just wanted to say thank you for the excellent API documentation. It made integration so much easier than with other providers.',
		author: 'dev@example.com',
		timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
		metadata: { priority: 'low', category: 'documentation' }
	},
	
	// Discord Messages
	{
		id: 'DC-001',
		source: 'discord',
		title: 'Feature request: Webhook retries',
		content: 'Can we get automatic retries for failed webhooks? Right now if a webhook fails once, it never retries. We miss important notifications.',
		author: 'jane_doe#1234',
		timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
		metadata: { channel: 'feature-requests', reactions: 15 }
	},
	{
		id: 'DC-002',
		source: 'discord',
		title: 'Bug: SSL certificate errors',
		content: 'Getting SSL certificate errors when trying to connect. Is this a known issue? Super urgent, our service is down.',
		author: 'admin_user#5678',
		timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
		metadata: { channel: 'bugs', reactions: 8 }
	},
	{
		id: 'DC-003',
		source: 'discord',
		title: 'Appreciation post',
		content: 'The new caching features are amazing! Reduced our latency by 80%. Thank you team!',
		author: 'happy_dev#9012',
		timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
		metadata: { channel: 'general', reactions: 42 }
	},
	
	// GitHub Issues
	{
		id: 'GH-001',
		source: 'github',
		title: 'Add support for GraphQL subscriptions',
		content: 'Would love to see GraphQL subscription support. This is a must-have for our real-time application. Currently using workarounds but native support would be ideal.',
		author: 'github_user_1',
		timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
		metadata: { repo: 'api', labels: ['enhancement', 'feature-request'], upvotes: 47, comments: 12 }
	},
	{
		id: 'GH-002',
		source: 'github',
		title: 'Memory leak in v2.3.0',
		content: 'Experiencing memory leaks in production. Memory usage grows from 200MB to 2GB over 24 hours. Needs urgent attention.',
		author: 'github_user_2',
		timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
		metadata: { repo: 'sdk', labels: ['bug', 'critical'], upvotes: 89, comments: 24 }
	},
	{
		id: 'GH-003',
		source: 'github',
		title: 'TypeScript types are outdated',
		content: 'The TypeScript definitions are missing several new endpoints. Please update @types/cloudflare to match the latest API.',
		author: 'ts_dev',
		timestamp: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(),
		metadata: { repo: 'sdk', labels: ['documentation', 'typescript'], upvotes: 23, comments: 5 }
	},
	
	// Twitter/X Posts
	{
		id: 'TW-001',
		source: 'twitter',
		title: 'Performance issues',
		content: '@CloudflareAPI experiencing massive slowdowns today. Response times are 5x normal. Anyone else seeing this?',
		author: '@techlead',
		timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
		metadata: { likes: 12, retweets: 5, replies: 8 }
	},
	{
		id: 'TW-002',
		source: 'twitter',
		title: 'Feature appreciation',
		content: 'Just discovered Cloudflare Workers and it\'s a game changer! So much faster than our previous serverless setup. Highly recommend!',
		author: '@webdev',
		timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
		metadata: { likes: 156, retweets: 34, replies: 21 }
	},
	{
		id: 'TW-003',
		source: 'twitter',
		title: 'Price concerns',
		content: 'Love the product but pricing is getting steep. The new tier structure makes it hard for small teams to afford. Hope you reconsider.',
		author: '@startup_founder',
		timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
		metadata: { likes: 78, retweets: 15, replies: 31 }
	},
	
	// Email Feedback
	{
		id: 'EM-001',
		source: 'email',
		title: 'Billing inquiry',
		content: 'Our billing seems incorrect this month. We were charged $500 more than expected. Can someone review this?',
		author: 'finance@company.com',
		timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
		metadata: { subject: 'Billing Issue', department: 'finance' }
	},
	{
		id: 'EM-002',
		source: 'email',
		title: 'Enterprise feature request',
		content: 'We need SSO integration with SAML for our enterprise deployment. This is a blocker for renewal. When can we expect this?',
		author: 'cto@enterprise.com',
		timestamp: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
		metadata: { subject: 'Enterprise Feature Request', department: 'sales' }
	},
	
	// Community Forum
	{
		id: 'CF-001',
		source: 'forum',
		title: 'Best practices for edge caching',
		content: 'What are the recommended cache headers for static assets? Looking for best practices from the community.',
		author: 'community_member',
		timestamp: new Date(Date.now() - 15 * 60 * 60 * 1000).toISOString(),
		metadata: { category: 'best-practices', views: 234, replies: 18 }
	},
	{
		id: 'CF-002',
		source: 'forum',
		title: 'DDoS protection feedback',
		content: 'The automatic DDoS protection saved us last week! Attack was mitigated in seconds. This is why we chose Cloudflare.',
		author: 'security_admin',
		timestamp: new Date(Date.now() - 7 * 60 * 60 * 1000).toISOString(),
		metadata: { category: 'security', views: 567, replies: 45 }
	}
];

// Helper function for rule-based meaningless detection (fallback)
function checkIfMeaningless(text) {
	const trimmed = text.trim();
	const repetitivePattern = /(.{2,})\1{2,}/;
	if (repetitivePattern.test(trimmed)) return true;
	
	const words = trimmed.toLowerCase().split(/\s+/);
	const wordCounts = {};
	words.forEach(word => {
		wordCounts[word] = (wordCounts[word] || 0) + 1;
	});
	const maxCount = Math.max(...Object.values(wordCounts));
	if (maxCount > words.length * 0.5 && words.length > 3) return true;
	
	const uniqueChars = new Set(trimmed.toLowerCase().replace(/\s/g, ''));
	if (uniqueChars.size < 5 && trimmed.length > 20) return true;
	
	return false;
}

// Helper function for rule-based spam/offensive detection (fallback)
function checkIfSpam(text) {
	const trimmed = text.trim().toLowerCase();
	
	// Common spam indicators
	const spamPatterns = [
		/buy now|click here|limited time|act now|special offer/i,
		/free money|make money|get rich|work from home/i,
		/viagra|cialis|pharmacy|pills|medication/i,
		/casino|poker|betting|lottery|jackpot/i,
		/bitcoin|crypto|investment|trading|forex/i,
		/http:\/\/|https:\/\/|www\./i, // URLs (common in spam)
		/click|link|website|visit|promo/i
	];
	
	// Check for spam patterns
	for (const pattern of spamPatterns) {
		if (pattern.test(trimmed)) {
			return true;
		}
	}
	
	// Check for excessive capitalization (spam indicator)
	const capsRatio = (trimmed.match(/[A-Z]/g) || []).length / trimmed.length;
	if (capsRatio > 0.5 && trimmed.length > 20) {
		return true;
	}
	
	// Check for offensive language (basic detection)
	const offensiveWords = [
		'fuck', 'shit', 'damn', 'bitch', 'asshole', 'bastard',
		'idiot', 'stupid', 'dumb', 'retard', 'moron'
	];
	
	for (const word of offensiveWords) {
		if (trimmed.includes(word)) {
			return true;
		}
	}
	
	return false;
}

// Simple sentiment analysis (in production, would use AI/ML)
function analyzeSentiment(text) {
	const lowerText = text.toLowerCase();
	
	const positiveWords = ['great', 'excellent', 'amazing', 'love', 'thank', 'awesome', 'fantastic', 'perfect', 'helpful', 'saved', 'game changer'];
	const negativeWords = ['bug', 'error', 'issue', 'problem', 'frustrating', 'broken', 'down', 'slow', 'fail', 'urgent', 'blocker', 'steep'];
	const urgentWords = ['urgent', 'critical', 'blocking', 'down', 'broken', 'asap', 'immediately', 'production'];
	
	let score = 0;
	let isUrgent = false;
	
	positiveWords.forEach(word => {
		if (lowerText.includes(word)) score += 1;
	});
	
	negativeWords.forEach(word => {
		if (lowerText.includes(word)) score -= 1;
	});
	
	urgentWords.forEach(word => {
		if (lowerText.includes(word)) isUrgent = true;
	});
	
	if (score > 1) return { sentiment: 'positive', score: Math.min(score, 3) };
	if (score < -1) return { sentiment: 'negative', score: Math.max(score, -3) };
	return { sentiment: 'neutral', score: 0 };
}

// Extract themes/topics
function extractThemes(text) {
	const themes = [];
	const lowerText = text.toLowerCase();
	
	const themeKeywords = {
		'Performance': ['slow', 'latency', 'speed', 'performance', 'loading', 'response time', 'fast'],
		'API': ['api', 'endpoint', 'rate limit', 'request', 'rest', 'graphql'],
		'Pricing': ['price', 'cost', 'billing', 'afford', 'expensive', 'pricing'],
		'Security': ['ssl', 'certificate', 'ddos', 'attack', 'security', 'saml', 'sso'],
		'Documentation': ['documentation', 'docs', 'guide', 'tutorial', 'example'],
		'Features': ['feature', 'request', 'missing', 'add', 'support', 'integration'],
		'Bugs': ['bug', 'error', 'issue', 'broken', 'leak', 'crash'],
		'Reliability': ['downtime', 'outage', 'fail', 'down', 'unavailable']
	};
	
	Object.keys(themeKeywords).forEach(theme => {
		if (themeKeywords[theme].some(keyword => lowerText.includes(keyword))) {
			themes.push(theme);
		}
	});
	
	return themes.length > 0 ? themes : ['General'];
}

// Calculate value score based on various factors
function calculateValueScore(feedback) {
	let score = 0;
	
	// Engagement metrics
	if (feedback.source === 'twitter') {
		const engagement = (feedback.metadata.likes || 0) + (feedback.metadata.retweets || 0) * 2;
		score += Math.min(engagement / 10, 5);
	}
	
	if (feedback.source === 'github') {
		const engagement = (feedback.metadata.upvotes || 0) + (feedback.metadata.comments || 0) * 2;
		score += Math.min(engagement / 10, 5);
	}
	
	if (feedback.source === 'discord') {
		score += Math.min((feedback.metadata.reactions || 0) / 5, 5);
	}
	
	// Urgency indicators
	const sentiment = analyzeSentiment(feedback.content);
	if (sentiment.isUrgent || feedback.metadata?.priority === 'high') {
		score += 3;
	}
	
	// Source credibility (enterprise > support > github > others)
	const sourceWeights = {
		'support': 3,
		'email': 2.5,
		'github': 2,
		'discord': 1.5,
		'twitter': 1,
		'forum': 1
	};
	score += sourceWeights[feedback.source] || 1;
	
	return Math.min(Math.round(score * 10) / 10, 10);
}

// Process all feedback
function processFeedback(feedbackArray) {
	return feedbackArray.map(item => {
		const sentiment = analyzeSentiment(item.content);
		const themes = extractThemes(item.content);
		const valueScore = calculateValueScore(item);
		const urgencyScore = sentiment.isUrgent || item.metadata?.priority === 'high' ? 
			(item.metadata?.priority === 'critical' ? 10 : 8) : 
			(sentiment.sentiment === 'negative' ? 5 : 2);
		
		return {
			...item,
			analysis: {
				sentiment: sentiment.sentiment,
				sentimentScore: sentiment.score,
				themes,
				valueScore,
				urgencyScore
			}
		};
	});
}

// Generate aggregated insights
function generateInsights(processedFeedback) {
	const insights = {
		total: processedFeedback.length,
		bySource: {},
		bySentiment: { positive: 0, negative: 0, neutral: 0 },
		byTheme: {},
		averageValueScore: 0,
		highUrgencyCount: 0,
		topIssues: []
	};
	
	let totalValueScore = 0;
	
	processedFeedback.forEach(feedback => {
		// Source aggregation
		insights.bySource[feedback.source] = (insights.bySource[feedback.source] || 0) + 1;
		
		// Sentiment aggregation
		insights.bySentiment[feedback.analysis.sentiment]++;
		
		// Theme aggregation
		feedback.analysis.themes.forEach(theme => {
			insights.byTheme[theme] = (insights.byTheme[theme] || 0) + 1;
		});
		
		// Value and urgency
		totalValueScore += feedback.analysis.valueScore;
		if (feedback.analysis.urgencyScore >= 7) {
			insights.highUrgencyCount++;
		}
		
		// Top issues (negative sentiment with high value/urgency)
		if (feedback.analysis.sentiment === 'negative' && feedback.analysis.valueScore >= 5) {
			insights.topIssues.push({
				id: feedback.id,
				title: feedback.title,
				source: feedback.source,
				valueScore: feedback.analysis.valueScore,
				urgencyScore: feedback.analysis.urgencyScore,
				themes: feedback.analysis.themes
			});
		}
	});
	
	insights.averageValueScore = Math.round((totalValueScore / processedFeedback.length) * 10) / 10;
	insights.topIssues.sort((a, b) => b.valueScore - a.valueScore);
	insights.topIssues = insights.topIssues.slice(0, 5);
	
	return insights;
}

export default {
	async fetch(request, env, ctx) {
		const url = new URL(request.url);
		const path = url.pathname;
		
		// CORS headers
		const corsHeaders = {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type',
		};
		
		if (request.method === 'OPTIONS') {
			return new Response(null, { headers: corsHeaders });
		}
		
		try {
			// API endpoint: Save feedback to database
			if (path === '/api/feedback/save' && request.method === 'POST') {
				const feedbackData = await request.json();
				console.log('Saving feedback:', feedbackData.id, 'DB available:', !!env.DB);
				
				if (!env.DB) {
					// If no database, store in memory
					userFeedback.unshift({
						...feedbackData,
						analysis: feedbackData.analysis || {}
					});
					
					return new Response(JSON.stringify({ 
						success: true, 
						message: 'Feedback saved to memory',
						id: feedbackData.id 
					}), {
						headers: { ...corsHeaders, 'Content-Type': 'application/json' }
					});
				}
				
				try {
					// Save to D1 database (including spam records)
					const result = await env.DB.prepare(`
						INSERT INTO feedback (
							id, source, title, content, author, timestamp, metadata,
							sentiment, sentiment_score, themes, value_score, urgency_score,
							is_meaningless, is_spam, reasoning
						) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
					`).bind(
						feedbackData.id,
						feedbackData.source,
						feedbackData.title,
						feedbackData.content,
						feedbackData.author || 'Anonymous',
						feedbackData.timestamp,
						JSON.stringify(feedbackData.metadata || {}),
						feedbackData.analysis?.sentiment || 'neutral',
						feedbackData.analysis?.sentimentScore || 0,
						JSON.stringify(feedbackData.analysis?.themes || []),
						feedbackData.analysis?.valueScore || 0,
						feedbackData.analysis?.urgencyScore || 0,
						feedbackData.analysis?.isMeaningless ? 1 : 0,
						feedbackData.analysis?.isSpam ? 1 : 0,
						feedbackData.analysis?.reasoning || ''
					).run();
					
					console.log('Database insert result:', result);
					
					return new Response(JSON.stringify({ 
						success: true, 
						message: 'Feedback saved to database',
						id: feedbackData.id 
					}), {
						headers: { ...corsHeaders, 'Content-Type': 'application/json' }
					});
				} catch (dbError) {
					console.error('Database error:', dbError.message);
					return new Response(JSON.stringify({ 
						success: false, 
						message: 'Failed to save feedback: ' + dbError.message 
					}), {
						status: 500,
						headers: { ...corsHeaders, 'Content-Type': 'application/json' }
					});
				}
			}
			
			// API endpoint: Get all feedback with pagination and filters
			if (path === '/api/feedback') {
				// Parse query parameters
				const page = parseInt(url.searchParams.get('page')) || 1;
				const limit = Math.min(parseInt(url.searchParams.get('limit')) || 10, 100);
				const offset = (page - 1) * limit;
				const source = url.searchParams.get('source');
				const sentiment = url.searchParams.get('sentiment');
				const search = url.searchParams.get('search');
				const sortBy = url.searchParams.get('sortBy') || 'timestamp';
				const sortOrder = url.searchParams.get('sortOrder') || 'desc';
				
				let feedbackList = [];
				let totalCount = 0;
				
				if (env.DB) {
					try {
						// Build dynamic query with filters
						let whereClause = [];
						let params = [];
						
						if (source && source !== 'all') {
							whereClause.push('source = ?');
							params.push(source);
						}
						
						if (sentiment && sentiment !== 'all') {
							whereClause.push('sentiment = ?');
							params.push(sentiment);
						}
						
						if (search) {
							whereClause.push('(title LIKE ? OR content LIKE ?)');
							params.push(`%${search}%`, `%${search}%`);
						}
						
						const whereSQL = whereClause.length > 0 ? 'WHERE ' + whereClause.join(' AND ') : '';
						
						// Validate sort column
						const validSortColumns = ['timestamp', 'value_score', 'urgency_score', 'sentiment'];
						const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'timestamp';
						const sortDir = sortOrder.toLowerCase() === 'asc' ? 'ASC' : 'DESC';
						
						// Get total count
						const countQuery = `SELECT COUNT(*) as count FROM feedback ${whereSQL}`;
						const countResult = await env.DB.prepare(countQuery).bind(...params).first();
						totalCount = countResult?.count || 0;
						
						// Get paginated results
						const dataQuery = `
							SELECT * FROM feedback 
							${whereSQL}
							ORDER BY ${sortColumn} ${sortDir}
							LIMIT ? OFFSET ?
						`;
						const { results } = await env.DB.prepare(dataQuery)
							.bind(...params, limit, offset)
							.all();
						
						feedbackList = results.map(row => ({
							id: row.id,
							source: row.source,
							title: row.title,
							content: row.content,
							author: row.author,
							timestamp: row.timestamp,
							metadata: JSON.parse(row.metadata || '{}'),
							analysis: {
								sentiment: row.sentiment,
								sentimentScore: row.sentiment_score,
								themes: JSON.parse(row.themes || '[]'),
								valueScore: row.value_score,
								urgencyScore: row.urgency_score,
								isMeaningless: row.is_meaningless === 1,
								isSpam: row.is_spam === 1,
								reasoning: row.reasoning
							}
						}));
						
						// If database has data, return it
						if (totalCount > 0) {
							return new Response(JSON.stringify({
								data: feedbackList,
								pagination: {
									page,
									limit,
									totalCount,
									totalPages: Math.ceil(totalCount / limit),
									hasNext: page * limit < totalCount,
									hasPrev: page > 1
								}
							}, null, 2), {
								headers: { ...corsHeaders, 'Content-Type': 'application/json' }
							});
						}
					} catch (dbError) {
						console.error('Database read error:', dbError);
					}
				}
				
				// Fallback: use mock data + user feedback with filtering
				{
					// Combine user feedback with processed mock data
					let mockList = [...userFeedback, ...processFeedback(mockFeedback)];
					
					// Apply filters to combined data
					if (source && source !== 'all') {
						mockList = mockList.filter(f => f.source === source);
					}
					if (sentiment && sentiment !== 'all') {
						mockList = mockList.filter(f => f.analysis?.sentiment === sentiment);
					}
					if (search) {
						const searchLower = search.toLowerCase();
						mockList = mockList.filter(f => 
							f.title?.toLowerCase().includes(searchLower) || 
							f.content?.toLowerCase().includes(searchLower)
						);
					}
					
					// Sort
					const sortKey = sortBy === 'value_score' ? 'valueScore' : 
								   sortBy === 'urgency_score' ? 'urgencyScore' : sortBy;
					mockList.sort((a, b) => {
						let aVal = sortKey === 'timestamp' ? new Date(a[sortKey] || a.timestamp) : 
								  (a.analysis?.[sortKey] ?? a[sortKey] ?? 0);
						let bVal = sortKey === 'timestamp' ? new Date(b[sortKey] || b.timestamp) : 
								  (b.analysis?.[sortKey] ?? b[sortKey] ?? 0);
						return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
					});
					
					totalCount = mockList.length;
					feedbackList = mockList.slice(offset, offset + limit);
				}
				
				// Return paginated response
				return new Response(JSON.stringify({
					data: feedbackList,
					pagination: {
						page,
						limit,
						totalCount,
						totalPages: Math.ceil(totalCount / limit),
						hasNext: page * limit < totalCount,
						hasPrev: page > 1
					}
				}, null, 2), {
					headers: { ...corsHeaders, 'Content-Type': 'application/json' }
				});
			}
			
			// API endpoint: Get aggregated insights
			if (path === '/api/insights') {
				const processed = processFeedback(mockFeedback);
				const insights = generateInsights(processed);
				return new Response(JSON.stringify(insights, null, 2), {
					headers: { ...corsHeaders, 'Content-Type': 'application/json' }
				});
			}
			
			// API endpoint: Get feedback by source
			if (path.startsWith('/api/feedback/source/')) {
				const source = path.split('/').pop();
				const filtered = mockFeedback.filter(f => f.source === source);
				const processed = processFeedback(filtered);
				return new Response(JSON.stringify(processed, null, 2), {
					headers: { ...corsHeaders, 'Content-Type': 'application/json' }
				});
			}
			
			// AI endpoint: Validate feedback (check if meaningful, spam, or offensive)
			if (path === '/api/ai/validate' && request.method === 'POST') {
				const { content } = await request.json();
				
				if (!env.AI) {
					// Fallback to rule-based if AI not available
					const isMeaningless = checkIfMeaningless(content);
					const isSpam = checkIfSpam(content);
					return new Response(JSON.stringify({ 
						isMeaningless: isMeaningless || isSpam,
						isSpam,
						reason: isSpam ? 'Content appears to be spam or offensive' : (isMeaningless ? 'Feedback contains repetitive patterns or lacks coherent meaning' : 'Feedback appears meaningful')
					}), {
						headers: { ...corsHeaders, 'Content-Type': 'application/json' }
					});
				}
				
				try {
					const prompt = `Analyze this feedback text and determine if it's:
1. Meaningful feedback (valid product feedback)
2. Meaningless/gibberish (repetitive patterns, nonsense)
3. Spam (irrelevant content, promotional material, off-topic)
4. Offensive (inappropriate language, hate speech, harassment)

Feedback: "${content}"

Respond with JSON only:
{
  "isMeaningless": true/false,
  "isSpam": true/false,
  "reason": "brief explanation why"
}

Examples:
- Meaningless: "dasdasdasd", "asdfasdfasdf", repetitive patterns
- Spam: promotional content, irrelevant topics, advertising
- Offensive: hate speech, harassment, inappropriate language
- Valid: actual product feedback, feature requests, bug reports`;

					// Use Llama 3.1 8B Instruct for validation (faster, sufficient for simple task)
					const response = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
						messages: [
							{ role: 'system', content: 'You are a feedback validation assistant. Analyze text and determine if it has meaningful content, is spam, or offensive. Always respond with valid JSON only. Be strict about spam and offensive content - classify as spam if irrelevant, promotional, or off-topic. Classify as offensive if it contains hate speech, harassment, or inappropriate language.' },
							{ role: 'user', content: prompt }
						],
						max_tokens: 250,
						temperature: 0.2
					});

					// Extract response text from AI response
					let aiResponse = '';
					if (typeof response === 'string') {
						aiResponse = response;
					} else if (response.response) {
						aiResponse = response.response;
					} else if (response.text) {
						aiResponse = response.text;
					} else {
						aiResponse = JSON.stringify(response);
					}
					
					let result;
					try {
						// Try to extract JSON from response
						const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
						if (jsonMatch) {
							result = JSON.parse(jsonMatch[0]);
						} else {
							throw new Error('No JSON found');
						}
					} catch {
						// If not JSON, try to extract from text
						const lowerResponse = aiResponse.toLowerCase();
						const isMeaningless = lowerResponse.includes('meaningless') || 
											 lowerResponse.includes('gibberish') ||
											 lowerResponse.includes('nonsense') ||
											 (lowerResponse.includes('true') && lowerResponse.includes('isMeaningless'));
						const isSpam = lowerResponse.includes('spam') || 
									  lowerResponse.includes('irrelevant') ||
									  lowerResponse.includes('offensive') ||
									  lowerResponse.includes('inappropriate');
						result = { 
							isMeaningless: isMeaningless || isSpam,
							isSpam: isSpam,
							reason: aiResponse.substring(0, 150) || 'Unable to determine meaning' 
						};
					}
					
					// Ensure isSpam is set
					if (result.isSpam === undefined) {
						result.isSpam = false;
					}
					
					return new Response(JSON.stringify(result), {
						headers: { ...corsHeaders, 'Content-Type': 'application/json' }
					});
				} catch (error) {
					// Fallback to rule-based
					const isMeaningless = checkIfMeaningless(content);
					const isSpam = checkIfSpam(content);
					return new Response(JSON.stringify({ 
						isMeaningless: isMeaningless || isSpam,
						isSpam,
						reason: isSpam ? 'Content appears to be spam or offensive' : (isMeaningless ? 'Feedback contains repetitive patterns or lacks coherent meaning' : 'Feedback appears meaningful')
					}), {
						headers: { ...corsHeaders, 'Content-Type': 'application/json' }
					});
				}
			}
			
			// AI endpoint: Analyze feedback (sentiment, themes, scores)
			if (path === '/api/ai/analyze' && request.method === 'POST') {
				const { content, source, metadata = {} } = await request.json();
				
				// Check for spam first - if spam, skip analysis but mark it
				const isSpam = checkIfSpam(content);
				if (isSpam) {
					return new Response(JSON.stringify({
						sentiment: 'neutral',
						sentimentScore: 0,
						themes: ['Spam'],
						valueScore: 0,
						urgencyScore: 0,
						isMeaningless: false,
						isSpam: true,
						reasoning: 'Content classified as spam or offensive. Analysis skipped but record stored.'
					}), {
						headers: { ...corsHeaders, 'Content-Type': 'application/json' }
					});
				}
				
				if (!env.AI) {
					// Fallback to rule-based if AI not available
					const sentiment = analyzeSentiment(content);
					const themes = extractThemes(content);
					const tempFeedback = { content, source, metadata };
					const valueScore = calculateValueScore(tempFeedback);
					const urgencyScore = sentiment.isUrgent || metadata?.priority === 'high' ? 
						(metadata?.priority === 'critical' ? 10 : 8) : 
						(sentiment.sentiment === 'negative' ? 5 : 2);
					
					return new Response(JSON.stringify({
						sentiment: sentiment.sentiment,
						sentimentScore: sentiment.score,
						themes,
						valueScore,
						urgencyScore,
						isMeaningless: checkIfMeaningless(content),
						isSpam: false
					}), {
						headers: { ...corsHeaders, 'Content-Type': 'application/json' }
					});
				}
				
				try {
					const prompt = `You are a product feedback analyst. Analyze the following feedback and provide a comprehensive analysis.

Feedback Content: "${content}"
Source: ${source}
Metadata: ${JSON.stringify(metadata)}

Analyze the feedback contextually and provide a JSON response with:
{
  "sentiment": "positive" | "negative" | "neutral" (based on actual context, not just keywords),
  "sentimentScore": number between -3 and 3 (negative for negative sentiment, positive for positive),
  "themes": ["array", "of", "relevant", "themes"] (identify actual topics like Performance, API, Pricing, Security, Documentation, Features, Bugs, Reliability, etc.),
  "valueScore": number between 0 and 10 (how valuable/important this feedback is for the product team),
  "urgencyScore": number between 0 and 10 (how urgent this issue/feedback requires attention - 0=not urgent, 10=critical),
  "isUrgent": boolean (true if urgent, false otherwise),
  "reasoning": "brief explanation of your analysis"
}

Important:
- Consider context, not just keywords
- Sentiment should reflect actual tone and meaning
- Themes should match what the feedback is actually about
- Value score should consider impact and relevance
- Urgency should consider if this blocks users or needs immediate attention

Respond with ONLY valid JSON, no other text.`;

					// Use Llama 3.1 70B Instruct model for better analysis quality
					// Fallback to 8B if 70B is not available
					let model = '@cf/meta/llama-3.1-70b-instruct';
					let response;
					
					try {
						response = await env.AI.run(model, {
							messages: [
								{ role: 'system', content: 'You are an expert product feedback analyst. Always respond with valid JSON only. Analyze feedback contextually and accurately.' },
								{ role: 'user', content: prompt }
							],
							max_tokens: 800,
							temperature: 0.3
						});
					} catch (error) {
						// Fallback to 8B model if 70B is not available
						console.log('70B model not available, using 8B model');
						model = '@cf/meta/llama-3.1-8b-instruct';
						response = await env.AI.run(model, {
							messages: [
								{ role: 'system', content: 'You are an expert product feedback analyst. Always respond with valid JSON only. Analyze feedback contextually and accurately.' },
								{ role: 'user', content: prompt }
							],
							max_tokens: 800,
							temperature: 0.3
						});
					}

					// Extract response text
					let aiResponse = '';
					if (typeof response === 'string') {
						aiResponse = response;
					} else if (response.response) {
						aiResponse = response.response;
					} else if (response.text) {
						aiResponse = response.text;
					} else {
						aiResponse = JSON.stringify(response);
					}

					// Clean up response - remove markdown code blocks if present
					aiResponse = aiResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

					let result;
					try {
						// Try to extract JSON from response
						const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
						if (jsonMatch) {
							result = JSON.parse(jsonMatch[0]);
						} else {
							throw new Error('No JSON found');
						}

						// Check if AI detected spam
						const aiDetectedSpam = result.isSpam === true || 
											  (result.themes && Array.isArray(result.themes) && result.themes.some(t => t.toLowerCase().includes('spam')));
						
						// Validate and normalize results
						result = {
							sentiment: ['positive', 'negative', 'neutral'].includes(result.sentiment?.toLowerCase()) 
								? result.sentiment.toLowerCase() : 'neutral',
							sentimentScore: Math.max(-3, Math.min(3, Number(result.sentimentScore) || 0)),
							themes: aiDetectedSpam ? ['Spam'] : (Array.isArray(result.themes) ? result.themes : (result.themes ? [result.themes] : ['General'])),
							valueScore: aiDetectedSpam ? 0 : Math.max(0, Math.min(10, Number(result.valueScore) || 0)),
							urgencyScore: aiDetectedSpam ? 0 : Math.max(0, Math.min(10, Number(result.urgencyScore) || 0)),
							isUrgent: aiDetectedSpam ? false : Boolean(result.isUrgent),
							isMeaningless: false,
							isSpam: aiDetectedSpam,
							reasoning: aiDetectedSpam ? 'Content classified as spam or offensive. Analysis skipped but record stored.' : (result.reasoning || 'AI-generated analysis')
						};

						return new Response(JSON.stringify(result), {
							headers: { ...corsHeaders, 'Content-Type': 'application/json' }
						});
					} catch (parseError) {
						// If JSON parsing fails, fallback to rule-based
						const sentiment = analyzeSentiment(content);
						const themes = extractThemes(content);
						const tempFeedback = { content, source, metadata };
						const valueScore = calculateValueScore(tempFeedback);
						const urgencyScore = sentiment.isUrgent || metadata?.priority === 'high' ? 
							(metadata?.priority === 'critical' ? 10 : 8) : 
							(sentiment.sentiment === 'negative' ? 5 : 2);
						
						return new Response(JSON.stringify({
							sentiment: sentiment.sentiment,
							sentimentScore: sentiment.score,
							themes,
							valueScore,
							urgencyScore,
							isMeaningless: checkIfMeaningless(content),
							isSpam: false,
							reasoning: 'Fallback analysis used'
						}), {
							headers: { ...corsHeaders, 'Content-Type': 'application/json' }
						});
					}
				} catch (error) {
					// Fallback to rule-based
					const isSpam = checkIfSpam(content);
					if (isSpam) {
						return new Response(JSON.stringify({
							sentiment: 'neutral',
							sentimentScore: 0,
							themes: ['Spam'],
							valueScore: 0,
							urgencyScore: 0,
							isMeaningless: false,
							isSpam: true,
							reasoning: 'Content classified as spam or offensive. Analysis skipped but record stored.'
						}), {
							headers: { ...corsHeaders, 'Content-Type': 'application/json' }
						});
					}
					
					const sentiment = analyzeSentiment(content);
					const themes = extractThemes(content);
					const tempFeedback = { content, source, metadata };
					const valueScore = calculateValueScore(tempFeedback);
					const urgencyScore = sentiment.isUrgent || metadata?.priority === 'high' ? 
						(metadata?.priority === 'critical' ? 10 : 8) : 
						(sentiment.sentiment === 'negative' ? 5 : 2);
					
					return new Response(JSON.stringify({
						sentiment: sentiment.sentiment,
						sentimentScore: sentiment.score,
						themes,
						valueScore,
						urgencyScore,
						isMeaningless: checkIfMeaningless(content),
						isSpam: false,
						reasoning: 'Error occurred, fallback analysis used'
					}), {
						headers: { ...corsHeaders, 'Content-Type': 'application/json' }
					});
				}
			}
			
			// AI endpoint: Generate analysis explanation
			if (path === '/api/ai/explain' && request.method === 'POST') {
				const { feedback, analysis } = await request.json();
				
				if (!env.AI) {
					// Fallback to basic explanations
					return new Response(JSON.stringify({
						sentiment: `The sentiment is ${analysis.sentiment} based on detected keywords.`,
						valueScore: `Value score of ${analysis.valueScore}/10 based on source credibility and engagement.`,
						urgencyScore: `Urgency score of ${analysis.urgencyScore}/10 based on detected priority indicators.`,
						themes: `Themes identified: ${analysis.themes.join(', ')}.`
					}), {
						headers: { ...corsHeaders, 'Content-Type': 'application/json' }
					});
				}
				
				try {
					const prompt = `Analyze this feedback and provide clear explanations for each metric:

Feedback: "${feedback.content}"
Source: ${feedback.source}
Sentiment: ${analysis.sentiment} (score: ${analysis.sentimentScore})
Value Score: ${analysis.valueScore}/10
Urgency Score: ${analysis.urgencyScore}/10
Themes: ${analysis.themes.join(', ')}

Provide a JSON response with explanations:
{
  "sentiment": "detailed explanation of why this sentiment was assigned",
  "valueScore": "explanation of the value score calculation",
  "urgencyScore": "explanation of the urgency score",
  "themes": "explanation of why these themes were identified",
  "summary": "overall summary of the feedback"
}`;

					// Use Llama 3.1 70B Instruct for detailed explanations (better quality)
					// Fallback to 8B if 70B is not available
					let model = '@cf/meta/llama-3.1-70b-instruct';
					let response;
					
					try {
						response = await env.AI.run(model, {
							messages: [
								{ role: 'system', content: 'You are a product feedback analyst. Provide clear, concise explanations for feedback analysis metrics.' },
								{ role: 'user', content: prompt }
							],
							max_tokens: 500,
							temperature: 0.4
						});
					} catch (error) {
						// Fallback to 8B model if 70B is not available
						console.log('70B model not available, using 8B model');
						model = '@cf/meta/llama-3.1-8b-instruct';
						response = await env.AI.run(model, {
							messages: [
								{ role: 'system', content: 'You are a product feedback analyst. Provide clear, concise explanations for feedback analysis metrics.' },
								{ role: 'user', content: prompt }
							],
							max_tokens: 500,
							temperature: 0.4
						});
					}

					// Extract response text from AI response
					let aiResponse = '';
					if (typeof response === 'string') {
						aiResponse = response;
					} else if (response.response) {
						aiResponse = response.response;
					} else if (response.text) {
						aiResponse = response.text;
					} else {
						aiResponse = JSON.stringify(response);
					}
					
					let result;
					try {
						// Try to extract JSON from response
						const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
						if (jsonMatch) {
							result = JSON.parse(jsonMatch[0]);
						} else {
							throw new Error('No JSON found');
						}
					} catch {
						// If not JSON, try to structure the response by parsing text
						const lines = aiResponse.split('\n').filter(l => l.trim());
						result = {
							sentiment: lines.find(l => l.toLowerCase().includes('sentiment')) || aiResponse.substring(0, 150),
							valueScore: lines.find(l => l.toLowerCase().includes('value')) || aiResponse.substring(150, 300),
							urgencyScore: lines.find(l => l.toLowerCase().includes('urgency')) || aiResponse.substring(300, 450),
							themes: lines.find(l => l.toLowerCase().includes('theme')) || aiResponse.substring(450, 600),
							summary: lines.find(l => l.toLowerCase().includes('summary')) || aiResponse.substring(600) || 'AI-generated analysis'
						};
					}
					
					return new Response(JSON.stringify(result), {
						headers: { ...corsHeaders, 'Content-Type': 'application/json' }
					});
				} catch (error) {
					return new Response(JSON.stringify({ error: error.message }), {
						status: 500,
						headers: { ...corsHeaders, 'Content-Type': 'application/json' }
					});
				}
			}
			
			// Default: serve static assets with no-cache headers in dev
			if (env.ASSETS) {
				const response = await env.ASSETS.fetch(request);
				if (response) {
					// Add cache-busting headers for development
					const newHeaders = new Headers(response.headers);
					newHeaders.set('Cache-Control', 'no-cache, no-store, must-revalidate');
					newHeaders.set('Pragma', 'no-cache');
					newHeaders.set('Expires', '0');
					return new Response(response.body, {
						status: response.status,
						statusText: response.statusText,
						headers: newHeaders
					});
				}
			}
			return new Response('Static assets not available', { status: 404 });
			
		} catch (error) {
			return new Response(JSON.stringify({ error: error.message }), {
				status: 500,
				headers: { ...corsHeaders, 'Content-Type': 'application/json' }
			});
		}
	},
};
