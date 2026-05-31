/*
 * @Description: 
 * @Author: zhuzm
 * @Date: 2025-11-23 15:33:30
 * @LastEditors: zhuzm
 * @LastEditTime: 2025-11-23 15:38:09
 */
'use client';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

type Model = { id: string; modelId: string; name: string; platform: string; baseURL: string; apiKey?: string; enabled: boolean };

export default function ModelsPage() {
  const API_BASE = process.env.NEXT_PUBLIC_API_ORIGIN || process.env.API_ORIGIN?.replace('http://localhost:', 'http://localhost:') || '/api';
  const [models, setModels] = useState<Model[]>([]);
  const [form, setForm] = useState<{ modelId: string; name: string; platform: string; baseURL: string; apiKey?: string }>({ modelId: '', name: '', platform: 'iflow', baseURL: '', apiKey: '' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    const token = localStorage.getItem('token');
    if (!token) return;
    const res = await fetch(`${API_BASE}/models/admin`, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) {
      setError(res.status === 403 ? '无权限访问模型管理' : '模型列表加载失败');
      setModels([]);
      return;
    }
    const data = await res.json();
    setError('');
    setModels(data.models ?? []);
  }

  useEffect(() => { queueMicrotask(() => { load(); }); }, []);

  async function create() {
    const token = localStorage.getItem('token');
    if (!token) return;
    setLoading(true);
    const res = await fetch(`${API_BASE}/models`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      await load();
      setForm({ modelId: '', name: '', platform: 'iflow', baseURL: '', apiKey: '' });
      setIsModalOpen(false);
    }
    setLoading(false);
  }

  async function update(id: string) {
    const token = localStorage.getItem('token');
    if (!token) return;
    setLoading(true);
    const res = await fetch(`${API_BASE}/models/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      await load();
      setForm({ modelId: '', name: '', platform: 'iflow', baseURL: '', apiKey: '' });
      setEditingId(null);
      setIsModalOpen(false);
    }
    setLoading(false);
  }

  async function del(id: string) {
    const token = localStorage.getItem('token');
    if (!token) return;
    setLoading(true);
    const res = await fetch(`${API_BASE}/models/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) await load();
    setLoading(false);
  }

  function startEdit(model: Model) {
    setEditingId(model.id);
    setForm({
      modelId: model.modelId,
      name: model.name,
      platform: model.platform,
      baseURL: model.baseURL,
      apiKey: ''
    });
    setIsModalOpen(true);
  }

  function startCreate() {
    setEditingId(null);
    setForm({ modelId: '', name: '', platform: 'iflow', baseURL: '', apiKey: '' });
    setIsModalOpen(true);
  }

  function cancelEdit() {
    setEditingId(null);
    setForm({ modelId: '', name: '', platform: 'iflow', baseURL: '', apiKey: '' });
    setIsModalOpen(false);
  }

  function handleSubmit() {
    if (editingId) {
      update(editingId);
    } else {
      create();
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">维护模型</h2>
        <Button onClick={startCreate}>新增模型</Button>
      </div>

      <div className="w-full">
        {error && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">模型ID</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">名称</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">平台</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Base URL</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">API Key</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">状态</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {models.map((m) => (
                <tr key={m.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-xs text-gray-600">{m.modelId}</td>
                  <td className="px-4 py-3 text-sm font-medium">{m.name}</td>
                  <td className="px-4 py-3 text-sm">{m.platform}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{m.baseURL}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {m.apiKey ? `${m.apiKey.slice(0, 8)}...` : '-'}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${m.enabled
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                      }`}>
                      {m.enabled ? '启用' : '禁用'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => startEdit(m)}
                        disabled={loading}
                      >
                        编辑
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => del(m.id)}
                        disabled={loading}
                      >
                        删除
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {models.length === 0 && (
            <div className="text-center py-8 text-sm text-gray-500">
              暂无模型
            </div>
          )}
        </div>
      </div>
      {/* Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingId ? '编辑模型' : '新增模型'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              placeholder="模型ID（真实模型标识，如 tstars2.0）"
              value={form.modelId}
              onChange={(e) => setForm({ ...form, modelId: e.target.value })}
            />
            <Input
              placeholder="名称 (如 TBStars2-200B-A13B)"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <Input
              placeholder="平台 (iflow / openai)"
              value={form.platform}
              onChange={(e) => setForm({ ...form, platform: e.target.value })}
            />
            <Input
              placeholder="Base URL (如 https://apis.iflow.cn/v1)"
              value={form.baseURL}
              onChange={(e) => setForm({ ...form, baseURL: e.target.value })}
            />
            <Input
              placeholder={editingId ? 'API Key（留空表示不修改）' : 'API Key'}
              type="password"
              value={form.apiKey}
              onChange={(e) => setForm({ ...form, apiKey: e.target.value })}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={cancelEdit} disabled={loading}>
              取消
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {editingId ? '更新' : '新增'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
