const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB default
  },
  fileFilter: (req, file, cb) => {
    // Allow common file types
    const allowedTypes = [
      'text/plain',
      'application/json',
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/javascript',
      'text/html',
      'text/css',
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/gif'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('File type not allowed'), false);
    }
  }
});

// Ensure upload directory exists
async function ensureUploadDir() {
  const uploadDir = path.join(__dirname, '../uploads');
  try {
    await fs.mkdir(uploadDir, { recursive: true });
  } catch (error) {
    console.error('Error creating upload directory:', error);
  }
}

ensureUploadDir();

// Helper function to check if path is allowed
function isPathAllowed(filePath) {
  const allowedDirs = (process.env.ALLOWED_DIRECTORIES || '/tmp,/workspace').split(',');
  const normalizedPath = path.resolve(filePath);
  
  return allowedDirs.some(dir => {
    const normalizedDir = path.resolve(dir.trim());
    return normalizedPath.startsWith(normalizedDir);
  });
}

// List directory contents
router.get('/list', async (req, res) => {
  try {
    const { path: dirPath = '/workspace' } = req.query;
    
    if (!isPathAllowed(dirPath)) {
      return res.status(403).json({ error: 'Access to this directory is not allowed' });
    }
    
    const stats = await fs.stat(dirPath);
    if (!stats.isDirectory()) {
      return res.status(400).json({ error: 'Path is not a directory' });
    }
    
    const items = await fs.readdir(dirPath, { withFileTypes: true });
    const fileList = await Promise.all(
      items.map(async (item) => {
        const itemPath = path.join(dirPath, item.name);
        const itemStats = await fs.stat(itemPath);
        
        return {
          name: item.name,
          path: itemPath,
          type: item.isDirectory() ? 'directory' : 'file',
          size: itemStats.size,
          modified: itemStats.mtime,
          permissions: {
            readable: true,
            writable: true,
            executable: item.isDirectory()
          }
        };
      })
    );
    
    res.json({
      path: dirPath,
      items: fileList.sort((a, b) => {
        // Directories first, then files
        if (a.type !== b.type) {
          return a.type === 'directory' ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
      })
    });
  } catch (error) {
    console.error('Error listing directory:', error);
    res.status(500).json({ 
      error: 'Failed to list directory',
      message: error.message
    });
  }
});

// Read file content
router.get('/read', async (req, res) => {
  try {
    const { path: filePath } = req.query;
    
    if (!filePath) {
      return res.status(400).json({ error: 'File path is required' });
    }
    
    if (!isPathAllowed(filePath)) {
      return res.status(403).json({ error: 'Access to this file is not allowed' });
    }
    
    const stats = await fs.stat(filePath);
    if (stats.isDirectory()) {
      return res.status(400).json({ error: 'Path is a directory, not a file' });
    }
    
    // Check file size
    if (stats.size > 5 * 1024 * 1024) { // 5MB limit for reading
      return res.status(400).json({ error: 'File too large to read' });
    }
    
    const content = await fs.readFile(filePath, 'utf8');
    const fileInfo = {
      path: filePath,
      name: path.basename(filePath),
      size: stats.size,
      modified: stats.mtime,
      extension: path.extname(filePath)
    };
    
    res.json({
      file: fileInfo,
      content
    });
  } catch (error) {
    console.error('Error reading file:', error);
    if (error.code === 'ENOENT') {
      res.status(404).json({ error: 'File not found' });
    } else if (error.code === 'EACCES') {
      res.status(403).json({ error: 'Permission denied' });
    } else {
      res.status(500).json({ 
        error: 'Failed to read file',
        message: error.message
      });
    }
  }
});

// Write file content
router.post('/write', async (req, res) => {
  try {
    const { path: filePath, content, createDirectories = false } = req.body;
    
    if (!filePath || content === undefined) {
      return res.status(400).json({ error: 'File path and content are required' });
    }
    
    if (!isPathAllowed(filePath)) {
      return res.status(403).json({ error: 'Access to this location is not allowed' });
    }
    
    // Create directories if requested
    if (createDirectories) {
      const dirPath = path.dirname(filePath);
      await fs.mkdir(dirPath, { recursive: true });
    }
    
    await fs.writeFile(filePath, content, 'utf8');
    const stats = await fs.stat(filePath);
    
    res.json({
      message: 'File written successfully',
      file: {
        path: filePath,
        name: path.basename(filePath),
        size: stats.size,
        modified: stats.mtime
      }
    });
  } catch (error) {
    console.error('Error writing file:', error);
    res.status(500).json({ 
      error: 'Failed to write file',
      message: error.message
    });
  }
});

// Create directory
router.post('/mkdir', async (req, res) => {
  try {
    const { path: dirPath, recursive = false } = req.body;
    
    if (!dirPath) {
      return res.status(400).json({ error: 'Directory path is required' });
    }
    
    if (!isPathAllowed(dirPath)) {
      return res.status(403).json({ error: 'Access to this location is not allowed' });
    }
    
    await fs.mkdir(dirPath, { recursive });
    
    res.json({
      message: 'Directory created successfully',
      path: dirPath
    });
  } catch (error) {
    console.error('Error creating directory:', error);
    if (error.code === 'EEXIST') {
      res.status(400).json({ error: 'Directory already exists' });
    } else {
      res.status(500).json({ 
        error: 'Failed to create directory',
        message: error.message
      });
    }
  }
});

// Delete file or directory
router.delete('/delete', async (req, res) => {
  try {
    const { path: targetPath, recursive = false } = req.body;
    
    if (!targetPath) {
      return res.status(400).json({ error: 'Path is required' });
    }
    
    if (!isPathAllowed(targetPath)) {
      return res.status(403).json({ error: 'Access to this location is not allowed' });
    }
    
    const stats = await fs.stat(targetPath);
    
    if (stats.isDirectory()) {
      await fs.rmdir(targetPath, { recursive });
    } else {
      await fs.unlink(targetPath);
    }
    
    res.json({
      message: `${stats.isDirectory() ? 'Directory' : 'File'} deleted successfully`,
      path: targetPath
    });
  } catch (error) {
    console.error('Error deleting:', error);
    if (error.code === 'ENOENT') {
      res.status(404).json({ error: 'File or directory not found' });
    } else if (error.code === 'ENOTEMPTY') {
      res.status(400).json({ error: 'Directory not empty (use recursive option)' });
    } else {
      res.status(500).json({ 
        error: 'Failed to delete',
        message: error.message
      });
    }
  }
});

// Move/rename file or directory
router.post('/move', async (req, res) => {
  try {
    const { from, to } = req.body;
    
    if (!from || !to) {
      return res.status(400).json({ error: 'Source and destination paths are required' });
    }
    
    if (!isPathAllowed(from) || !isPathAllowed(to)) {
      return res.status(403).json({ error: 'Access to one or both locations is not allowed' });
    }
    
    await fs.rename(from, to);
    
    res.json({
      message: 'File/directory moved successfully',
      from,
      to
    });
  } catch (error) {
    console.error('Error moving file/directory:', error);
    if (error.code === 'ENOENT') {
      res.status(404).json({ error: 'Source file or directory not found' });
    } else if (error.code === 'EEXIST') {
      res.status(400).json({ error: 'Destination already exists' });
    } else {
      res.status(500).json({ 
        error: 'Failed to move file/directory',
        message: error.message
      });
    }
  }
});

// Copy file
router.post('/copy', async (req, res) => {
  try {
    const { from, to } = req.body;
    
    if (!from || !to) {
      return res.status(400).json({ error: 'Source and destination paths are required' });
    }
    
    if (!isPathAllowed(from) || !isPathAllowed(to)) {
      return res.status(403).json({ error: 'Access to one or both locations is not allowed' });
    }
    
    await fs.copyFile(from, to);
    const stats = await fs.stat(to);
    
    res.json({
      message: 'File copied successfully',
      from,
      to,
      size: stats.size
    });
  } catch (error) {
    console.error('Error copying file:', error);
    if (error.code === 'ENOENT') {
      res.status(404).json({ error: 'Source file not found' });
    } else {
      res.status(500).json({ 
        error: 'Failed to copy file',
        message: error.message
      });
    }
  }
});

// Upload file
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const { destination } = req.body;
    let finalPath = req.file.path;
    
    // Move to destination if specified
    if (destination && isPathAllowed(destination)) {
      const destPath = path.join(destination, req.file.originalname);
      await fs.rename(req.file.path, destPath);
      finalPath = destPath;
    }
    
    const stats = await fs.stat(finalPath);
    
    res.json({
      message: 'File uploaded successfully',
      file: {
        originalName: req.file.originalname,
        path: finalPath,
        size: stats.size,
        mimetype: req.file.mimetype
      }
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ 
      error: 'Failed to upload file',
      message: error.message
    });
  }
});

