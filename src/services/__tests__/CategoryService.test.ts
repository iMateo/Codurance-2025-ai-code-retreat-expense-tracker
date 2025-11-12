import { CategoryService } from '../CategoryService';

describe('CategoryService', () => {
  let categoryService: CategoryService;

  beforeEach(() => {
    categoryService = new CategoryService();
  });

  describe('Basic functionality', () => {
    it('should create default categories', () => {
      const categories = categoryService.getAllCategories();
      expect(categories.length).toBeGreaterThan(0);
      expect(categories.some(c => c.name === 'Food')).toBe(true);
    });

    it('should add new category', () => {
      const category = categoryService.addCategory('Test Category', 'Test description');
      expect(category.name).toBe('Test Category');
      expect(category.isActive).toBe(true);
    });
  });

  // 🐛 FAILING TESTS - These reveal bugs in the category system!
  describe('Category Deletion - Bug Tests', () => {
    it('should soft delete categories but keep them in getAllCategoriesIncludingInactive', () => {
      const category = categoryService.addCategory('ToDelete', 'Will be deleted');
      const deleteResult = categoryService.deleteCategory(category.id);
      
      expect(deleteResult).toBe(true);
      
      // Should not appear in active categories
      const activeCategories = categoryService.getAllCategories();
      expect(activeCategories.find(c => c.id === category.id)).toBeUndefined();
      
      // Should still appear in all categories
      const allCategories = categoryService.getAllCategoriesIncludingInactive();
      const deletedCategory = allCategories.find(c => c.id === category.id);
      expect(deletedCategory).toBeDefined();
      expect(deletedCategory?.isActive).toBe(false);
    });

    it('should prevent creating categories with same name as soft-deleted ones', () => {
      // Create and delete a category
      const category = categoryService.addCategory('DuplicateName', 'Original');
      categoryService.deleteCategory(category.id);
      
      // This should fail but currently doesn't check soft-deleted categories
      expect(() => categoryService.addCategory('DuplicateName', 'Duplicate'))
        .toThrow('Category already exists');
    });
  });

  describe('Validation - Missing Tests', () => {
    it('should reject categories with empty names', () => {
      expect(() => categoryService.addCategory('', 'Valid description'))
        .toThrow('Category name cannot be empty');
    });

    it('should reject categories with whitespace-only names', () => {
      expect(() => categoryService.addCategory('   ', 'Valid description'))
        .toThrow('Category name cannot be empty');
    });

    it('should reject negative budget values', () => {
      expect(() => categoryService.addCategory('ValidName', 'Description', '#FF0000', -100))
        .toThrow('Budget cannot be negative');
    });

    it('should validate color format', () => {
      expect(() => categoryService.addCategory('ValidName', 'Description', 'invalid-color'))
        .toThrow('Invalid color format');
    });
  });
});