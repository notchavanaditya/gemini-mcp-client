const ExcelJS = require('exceljs');
const fs = require('fs').promises;
const path = require('path');

class ExcelMCP {
  constructor() {
    this.tools = [
      'read_excel',
      'write_excel',
      'create_workbook',
      'add_worksheet',
      'delete_worksheet',
      'format_cells',
      'create_chart',
      'apply_formula',
      'get_cell_value',
      'set_cell_value',
      'get_range',
      'set_range',
      'insert_rows',
      'delete_rows',
      'insert_columns',
      'delete_columns',
      'merge_cells',
      'unmerge_cells',
      'auto_filter',
      'sort_data',
      'create_pivot_table'
    ];
    
    this.workbooks = new Map(); // Cache for open workbooks
  }

  async initialize() {
    console.log('Excel MCP Server initialized');
  }

  async shutdown() {
    // Close all open workbooks
    this.workbooks.clear();
    console.log('Excel MCP Server shutdown');
  }

  getTools() {
    return this.tools.map(name => ({
      name,
      description: this.getToolDescription(name),
      inputSchema: this.getToolInputSchema(name)
    }));
  }

  getToolDescription(toolName) {
    const descriptions = {
      read_excel: 'Read data from an Excel file',
      write_excel: 'Write data to an Excel file',
      create_workbook: 'Create a new Excel workbook',
      add_worksheet: 'Add a new worksheet to a workbook',
      delete_worksheet: 'Delete a worksheet from a workbook',
      format_cells: 'Apply formatting to cells',
      create_chart: 'Create a chart in a worksheet',
      apply_formula: 'Apply a formula to cells',
      get_cell_value: 'Get the value of a specific cell',
      set_cell_value: 'Set the value of a specific cell',
      get_range: 'Get values from a range of cells',
      set_range: 'Set values for a range of cells',
      insert_rows: 'Insert rows into a worksheet',
      delete_rows: 'Delete rows from a worksheet',
      insert_columns: 'Insert columns into a worksheet',
      delete_columns: 'Delete columns from a worksheet',
      merge_cells: 'Merge a range of cells',
      unmerge_cells: 'Unmerge cells',
      auto_filter: 'Apply auto filter to a range',
      sort_data: 'Sort data in a range',
      create_pivot_table: 'Create a pivot table'
    };
    
    return descriptions[toolName] || 'Excel operation';
  }

  getToolInputSchema(toolName) {
    const schemas = {
      read_excel: {
        type: 'object',
        properties: {
          filePath: { type: 'string', description: 'Path to the Excel file' },
          worksheetName: { type: 'string', description: 'Name of the worksheet (optional)' },
          range: { type: 'string', description: 'Cell range to read (optional, e.g., A1:C10)' }
        },
        required: ['filePath']
      },
      write_excel: {
        type: 'object',
        properties: {
          filePath: { type: 'string', description: 'Path to save the Excel file' },
          data: { type: 'array', description: 'Data to write (array of arrays)' },
          worksheetName: { type: 'string', description: 'Name of the worksheet' },
          startCell: { type: 'string', description: 'Starting cell (e.g., A1)' }
        },
        required: ['filePath', 'data']
      },
      create_workbook: {
        type: 'object',
        properties: {
          filePath: { type: 'string', description: 'Path for the new workbook' },
          worksheetName: { type: 'string', description: 'Name of the initial worksheet' }
        },
        required: ['filePath']
      },
      get_cell_value: {
        type: 'object',
        properties: {
          filePath: { type: 'string', description: 'Path to the Excel file' },
          worksheetName: { type: 'string', description: 'Name of the worksheet' },
          cell: { type: 'string', description: 'Cell reference (e.g., A1)' }
        },
        required: ['filePath', 'cell']
      },
      set_cell_value: {
        type: 'object',
        properties: {
          filePath: { type: 'string', description: 'Path to the Excel file' },
          worksheetName: { type: 'string', description: 'Name of the worksheet' },
          cell: { type: 'string', description: 'Cell reference (e.g., A1)' },
          value: { description: 'Value to set' }
        },
        required: ['filePath', 'cell', 'value']
      }
    };
    
    return schemas[toolName] || { type: 'object', properties: {} };
  }

