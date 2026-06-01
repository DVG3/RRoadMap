import { Handle, Position, NodeResizer } from 'reactflow';
import { useRoadmapStore } from '../../core/store';

export default function TaskHolderNode({ id, data, selected }: { id: string, data: any, selected: boolean }) {
  const toggleHolderCollapse = useRoadmapStore((state) => state.toggleHolderCollapse);
  const nodes = useRoadmapStore((state) => state.nodes);
  
  const isCollapsed = data.isCollapsed || false;
  const bgColor = data.color || '#e2e8f0';
  const borderClass = selected ? 'border-indigo-500 shadow-xl' : 'border-gray-400';

  const childTasks = nodes.filter((n) => n.parentId === id);
  const completedCount = childTasks.filter((n) => n.data?.status === 'done').length;

  return (
    <>
      <NodeResizer 
        color="#6366f1" 
        isVisible={selected && !isCollapsed} // CHỈ HIỆN KHI ĐANG MỞ RỘNG
        minWidth={320} 
        minHeight={150} 
        handleStyle={{ width: 8, height: 8, borderRadius: 4 }}
      />
      
      <div 
        className={`rounded-lg border-2 ${borderClass} transition-shadow flex flex-col`}
        style={{ backgroundColor: bgColor, width: '100%', height: '100%' }}
      >
        {/* KHÔNG XÓA HANDLE, CHỈ LÀM TÀNG HÌNH ĐỂ GIỮ DÂY */}
        <Handle 
          type="target" 
          position={Position.Left} 
          style={{ top: 22, opacity: isCollapsed ? 1 : 0, pointerEvents: isCollapsed ? 'auto' : 'none' }} 
          className="w-4 h-4 bg-indigo-600 transition-opacity" 
        />
        
        <div className="h-[45px] bg-black/10 px-3 flex justify-between items-center cursor-grab rounded-t-md shrink-0">
          <div className="font-bold text-gray-800 truncate pr-2 text-sm">{data.title || 'Untitled Task-Holder'}</div>
          <button 
            onClick={() => toggleHolderCollapse(id)}
            className="text-[10px] font-bold uppercase bg-white/70 hover:bg-white px-2 py-1 rounded shadow-sm nodrag"
          >
            {isCollapsed ? 'Mở rộng' : 'Thu gọn'}
          </button>
        </div>

        {!isCollapsed && (
          <div className="flex-1 relative pointer-events-none">
             {childTasks.length === 0 && (
               <div className="text-gray-500 text-xs text-center mt-10 italic">
                 (Kéo thả Task vào vùng này)
               </div>
             )}
          </div>
        )}

        {!isCollapsed && (
          <div className="absolute bottom-0 left-0 right-0 bg-white/60 px-3 py-1.5 text-xs font-bold text-gray-700 flex justify-between rounded-b-md border-t border-white/40">
            <span>{childTasks.length} Tasks</span>
            <span className={completedCount === childTasks.length && childTasks.length > 0 ? "text-green-600" : ""}>
              Hoàn thành: {completedCount}/{childTasks.length}
            </span>
          </div>
        )}

        <Handle 
          type="source" 
          position={Position.Right} 
          style={{ top: 22, opacity: isCollapsed ? 1 : 0, pointerEvents: isCollapsed ? 'auto' : 'none' }} 
          className="w-4 h-4 bg-indigo-600 transition-opacity" 
        />
      </div>
    </>
  );
}