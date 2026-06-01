import { useRoadmapStore } from '../../core/store';
import type { Node } from 'reactflow';

export default function TaskHolderProperties({ node }: { node: Node }) {
  const updateNodeData = useRoadmapStore((state) => state.updateNodeData);
  const nodes = useRoadmapStore((state) => state.nodes);
  
  const handleChange = (field: string, value: any) => {
    updateNodeData(node.id, { [field]: value });
  };

  const data = node.data;
  
  const childTasks = nodes.filter((n) => n.parentId === node.id);
  const completedCount = childTasks.filter((n) => n.data?.isCompleted).length;

  return (
    <div className="flex flex-col gap-4 text-sm dark:text-gray-200">
      <h2 className="font-bold text-lg border-b pb-2 text-indigo-700 dark:text-indigo-400 dark:border-gray-600">Task-Holder Properties</h2>
      
      <div className="flex flex-col gap-1">
        <label className="font-semibold text-gray-600 dark:text-gray-300">Tên Nhóm Task:</label>
        <input 
          type="text" 
          value={data.title || ''} 
          onChange={(e) => handleChange('title', e.target.value)}
          className="border rounded p-1.5 focus:outline-indigo-500 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600"
          placeholder="Ví dụ: Phase 1: Design..."
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="font-semibold text-gray-600 dark:text-gray-300">Mô tả (Người dùng định nghĩa):</label>
        <textarea 
          value={data.description || ''} 
          onChange={(e) => handleChange('description', e.target.value)}
          className="border rounded p-1.5 focus:outline-indigo-500 h-20 resize-none dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600"
          placeholder="Ghi chú thêm về nhóm task này..."
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="font-semibold text-gray-600 dark:text-gray-300">Màu nền:</label>
        <input 
          type="color" 
          value={data.color || '#e2e8f0'} 
          onChange={(e) => handleChange('color', e.target.value)}
          className="w-full h-8 cursor-pointer"
        />
      </div>
      
      <div className="mt-2 p-3 bg-indigo-50 rounded-md border border-indigo-100 dark:bg-indigo-900/40 dark:border-indigo-700">
        <h3 className="font-bold text-indigo-800 mb-2 dark:text-indigo-300">Thống kê tiến độ</h3>
        <div className="flex justify-between text-gray-700 dark:text-gray-300">
          <span>Tổng số Task con:</span>
          <span className="font-semibold">{childTasks.length}</span>
        </div>
        <div className="flex justify-between text-gray-700 mt-1 dark:text-gray-300">
          <span>Đã hoàn thành:</span>
          <span className="font-semibold text-green-600">{completedCount}</span>
        </div>
        <div className="flex justify-between text-gray-700 mt-1 dark:text-gray-300">
          <span>Chưa hoàn thành:</span>
          <span className="font-semibold text-red-500">{childTasks.length - completedCount}</span>
        </div>
      </div>
    </div>
  );
}
