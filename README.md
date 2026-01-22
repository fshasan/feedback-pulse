

## 🎯 Overview

Feedback Pulse helps product teams aggregate, analyze, and prioritize feedback from various channels (Support, Discord, GitHub, Twitter, Email, Forums) using advanced AI analysis. The tool provides contextual understanding of feedback beyond simple keyword matching, enabling data-driven product decisions.

**Feedback Input Approach:** Instead of integrating with third-party APIs, Feedback Pulse uses a manual input system where users can enter feedback through a text field and select the source via a dropdown menu. This approach provides flexibility and control, allowing users to analyze feedback from any source without requiring API keys, webhooks, or complex integrations. Simply paste or type the feedback content, select the appropriate source channel, and click "Analyze" to get instant AI-powered insights.

**Assignment Compliance:** This prototype meets all requirements for the Cloudflare Product Manager Intern Assignment:
- ✅ Deployed on Cloudflare Workers
- ✅ Uses 3 Cloudflare Developer Platform products (Workers, D1, Workers AI)
- ✅ Uses mock data (no third-party API integrations required)
- ✅ Includes architecture overview explaining product choices and rationale
- ✅ Extracts themes, urgency, value, and sentiment from feedback
- ✅ Provides interactive dashboard for aggregated feedback analysis

## ✨ Features

### 🤖 AI-Powered Analysis
- **Contextual Sentiment Analysis**: Uses Llama 3.1 70B to understand sentiment beyond simple keywords, analyzing tone and context
- **Smart Theme Extraction**: Automatically identifies topics like Performance, API, Security, Documentation, Bugs, Reliability, Features, Pricing
- **Value & Urgency Scoring**: AI-driven prioritization (0-10 scale) based on business impact, source credibility, and criticality
- **Spam & Off-topic Detection**: AI-powered detection of spam, promotional content, and off-topic messages. Spam is stored in database for moderation but analysis is skipped
- **Meaningless Content Detection**: Filters out gibberish and non-substantive input using AI validation
- **Detailed Explanations**: AI-generated reasoning for each analysis decision with contextual insights

### 📊 Interactive Dashboard
- **Manual Feedback Input**: Simple text field and source dropdown for entering feedback - no third-party API integrations required. Paste feedback from any source and analyze instantly.
- **Real-time Feedback Submission**: Add and analyze new feedback instantly with immediate AI processing
- **Advanced Filtering**: Filter by source, sentiment, or search by keywords with real-time results
- **Sortable Tables**: Sort by date, sentiment, value score, or urgency with visual indicators
- **Pagination**: Navigate through large datasets efficiently (5, 10, 25, or 50 items per page)
- **Click-to-View Analysis**: Select any feedback item to see detailed analysis with color-coded metrics
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices

### 💾 Persistent Storage
- **Cloudflare D1 Database**: All feedback is stored persistently in SQLite database
- **Survives Server Restarts**: Data remains intact across deployments and restarts
- **Efficient Queries**: Indexed columns for fast filtering, sorting, and searching
- **Fallback Support**: Gracefully falls back to in-memory storage if database is unavailable

### 🎯 Supported Sources
- **Customer Support** - Support tickets and inquiries
- **Discord** - Community messages and discussions
- **GitHub** - Issues, feature requests, and bug reports
- **Twitter/X** - Social media posts and mentions
- **Email** - Direct email feedback
- **Community Forum** - Forum posts and discussions

## 🏗️ Architecture

### Cloudflare Products Used

This prototype uses **3 Cloudflare Developer Platform products**:

1. **Cloudflare Workers** (Runtime)
   - **Why:** Serverless edge computing platform that provides global distribution, zero cold starts, and automatic scaling. Perfect for building APIs and serving static assets without managing infrastructure. Workers handle all backend logic, API endpoints, and serve the frontend dashboard.

2. **Cloudflare D1** (Database)
   - **Why:** Serverless SQLite database that provides persistent storage without database management overhead. D1 integrates seamlessly with Workers, offers automatic backups, and scales automatically. Essential for storing feedback data persistently across deployments and server restarts.

3. **Cloudflare Workers AI** (AI Inference)
   - **Why:** Edge AI platform that runs Llama models directly on Cloudflare's network, eliminating the need for external AI APIs or API keys. Provides low-latency AI inference, no rate limits, and integrates natively with Workers. Enables contextual analysis using Meta's Llama 3.1 models without additional infrastructure.

