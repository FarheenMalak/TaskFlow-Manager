# 📝 TaskFlow Manager - Next.js Full Stack Application

A modern, full-stack task management application built with Next.js 14, MongoDB, and Prisma. Create, update, delete, and track your tasks with a beautiful UI.

## ✨ Features

- ✅ **Create Tasks** - Add new tasks with title, description, and priority
- 📝 **Update Tasks** - Edit task details or mark as complete/incomplete
- 🗑️ **Delete Tasks** - Remove tasks you no longer need
- 🎯 **Priority Levels** - High, Medium, Low priority with color coding
- 🔍 **Filter Tasks** - Filter by status (All, Active, Completed) and priority
- 📱 **Responsive Design** - Works perfectly on desktop, tablet, and mobile
- ⚡ **Real-time Updates** - Instant UI updates without page refresh

## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | Next.js 14 (App Router) |
| **Database** | MongoDB |
| **ORM** | Prisma with MongoDB |
| **Styling** | Tailwind CSS |
| **Deployment** | Vercel |
| **Language** | JavaScript |

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- Node.js 18.17 or later
- npm / yarn / pnpm
- Git
- MongoDB database (local or cloud)

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/FarheenMalak/TaskFlow-Manager.git
cd TaskFlow-Manager

### 2. Install Dependencies

-npm install

### 3. Set Up Environment Variables

Create a .env file in the root directory:

env
MONGODB_URI="mongodb+srv://username:password@cluster.mongodb.net/taskflow"

### 4. Run Development Server

bash
npm run dev
