import { Handle, Position } from 'reactflow';

export default function RerouteNode({ selected }: { selected: boolean }) {
  return (
    <div className={`w-4 h-4 rounded-full bg-gray-500 border-2 ${selected ? 'border-blue-500 shadow-md ring-2 ring-blue-300' : 'border-white shadow-sm'}`}>
      <Handle type="target" position={Position.Left} className="opacity-0 w-4 h-4" />
      <Handle type="source" position={Position.Right} className="opacity-0 w-4 h-4" />
    </div>
  );
}