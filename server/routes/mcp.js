const express = require('express');
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

// MCP Extension Store
const MCP_EXTENSIONS_DIR = path.join(__dirname, '../data/mcp-extensions');
const INSTALLED_EXTENSIONS_FILE = path.join(__dirname, '../data/installed-extensions.json');

// Ensure directories exist
async function ensureDirectories() {
  try {
    await fs.mkdir(path.dirname(MCP_EXTENSIONS_DIR), { recursive: true });
    await fs.mkdir(MCP_EXTENSIONS_DIR, { recursive: true });
    await fs.mkdir(path.dirname(INSTALLED_EXTENSIONS_FILE), { recursive: true });
  } catch (error) {
    console.error('Error creating directories:', error);
  }
}

// Initialize
ensureDirectories();

// Built-in MCP extensions registry
const BUILTIN_EXTENSIONS = [
  {
    id: 'excel-mcp',
    name: 'Excel MCP',
    description: 'Advanced Excel file manipulation and analysis capabilities',
    version: '1.0.0',
    author: 'OpenHands',
    category: 'productivity',
    capabilities: [
      'read_excel',
      'write_excel',
      'analyze_data',
      'create_charts',
      'pivot_tables',
      'formulas',
      'data_validation'
    ],
    icon: '📊',
    featured: true,
    builtin: true
  },
  {
    id: 'file-manager-mcp',
    name: 'File Manager MCP',
    description: 'Comprehensive file system operations and management',
    version: '1.0.0',
    author: 'OpenHands',
    category: 'system',
    capabilities: [
      'file_operations',
      'directory_management',
      'file_search',
      'batch_operations',
      'file_monitoring'
    ],
    icon: '📁',
    featured: true,
    builtin: true
  },
  {
    id: 'code-analysis-mcp',
    name: 'Code Analysis MCP',
    description: 'Code analysis, refactoring, and documentation generation',
    version: '1.0.0',
    author: 'OpenHands',
    category: 'development',
    capabilities: [
      'code_analysis',
      'refactoring',
      'documentation',
      'testing',
      'linting'
    ],
    icon: '💻',
    featured: true,
    builtin: true
  },
  {
    id: 'data-visualization-mcp',
    name: 'Data Visualization MCP',
    description: 'Create charts, graphs, and interactive visualizations',
    version: '1.0.0',
    author: 'OpenHands',
    category: 'analytics',
    capabilities: [
      'chart_creation',
      'data_plotting',
      'interactive_viz',
      'export_formats'
    ],
    icon: '📈',
    featured: false,
    builtin: true
  }
];

