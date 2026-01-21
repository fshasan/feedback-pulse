# Feedback Pulse

An AI-powered product feedback aggregation and analysis tool built on Cloudflare Workers. Automatically analyzes customer feedback from multiple sources using Llama AI models to extract sentiment, themes, urgency, and actionable insights.

## Live Demo

**🚀 [https://flat-wildflower-2869.sharukh75hasan.workers.dev](https://flat-wildflower-2869.sharukh75hasan.workers.dev)**

## Features

### 🤖 AI-Powered Analysis
- **Contextual Sentiment Analysis**: Uses Llama 3.1 models to understand sentiment beyond simple keywords
- **Smart Theme Extraction**: Automatically identifies topics like Performance, API, Security, Documentation, Bugs, etc.
- **Value & Urgency Scoring**: AI-driven prioritization based on business impact and criticality
- **Meaningless Content Detection**: Filters out gibberish, spam, and non-substantive input
- **Detailed Explanations**: AI-generated reasoning for each analysis decision

### 📊 Interactive Dashboard
- **Real-time Feedback Submission**: Add and analyze new feedback instantly
- **Filtering & Search**: Filter by source, sentiment, or search by keywords
- **Sortable Tables**: Sort by date, sentiment, value score, or urgency
- **Pagination**: Navigate through large datasets efficiently
- **Click-to-View Analysis**: Select any feedback item to see detailed analysis

### 💾 Persistent Storage
- **Cloudflare D1 Database**: All feedback is stored persistently
- **Survives Server Restarts**: Data remains intact across deployments
- **Efficient Queries**: Indexed columns for fast filtering and sorting

### 🎯 Supported Sources
- Customer Support tickets
- Discord messages
- GitHub issues
- Twitter/X posts
- Email feedback
- Community Forum posts

## Technology Stack

| Component | Technology |
|-----------|------------|
| **Runtime** | Cloudflare Workers |
| **Database** | Cloudflare D1 (SQLite) |
| **AI Models** | Cloudflare Workers AI |
| **Frontend** | Vanilla HTML/CSS/JavaScript |
| **API** | RESTful endpoints |

### AI Models Used

| Model | Purpose |
|-------|---------|
| `@cf/meta/llama-3.1-70b-instruct` | Primary analysis & explanations |
| `@cf/meta/llama-3.1-8b-instruct` | Validation & fallback |

## Getting Started

### Prerequisites
- Node.js (v18+)
- npm
- Cloudflare account (for deployment)

### Local Development

1. **Clone the repository**
```bash
git clone https://github.com/fshasan/feedback-pulse.git
cd feedback-pulse
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up local D1 database**
```bash
npx wrangler d1 migrations apply feedback-db --local
```

4. **Start the development server**
```bash
npm run dev
```

5. **Open your browser**
```
http://localhost:8787
```

### Deployment

1. **Create D1 database** (first time only)
```bash
npx wrangler d1 create feedback-db
```

2. **Update `wrangler.jsonc`** with your database ID

3. **Apply migrations to remote database**
```bash
npx wrangler d1 migrations apply feedback-db --remote
```

4. **Deploy to Cloudflare Workers**
```bash
npm run deploy
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/feedback` | Get paginated feedback with filters |
| `POST` | `/api/feedback/save` | Save new feedback to database |
| `POST` | `/api/ai/validate` | Validate if content is meaningful |
| `POST` | `/api/ai/analyze` | Get AI analysis for feedback |
| `POST` | `/api/ai/explain` | Get detailed AI explanations |

### Query Parameters for `/api/feedback`

| Parameter | Description | Example |
|-----------|-------------|---------|
| `page` | Page number | `?page=2` |
| `limit` | Items per page | `?limit=10` |
| `source` | Filter by source | `?source=discord` |
| `sentiment` | Filter by sentiment | `?sentiment=negative` |
| `search` | Search in content | `?search=bug` |
| `sortBy` | Sort column | `?sortBy=urgencyScore` |
| `sortOrder` | Sort direction | `?sortOrder=desc` |

## Project Structure

```
feedback-pulse/
├── src/
│   └── index.js          # Cloudflare Worker backend
├── public/
│   └── index.html        # Frontend dashboard
├── migrations/
│   └── 0001_create_feedback_table.sql
├── wrangler.jsonc        # Cloudflare configuration
├── package.json
└── README.md
```

## How It Works

1. **User submits feedback** via the form (text + source)
2. **AI validates** the content to filter meaningless input
3. **AI analyzes** valid feedback for sentiment, themes, urgency, and value
4. **Feedback is saved** to D1 database with analysis results
5. **Dashboard updates** to show the new entry with full analysis
6. **Click any row** to view detailed AI-generated explanations

## Screenshots

### Dashboard Overview
- Clean, modern UI with gradient design
- Real-time statistics and insights
- Responsive layout for all devices

### Analysis Card
- Sentiment with confidence score
- Extracted themes as tags
- Value and urgency meters
- AI-generated explanations

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - feel free to use this project for your own purposes.

---

Built with ❤️ using Cloudflare Workers, Workers AI, and D1
