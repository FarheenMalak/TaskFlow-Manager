# TaskFlow Manager - Next.js Full Stack Application

A modern full-stack task management application built with Next.js 14, MongoDB, and Google's Gemini AI.

## Features

###  AI-Powered Features
- **AI Task Suggestions** - Generate relevant, actionable tasks from short descriptions using Gemini API
- **AI Weekly Summary** - Generate intelligent summaries of completed tasks from the last 7 days

###  Core Features
- **Create Tasks** - Add new tasks with title, description, and optional AI suggestions
- **Update Tasks** - Edit task details or mark tasks complete/incomplete
- **Delete Tasks** - Remove unwanted tasks with confirmation
- **Task Dashboard** - Visual overview with statistics and progress charts
- **Calendar View** - Track tasks by date with today's schedule view
- **Filter Tasks** - View All / Pending / Completed tasks
- **Priority Badges** - priority indicators (High, Medium, Low)
- **Time Analytics** - View productivity patterns and peak activity hours
- **Responsive Design** - Works seamlessly on desktop, tablet, and mobile
- **Real-time Updates** - Instant UI updates without page refresh

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 14 (App Router) |
| Database | MongoDB with Mongoose |
| AI API | Google Gemini API |
| Styling | Tailwind CSS |
| Icons | Lucide React |
| Notifications | React Toastify |
| Language | JavaScript |

## Project Structure

```
TaskFlow-Manager/
├── app/
│   ├── api/
│   │   ├── ai/
│   │   │   ├── suggest-tasks/
│   │   │   └── weekly-summary/
│   │   └── tasks/
│   ├── dashboard/
│   ├── tasks/
│   ├── layout.js
│   └── page.js
├── components/
│   └── ui/
├── lib/
│   ├── gemini.js
│   └── mongodb.js
├── models/
│   └── Task.js
└── public/
```

## Prerequisites

- Node.js 18+
- npm / yarn / pnpm
- Git
- MongoDB Atlas account (free tier works)
- Google Gemini API key (free tier available)

## Getting Started

### 1. Clone Repository
```bash
git clone https://github.com/FarheenMalak/TaskFlow-Manager.git
cd TaskFlow-Manager
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Setup

Create `.env.local` file:
```env
MONGODB_URI="mongodb+srv://username:password@cluster.mongodb.net/taskflow"
GEMINI_API_KEY="your-gemini-api-key-here"
```

**Get Gemini API Key:**
1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Sign in and click "Get API key"
3. Copy the API key

**Setup MongoDB Atlas:**
1. Create account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create free cluster
3. Create database user
4. Add IP address to whitelist
5. Get connection string

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000)

### 5. Build for Production
```bash
npm run build
npm start
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tasks` | Get all tasks |
| GET | `/api/tasks?status=pending` | Filter tasks by status |
| POST | `/api/tasks` | Create a new task |
| PUT | `/api/tasks/:id` | Update a task |
| DELETE | `/api/tasks/:id` | Delete a task |
| POST | `/api/ai/suggest-tasks` | Generate AI task suggestions |
| GET | `/api/ai/weekly-summary` | Generate weekly summary |

## Database Schema

```javascript
const TaskSchema = {
  title: String,     
  description: String, 
  status: String,   
  priority: String,  
  createdAt: Date,
  updatedAt: Date
}
```

## Deployment on Vercel

1. Push code to GitHub
2. Go to [Vercel](https://vercel.com)
3. Click "New Project" and import repository
4. Add environment variables (`MONGODB_URI`, `GEMINI_API_KEY`)
5. Click "Deploy"

## Troubleshooting

**MongoDB Connection Error**
- Verify IP is whitelisted in MongoDB Atlas
- Check username/password in connection string
- Ensure database user has permissions

**Gemini API Error**
- Confirm API key is valid
- Check free tier quota
- Verify model name is correct

**Build Errors**
- Clear `.next` folder and node_modules
- Run `npm install` again
- Check Node.js version (18+ required)

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## Future Enhancements

- [ ] User authentication
- [ ] Task categories and tags
- [ ] Due dates and reminders
- [ ] Team collaboration
- [ ] Dark mode
- [ ] Mobile app
- [ ] File attachments
- [ ] Recurring tasks
- [ ] Export data (CSV/PDF)
- [ ] Email notifications

## License

MIT License

## Contact

Farheen Malak

Project Link: [https://github.com/FarheenMalak/TaskFlow-Manager](https://github.com/FarheenMalak/TaskFlow-Manager)