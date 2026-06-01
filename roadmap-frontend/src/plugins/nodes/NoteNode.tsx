import { useState } from 'react';
import { Handle, Position, NodeResizer } from 'reactflow';
import { useRoadmapStore } from '../../core/store';

// Tái sử dụng hàm Linkify
const renderLinks = (text: string) => {
  if (!text) return null;
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);
  return parts.map((part, i) => {
    if (part.match(urlRegex)) {
      return (
        <a 
          key={i} href={part} target="_blank" rel="noopener noreferrer" 
          className="text-blue-600 hover:underline hover:text-blue-800 font-bold"
          onPointerDown={(e) => e.stopPropagation()} 
        >
          {part}
        </a>
      );
    }
    return <span key={i}>{part}</span>;
  });
};

export default function NoteNode({ id, data, selected }: { id: string, data: any, selected: boolean }) {
  const updateNodeData = useRoadmapStore((state) => state.updateNodeData);
  const bgColor = data.color || '#fef08a';
  const [isEditing, setIsEditing] = useState(false); // State quản lý Sửa / Xem

  return (
    <>
      <NodeResizer color="#eab308" isVisible={selected} minWidth={150} minHeight={100} handleStyle={{ width: 12, height: 12, borderRadius: 4 }} />
      <div 
        className={`w-full h-full p-2 rounded shadow-md border-2 transition-shadow flex flex-col ${selected ? 'border-yellow-500 shadow-lg' : 'border-transparent'}`}
        style={{ backgroundColor: bgColor }}
      >
        <Handle type="target" position={Position.Left} className="w-3 h-3 bg-yellow-600" />
        
        <input 
          type="text" value={data.title || ''} onChange={(e) => updateNodeData(id, { title: e.target.value })}
          placeholder="Tiêu đề..."
          className="font-bold text-sm bg-transparent border-b border-yellow-400/50 outline-none mb-1 text-gray-800 placeholder:text-gray-500 nodrag pointer-events-auto"
        />
        
        {isEditing ? (
          <textarea 
            autoFocus
            onBlur={() => setIsEditing(false)} // Bấm ra ngoài là lưu
            value={data.content || ''}
            onChange={(e) => updateNodeData(id, { content: e.target.value })}
            placeholder="Gõ nội dung, dán link vào đây..."
            className="flex-1 w-full bg-white/50 p-1 rounded resize-none outline-none text-xs text-gray-800 placeholder:text-gray-500 nodrag pointer-events-auto"
          />
        ) : (
          <div 
            onDoubleClick={() => setIsEditing(true)} // Nháy đúp để sửa
            className="flex-1 w-full bg-transparent overflow-y-auto text-xs text-gray-700 whitespace-pre-wrap nodrag pointer-events-auto cursor-text"
            title="Nháy đúp để sửa ghi chú"
          >
            {data.content ? renderLinks(data.content) : <span className="text-gray-500 italic">Nháy đúp để nhập nội dung...</span>}
          </div>
        )}

        <Handle type="source" position={Position.Right} className="w-3 h-3 bg-yellow-600" />
      </div>
    </>
  );
}