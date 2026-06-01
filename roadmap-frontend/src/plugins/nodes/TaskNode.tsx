import { Handle, Position, NodeResizer } from 'reactflow';

// HÀM TIỆN ÍCH: Tự động phát hiện và render Link
const renderLinks = (text: string) => {
  if (!text) return null;
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);
  return parts.map((part, i) => {
    if (part.match(urlRegex)) {
      return (
        <a 
          key={i} href={part} target="_blank" rel="noopener noreferrer" 
          className="text-blue-600 hover:underline hover:text-blue-800 font-semibold"
          onPointerDown={(e) => e.stopPropagation()} // RẤT QUAN TRỌNG: Ngăn React Flow hiểu nhầm là bạn đang kéo Node
        >
          {part}
        </a>
      );
    }
    return <span key={i}>{part}</span>;
  });
};

export default function TaskNode({ data, selected }: { data: any, selected: boolean }) {
  const borderClass = selected ? 'border-blue-500 shadow-lg' : 'border-gray-300';
  const bgColor = data.color || '#ffffff';
  const status = data.status || 'todo';

  return (
    <>
      <NodeResizer color="#3b82f6" isVisible={selected} minWidth={150} minHeight={60} handleStyle={{ width: 6, height: 6, borderRadius: 3 }} />
      <div className={`w-full h-full p-3 rounded-md border-2 ${borderClass} transition-shadow flex flex-col`} style={{ backgroundColor: bgColor }}>
        <Handle type="target" position={Position.Left} className="w-3 h-3 bg-blue-500" />
        
        <div className="flex items-start justify-between gap-2 shrink-0">
          <div className="font-bold text-sm text-gray-800 break-words flex-1">{data.title || 'Untitled Task'}</div>
          <div className="shrink-0 mt-0.5">
            {status === 'done' && <span className="text-[10px] uppercase text-green-600 font-bold bg-green-100 px-1.5 py-0.5 rounded">✓ Xong</span>}
            {status === 'in-progress' && <span className="text-[10px] uppercase text-yellow-600 font-bold bg-yellow-100 px-1.5 py-0.5 rounded animate-pulse">⏳ Đang làm</span>}
            {status === 'todo' && <span className="text-[10px] uppercase text-red-500 font-bold bg-red-50 px-1.5 py-0.5 rounded">○ Chờ</span>}
          </div>
        </div>

        {/* MÔ TẢ ĐÃ ĐƯỢC LINKIFY */}
        {data.description && (
          <div className="text-xs text-gray-600 mt-2 border-t border-gray-200/60 pt-2 flex-1 overflow-y-auto whitespace-pre-wrap pointer-events-auto nodrag">
            {renderLinks(data.description)}
          </div>
        )}

        <Handle type="source" position={Position.Right} className="w-3 h-3 bg-blue-500" />
      </div>
    </>
  );
}