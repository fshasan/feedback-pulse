# Feedback Aggregation Dashboard - Part 1 Prototype

A prototype tool for aggregating and analyzing product feedback from multiple sources (Customer Support, Discord, GitHub, Twitter/X, Email, and Community Forums).

## Features

### 📊 Dashboard Analytics
- **Real-time Aggregation**: Collects feedback from 6 different sources
- **Sentiment Analysis**: Automatically categorizes feedback as positive, negative, or neutral
- **Theme Extraction**: Identifies key topics (Performance, API, Pricing, Security, Documentation, Features, Bugs, Reliability)
- **Value Scoring**: Calculates importance based on engagement metrics, source credibility, and urgency indicators
- **Urgency Detection**: Flags high-priority issues that need immediate attention

### 🎯 Key Insights
- Total feedback count and source distribution
- Sentiment breakdown (positive/negative/neutral)
- Top themes/topics being discussed
- High-urgency items requiring attention
- Average value scores for prioritization

### 🔍 Interactive Features
- Filter feedback by source (All, Support, Discord, GitHub, Twitter, Email, Forum)
- Visual charts showing distribution across sources, sentiments, and themes
- Detailed feedback list with sentiment badges, urgency scores, and value scores
- Top issues section highlighting critical problems

## Architecture

### Backend (Cloudflare Worker)
- **API Endpoints**:
  - `/api/feedback` - Returns all processed feedback with analysis
  - `/api/insights` - Returns aggregated insights and statistics
  - `/api/feedback/source/{source}` - Returns filtered feedback by source

### Analysis Engine
- **Sentiment Analysis**: Keyword-based sentiment detection (production would use ML/AI)
- **Theme Extraction**: Pattern matching to identify discussion topics
- **Value Scoring**: Multi-factor algorithm considering:
  - Source credibility (enterprise/support weighted higher)
  - Engagement metrics (likes, upvotes, reactions)
  - Urgency indicators
- **Urgency Scoring**: Based on priority flags and negative sentiment

## Getting Started

### Prerequisites
- Node.js installed
- npm or yarn package manager

### Installation & Running

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser to `http://localhost:8787`

### Deployment

Deploy to Cloudflare Workers:
```bash
npm run deploy
```

## Mock Data

The prototype includes 15 sample feedback items across different sources:
- 3 Customer Support tickets
- 3 Discord messages
- 3 GitHub issues
- 3 Twitter/X posts
- 2 Email messages
- 2 Community Forum posts

Each item includes realistic metadata (timestamps, engagement metrics, categories) to demonstrate the aggregation and analysis capabilities.

## UI/UX Highlights

- **Modern Design**: Gradient backgrounds, card-based layout, smooth animations
- **Responsive**: Works on desktop and mobile devices
- **Visual Indicators**: Color-coded badges for sources, sentiment, and urgency
- **Accessibility**: Clear typography, sufficient contrast, intuitive navigation

## Product Thinking Notes

### What This Solves
1. **Noise Reduction**: Centralizes scattered feedback into one view
2. **Prioritization**: Value and urgency scores help focus on high-impact items
3. **Pattern Recognition**: Theme extraction surfaces recurring topics
4. **Sentiment Tracking**: Understand overall customer satisfaction

### Production Considerations
- Integrate real APIs/webhooks from each source
- Implement ML-based sentiment analysis (e.g., using Cloudflare Workers AI)
- Add time-series analysis for trend detection
- Create alerts/notifications for high-urgency items
- Add export functionality (CSV, PDF reports)
- Implement user authentication and access controls
- Add feedback annotation and resolution tracking
- Create dashboards for different stakeholders (engineering, support, exec)

## Technology Stack

- **Runtime**: Cloudflare Workers
- **Frontend**: Vanilla HTML/CSS/JavaScript
- **API**: RESTful endpoints
- **AI Models**: 
  - **Llama 3.1 70B Instruct** (`@cf/meta/llama-3.1-70b-instruct`) - Primary model for feedback analysis and explanations
  - **Llama 3.1 8B Instruct** (`@cf/meta/llama-3.1-8b-instruct`) - Fallback model and for validation tasks
- **AI Provider**: Cloudflare Workers AI
- **Deployment**: Cloudflare Workers Platform

## AI Model Details

The application uses Meta's Llama open-source language models through Cloudflare Workers AI:

- **Feedback Analysis**: Uses Llama 3.1 70B for contextual sentiment analysis, theme extraction, and scoring
- **Feedback Validation**: Uses Llama 3.1 8B for quick validation of meaningful content
- **Explanation Generation**: Uses Llama 3.1 70B for detailed, contextual explanations

All models automatically fallback to smaller models if the larger ones are unavailable.

---

Built for Cloudflare Product Manager Intern Assignment - Part 1
