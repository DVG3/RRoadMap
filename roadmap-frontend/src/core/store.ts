import { create } from 'zustand';
import { addEdge, applyNodeChanges, applyEdgeChanges } from 'reactflow';
import type { Node, Edge, NodeChange, EdgeChange, Connection } from 'reactflow';
export interface Tag {
  id: string;
  name: string;
  color: string;
}
const getEdgeStyle = (status: string) => {
  if (status === 'done') return { style: { stroke: '#22c55e', strokeWidth: 2 }, animated: false };
  if (status === 'in-progress') return { style: { stroke: '#eab308', strokeWidth: 2, strokeDasharray: '5,5' }, animated: true };
  return { style: { stroke: '#ef4444', strokeWidth: 2 }, animated: false };
};

interface RoadmapState {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  addNode: (node: Node) => void;
  updateNodeData: (id: string, data: any) => void;
  updateNodeConfig: (id: string, config: Partial<Node>) => void;
  toggleHolderCollapse: (holderId: string) => void;
  formatHolderList: (holderId: string) => void;
  tags: Tag[];
  addTag: (tag: Tag) => void;
  updateTag: (id: string, name: string, color: string) => void;
  deleteTag: (id: string) => void;
  viewMode: 'board' | 'calendar';
  setViewMode: (mode: 'board' | 'calendar') => void;
  loadRoadmap: (data: { nodes: Node[], edges: Edge[], tags: Tag[] }) => void;
// Thêm vào interface RoadmapState
  detachChildren: (parentId: string) => void;
  currentFile: string;
  roadmapFiles: string[];
  isSyncing: boolean;
  
  setCurrentFile: (file: string) => void;
  setRoadmapFiles: (files: string[]) => void;
  setIsSyncing: (val: boolean) => void;
  clearBoard: () => void;

  past: { nodes: Node[], edges: Edge[] }[];
  future: { nodes: Node[], edges: Edge[] }[];
  takeSnapshot: () => void;
  undo: () => void;
  redo: () => void;
}