### Technology Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Runtime** | Cloudflare Workers | Serverless edge computing platform |
| **Database** | Cloudflare D1 (SQLite) | Persistent storage for feedback data |
| **AI Models** | Cloudflare Workers AI | Llama 3.1 models for analysis |
| **Frontend** | Vanilla HTML/CSS/JavaScript | Lightweight, fast-loading dashboard |
| **API** | RESTful endpoints | JSON-based API for data operations |
| **Deployment** | Wrangler CLI | Cloudflare deployment tool |

### AI Models Used

| Model | Purpose | Fallback |
|-------|---------|----------|
| `@cf/meta/llama-3.1-70b-instruct` | Primary analysis & explanations | 8B model |
| `@cf/meta/llama-3.1-8b-instruct` | Validation & fallback | Rule-based |

### System Flow

```
User Input → AI Validation → Spam Check → AI Analysis → Database Storage → Dashboard Display
     ↓              ↓              ↓            ↓              ↓                ↓
  Feedback    Meaningless?    Spam?      Sentiment      D1 SQLite      Real-time UI
   Form       Detection       Skip       Themes         Storage         Updates
                            Analysis    Urgency/Value   (All records)
```

**Spam Handling:** If spam/off-topic content is detected, analysis is skipped but the record is still stored in the database with a spam flag for moderation purposes.

## 📋 Prerequisites

- **Node.js** (v18 or higher)
- **npm** (comes with Node.js)
- **Cloudflare Account** (for deployment)
- **Wrangler CLI** (installed via npm)

## 🚀 Getting Started

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/fshasan/feedback-pulse.git
cd feedback-pulse
```

2. **Install dependencies**
```bash
npm install
```

### Local Development

1. **Set up local D1 database**
```bash
npx wrangler d1 migrations apply feedback-db --local
```

**Note:** If you need to reset the database (clear all data and reapply migrations):
```bash
# Drop existing tables
npx wrangler d1 execute feedback-db --local --command "DROP TABLE IF EXISTS feedback"
npx wrangler d1 execute feedback-db --local --command "DROP TABLE IF EXISTS d1_migrations"

# Reapply migrations
npx wrangler d1 migrations apply feedback-db --local
```

Or use the reset script:
```bash
./scripts/reset-db.sh
```

2. **Start the development server**
```bash
npm run dev
```

3. **Open your browser**
```
http://localhost:8787
```

The development server will automatically reload when you make changes to the code.

**Tip:** Check out [`EXAMPLES.md`](./EXAMPLES.md) for sample feedback messages you can use to test the system, including valid feedback, spam examples, and edge cases.

### Production Deployment

1. **Create D1 database** (first time only)
```bash
npx wrangler d1 create feedback-db
```

2. **Update `wrangler.jsonc`** with your database ID
   - Copy the `database_id` from the command output
   - Update the `database_id` field in `wrangler.jsonc`

3. **Apply migrations to remote database**
```bash
npx wrangler d1 migrations apply feedback-db --remote
```

**Note:** If you need to reset the remote database:
```bash
# Drop existing tables
npx wrangler d1 execute feedback-db --remote --command "DROP TABLE IF EXISTS feedback"
npx wrangler d1 execute feedback-db --remote --command "DROP TABLE IF EXISTS d1_migrations"

# Reapply migrations
npx wrangler d1 migrations apply feedback-db --remote
```

4. **Deploy to Cloudflare Workers**
```bash
npx wrangler deploy
```

Your application will be available at: `https://feedback-pulse.<your-subdomain>.workers.dev`

## 📡 API Documentation

### Base URL
```
Production: https://feedback-pulse.<your-subdomain>.workers.dev
Local: http://localhost:8787
```

### Endpoints

#### GET `/api/feedback`
Retrieve paginated feedback with optional filters and sorting.

**Query Parameters:**
| Parameter | Type | Description | Default | Example |
|-----------|------|-------------|---------|---------|
| `page` | number | Page number (1-indexed) | `1` | `?page=2` |
| `limit` | number | Items per page | `10` | `?limit=25` |
| `source` | string | Filter by source | `all` | `?source=discord` |
| `sentiment` | string | Filter by sentiment | `all` | `?sentiment=negative` |
| `search` | string | Search in content/title | - | `?search=bug` |
| `sortBy` | string | Sort column | `timestamp` | `?sortBy=urgencyScore` |
| `sortOrder` | string | Sort direction (`asc`/`desc`) | `desc` | `?sortOrder=asc` |

