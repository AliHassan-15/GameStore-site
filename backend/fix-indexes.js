const fs = require('fs');
const path = require('path');

// List of model files to fix
const modelFiles = [
  'ActivityLog.js',
  'Category.js', 
  'Product.js',
  'CartItem.js',
  'Order.js',
  'OrderItem.js',
  'Review.js',
  'InventoryTransaction.js',
  'OrderStatusHistory.js',
  'ReviewVote.js',
  'ProductImage.js'
];

modelFiles.forEach(filename => {
  const filePath = path.join(__dirname, 'models', filename);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Remove all indexes arrays
    content = content.replace(/indexes:\s*\[[\s\S]*?\],/g, '');
    
    fs.writeFileSync(filePath, content);
    console.log(`✅ Fixed indexes in ${filename}`);
  }
});

console.log('✅ All model indexes removed. Server should start now.');
