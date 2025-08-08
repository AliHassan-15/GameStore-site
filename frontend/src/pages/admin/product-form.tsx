import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Save, Upload } from 'lucide-react';
import { productsAPI, categoriesAPI } from '@/lib/api';
import { Product, Category } from '@/types';

const productSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().min(1, 'Description is required'),
  price: z.number().min(0, 'Price must be positive'),
  salePrice: z.number().optional(),
  costPrice: z.number().min(0, 'Cost price must be positive'),
  sku: z.string().min(1, 'SKU is required'),
  stockQuantity: z.number().min(0, 'Stock quantity must be positive'),
  lowStockThreshold: z.number().min(0, 'Low stock threshold must be positive'),
  categoryId: z.string().min(1, 'Category is required'),
  isActive: z.boolean(),
  isFeatured: z.boolean(),
  isDigital: z.boolean(),
  isPhysical: z.boolean(),
});

type ProductFormData = z.infer<typeof productSchema>;

export const AdminProductFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      isActive: true,
      isFeatured: false,
      isDigital: false,
      isPhysical: true,
    }
  });

  useEffect(() => {
    loadCategories();
    if (id) {
      setIsEditing(true);
      loadProduct();
    }
  }, [id]);

  const loadCategories = async () => {
    try {
      const response = await categoriesAPI.getCategories();
      if (response.success && response.data) {
        setCategories(response.data);
      }
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const loadProduct = async () => {
    if (!id) return;
    try {
      const response = await productsAPI.getProductById(id);
      if (response.success && response.data) {
        const product = response.data;
        setValue('name', product.name);
        setValue('description', product.description);
        setValue('price', product.price);
        setValue('salePrice', product.salePrice);
        setValue('costPrice', product.costPrice);
        setValue('sku', product.sku);
        setValue('stockQuantity', product.stockQuantity);
        setValue('lowStockThreshold', product.lowStockThreshold);
        setValue('categoryId', product.categoryId);
        setValue('isActive', product.isActive);
        setValue('isFeatured', product.isFeatured);
        setValue('isDigital', product.isDigital);
        setValue('isPhysical', product.isPhysical);
      }
    } catch (error) {
      console.error('Failed to load product:', error);
    }
  };

  const onSubmit = async (data: ProductFormData) => {
    try {
      setIsLoading(true);
      if (isEditing && id) {
        await productsAPI.updateProduct(id, data);
      } else {
        await productsAPI.createProduct(data);
      }
      navigate('/admin/products');
    } catch (error) {
      console.error('Failed to save product:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="outline" onClick={() => navigate('/admin/products')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold">
            {isEditing ? 'Edit Product' : 'Add New Product'}
          </h1>
          <p className="text-muted-foreground">
            {isEditing ? 'Update product information' : 'Create a new product'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Product Name</label>
                <Input
                  {...register('name')}
                  placeholder="Enter product name"
                />
                {errors.name && (
                  <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  {...register('description')}
                  placeholder="Enter product description"
                  className="w-full px-3 py-2 border rounded-md"
                  rows={4}
                />
                {errors.description && (
                  <p className="text-sm text-red-600 mt-1">{errors.description.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">SKU</label>
                <Input
                  {...register('sku')}
                  placeholder="Enter SKU"
                />
                {errors.sku && (
                  <p className="text-sm text-red-600 mt-1">{errors.sku.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Category</label>
                <select
                  {...register('categoryId')}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="">Select a category</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                {errors.categoryId && (
                  <p className="text-sm text-red-600 mt-1">{errors.categoryId.message}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Pricing & Inventory */}
          <Card>
            <CardHeader>
              <CardTitle>Pricing & Inventory</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Price</label>
                  <Input
                    type="number"
                    step="0.01"
                    {...register('price', { valueAsNumber: true })}
                    placeholder="0.00"
                  />
                  {errors.price && (
                    <p className="text-sm text-red-600 mt-1">{errors.price.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Sale Price</label>
                  <Input
                    type="number"
                    step="0.01"
                    {...register('salePrice', { valueAsNumber: true })}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Cost Price</label>
                <Input
                  type="number"
                  step="0.01"
                  {...register('costPrice', { valueAsNumber: true })}
                  placeholder="0.00"
                />
                {errors.costPrice && (
                  <p className="text-sm text-red-600 mt-1">{errors.costPrice.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Stock Quantity</label>
                  <Input
                    type="number"
                    {...register('stockQuantity', { valueAsNumber: true })}
                    placeholder="0"
                  />
                  {errors.stockQuantity && (
                    <p className="text-sm text-red-600 mt-1">{errors.stockQuantity.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Low Stock Threshold</label>
                  <Input
                    type="number"
                    {...register('lowStockThreshold', { valueAsNumber: true })}
                    placeholder="0"
                  />
                  {errors.lowStockThreshold && (
                    <p className="text-sm text-red-600 mt-1">{errors.lowStockThreshold.message}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Product Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Product Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isActive"
                  {...register('isActive')}
                  className="rounded"
                />
                <label htmlFor="isActive" className="text-sm font-medium">
                  Active
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isFeatured"
                  {...register('isFeatured')}
                  className="rounded"
                />
                <label htmlFor="isFeatured" className="text-sm font-medium">
                  Featured
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isDigital"
                  {...register('isDigital')}
                  className="rounded"
                />
                <label htmlFor="isDigital" className="text-sm font-medium">
                  Digital Product
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isPhysical"
                  {...register('isPhysical')}
                  className="rounded"
                />
                <label htmlFor="isPhysical" className="text-sm font-medium">
                  Physical Product
                </label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/admin/products')}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            <Save className="w-4 h-4 mr-2" />
            {isLoading ? 'Saving...' : (isEditing ? 'Update Product' : 'Create Product')}
          </Button>
        </div>
      </form>
    </div>
  );
}; 