**Response:**
```json
{
  "data": [
    {
      "id": "CS-001",
      "source": "support",
      "title": "API rate limiting too restrictive",
      "content": "We keep hitting rate limits...",
      "author": "sarah@company.com",
      "timestamp": "2025-01-20T10:00:00.000Z",
      "metadata": { "priority": "high" },
      "analysis": {
        "sentiment": "neutral",
        "sentimentScore": 0,
        "themes": ["API", "Features"],
        "valueScore": 6.0,
        "urgencyScore": 8.0,
        "isMeaningless": false,
        "reasoning": "AI-generated explanation..."
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "totalCount": 25,
    "totalPages": 3,
    "hasNext": true,
    "hasPrev": false
  }
}
```

#### POST `/api/feedback/save`
Save new feedback to the database.

**Request Body:**
```json
{
  "id": "NEW-1234567890",
  "source": "discord",
  "title": "Feature request",
  "content": "Would love to see dark mode support",
  "author": "user#1234",
  "timestamp": "2025-01-20T12:00:00.000Z",
  "metadata": {},
  "analysis": {
    "sentiment": "positive",
    "sentimentScore": 2,
    "themes": ["Features"],
    "valueScore": 5.5,
    "urgencyScore": 2,
    "isMeaningless": false,
    "reasoning": "..."
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Feedback saved to database",
  "id": "NEW-1234567890"
}
```

#### POST `/api/ai/validate`
Validate if feedback content is meaningful, spam, or offensive.

**Request Body:**
```json
{
  "content": "This is meaningful feedback about the product"
}
```

**Response:**
```json
{
  "isMeaningless": false,
  "isSpam": false,
  "reason": "Content appears to be meaningful feedback"
}
```

**Note:** If `isSpam` is `true`, the content will be stored in the database but no analysis will be performed.

#### POST `/api/ai/analyze`
Get comprehensive AI analysis for feedback.

**Request Body:**
```json
{
  "content": "The API is too slow and causing timeouts",
  "source": "github",
  "metadata": { "priority": "high" }
}
```

**Response:**
```json
{
  "sentiment": "negative",
  "sentimentScore": -2,
  "themes": ["Performance", "API", "Reliability"],
  "valueScore": 7.5,
  "urgencyScore": 8,
  "isUrgent": true,
  "isMeaningless": false,
  "reasoning": "The feedback expresses frustration with API performance..."
}
```

#### POST `/api/ai/explain`
Get detailed AI explanations for analysis metrics.

**Request Body:**
```json
{
  "feedback": { /* feedback object */ },
  "analysis": { /* analysis object */ }
}
```

**Response:**
```json
{
  "sentiment": "Explanation of sentiment analysis...",
  "valueScore": "Explanation of value score...",
  "urgencyScore": "Explanation of urgency score...",
  "themes": "Explanation of theme extraction...",
  "summary": "Overall assessment..."
}
```

## 🗄️ Database Schema

### `feedback` Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | TEXT (PK) | Unique identifier |
| `source` | TEXT | Feedback source (support, discord, github, etc.) |
| `title` | TEXT | Feedback title/summary |
| `content` | TEXT | Full feedback content |
| `author` | TEXT | Author identifier |
| `timestamp` | TEXT | ISO timestamp |
| `metadata` | TEXT (JSON) | Additional metadata |
| `sentiment` | TEXT | Sentiment classification |
| `sentiment_score` | REAL | Sentiment score (-3 to +3) |
| `themes` | TEXT (JSON) | Array of identified themes |
| `value_score` | REAL | Value score (0-10) |
| `urgency_score` | REAL | Urgency score (0-10) |
| `is_meaningless` | INTEGER | Boolean flag (0/1) |
| `is_spam` | INTEGER | Boolean flag (0/1) - spam/off-topic content |
| `reasoning` | TEXT | AI-generated reasoning |
| `created_at` | TEXT | Creation timestamp |

**Indexes:**
- `idx_feedback_source` on `source`
- `idx_feedback_timestamp` on `timestamp`
- `idx_feedback_sentiment` on `sentiment`
- `idx_feedback_is_spam` on `is_spam`

## 📁 Project Structure

```
feedback-pulse/
├── src/
│   └── index.js                    # Cloudflare Worker backend
│                                    # - API endpoints
│                                    # - AI integration
│                                    # - Database operations
│                                    # - Static file serving
├── public/
│   └── index.html                  # Frontend dashboard
│                                    # - Interactive UI
│                                    # - API client
│                                    # - Real-time updates
├── migrations/
│   ├── 0001_create_feedback_table.sql  # Database schema (includes is_spam)
│   └── 0002_add_is_spam_column.sql     # Migration for existing databases
├── scripts/
│   ├── setup-db.sh                 # Database setup helper
│   └── reset-db.sh                # Database reset script
├── test/
│   └── index.spec.js                # Unit tests
├── wrangler.jsonc                  # Cloudflare configuration
├── package.json                     # Dependencies & scripts
├── vitest.config.js                # Test configuration
├── README.md                        # This file
├── EXAMPLES.md                      # Feedback examples for testing
└── FRICTION_LOG.md                  # Development friction log
```

