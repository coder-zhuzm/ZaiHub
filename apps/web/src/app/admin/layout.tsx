/*
 * @Description: 
 * @Author: zhuzm
 * @Date: 2025-11-23 15:33:18
 * @LastEditors: zhuzm
 * @LastEditTime: 2025-11-23 15:34:14
 */
import Link from 'next/link';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-5xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">管理</h1>
      <nav className="flex gap-4 mb-4">
        <Link href="/admin/models" className="text-blue-600 hover:underline">模型管理</Link>
        <Link href="/" className="text-gray-600 hover:underline">返回聊天</Link>
      </nav>
      {children}
    </div>
  );
}