// Get installed extensions
async function getInstalledExtensions() {
  try {
    const data = await fs.readFile(INSTALLED_EXTENSIONS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

// Save installed extensions
async function saveInstalledExtensions(extensions) {
  try {
    await fs.writeFile(INSTALLED_EXTENSIONS_FILE, JSON.stringify(extensions, null, 2));
  } catch (error) {
    console.error('Error saving installed extensions:', error);
    throw error;
  }
}

// Get all available extensions (builtin + registry)
router.get('/extensions', async (req, res) => {
  try {
    const { category, search, featured } = req.query;
    const installedExtensions = await getInstalledExtensions();
    const installedIds = installedExtensions.map(ext => ext.id);
    
    let extensions = [...BUILTIN_EXTENSIONS];
    
    // Add installed status
    extensions = extensions.map(ext => ({
      ...ext,
      installed: installedIds.includes(ext.id),
      enabled: installedExtensions.find(installed => installed.id === ext.id)?.enabled || false
    }));
    
    // Apply filters
    if (category) {
      extensions = extensions.filter(ext => ext.category === category);
    }
    
    if (search) {
      const searchLower = search.toLowerCase();
      extensions = extensions.filter(ext => 
        ext.name.toLowerCase().includes(searchLower) ||
        ext.description.toLowerCase().includes(searchLower) ||
        ext.capabilities.some(cap => cap.toLowerCase().includes(searchLower))
      );
    }
    
    if (featured === 'true') {
      extensions = extensions.filter(ext => ext.featured);
    }
    
    res.json({ extensions });
  } catch (error) {
    console.error('Error fetching extensions:', error);
    res.status(500).json({ error: 'Failed to fetch extensions' });
  }
});

// Get installed extensions
router.get('/installed', async (req, res) => {
  try {
    const installedExtensions = await getInstalledExtensions();
    res.json({ extensions: installedExtensions });
  } catch (error) {
    console.error('Error fetching installed extensions:', error);
    res.status(500).json({ error: 'Failed to fetch installed extensions' });
  }
});

// Install extension
router.post('/install/:extensionId', async (req, res) => {
  try {
    const { extensionId } = req.params;
    const extension = BUILTIN_EXTENSIONS.find(ext => ext.id === extensionId);
    
    if (!extension) {
      return res.status(404).json({ error: 'Extension not found' });
    }
    
    const installedExtensions = await getInstalledExtensions();
    const existingIndex = installedExtensions.findIndex(ext => ext.id === extensionId);
    
    if (existingIndex >= 0) {
      return res.status(400).json({ error: 'Extension already installed' });
    }
    
    const installedExtension = {
      ...extension,
      installedAt: new Date().toISOString(),
      enabled: true,
      settings: {}
    };
    
    installedExtensions.push(installedExtension);
    await saveInstalledExtensions(installedExtensions);
    
    res.json({ 
      message: 'Extension installed successfully',
      extension: installedExtension
    });
  } catch (error) {
    console.error('Error installing extension:', error);
    res.status(500).json({ error: 'Failed to install extension' });
  }
});

// Uninstall extension
router.delete('/uninstall/:extensionId', async (req, res) => {
  try {
    const { extensionId } = req.params;
    const installedExtensions = await getInstalledExtensions();
    const filteredExtensions = installedExtensions.filter(ext => ext.id !== extensionId);
    
    if (filteredExtensions.length === installedExtensions.length) {
      return res.status(404).json({ error: 'Extension not installed' });
    }
    
    await saveInstalledExtensions(filteredExtensions);
    
    res.json({ message: 'Extension uninstalled successfully' });
  } catch (error) {
    console.error('Error uninstalling extension:', error);
    res.status(500).json({ error: 'Failed to uninstall extension' });
  }
});

// Enable/disable extension
router.patch('/toggle/:extensionId', async (req, res) => {
  try {
    const { extensionId } = req.params;
    const { enabled } = req.body;
    
    const installedExtensions = await getInstalledExtensions();
    const extensionIndex = installedExtensions.findIndex(ext => ext.id === extensionId);
    
    if (extensionIndex === -1) {
      return res.status(404).json({ error: 'Extension not installed' });
    }
    
    installedExtensions[extensionIndex].enabled = enabled;
    await saveInstalledExtensions(installedExtensions);
    
    res.json({ 
      message: `Extension ${enabled ? 'enabled' : 'disabled'} successfully`,
      extension: installedExtensions[extensionIndex]
    });
  } catch (error) {
    console.error('Error toggling extension:', error);
    res.status(500).json({ error: 'Failed to toggle extension' });
  }
});

// Execute MCP command
router.post('/execute', async (req, res) => {
  try {
    const { extensionId, command, parameters = {} } = req.body;
    
    if (!extensionId || !command) {
      return res.status(400).json({ error: 'Extension ID and command are required' });
    }
    
    const installedExtensions = await getInstalledExtensions();
    const extension = installedExtensions.find(ext => ext.id === extensionId && ext.enabled);
    
    if (!extension) {
      return res.status(404).json({ error: 'Extension not found or not enabled' });
    }
    
    // Route to appropriate MCP handler
    const mcpService = require('../services/mcpService');
    const result = await mcpService.executeCommand(extensionId, command, parameters);
    
    res.json({ result });
  } catch (error) {
    console.error('Error executing MCP command:', error);
    res.status(500).json({ 
      error: 'Failed to execute MCP command',
      message: error.message
    });
  }
});

// Get extension capabilities
router.get('/capabilities/:extensionId', async (req, res) => {
  try {
    const { extensionId } = req.params;
    const extension = BUILTIN_EXTENSIONS.find(ext => ext.id === extensionId);
    
    if (!extension) {
      return res.status(404).json({ error: 'Extension not found' });
    }
    
    // Get detailed capabilities from MCP service
    const mcpService = require('../services/mcpService');
    const capabilities = await mcpService.getCapabilities(extensionId);
    
    res.json({ capabilities });
  } catch (error) {
    console.error('Error fetching capabilities:', error);
    res.status(500).json({ error: 'Failed to fetch capabilities' });
  }
});

// Update extension settings
router.patch('/settings/:extensionId', async (req, res) => {
  try {
    const { extensionId } = req.params;
    const { settings } = req.body;
    
    const installedExtensions = await getInstalledExtensions();
    const extensionIndex = installedExtensions.findIndex(ext => ext.id === extensionId);
    
    if (extensionIndex === -1) {
      return res.status(404).json({ error: 'Extension not installed' });
    }
    
    installedExtensions[extensionIndex].settings = {
      ...installedExtensions[extensionIndex].settings,
      ...settings
    };
    
    await saveInstalledExtensions(installedExtensions);
    
    res.json({ 
      message: 'Settings updated successfully',
      extension: installedExtensions[extensionIndex]
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

module.exports = router;