import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, 
  Filter, 
  Download, 
  Star, 
  Trash2, 
  Settings, 
  Play, 
  Pause,
  ExternalLink,
  TrendingUp
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { mcpAPI, extensionAPI } from '../services/api';
import toast from 'react-hot-toast';

const Extensions = () => {
  const { state, actions } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showInstalled, setShowInstalled] = useState(false);
  const [extensions, setExtensions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [trending, setTrending] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [extensionsRes, categoriesRes, trendingRes, installedRes] = await Promise.all([
        mcpAPI.getExtensions(),
        extensionAPI.getCategories(),
        extensionAPI.getTrending(),
        mcpAPI.getInstalledExtensions()
      ]);

      setExtensions(extensionsRes.extensions || []);
      setCategories(categoriesRes.categories || []);
      setTrending(trendingRes.extensions || []);
      actions.setInstalledExtensions(installedRes.extensions || []);
    } catch (error) {
      console.error('Error loading extensions:', error);
      toast.error('Failed to load extensions');
    } finally {
      setLoading(false);
    }
  };

  const handleInstall = async (extensionId) => {
    try {
      await mcpAPI.installExtension(extensionId);
      toast.success('Extension installed successfully');
      loadData(); // Refresh data
    } catch (error) {
      console.error('Error installing extension:', error);
      toast.error('Failed to install extension');
    }
  };

  const handleUninstall = async (extensionId) => {
    try {
      await mcpAPI.uninstallExtension(extensionId);
      toast.success('Extension uninstalled successfully');
      loadData(); // Refresh data
    } catch (error) {
      console.error('Error uninstalling extension:', error);
      toast.error('Failed to uninstall extension');
    }
  };

  const handleToggle = async (extensionId, enabled) => {
    try {
      await mcpAPI.toggleExtension(extensionId, enabled);
      toast.success(`Extension ${enabled ? 'enabled' : 'disabled'} successfully`);
      loadData(); // Refresh data
    } catch (error) {
      console.error('Error toggling extension:', error);
      toast.error('Failed to toggle extension');
    }
  };

  const filteredExtensions = extensions.filter(ext => {
    const matchesSearch = ext.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         ext.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || ext.category === selectedCategory;
    const matchesInstalled = !showInstalled || state.installedExtensions.some(installed => installed.id === ext.id);
    
    return matchesSearch && matchesCategory && matchesInstalled;
  });

  const ExtensionCard = ({ extension }) => {
    const isInstalled = state.installedExtensions.some(installed => installed.id === extension.id);
    const installedExt = state.installedExtensions.find(installed => installed.id === extension.id);
    const isEnabled = installedExt?.enabled || false;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-dark-800 rounded-lg border border-gray-200 dark:border-dark-700 p-6 hover:shadow-lg transition-shadow"
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-2xl">
              {extension.icon || '🧩'}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {extension.name}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                by {extension.author || 'Unknown'}
              </p>
            </div>
          </div>
          
          {extension.featured && (
            <div className="bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-400 px-2 py-1 rounded-full text-xs font-medium">
              Featured
            </div>
          )}
        </div>

        <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
          {extension.description}
        </p>

        <div className="flex flex-wrap gap-2 mb-4">
          {extension.capabilities?.slice(0, 3).map((capability, index) => (
            <span
              key={index}
              className="bg-gray-100 dark:bg-dark-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded text-xs"
            >
              {capability.replace(/_/g, ' ')}
            </span>
          ))}
          {extension.capabilities?.length > 3 && (
            <span className="text-gray-500 dark:text-gray-400 text-xs">
              +{extension.capabilities.length - 3} more
            </span>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center space-x-1">
              <Star className="w-4 h-4" />
              <span>4.8</span>
            </div>
            <div className="flex items-center space-x-1">
              <Download className="w-4 h-4" />
              <span>2.3k</span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {isInstalled ? (
              <>
                <button
                  onClick={() => handleToggle(extension.id, !isEnabled)}
                  className={`p-2 rounded-lg transition-colors ${
                    isEnabled
                      ? 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400'
                      : 'bg-gray-100 dark:bg-dark-700 text-gray-600 dark:text-gray-400'
                  }`}
                  title={isEnabled ? 'Disable' : 'Enable'}
                >
                  {isEnabled ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>
                
                <button
                  className="p-2 bg-gray-100 dark:bg-dark-700 text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-200 dark:hover:bg-dark-600 transition-colors"
                  title="Settings"
                >
                  <Settings className="w-4 h-4" />
                </button>
                
                <button
                  onClick={() => handleUninstall(extension.id)}
                  className="p-2 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/30 transition-colors"
                  title="Uninstall"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            ) : (
              <button
                onClick={() => handleInstall(extension.id)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Install</span>
              </button>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading extensions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-dark-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Extension Marketplace
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Discover and install MCP extensions to enhance your AI assistant
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowInstalled(!showInstalled)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                showInstalled
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-dark-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              {showInstalled ? 'Show All' : 'Show Installed'}
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search extensions..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-dark-700 border border-gray-200 dark:border-dark-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="flex items-center space-x-3">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 bg-gray-50 dark:bg-dark-700 border border-gray-200 dark:border-dark-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.icon} {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Trending Section */}
      {!showInstalled && trending.length > 0 && (
        <div className="border-b border-gray-200 dark:border-dark-700 p-6">
          <div className="flex items-center space-x-2 mb-4">
            <TrendingUp className="w-5 h-5 text-orange-500" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Trending Extensions
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {trending.slice(0, 3).map(extension => (
              <div
                key={extension.id}
                className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-lg p-4 border border-orange-200 dark:border-orange-800"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    {extension.name}
                  </h3>
                  <span className="text-green-600 dark:text-green-400 text-sm font-medium">
                    {extension.trend}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                  {extension.description}
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 text-sm text-gray-500 dark:text-gray-400">
                    <span>{extension.downloads} downloads</span>
                    <span>★ {extension.rating}</span>
                  </div>
                  <button className="text-blue-600 dark:text-blue-400 hover:underline text-sm">
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Extensions Grid */}
      <div className="flex-1 overflow-y-auto p-6">
        {filteredExtensions.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 dark:bg-dark-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No extensions found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Try adjusting your search or filter criteria
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredExtensions.map(extension => (
              <ExtensionCard key={extension.id} extension={extension} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Extensions;