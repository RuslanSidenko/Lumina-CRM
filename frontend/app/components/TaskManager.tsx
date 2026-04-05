'use client'

import { useState, useEffect } from 'react';
import { Task } from '../types';
import { API_BASE } from '../config';
import { useTranslations } from 'next-intl';

interface TaskManagerProps {
  leadId: number;
  token: string;
}

export default function TaskManager({ leadId, token }: TaskManagerProps) {
  const t = useTranslations('Tasks');
  const tc = useTranslations('Common');
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', due_at: '' });

  useEffect(() => { fetchTasks(); }, [leadId]);

  const fetchTasks = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/tasks?lead_id=${leadId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setTasks(await res.json());
    } catch (e) { console.error(e); }
  };

  const createTask = async () => {
    if (!newTask.title.trim()) return;
    try {
      const res = await fetch(`${API_BASE}/api/v1/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ lead_id: leadId, title: newTask.title, description: '', due_at: newTask.due_at || new Date().toISOString(), status: 'pending' }),
      });
      if (res.ok) { setShowAdd(false); setNewTask({ title: '', due_at: '' }); fetchTasks(); }
    } catch (e) { console.error(e); }
  };

  const toggleStatus = async (task: Task) => {
    const newStatus = task.status === 'pending' ? 'completed' : 'pending';
    const res = await fetch(`${API_BASE}/api/v1/tasks/${task.id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) fetchTasks();
  };

  const pending = tasks.filter(t => t.status === 'pending');
  const completed = tasks.filter(t => t.status === 'completed');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-n-100 flex items-center gap-2">
          <svg className="w-4 h-4 text-accent-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
          {t('title')}
          {pending.length > 0 && (
            <span className="w-5 h-5 rounded-full bg-accent-500/20 text-accent-400 text-[10px] font-black flex items-center justify-center border border-accent-500/30">{pending.length}</span>
          )}
        </h4>
        <button onClick={() => setShowAdd(!showAdd)} className="text-xs font-bold text-accent-400 hover:text-accent-300">
          {showAdd ? tc('cancel') : `+ ${t('add_task')}`}
        </button>
      </div>

      {showAdd && (
        <div className="space-y-2 p-3 bg-n-900/70 border border-n-500/60 rounded-xl animate-in slide-in-from-top-1">
          <input
            className="input-field text-sm"
            placeholder={t('placeholder')}
            value={newTask.title}
            onChange={e => setNewTask({ ...newTask, title: e.target.value })}
            onKeyDown={e => e.key === 'Enter' && createTask()}
            autoFocus
          />
          <div className="flex gap-2">
            <input
              type="datetime-local"
              className="input-field text-xs flex-1 bg-n-800"
              value={newTask.due_at}
              onChange={e => setNewTask({ ...newTask, due_at: e.target.value })}
            />
            <button onClick={createTask} className="btn-primary text-xs px-4 py-1.5 shrink-0">{tc('save')}</button>
          </div>
        </div>
      )}

      <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
        {tasks.length === 0 && !showAdd && (
          <div className="text-center py-6">
             <p className="text-n-500 text-xs font-bold uppercase tracking-widest opacity-60">{t('no_tasks')}</p>
          </div>
        )}
        {pending.map(t_item => (
          <div key={t_item.id} className="flex items-center gap-3 p-3 bg-n-800/50 rounded-xl border border-n-500/40 group hover:border-n-400 transition-all">
            <button
              onClick={() => toggleStatus(t_item)}
              className="w-4 h-4 rounded border-2 border-n-500 hover:border-accent-500 flex items-center justify-center shrink-0 transition-colors"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-n-100 truncate font-medium">{t_item.title}</p>
              {t_item.due_at && <p className="text-[10px] text-n-500 font-bold mt-1 uppercase">{t('due')}: {new Date(t_item.due_at).toLocaleDateString()}</p>}
            </div>
          </div>
        ))}
        {completed.length > 0 && (
          <details className="group/details">
            <summary className="text-[10px] font-black uppercase tracking-widest text-n-500 cursor-pointer list-none flex items-center gap-1 py-1 hover:text-n-300 transition-colors">
              <svg className="w-3 h-3 rotate-0 group-open/details:rotate-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              {t('completed_count', { count: completed.length })}
            </summary>
            <div className="space-y-1.5 mt-2">
              {completed.map(t_comp => (
                <div key={t_comp.id} className="flex items-center gap-3 p-2.5 rounded-xl border border-n-500/20 opacity-50 bg-n-900/30">
                  <button onClick={() => toggleStatus(t_comp)} className="w-4 h-4 rounded bg-accent-500/30 border border-accent-500/50 flex items-center justify-center shrink-0">
                    <svg className="w-2.5 h-2.5 text-accent-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                  </button>
                  <p className="text-xs text-n-500 line-through truncate">{t_comp.title}</p>
                </div>
              ))}
            </div>
          </details>
        )}
      </div>
    </div>
  );
}
