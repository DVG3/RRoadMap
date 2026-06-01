import { useRoadmapStore } from '../../core/store';
import type { Node } from 'reactflow';

export default function TaskProperties({ node }: { node: Node }) {
  const { updateNodeData, tags } = useRoadmapStore();
  const data = node.data;
  
  const handleChange = (field: string, value: any) => updateNodeData(node.id, { [field]: value });

  const results: string[] = data.results || [];
  const addResult = () => handleChange('results', [...results, '']);
  const updateResult = (index: number, val: string) => {
    const newRes = [...results];
    newRes[index] = val;
    handleChange('results', newRes);
  };
  const removeResult = (index: number) => {
    handleChange('results', results.filter((_, i) => i !== index));
  };

  const nodeTags: string[] = data.tags || [];
  const toggleTag = (tagId: string) => {
    if (nodeTags.includes(tagId)) handleChange('tags', nodeTags.filter(id => id !== tagId));
    else handleChange('tags', [...nodeTags, tagId]);
  };

  return (
    <div className="flex flex-col gap-4 text-sm pb-10">
      <h2 className="font-bold text-lg border-b pb-2">Task Properties</h2>
      
      <div className="flex flex-col gap-1">
        <label className="font-semibold text-gray-600">Tên Task:</label>
        <input type="text" value={data.title || ''} onChange={(e) => handleChange('title', e.target.value)} className="border rounded p-1.5 focus:outline-blue-500" />
      </div>
      <div className="flex flex-col gap-1">
        <label className="font-semibold text-gray-600">Màu nền Task:</label>
        <div className="flex items-center gap-2">
          <input 
            type="color" 
            value={data.color || '#ffffff'} 
            onChange={(e) => handleChange('color', e.target.value)}
            className="w-8 h-8 rounded cursor-pointer border-none p-0"
          />
          <span className="text-xs text-gray-500 uppercase">{data.color || '#ffffff'}</span>
        </div>
      </div>
      {/* THÊM PHẦN MÔ TẢ */}
      <div className="flex flex-col gap-1">
        <label className="font-semibold text-gray-600">Mô tả chi tiết:</label>
        <textarea 
          value={data.description || ''} 
          onChange={(e) => handleChange('description', e.target.value)}
          className="border rounded p-1.5 focus:outline-blue-500 min-h-[80px] resize-y"
          placeholder="Nhập ghi chú cho công việc này..."
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="font-semibold text-gray-600">Trạng thái (Status):</label>
        <select value={data.status || 'todo'} onChange={(e) => handleChange('status', e.target.value)} className="border rounded p-1.5 focus:outline-blue-500 bg-white">
          <option value="todo">🔴 Chưa làm</option>
          <option value="in-progress">🟡 Đang thực hiện</option>
          <option value="done">🟢 Đã xong</option>
        </select>
      </div>

      {/* Ngày tháng */}
      <div className="grid grid-cols-2 gap-2 mt-2">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-500">Ngày bắt đầu</label>
          <input 
            type="date" 
            value={data.startDate ? data.startDate.split('T')[0] : ''} 
            onChange={(e) => handleChange('startDate', e.target.value ? new Date(e.target.value).toISOString() : null)} 
            className="border rounded p-1 text-xs focus:outline-blue-500" 
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-500">Ngày kết thúc</label>
          <input 
            type="date" 
            value={data.endDate ? data.endDate.split('T')[0] : ''} 
            onChange={(e) => handleChange('endDate', e.target.value ? new Date(e.target.value).toISOString() : null)} 
            className="border rounded p-1 text-xs focus:outline-blue-500" 
          />
        </div>
      </div>

      <div className="flex flex-col gap-1 mt-2">
        <label className="font-semibold text-gray-600">Tags:</label>
        <div className="flex flex-wrap gap-2 border p-2 rounded-md bg-gray-50 min-h-[40px]">
          {tags.map(tag => {
            const isActive = nodeTags.includes(tag.id);
            return (
              <button 
                key={tag.id} onClick={() => toggleTag(tag.id)}
                className={`px-2 py-0.5 rounded-full text-xs font-semibold border transition-all ${isActive ? 'ring-2 ring-offset-1' : 'opacity-60 grayscale'}`}
                style={{ backgroundColor: tag.color + '20', color: tag.color, borderColor: tag.color }}
              >
                {tag.name}
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex flex-col gap-1 mt-2 border-t pt-3">
        <div className="flex justify-between items-center">
          <label className="font-semibold text-gray-600">Results (Link/Text):</label>
          <button onClick={addResult} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded font-bold hover:bg-blue-200">+ Thêm</button>
        </div>
        {results.length === 0 && <p className="text-xs text-gray-400 italic">Chưa có kết quả nào.</p>}
        <div className="flex flex-col gap-2 mt-1">
          {results.map((res, idx) => (
            <div key={idx} className="flex gap-1">
              <input 
                type="text" 
                value={res} 
                onChange={(e) => updateResult(idx, e.target.value)}
                placeholder="https://..."
                className="flex-1 border rounded p-1.5 text-xs focus:outline-blue-500"
              />
              <button onClick={() => removeResult(idx)} className="bg-red-50 text-red-500 px-2 rounded hover:bg-red-100">×</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}