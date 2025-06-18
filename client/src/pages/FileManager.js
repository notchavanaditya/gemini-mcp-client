import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Folder, 
  File, 
  Upload, 
  Download, 
  Trash2, 
  Copy, 
  Move, 
  Search,
  Plus,
  RefreshCw,
  Eye,
  Edit3
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { fileAPI } from '../services/api';
import toast from 'react-hot-toast';
import Editor from '@monaco-editor/react';

const FileManager = () => {
  const { state, actions } = useApp();
  const [currentPath, setCurrentPath] = useState('/workspace');
  const [files, setFiles] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [editingFile, setEditingFile] = useState(null);
  const [fileContent, setFileContent] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadFiles(currentPath);
  }, [currentPath]);

  const loadFiles = async (path) => {
    try {
      setLoading(true);
      const response = await fileAPI.listFiles(path);
      setFiles(response.items || []);
      actions.setFileTree(response.items);
    } catch (error) {
      console.error('Error loading files:', error);
      toast.error('Failed to load files');
    } finally {
      setLoading(false);
    }
  };

  const handleFileClick = async (file) => {
    if (file.type === 'directory') {
      setCurrentPath(file.path);
    } else {
      // Open file for viewing/editing
      try {
        const response = await fileAPI.readFile(file.path);
        setEditingFile(file);
        setFileContent(response.content);
        setShowEditor(true);
        actions.setSelectedFile(file);
      } catch (error) {
        console.error('Error reading file:', error);
        toast.error('Failed to read file');
      }
    }
  };

  const handleSaveFile = async () => {
    if (!editingFile) return;
    
    try {
      await fileAPI.writeFile(editingFile.path, fileContent);
      toast.success('File saved successfully');
      loadFiles(currentPath);
    } catch (error) {
      console.error('Error saving file:', error);
      toast.error('Failed to save file');
    }
  };

  const handleDeleteFile = async (filePath) => {
    try {
      await fileAPI.deleteFile(filePath);
      toast.success('File deleted successfully');
      loadFiles(currentPath);
      setSelectedFiles(selectedFiles.filter(f => f !== filePath));
    } catch (error) {
      console.error('Error deleting file:', error);
      toast.error('Failed to delete file');
    }
  };

  const handleCreateFolder = async () => {
    const name = prompt('Enter folder name:');
    if (name) {
      try {
        const newPath = `${currentPath}/${name}`;
        await fileAPI.createDirectory(newPath);
        toast.success('Folder created successfully');
        loadFiles(currentPath);
      } catch (error) {
        console.error('Error creating folder:', error);
        toast.error('Failed to create folder');
      }
    }
  };

  const handleUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      try {
        await fileAPI.uploadFile(file, currentPath);
        toast.success('File uploaded successfully');
        loadFiles(currentPath);
      } catch (error) {
        console.error('Error uploading file:', error);
        toast.error('Failed to upload file');
      }
    }
  };

  const navigateUp = () => {
    const parentPath = currentPath.split('/').slice(0, -1).join('/') || '/';
    setCurrentPath(parentPath);
  };

  const getFileIcon = (file) => {
    if (file.type === 'directory') {
      return <Folder className="w-5 h-5 text-blue-500" />;
    }
    
    const ext = file.name.split('.').pop()?.toLowerCase();
    const iconMap = {
      'js': '🟨',
      'ts': '🔷',
      'py': '🐍',
      'java': '☕',
      'html': '🌐',
      'css': '🎨',
      'json': '📋',
      'md': '📝',
      'txt': '📄',
      'xlsx': '📊',
      'csv': '📈',
      'pdf': '📕',
      'png': '🖼️',
      'jpg': '🖼️',
      'gif': '🖼️'
    };
    
    return <span className="text-lg">{iconMap[ext] || '📄'}</span>;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString() + ' ' + 
           new Date(dateString).toLocaleTimeString();
  };

  const filteredFiles = files.filter(file =>
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-full flex">
      {/* File Browser */}
      <div className={`${showEditor ? 'w-1/2' : 'w-full'} flex flex-col border-r border-gray-200 dark:border-dark-700`}>
        {/* Toolbar */}
        <div className="border-b border-gray-200 dark:border-dark-700 p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <button
                onClick={navigateUp}
                disabled={currentPath === '/'}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ←
              </button>
              <span className="text-sm text-gray-600 dark:text-gray-400 font-mono">
                {currentPath}
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => loadFiles(currentPath)}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                title="Refresh"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              
              <button
                onClick={handleCreateFolder}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                title="New Folder"
              >
                <Plus className="w-4 h-4" />
              </button>
              
              <label className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white cursor-pointer" title="Upload">
                <Upload className="w-4 h-4" />
                <input
                  type="file"
                  onChange={handleUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search files..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-dark-700 border border-gray-200 dark:border-dark-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* File List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="spinner" />
            </div>
          ) : filteredFiles.length === 0 ? (
            <div className="text-center py-12">
              <Folder className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                {searchQuery ? 'No files match your search' : 'This folder is empty'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-dark-700">
              {filteredFiles.map((file) => (
                <motion.div
                  key={file.path}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-dark-700 cursor-pointer ${
                    selectedFiles.includes(file.path) ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                  }`}
                  onClick={() => handleFileClick(file)}
                >
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    {getFileIcon(file)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {file.type === 'file' ? formatFileSize(file.size) : 'Folder'} • {formatDate(file.modified)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    {file.type === 'file' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleFileClick(file);
                        }}
                        className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        title="View/Edit"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    )}
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteFile(file.path);
                      }}
                      className="p-1 text-gray-400 hover:text-red-600"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* File Editor */}
      {showEditor && editingFile && (
        <div className="w-1/2 flex flex-col">
          <div className="border-b border-gray-200 dark:border-dark-700 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {getFileIcon(editingFile)}
                <div>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                    {editingFile.name}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {editingFile.path}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleSaveFile}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
                >
                  Save
                </button>
                <button
                  onClick={() => setShowEditor(false)}
                  className="px-3 py-1.5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-sm border border-gray-300 dark:border-dark-600 rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
          
          <div className="flex-1">
            <Editor
              height="100%"
              language={getLanguageFromExtension(editingFile.name)}
              value={fileContent}
              onChange={(value) => setFileContent(value || '')}
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: 'on',
                roundedSelection: false,
                scrollBeyondLastLine: false,
                automaticLayout: true,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

const getLanguageFromExtension = (filename) => {
  const ext = filename.split('.').pop()?.toLowerCase();
  const languageMap = {
    'js': 'javascript',
    'ts': 'typescript',
    'py': 'python',
    'java': 'java',
    'html': 'html',
    'css': 'css',
    'json': 'json',
    'md': 'markdown',
    'txt': 'plaintext',
    'xml': 'xml',
    'yaml': 'yaml',
    'yml': 'yaml',
    'sql': 'sql',
    'sh': 'shell',
    'bash': 'shell',
  };
  return languageMap[ext] || 'plaintext';
};

export default FileManager;