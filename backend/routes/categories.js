const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { logManualActivity } = require('../middleware/activityLogger');
const { Category, Product } = require('../models');
const ExcelJS = require('exceljs');

const router = express.Router();

// Validation schemas
const categoryValidation = [
  body('name').trim().isLength({ min: 2 }).withMessage('Category name must be at least 2 characters long'),
  body('description').optional().trim(),
  body('parentId').optional().isUUID().withMessage('Valid parent category ID is required'),
  body('sortOrder').optional().isInt({ min: 0 }).withMessage('Sort order must be a non-negative integer')
];

// Get all categories
router.get('/', asyncHandler(async (req, res) => {
  const categories = await Category.findAll({
    where: { isActive: true },
    include: [
      {
        model: Category,
        as: 'parent',
        attributes: ['id', 'name', 'slug']
      },
      {
        model: Category,
        as: 'children',
        where: { isActive: true },
        required: false,
        attributes: ['id', 'name', 'slug', 'description']
      }
    ],
    order: [['sortOrder', 'ASC'], ['name', 'ASC']]
  });

  res.json({
    success: true,
    data: { categories }
  });
}));

// Get category by ID or slug
router.get('/:identifier', asyncHandler(async (req, res) => {
  const { identifier } = req.params;
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(identifier);

  const whereClause = isUUID ? { id: identifier } : { slug: identifier };
  whereClause.isActive = true;

  const category = await Category.findOne({
    where: whereClause,
    include: [
      {
        model: Category,
        as: 'parent',
        attributes: ['id', 'name', 'slug']
      },
      {
        model: Category,
        as: 'children',
        where: { isActive: true },
        required: false,
        attributes: ['id', 'name', 'slug', 'description']
      },
      {
        model: Product,
        as: 'products',
        where: { isActive: true },
        required: false,
        attributes: ['id', 'name', 'slug', 'price', 'mainImage'],
        limit: 10
      }
    ]
  });

  if (!category) {
    throw new AppError('Category not found', 404);
  }

  res.json({
    success: true,
    data: { category }
  });
}));

// Create new category (Admin only)
router.post('/', authenticate, requireAdmin, categoryValidation, asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError(errors.array()[0].msg, 400);
  }

  const { name, description, parentId, sortOrder = 0 } = req.body;

  // Check if category already exists
  const existingCategory = await Category.findOne({ where: { name } });
  if (existingCategory) {
    throw new AppError('Category with this name already exists', 400);
  }

  // Generate slug from name
  const slug = name.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  // Check if slug already exists
  const existingSlug = await Category.findOne({ where: { slug } });
  if (existingSlug) {
    throw new AppError('Category with this name already exists', 400);
  }

  // Validate parent category if provided
  if (parentId) {
    const parentCategory = await Category.findByPk(parentId);
    if (!parentCategory) {
      throw new AppError('Parent category not found', 400);
    }
  }

  // Create category
  const category = await Category.create({
    name,
    slug,
    description,
    parentId,
    sortOrder
  });

  // Log activity
  await logManualActivity({
    userId: req.user.id,
    action: 'category.create',
    entityType: 'category',
    entityId: category.id,
    description: `Created category: ${category.name}`,
    ipAddress: req.ip,
    userAgent: req.get('User-Agent')
  });

  res.status(201).json({
    success: true,
    message: 'Category created successfully',
    data: { category }
  });
}));

// Update category (Admin only)
router.put('/:id', authenticate, requireAdmin, categoryValidation, asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError(errors.array()[0].msg, 400);
  }

  const { id } = req.params;
  const category = await Category.findByPk(id);

  if (!category) {
    throw new AppError('Category not found', 404);
  }

  // Store old values for logging
  const oldValues = category.toJSON();

  // Update category
  await category.update(req.body);

  // Log activity
  await logManualActivity({
    userId: req.user.id,
    action: 'category.update',
    entityType: 'category',
    entityId: category.id,
    description: `Updated category: ${category.name}`,
    oldValues,
    newValues: category.toJSON(),
    ipAddress: req.ip,
    userAgent: req.get('User-Agent')
  });

  res.json({
    success: true,
    message: 'Category updated successfully',
    data: { category }
  });
}));

// Delete category (Admin only)
router.delete('/:id', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const category = await Category.findByPk(id);

  if (!category) {
    throw new AppError('Category not found', 404);
  }

  // Check if category has products
  const productCount = await Product.count({ where: { categoryId: id } });
  if (productCount > 0) {
    throw new AppError('Cannot delete category with existing products', 400);
  }

  // Check if category has children
  const childCount = await Category.count({ where: { parentId: id } });
  if (childCount > 0) {
    throw new AppError('Cannot delete category with existing subcategories', 400);
  }

  // Soft delete (set isActive to false)
  await category.update({ isActive: false });

  // Log activity
  await logManualActivity({
    userId: req.user.id,
    action: 'category.delete',
    entityType: 'category',
    entityId: category.id,
    description: `Deleted category: ${category.name}`,
    ipAddress: req.ip,
    userAgent: req.get('User-Agent')
  });

  res.json({
    success: true,
    message: 'Category deleted successfully'
  });
}));