  async executeTool(toolName, args) {
    try {
      switch (toolName) {
        case 'read_excel':
          return await this.readExcel(args);
        case 'write_excel':
          return await this.writeExcel(args);
        case 'create_workbook':
          return await this.createWorkbook(args);
        case 'add_worksheet':
          return await this.addWorksheet(args);
        case 'delete_worksheet':
          return await this.deleteWorksheet(args);
        case 'format_cells':
          return await this.formatCells(args);
        case 'create_chart':
          return await this.createChart(args);
        case 'apply_formula':
          return await this.applyFormula(args);
        case 'get_cell_value':
          return await this.getCellValue(args);
        case 'set_cell_value':
          return await this.setCellValue(args);
        case 'get_range':
          return await this.getRange(args);
        case 'set_range':
          return await this.setRange(args);
        case 'insert_rows':
          return await this.insertRows(args);
        case 'delete_rows':
          return await this.deleteRows(args);
        case 'insert_columns':
          return await this.insertColumns(args);
        case 'delete_columns':
          return await this.deleteColumns(args);
        case 'merge_cells':
          return await this.mergeCells(args);
        case 'unmerge_cells':
          return await this.unmergeCells(args);
        case 'auto_filter':
          return await this.autoFilter(args);
        case 'sort_data':
          return await this.sortData(args);
        case 'create_pivot_table':
          return await this.createPivotTable(args);
        default:
          throw new Error(`Unknown tool: ${toolName}`);
      }
    } catch (error) {
      console.error(`Error executing tool ${toolName}:`, error);
      throw error;
    }
  }

  async getWorkbook(filePath) {
    if (this.workbooks.has(filePath)) {
      return this.workbooks.get(filePath);
    }

    const workbook = new ExcelJS.Workbook();
    
    try {
      await workbook.xlsx.readFile(filePath);
    } catch (error) {
      if (error.code === 'ENOENT') {
        // File doesn't exist, create new workbook
        workbook.addWorksheet('Sheet1');
      } else {
        throw error;
      }
    }

    this.workbooks.set(filePath, workbook);
    return workbook;
  }

  async saveWorkbook(filePath, workbook) {
    await workbook.xlsx.writeFile(filePath);
    this.workbooks.set(filePath, workbook);
  }

  async readExcel(args) {
    const { filePath, worksheetName, range } = args;
    
    const workbook = await this.getWorkbook(filePath);
    const worksheet = worksheetName 
      ? workbook.getWorksheet(worksheetName)
      : workbook.getWorksheet(1);

    if (!worksheet) {
      throw new Error(`Worksheet ${worksheetName || '1'} not found`);
    }

    let data;
    if (range) {
      const rangeData = worksheet.getCell(range);
      data = rangeData.value;
    } else {
      data = [];
      worksheet.eachRow((row, rowNumber) => {
        const rowData = [];
        row.eachCell((cell, colNumber) => {
          rowData[colNumber - 1] = cell.value;
        });
        data.push(rowData);
      });
    }

    return {
      success: true,
      data,
      worksheetName: worksheet.name,
      rowCount: worksheet.rowCount,
      columnCount: worksheet.columnCount
    };
  }

  async writeExcel(args) {
    const { filePath, data, worksheetName = 'Sheet1', startCell = 'A1' } = args;
    
    const workbook = await this.getWorkbook(filePath);
    let worksheet = workbook.getWorksheet(worksheetName);
    
    if (!worksheet) {
      worksheet = workbook.addWorksheet(worksheetName);
    }

    // Parse start cell
    const startRow = parseInt(startCell.match(/\d+/)[0]);
    const startCol = startCell.match(/[A-Z]+/)[0];
    const startColNum = this.columnLetterToNumber(startCol);

    // Write data
    data.forEach((row, rowIndex) => {
      row.forEach((cellValue, colIndex) => {
        const cell = worksheet.getCell(startRow + rowIndex, startColNum + colIndex);
        cell.value = cellValue;
      });
    });

    await this.saveWorkbook(filePath, workbook);

    return {
      success: true,
      rowsWritten: data.length,
      columnsWritten: data[0]?.length || 0,
      worksheetName: worksheet.name
    };
  }

