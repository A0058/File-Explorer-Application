export type FileType = 'file' | 'directory';

export type FileNode = {
  id: string;
  name: string;
  type: FileType;
  permissions: number;
  size: number;
  modified: Date;
  children?: { [name: string]: FileNode };
  content?: string;
  parentId: string | null;
};

const now = new Date();

const initialFileSystem: FileNode = {
  id: 'root',
  name: '~',
  type: 'directory',
  permissions: 755,
  size: 0,
  modified: now,
  parentId: null,
  children: {
    'Documents': {
      id: 'docs',
      name: 'Documents',
      type: 'directory',
      permissions: 755,
      size: 0,
      modified: now,
      parentId: 'root',
      children: {
        'report.docx': { id: 'report', name: 'report.docx', type: 'file', permissions: 644, size: 12288, modified: now, parentId: 'docs' },
        'notes.txt': { id: 'notes', name: 'notes.txt', type: 'file', permissions: 644, size: 1200, modified: now, parentId: 'docs', content: 'This is a note.' },
      },
    },
    'Pictures': {
      id: 'pics',
      name: 'Pictures',
      type: 'directory',
      permissions: 755,
      size: 0,
      modified: now,
      parentId: 'root',
      children: {
        'vacation.jpg': { id: 'vacation', name: 'vacation.jpg', type: 'file', permissions: 644, size: 204800, modified: now, parentId: 'pics' },
      },
    },
    'main.cpp': { id: 'maincpp', name: 'main.cpp', type: 'file', permissions: 644, size: 5120, modified: now, parentId: 'root' },
    'README.md': { id: 'readme', name: 'README.md', type: 'file', permissions: 644, size: 1024, modified: now, parentId: 'root' },
  },
};

let fsData: FileNode = JSON.parse(JSON.stringify(initialFileSystem), (key, value) => {
  if (key === 'modified') {
    return new Date(value);
  }
  return value;
});

const getHomePath = () => '/';
const rootNode = () => fsData;

const getNodeFromPath = (path: string): FileNode | null => {
  if (path === '/') return fsData;
  const parts = path.split('/').filter(p => p);
  let currentNode: FileNode | undefined = fsData;
  for (const part of parts) {
    if (currentNode?.type !== 'directory' || !currentNode.children || !currentNode.children[part]) {
      return null;
    }
    currentNode = currentNode.children[part];
  }
  return currentNode || null;
};

const getParentNode = (path: string): FileNode | null => {
  if (path === '/') return null;
  const parentPath = path.substring(0, path.lastIndexOf('/')) || '/';
  return getNodeFromPath(parentPath);
}

export const fileSystem = {
  list: (path: string): FileNode[] => {
    const node = getNodeFromPath(path);
    if (node && node.type === 'directory' && node.children) {
      return Object.values(node.children);
    }
    return [];
  },
  
  getNode: getNodeFromPath,

  create: (path: string, type: 'file' | 'directory'): FileNode | null => {
    const parentPath = path.substring(0, path.lastIndexOf('/')) || '/';
    const name = path.substring(path.lastIndexOf('/') + 1);
    const parentNode = getNodeFromPath(parentPath);

    if (!parentNode || parentNode.type !== 'directory' || !parentNode.children) return null;
    if (parentNode.children[name]) return null; // Already exists

    const newNode: FileNode = {
      id: `new-${Date.now()}`,
      name,
      type,
      permissions: type === 'directory' ? 755 : 644,
      size: 0,
      modified: new Date(),
      parentId: parentNode.id,
      ...(type === 'directory' && { children: {} }),
    };

    parentNode.children[name] = newNode;
    return newNode;
  },
  
  remove: (path: string): boolean => {
    const parent = getParentNode(path);
    const name = path.substring(path.lastIndexOf('/') + 1);
    if (!parent || parent.type !== 'directory' || !parent.children || !parent.children[name]) return false;
    
    // Prevent deletion of important directories
    if (path === '/' || path === '/home') return false;
    
    delete parent.children[name];
    return true;
  },
  
  rename: (oldPath: string, newPath: string): boolean => {
    const oldParent = getParentNode(oldPath);
    const oldName = oldPath.substring(oldPath.lastIndexOf('/') + 1);
    const newParent = getParentNode(newPath);
    const newName = newPath.substring(newPath.lastIndexOf('/') + 1);

    if (!oldParent?.children?.[oldName] || !newParent?.children) return false;
    if (newParent.children[newName]) return false; // Destination exists

    const nodeToMove = oldParent.children[oldName];
    nodeToMove.name = newName;
    nodeToMove.modified = new Date();
    nodeToMove.parentId = newParent.id;
    
    delete oldParent.children[oldName];
    newParent.children[newName] = nodeToMove;
    
    return true;
  },

  copy: (sourcePath: string, destPath: string): boolean => {
    const sourceNode = getNodeFromPath(sourcePath);
    const destParent = getParentNode(destPath);
    const destName = destPath.substring(destPath.lastIndexOf('/') + 1);

    if (!sourceNode || !destParent?.children) return false;
    if (destParent.children[destName]) return false; // Destination exists
    
    const copyNode = (node: FileNode): FileNode => {
        const newNode: FileNode = { ...node, id: `copy-${Date.now()}-${Math.random()}` };
        if (node.children) {
            newNode.children = {};
            for (const childName in node.children) {
                newNode.children[childName] = copyNode(node.children[childName]);
                newNode.children[childName].parentId = newNode.id;
            }
        }
        return newNode;
    };
    
    const newCopiedNode = copyNode(sourceNode);
    newCopiedNode.name = destName;
    newCopiedNode.parentId = destParent.id;
    destParent.children[destName] = newCopiedNode;
    return true;
  },
  
  chmod: (path: string, mode: number): boolean => {
    const node = getNodeFromPath(path);
    if (!node) return false;
    node.permissions = mode;
    node.modified = new Date();
    return true;
  },
  
  getAllFilePaths: (path: string = '/'): string[] => {
    const node = getNodeFromPath(path);
    if (!node) return [];

    let paths: string[] = [];
    if (node.type === 'file') {
        return [path === '/' ? `/${node.name}` : path];
    }
    
    if (node.type === 'directory' && node.children) {
        if(path !== '/') paths.push(path);
        for (const childName in node.children) {
            const childPath = path === '/' ? `/${childName}` : `${path}/${childName}`;
            paths = paths.concat(fileSystem.getAllFilePaths(childPath));
        }
    }
    return paths;
  },

  resolvePath: (currentPath: string, targetPath: string): string => {
    if (targetPath.startsWith('/')) {
        return targetPath;
    }
    const path = require('path');
    return path.resolve(currentPath, targetPath);
  },

  getHomePath,
  rootNode,
};

export const formatPermissions = (mode: number): string => {
  const perms = mode.toString(8).slice(-3);
  const map: { [key: string]: string } = {
    '0': '---', '1': '--x', '2': '-w-', '3': '-wx',
    '4': 'r--', '5': 'r-x', '6': 'rw-', '7': 'rwx',
  };
  return perms.split('').map(p => map[p]).join('');
};

export const formatSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};
