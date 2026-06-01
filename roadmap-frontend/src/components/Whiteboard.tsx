import { useState, useRef, useCallback } from 'react';
import ReactFlow, { Background, Controls, MiniMap, useReactFlow } from 'reactflow';
import 'reactflow/dist/style.css';
import { useRoadmapStore } from '../core/store';
import { NodeRegistry } from '../registry';

const nodeTypes = NodeRegistry; 

export default function Whiteboard() {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, addNode, updateNodeConfig, formatHolderList, detachChildren, takeSnapshot } = useRoadmapStore();
  const { screenToFlowPosition, getNodes } = useReactFlow(); // <-- THÊM getNodes

  const [menu, setMenu] = useState<{ 
    x: number, 
    y: number, 
    sourceId?: string, 
    sourceHandle?: string, 
    handleType?: string // <-- THÊM BIẾN NÀY
  } | null>(null);  
  const connectingNodeId = useRef<string | null>(null);
  const connectingHandleId = useRef<string | null>(null);
  const connectingHandleType = useRef<string | null>(null);
  const ignoreNextClick = useRef<boolean>(false);
  // MỞ MENU BẰNG CHUỘT PHẢI & CHẶN MENU CỦA EDGE
  const onPaneContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault(); // Dòng này cực kỳ quan trọng để chặn menu mặc định
    setMenu({ x: e.clientX, y: e.clientY });
  }, []);

  const onConnectStart = useCallback((_: any, { nodeId, handleId, handleType }: any) => {
    connectingNodeId.current = nodeId;
    connectingHandleId.current = handleId;
    connectingHandleType.current = handleType; // <-- LƯU LẠI LOẠI CỔNG
  }, []);

