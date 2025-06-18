import React, { useState, useEffect } from 'react';
import { 
  FolderIcon,
  DocumentIcon,
  PlusIcon,
  TrashIcon,
  PencilIcon,
  ArrowUpTrayIcon,
  ArrowDownTrayIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { FileSystemItem, FileContent } from '../types';
import { FileExplorer } from '../components/FileExplorer';
import { FileEditor } from '../components/FileEditor';
import { FileViewer } from '../components/FileViewer';
import { useWebSocket } from '../contexts/WebSocketContext';
import toast from 'react-hot-toast';

export const FilesPage: React.FC = () => {
  const { sendMessage, addMessageHandler, removeMessageHandler } = useWebSocket();
  
  const [currentPath, setCurrentPath] = useState('/workspace');
  const [files, setFiles] = useState<FileSystemItem[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileSystemItem | null>(null);
  const [openFiles, setOpenFiles] = useState<Map<string, FileContent>>(new Map());
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'edit' | 'view'>('edit');

  // Load files for current path
  useEffect(() => {
    const handleFilesResponse = (payload: any) => {
      setFiles(payload.files || []);
      setLoading(false);
    };

    const handleFileContent = (payload: any) => {
      const { path, content, size, modified } = payload;
      const fileContent: FileContent = {
        content,
        size,
        modified: new Date(modified),
        encoding: 'utf8'
      };
      
      setOpenFiles(prev => new Map(prev).set(path, fileContent));
      setActiveTab(path);
    };

    const handleFileError = (payload: any) => {
      toast.error(payload.error || 'File operation failed');
    };

    addMessageHandler('files:list', handleFilesResponse);
    addMessageHandler('files:content', handleFileContent);
    addMessageHandler('files:error', handleFileError);

    // Load current directory
    loadDirectory(currentPath);

    return () => {
      removeMessageHandler('files:list', handleFilesResponse);
      removeMessageHandler('files:content', handleFileContent);
      removeMessageHandler('files:error', handleFileError);
    };
  }, [currentPath, sendMessage, addMessageHandler, removeMessageHandler]);

  const loadDirectory = (path: string) => {
    setLoading(true);
    sendMessage('files:list', { path });
  };

  const navigateToPath = (path: string) => {
    setCurrentPath(path);
  };

  const openFile = (file: FileSystemItem) => {
    if (file.type === 'directory') {
      navigateToPath(file.path);
    } else {
      sendMessage('files:read', { path: file.path });
      setSelectedFile(file);
    }
  };

  const closeFile = (path: string) => {
    setOpenFiles(prev => {
      const newMap = new Map(prev);
      newMap.delete(path);
      return newMap;
    });
    
    if (activeTab === path) {
      const remainingFiles = Array.from(openFiles.keys()).filter(p => p !== path);
      setActiveTab(remainingFiles.length > 0 ? remainingFiles[0] : null);
    }
  };

  const saveFile = async (path: string, content: string) => {
    sendMessage('files:write', { path, content });
    
    // Update local content
    setOpenFiles(prev => {
      const newMap = new Map(prev);
      const existing = newMap.get(path);
      if (existing) {
        newMap.set(path, {
          ...existing,
          content,
          modified: new Date()
        });
      }
      return newMap;
    });
    
    toast.success('File saved successfully');
  };

  const createNewFile = () => {
    const fileName = prompt('Enter file name:');
    if (fileName) {
      const filePath = `${currentPath}/${fileName}`;
      sendMessage('files:write', { path: filePath, content: '' });
      
      // Add to open files
      const fileContent: FileContent = {
        content: '',
        size: 0,
        modified: new Date(),
        encoding: 'utf8'
      };
      
      setOpenFiles(prev => new Map(prev).set(filePath, fileContent));
      setActiveTab(filePath);
      
      // Refresh directory
      loadDirectory(currentPath);
    }
  };

  const createNewFolder = () => {
    const folderName = prompt('Enter folder name:');
    if (folderName) {
      const folderPath = `${currentPath}/${folderName}`;
      sendMessage('files:mkdir', { path: folderPath });
      loadDirectory(currentPath);
    }
  };

  const deleteFile = (file: FileSystemItem) => {
    if (confirm(`Are you sure you want to delete ${file.name}?`)) {
      sendMessage('files:delete', { path: file.path });
      
      // Close file if it's open
      if (openFiles.has(file.path)) {
        closeFile(file.path);
      }
      
      loadDirectory(currentPath);
      toast.success(`${file.type === 'directory' ? 'Folder' : 'File'} deleted`);
    }
  };

  const renameFile = (file: FileSystemItem) => {
    const newName = prompt('Enter new name:', file.name);
    if (newName && newName !== file.name) {
      const newPath = `${file.path.substring(0, file.path.lastIndexOf('/'))}/${newName}`;
      sendMessage('files:move', { from: file.path, to: newPath });
      
      // Update open files if necessary
      if (openFiles.has(file.path)) {
        const content = openFiles.get(file.path);
        if (content) {
          setOpenFiles(prev => {
            const newMap = new Map(prev);
            newMap.delete(file.path);
            newMap.set(newPath, content);
            return newMap;
          });
          
          if (activeTab === file.path) {
            setActiveTab(newPath);
          }
        }
      }
      
      loadDirectory(currentPath);
      toast.success('File renamed successfully');
    }
  };

  const uploadFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        const filePath = `${currentPath}/${file.name}`;
        sendMessage('files:write', { path: filePath, content });
        loadDirectory(currentPath);
        toast.success('File uploaded successfully');
      };
      reader.readAsText(file);
    }
  };

  const downloadFile = (file: FileSystemItem) => {
    const content = openFiles.get(file.path);
    if (content) {
      const blob = new Blob([content.content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
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
      default:
        return <DocumentIcon className="w-5 h-5 text-gray-400" />;
    }
  };

  const renderBreadcrumb = () => {
    const parts = currentPath.split('/').filter(Boolean);
    return (
      <div className="flex items-center space-x-2 text-sm text-gray-400">
        <button
          onClick={() => navigateToPath('/')}
          className="hover:text-white transition-colors"
        >
          /
        </button>
        {parts.map((part, index) => {
          const path = '/' + parts.slice(0, index + 1).join('/');
          return (
            <React.Fragment key={path}>
              <span>/</span>
              <button
                onClick={() => navigateToPath(path)}
                className="hover:text-white transition-colors"
              >
                {part}
              </button>
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  return (
    <div className="h-full flex">
      {/* File Explorer Sidebar */}
      <div className="w-80 border-r border-gray-700 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-white">Files</h2>
            <div className="flex space-x-1">
              <button
                onClick={createNewFile}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                title="New File"
              >
                <DocumentIcon className="w-4 h-4" />
              </button>
              <button
                onClick={createNewFolder}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                title="New Folder"
              >
                <FolderIcon className="w-4 h-4" />
              </button>
              <label className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors cursor-pointer">
                <ArrowUpTrayIcon className="w-4 h-4" />
                <input
                  type="file"
                  className="hidden"
                  onChange={uploadFile}
                />
              </label>
            </div>
          </div>
          
          {/* Breadcrumb */}
          {renderBreadcrumb()}
        </div>

        {/* File List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center">
              <div className="spinner mb-2" />
              <p className="text-sm text-gray-400">Loading files...</p>
            </div>
          ) : (
            <FileExplorer
              files={files}
              onFileSelect={openFile}
              onFileDelete={deleteFile}
              onFileRename={renameFile}
              selectedFile={selectedFile}
            />
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Tabs */}
        {openFiles.size > 0 && (
          <div className="border-b border-gray-700 flex items-center overflow-x-auto">
            {Array.from(openFiles.keys()).map(path => {
              const fileName = path.split('/').pop() || path;
              return (
                <div
                  key={path}
                  className={`flex items-center space-x-2 px-4 py-2 border-r border-gray-700 cursor-pointer ${
                    activeTab === path ? 'bg-gray-700' : 'hover:bg-gray-800'
                  }`}
                  onClick={() => setActiveTab(path)}
                >
                  <span className="text-sm text-white truncate max-w-32">
                    {fileName}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      closeFile(path);
                    }}
                    className="text-gray-400 hover:text-white"
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* File Content */}
        <div className="flex-1 overflow-hidden">
          {activeTab && openFiles.has(activeTab) ? (
            <div className="h-full flex flex-col">
              {/* File Actions */}
              <div className="flex items-center justify-between p-2 border-b border-gray-700">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setViewMode('edit')}
                    className={`px-3 py-1 text-sm rounded ${
                      viewMode === 'edit' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    <PencilIcon className="w-4 h-4 inline mr-1" />
                    Edit
                  </button>
                  <button
                    onClick={() => setViewMode('view')}
                    className={`px-3 py-1 text-sm rounded ${
                      viewMode === 'view' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    <EyeIcon className="w-4 h-4 inline mr-1" />
                    Preview
                  </button>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      const file = files.find(f => f.path === activeTab);
                      if (file) downloadFile(file);
                    }}
                    className="p-1 text-gray-400 hover:text-white transition-colors"
                    title="Download"
                  >
                    <ArrowDownTrayIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Editor/Viewer */}
              <div className="flex-1">
                {viewMode === 'edit' ? (
                  <FileEditor
                    path={activeTab}
                    content={openFiles.get(activeTab)!}
                    onSave={saveFile}
                  />
                ) : (
                  <FileViewer
                    path={activeTab}
                    content={openFiles.get(activeTab)!}
                  />
                )}
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <DocumentIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">No file selected</h3>
                <p className="text-gray-400">
                  Select a file from the explorer to view or edit it
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};