  async createWorkbook(args) {
    const { filePath, worksheetName = 'Sheet1' } = args;
    
    const workbook = new ExcelJS.Workbook();
    workbook.addWorksheet(worksheetName);
    
    await this.saveWorkbook(filePath, workbook);
    
    return {
      success: true,
      filePath,
      worksheetName
    };
  }

  async addWorksheet(args) {
    const { filePath, worksheetName } = args;
    
    const workbook = await this.getWorkbook(filePath);
    const worksheet = workbook.addWorksheet(worksheetName);
    
    await this.saveWorkbook(filePath, workbook);
    
    return {
      success: true,
      worksheetName: worksheet.name,
      worksheetCount: workbook.worksheets.length
    };
  }

  async deleteWorksheet(args) {
    const { filePath, worksheetName } = args;
    
    const workbook = await this.getWorkbook(filePath);
    const worksheet = workbook.getWorksheet(worksheetName);
    
    if (!worksheet) {
      throw new Error(`Worksheet ${worksheetName} not found`);
    }
    
    workbook.removeWorksheet(worksheet.id);
    await this.saveWorkbook(filePath, workbook);
    
    return {
      success: true,
      deletedWorksheet: worksheetName,
      remainingWorksheets: workbook.worksheets.length
    };
  }

  async getCellValue(args) {
    const { filePath, worksheetName, cell } = args;
    
    const workbook = await this.getWorkbook(filePath);
    const worksheet = worksheetName 
      ? workbook.getWorksheet(worksheetName)
      : workbook.getWorksheet(1);

    if (!worksheet) {
      throw new Error(`Worksheet ${worksheetName || '1'} not found`);
    }

    const cellObj = worksheet.getCell(cell);
    
    return {
      success: true,
      cell,
      value: cellObj.value,
      formula: cellObj.formula,
      type: cellObj.type
    };
  }

  async setCellValue(args) {
    const { filePath, worksheetName, cell, value } = args;
    
    const workbook = await this.getWorkbook(filePath);
    const worksheet = worksheetName 
      ? workbook.getWorksheet(worksheetName)
      : workbook.getWorksheet(1);

    if (!worksheet) {
      throw new Error(`Worksheet ${worksheetName || '1'} not found`);
    }

    const cellObj = worksheet.getCell(cell);
    cellObj.value = value;
    
    await this.saveWorkbook(filePath, workbook);
    
    return {
      success: true,
      cell,
      value: cellObj.value
    };
  }

  async getRange(args) {
    const { filePath, worksheetName, range } = args;
    
    const workbook = await this.getWorkbook(filePath);
    const worksheet = worksheetName 
      ? workbook.getWorksheet(worksheetName)
      : workbook.getWorksheet(1);

    if (!worksheet) {
      throw new Error(`Worksheet ${worksheetName || '1'} not found`);
    }

    const rangeObj = worksheet.getCell(range);
    const data = [];
    
    // If it's a single cell, return single value
    if (typeof rangeObj.value !== 'undefined') {
      return {
        success: true,
        range,
        data: [[rangeObj.value]]
      };
    }

    // For ranges, we need to parse and iterate
    const [startCell, endCell] = range.split(':');
    const startRow = parseInt(startCell.match(/\d+/)[0]);
    const endRow = parseInt(endCell.match(/\d+/)[0]);
    const startCol = this.columnLetterToNumber(startCell.match(/[A-Z]+/)[0]);
    const endCol = this.columnLetterToNumber(endCell.match(/[A-Z]+/)[0]);

    for (let row = startRow; row <= endRow; row++) {
      const rowData = [];
      for (let col = startCol; col <= endCol; col++) {
        const cell = worksheet.getCell(row, col);
        rowData.push(cell.value);
      }
      data.push(rowData);
    }
    
    return {
      success: true,
      range,
      data
    };
  }