// Import categories from Excel (Admin only)
router.post('/import', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new AppError('Excel file is required', 400);
  }

  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(req.file.path);
    const worksheet = workbook.getWorksheet(1);
    
    if (!worksheet) {
      throw new AppError('No worksheet found in Excel file', 400);
    }

    const data = [];
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) { // Skip header row
        const rowData = {};
        row.eachCell((cell, colNumber) => {
          const header = worksheet.getRow(1).getCell(colNumber).value;
          rowData[header] = cell.value;
        });
        data.push(rowData);
      }
    });

    const importedCategories = [];
    const errors = [];

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNumber = i + 2; // Excel rows start from 1, and we have header

      try {
        // Validate required fields
        if (!row.name || !row.name.trim()) {
          errors.push(`Row ${rowNumber}: Category name is required`);
          continue;
        }

        const name = row.name.trim();
        const description = row.description ? row.description.trim() : null;
        const parentName = row.parent ? row.parent.trim() : null;
        const sortOrder = row.sortOrder ? parseInt(row.sortOrder) : 0;

        // Check if category already exists
        const existingCategory = await Category.findOne({ where: { name } });
        if (existingCategory) {
          errors.push(`Row ${rowNumber}: Category "${name}" already exists`);
          continue;
        }

        // Find parent category if specified
        let parentId = null;
        if (parentName) {
          const parentCategory = await Category.findOne({ where: { name: parentName } });
          if (!parentCategory) {
            errors.push(`Row ${rowNumber}: Parent category "${parentName}" not found`);
            continue;
          }
          parentId = parentCategory.id;
        }

        // Generate slug
        const slug = name.toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');

        // Check if slug already exists
        const existingSlug = await Category.findOne({ where: { slug } });
        if (existingSlug) {
          errors.push(`Row ${rowNumber}: Category with slug "${slug}" already exists`);
          continue;
        }

        // Create category
        const category = await Category.create({
          name,
          slug,
          description,
          parentId,
          sortOrder,
          excelRowId: rowNumber,
          importedAt: new Date()
        });

        importedCategories.push(category);

      } catch (error) {
        errors.push(`Row ${rowNumber}: ${error.message}`);
      }
    }

    // Log activity
    await logManualActivity({
      userId: req.user.id,
      action: 'category.import',
      entityType: 'category',
      description: `Imported ${importedCategories.length} categories from Excel`,
      metadata: {
        totalRows: data.length,
        importedCount: importedCategories.length,
        errorCount: errors.length,
        errors: errors.slice(0, 10) // Log first 10 errors
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      success: true,
      message: `Import completed. ${importedCategories.length} categories imported successfully.`,
      data: {
        imported: importedCategories.length,
        errors: errors.length,
        errorDetails: errors.slice(0, 10)
      }
    });

  } catch (error) {
    throw new AppError(`Excel import failed: ${error.message}`, 400);
  }
}));

// Export categories to Excel (Admin only)
router.get('/export', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const categories = await Category.findAll({
    where: { isActive: true },
    include: [
      {
        model: Category,
        as: 'parent',
        attributes: ['name']
      }
    ],
    order: [['sortOrder', 'ASC'], ['name', 'ASC']]
  });

  const excelData = categories.map(category => ({
    name: category.name,
    description: category.description || '',
    parent: category.parent ? category.parent.name : '',
    sortOrder: category.sortOrder,
    slug: category.slug,
    createdAt: category.createdAt.toISOString().split('T')[0]
  }));

  // Create workbook
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Categories');

  // Add headers
  worksheet.columns = [
    { header: 'name', key: 'name', width: 20 },
    { header: 'description', key: 'description', width: 30 },
    { header: 'parent', key: 'parent', width: 20 },
    { header: 'sortOrder', key: 'sortOrder', width: 10 },
    { header: 'slug', key: 'slug', width: 25 },
    { header: 'createdAt', key: 'createdAt', width: 15 }
  ];

  // Add data
  worksheet.addRows(excelData);

  // Style headers
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  };

  // Generate buffer
  const buffer = await workbook.xlsx.writeBuffer();

  // Set response headers
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename=categories.xlsx');

  res.send(buffer);
}));

// Get category tree (hierarchical structure)
router.get('/tree/structure', asyncHandler(async (req, res) => {
  const categories = await Category.findAll({
    where: { isActive: true },
    order: [['sortOrder', 'ASC'], ['name', 'ASC']]
  });

  // Build tree structure
  const buildTree = (items, parentId = null) => {
    return items
      .filter(item => item.parentId === parentId)
      .map(item => ({
        ...item.toJSON(),
        children: buildTree(items, item.id)
      }));
  };

  const categoryTree = buildTree(categories);

  res.json({
    success: true,
    data: { categories: categoryTree }
  });
}));

// Get category statistics (Admin only)
router.get('/stats/overview', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const totalCategories = await Category.count({ where: { isActive: true } });
  const parentCategories = await Category.count({ 
    where: { isActive: true, parentId: null } 
  });
  const subCategories = await Category.count({ 
    where: { isActive: true, parentId: { [require('sequelize').Op.ne]: null } } 
  });

  // Categories with most products
  const topCategories = await Category.findAll({
    where: { isActive: true },
    include: [
      {
        model: Product,
        as: 'products',
        where: { isActive: true },
        required: false,
        attributes: []
      }
    ],
    attributes: [
      'id',
      'name',
      'slug',
      [require('sequelize').fn('COUNT', require('sequelize').col('products.id')), 'productCount']
    ],
    group: ['Category.id'],
    order: [[require('sequelize').fn('COUNT', require('sequelize').col('products.id')), 'DESC']],
    limit: 10
  });

  res.json({
    success: true,
    data: {
      totalCategories,
      parentCategories,
      subCategories,
      topCategories
    }
  });
}));

module.exports = router; 