import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Folder,
  FolderOpen,
  Package,
  Upload,
  Download
} from 'lucide-react';
import { categoriesAPI } from '@/lib/api';
import { Category } from '@/types';

export const AdminCategoriesPage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    parentId: '',
    isActive: true,
    sortOrder: 0
  });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setIsLoading(true);
      const response = await categoriesAPI.getCategories();
      if (response.success && response.data) {
        setCategories(response.data);
      }
    } catch (error) {
      console.error('Failed to load categories:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        const response = await categoriesAPI.updateCategory(editingCategory.id, formData);
        if (response.success) {
          setEditingCategory(null);
          resetForm();
          loadCategories();
        }
      } else {
        const response = await categoriesAPI.createCategory(formData);
        if (response.success) {
          resetForm();
          setShowAddForm(false);
          loadCategories();
        }
      }
    } catch (error) {
      console.error('Failed to save category:', error);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (window.confirm('Are you sure you want to delete this category? This will also delete all subcategories.')) {
      try {
        const response = await categoriesAPI.deleteCategory(categoryId);
        if (response.success) {
          loadCategories();
        }
      } catch (error) {
        console.error('Failed to delete category:', error);
      }
    }
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      parentId: category.parentId || '',
      isActive: category.isActive,
      sortOrder: category.sortOrder || 0
    });
    setShowAddForm(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      parentId: '',
      isActive: true,
      sortOrder: 0
    });
  };

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const response = await categoriesAPI.importCategories(file);
        if (response.success) {
          loadCategories();
        }
      } catch (error) {
        console.error('Failed to import categories:', error);
      }
    }
  };

  const handleExportExcel = async () => {
    try {
      const blob = await categoriesAPI.exportCategories();
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'categories.xlsx';
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export categories:', error);
    }
  };

  const getParentCategories = () => {
    return categories.filter(cat => !cat.parentId);
  };

  const getSubcategories = (parentId: string) => {
    return categories.filter(cat => cat.parentId === parentId);
  };

  const renderCategoryTree = (parentCategories: Category[], level = 0) => {
    return parentCategories.map(category => {
      const subcategories = getSubcategories(category.id);
      const hasSubcategories = subcategories.length > 0;
      
      return (
        <div key={category.id} className="space-y-2">
          <Card className={`${level > 0 ? 'ml-6' : ''}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {hasSubcategories ? (
                    <FolderOpen className="w-5 h-5 text-blue-600" />
                  ) : (
                    <Folder className="w-5 h-5 text-gray-600" />
                  )}
                  <div>
                    <h3 className="font-semibold">{category.name}</h3>
                    {category.description && (
                      <p className="text-sm text-muted-foreground">{category.description}</p>
                    )}
                    <div className="flex items-center space-x-4 text-xs text-muted-foreground mt-1">
                      <span>Products: {category.productCount || 0}</span>
                      <span>Subcategories: {subcategories.length}</span>
                      <span className={`px-2 py-1 rounded ${category.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {category.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditCategory(category)}
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteCategory(category.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          {hasSubcategories && renderCategoryTree(subcategories, level + 1)}
        </div>
      );
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading categories...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Categories Management</h1>
          <p className="text-muted-foreground">
            Manage product categories and subcategories
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={handleExportExcel}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <label className="cursor-pointer">
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleImportExcel}
              className="hidden"
            />
            <Button variant="outline">
              <Upload className="w-4 h-4 mr-2" />
              Import
            </Button>
          </label>
          <Button onClick={() => setShowAddForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Category
          </Button>
        </div>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingCategory ? 'Edit Category' : 'Add New Category'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Name</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Category name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Parent Category</label>
                  <select
                    value={formData.parentId}
                    onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="">No Parent (Main Category)</option>
                    {getParentCategories().map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Category description"
                  className="w-full px-3 py-2 border rounded-md"
                  rows={3}
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="rounded"
                />
                <label htmlFor="isActive" className="text-sm font-medium">
                  Active
                </label>
              </div>
              <div className="flex space-x-2">
                <Button type="submit">
                  {editingCategory ? 'Update Category' : 'Add Category'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingCategory(null);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <Card>
        <CardContent className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Categories Tree */}
      <div className="space-y-4">
        {renderCategoryTree(getParentCategories())}
      </div>

      {categories.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Folder className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No categories found</h3>
            <p className="text-muted-foreground mb-6">
              Get started by creating your first category.
            </p>
            <Button onClick={() => setShowAddForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Category
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Folder className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium">Total Categories</p>
                <p className="text-2xl font-bold">{categories.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <FolderOpen className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm font-medium">Main Categories</p>
                <p className="text-2xl font-bold">
                  {categories.filter(cat => !cat.parentId).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Package className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-sm font-medium">Total Products</p>
                <p className="text-2xl font-bold">
                  {categories.reduce((sum, cat) => sum + (cat.productCount || 0), 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}; 