import React, { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { FileContent } from '../types';

interface FileEditorProps {
  path: string;
  content: FileContent;
  onSave: (path: string, content: string) => void;
}

export const FileEditor: React.FC<FileEditorProps> = ({ path, content, onSave }) => {
  const [editorContent, setEditorContent] = useState(content.content);
  const [hasChanges, setHasChanges] = useState(false);
  const editorRef = useRef<any>(null);

  useEffect(() => {
    setEditorContent(content.content);
    setHasChanges(false);
  }, [content.content, path]);

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      setEditorContent(value);
      setHasChanges(value !== content.content);
    }
  };

  const handleSave = () => {
    onSave(path, editorContent);
    setHasChanges(false);
  };

  const getLanguage = (filePath: string) => {
    const extension = filePath.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'js':
      case 'jsx':
        return 'javascript';
      case 'ts':
      case 'tsx':
        return 'typescript';
      case 'py':
        return 'python';
      case 'json':
        return 'json';
      case 'html':
      case 'htm':
        return 'html';
      case 'css':
        return 'css';
      case 'md':
        return 'markdown';
      case 'xml':
        return 'xml';
      case 'yaml':
      case 'yml':
        return 'yaml';
      case 'sql':
        return 'sql';
      case 'sh':
        return 'shell';
      case 'dockerfile':
        return 'dockerfile';
      default:
        return 'plaintext';
    }
  };

  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor;
    
    // Add save keyboard shortcut
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      handleSave();
    });
  };

  return (
    <div className="h-full flex flex-col">
      {/* Editor Header */}
      <div className="flex items-center justify-between p-2 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-300">
            {path.split('/').pop()}
          </span>
          {hasChanges && (
            <span className="w-2 h-2 bg-orange-500 rounded-full" title="Unsaved changes" />
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-500">
            {getLanguage(path)}
          </span>
          <button
            onClick={handleSave}
            disabled={!hasChanges}
            className={`px-3 py-1 text-xs rounded transition-colors ${
              hasChanges
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-gray-600 text-gray-400 cursor-not-allowed'
            }`}
          >
            Save
          </button>
        </div>
      </div>

      {/* Monaco Editor */}
      <div className="flex-1">
        <Editor
          height="100%"
          language={getLanguage(path)}
          value={editorContent}
          onChange={handleEditorChange}
          onMount={handleEditorDidMount}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: 'on',
            roundedSelection: false,
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            insertSpaces: true,
            wordWrap: 'on',
            folding: true,
            foldingStrategy: 'indentation',
            showFoldingControls: 'always',
            unfoldOnClickAfterEndOfLine: false,
            contextmenu: true,
            mouseWheelZoom: true,
            multiCursorModifier: 'ctrlCmd',
            formatOnPaste: true,
            formatOnType: true,
            autoIndent: 'full',
            bracketPairColorization: {
              enabled: true
            },
            guides: {
              bracketPairs: true,
              indentation: true
            },
            suggest: {
              showKeywords: true,
              showSnippets: true,
              showFunctions: true,
              showConstructors: true,
              showFields: true,
              showVariables: true,
              showClasses: true,
              showStructs: true,
              showInterfaces: true,
              showModules: true,
              showProperties: true,
              showEvents: true,
              showOperators: true,
              showUnits: true,
              showValues: true,
              showConstants: true,
              showEnums: true,
              showEnumMembers: true,
              showColors: true,
              showFiles: true,
              showReferences: true,
              showFolders: true,
              showTypeParameters: true,
              showIssues: true,
              showUsers: true
            }
          }}
        />
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between px-4 py-1 bg-gray-800 border-t border-gray-700 text-xs text-gray-400">
        <div className="flex items-center space-x-4">
          <span>Lines: {editorContent.split('\n').length}</span>
          <span>Size: {new Blob([editorContent]).size} bytes</span>
          <span>Encoding: {content.encoding}</span>
        </div>
        
        <div className="flex items-center space-x-4">
          {hasChanges && (
            <span className="text-orange-400">Unsaved changes</span>
          )}
          <span>Ctrl+S to save</span>
        </div>
      </div>
    </div>
  );
};