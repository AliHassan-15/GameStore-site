const { ActivityLog } = require('../models');

// Activity logging middleware
const logActivity = async (req, res, next) => {
  const startTime = Date.now();
  
  // Store original send method
  const originalSend = res.send;
  
  // Override send method to capture response
  res.send = function(data) {
    const executionTime = Date.now() - startTime;
    
    // Log activity asynchronously (don't block response)
    logActivityAsync(req, res, executionTime, data).catch(console.error);
    
    // Call original send method
    return originalSend.call(this, data);
  };
  
  next();
};

// Async activity logging
const logActivityAsync = async (req, res, executionTime, responseData) => {
  try {
    // Skip logging for certain endpoints
    const skipEndpoints = ['/health', '/api/health', '/favicon.ico'];
    if (skipEndpoints.includes(req.path)) {
      return;
    }

    // Determine action based on HTTP method and path
    const action = determineAction(req.method, req.path);
    
    // Determine entity type based on path
    const entityType = determineEntityType(req.path);
    
    // Extract entity ID from path or body
    const entityId = extractEntityId(req);
    
    // Create activity log entry
    const logData = {
      userId: req.user?.id || null,
      action,
      entityType,
      entityId,
      description: generateDescription(req, action),
      requestMethod: req.method,
      requestUrl: req.originalUrl,
      requestBody: sanitizeRequestBody(req.body),
      responseStatus: res.statusCode,
      executionTime,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      sessionId: req.session?.id || null,
      severity: determineSeverity(res.statusCode, action),
      tags: generateTags(req, action),
      metadata: {
        userRole: req.user?.role || 'guest',
        userAgent: req.get('User-Agent'),
        referer: req.get('Referer'),
        origin: req.get('Origin')
      }
    };

    // Only log if it's a significant action or error
    if (shouldLogActivity(logData)) {
      await ActivityLog.create(logData);
    }
  } catch (error) {
    console.error('Activity logging error:', error);
  }
};

// Determine action based on HTTP method and path
const determineAction = (method, path) => {
  const pathParts = path.split('/').filter(Boolean);
  
  if (pathParts[0] === 'api') {
    const resource = pathParts[1];
    const id = pathParts[2];
    
    switch (method) {
      case 'GET':
        return id ? `${resource}.read` : `${resource}.list`;
      case 'POST':
        return `${resource}.create`;
      case 'PUT':
      case 'PATCH':
        return `${resource}.update`;
      case 'DELETE':
        return `${resource}.delete`;
      default:
        return `${resource}.${method.toLowerCase()}`;
    }
  }
  
  return `${method.toLowerCase()}.${path.replace(/\//g, '.')}`;
};

// Determine entity type based on path
const determineEntityType = (path) => {
  const pathParts = path.split('/').filter(Boolean);
  
  if (pathParts[0] === 'api') {
    const resource = pathParts[1];
    const entityMap = {
      'auth': 'user',
      'users': 'user',
      'products': 'product',
      'categories': 'category',
      'orders': 'order',
      'cart': 'cart',
      'reviews': 'review',
      'admin': 'system',
      'payments': 'payment',
      'upload': 'system'
    };
    
    return entityMap[resource] || 'system';
  }
  
  return 'system';
};

// Extract entity ID from request
const extractEntityId = (req) => {
  // Try to get ID from URL params
  const pathParts = req.path.split('/').filter(Boolean);
  if (pathParts.length >= 3 && pathParts[0] === 'api') {
    const potentialId = pathParts[2];
    // Check if it looks like a UUID
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(potentialId)) {
      return potentialId;
    }
  }
  
  // Try to get ID from body
  if (req.body && req.body.id) {
    return req.body.id;
  }
  
  return null;
};

// Generate description for the activity
const generateDescription = (req, action) => {
  const descriptions = {
    'auth.login': 'User logged in',
    'auth.register': 'User registered',
    'auth.logout': 'User logged out',
    'auth.refresh': 'Token refreshed',
    'products.create': 'Product created',
    'products.update': 'Product updated',
    'products.delete': 'Product deleted',
    'orders.create': 'Order placed',
    'orders.update': 'Order updated',
    'orders.cancel': 'Order cancelled',
    'payments.process': 'Payment processed',
    'payments.fail': 'Payment failed',
    'cart.add': 'Item added to cart',
    'cart.remove': 'Item removed from cart',
    'reviews.create': 'Review submitted',
    'reviews.update': 'Review updated',
    'reviews.delete': 'Review deleted'
  };
  
  return descriptions[action] || `${action} action performed`;
};

// Sanitize request body for logging
const sanitizeRequestBody = (body) => {
  if (!body) return null;
  
  const sanitized = { ...body };
  
  // Remove sensitive fields
  const sensitiveFields = ['password', 'token', 'secret', 'key', 'creditCard', 'cvv'];
  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  });
  
  return sanitized;
};

// Determine severity level
const determineSeverity = (statusCode, action) => {
  if (statusCode >= 500) return 'critical';
  if (statusCode >= 400) return 'high';
  if (action.includes('delete') || action.includes('payment')) return 'medium';
  return 'low';
};

// Generate tags for filtering
const generateTags = (req, action) => {
  const tags = [];
  
  // Add HTTP method tag
  tags.push(req.method.toLowerCase());
  
  // Add resource tag
  const pathParts = req.path.split('/').filter(Boolean);
  if (pathParts[0] === 'api' && pathParts[1]) {
    tags.push(pathParts[1]);
  }
  
  // Add action type tag
  if (action.includes('create')) tags.push('create');
  if (action.includes('read')) tags.push('read');
  if (action.includes('update')) tags.push('update');
  if (action.includes('delete')) tags.push('delete');
  
  // Add user role tag
  tags.push(req.user?.role || 'guest');
  
  return tags;
};

// Determine if activity should be logged
const shouldLogActivity = (logData) => {
  // Always log errors
  if (logData.responseStatus >= 400) return true;
  
  // Always log admin actions
  if (logData.metadata.userRole === 'admin') return true;
  
  // Always log authentication actions
  if (logData.action.includes('auth.')) return true;
  
  // Always log payment actions
  if (logData.action.includes('payment')) return true;
  
  // Always log destructive actions
  if (logData.action.includes('delete')) return true;
  
  // Log high severity actions
  if (logData.severity === 'high' || logData.severity === 'critical') return true;
  
  // Log actions that take longer than 1 second
  if (logData.executionTime > 1000) return true;
  
  return false;
};

// Manual activity logging function
const logManualActivity = async (data) => {
  try {
    await ActivityLog.create({
      ...data,
      isSystemGenerated: true
    });
  } catch (error) {
    console.error('Manual activity logging error:', error);
  }
};

module.exports = {
  logActivity,
  logManualActivity
}; 