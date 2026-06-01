import { NodeResizer } from 'reactflow';
import { useRoadmapStore } from '../../core/store';

export default function GroupNode({ id, data, selected }: { id: string, data: any, selected: boolean }) {
  const updateNodeData = useRoadmapStore((state) => state.updateNodeData);
  const bgColor = data.color || '#e0e7ff'; // Màu mặc định (xanh nhạt)

  return (
    <>
      <NodeResizer 
        color="#6366f1" 
        isVisible={selected} 
        minWidth={400} 
        minHeight={300} 
        handleStyle={{ width: 12, height: 12, borderRadius: 4 }}
      />
      <div 
        className={`w-full h-full rounded-xl border-[3px] transition-all ${selected ? 'border-indigo-500 shadow-xl' : 'border-dashed border-gray-400'}`}
        // Thêm '30' vào cuối mã hex để tạo độ trong suốt (opacity ~20%)
        style={{ backgroundColor: bgColor + '30' }} 
      >
        <div className="bg-white/80 px-3 py-1.5 rounded-br-xl rounded-tl-xl inline-flex items-center gap-3 border-b border-r border-gray-300 backdrop-blur-sm pointer-events-auto">
          <input 
            type="text"
            value={data.title || ''}
            onChange={(e) => updateNodeData(id, { title: e.target.value })}
            placeholder="Tên Khu Vực..."
            className="font-bold text-lg bg-transparent outline-none text-gray-800 placeholder:text-gray-500 nodrag min-w-[150px]"
          />
          <input 
            type="color" 
            value={data.color || '#e0e7ff'} 
            onChange={(e) => updateNodeData(id, { color: e.target.value })}
            className="w-5 h-5 rounded cursor-pointer nodrag border-none p-0 bg-transparent"
            title="Đổi màu vùng"
          />
        </div>
      </div>
    </>
  );
}