  async setRange(args) {
    const { filePath, worksheetName, range, data } = args;
    
    const workbook = await this.getWorkbook(filePath);
    const worksheet = worksheetName 
      ? workbook.getWorksheet(worksheetName)
      : workbook.getWorksheet(1);

    if (!worksheet) {
      throw new Error(`Worksheet ${worksheetName || '1'} not found`);
    }

    const [startCell] = range.split(':');
    const startRow = parseInt(startCell.match(/\d+/)[0]);
    const startCol = this.columnLetterToNumber(startCell.match(/[A-Z]+/)[0]);

    data.forEach((row, rowIndex) => {
      row.forEach((cellValue, colIndex) => {
        const cell = worksheet.getCell(startRow + rowIndex, startCol + colIndex);
        cell.value = cellValue;
      });
    });
    
    await this.saveWorkbook(filePath, workbook);
    
    return {
      success: true,
      range,
      rowsSet: data.length,
      columnsSet: data[0]?.length || 0
    };
  }

  async formatCells(args) {
    const { filePath, worksheetName, range, format } = args;
    
    const workbook = await this.getWorkbook(filePath);
    const worksheet = worksheetName 
      ? workbook.getWorksheet(worksheetName)
      : workbook.getWorksheet(1);

    if (!worksheet) {
      throw new Error(`Worksheet ${worksheetName || '1'} not found`);
    }

    const [startCell, endCell] = range.split(':');
    const startRow = parseInt(startCell.match(/\d+/)[0]);
    const endRow = endCell ? parseInt(endCell.match(/\d+/)[0]) : startRow;
    const startCol = this.columnLetterToNumber(startCell.match(/[A-Z]+/)[0]);
    const endCol = endCell ? this.columnLetterToNumber(endCell.match(/[A-Z]+/)[0]) : startCol;

    for (let row = startRow; row <= endRow; row++) {
      for (let col = startCol; col <= endCol; col++) {
        const cell = worksheet.getCell(row, col);
        Object.assign(cell, format);
      }
    }
    
    await this.saveWorkbook(filePath, workbook);
    
    return {
      success: true,
      range,
      formatApplied: format
    };
  }

  async applyFormula(args) {
    const { filePath, worksheetName, cell, formula } = args;
    
    const workbook = await this.getWorkbook(filePath);
    const worksheet = worksheetName 
      ? workbook.getWorksheet(worksheetName)
      : workbook.getWorksheet(1);

    if (!worksheet) {
      throw new Error(`Worksheet ${worksheetName || '1'} not found`);
    }

    const cellObj = worksheet.getCell(cell);
    cellObj.value = { formula };
    
    await this.saveWorkbook(filePath, workbook);
    
    return {
      success: true,
      cell,
      formula,
      result: cellObj.result
    };
  }

  async insertRows(args) {
    const { filePath, worksheetName, startRow, count = 1 } = args;
    
    const workbook = await this.getWorkbook(filePath);
    const worksheet = worksheetName 
      ? workbook.getWorksheet(worksheetName)
      : workbook.getWorksheet(1);

    if (!worksheet) {
      throw new Error(`Worksheet ${worksheetName || '1'} not found`);
    }

    worksheet.spliceRows(startRow, 0, ...Array(count).fill([]));
    
    await this.saveWorkbook(filePath, workbook);
    
    return {
      success: true,
      startRow,
      rowsInserted: count
    };
  }

  async deleteRows(args) {
    const { filePath, worksheetName, startRow, count = 1 } = args;
    
    const workbook = await this.getWorkbook(filePath);
    const worksheet = worksheetName 
      ? workbook.getWorksheet(worksheetName)
      : workbook.getWorksheet(1);

    if (!worksheet) {
      throw new Error(`Worksheet ${worksheetName || '1'} not found`);
    }

    worksheet.spliceRows(startRow, count);
    
    await this.saveWorkbook(filePath, workbook);
    
    return {
      success: true,
      startRow,
      rowsDeleted: count
    };
  }

