const { spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');
const EventEmitter = require('events');

class MCPManager extends EventEmitter {
  constructor() {
    super();
    this.servers = new Map();
    this.installedExtensions = new Map();
    this.configPath = path.join(process.cwd(), 'mcp-config.json');
    this.extensionsPath = path.join(process.cwd(), 'extensions');
    this.registryUrl = process.env.MCP_REGISTRY_URL || 'https://registry.mcp.dev';
  }

  async initialize() {
    try {
      // Ensure extensions directory exists
      await fs.mkdir(this.extensionsPath, { recursive: true });
      
      // Load configuration
      await this.loadConfig();
      
      // Initialize built-in Excel MCP if enabled
      if (process.env.ENABLE_EXCEL_MCP === 'true') {
        await this.initializeExcelMCP();
      }
      
      // Start auto-installed servers
      await this.startAutoStartServers();
      
      console.log('MCP Manager initialized successfully');
    } catch (error) {
      console.error('Failed to initialize MCP Manager:', error);
      throw error;
    }
  }

  async loadConfig() {
    try {
      const configData = await fs.readFile(this.configPath, 'utf8');
      const config = JSON.parse(configData);
      
      // Load installed extensions
      if (config.extensions) {
        for (const [id, extensionConfig] of Object.entries(config.extensions)) {
          this.installedExtensions.set(id, extensionConfig);
        }
      }
      
      // Load server configurations
      if (config.servers) {
        for (const [id, serverConfig] of Object.entries(config.servers)) {
          this.servers.set(id, { ...serverConfig, status: 'stopped' });
        }
      }
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.error('Error loading MCP config:', error);
      }
      // Create default config
      await this.saveConfig();
    }
  }

  async saveConfig() {
    const config = {
      extensions: Object.fromEntries(this.installedExtensions),
      servers: Object.fromEntries(
        Array.from(this.servers.entries()).map(([id, server]) => [
          id,
          { ...server, status: undefined } // Don't save runtime status
        ])
      )
    };
    
    await fs.writeFile(this.configPath, JSON.stringify(config, null, 2));
  }

  async initializeExcelMCP() {
    const excelMCPConfig = {
      id: 'excel-mcp',
      name: 'Excel MCP Server',
      description: 'Built-in Excel file manipulation server',
      type: 'builtin',
      enabled: true,
      autoStart: true,
      tools: [
        'read_excel',
        'write_excel',
        'create_workbook',
        'add_worksheet',
        'delete_worksheet',
        'format_cells',
        'create_chart',
        'apply_formula'
      ]
    };
    
    this.servers.set('excel-mcp', excelMCPConfig);
    await this.saveConfig();
  }

  async startAutoStartServers() {
    for (const [id, server] of this.servers) {
      if (server.autoStart && server.enabled) {
        try {
          await this.startServer(id);
        } catch (error) {
          console.error(`Failed to auto-start server ${id}:`, error);
        }
      }
    }
  }

  async getAvailableServers() {
    try {
      const response = await axios.get(`${this.registryUrl}/servers`);
      return response.data.servers || [];
    } catch (error) {
      console.error('Error fetching available servers:', error);
      return [];
    }
  }

  getActiveServers() {
    return Array.from(this.servers.entries())
      .filter(([_, server]) => server.status === 'running')
      .map(([id, server]) => ({ id, ...server }));
  }

  async installServer(serverId, config = {}) {
    try {
      // Fetch server details from registry
      const serverDetails = await this.getServerDetails(serverId);
      if (!serverDetails) {
        throw new Error('Server not found in registry');
      }

      const serverConfig = {
        ...serverDetails,
        ...config,
        id: serverId,
        status: 'stopped',
        installed: true,
        installedAt: new Date().toISOString()
      };

      this.servers.set(serverId, serverConfig);
      await this.saveConfig();

      this.emit('serverInstalled', { serverId, config: serverConfig });
      return serverConfig;
    } catch (error) {
      console.error(`Error installing server ${serverId}:`, error);
      throw error;
    }
  }

  async startServer(serverId) {
    const server = this.servers.get(serverId);
    if (!server) {
      throw new Error('Server not found');
    }

    if (server.status === 'running') {
      return server;
    }

    try {
      if (server.type === 'builtin') {
        // Handle built-in servers
        await this.startBuiltinServer(serverId, server);
      } else {
        // Handle external MCP servers
        await this.startExternalServer(serverId, server);
      }

      server.status = 'running';
      server.startedAt = new Date().toISOString();
      
      this.emit('serverStarted', { serverId, server });
      return server;
    } catch (error) {
      server.status = 'error';
      server.error = error.message;
      console.error(`Error starting server ${serverId}:`, error);
      throw error;
    }
  }

  async startBuiltinServer(serverId, server) {
    // Built-in servers are handled internally
    if (serverId === 'excel-mcp') {
      // Excel MCP is handled by the ExcelMCP service
      const ExcelMCP = require('./ExcelMCP');
      server.instance = new ExcelMCP();
      await server.instance.initialize();
    }
  }

  async startExternalServer(serverId, server) {
    // Start external MCP server process
    const args = server.args || [];
    const env = { ...process.env, ...server.env };
    
    const child = spawn(server.command, args, {
      env,
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: server.workingDirectory || process.cwd()
    });

    server.process = child;
    server.pid = child.pid;

    // Handle server communication
    child.stdout.on('data', (data) => {
      this.emit('serverOutput', { serverId, type: 'stdout', data: data.toString() });
    });

    child.stderr.on('data', (data) => {
      this.emit('serverOutput', { serverId, type: 'stderr', data: data.toString() });
    });

    child.on('exit', (code) => {
      server.status = 'stopped';
      server.exitCode = code;
      this.emit('serverStopped', { serverId, exitCode: code });
    });

    // Wait for server to be ready
    await this.waitForServerReady(serverId, server);
  }

  async waitForServerReady(serverId, server, timeout = 10000) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      
      const checkReady = () => {
        if (Date.now() - startTime > timeout) {
          reject(new Error('Server startup timeout'));
          return;
        }

        // Check if server is responding
        // This would typically involve sending a ping/health check
        setTimeout(checkReady, 100);
      };

      // For now, just wait a short time
      setTimeout(resolve, 1000);
    });
  }

  async stopServer(serverId) {
    const server = this.servers.get(serverId);
    if (!server) {
      throw new Error('Server not found');
    }

    if (server.status !== 'running') {
      return;
    }

    try {
      if (server.type === 'builtin') {
        if (server.instance && server.instance.shutdown) {
          await server.instance.shutdown();
        }
      } else if (server.process) {
        server.process.kill('SIGTERM');
        
        // Wait for graceful shutdown, then force kill if needed
        setTimeout(() => {
          if (server.process && !server.process.killed) {
            server.process.kill('SIGKILL');
          }
        }, 5000);
      }

      server.status = 'stopped';
      server.stoppedAt = new Date().toISOString();
      
      this.emit('serverStopped', { serverId });
    } catch (error) {
      console.error(`Error stopping server ${serverId}:`, error);
      throw error;
    }
  }

  async uninstallServer(serverId) {
    // Stop server if running
    if (this.servers.has(serverId)) {
      await this.stopServer(serverId);
    }

    // Remove from configuration
    this.servers.delete(serverId);
    await this.saveConfig();

    this.emit('serverUninstalled', { serverId });
  }

  async getServerTools(serverId) {
    const server = this.servers.get(serverId);
    if (!server) {
      throw new Error('Server not found');
    }

    if (server.type === 'builtin' && server.instance) {
      return server.instance.getTools ? await server.instance.getTools() : server.tools || [];
    }

    // For external servers, this would involve MCP protocol communication
    return server.tools || [];
  }

  async executeTool(serverId, toolName, args) {
    const server = this.servers.get(serverId);
    if (!server) {
      throw new Error('Server not found');
    }

    if (server.status !== 'running') {
      throw new Error('Server is not running');
    }

    if (server.type === 'builtin' && server.instance) {
      return await server.instance.executeTool(toolName, args);
    }

    // For external servers, this would involve MCP protocol communication
    throw new Error('External server tool execution not implemented');
  }

  async getServerResources(serverId) {
    const server = this.servers.get(serverId);
    if (!server) {
      throw new Error('Server not found');
    }

    if (server.type === 'builtin' && server.instance) {
      return server.instance.getResources ? await server.instance.getResources() : [];
    }

    return [];
  }

  async readResource(serverId, resourceId) {
    const server = this.servers.get(serverId);
    if (!server) {
      throw new Error('Server not found');
    }

    if (server.type === 'builtin' && server.instance) {
      return await server.instance.readResource(resourceId);
    }

    throw new Error('External server resource reading not implemented');
  }

  async getServerPrompts(serverId) {
    const server = this.servers.get(serverId);
    if (!server) {
      throw new Error('Server not found');
    }

    if (server.type === 'builtin' && server.instance) {
      return server.instance.getPrompts ? await server.instance.getPrompts() : [];
    }

    return [];
  }

  async executePrompt(serverId, promptName, args) {
    const server = this.servers.get(serverId);
    if (!server) {
      throw new Error('Server not found');
    }

    if (server.type === 'builtin' && server.instance) {
      return await server.instance.executePrompt(promptName, args);
    }

    throw new Error('External server prompt execution not implemented');
  }

  async getRegistry(category, search) {
    try {
      const params = new URLSearchParams();
      if (category) params.append('category', category);
      if (search) params.append('search', search);

      const response = await axios.get(`${this.registryUrl}/registry?${params}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching registry:', error);
      return { servers: [], extensions: [] };
    }
  }

  async getServerConfig(serverId) {
    const server = this.servers.get(serverId);
    if (!server) {
      throw new Error('Server not found');
    }

    return {
      id: serverId,
      enabled: server.enabled,
      autoStart: server.autoStart,
      config: server.config || {}
    };
  }

  async updateServerConfig(serverId, config) {
    const server = this.servers.get(serverId);
    if (!server) {
      throw new Error('Server not found');
    }

    Object.assign(server, config);
    await this.saveConfig();

    this.emit('serverConfigUpdated', { serverId, config });
    return server;
  }

  // Extension management methods
  async getExtensions(filters = {}) {
    try {
      const params = new URLSearchParams();
      if (filters.category) params.append('category', filters.category);
      if (filters.search) params.append('search', filters.search);
      if (filters.featured) params.append('featured', 'true');

      const response = await axios.get(`${this.registryUrl}/extensions?${params}`);
      return response.data.extensions || [];
    } catch (error) {
      console.error('Error fetching extensions:', error);
      return [];
    }
  }

  async getExtensionDetails(extensionId) {
    try {
      const response = await axios.get(`${this.registryUrl}/extensions/${extensionId}`);
      return response.data.extension;
    } catch (error) {
      console.error('Error fetching extension details:', error);
      return null;
    }
  }

  async getInstalledExtensions() {
    return Array.from(this.installedExtensions.entries()).map(([id, config]) => ({
      id,
      ...config
    }));
  }

  async installExtension(extensionId, options = {}) {
    try {
      const extensionDetails = await this.getExtensionDetails(extensionId);
      if (!extensionDetails) {
        throw new Error('Extension not found');
      }

      const extensionConfig = {
        ...extensionDetails,
        ...options.config,
        version: options.version || extensionDetails.latestVersion,
        installed: true,
        installedAt: new Date().toISOString(),
        enabled: true
      };

      this.installedExtensions.set(extensionId, extensionConfig);
      await this.saveConfig();

      // If extension includes MCP servers, install them too
      if (extensionDetails.mcpServers) {
        for (const serverConfig of extensionDetails.mcpServers) {
          await this.installServer(serverConfig.id, serverConfig);
        }
      }

      this.emit('extensionInstalled', { extensionId, config: extensionConfig });
      return extensionConfig;
    } catch (error) {
      console.error(`Error installing extension ${extensionId}:`, error);
      throw error;
    }
  }

  async uninstallExtension(extensionId) {
    const extension = this.installedExtensions.get(extensionId);
    if (!extension) {
      throw new Error('Extension not found');
    }

    // Uninstall associated MCP servers
    if (extension.mcpServers) {
      for (const serverConfig of extension.mcpServers) {
        try {
          await this.uninstallServer(serverConfig.id);
        } catch (error) {
          console.error(`Error uninstalling server ${serverConfig.id}:`, error);
        }
      }
    }

    this.installedExtensions.delete(extensionId);
    await this.saveConfig();

    this.emit('extensionUninstalled', { extensionId });
  }

  async toggleExtension(extensionId, enabled) {
    const extension = this.installedExtensions.get(extensionId);
    if (!extension) {
      throw new Error('Extension not found');
    }

    extension.enabled = enabled;
    await this.saveConfig();

    this.emit('extensionToggled', { extensionId, enabled });
    return extension;
  }

  async updateExtension(extensionId, version) {
    // Implementation for updating extensions
    throw new Error('Extension updates not implemented yet');
  }

  async getExtensionConfig(extensionId) {
    const extension = this.installedExtensions.get(extensionId);
    if (!extension) {
      throw new Error('Extension not found');
    }

    return extension.config || {};
  }

  async updateExtensionConfig(extensionId, config) {
    const extension = this.installedExtensions.get(extensionId);
    if (!extension) {
      throw new Error('Extension not found');
    }

    extension.config = { ...extension.config, ...config };
    await this.saveConfig();

    this.emit('extensionConfigUpdated', { extensionId, config });
    return extension.config;
  }

  async getExtensionCategories() {
    try {
      const response = await axios.get(`${this.registryUrl}/categories`);
      return response.data.categories || [];
    } catch (error) {
      console.error('Error fetching extension categories:', error);
      return [];
    }
  }

  async getFeaturedExtensions() {
    return this.getExtensions({ featured: true });
  }

  async searchExtensions(query, options = {}) {
    return this.getExtensions({ search: query, ...options });
  }

  async getExtensionReviews(extensionId, options = {}) {
    try {
      const params = new URLSearchParams();
      if (options.limit) params.append('limit', options.limit);
      if (options.offset) params.append('offset', options.offset);

      const response = await axios.get(`${this.registryUrl}/extensions/${extensionId}/reviews?${params}`);
      return response.data.reviews || [];
    } catch (error) {
      console.error('Error fetching extension reviews:', error);
      return [];
    }
  }

  async getExtensionChangelog(extensionId) {
    try {
      const response = await axios.get(`${this.registryUrl}/extensions/${extensionId}/changelog`);
      return response.data.changelog || [];
    } catch (error) {
      console.error('Error fetching extension changelog:', error);
      return [];
    }
  }

  async checkForExtensionUpdates() {
    const updates = [];
    
    for (const [extensionId, extension] of this.installedExtensions) {
      try {
        const latest = await this.getExtensionDetails(extensionId);
        if (latest && latest.latestVersion !== extension.version) {
          updates.push({
            extensionId,
            currentVersion: extension.version,
            latestVersion: latest.latestVersion,
            changelog: latest.changelog
          });
        }
      } catch (error) {
        console.error(`Error checking updates for ${extensionId}:`, error);
      }
    }

    return updates;
  }

  async getServerDetails(serverId) {
    try {
      const response = await axios.get(`${this.registryUrl}/servers/${serverId}`);
      return response.data.server;
    } catch (error) {
      console.error('Error fetching server details:', error);
      return null;
    }
  }

  async shutdown() {
    console.log('Shutting down MCP Manager...');
    
    // Stop all running servers
    for (const [serverId, server] of this.servers) {
      if (server.status === 'running') {
        try {
          await this.stopServer(serverId);
        } catch (error) {
          console.error(`Error stopping server ${serverId} during shutdown:`, error);
        }
      }
    }

    // Save final configuration
    await this.saveConfig();
    
    console.log('MCP Manager shutdown complete');
  }
}

module.exports = MCPManager;