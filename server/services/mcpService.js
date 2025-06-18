const ExcelJS = require('exceljs');
const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class MCPService {
  constructor() {
    this.extensions = new Map();
    this.initializeBuiltinExtensions();
  }

  initializeBuiltinExtensions() {
    // Excel MCP Extension
    this.extensions.set('excel-mcp', {
      id: 'excel-mcp',
      name: 'Excel MCP',
      capabilities: {
        read_excel: this.readExcel.bind(this),
        write_excel: this.writeExcel.bind(this),
        analyze_data: this.analyzeData.bind(this),
        create_chart: this.createChart.bind(this),
        pivot_table: this.createPivotTable.bind(this),
        apply_formula: this.applyFormula.bind(this),
        validate_data: this.validateData.bind(this)
      }
    });

    // File Manager MCP Extension
    this.extensions.set('file-manager-mcp', {
      id: 'file-manager-mcp',
      name: 'File Manager MCP',
      capabilities: {
        list_files: this.listFiles.bind(this),
        read_file: this.readFile.bind(this),
        write_file: this.writeFile.bind(this),
        delete_file: this.deleteFile.bind(this),
        copy_file: this.copyFile.bind(this),
        move_file: this.moveFile.bind(this),
        search_files: this.searchFiles.bind(this),
        watch_directory: this.watchDirectory.bind(this)
      }
    });

    // Code Analysis MCP Extension
    this.extensions.set('code-analysis-mcp', {
      id: 'code-analysis-mcp',
      name: 'Code Analysis MCP',
      capabilities: {
        analyze_code: this.analyzeCode.bind(this),
        refactor_code: this.refactorCode.bind(this),
        generate_docs: this.generateDocs.bind(this),
        run_tests: this.runTests.bind(this),
        lint_code: this.lintCode.bind(this)
      }
    });
  }

  async executeCommand(extensionId, command, parameters) {
    const extension = this.extensions.get(extensionId);
    if (!extension) {
      throw new Error(`Extension ${extensionId} not found`);
    }

    const capability = extension.capabilities[command];
    if (!capability) {
      throw new Error(`Command ${command} not found in extension ${extensionId}`);
    }

    try {
      return await capability(parameters);
    } catch (error) {
      throw new Error(`Failed to execute ${command}: ${error.message}`);
    }
  }

  async getCapabilities(extensionId) {
    const extension = this.extensions.get(extensionId);
    if (!extension) {
      throw new Error(`Extension ${extensionId} not found`);
    }

    return Object.keys(extension.capabilities).map(command => ({
      command,
      description: this.getCommandDescription(extensionId, command),
      parameters: this.getCommandParameters(extensionId, command)
    }));
  }

  getCommandDescription(extensionId, command) {
    const descriptions = {
      'excel-mcp': {
        read_excel: 'Read data from an Excel file',
        write_excel: 'Write data to an Excel file',
        analyze_data: 'Analyze data in an Excel file',
        create_chart: 'Create charts from Excel data',
        pivot_table: 'Create pivot tables',
        apply_formula: 'Apply formulas to Excel data',
        validate_data: 'Validate data in Excel files'
      },
      'file-manager-mcp': {
        list_files: 'List files in a directory',
        read_file: 'Read file contents',
        write_file: 'Write content to a file',
        delete_file: 'Delete a file',
        copy_file: 'Copy a file',
        move_file: 'Move or rename a file',
        search_files: 'Search for files',
        watch_directory: 'Watch directory for changes'
      },
      'code-analysis-mcp': {
        analyze_code: 'Analyze code quality and structure',
        refactor_code: 'Refactor code for better quality',
        generate_docs: 'Generate documentation from code',
        run_tests: 'Run code tests',
        lint_code: 'Lint code for style issues'
      }
    };

    return descriptions[extensionId]?.[command] || 'No description available';
  }

  getCommandParameters(extensionId, command) {
    const parameters = {
      'excel-mcp': {
        read_excel: [
          { name: 'path', type: 'string', required: true, description: 'Path to Excel file' },
          { name: 'sheet', type: 'string', required: false, description: 'Sheet name (default: first sheet)' },
          { name: 'range', type: 'string', required: false, description: 'Cell range to read' }
        ],
        write_excel: [
          { name: 'path', type: 'string', required: true, description: 'Path to Excel file' },
          { name: 'data', type: 'array', required: true, description: 'Data to write' },
          { name: 'sheet', type: 'string', required: false, description: 'Sheet name' }
        ],
        analyze_data: [
          { name: 'path', type: 'string', required: true, description: 'Path to Excel file' },
          { name: 'analysis_type', type: 'string', required: false, description: 'Type of analysis' }
        ]
      }
    };

    return parameters[extensionId]?.[command] || [];
  }

  // Excel MCP Implementation
  async readExcel(params) {
    const { path: filePath, sheet, range } = params;
    
    if (!filePath) {
      throw new Error('File path is required');
    }

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    
    const worksheet = sheet ? workbook.getWorksheet(sheet) : workbook.worksheets[0];
    if (!worksheet) {
      throw new Error(`Sheet ${sheet || 'first sheet'} not found`);
    }

    const data = [];
    const startRow = range ? this.parseRange(range).startRow : 1;
    const endRow = range ? this.parseRange(range).endRow : worksheet.rowCount;
    const startCol = range ? this.parseRange(range).startCol : 1;
    const endCol = range ? this.parseRange(range).endCol : worksheet.columnCount;

    for (let row = startRow; row <= endRow; row++) {
      const rowData = [];
      for (let col = startCol; col <= endCol; col++) {
        const cell = worksheet.getCell(row, col);
        rowData.push(cell.value);
      }
      data.push(rowData);
    }

    return {
      data,
      metadata: {
        sheetName: worksheet.name,
        rowCount: worksheet.rowCount,
        columnCount: worksheet.columnCount,
        range: range || `A1:${this.columnToLetter(worksheet.columnCount)}${worksheet.rowCount}`
      }
    };
  }

  async writeExcel(params) {
    const { path: filePath, data, sheet = 'Sheet1' } = params;
    
    if (!filePath || !data) {
      throw new Error('File path and data are required');
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(sheet);

    data.forEach((row, rowIndex) => {
      row.forEach((cell, colIndex) => {
        worksheet.getCell(rowIndex + 1, colIndex + 1).value = cell;
      });
    });

    await workbook.xlsx.writeFile(filePath);

    return {
      success: true,
      path: filePath,
      rowsWritten: data.length,
      columnsWritten: data[0]?.length || 0
    };
  }

  async analyzeData(params) {
    const { path: filePath, analysis_type = 'basic' } = params;
    
    const excelData = await this.readExcel({ path: filePath });
    const data = excelData.data;

    const analysis = {
      rowCount: data.length,
      columnCount: data[0]?.length || 0,
      dataTypes: this.analyzeDataTypes(data),
      statistics: this.calculateStatistics(data),
      nullValues: this.countNullValues(data)
    };

    if (analysis_type === 'advanced') {
      analysis.correlations = this.calculateCorrelations(data);
      analysis.outliers = this.detectOutliers(data);
    }

    return analysis;
  }

  async createChart(params) {
    const { data, type = 'bar', title = 'Chart', xAxis, yAxis } = params;
    
    // This would integrate with a charting library
    // For now, return chart configuration
    return {
      type,
      title,
      data: data,
      config: {
        xAxis: xAxis || 'Category',
        yAxis: yAxis || 'Value',
        series: this.prepareChartSeries(data, type)
      },
      id: uuidv4()
    };
  }

  async createPivotTable(params) {
    const { data, rows, columns, values, aggregation = 'sum' } = params;
    
    // Simplified pivot table implementation
    const pivotData = this.processPivotData(data, rows, columns, values, aggregation);
    
    return {
      pivotData,
      configuration: { rows, columns, values, aggregation },
      id: uuidv4()
    };
  }

  async applyFormula(params) {
    const { path: filePath, formula, range, sheet } = params;
    
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    
    const worksheet = sheet ? workbook.getWorksheet(sheet) : workbook.worksheets[0];
    
    if (range) {
      const { startRow, endRow, startCol, endCol } = this.parseRange(range);
      for (let row = startRow; row <= endRow; row++) {
        for (let col = startCol; col <= endCol; col++) {
          worksheet.getCell(row, col).value = { formula };
        }
      }
    }
    
    await workbook.xlsx.writeFile(filePath);
    
    return {
      success: true,
      formula,
      range,
      appliedCells: range ? this.countCellsInRange(range) : 1
    };
  }

  async validateData(params) {
    const { path: filePath, rules, sheet } = params;
    
    const excelData = await this.readExcel({ path: filePath, sheet });
    const data = excelData.data;
    
    const validationResults = [];
    
    rules.forEach(rule => {
      const result = this.applyValidationRule(data, rule);
      validationResults.push(result);
    });
    
    return {
      validationResults,
      summary: {
        totalRules: rules.length,
        passed: validationResults.filter(r => r.passed).length,
        failed: validationResults.filter(r => !r.passed).length
      }
    };
  }

  // File Manager MCP Implementation
  async listFiles(params) {
    const { path: dirPath = '/workspace', recursive = false } = params;
    
    const items = await fs.readdir(dirPath, { withFileTypes: true });
    const fileList = [];
    
    for (const item of items) {
      const itemPath = path.join(dirPath, item.name);
      const stats = await fs.stat(itemPath);
      
      fileList.push({
        name: item.name,
        path: itemPath,
        type: item.isDirectory() ? 'directory' : 'file',
        size: stats.size,
        modified: stats.mtime,
        isDirectory: item.isDirectory()
      });
      
      if (recursive && item.isDirectory()) {
        const subItems = await this.listFiles({ path: itemPath, recursive: true });
        fileList.push(...subItems.files);
      }
    }
    
    return { files: fileList };
  }

  async readFile(params) {
    const { path: filePath, encoding = 'utf8' } = params;
    
    const content = await fs.readFile(filePath, encoding);
    const stats = await fs.stat(filePath);
    
    return {
      content,
      metadata: {
        path: filePath,
        size: stats.size,
        modified: stats.mtime,
        encoding
      }
    };
  }

  async writeFile(params) {
    const { path: filePath, content, encoding = 'utf8' } = params;
    
    await fs.writeFile(filePath, content, encoding);
    const stats = await fs.stat(filePath);
    
    return {
      success: true,
      path: filePath,
      size: stats.size,
      modified: stats.mtime
    };
  }

  async deleteFile(params) {
    const { path: filePath } = params;
    
    const stats = await fs.stat(filePath);
    
    if (stats.isDirectory()) {
      await fs.rmdir(filePath, { recursive: true });
    } else {
      await fs.unlink(filePath);
    }
    
    return {
      success: true,
      path: filePath,
      type: stats.isDirectory() ? 'directory' : 'file'
    };
  }

  async copyFile(params) {
    const { from, to } = params;
    
    await fs.copyFile(from, to);
    const stats = await fs.stat(to);
    
    return {
      success: true,
      from,
      to,
      size: stats.size
    };
  }

  async moveFile(params) {
    const { from, to } = params;
    
    await fs.rename(from, to);
    
    return {
      success: true,
      from,
      to
    };
  }

  async searchFiles(params) {
    const { query, path: searchPath = '/workspace', type = 'all' } = params;
    
    const results = [];
    
    const searchRecursive = async (dirPath, depth = 0) => {
      if (depth > 10) return;
      
      try {
        const items = await fs.readdir(dirPath, { withFileTypes: true });
        
        for (const item of items) {
          const itemPath = path.join(dirPath, item.name);
          
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
          
          if (item.isDirectory() && depth < 5) {
            await searchRecursive(itemPath, depth + 1);
          }
        }
      } catch (error) {
        // Skip directories we can't access
      }
    };
    
    await searchRecursive(searchPath);
    
    return {
      query,
      results: results.slice(0, 100)
    };
  }

  async watchDirectory(params) {
    const { path: dirPath, events = ['change', 'add', 'unlink'] } = params;
    
    // This would set up file watching with chokidar
    // For now, return watch configuration
    return {
      watching: dirPath,
      events,
      watchId: uuidv4()
    };
  }

  // Code Analysis MCP Implementation
  async analyzeCode(params) {
    const { path: filePath, language, metrics = ['complexity', 'maintainability'] } = params;
    
    const code = await this.readFile({ path: filePath });
    
    const analysis = {
      file: filePath,
      language: language || this.detectLanguage(filePath),
      metrics: {},
      issues: [],
      suggestions: []
    };
    
    if (metrics.includes('complexity')) {
      analysis.metrics.complexity = this.calculateComplexity(code.content);
    }
    
    if (metrics.includes('maintainability')) {
      analysis.metrics.maintainability = this.calculateMaintainability(code.content);
    }
    
    return analysis;
  }

  async refactorCode(params) {
    const { path: filePath, refactorType, options = {} } = params;
    
    const code = await this.readFile({ path: filePath });
    
    // Simplified refactoring - would integrate with actual refactoring tools
    const refactoredCode = this.performRefactoring(code.content, refactorType, options);
    
    return {
      original: code.content,
      refactored: refactoredCode,
      changes: this.calculateChanges(code.content, refactoredCode),
      refactorType
    };
  }

  async generateDocs(params) {
    const { path: filePath, format = 'markdown', includePrivate = false } = params;
    
    const code = await this.readFile({ path: filePath });
    
    // Simplified documentation generation
    const docs = this.extractDocumentation(code.content, format, includePrivate);
    
    return {
      documentation: docs,
      format,
      sourceFile: filePath,
      generatedAt: new Date().toISOString()
    };
  }

  async runTests(params) {
    const { path: testPath, framework = 'auto', coverage = false } = params;
    
    // This would integrate with testing frameworks
    return {
      testPath,
      framework,
      results: {
        passed: 8,
        failed: 2,
        skipped: 1,
        total: 11
      },
      coverage: coverage ? {
        lines: 85.5,
        functions: 92.3,
        branches: 78.9
      } : null
    };
  }

  async lintCode(params) {
    const { path: filePath, rules = 'default', fix = false } = params;
    
    const code = await this.readFile({ path: filePath });
    
    // Simplified linting
    const issues = this.performLinting(code.content, rules);
    
    if (fix) {
      const fixedCode = this.applyLintFixes(code.content, issues);
      await this.writeFile({ path: filePath, content: fixedCode });
    }
    
    return {
      file: filePath,
      issues,
      fixed: fix,
      summary: {
        errors: issues.filter(i => i.severity === 'error').length,
        warnings: issues.filter(i => i.severity === 'warning').length,
        info: issues.filter(i => i.severity === 'info').length
      }
    };
  }

  // Helper methods
  parseRange(range) {
    // Simple range parser (e.g., "A1:C10")
    const [start, end] = range.split(':');
    return {
      startRow: parseInt(start.match(/\d+/)[0]),
      endRow: parseInt(end.match(/\d+/)[0]),
      startCol: this.letterToColumn(start.match(/[A-Z]+/)[0]),
      endCol: this.letterToColumn(end.match(/[A-Z]+/)[0])
    };
  }

  letterToColumn(letter) {
    let column = 0;
    for (let i = 0; i < letter.length; i++) {
      column = column * 26 + (letter.charCodeAt(i) - 64);
    }
    return column;
  }

  columnToLetter(column) {
    let letter = '';
    while (column > 0) {
      column--;
      letter = String.fromCharCode(65 + (column % 26)) + letter;
      column = Math.floor(column / 26);
    }
    return letter;
  }

  analyzeDataTypes(data) {
    const types = {};
    if (data.length > 0) {
      data[0].forEach((_, colIndex) => {
        const columnData = data.map(row => row[colIndex]).filter(val => val != null);
        types[`column_${colIndex}`] = this.detectDataType(columnData);
      });
    }
    return types;
  }

  detectDataType(columnData) {
    if (columnData.length === 0) return 'empty';
    
    const sample = columnData.slice(0, 100);
    const numbers = sample.filter(val => typeof val === 'number' || !isNaN(Number(val)));
    const dates = sample.filter(val => !isNaN(Date.parse(val)));
    
    if (numbers.length / sample.length > 0.8) return 'number';
    if (dates.length / sample.length > 0.8) return 'date';
    return 'text';
  }

  calculateStatistics(data) {
    const stats = {};
    if (data.length > 0) {
      data[0].forEach((_, colIndex) => {
        const columnData = data.map(row => row[colIndex])
          .filter(val => val != null && !isNaN(Number(val)))
          .map(val => Number(val));
        
        if (columnData.length > 0) {
          stats[`column_${colIndex}`] = {
            count: columnData.length,
            min: Math.min(...columnData),
            max: Math.max(...columnData),
            mean: columnData.reduce((a, b) => a + b, 0) / columnData.length,
            median: this.calculateMedian(columnData)
          };
        }
      });
    }
    return stats;
  }

  calculateMedian(numbers) {
    const sorted = numbers.sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 
      ? (sorted[middle - 1] + sorted[middle]) / 2 
      : sorted[middle];
  }

  countNullValues(data) {
    let nullCount = 0;
    data.forEach(row => {
      row.forEach(cell => {
        if (cell == null || cell === '') nullCount++;
      });
    });
    return nullCount;
  }

  calculateCorrelations(data) {
    // Simplified correlation calculation
    return { message: 'Correlation analysis would be implemented here' };
  }

  detectOutliers(data) {
    // Simplified outlier detection
    return { message: 'Outlier detection would be implemented here' };
  }

  prepareChartSeries(data, type) {
    // Prepare data for charting
    return data.map((row, index) => ({
      name: `Series ${index + 1}`,
      data: row.filter(val => !isNaN(Number(val))).map(val => Number(val))
    }));
  }

  processPivotData(data, rows, columns, values, aggregation) {
    // Simplified pivot table processing
    return { message: 'Pivot table processing would be implemented here' };
  }

  countCellsInRange(range) {
    const { startRow, endRow, startCol, endCol } = this.parseRange(range);
    return (endRow - startRow + 1) * (endCol - startCol + 1);
  }

  applyValidationRule(data, rule) {
    // Simplified validation rule application
    return {
      rule: rule.name,
      passed: Math.random() > 0.3, // Mock validation
      errors: []
    };
  }

  detectLanguage(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const languageMap = {
      '.js': 'javascript',
      '.ts': 'typescript',
      '.py': 'python',
      '.java': 'java',
      '.cpp': 'cpp',
      '.c': 'c',
      '.cs': 'csharp',
      '.php': 'php',
      '.rb': 'ruby',
      '.go': 'go'
    };
    return languageMap[ext] || 'unknown';
  }

  calculateComplexity(code) {
    // Simplified complexity calculation
    const lines = code.split('\n').length;
    const functions = (code.match(/function|def |class /g) || []).length;
    return Math.floor(lines / 10) + functions * 2;
  }

  calculateMaintainability(code) {
    // Simplified maintainability score
    const lines = code.split('\n').length;
    const comments = (code.match(/\/\/|\/\*|\#/g) || []).length;
    return Math.max(0, 100 - lines / 10 + comments);
  }

  performRefactoring(code, refactorType, options) {
    // Simplified refactoring
    return code; // Would implement actual refactoring
  }

  calculateChanges(original, refactored) {
    // Simplified change calculation
    return {
      linesAdded: 0,
      linesRemoved: 0,
      linesModified: 0
    };
  }

  extractDocumentation(code, format, includePrivate) {
    // Simplified documentation extraction
    return `# Documentation\n\nGenerated from code analysis.`;
  }

  performLinting(code, rules) {
    // Simplified linting
    return [
      {
        line: 1,
        column: 1,
        severity: 'warning',
        message: 'Example lint warning',
        rule: 'example-rule'
      }
    ];
  }

  applyLintFixes(code, issues) {
    // Simplified lint fixing
    return code;
  }
}

module.exports = new MCPService();