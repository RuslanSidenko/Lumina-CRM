'use client'

import { useState, useEffect } from 'react';
import { Task } from '../types';

interface TaskManagerProps {
  leadId: number;
  token: string;
}

export default function TaskManager({ leadId, token }: TaskManagerProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', due_at: '' });

  useEffect(() => {
    fetchTasks();
  }, [leadId]);

  const fetchTasks = async () => {
    const res = await fetch(`http://localhost:8080/api/v1/tasks?lead_id=${leadId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      setTasks(await res.json());
    }
  };

  const createTask = async () => {
    if (!newTask.title) return;
    const res = await fetch('http://localhost:8080/api/v1/tasks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        lead_id: leadId,
        agent_id: 1, // Placeholder
        title: newTask.title,
        description: '',
        due_at: newTask.due_at || new Date().toISOString(),
        status: 'pending'
      })
    });
    if (res.ok) {
      setShowAdd(false);
      setNewTask({ title: '', due_at: '' });
      fetchTasks();
    }
  };

  const toggleStatus = async (task: Task) => {
    const newStatus = task.status === 'pending' ? 'completed' : 'pending';
    const res = await fetch(`http://localhost:8080/api/v1/tasks/${task.id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ status: newStatus })
    });
    if (res.ok) fetchTasks();
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h4 className="text-lg font-semibold">Follow-up Tasks</h4>
        <button 
          onClick={() => setShowAdd(!showAdd)}
          className="text-xs text-brand-primary hover:underline"
        >
          {showAdd ? 'Cancel' : '+ Add Task'}
        </button>
      </div>

      {showAdd && (
        <div className="flex flex-col gap-3 p-4 bg-dark-bg/50 rounded-lg border border-brand-primary/30 animate-in fade-in slide-in-from-top-2">
          <input 
            className="input-field text-sm"
            placeholder="What needs to be done?"
            value={newTask.title}
            onChange={e => setNewTask({...newTask, title: e.target.value})}
          />
          <div className="flex gap-2">
            <input 
              type="datetime-local"
              className="input-field text-xs flex-1"
              value={newTask.due_at}
              onChange={e => setNewTask({...newTask, due_at: e.target.value})}
            />
            <button onClick={createTask} className="btn-primary py-1 px-4 text-xs">Save</button>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {tasks.map(t => (
          <div key={t.id} className="flex items-center gap-3 p-3 bg-dark-bg/30 rounded-lg border border-dark-border/50">
            <input 
              type="checkbox" 
              checked={t.status === 'completed'}
              onChange={() => toggleStatus(t)}
              className="w-4 h-4 rounded border-dark-border bg-transparent text-brand-primary focus:ring-brand-primary"
            />
            <div className="flex-1">
              <p className={`text-sm ${t.status === 'completed' ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                {t.title}
              </p>
              {t.due_at && (
                <p className="text-[10px] text-slate-500">
                  Due: {new Date(t.due_at).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
        ))}
        {tasks.length === 0 && !showAdd && (
          <p className="text-center text-slate-500 text-xs py-4">No tasks pending.</p>
        )}
      </div>
    </div>
  );
}