export const useRoadmapStore = create<RoadmapState>((set, get) => ({
  nodes: [],
  edges: [],
  tags: [
    { id: 'tag-1', name: 'Frontend', color: '#3b82f6' },
    { id: 'tag-2', name: 'Backend', color: '#10b981' }
  ],
  viewMode: 'board',
  setViewMode: (mode) => set({ viewMode: mode }),
  addTag: (tag) => set({ tags: [...get().tags, tag] }),
  updateTag: (id, name, color) => set({
    tags: get().tags.map(t => t.id === id ? { ...t, name, color } : t)
  }),
  deleteTag: (id) => set({
    tags: get().tags.filter(t => t.id !== id)
  }),
  loadRoadmap: (data) => set({
    nodes: data.nodes || [],
    edges: data.edges || [],
    tags: data.tags || []
  }),
  detachChildren: (parentId) => {
    set((state) => {
      const newNodes = state.nodes.map(n => {
        if (n.parentId === parentId) {
          return { 
            ...n, 
            parentId: undefined, // Gỡ liên kết cha
            // Chuyển tọa độ tương đối thành tọa độ tuyệt đối để nó không bị văng đi chỗ khác
            position: n.positionAbsolute || n.position 
          };
        }
        return n;
      });
      return { nodes: newNodes };
    });
  },
  // Khi người dùng resize Task, ta kích hoạt formatHolderList để đẩy các task bên dưới xuống
  onNodesChange: (changes) => {
    set((state) => {
      const nextNodes = applyNodeChanges(changes, state.nodes);
      return { nodes: nextNodes };
    });
    const store = get();
    changes.forEach(c => {
      if (c.type === 'dimensions' && c.resizing) {
        const node = store.nodes.find(n => n.id === c.id);
        if (node?.parentId) {
          // BẢN VÁ LỖI TẠI ĐÂY: Chỉ xếp dọc nếu Parent là task-holder
          const parentNode = store.nodes.find(n => n.id === node.parentId);
          if (parentNode?.type === 'task-holder') {
            store.formatHolderList(node.parentId);
          }
        }
      }
    });
  },
  currentFile: 'roadmap.json',
  roadmapFiles: ['roadmap.json'],
  isSyncing: false,

  setCurrentFile: (file) => set({ currentFile: file }),
  setRoadmapFiles: (files) => set({ roadmapFiles: files }),
  setIsSyncing: (val) => set({ isSyncing: val }),
  clearBoard: () => set({ nodes: [], edges: [], tags: [] }),
  
  onEdgesChange: (changes) => set({ edges: applyEdgeChanges(changes, get().edges) }),
  
  onConnect: (connection) => {
    get().takeSnapshot(); // <-- Lưu lịch sử trước khi nối dây
    set((state) => {
      const targetNode = state.nodes.find(n => n.id === connection.target);
      const status = targetNode?.data?.status || 'todo';
      const edgeStyle = getEdgeStyle(status);
      const newEdge = { ...connection, id: `edge-${connection.source}-${connection.target}`, ...edgeStyle };
      return { edges: addEdge(newEdge, state.edges) };
    });
  },

  addNode: (node) => {
    get().takeSnapshot(); // <-- Lưu lịch sử trước khi tạo Node
    set({ nodes: [...get().nodes, node] });
  },
  updateNodeConfig: (id, config) => set({ nodes: get().nodes.map((n) => n.id === id ? { ...n, ...config } : n) }),

  updateNodeData: (id, newData) => {
    set((state) => {
      const newNodes = state.nodes.map((n) => n.id === id ? { ...n, data: { ...n.data, ...newData } } : n);
      let newEdges = state.edges;
      if (newData.status) {
        newEdges = newEdges.map(e => {
          if (e.target === id || e.data?.realTarget === id) return { ...e, ...getEdgeStyle(newData.status) };
          return e;
        });
      }
      return { nodes: newNodes, edges: newEdges };
    });
  },

  // THUẬT TOÁN EDGE PROXYING HOÀN HẢO
  toggleHolderCollapse: (holderId) => {
    set((state) => {
      const holder = state.nodes.find(n => n.id === holderId);
      if (!holder) return state;
      const isCollapsing = !holder.data.isCollapsed;

      // Lưu lại chiều cao hiện tại trước khi đóng để lúc mở ra khôi phục lại
      const currentHeight = holder.style?.height || holder.height || 150;
      const expandedHeight = isCollapsing ? currentHeight : (holder.data.expandedHeight || 150);

      let newNodes = state.nodes.map(n => {
        if (n.id === holderId) {
          return { 
            ...n, 
            data: { ...n.data, isCollapsed: isCollapsing, expandedHeight },
            style: {
              ...n.style,
              height: isCollapsing ? 45 : expandedHeight
            },
            zIndex: isCollapsing ? 0 : -1 // FIX: Vỏ đang mở thì ép chìm xuống (-1)
          };
        }
        if (n.parentId === holderId) return { ...n, hidden: isCollapsing };
        return n;
      });

      // -- Phần xử lý vuốt lại dây (newEdges) giữ nguyên như cũ --
      let newEdges = state.edges.map(e => {
        let updatedEdge = { ...e };
        const actualTargetId = e.data?.realTarget || e.target;
        const actualSourceId = e.data?.realSource || e.source;
        const targetNode = state.nodes.find(n => n.id === actualTargetId);
        const sourceNode = state.nodes.find(n => n.id === actualSourceId);

        if (targetNode?.parentId === holderId) {
          if (isCollapsing) {
            updatedEdge.data = { ...updatedEdge.data, realTarget: actualTargetId };
            updatedEdge.target = holderId;
          } else {
            updatedEdge.target = actualTargetId;
          }
        }
        if (sourceNode?.parentId === holderId) {
          if (isCollapsing) {
            updatedEdge.data = { ...updatedEdge.data, realSource: actualSourceId };
            updatedEdge.source = holderId;
          } else {
            updatedEdge.source = actualSourceId;
          }
        }
        return updatedEdge;
      });

      return { nodes: newNodes, edges: newEdges };
    });

    // Mẹo UX: Nếu vừa "MỞ RỘNG" ra, tự động chạy lại Auto-Layout để căn chỉnh lại tất cả
    const store = get();
    const holder = store.nodes.find(n => n.id === holderId);
    if (holder && !holder.data.isCollapsed) {
      setTimeout(() => store.formatHolderList(holderId), 10);
    }
  },
  // THUẬT TOÁN AUTO-LAYOUT DYNAMIC (Tính toán theo chiều cao thật)
  formatHolderList: (holderId) => {
    set((state) => {
      const children = state.nodes
        .filter(n => n.parentId === holderId)
        .sort((a, b) => a.position.y - b.position.y);
        
      const HEADER_HEIGHT = 45;
      const PADDING_TOP = 15;
      const GAP = 10;
      let currentY = HEADER_HEIGHT + PADDING_TOP;

      const updates: Record<string, number> = {};
      children.forEach(child => {
        updates[child.id] = currentY;
        const h = child.height || (child.style?.height as number) || 50; // Cộng dồn chiều cao thật của Task
        currentY += h + GAP;
      });

      let newNodes = state.nodes.map(n => {
        if (updates[n.id] !== undefined) {
          return { 
            ...n, 
            position: { x: 16, y: updates[n.id] },
            zIndex: 10 // Ép Task con phải nổi lên trên
          };
        }
        if (n.id === holderId && !n.data.isCollapsed) {
          return { 
            ...n, 
            style: { ...n.style, height: Math.max(150, currentY + 20) },
            zIndex: -1 // FIX: Vỏ luôn bị ép chìm xuống
          };
        }
        return n;
      });

      return { nodes: newNodes };
    });
  },
  past: [],
  future: [],
  
  // Hàm chụp lại hiện trạng bảng (Lưu tối đa 20 bước để nhẹ RAM)
  takeSnapshot: () => {
    set((state) => ({
      past: [...state.past.slice(-20), { nodes: state.nodes, edges: state.edges }],
      future: [] // Hủy tương lai nếu có hành động mới
    }));
  },

  undo: () => {
    set((state) => {
      if (state.past.length === 0) return state;
      const previous = state.past[state.past.length - 1];
      const newPast = state.past.slice(0, -1);
      return {
        past: newPast,
        future: [{ nodes: state.nodes, edges: state.edges }, ...state.future],
        nodes: previous.nodes,
        edges: previous.edges,
      };
    });
  },

  redo: () => {
    set((state) => {
      if (state.future.length === 0) return state;
      const next = state.future[0];
      const newFuture = state.future.slice(1);
      return {
        past: [...state.past, { nodes: state.nodes, edges: state.edges }],
        future: newFuture,
        nodes: next.nodes,
        edges: next.edges,
      };
    });
  },
}));