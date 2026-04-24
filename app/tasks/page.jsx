"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CheckCircle,
  Trash2,
  Edit2,
  Calendar,
  Plus,
  Brain,
  Copy,
  Check,
  AlertCircle,
  Sparkles,
  Loader2
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "react-toastify";

export default function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [editData, setEditData] = useState({
    title: "",
    description: "",
  });
  const [editSuggestions, setEditSuggestions] = useState([]);
  const [loadingEditSuggestions, setLoadingEditSuggestions] = useState(false);
  const [copiedSuggestionId, setCopiedSuggestionId] = useState(null);

  const [openCreateModal, setOpenCreateModal] = useState(false);
  const [createData, setCreateData] = useState({
    title: "",
    description: "",
  });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const res = await fetch("/api/tasks?status=pending");
      const data = await res.json();
      if (data.success) setTasks(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateTaskStatus = async (id, status) => {
    await fetch(`/api/tasks/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    fetchTasks();
  };

  const generateWeeklyReport = async () => {
    try {
      const res = await fetch('/api/ai/weekly-summary');
      const data = await res.json();

      if (data.success) {
        toast(data.data);
      } else {
        toast(data.message || 'No summary available');
      }
    } catch (error) {
      toast.error('Failed to generate weekly summary');
    }
  };

  const handleGenerateSuggestions = async (isForEdit = false) => {
    const description = isForEdit ? editData.description : createData.description;

    if (!description || description.trim() === "") {
      toast.warning('Please enter a description first to generate suggestions');
      return;
    }

    if (isForEdit) {
      setLoadingEditSuggestions(true);
    } else {
      setLoadingSuggestions(true);
    }

    try {
      const res = await fetch("/api/ai/suggest-tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ description: description }),
      });

      const data = await res.json();
      console.log('API Response:', data);

      if (data.success && Array.isArray(data.data) && data.data.length > 0) {
        if (isForEdit) {
          setEditSuggestions(data.data);
          toast.success(`Generated ${data.data.length} suggestions for editing!`);
        } else {
          setAiSuggestions(data.data);
          toast.success(`Generated ${data.data.length} suggestions!`);
        }
      } else {
        toast.warning('No suggestions generated. Try a more detailed description.');
        if (isForEdit) {
          setEditSuggestions([]);
        } else {
          setAiSuggestions([]);
        }
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate suggestions');
    } finally {
      if (isForEdit) {
        setLoadingEditSuggestions(false);
      } else {
        setLoadingSuggestions(false);
      }
    }
  };

  const copyToClipboard = async (text, id) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedSuggestionId(id);
      toast.success('Copied to clipboard!');
      setTimeout(() => setCopiedSuggestionId(null), 2000);
    } catch (err) {
      toast.error('Failed to copy');
    }
  };

  const applySuggestion = (suggestion, isForEdit = false) => {
    if (isForEdit) {
      setEditData({
        title: suggestion.title,
        description: suggestion.description,
      });
      toast.success('Suggestion applied to edit form!');
    } else {
      setCreateData({
        title: suggestion.title,
        description: suggestion.description,
      });
      toast.success('Suggestion applied to create form!');
    }
  };

  const deleteTask = async (id) => {
    if (!confirm("Delete this task?")) return;
    await fetch(`/api/tasks/${id}`, { method: "DELETE" });
    toast.success('Task Deleted successfully');
    fetchTasks();
  };

  const updateTask = async () => {
    if (!editData.title.trim()) {
      toast.error('Title is required');
      return;
    }

    await fetch(`/api/tasks/${editingTask}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editData),
    });
    setEditingTask(null);
    setEditSuggestions([]);
    toast.success('Task Edited successfully');
    fetchTasks();
  };

  const createTask = async () => {
    if (!createData.title.trim()) {
      setCreateError("Title is required");
      return;
    }

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
        setAiSuggestions([]);
        toast.success('Task Created successfully');
        fetchTasks();
      } else {
        setCreateError(data.error);
      }
    } catch {
      setCreateError("Something went wrong");
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center mt-20">
        <Loader2 className="w-8 h-8 animate-spin text-[#68530e]" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-[#68530e] to-[#504216] bg-clip-text text-transparent">
          My Tasks
        </h1>
        <p className="text-gray-500 mt-2">Manage and organize your daily tasks</p>
      </div>

      {tasks.length === 0 ? (
        <Card className="rounded-2xl shadow-xl text-center py-12">
          <CardContent>
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 bg-gray-50 rounded-full">
                <CheckCircle className="w-12 h-12 text-gray-400" />
              </div>
              <p className="text-gray-500">No tasks found</p>
              <Button
                onClick={() => setOpenCreateModal(true)}
                className="bg-[#68530e] hover:bg-[#504216] text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Task
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tasks.map((task) => (
            <div
              key={task._id}
              className="bg-white p-5 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col justify-between border border-gray-100 hover:border-[#68530e]/20"
            >
              <div>
                <h3 className="font-semibold text-lg text-gray-800 line-clamp-2">
                  {task.title}
                </h3>
                <p className="text-sm text-gray-500 mt-2 line-clamp-3">
                  {task.description || "No description"}
                </p>
              </div>

              <div className="flex justify-between mt-4 text-xs text-gray-400">
                <span className="capitalize px-2 py-1 rounded-full bg-gray-50">
                  {task.status}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(task.createdAt).toLocaleDateString()}
                </span>
              </div>

              {task.status === 'pending' && task.priority && (
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs px-2 py-0.5 bg-yellow-50 text-yellow-600 rounded-full font-medium">
                    Priority
                  </span>
                  <span className="text-xs font-semibold text-gray-700">
                    {task.priority}
                  </span>
                </div>
              )}

              <div className="flex justify-end gap-3 mt-4 pt-3 border-t border-gray-100">
                <button
                  onClick={() => updateTaskStatus(task._id, "completed")}
                  className="hover:scale-110 transition-transform"
                  title="Mark as complete"
                >
                  <CheckCircle className="text-green-600 w-5 h-5 hover:text-green-700" />
                </button>
                <button
                  onClick={() => {
                    setEditingTask(task._id);
                    setEditData({
                      title: task.title,
                      description: task.description,
                    });
                    setEditSuggestions([]);
                  }}
                  className="hover:scale-110 transition-transform"
                  title="Edit task"
                >
                  <Edit2 className="text-[#f2de37] w-5 h-5 hover:text-[#e0d12e]" />
                </button>
                <button
                  onClick={() => deleteTask(task._id)}
                  className="hover:scale-110 transition-transform"
                  title="Delete task"
                >
                  <Trash2 className="text-red-600 w-5 h-5 hover:text-red-700" />
                </button>
              </div>
            </div>
          ))}

          <div
            onClick={() => setOpenCreateModal(true)}
            className="cursor-pointer border-2 border-dashed border-gray-300 rounded-2xl flex flex-col items-center justify-center p-6 hover:border-[#68530e] hover:bg-gray-50 transition-all duration-300 group"
          >
            <div className="p-3 bg-gray-50 rounded-full group-hover:bg-[#68530e]/10 transition-colors">
              <Plus className="w-8 h-8 text-gray-400 group-hover:text-[#68530e]" />
            </div>
            <p className="text-gray-500 mt-3 group-hover:text-[#68530e]">Create New Task</p>
          </div>
        </div>
      )}

      {/* Edit Task Dialog */}
      <Dialog open={!!editingTask} onOpenChange={() => {
        setEditingTask(null);
        setEditSuggestions([]);
      }}>
        <DialogContent className="bg-white rounded-xl shadow-xl max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-center text-2xl font-bold bg-gradient-to-r from-[#68530e] to-[#504216] bg-clip-text text-transparent">
              Edit Task
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <input
              className="w-full border border-gray-200 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#68530e] focus:border-transparent transition-all"
              placeholder="Task Title *"
              value={editData.title}
              onChange={(e) =>
                setEditData({ ...editData, title: e.target.value })
              }
            />

            <textarea
              className="w-full border border-gray-200 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#68530e] focus:border-transparent transition-all"
              placeholder="Task Description"
              rows={3}
              value={editData.description}
              onChange={(e) =>
                setEditData({ ...editData, description: e.target.value })
              }
            />

            <Button
              onClick={() => handleGenerateSuggestions(true)}
              disabled={loadingEditSuggestions}
              className="w-full bg-[#68530e] text-white"
            >
              {loadingEditSuggestions ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating Suggestions...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate AI Suggestions for Edit
                </>
              )}
            </Button>

            {editSuggestions.length > 0 && (
              <div className="space-y-3 mt-4">
                <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                  <Brain className="w-4 h-4 text-[#68530e]" />
                  AI Suggestions ({editSuggestions.length})
                </h3>
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {editSuggestions.map((suggestion, idx) => (
                    <div
                      key={idx}
                      className="border border-purple-100 rounded-lg p-3 hover:border-purple-300 hover:bg-purple-50/30 transition-all group"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex-1 cursor-pointer" onClick={() => applySuggestion(suggestion, true)}>
                          <h4 className="font-medium text-gray-800 text-sm">{suggestion.title}</h4>
                          <p className="text-xs text-gray-500 mt-1">{suggestion.description}</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => copyToClipboard(`${suggestion.title}\n${suggestion.description}`, `edit-${idx}`)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Copy suggestion"
                          >
                            {copiedSuggestionId === `edit-${idx}` ? (
                              <Check className="w-4 h-4 text-green-600" />
                            ) : (
                              <Copy className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => {
              setEditingTask(null);
              setEditSuggestions([]);
            }}>
              Cancel
            </Button>
            <Button onClick={updateTask} className="bg-[#68530e] hover:bg-[#504216] text-white">
              Update Task
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Task Dialog */}
      <Dialog open={openCreateModal} onOpenChange={(open) => {
        setOpenCreateModal(open);
        if (!open) {
          setCreateData({ title: "", description: "" });
          setAiSuggestions([]);
          setCreateError("");
        }
      }}>
        <DialogContent className="bg-white rounded-xl shadow-xl max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-center text-2xl font-bold bg-gradient-to-r from-[#68530e] to-[#504216] bg-clip-text text-transparent">
              Create New Task
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <input
              className="w-full border border-gray-200 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#68530e] focus:border-transparent transition-all"
              placeholder="Task Title *"
              value={createData.title}
              onChange={(e) =>
                setCreateData({ ...createData, title: e.target.value })
              }
            />

            <textarea
              className="w-full border border-gray-200 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#68530e] focus:border-transparent transition-all"
              placeholder="Task Description (For AI suggestions, provide a detailed description)"
              rows={3}
              value={createData.description}
              onChange={(e) =>
                setCreateData({ ...createData, description: e.target.value })
              }
            />

            {createError && (
              <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-2 rounded-lg">
                <AlertCircle className="w-4 h-4" />
                <span>{createError}</span>
              </div>
            )}

            <div className="flex gap-2 items-center justify-center ">
              <Button
                onClick={() => handleGenerateSuggestions(false)}
                disabled={loadingSuggestions || !createData.description.trim()}
                className="flex-1 bg-[#68530e] hover:bg-[#68530e] text-white items-center justify-center"
              >
                {loadingSuggestions ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Brain className="w-4 h-4 mr-2" />
                    Generate AI Suggestions
                  </>
                )}
              </Button>
            </div>

            {!createData.description.trim() && (
              <p className="text-xs text-gray-400 text-center">
                💡 Enter a description to get AI-powered task suggestions
              </p>
            )}

            {aiSuggestions.length > 0 && (
              <div className="space-y-3 mt-2">
                <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-yellow-500" />
                  AI Task Suggestions ({aiSuggestions.length})
                </h3>
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {aiSuggestions.map((suggestion, idx) => (
                    <div
                      key={idx}
                      className="border border-purple-100 rounded-lg p-3 hover:border-purple-300 hover:bg-purple-50/30 transition-all group cursor-pointer"
                      onClick={() => applySuggestion(suggestion, false)}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-800 text-sm">{suggestion.title}</h4>
                          <p className="text-xs text-gray-500 mt-1">{suggestion.description}</p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard(`${suggestion.title}\n${suggestion.description}`, `create-${idx}`);
                          }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Copy suggestion"
                        >
                          {copiedSuggestionId === `create-${idx}` ? (
                            <Check className="w-4 h-4 text-green-600" />
                          ) : (
                            <Copy className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                          )}
                        </button>
                      </div>
                      <div className="mt-2">
                        <span className="text-xs text-[#68530e] font-medium">
                          Click to apply this suggestion
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => {
              setOpenCreateModal(false);
              setAiSuggestions([]);
              setCreateData({ title: "", description: "" });
            }}>
              Cancel
            </Button>
            <Button
              onClick={createTask}
              disabled={creating || !createData.title.trim()}
              className="bg-[#68530e] hover:bg-[#504216] text-white"
            >
              {creating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Task'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}