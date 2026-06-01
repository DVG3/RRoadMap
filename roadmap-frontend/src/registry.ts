import TaskNode from './plugins/nodes/TaskNode';
import TaskProperties from './plugins/properties/TaskProperties';
import TaskHolderNode from './plugins/nodes/TaskHolderNode';
import TaskHolderProperties from './plugins/properties/TaskHolderProperties';
import NoteNode from './plugins/nodes/NoteNode';
import RerouteNode from './plugins/nodes/RerouteNode';
import GroupNode from './plugins/nodes/GroupNode'; // <-- THÊM

export const NodeRegistry = {
  'task': TaskNode,
  'task-holder': TaskHolderNode,
  'note': NoteNode,
  'reroute': RerouteNode,
  'custom-group': GroupNode, // <-- THÊM
};

export const PropertiesRegistry = {
  'task': TaskProperties,
  'task-holder': TaskHolderProperties,
};