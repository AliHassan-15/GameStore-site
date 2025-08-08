const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Category = sequelize.define('Category', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    slug: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    image: {
      type: DataTypes.STRING,
      allowNull: true
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    sortOrder: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    parentId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'categories',
        key: 'id'
      }
    },
    // For Excel import tracking
    excelRowId: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    importedAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'categories',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['slug']
      },
      {
        fields: ['parent_id']
      },
      {
        fields: ['is_active']
      }
    ]
  });

  // Associations
  Category.associate = (models) => {
    // Self-referencing association for parent-child categories
    Category.belongsTo(Category, {
      foreignKey: 'parentId',
      as: 'parent'
    });
    
    Category.hasMany(Category, {
      foreignKey: 'parentId',
      as: 'children'
    });
    
    Category.hasMany(models.Product, {
      foreignKey: 'categoryId',
      as: 'products'
    });
  };

  return Category;
}; 