const onConnectEnd = useCallback((event: any) => {
    if (!event.target) return;
    const target = event.target as Element;

    // FIX MỚI: Chỉ cần KHÔNG PHẢI LÀ CỔNG NỐI (Handle) thì đều được coi là rơi ra ngoài
    const isHandle = target.classList.contains('react-flow__handle');
    
    if (!isHandle && connectingNodeId.current) {
      const clientX = 'clientX' in event ? event.clientX : event.changedTouches?.[0]?.clientX;
      const clientY = 'clientY' in event ? event.clientY : event.changedTouches?.[0]?.clientY;

      if (clientX !== undefined && clientY !== undefined) {
        ignoreNextClick.current = true;
        setMenu({ 
          x: clientX, 
          y: clientY, 
          sourceId: connectingNodeId.current, 
          sourceHandle: connectingHandleId.current || undefined,
          handleType: connectingHandleType.current || undefined 
        });
      }
    }

    connectingNodeId.current = null;
    connectingHandleId.current = null;
    connectingHandleType.current = null;
  }, []);

  const handleAddNodeFromMenu = (type: string) => {
    if (!menu) return;
    const position = screenToFlowPosition({ x: menu.x, y: menu.y });
    const newNodeId = `${type}-${Date.now()}`;
    
    // Thuật toán cấp Z-index: Group luôn nằm dưới cùng (-5), Holder (-1), Task (10)
    const zIndex = type === 'custom-group' ? -5 : (type === 'task-holder' ? -1 : 10);
    const style = type === 'custom-group' ? { width: 500, height: 400 } : undefined;

    addNode({
      id: newNodeId, type, position, zIndex, style,
      data: { 
        title: type === 'task' ? 'Task Mới' : type === 'note' ? 'Ghi chú' : type === 'custom-group' ? 'Khu vực mới' : 'Dự án', 
        color: type === 'note' ? '#fef08a' : type === 'custom-group' ? '#e0e7ff' : '#ffffff', status: 'todo'
      },
    });

    if (menu.sourceId && menu.handleType) {
      setTimeout(() => {
        if (menu.handleType === 'source') {
          onConnect({ source: menu.sourceId!, sourceHandle: menu.sourceHandle, target: newNodeId, targetHandle: null } as any);
        } else {
          onConnect({ source: newNodeId, sourceHandle: null, target: menu.sourceId!, targetHandle: menu.sourceHandle } as any);
        }
      }, 50);
    }
    setMenu(null);
  };

  const handleNodesDelete = useCallback((deletedNodes: any[]) => {
    takeSnapshot(); // <-- Lưu lịch sử trước khi xóa
    deletedNodes.forEach(node => {
      if (node.type === 'task-holder') detachChildren(node.id);
    });
  }, [detachChildren, takeSnapshot]);
  const onNodeDragStart = useCallback(() => {
    takeSnapshot(); // <-- Lưu lịch sử vị trí cũ trước khi kéo
  }, [takeSnapshot]);

  // THUẬT TOÁN KÉO THẢ "HÚT VẠN VẬT" SIÊU CHUẨN XÁC
  const handleNodeDragStop = (_: any, node: any) => {
    // 1. LẤY DATA TỪ REACT FLOW ĐỂ CÓ TỌA ĐỘ TUYỆT ĐỐI CỦA MỌI NODE TRÊN BẢN ĐỒ
    const currentNodes = getNodes();
    
    // Tọa độ tuyệt đối của tâm Task vừa thả
    const absX = node.positionAbsolute?.x || node.position.x;
    const absY = node.positionAbsolute?.y || node.position.y;
    const centerX = absX + (node.width || 100) / 2;
    const centerY = absY + (node.height || 50) / 2;

    // Ưu tiên 1: Task rớt vào Task-Holder
    if (node.type === 'task') {
      const holders = currentNodes.filter(n => n.type === 'task-holder'); // Lấy từ currentNodes
      let droppedOnHolder = null;
      
      for (const h of holders) {
        // Lấy tọa độ tuyệt đối được engine React Flow tính toán sẵn
        const hX = h.positionAbsolute?.x || h.position.x;
        const hY = h.positionAbsolute?.y || h.position.y;
        const hW = h.width || (h.style?.width as number) || 320;
        const hH = h.height || (h.style?.height as number) || 150;
        
        if (!h.data?.isCollapsed && centerX > hX && centerX < hX + hW && centerY > hY && centerY < hY + hH && node.id !== h.id) {
          droppedOnHolder = h; break;
        }
      }

      if (droppedOnHolder) {
        const oldParentId = node.parentId;
        if (oldParentId !== droppedOnHolder.id) {
          updateNodeConfig(node.id, { parentId: droppedOnHolder.id, position: { x: 16, y: node.position.y } });
        }
        setTimeout(() => {
          formatHolderList(droppedOnHolder.id);
          if (oldParentId && oldParentId !== droppedOnHolder.id) {
            const oldParent = nodes.find(n => n.id === oldParentId);
            if (oldParent?.type === 'task-holder') formatHolderList(oldParentId);
          }
        }, 50);
        return; // Đã hít vào Holder thì dừng tại đây
      }
    }

    // Ưu tiên 2: Rơi vào Group Không Gian
    const groups = currentNodes.filter(n => n.type === 'custom-group'); // Lấy từ currentNodes
    let droppedOnGroup = null;
    for (const g of groups) {
      const gX = g.positionAbsolute?.x || g.position.x;
      const gY = g.positionAbsolute?.y || g.position.y;
      const gW = g.width || (g.style?.width as number) || 500;
      const gH = g.height || (g.style?.height as number) || 400;
      
      if (centerX > gX && centerX < gX + gW && centerY > gY && centerY < gY + gH && node.id !== g.id) {
        droppedOnGroup = g; break;
      }
    }

    const oldParentId = node.parentId;

    if (droppedOnGroup) {
      if (oldParentId !== droppedOnGroup.id) {
        // Chuyển sang tọa độ tương đối so với Group
        const gX = droppedOnGroup.positionAbsolute?.x || droppedOnGroup.position.x;
        const gY = droppedOnGroup.positionAbsolute?.y || droppedOnGroup.position.y;
        updateNodeConfig(node.id, { 
          parentId: droppedOnGroup.id, 
          position: { x: absX - gX, y: absY - gY } 
        });
      }
      if (oldParentId && nodes.find(n => n.id === oldParentId)?.type === 'task-holder') {
        setTimeout(() => formatHolderList(oldParentId), 50);
      }
    } else {
      // Ưu tiên 3: Rơi ra nền trắng
      if (node.parentId) {
        updateNodeConfig(node.id, { parentId: undefined, position: { x: absX, y: absY } });
        if (oldParentId && nodes.find(n => n.id === oldParentId)?.type === 'task-holder') {
          setTimeout(() => formatHolderList(oldParentId), 50);
        }
      }
    }
  };
  const onPaneClick = useCallback(() => {
    if (ignoreNextClick.current) {
      ignoreNextClick.current = false; // Hạ khiên xuống và tha cho cái menu
      return;
    }
    setMenu(null); // Nếu là click bình thường thì cứ đóng menu như cũ
  }, []);
  return (
    <div style={{ width: '100%', height: '100%' }} className="bg-gray-50 relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDragStop={handleNodeDragStop}
        
        onPaneContextMenu={onPaneContextMenu} // Đổi thành chuột phải
        onConnectStart={onConnectStart}
        onConnectEnd={onConnectEnd}
        onNodesDelete={handleNodesDelete}
        elevateNodesOnSelect={false}
        selectionKeyCode={['Control', 'Meta']}
        multiSelectionKeyCode={['Control', 'Meta']}
        deleteKeyCode={['Backspace', 'Delete']}
        onPaneClick={onPaneClick}
        onNodeClick={() => setMenu(null)} // Click vào node khác cũng đóng menu
        onNodeDragStart={onNodeDragStart}
        nodeTypes={nodeTypes}
        fitView

      onNodeContextMenu={(e, node) => {
          e.preventDefault();
          if (node.type === 'custom-group' || node.type === 'task-holder') {
            setMenu({ x: e.clientX, y: e.clientY });
          }
        }}
      >
        <Background gap={16} size={1} />
        <Controls />
        <MiniMap />
      </ReactFlow>

      {menu && (
        <div 
          className="fixed bg-white border border-gray-200 shadow-2xl rounded-md p-1.5 flex flex-col gap-1 z-50 w-40 dark:bg-gray-800 dark:border-gray-600"
          style={{ top: menu.y, left: menu.x }}
          onClick={(e) => e.stopPropagation()}
          onContextMenu={(e) => e.preventDefault()}
        >
          <div className="text-[10px] text-gray-400 font-bold px-2 py-1 uppercase tracking-wider dark:text-gray-500">Thêm mới</div>
          <button onClick={() => handleAddNodeFromMenu('task')} className="text-left px-3 py-1.5 text-sm font-semibold text-blue-700 hover:bg-blue-50 rounded dark:text-blue-400 dark:hover:bg-gray-700">➕ Task</button>
          <button onClick={() => handleAddNodeFromMenu('task-holder')} className="text-left px-3 py-1.5 text-sm font-semibold text-indigo-700 hover:bg-indigo-50 rounded dark:text-indigo-400 dark:hover:bg-gray-700">🗂 Task Group</button>
          <button onClick={() => handleAddNodeFromMenu('note')} className="text-left px-3 py-1.5 text-sm font-semibold text-yellow-700 hover:bg-yellow-50 rounded dark:text-yellow-400 dark:hover:bg-gray-700">📝 Note</button>
          <button onClick={() => handleAddNodeFromMenu('reroute')} className="text-left px-3 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-100 rounded dark:text-gray-300 dark:hover:bg-gray-700">⏺ Reroute</button>
          <button onClick={() => handleAddNodeFromMenu('custom-group')} className="text-left px-3 py-1.5 text-sm font-semibold text-purple-700 hover:bg-purple-50 rounded dark:text-purple-400 dark:hover:bg-gray-700">🔲 Vùng (Group)</button>
        </div>
      )}
    </div>
  );
}