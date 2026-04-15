"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CheckCircle,
  Trash2,
  Edit2,
  Calendar,
  Plus
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

  const [editingTask, setEditingTask] = useState(null);
  const [editData, setEditData] = useState({
    title: "",
    description: "",
  });

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

  const deleteTask = async (id) => {
    if (!confirm("Delete this task?")) return;
    await fetch(`/api/tasks/${id}`, { method: "DELETE" });
    toast.success('Task Deleted successfully');
    fetchTasks();
  };

  const updateTask = async () => {
    await fetch(`/api/tasks/${editingTask}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editData),
    });
    setEditingTask(null);
    toast.success('Task Edited successfully');
    fetchTasks();
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
    return <div className="text-center mt-20">Loading...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto">

      <div className="mb-8">
        <h1 className="text-3xl font-bold">My Tasks</h1>
        <p className="text-gray-500">Manage your tasks</p>
      </div>

      {tasks.length === 0 ? (
        <Card className="rounded-2xl shadow-xl text-center py-12">
          <CardContent>
            <p className="mb-4">No tasks found</p>
            <Button onClick={() => setOpenCreateModal(true)}>
              + Create Task
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">

          {tasks.map((task) => (
            <div
              key={task._id}
              className="bg-white p-5 rounded-2xl shadow hover:shadow-xl flex flex-col justify-between"
            >
              <h3 className="font-semibold text-lg">{task.title}</h3>

              <p className="text-sm text-gray-500 mt-2">
                {task.description}
              </p>

              <div className="flex justify-between mt-4 text-xs text-gray-400">
                <span>{task.status}</span>
                <span>
                  <Calendar className="inline w-3 h-3 mr-1" />
                  {new Date(task.createdAt).toLocaleDateString()}
                </span>
              </div>

              <div className="flex justify-end gap-3 mt-4">

                <button onClick={() => updateTaskStatus(task._id, "completed")}>
                  <CheckCircle className="text-green-600 w-5 h-5" />
                </button>

                <button
                  onClick={() => {
                    setEditingTask(task._id);
                    setEditData({
                      title: task.title,
                      description: task.description,
                    });
                  }}
                >
                  <Edit2 className="text-[#f2de37] w-5 h-5" />
                </button>

                <button onClick={() => deleteTask(task._id)}>
                  <Trash2 className="text-red-600 w-5 h-5" />
                </button>

              </div>
            </div>
          ))}

          <div
            onClick={() => setOpenCreateModal(true)}
            className="cursor-pointer border-2 border-dashed rounded-2xl flex flex-col items-center justify-center p-6 hover:bg-gray-50 transition-colors"
          >
            <Plus className="w-8 h-8 mb-2 text-gray-100 bg-[#68530e] rounded-full" />
            <p className="text-gray-500">Create Task</p>
          </div>
        </div>
      )}

      <Dialog open={!!editingTask} onOpenChange={() => setEditingTask(null)}>
        <DialogContent className="bg-white rounded-xl shadow-xl h-96">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-center text-2xl font-bold">Edit Task</DialogTitle>
          </DialogHeader>

          <input
            className="w-full border border-gray-200 p-2 rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-[#68530e]"
            value={editData.title}
            onChange={(e) =>
              setEditData({ ...editData, title: e.target.value })
            }
          />

          <textarea
            className="w-full border border-gray-200 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#68530e]"
            rows={3}
            value={editData.description}
            onChange={(e) =>
              setEditData({ ...editData, description: e.target.value })
            }
          />

          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setEditingTask(null)}>
              Cancel
            </Button>
            <Button onClick={updateTask} className="bg-[#68530e] hover:bg-[#504216] text-white">
              Update
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={openCreateModal} onOpenChange={setOpenCreateModal}>
        <DialogContent className="bg-white rounded-xl shadow-xl h-96">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-center text-2xl font-bold">Create Task</DialogTitle>
          </DialogHeader>

          <input
            className="w-full border border-gray-200 p-2 rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-[#504216]"
            placeholder="Title"
            value={createData.title}
            onChange={(e) =>
              setCreateData({ ...createData, title: e.target.value })
            }
          />

          <textarea
            className="w-full border border-gray-200 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#504216]"
            placeholder="Description"
            rows={3}
            value={createData.description}
            onChange={(e) =>
              setCreateData({ ...createData, description: e.target.value })
            }
          />

          {createError && (
            <p className="text-red-500 text-sm">{createError}</p>
          )}

          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setOpenCreateModal(false)}>
              Cancel
            </Button>

            <Button onClick={createTask} disabled={creating} className="bg-[#504216] hover:bg-[#443a1a] text-white">
              {creating ? "Creating..." : "Create"}
            </Button>
          </div>

        </DialogContent>
      </Dialog>

    </div>
  );
}