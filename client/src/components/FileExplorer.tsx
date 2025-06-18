import React, { useState } from 'react';
import { 
  FolderIcon,
  DocumentIcon,
  EllipsisVerticalIcon,
  TrashIcon,
  PencilIcon,
  ClipboardDocumentIcon
} from '@heroicons/react/24/outline';
import { FileSystemItem } from '../types';

interface FileExplorerProps {
  files: FileSystemItem[];
  onFileSelect: (file: FileSystemItem) => void;
  onFileDelete: (file: FileSystemItem) => void;
  onFileRename: (file: FileSystemItem) => void;
  selectedFile: FileSystemItem | null;
}

export const FileExplorer: React.FC<FileExplorerProps> = ({
  files,
  onFileSelect,
  onFileDelete,
  onFileRename,
  selectedFile
}) => {
  const [contextMenu, setContextMenu] = useState<{
    file: FileSystemItem;
    x: number;
    y: number;
  } | null>(null);

  const handleContextMenu = (e: React.MouseEvent, file: FileSystemItem) => {
    e.preventDefault();
    setContextMenu({
      file,
      x: e.clientX,
      y: e.clientY
    });
  };

  const closeContextMenu = () => {
    setContextMenu(null);
  };

  const getFileIcon = (file: FileSystemItem) => {
    if (file.type === 'directory') {
      return <FolderIcon className="w-5 h-5 text-blue-400" />;
    }
    
    const extension = file.name.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'js':
      case 'ts':
      case 'jsx':
      case 'tsx':
        return <DocumentIcon className="w-5 h-5 text-yellow-400" />;
      case 'py':
        return <DocumentIcon className="w-5 h-5 text-green-400" />;
      case 'json':
        return <DocumentIcon className="w-5 h-5 text-orange-400" />;
      case 'md':
        return <DocumentIcon className="w-5 h-5 text-blue-400" />;
      case 'xlsx':
      case 'xls':
        return <DocumentIcon className="w-5 h-5 text-green-500" />;
      case 'csv':
        return <DocumentIcon className="w-5 h-5 text-green-400" />;
      case 'txt':
        return <DocumentIcon className="w-5 h-5 text-gray-300" />;
      case 'html':
      case 'htm':
        return <DocumentIcon className="w-5 h-5 text-orange-500" />;
      case 'css':
        return <DocumentIcon className="w-5 h-5 text-blue-500" />;
      case 'xml':
        return <DocumentIcon className="w-5 h-5 text-purple-400" />;
      default:
        return <DocumentIcon className="w-5 h-5 text-gray-400" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString([], { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Sort files: directories first, then by name
  const sortedFiles = [...files].sort((a, b) => {
    if (a.type !== b.type) {
      return a.type === 'directory' ? -1 : 1;
    }
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="relative" onClick={closeContextMenu}>
      {sortedFiles.length === 0 ? (
        <div className="p-4 text-center text-gray-400">
          <FolderIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p className="text-sm">This folder is empty</p>
        </div>
      ) : (
        <div className="space-y-1 p-2">
          {sortedFiles.map((file) => (
            <div
              key={file.path}
              className={`file-tree-item ${file.type} ${
                selectedFile?.path === file.path ? 'selected' : ''
              }`}
              onClick={() => onFileSelect(file)}
              onContextMenu={(e) => handleContextMenu(e, file)}
            >
              <div className="flex items-center space-x-2 flex-1 min-w-0">
                {getFileIcon(file)}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white truncate">
                    {file.name}
                  </div>
                  <div className="text-xs text-gray-500 flex items-center space-x-2">
                    {file.type === 'file' && file.size !== undefined && (
                      <span>{formatFileSize(file.size)}</span>
                    )}
                    {file.modified && (
                      <span>{formatDate(file.modified)}</span>
                    )}
                  </div>
                </div>
              </div>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleContextMenu(e, file);
                }}
                className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-white transition-opacity"
              >
                <EllipsisVerticalIcon className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed bg-gray-800 border border-gray-600 rounded-lg shadow-lg py-2 z-50"
          style={{
            left: contextMenu.x,
            top: contextMenu.y
          }}
        >
          <button
            onClick={() => {
              onFileSelect(contextMenu.file);
              closeContextMenu();
            }}
            className="w-full text-left px-4 py-2 text-sm text-white hover:bg-gray-700 flex items-center space-x-2"
          >
            <DocumentIcon className="w-4 h-4" />
            <span>Open</span>
          </button>
          
          <button
            onClick={() => {
              onFileRename(contextMenu.file);
              closeContextMenu();
            }}
            className="w-full text-left px-4 py-2 text-sm text-white hover:bg-gray-700 flex items-center space-x-2"
          >
            <PencilIcon className="w-4 h-4" />
            <span>Rename</span>
          </button>
          
          <button
            onClick={() => {
              navigator.clipboard.writeText(contextMenu.file.path);
              closeContextMenu();
            }}
            className="w-full text-left px-4 py-2 text-sm text-white hover:bg-gray-700 flex items-center space-x-2"
          >
            <ClipboardDocumentIcon className="w-4 h-4" />
            <span>Copy Path</span>
          </button>
          
          <hr className="border-gray-600 my-1" />
          
          <button
            onClick={() => {
              onFileDelete(contextMenu.file);
              closeContextMenu();
            }}
            className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-700 flex items-center space-x-2"
          >
            <TrashIcon className="w-4 h-4" />
            <span>Delete</span>
          </button>
        </div>
      )}
    </div>
  );
};