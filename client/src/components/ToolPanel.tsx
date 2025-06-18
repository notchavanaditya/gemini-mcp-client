import React, { useState, useEffect } from 'react';
import { 
  WrenchScrewdriverIcon,
  DocumentTextIcon,
  TableCellsIcon,
  FolderIcon,
  PlayIcon,
  ChevronDownIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import { MCPTool, MCPServer } from '../types';
import { useWebSocket } from '../contexts/WebSocketContext';

interface ToolPanelProps {
  onToolSelect: (tool: MCPTool, args: Record<string, any>) => void;
}

interface ToolCategory {
  name: string;
  icon: React.ComponentType<any>;
  tools: MCPTool[];
  expanded: boolean;
}

export const ToolPanel: React.FC<ToolPanelProps> = ({ onToolSelect }) => {
  const { sendMessage, addMessageHandler, removeMessageHandler } = useWebSocket();
  const [servers, setServers] = useState<MCPServer[]>([]);
  const [categories, setCategories] = useState<ToolCategory[]>([]);
  const [selectedTool, setSelectedTool] = useState<MCPTool | null>(null);
  const [toolArgs, setToolArgs] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  // Load MCP servers and tools
  useEffect(() => {
    const handleServersResponse = (payload: any) => {
      const { active } = payload;
      setServers(active || []);
      organizeCategoriesFromServers(active || []);
      setLoading(false);
    };

    addMessageHandler('mcp:servers', handleServersResponse);
    sendMessage('mcp:get_servers', {});

    return () => {
      removeMessageHandler('mcp:servers', handleServersResponse);
    };
  }, [sendMessage, addMessageHandler, removeMessageHandler]);

  const organizeCategoriesFromServers = (servers: MCPServer[]) => {
    const allTools: MCPTool[] = [];
    servers.forEach(server => {
      if (server.tools) {
        allTools.push(...server.tools);
      }
    });

    const categories: ToolCategory[] = [
      {
        name: 'Excel & Spreadsheets',
        icon: TableCellsIcon,
        tools: allTools.filter(tool => 
          tool.name.includes('excel') || 
          tool.name.includes('spreadsheet') ||
          tool.name.includes('csv')
        ),
        expanded: true
      },
      {
        name: 'File Operations',
        icon: FolderIcon,
        tools: allTools.filter(tool => 
          tool.name.includes('file') || 
          tool.name.includes('read') ||
          tool.name.includes('write') ||
          tool.name.includes('directory')
        ),
        expanded: false
      },
      {
        name: 'Text & Documents',
        icon: DocumentTextIcon,
        tools: allTools.filter(tool => 
          tool.name.includes('text') || 
          tool.name.includes('document') ||
          tool.name.includes('markdown')
        ),
        expanded: false
      },
      {
        name: 'Other Tools',
        icon: WrenchScrewdriverIcon,
        tools: allTools.filter(tool => 
          !tool.name.includes('excel') && 
          !tool.name.includes('file') && 
          !tool.name.includes('text') &&
          !tool.name.includes('spreadsheet') &&
          !tool.name.includes('csv') &&
          !tool.name.includes('read') &&
          !tool.name.includes('write') &&
          !tool.name.includes('directory') &&
          !tool.name.includes('document') &&
          !tool.name.includes('markdown')
        ),
        expanded: false
      }
    ].filter(category => category.tools.length > 0);

    setCategories(categories);
  };

  const toggleCategory = (index: number) => {
    setCategories(prev => prev.map((cat, i) => 
      i === index ? { ...cat, expanded: !cat.expanded } : cat
    ));
  };

  const selectTool = (tool: MCPTool) => {
    setSelectedTool(tool);
    setToolArgs({});
  };

  const updateToolArg = (argName: string, value: any) => {
    setToolArgs(prev => ({
      ...prev,
      [argName]: value
    }));
  };

  const executeTool = () => {
    if (selectedTool) {
      onToolSelect(selectedTool, toolArgs);
      setSelectedTool(null);
      setToolArgs({});
    }
  };

  const renderToolArgInput = (argName: string, argSchema: any) => {
    const value = toolArgs[argName] || '';
    
    switch (argSchema.type) {
      case 'string':
        if (argSchema.enum) {
          return (
            <select
              value={value}
              onChange={(e) => updateToolArg(argName, e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
            >
              <option value="">Select {argName}</option>
              {argSchema.enum.map((option: string) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          );
        }
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => updateToolArg(argName, e.target.value)}
            placeholder={argSchema.description || `Enter ${argName}`}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
          />
        );
      
      case 'number':
      case 'integer':
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => updateToolArg(argName, parseFloat(e.target.value))}
            placeholder={argSchema.description || `Enter ${argName}`}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
          />
        );
      
      case 'boolean':
        return (
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={value || false}
              onChange={(e) => updateToolArg(argName, e.target.checked)}
              className="rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-300">{argSchema.description || argName}</span>
          </label>
        );
      
      case 'array':
        return (
          <textarea
            value={Array.isArray(value) ? value.join('\n') : value}
            onChange={(e) => updateToolArg(argName, e.target.value.split('\n').filter(Boolean))}
            placeholder={`Enter ${argName} (one per line)`}
            rows={3}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 resize-none"
          />
        );
      
      default:
        return (
          <textarea
            value={typeof value === 'object' ? JSON.stringify(value, null, 2) : value}
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value);
                updateToolArg(argName, parsed);
              } catch {
                updateToolArg(argName, e.target.value);
              }
            }}
            placeholder={argSchema.description || `Enter ${argName} (JSON format)`}
            rows={3}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 resize-none"
          />
        );
    }
  };

  if (loading) {
    return (
      <div className="h-full bg-gray-800 p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mb-2" />
          <div className="text-sm text-gray-400">Loading tools...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gray-800 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-lg font-semibold text-white mb-2">MCP Tools</h2>
        <p className="text-sm text-gray-400">
          Available tools from {servers.length} active server{servers.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Tool Categories */}
      <div className="flex-1 overflow-y-auto">
        {categories.length === 0 ? (
          <div className="p-4 text-center text-gray-400">
            <WrenchScrewdriverIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No tools available</p>
            <p className="text-xs mt-1">Start some MCP servers to see tools</p>
          </div>
        ) : (
          <div className="p-2 space-y-2">
            {categories.map((category, index) => (
              <div key={category.name} className="border border-gray-700 rounded-lg">
                <button
                  onClick={() => toggleCategory(index)}
                  className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center space-x-2">
                    <category.icon className="w-5 h-5 text-gray-400" />
                    <span className="font-medium text-white">{category.name}</span>
                    <span className="text-xs text-gray-500">({category.tools.length})</span>
                  </div>
                  {category.expanded ? (
                    <ChevronDownIcon className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronRightIcon className="w-4 h-4 text-gray-400" />
                  )}
                </button>
                
                {category.expanded && (
                  <div className="border-t border-gray-700">
                    {category.tools.map((tool) => (
                      <button
                        key={tool.name}
                        onClick={() => selectTool(tool)}
                        className={`w-full text-left p-3 hover:bg-gray-700 transition-colors ${
                          selectedTool?.name === tool.name ? 'bg-blue-600' : ''
                        }`}
                      >
                        <div className="font-medium text-sm text-white mb-1">
                          {tool.name}
                        </div>
                        <div className="text-xs text-gray-400">
                          {tool.description}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tool Configuration */}
      {selectedTool && (
        <div className="border-t border-gray-700 p-4 bg-gray-750">
          <div className="mb-3">
            <h3 className="font-medium text-white mb-1">{selectedTool.name}</h3>
            <p className="text-xs text-gray-400">{selectedTool.description}</p>
          </div>

          {selectedTool.inputSchema?.properties && (
            <div className="space-y-3 mb-4">
              {Object.entries(selectedTool.inputSchema.properties).map(([argName, argSchema]: [string, any]) => (
                <div key={argName}>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    {argName}
                    {selectedTool.inputSchema?.required?.includes(argName) && (
                      <span className="text-red-400 ml-1">*</span>
                    )}
                  </label>
                  {renderToolArgInput(argName, argSchema)}
                  {argSchema.description && (
                    <p className="text-xs text-gray-500 mt-1">{argSchema.description}</p>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="flex space-x-2">
            <button
              onClick={executeTool}
              className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <PlayIcon className="w-4 h-4" />
              <span>Execute</span>
            </button>
            <button
              onClick={() => setSelectedTool(null)}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};