// Search files
router.get('/search', async (req, res) => {
  try {
    const { query, path: searchPath = '/workspace', type = 'all' } = req.query;
    
    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }
    
    if (!isPathAllowed(searchPath)) {
      return res.status(403).json({ error: 'Access to this directory is not allowed' });
    }
    
    const results = [];
    
    async function searchRecursive(dirPath, depth = 0) {
      if (depth > 10) return; // Prevent infinite recursion
      
      try {
        const items = await fs.readdir(dirPath, { withFileTypes: true });
        
        for (const item of items) {
          const itemPath = path.join(dirPath, item.name);
          
          // Check if name matches query
          if (item.name.toLowerCase().includes(query.toLowerCase())) {
            const stats = await fs.stat(itemPath);
            const itemType = item.isDirectory() ? 'directory' : 'file';
            
            if (type === 'all' || type === itemType) {
              results.push({
                name: item.name,
                path: itemPath,
                type: itemType,
                size: stats.size,
                modified: stats.mtime
              });
            }
          }
          
          // Recurse into directories
          if (item.isDirectory() && depth < 5) {
            await searchRecursive(itemPath, depth + 1);
          }
        }
      } catch (error) {
        // Skip directories we can't access
      }
    }
    
    await searchRecursive(searchPath);
    
    res.json({
      query,
      searchPath,
      results: results.slice(0, 100) // Limit results
    });
  } catch (error) {
    console.error('Error searching files:', error);
    res.status(500).json({ 
      error: 'Failed to search files',
      message: error.message
    });
  }
});

module.exports = router;