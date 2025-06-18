const { v4: uuidv4 } = require('uuid');

class WebSocketHandler {
  constructor(mcpManager) {
    this.mcpManager = mcpManager;
    this.connections = new Map();
    this.setupMCPEventListeners();
  }

  setupMCPEventListeners() {
    // Listen to MCP Manager events and broadcast to connected clients
    this.mcpManager.on('serverStarted', (data) => {
      this.broadcast('mcp:server:started', data);
    });

    this.mcpManager.on('serverStopped', (data) => {
      this.broadcast('mcp:server:stopped', data);
    });

    this.mcpManager.on('serverInstalled', (data) => {
      this.broadcast('mcp:server:installed', data);
    });

    this.mcpManager.on('serverUninstalled', (data) => {
      this.broadcast('mcp:server:uninstalled', data);
    });

    this.mcpManager.on('extensionInstalled', (data) => {
      this.broadcast('mcp:extension:installed', data);
    });

    this.mcpManager.on('extensionUninstalled', (data) => {
      this.broadcast('mcp:extension:uninstalled', data);
    });

    this.mcpManager.on('serverOutput', (data) => {
      this.broadcast('mcp:server:output', data);
    });
  }

  handleConnection(ws, req) {
    const connectionId = uuidv4();
    const connection = {
      id: connectionId,
      ws,
      connectedAt: new Date(),
      subscriptions: new Set()
    };

    this.connections.set(connectionId, connection);

    console.log(`WebSocket connection established: ${connectionId}`);

    // Send welcome message
    this.sendMessage(ws, 'connection:established', {
      connectionId,
      timestamp: new Date().toISOString(),
      mcpServers: this.mcpManager.getActiveServers().length
    });

    ws.on('message', async (message) => {
      try {
        await this.handleMessage(connection, message);
      } catch (error) {
        console.error('Error handling WebSocket message:', error);
        this.sendMessage(ws, 'error', {
          error: 'Failed to process message',
          details: error.message
        });
      }
    });

    ws.on('close', () => {
      this.connections.delete(connectionId);
      console.log(`WebSocket connection closed: ${connectionId}`);
    });

    ws.on('error', (error) => {
      console.error(`WebSocket error for connection ${connectionId}:`, error);
      this.connections.delete(connectionId);
    });
  }

  async handleMessage(connection, message) {
    const data = JSON.parse(message.toString());
    const { type, payload, id } = data;

    switch (type) {
      case 'ping':
        this.sendMessage(connection.ws, 'pong', { timestamp: new Date().toISOString() }, id);
        break;

      case 'subscribe':
        await this.handleSubscribe(connection, payload, id);
        break;

      case 'unsubscribe':
        await this.handleUnsubscribe(connection, payload, id);
        break;

      case 'chat:message':
        await this.handleChatMessage(connection, payload, id);
        break;

      case 'mcp:execute_tool':
        await this.handleExecuteTool(connection, payload, id);
        break;

      case 'mcp:get_servers':
        await this.handleGetServers(connection, payload, id);
        break;

      case 'mcp:start_server':
        await this.handleStartServer(connection, payload, id);
        break;

      case 'mcp:stop_server':
        await this.handleStopServer(connection, payload, id);
        break;

      case 'file:watch':
        await this.handleFileWatch(connection, payload, id);
        break;

      case 'file:unwatch':
        await this.handleFileUnwatch(connection, payload, id);
        break;

      default:
        this.sendMessage(connection.ws, 'error', {
          error: 'Unknown message type',
          type
        }, id);
    }
  }

  async handleSubscribe(connection, payload, id) {
    const { channel } = payload;
    connection.subscriptions.add(channel);
    
    this.sendMessage(connection.ws, 'subscribed', {
      channel,
      success: true
    }, id);
  }

  async handleUnsubscribe(connection, payload, id) {
    const { channel } = payload;
    connection.subscriptions.delete(channel);
    
    this.sendMessage(connection.ws, 'unsubscribed', {
      channel,
      success: true
    }, id);
  }

