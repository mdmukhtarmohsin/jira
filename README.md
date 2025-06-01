# Jira Clone with AI Sprint Negotiator & Auto Risk Analyzer

🚀 **[Live Demo - Try it now!](https://jira-sepia.vercel.app/)**

A modern project management tool inspired by Jira, enhanced with AI capabilities for intelligent sprint planning, risk detection, and automated retrospectives.

## 🚀 Features

### Core Project Management

- **Kanban Boards**: Drag-and-drop task management with customizable columns
- **Sprint Planning**: Create and manage sprints with team capacity planning
- **Backlog Management**: Organize tasks by epics, priorities, and labels
- **Team Collaboration**: Multi-team support with role-based access control
- **Real-time Updates**: Live collaboration with Supabase real-time subscriptions

### AI-Powered Enhancements

- **🤖 Sprint Negotiator**: AI suggests optimal sprint plans based on team capacity and task priorities
- **⚠️ Risk Heatmap**: Automatically identifies overloaded team members and potential blockers
- **📊 Scope Creep Detector**: Warns when sprint scope increases beyond healthy limits
- **📜 Auto Retrospectives**: Generates structured retrospective reports at sprint completion

## 🛠 Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes, Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **AI Integration**: Google Gemini API
- **Real-time**: Supabase real-time subscriptions
- **Deployment**: Vercel

## 🏗 Project Structure

\`\`\`
├── app/ # Next.js App Router pages
│ ├── api/ # API routes
│ ├── auth/ # Authentication pages
│ ├── dashboard/ # Main application pages
│ └── page.tsx # Landing page
├── components/ # Reusable UI components
│ ├── dashboard/ # Dashboard-specific components
│ ├── landing/ # Landing page components
│ └── ui/ # shadcn/ui components
├── lib/ # Utility functions and configurations
├── supabase/ # Database schema and migrations
└── types/ # TypeScript type definitions
\`\`\`

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and pnpm
- Supabase account
- Google AI Studio account (for Gemini API)

### Installation

1. **Clone the repository**
   \`\`\`bash
   git clone <repository-url>
   cd jira-clone-ai
   \`\`\`

2. **Install dependencies**
   \`\`\`bash
   pnpm install
   \`\`\`

3. **Set up environment variables**
   \`\`\`bash
   cp .env.example .env.local
   \`\`\`
   Fill in your Supabase and Gemini API credentials.

4. **Set up Supabase database**

   - Create a new Supabase project
   - Run the SQL schema from `supabase/schema.sql`
   - Configure Row Level Security policies

5. **Run the development server**
   \`\`\`bash
   pnpm run dev
   \`\`\`

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📊 Database Schema

The application uses a PostgreSQL database with the following main entities:

- **Organizations**: Top-level containers for teams and projects
- **Teams**: Groups of users working together
- **Tasks**: Individual work items with status, priority, and assignments
- **Sprints**: Time-boxed iterations containing selected tasks
- **Epics**: Large work items that group related tasks
- **Comments**: Task discussions and updates

## 🤖 AI Features

### Sprint Negotiator

Analyzes backlog tasks and team capacity to suggest optimal sprint plans:

- Considers task priorities and story point estimates
- Balances workload across team members
- Provides reasoning for recommendations

### Risk Heatmap

Identifies potential issues in real-time:

- Overloaded team members (>5 tasks or >20 story points)
- Delayed tasks past due dates
- Blocked tasks (inferred from comments)

### Scope Creep Detection

Monitors sprint changes and warns when:

- Total story points increase by >15%
- New tasks are added mid-sprint
- Scope changes impact delivery timeline

### Auto Retrospectives

Generates structured retrospective reports including:

- What went well (completed tasks, on-time delivery)
- What didn't go well (delays, blockers, scope changes)
- Action items for improvement

## 🔐 Security

- Row Level Security (RLS) policies ensure data isolation
- Organization-based access control
- Secure API routes with authentication middleware
- Environment variable protection for sensitive keys

## 📈 Performance

- Optimized database queries with proper indexing
- Real-time updates without polling
- Efficient AI API usage with caching
- Responsive design for all device sizes

## 🚀 Deployment

### Vercel Deployment

1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Environment Variables for Production

\`\`\`env
NEXT_PUBLIC_SUPABASE_URL=your_production_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_anon_key
GEMINI_API_KEY=your_gemini_api_key
\`\`\`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by Atlassian Jira's design and functionality
- Built with modern web technologies and AI capabilities
- Thanks to the open-source community for the amazing tools and libraries
