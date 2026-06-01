import { useState, useRef, useEffect } from 'react';
import { useReactFlow } from 'reactflow';
import { useRoadmapStore } from '../core/store';

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  
  const { nodes, tags, updateNodeConfig } = useRoadmapStore();
  
  // Hàm của React Flow để điều khiển camera
  const { setCenter } = useReactFlow();

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Thuật toán lọc kết quả (Lọc theo Tên Task hoặc Tên Tag)
  const searchResults = nodes.filter(node => {
    if (node.type !== 'task' && node.type !== 'task-holder') return false;
    if (!query) return false;
    
    const lowerQuery = query.toLowerCase();
    const titleMatch = (node.data?.title || '').toLowerCase().includes(lowerQuery);
    
    // Kiểm tra xem task này có chứa tag nào khớp với từ khóa không
    const nodeTagIds = node.data?.tags || [];
    const tagMatch = tags.some(t => nodeTagIds.includes(t.id) && t.name.toLowerCase().includes(lowerQuery));

    return titleMatch || tagMatch;
  });

  const handleSelectNode = (node: any) => {
    setIsOpen(false);
    setQuery('');
    
    // 1. Deselect tất cả, Select node này
    nodes.forEach(n => updateNodeConfig(n.id, { selected: n.id === node.id }));
    
    // 2. Nếu node nằm trong một Task-Holder đang đóng, hãy mở Task-Holder đó ra
    if (node.parentId) {
      const parent = nodes.find(n => n.id === node.parentId);
      if (parent?.data?.isCollapsed) {
        useRoadmapStore.getState().toggleHolderCollapse(parent.id);
      }
    }

    // 3. Bay camera đến đó (Animation mượt mà 800ms)
    setTimeout(() => {
      // Lấy tọa độ Tuyệt đối nếu nó nằm trong Holder, nếu không lấy tọa độ gốc
      const targetX = (node.positionAbsolute?.x || node.position.x) + (node.width || 285) / 2;
      const targetY = (node.positionAbsolute?.y || node.position.y) + (node.height || 50) / 2;
      setCenter(targetX, targetY, { zoom: 1.2, duration: 800 });
    }, 100); // Đợi layout xíu nếu vừa mở holder
  };

  return (
    <div ref={wrapperRef} className="relative w-64 z-50">
      <input
        type="text"
        value={query}
        onChange={(e) => { setQuery(e.target.value); setIsOpen(true); }}
        onFocus={() => setIsOpen(true)}
        placeholder="Tìm tên task, tag..."
        className="w-full px-3 py-1.5 text-sm text-gray-800 bg-gray-100 rounded outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-gray-400"
      />
      
      {isOpen && query && (
        <div className="absolute top-full left-0 w-full mt-1 bg-white rounded shadow-xl border border-gray-200 max-h-60 overflow-y-auto">
          {searchResults.length === 0 ? (
            <div className="px-3 py-2 text-sm text-gray-500 italic">Không tìm thấy kết quả.</div>
          ) : (
            searchResults.map(node => (
              <div 
                key={node.id} 
                onClick={() => handleSelectNode(node)}
                className="px-3 py-2 hover:bg-blue-50 cursor-pointer border-b last:border-b-0 flex flex-col"
              >
                <span className="font-semibold text-gray-800 text-sm truncate">{node.data?.title || 'Untitled'}</span>
                <span className="text-[10px] text-gray-500 uppercase">{node.type === 'task-holder' ? 'Nhóm Task' : 'Task'}</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}