  async handleChatMessage(connection, payload, id) {
    const { message, context, model } = payload;
    
    try {
      // This would integrate with the Gemini API
      // For now, we'll send a processing message
      this.sendMessage(connection.ws, 'chat:processing', {
        messageId: id,
        status: 'processing'
      }, id);

      // Simulate processing time
      setTimeout(() => {
        this.sendMessage(connection.ws, 'chat:response', {
          messageId: id,
          response: `Echo: ${message}`,
          timestamp: new Date().toISOString()
        }, id);
      }, 1000);

    } catch (error) {
      this.sendMessage(connection.ws, 'chat:error', {
        messageId: id,
        error: error.message
      }, id);
    }
  }

  async handleExecuteTool(connection, payload, id) {
    const { serverId, toolName, arguments: toolArgs } = payload;
    
    try {
      const result = await this.mcpManager.executeTool(serverId, toolName, toolArgs);
      
      this.sendMessage(connection.ws, 'mcp:tool_result', {
        serverId,
        toolName,
        result,
        success: true
      }, id);
    } catch (error) {
      this.sendMessage(connection.ws, 'mcp:tool_error', {
        serverId,
        toolName,
        error: error.message,
        success: false
      }, id);
    }
  }

  async handleGetServers(connection, payload, id) {
    try {
      const activeServers = this.mcpManager.getActiveServers();
      const availableServers = await this.mcpManager.getAvailableServers();
      
      this.sendMessage(connection.ws, 'mcp:servers', {
        active: activeServers,
        available: availableServers
      }, id);
    } catch (error) {
      this.sendMessage(connection.ws, 'mcp:servers_error', {
        error: error.message
      }, id);
    }
  }

  async handleStartServer(connection, payload, id) {
    const { serverId } = payload;
    
    try {
      const server = await this.mcpManager.startServer(serverId);
      
      this.sendMessage(connection.ws, 'mcp:server_started', {
        serverId,
        server,
        success: true
      }, id);
    } catch (error) {
      this.sendMessage(connection.ws, 'mcp:server_start_error', {
        serverId,
        error: error.message,
        success: false
      }, id);
    }
  }

  async handleStopServer(connection, payload, id) {
    const { serverId } = payload;
    
    try {
      await this.mcpManager.stopServer(serverId);
      
      this.sendMessage(connection.ws, 'mcp:server_stopped', {
        serverId,
        success: true
      }, id);
    } catch (error) {
      this.sendMessage(connection.ws, 'mcp:server_stop_error', {
        serverId,
        error: error.message,
        success: false
      }, id);
    }
  }

  async handleFileWatch(connection, payload, id) {
    const { path: filePath } = payload;
    
    try {
      // This would integrate with the file watching system
      // For now, we'll just acknowledge the request
      this.sendMessage(connection.ws, 'file:watch_started', {
        path: filePath,
        watchId: uuidv4(),
        success: true
      }, id);
    } catch (error) {
      this.sendMessage(connection.ws, 'file:watch_error', {
        path: filePath,
        error: error.message,
        success: false
      }, id);
    }
  }

  async handleFileUnwatch(connection, payload, id) {
    const { watchId } = payload;
    
    try {
      // This would integrate with the file watching system
      this.sendMessage(connection.ws, 'file:watch_stopped', {
        watchId,
        success: true
      }, id);
    } catch (error) {
      this.sendMessage(connection.ws, 'file:unwatch_error', {
        watchId,
        error: error.message,
        success: false
      }, id);
    }
  }

  sendMessage(ws, type, payload, id = null) {
    if (ws.readyState === ws.OPEN) {
      const message = {
        type,
        payload,
        timestamp: new Date().toISOString()
      };
      
      if (id) {
        message.id = id;
      }
      
      ws.send(JSON.stringify(message));
    }
  }

  broadcast(type, payload, channel = null) {
    const message = {
      type,
      payload,
      timestamp: new Date().toISOString()
    };

    for (const connection of this.connections.values()) {
      // If channel is specified, only send to subscribed connections
      if (channel && !connection.subscriptions.has(channel)) {
        continue;
      }

      if (connection.ws.readyState === connection.ws.OPEN) {
        connection.ws.send(JSON.stringify(message));
      }
    }
  }

  getConnectionCount() {
    return this.connections.size;
  }

  getConnections() {
    return Array.from(this.connections.values()).map(conn => ({
      id: conn.id,
      connectedAt: conn.connectedAt,
      subscriptions: Array.from(conn.subscriptions)
    }));
  }
}

module.exports = WebSocketHandler;