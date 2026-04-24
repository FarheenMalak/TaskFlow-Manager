"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Target, Plus, CheckCircle2, Circle, TrendingUp, Clock, Calendar, ArrowRight, Brain, RefreshCw, Clipboard } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { generateTaskSuggestions, generatePriority } from "@/lib/gemini";
const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now - date);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString();
};

const weekDays = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

const generateCalendarDays = () => {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();

  const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
  const startingDayOfWeek = firstDayOfMonth.getDay();
  let startOffset = startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1;

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

  const calendarDays = [];

  for (let i = startOffset - 1; i >= 0; i--) {
    calendarDays.push({
      date: daysInPrevMonth - i,
      currentMonth: false,
      isToday: false,
      month: currentMonth - 1,
      year: currentYear
    });
  }

  for (let i = 1; i <= daysInMonth; i++) {
    const isToday = i === today.getDate() &&
      currentMonth === today.getMonth() &&
      currentYear === today.getFullYear();
    calendarDays.push({
      date: i,
      currentMonth: true,
      isToday,
      month: currentMonth,
      year: currentYear
    });
  }

  const remainingCells = 42 - calendarDays.length;
  for (let i = 1; i <= remainingCells; i++) {
    calendarDays.push({
      date: i,
      currentMonth: false,
      isToday: false,
      month: currentMonth + 1,
      year: currentYear
    });
  }

  return {
    days: calendarDays,
    monthName: firstDayOfMonth.toLocaleString('default', { month: 'long' }),
    year: currentYear,
    currentMonth
  };
};

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    goals: []
  });
  const [allTasks, setAllTasks] = useState([]);
  const [pendingTasks, setPendingTasks] = useState([]);
  const [completedTasks, setCompletedTasks] = useState([]);
  const [timeStats, setTimeStats] = useState({
    hourlyData: Array(24).fill(0).map((_, hour) => ({ hour, height: 0 })),
    peakHour: '00:00',
    mostProductiveDay: 'Monday'
  });
  const [calendarData, setCalendarData] = useState(generateCalendarDays());

  const [openCreateModal, setOpenCreateModal] = useState(false);
  const [createData, setCreateData] = useState({
    title: "",
    description: "",
  });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [openTodayModal, setOpenTodayModal] = useState(false);
  const [todayTasks, setTodayTasks] = useState([]);
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionLoading, setSuggestionLoading] = useState(false);
  const [weeklySummary, setWeeklySummary] = useState('');
  const [summaryLoading, setSummaryLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(() => {
      setCalendarData(generateCalendarDays());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [tasksRes, goalsRes] = await Promise.all([
        fetch('/api/tasks'),
        fetch('/api/goals')
      ]);

      const tasksData = await tasksRes.json();

      if (tasksData.success) {
        const tasks = tasksData.data || [];
        const sortedTasks = [...tasks].sort(
          (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
        );

        setAllTasks(sortedTasks);

        const pending = tasks.filter(t => t.status === 'pending');
        const completed = tasks.filter(t => t.status === 'completed');

        setPendingTasks(pending);
        setCompletedTasks(completed);

        setStats(prev => ({
          ...prev,
          totalTasks: tasks.length,
          completedTasks: completed.length,
          pendingTasks: pending.length
        }));

        generateTimeStats(tasks);
      }

    } catch (error) {
      console.error(error);
    }
  };

  const generateTimeStats = (tasks) => {
    const validTasks = tasks.filter(t => t.createdAt);
    const hourlyCount = Array(24).fill(0);
    validTasks.forEach(task => {
      const hour = new Date(task.createdAt).getHours();
      hourlyCount[hour]++;
    });

    const maxCount = Math.max(...hourlyCount, 1);
    const hourlyData = hourlyCount.map((count, hour) => ({
      hour,
      count,
      height: count / maxCount
    }));

    const peakHourIndex = hourlyCount.indexOf(maxCount);
    const peakHour = `${String(peakHourIndex).padStart(2, '0')}:00`;

    const dayCount = Array(7).fill(0);
    validTasks.forEach(task => {
      const day = new Date(task.createdAt).getDay();
      dayCount[day]++;
    });

    const daysArr = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const mostProductiveDay = daysArr[dayCount.indexOf(Math.max(...dayCount))];

    setTimeStats({
      hourlyData,
      peakHour,
      mostProductiveDay
    });
  };

  const getTodayTasks = () => {
    const today = new Date();
    const todayFiltered = allTasks.filter(task => {
      if (!task.createdAt) return false;
      const taskDate = new Date(task.createdAt);
      return (
        taskDate.getDate() === today.getDate() &&
        taskDate.getMonth() === today.getMonth() &&
        taskDate.getFullYear() === today.getFullYear()
      );
    });
    setTodayTasks(todayFiltered);
    setOpenTodayModal(true);
  };

  const createTask = async () => {
    setCreating(true);
    setCreateError("");

    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createData),
      });

      const data = await res.json();

      if (data.success) {
        setOpenCreateModal(false);
        setCreateData({ title: "", description: "" });
        fetchDashboardData();
      } else {
        setCreateError(data.error);
      }
    } catch {
      setCreateError("Something went wrong");
    } finally {
      setCreating(false);
    }
  };

  const updateTaskStatus = async (taskId) => {
    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "completed" }),
      });
      fetchDashboardData();
    } catch (error) {
      console.error("Error updating task:", error);
    }
  };

  const completionRate = stats.totalTasks > 0
    ? Math.round((stats.completedTasks / stats.totalTasks) * 100)
    : 0;

  const today = new Date();
  const todayFormatted = `${today.getDate()} ${today.toLocaleString('default', { month: 'long' })} ${today.getFullYear()}`;

  // AI Functions
  const handleGenerateSuggestions = async () => {
    if (!createData.description.trim()) return;
    setSuggestionLoading(true);
    try {
      const suggestions = await generateTaskSuggestions(createData.description);
      setAiSuggestions(suggestions);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Error generating suggestions:', error);
      setCreateError('Failed to generate suggestions');
    } finally {
      setSuggestionLoading(false);
    }
  };

  const addSuggestedTask = (task) => {
    setCreateData({
      title: task.title,
      description: task.description
    });
    setShowSuggestions(false);
    setAiSuggestions([]);
  };

  const generateWeeklyReport = async () => {
    setSummaryLoading(true);
    try {
      const response = await fetch('/api/ai/weekly-summary', {
        method: 'GET',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate summary');
      }

      if (data.success) {
        setWeeklySummary(data.data);
      } else {
        setWeeklySummary(data.message || 'No summary available');
      }

    } catch (error) {
      console.error('Error generating weekly summary:', error);
      setWeeklySummary('Failed to generate weekly summary. Please try again.');
    } finally {
      setSummaryLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-24">
      <div className="mb-8">
        <h1 className="text-3xl font-bold bg-black bg-clip-text text-transparent">
          Dashboard
        </h1>
        <p className="text-gray-500 mt-1">My tasks · Notifications</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500 text-sm font-medium">Total Tasks</span>
            <div className="w-8 h-8 rounded-xl bg-[#e9e8e6] flex items-center justify-center">
              <Target className="h-4 w-4 text-[#bbb9b5]" />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-800">{stats.totalTasks}</div>
          <div className="text-xs text-gray-400 mt-1">All tasks</div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500 text-sm font-medium">Completed</span>
            <div className="w-8 h-8 rounded-xl bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-green-600">{stats.completedTasks}</div>
          <div className="text-xs text-gray-400 mt-1">Done and dusted</div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500 text-sm font-medium">In Progress</span>
            <div className="w-8 h-8 rounded-xl bg-yellow-100 flex items-center justify-center">
              <Circle className="h-4 w-4 text-yellow-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-yellow-600">{stats.pendingTasks}</div>
          <div className="text-xs text-gray-400 mt-1">Need attention</div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500 text-sm font-medium">Completion</span>
            <div className="w-8 h-8 rounded-xl bg-[#e0d5b6] flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-[#68530e]" />
            </div>
          </div>
          <div className="text-2xl font-bold text-[#68530e]">{completionRate}%</div>
          <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
            <div className="bg-[#68530e] h-1.5 rounded-full" style={{ width: `${completionRate}%` }}></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">
              {calendarData.monthName} {calendarData.year}
            </h2>
            <Calendar className="h-5 w-5 text-gray-400" />
          </div>

          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {weekDays.map((day, idx) => (
              <div key={idx} className="text-xs font-medium text-gray-400 py-1">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1 text-center">
            {calendarData.days.map((day, idx) => (
              <div
                key={idx}
                className={`
                   py-2 text-sm rounded-lg transition-colors
                   ${day.currentMonth ? 'text-gray-700 hover:bg-gray-50' : 'text-gray-300'}
                   ${day.isToday ? 'bg-[#f2de37] text-[#68530e] border border-[#68530e] font-semibold relative' : ''}
                   ${!day.isToday && day.currentMonth && day.date === 15 ? 'border border-gray-200' : ''}
                 `}
              >
                {day.date}
                {day.isToday && (
                  <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-500"></div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#f2de37]"></div>
              <span className="text-xs text-gray-500">Today, {todayFormatted}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={getTodayTasks}
              className="text-[#68530e] bg-[#f2de37] text-xs h-7"
            >
              View Schedule
            </Button>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Task Overview</h2>
            <TrendingUp className="h-5 w-5 text-gray-400" />
          </div>

          <div className="flex flex-col items-center justify-center">
            <div className="relative w-36 h-36">
              <svg className="w-full h-full" viewBox="0 0 36 36">
                <circle
                  cx="18"
                  cy="18"
                  r="15.9155"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="3"
                />
                <circle
                  cx="18"
                  cy="18"
                  r="15.9155"
                  fill="none"
                  stroke="#68530e"
                  strokeWidth="3"
                  strokeDasharray={`${completionRate}, 100`}
                  strokeLinecap="round"
                />
                <circle
                  cx="18"
                  cy="18"
                  r="15.9155"
                  fill="none"
                  stroke="#f2de37"
                  strokeWidth="3"
                  strokeDasharray={`${stats.pendingTasks > 0 ? (100 - completionRate) : 0}, 100`}
                  strokeLinecap="round"
                  strokeDashoffset={`-${completionRate}`}
                />
              </svg>
            </div>

            <div className="flex justify-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#68530e]"></div>
                <span className="text-xs text-gray-600">Completed</span>
                <span className="text-xs font-semibold text-gray-800">{stats.completedTasks}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#f2de37]"></div>
                <span className="text-xs text-gray-600">Pending</span>
                <span className="text-xs font-semibold text-gray-800">{stats.pendingTasks}</span>
              </div>
            </div>

            <p className="text-center text-sm text-gray-500 mt-3">
              {completionRate}% completed
            </p>
          </div>
        </div>
      </div>

      {/* Weekly Summary Section */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Weekly Summary</h2>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={generateWeeklyReport}
              disabled={summaryLoading}
              className="text-[#68530e]"
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${summaryLoading ? 'animate-spin' : ''}`} />
              {summaryLoading ? 'Generating...' : 'Generate Summary'}
            </Button>
          </div>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          {weeklySummary ? (
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{weeklySummary}</p>
          ) : (
            <p className="text-sm text-gray-600 italic">
              {stats.completedTasks > 0
                ? 'Click "Generate Summary" to get AI-powered insights about your completed tasks from the last 7 days.'
                : 'Complete some tasks to generate your weekly summary.'}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-1 gap-5">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">My tasks ({stats.totalTasks})</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/tasks')}
              className="text-white bg-[#68530e]"
            >
              View All <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </div>

          <div className="space-y-3">
            {allTasks.length === 0 ? (
              <div className="text-center py-6 text-gray-400">
                <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No tasks created yet</p>
                <Button
                  variant="link"
                  onClick={() => setOpenCreateModal(true)}
                  className="text-purple-600 mt-2"
                >
                  Create your first task
                </Button>
              </div>
            ) : (
              allTasks.slice(0, 5).map((task, idx) => (
                <div key={task._id || idx} className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0">
                  {task.status === 'completed' ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-[#f2de37] mt-0.5 flex-shrink-0"></div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${task.status === 'completed' ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                      {task.title}
                    </p>
                    {task.description && (
                      <p className="text-xs text-gray-400 line-clamp-1 mt-0.5">{task.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-1">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-gray-300" />
                        <span className="text-xs text-gray-400">{formatDate(task.createdAt)}</span>
                      </div>
                      {task.status === 'pending' && (
                        <span className="text-xs px-2 py-0.5 bg-yellow-50 text-yellow-600 rounded-full">Priority</span>
                      )}
                    </div>
                  </div>
                  {task.status === 'pending' && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => updateTaskStatus(task._id)}
                      className="bg-[#f2de37] text-[#68530e] h-7 px-2 text-xs"
                    >
                      Mark done
                    </Button>
                  )}
                </div>
              ))
            )}
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setOpenCreateModal(true)}
            className="w-full mt-4 text-[#68530e] border border-dashed border-gray-200 rounded-xl"
          >
            <Plus className="h-4 w-4 mr-1" /> Add task
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-800">Pending Tasks</h2>
                <p className="text-xs text-gray-400">Highest priority first</p>
              </div>
              <div className="w-6 h-6 rounded-full bg-yellow-100 flex items-center justify-center">
                <Circle className="h-3 w-3 text-yellow-600" />
              </div>
            </div>
            <div className="space-y-2">
              {pendingTasks.length === 0 ? (
                <div className="text-center py-6 text-gray-400">
                  <p className="text-sm">No pending tasks </p>
                </div>
              ) : (
                pendingTasks.slice(0, 3).map((task, idx) => (
                  <div key={task._id || idx} className="flex items-start gap-3 p-3 rounded-xl bg-yellow-50/30 border border-yellow-100">
                    <div className="w-5 h-5 rounded-full border-2 border-yellow-400 mt-0.5"></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800">{task.title}</p>
                      <p className="text-xs text-gray-500 line-clamp-1">{task.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Calendar className="h-3 w-3 text-gray-400" />
                        <span className="text-xs text-gray-400">Created {formatDate(task.createdAt)}</span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => updateTaskStatus(task._id)}
                      className="text-white bg-[#68530e] h-7 px-2"
                    >
                      Complete
                    </Button>
                  </div>
                ))
              )}
            </div>
            {pendingTasks.length > 3 && (
              <Button variant="link" className="text-[#68530e] text-sm mt-2 w-full" onClick={() => router.push('/tasks')}>
                View all {pendingTasks.length} pending tasks →
              </Button>
            )}
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-800">Completed Tasks</h2>
                <p className="text-xs text-gray-400">Recently completed</p>
              </div>
              <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="h-3 w-3 text-green-600" />
              </div>
            </div>
            <div className="space-y-2">
              {completedTasks.length === 0 ? (
                <div className="text-center py-6 text-gray-400">
                  <p className="text-sm">No completed tasks yet</p>
                </div>
              ) : (
                completedTasks.slice(0, 3).map((task, idx) => (
                  <div key={task._id || idx} className="flex items-start gap-3 p-3 rounded-xl bg-green-50/30 border border-green-100">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-500 line-through">{task.title}</p>
                      <p className="text-xs text-gray-400 line-clamp-1">{task.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock className="h-3 w-3 text-gray-300" />
                        <span className="text-xs text-gray-400">Completed {formatDate(task.updatedAt)}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* AI Suggest Tasks Modal */}
      <Dialog open={openCreateModal} onOpenChange={setOpenCreateModal}>
        <DialogContent className="bg-white rounded-xl shadow-xl max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-center text-2xl font-bold">Create Task</DialogTitle>
          </DialogHeader>

          <input
            className="w-full border border-gray-200 p-3 rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-[#504216]"
            placeholder="Task title *"
            value={createData.title}
            onChange={(e) => setCreateData({ ...createData, title: e.target.value })}
          />

          <textarea
            className="w-full border border-gray-200 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#504216]"
            placeholder="Description (optional)"
            rows={4}
            value={createData.description}
            onChange={(e) => setCreateData({ ...createData, description: e.target.value })}
          />

          {/* AI Suggestions Section */}
          {createData.description && (
            <div className="mb-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">AI Suggestions</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleGenerateSuggestions}
                  disabled={suggestionLoading}
                  className="text-xs"
                >
                  {suggestionLoading ? (
                    <>
                      <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Brain className="h-3 w-3 mr-1" />
                      Generate
                    </>
                  )}
                </Button>
              </div>
              {aiSuggestions.length > 0 && (
                <div className="space-y-2">
                  {aiSuggestions.map((suggestion, idx) => (
                    <div
                      key={idx}
                      className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                      onClick={() => addSuggestedTask(suggestion)}
                    >
                      <p className="text-sm font-medium">{suggestion.title}</p>
                      <p className="text-xs text-gray-500">{suggestion.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {createError && (
            <p className="text-red-500 text-sm mt-2">{createError}</p>
          )}

          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setOpenCreateModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={createTask}
              disabled={creating || !createData.title.trim()}
              className="bg-[#504216] hover:bg-[#443a1a] text-white"
            >
              {creating ? "Creating..." : "Create Task"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      {/* Today's Tasks Dialog */}
      <Dialog open={openTodayModal} onOpenChange={setOpenTodayModal}>
        <DialogContent className="bg-white rounded-xl shadow-xl max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-center text-2xl font-bold">
              Today's Schedule
            </DialogTitle>
          </DialogHeader>

          <div className="mt-4">
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-100">
              <Calendar className="h-5 w-5 text-[#68530e]" />
              <span className="text-sm font-medium text-gray-600">
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            </div>

            {todayTasks.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 className="h-8 w-8 text-gray-300" />
                </div>
                <p className="text-gray-500 font-medium">No tasks scheduled for today</p>
                <p className="text-sm text-gray-400 mt-1">Take a break or plan for tomorrow!</p>
                <Button
                  onClick={() => {
                    setOpenTodayModal(false);
                    setOpenCreateModal(true);
                  }}
                  variant="outline"
                  className="mt-4 border-[#68530e] text-[#68530e] hover:bg-[#f2de37]"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Create a task
                </Button>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {todayTasks.map((task, idx) => (
                  <div
                    key={task._id || idx}
                    className="flex items-start gap-3 p-3 rounded-xl border border-gray-100 hover:border-[#f2de37] transition-all bg-white"
                  >
                    {task.status === 'completed' ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    ) : (
                      <Clipboard className="w-5 h-5 rounded-full border-2 border-[#f2de37] mt-0.5 flex-shrink-0"></Clipboard>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm font-medium ${task.status === 'completed' ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                          {task.title}
                        </p>
                        {task.status === 'pending' && (
                          <span className="text-xs px-2 py-0.5 bg-yellow-50 text-yellow-600 rounded-full whitespace-nowrap">
                            Pending
                          </span>
                        )}
                      </div>
                      {task.description && (
                        <p className="text-xs text-gray-500 mt-1">{task.description}</p>
                      )}
                      <div className="flex items-center gap-3 mt-2">
                        <div className="flex items-center gap-1">
                        </div>
                      </div>
                      {task.status === 'pending' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            updateTaskStatus(task._id);
                            // Refresh today's tasks after updating
                            setTimeout(() => {
                              const updatedTasks = allTasks.filter(t => {
                                if (!t.createdAt) return false;
                                const taskDate = new Date(t.createdAt);
                                const today = new Date();
                                return (
                                  taskDate.getDate() === today.getDate() &&
                                  taskDate.getMonth() === today.getMonth() &&
                                  taskDate.getFullYear() === today.getFullYear()
                                );
                              });
                              setTodayTasks(updatedTasks);
                            }, 500);
                          }}
                          className="bg-[#f2de37] text-[#68530e] h-7 px-2 text-xs mt-2 w-full"
                        >
                          Mark as Complete
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setOpenTodayModal(false)}>
                Close
              </Button>
              {todayTasks.length > 0 && (
                <Button
                  onClick={() => {
                    setOpenTodayModal(false);
                    router.push('/tasks');
                  }}
                  className="bg-[#68530e] hover:bg-[#504216] text-white pt-1"
                >
                  View All Tasks
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}