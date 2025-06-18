import React, { useState, useEffect } from 'react';
import { 
  MagnifyingGlassIcon,
  FunnelIcon,
  StarIcon,
  DownloadIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { Extension, ExtensionCategory } from '../types';
import { useWebSocket } from '../contexts/WebSocketContext';
import toast from 'react-hot-toast';

export const ExtensionsPage: React.FC = () => {
  const { sendMessage, addMessageHandler, removeMessageHandler } = useWebSocket();
  
  const [extensions, setExtensions] = useState<Extension[]>([]);
  const [categories, setCategories] = useState<ExtensionCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFeaturedOnly, setShowFeaturedOnly] = useState(false);
  const [showInstalledOnly, setShowInstalledOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [installing, setInstalling] = useState<Set<string>>(new Set());

  // Load extensions and categories
  useEffect(() => {
    const handleExtensionsResponse = (payload: any) => {
      setExtensions(payload.extensions || []);
      setLoading(false);
    };

    const handleCategoriesResponse = (payload: any) => {
      setCategories(payload.categories || []);
    };

    const handleExtensionInstalled = (payload: any) => {
      const { extensionId } = payload;
      setExtensions(prev => prev.map(ext => 
        ext.id === extensionId 
          ? { ...ext, installed: true, enabled: true }
          : ext
      ));
      setInstalling(prev => {
        const newSet = new Set(prev);
        newSet.delete(extensionId);
        return newSet;
      });
      toast.success('Extension installed successfully');
    };

    const handleExtensionUninstalled = (payload: any) => {
      const { extensionId } = payload;
      setExtensions(prev => prev.map(ext => 
        ext.id === extensionId 
          ? { ...ext, installed: false, enabled: false }
          : ext
      ));
      toast.success('Extension uninstalled');
    };

    addMessageHandler('mcp:extensions', handleExtensionsResponse);
    addMessageHandler('mcp:extension_categories', handleCategoriesResponse);
    addMessageHandler('mcp:extension:installed', handleExtensionInstalled);
    addMessageHandler('mcp:extension:uninstalled', handleExtensionUninstalled);

    // Load data
    sendMessage('mcp:get_extensions', { featured: showFeaturedOnly });
    sendMessage('mcp:get_extension_categories', {});

    return () => {
      removeMessageHandler('mcp:extensions', handleExtensionsResponse);
      removeMessageHandler('mcp:extension_categories', handleCategoriesResponse);
      removeMessageHandler('mcp:extension:installed', handleExtensionInstalled);
      removeMessageHandler('mcp:extension:uninstalled', handleExtensionUninstalled);
    };
  }, [sendMessage, addMessageHandler, removeMessageHandler, showFeaturedOnly]);

  const filteredExtensions = extensions.filter(extension => {
    if (selectedCategory !== 'all' && extension.category !== selectedCategory) {
      return false;
    }
    
    if (showInstalledOnly && !extension.installed) {
      return false;
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        extension.name.toLowerCase().includes(query) ||
        extension.description.toLowerCase().includes(query) ||
        extension.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }
    
    return true;
  });

  const installExtension = async (extensionId: string) => {
    setInstalling(prev => new Set(prev).add(extensionId));
    sendMessage('mcp:install_extension', { extensionId });
  };

  const uninstallExtension = async (extensionId: string) => {
    sendMessage('mcp:uninstall_extension', { extensionId });
  };

  const toggleExtension = async (extensionId: string, enabled: boolean) => {
    sendMessage('mcp:toggle_extension', { extensionId, enabled });
    setExtensions(prev => prev.map(ext => 
      ext.id === extensionId ? { ...ext, enabled } : ext
    ));
  };

  const renderExtensionCard = (extension: Extension) => (
    <div
      key={extension.id}
      className={`extension-card ${extension.installed ? 'installed' : ''} ${extension.featured ? 'featured' : ''}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          {extension.icon ? (
            <img src={extension.icon} alt={extension.name} className="w-10 h-10 rounded-lg" />
          ) : (
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">
                {extension.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div>
            <h3 className="font-semibold text-white">{extension.name}</h3>
            <p className="text-sm text-gray-400">by {extension.author}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {extension.featured && (
            <StarIcon className="w-5 h-5 text-yellow-500" />
          )}
          {extension.installed && (
            <CheckIcon className="w-5 h-5 text-green-500" />
          )}
        </div>
      </div>

      <p className="text-gray-300 text-sm mb-3 line-clamp-2">
        {extension.description}
      </p>

      <div className="flex items-center space-x-4 text-xs text-gray-500 mb-3">
        <div className="flex items-center space-x-1">
          <StarIcon className="w-3 h-3" />
          <span>{extension.rating.toFixed(1)}</span>
        </div>
        <div className="flex items-center space-x-1">
          <DownloadIcon className="w-3 h-3" />
          <span>{extension.downloads.toLocaleString()}</span>
        </div>
        <span>v{extension.version}</span>
      </div>

      <div className="flex flex-wrap gap-1 mb-4">
        {extension.tags.slice(0, 3).map(tag => (
          <span
            key={tag}
            className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded-full"
          >
            {tag}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between">
        {extension.installed ? (
          <div className="flex items-center space-x-2">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={extension.enabled}
                onChange={(e) => toggleExtension(extension.id, e.target.checked)}
                className="rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-300">Enabled</span>
            </label>
            <button
              onClick={() => uninstallExtension(extension.id)}
              className="p-1 text-red-400 hover:text-red-300 transition-colors"
              title="Uninstall"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => installExtension(extension.id)}
            disabled={installing.has(extension.id)}
            className="btn-primary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {installing.has(extension.id) ? (
              <div className="flex items-center space-x-2">
                <div className="spinner" />
                <span>Installing...</span>
              </div>
            ) : (
              'Install'
            )}
          </button>
        )}
        
        <button className="btn-outline text-sm">
          View Details
        </button>
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Extension Store</h1>
            <p className="text-gray-400">Discover and install MCP extensions</p>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowFeaturedOnly(!showFeaturedOnly)}
              className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                showFeaturedOnly
                  ? 'bg-yellow-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <StarIcon className="w-4 h-4 inline mr-1" />
              Featured
            </button>
            <button
              onClick={() => setShowInstalledOnly(!showInstalledOnly)}
              className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                showInstalledOnly
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <CheckIcon className="w-4 h-4 inline mr-1" />
              Installed
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search extensions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <FunnelIcon className="w-4 h-4 text-gray-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-gray-800 border border-gray-600 rounded-lg text-white px-3 py-2 focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name} ({category.count})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="spinner mb-4" />
              <p className="text-gray-400">Loading extensions...</p>
            </div>
          </div>
        ) : filteredExtensions.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <MagnifyingGlassIcon className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">No extensions found</h3>
            <p className="text-gray-400">
              {searchQuery || selectedCategory !== 'all' || showInstalledOnly
                ? 'Try adjusting your search or filters'
                : 'No extensions available at the moment'
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredExtensions.map(renderExtensionCard)}
          </div>
        )}
      </div>

      {/* Stats Footer */}
      <div className="border-t border-gray-700 px-6 py-3">
        <div className="flex items-center justify-between text-sm text-gray-400">
          <span>
            Showing {filteredExtensions.length} of {extensions.length} extensions
          </span>
          <span>
            {extensions.filter(e => e.installed).length} installed
          </span>
        </div>
      </div>
    </div>
  );
};