  async insertColumns(args) {
    const { filePath, worksheetName, startColumn, count = 1 } = args;
    
    const workbook = await this.getWorkbook(filePath);
    const worksheet = worksheetName 
      ? workbook.getWorksheet(worksheetName)
      : workbook.getWorksheet(1);

    if (!worksheet) {
      throw new Error(`Worksheet ${worksheetName || '1'} not found`);
    }

    const startCol = typeof startColumn === 'string' 
      ? this.columnLetterToNumber(startColumn)
      : startColumn;

    worksheet.spliceColumns(startCol, 0, ...Array(count).fill([]));
    
    await this.saveWorkbook(filePath, workbook);
    
    return {
      success: true,
      startColumn: startCol,
      columnsInserted: count
    };
  }

  async deleteColumns(args) {
    const { filePath, worksheetName, startColumn, count = 1 } = args;
    
    const workbook = await this.getWorkbook(filePath);
    const worksheet = worksheetName 
      ? workbook.getWorksheet(worksheetName)
      : workbook.getWorksheet(1);

    if (!worksheet) {
      throw new Error(`Worksheet ${worksheetName || '1'} not found`);
    }

    const startCol = typeof startColumn === 'string' 
      ? this.columnLetterToNumber(startColumn)
      : startColumn;

    worksheet.spliceColumns(startCol, count);
    
    await this.saveWorkbook(filePath, workbook);
    
    return {
      success: true,
      startColumn: startCol,
      columnsDeleted: count
    };
  }

  async mergeCells(args) {
    const { filePath, worksheetName, range } = args;
    
    const workbook = await this.getWorkbook(filePath);
    const worksheet = worksheetName 
      ? workbook.getWorksheet(worksheetName)
      : workbook.getWorksheet(1);

    if (!worksheet) {
      throw new Error(`Worksheet ${worksheetName || '1'} not found`);
    }

    worksheet.mergeCells(range);
    
    await this.saveWorkbook(filePath, workbook);
    
    return {
      success: true,
      range,
      merged: true
    };
  }

  async unmergeCells(args) {
    const { filePath, worksheetName, range } = args;
    
    const workbook = await this.getWorkbook(filePath);
    const worksheet = worksheetName 
      ? workbook.getWorksheet(worksheetName)
      : workbook.getWorksheet(1);

    if (!worksheet) {
      throw new Error(`Worksheet ${worksheetName || '1'} not found`);
    }

    worksheet.unMergeCells(range);
    
    await this.saveWorkbook(filePath, workbook);
    
    return {
      success: true,
      range,
      unmerged: true
    };
  }

  async autoFilter(args) {
    const { filePath, worksheetName, range } = args;
    
    const workbook = await this.getWorkbook(filePath);
    const worksheet = worksheetName 
      ? workbook.getWorksheet(worksheetName)
      : workbook.getWorksheet(1);

    if (!worksheet) {
      throw new Error(`Worksheet ${worksheetName || '1'} not found`);
    }

    worksheet.autoFilter = range;
    
    await this.saveWorkbook(filePath, workbook);
    
    return {
      success: true,
      range,
      autoFilterApplied: true
    };
  }

  async sortData(args) {
    // This is a simplified implementation
    // ExcelJS doesn't have built-in sorting, so this would need custom implementation
    return {
      success: false,
      error: 'Sort functionality not yet implemented'
    };
  }

  async createChart(args) {
    // This is a simplified implementation
    // Chart creation would require more complex ExcelJS usage
    return {
      success: false,
      error: 'Chart creation not yet implemented'
    };
  }

  async createPivotTable(args) {
    // This is a simplified implementation
    // Pivot table creation would require more complex ExcelJS usage
    return {
      success: false,
      error: 'Pivot table creation not yet implemented'
    };
  }

  columnLetterToNumber(letter) {
    let result = 0;
    for (let i = 0; i < letter.length; i++) {
      result = result * 26 + (letter.charCodeAt(i) - 'A'.charCodeAt(0) + 1);
    }
    return result;
  }

  numberToColumnLetter(number) {
    let result = '';
    while (number > 0) {
      number--;
      result = String.fromCharCode('A'.charCodeAt(0) + (number % 26)) + result;
      number = Math.floor(number / 26);
    }
    return result;
  }
}

module.exports = ExcelMCP;