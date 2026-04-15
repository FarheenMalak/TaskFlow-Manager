"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RotateCcw, Trash2, CheckCircle2, Inbox, Loader2, CalendarCheck } from "lucide-react";
import { toast } from "react-toastify";

export default function CompletedTasksPage() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionTaskId, setActionTaskId] = useState(null);

  useEffect(() => {
    fetchCompletedTasks();
  }, []);

  const fetchCompletedTasks = async () => {
    try {
      const response = await fetch('/api/tasks?status=completed');
      const data = await response.json();
      if (data.success) {
        setTasks(data.data);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateTaskStatus = async (id, status) => {
    setActionTaskId(id);
    try {
      const response = await fetch(`/api/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });

      if (response.ok) {
        await fetchCompletedTasks();
      }
    } catch (error) {
      console.error('Error updating task:', error);
    } finally {
      setActionTaskId(null);
    }
  };

  const deleteTask = async (id) => {
      setActionTaskId(id);
      try {
        const response = await fetch(`/api/tasks/${id}`, {
          method: 'DELETE'
        });

        if (response.ok) {
          toast.success('Task Deleted Successfully')
          await fetchCompletedTasks();
        }
      } catch (error) {
        console.error('Error deleting task:', error);
      } finally {
        setActionTaskId(null);
      }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 text-gray-600 animate-spin mx-auto" />
          <p className="text-gray-500">Loading completed tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-10 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-10">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-4xl font-bold text-gray-800 tracking-tight">
                  Completed Tasks
                </h1>
                <p className="text-gray-500 mt-1 flex items-center gap-2">
                  <CalendarCheck className="w-4 h-4" />
                  Tasks you've successfully completed
                </p>
              </div>
            </div>
          </div>
        </div>

        {tasks.length === 0 ? (
          <Card className="border-0 shadow-xl rounded-2xl bg-white">
            <CardContent className="text-center py-16">
              <div className="flex flex-col items-center gap-4">
                <div className="p-4 bg-gray-100 rounded-full">
                  <Inbox className="w-12 h-12 text-gray-400" />
                </div>
                <div>
                  <p className="text-gray-600 font-medium text-lg">No completed tasks yet</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Complete tasks to see them appear here
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <div className="border border-black rounded-xl p-4 mb-2">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#68530e] rounded-full">
                  <CheckCircle2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-black">Great job!</p>
                  <p className="text-xs text-black">
                    You've completed {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}. Keep up the momentum!
                  </p>
                </div>
              </div>
            </div>

            {tasks.map((task, index) => (
              <Card
                key={task._id}
                className="group bg-white border border-gray-200 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden"
                style={{
                  animation: `fadeInUp 0.3s ease-out ${index * 0.05}s forwards`,
                  opacity: 0,
                  transform: 'translateY(20px)'
                }}
              >
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#68530e]"></div>

                <CardHeader className="pb-2 pt-5 px-6">
                  <CardTitle className="flex flex-wrap justify-between items-start gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="flex-shrink-0">
                        <CheckCircle2 className="w-5 h-5 text-black" />
                      </div>
                      <span className="line-through text-gray-500 font-medium text-lg break-words">
                        {task.title}
                      </span>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateTaskStatus(task._id, 'pending')}
                        disabled={actionTaskId === task._id}
                        className="bg-[#f2de37] border-gray-300 hover:border-amber-400 hover:bg-amber-50 text-black rounded-lg transition-all duration-200"
                      >
                        {actionTaskId === task._id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                        ) : (
                          <RotateCcw className="h-3.5 w-3.5 mr-1" />
                        )}
                        Reopen
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteTask(task._id)}
                        disabled={actionTaskId === task._id}
                        className=" rounded-lg transition-all duration-200 border-0"
                      >
                        <Trash2 className="h-3.5 w-3.5 text-red-700" />
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-2 pb-5 px-6">
                  <p className="line-through text-gray-400 text-sm leading-relaxed pl-8">
                    {task.description}
                  </p>
                  <div className="flex items-center gap-3 mt-3 pl-8">
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                      <p className="text-xs text-black font-medium">Completed</p>
                    </div>
                    <span className="text-xs text-gray-400">•</span>
                    <p className="text-xs text-gray-400">
                      {new Date(task.updatedAt || task.completedAt || Date.now()).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}