## 🔧 Configuration

### `wrangler.jsonc`

Key configuration options:

```jsonc
{
  "name": "feedback-pulse",              // Worker name
  "main": "src/index.js",                // Entry point
  "compatibility_date": "2025-09-27",   // Compatibility date
  "compatibility_flags": [
    "nodejs_compat",                     // Node.js compatibility
    "global_fetch_strictly_public"       // Global fetch
  ],
  "assets": {
    "directory": "./public"              // Static assets directory
  },
  "ai": {
    "binding": "AI"                      // AI binding name
  },
  "d1_databases": [
    {
      "binding": "DB",                   // Database binding name
      "database_name": "feedback-db",    // Database name
      "database_id": "..."               // Database UUID
    }
  ]
}
```

## 🧪 Testing

Run the test suite:

```bash
npm test
```

### Testing Feedback Examples

See [`EXAMPLES.md`](./EXAMPLES.md) for a comprehensive collection of feedback examples including:

**Valid Feedback:**
- Positive feedback (appreciation, success stories)
- Negative feedback (bugs, issues, complaints)
- Neutral feedback (feature requests, questions)
- High urgency feedback (critical issues, outages)
- Performance, security, and documentation feedback

**Spam Examples:**
- Promotional/advertising spam
- Off-topic/irrelevant content
- Cryptocurrency/investment scams
- Offensive/inappropriate content
- Phishing attempts

**Meaningless Content:**
- Repetitive patterns
- Random character sequences
- Gibberish text

**Use Cases:**
- Test spam detection accuracy
- Validate analysis quality across different feedback types
- Test edge cases and boundary conditions
- Demonstrate system capabilities
- Training and documentation purposes

Simply copy and paste examples from `EXAMPLES.md` into the feedback form to test different scenarios.

## 🐛 Troubleshooting

### Database Issues

**Problem:** `binding DB of type d1 must have a valid 'id' specified`

**Solution:**
1. Create database: `npx wrangler d1 create feedback-db`
2. Copy the `database_id` from output
3. Update `wrangler.jsonc` with the correct `database_id`
4. Restart dev server

**Problem:** Data not persisting

**Solution:**
- Ensure migrations are applied: `npx wrangler d1 migrations apply feedback-db --remote`
- Check database binding in `wrangler.jsonc`
- Verify database ID is correct

**Problem:** `table feedback has no column named is_spam`

**Solution:**
- Apply the latest migration: `npx wrangler d1 migrations apply feedback-db --local` (or `--remote`)
- Or reset database and reapply all migrations using `./scripts/reset-db.sh`

### AI Analysis Issues

**Problem:** AI analysis not working

**Solution:**
- Verify AI binding is configured in `wrangler.jsonc`
- Check Cloudflare Workers AI is enabled in your account
- The system will automatically fallback to rule-based analysis if AI is unavailable

### Deployment Issues

**Problem:** Changes not reflecting after deployment

**Solution:**
- Clear browser cache
- Hard refresh (Ctrl+Shift+R / Cmd+Shift+R)
- Verify deployment succeeded: `npx wrangler deployments list`

## 🔐 Security Considerations

- **CORS**: Currently allows all origins (`*`) - restrict in production
- **Input Validation**: All user input is validated before processing
- **SQL Injection**: Uses parameterized queries via D1 prepared statements
- **AI Rate Limiting**: Consider implementing rate limits for AI endpoints
- **Authentication**: Add authentication for production deployments

## 🚧 Future Enhancements

- [ ] User authentication and authorization
- [ ] Real-time webhook integrations for automatic feedback ingestion
- [ ] Advanced analytics and trend visualization
- [ ] Export functionality (CSV, PDF reports)
- [ ] Email notifications for high-urgency items
- [ ] Feedback annotation and resolution tracking
- [ ] Multi-language support
- [ ] Custom theme detection training
- [ ] API rate limiting and quotas
- [ ] Custom domain support
- [ ] Spam moderation dashboard
- [ ] Automated spam pattern learning

## 📝 License

MIT License - feel free to use this project for your own purposes.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📧 Support

For issues, questions, or contributions, please open an issue on [GitHub](https://github.com/fshasan/feedback-pulse/issues).

---

**Built with ❤️ using Cloudflare Workers, Workers AI, and D1**
