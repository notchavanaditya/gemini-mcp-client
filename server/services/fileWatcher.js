const chokidar = require('chokidar');
const path = require('path');

class FileWatcher {
  constructor() {
    this.watchers = new Map();
    this.callbacks = new Map();
  }

  watchFile(filePath, callback) {
    const normalizedPath = path.resolve(filePath);
    
    if (this.watchers.has(normalizedPath)) {
      // Add callback to existing watcher
      const existingCallbacks = this.callbacks.get(normalizedPath) || [];
      existingCallbacks.push(callback);
      this.callbacks.set(normalizedPath, existingCallbacks);
      return;
    }

    // Create new watcher
    const watcher = chokidar.watch(normalizedPath, {
      persistent: true,
      ignoreInitial: true,
      awaitWriteFinish: {
        stabilityThreshold: 100,
        pollInterval: 50
      }
    });

    // Set up event handlers
    watcher
      .on('change', (path) => {
        this.notifyCallbacks(normalizedPath, {
          type: 'change',
          path,
          timestamp: new Date().toISOString()
        });
      })
      .on('add', (path) => {
        this.notifyCallbacks(normalizedPath, {
          type: 'add',
          path,
          timestamp: new Date().toISOString()
        });
      })
      .on('unlink', (path) => {
        this.notifyCallbacks(normalizedPath, {
          type: 'unlink',
          path,
          timestamp: new Date().toISOString()
        });
      })
      .on('addDir', (path) => {
        this.notifyCallbacks(normalizedPath, {
          type: 'addDir',
          path,
          timestamp: new Date().toISOString()
        });
      })
      .on('unlinkDir', (path) => {
        this.notifyCallbacks(normalizedPath, {
          type: 'unlinkDir',
          path,
          timestamp: new Date().toISOString()
        });
      })
      .on('error', (error) => {
        this.notifyCallbacks(normalizedPath, {
          type: 'error',
          error: error.message,
          timestamp: new Date().toISOString()
        });
      });

    this.watchers.set(normalizedPath, watcher);
    this.callbacks.set(normalizedPath, [callback]);
  }

  watchDirectory(dirPath, callback, options = {}) {
    const normalizedPath = path.resolve(dirPath);
    const watchOptions = {
      persistent: true,
      ignoreInitial: true,
      recursive: options.recursive !== false,
      ignored: options.ignored || /(^|[\/\\])\../,
      awaitWriteFinish: {
        stabilityThreshold: 100,
        pollInterval: 50
      },
      ...options
    };

    if (this.watchers.has(normalizedPath)) {
      const existingCallbacks = this.callbacks.get(normalizedPath) || [];
      existingCallbacks.push(callback);
      this.callbacks.set(normalizedPath, existingCallbacks);
      return;
    }

    const watcher = chokidar.watch(normalizedPath, watchOptions);

    watcher
      .on('all', (event, path) => {
        this.notifyCallbacks(normalizedPath, {
          type: event,
          path,
          timestamp: new Date().toISOString()
        });
      })
      .on('error', (error) => {
        this.notifyCallbacks(normalizedPath, {
          type: 'error',
          error: error.message,
          timestamp: new Date().toISOString()
        });
      });

    this.watchers.set(normalizedPath, watcher);
    this.callbacks.set(normalizedPath, [callback]);
  }

  stopWatching(filePath) {
    const normalizedPath = path.resolve(filePath);
    const watcher = this.watchers.get(normalizedPath);
    
    if (watcher) {
      watcher.close();
      this.watchers.delete(normalizedPath);
      this.callbacks.delete(normalizedPath);
    }
  }

  stopAllWatching() {
    for (const [path, watcher] of this.watchers) {
      watcher.close();
    }
    this.watchers.clear();
    this.callbacks.clear();
  }

  notifyCallbacks(path, event) {
    const callbacks = this.callbacks.get(path) || [];
    callbacks.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error('Error in file watcher callback:', error);
      }
    });
  }

  getWatchedPaths() {
    return Array.from(this.watchers.keys());
  }

  isWatching(filePath) {
    const normalizedPath = path.resolve(filePath);
    return this.watchers.has(normalizedPath);
  }
}

module.exports = new FileWatcher();