const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const router = express.Router();

// Extension categories
const EXTENSION_CATEGORIES = [
  { id: 'productivity', name: 'Productivity', icon: '⚡' },
  { id: 'development', name: 'Development', icon: '💻' },
  { id: 'analytics', name: 'Analytics', icon: '📊' },
  { id: 'system', name: 'System', icon: '⚙️' },
  { id: 'communication', name: 'Communication', icon: '💬' },
  { id: 'media', name: 'Media', icon: '🎨' },
  { id: 'security', name: 'Security', icon: '🔒' },
  { id: 'utilities', name: 'Utilities', icon: '🛠️' }
];

// Get extension categories
router.get('/categories', (req, res) => {
  res.json({ categories: EXTENSION_CATEGORIES });
});

// Get extension marketplace stats
router.get('/stats', async (req, res) => {
  try {
    const stats = {
      totalExtensions: 47,
      featuredExtensions: 8,
      totalDownloads: 12543,
      activeUsers: 1247,
      categories: EXTENSION_CATEGORIES.map(cat => ({
        ...cat,
        count: Math.floor(Math.random() * 15) + 1
      }))
    };
    
    res.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Get trending extensions
router.get('/trending', (req, res) => {
  const trendingExtensions = [
    {
      id: 'excel-mcp',
      name: 'Excel MCP',
      description: 'Advanced Excel file manipulation and analysis capabilities',
      downloads: 2341,
      rating: 4.8,
      trend: '+15%'
    },
    {
      id: 'file-manager-mcp',
      name: 'File Manager MCP',
      description: 'Comprehensive file system operations and management',
      downloads: 1876,
      rating: 4.6,
      trend: '+12%'
    },
    {
      id: 'code-analysis-mcp',
      name: 'Code Analysis MCP',
      description: 'Code analysis, refactoring, and documentation generation',
      downloads: 1543,
      rating: 4.7,
      trend: '+8%'
    }
  ];
  
  res.json({ extensions: trendingExtensions });
});

// Get extension reviews
router.get('/:extensionId/reviews', (req, res) => {
  const { extensionId } = req.params;
  
  const reviews = [
    {
      id: '1',
      user: 'Developer123',
      rating: 5,
      comment: 'Excellent extension! Makes Excel manipulation so much easier.',
      date: '2024-01-15T10:30:00Z',
      helpful: 12
    },
    {
      id: '2',
      user: 'DataAnalyst',
      rating: 4,
      comment: 'Great functionality, but could use better documentation.',
      date: '2024-01-10T14:20:00Z',
      helpful: 8
    },
    {
      id: '3',
      user: 'PowerUser',
      rating: 5,
      comment: 'This extension saved me hours of work. Highly recommended!',
      date: '2024-01-08T09:15:00Z',
      helpful: 15
    }
  ];
  
  res.json({ 
    extensionId,
    reviews,
    summary: {
      averageRating: 4.7,
      totalReviews: 23,
      distribution: {
        5: 15,
        4: 6,
        3: 2,
        2: 0,
        1: 0
      }
    }
  });
});

// Submit extension review
router.post('/:extensionId/reviews', (req, res) => {
  const { extensionId } = req.params;
  const { rating, comment } = req.body;
  
  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Valid rating (1-5) is required' });
  }
  
  if (!comment || comment.trim().length < 10) {
    return res.status(400).json({ error: 'Comment must be at least 10 characters long' });
  }
  
  const review = {
    id: Date.now().toString(),
    user: 'Anonymous',
    rating,
    comment: comment.trim(),
    date: new Date().toISOString(),
    helpful: 0
  };
  
  res.json({ 
    message: 'Review submitted successfully',
    review
  });
});

// Get extension documentation
router.get('/:extensionId/docs', (req, res) => {
  const { extensionId } = req.params;
  
  const docs = {
    extensionId,
    sections: [
      {
        title: 'Getting Started',
        content: `# Getting Started with ${extensionId}

This extension provides powerful capabilities for working with files and data.

## Installation

The extension is automatically available once installed from the marketplace.

## Basic Usage

1. Enable the extension in your settings
2. Use the command palette to access extension features
3. Configure extension settings as needed`
      },
      {
        title: 'API Reference',
        content: `# API Reference

## Available Commands

### read_file(path)
Reads a file from the specified path.

**Parameters:**
- \`path\` (string): The file path to read

**Returns:**
- File content as string

### write_file(path, content)
Writes content to a file.

**Parameters:**
- \`path\` (string): The file path to write to
- \`content\` (string): The content to write`
      }
    ]
  };
  
  res.json(docs);
});

// Get extension permissions
router.get('/:extensionId/permissions', (req, res) => {
  const { extensionId } = req.params;
  
  const permissions = {
    'excel-mcp': [
      { name: 'File System Access', description: 'Read and write Excel files', required: true },
      { name: 'Network Access', description: 'Download templates and updates', required: false },
      { name: 'Clipboard Access', description: 'Copy data to clipboard', required: false }
    ],
    'file-manager-mcp': [
      { name: 'File System Access', description: 'Full file system operations', required: true },
      { name: 'Process Execution', description: 'Execute system commands', required: true },
      { name: 'Network Access', description: 'File synchronization', required: false }
    ],
    'code-analysis-mcp': [
      { name: 'File System Access', description: 'Read source code files', required: true },
      { name: 'Process Execution', description: 'Run analysis tools', required: true },
      { name: 'Network Access', description: 'Download analysis rules', required: false }
    ]
  };
  
  res.json({ 
    extensionId,
    permissions: permissions[extensionId] || []
  });
});

module.exports = router;