const { DatabaseManager } = require('./database-manager.ts');
const { DatabaseType } = require('./database-types.ts');
const fs = require('fs');
const path = require('path');

/**
 * Database Migration Script
 * Sets up test databases and tables for automation testing
 */
class DatabaseMigration {
  constructor() {
    this.dbManager = new DatabaseManager();
    this.setupDatabases();
  }

  /**
   * Setup database configurations
   */
  setupDatabases() {
    // Load configuration
    const configPath = path.join(__dirname, '../../config/database-config.json');
    let config = {};
    
    if (fs.existsSync(configPath)) {
      config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }

    // Add MySQL configuration
    this.dbManager.addDatabase('mysql', {
      type: DatabaseType.MYSQL,
      config: config.databases?.mysql?.config || {
        host: process.env.MYSQL_HOST || 'localhost',
        port: parseInt(process.env.MYSQL_PORT || '3306'),
        user: process.env.MYSQL_USER || 'root',
        password: process.env.MYSQL_PASSWORD || '',
        database: process.env.MYSQL_DATABASE || 'test_automation'
      },
      setupRequired: true,
      cleanupAfterTests: true
    });

    // Add MongoDB configuration
    this.dbManager.addDatabase('mongodb', {
      type: DatabaseType.MONGODB,
      config: config.databases?.mongodb?.config || {
        host: process.env.MONGO_HOST || 'localhost',
        port: parseInt(process.env.MONGO_PORT || '27017'),
        database: process.env.MONGO_DATABASE || 'test_automation'
      },
      setupRequired: true,
      cleanupAfterTests: true
    });

    // Add PostgreSQL configuration
    this.dbManager.addDatabase('postgresql', {
      type: DatabaseType.POSTGRESQL,
      config: config.databases?.postgresql?.config || {
        host: process.env.POSTGRES_HOST || 'localhost',
        port: parseInt(process.env.POSTGRES_PORT || '5432'),
        user: process.env.POSTGRES_USER || 'postgres',
        password: process.env.POSTGRES_PASSWORD || 'postgres',
        database: process.env.POSTGRES_DATABASE || 'test_automation'
      },
      setupRequired: true,
      cleanupAfterTests: true
    });
  }

  /**
   * Run database migrations
   */
  async migrate() {
    console.log('🏗️ Starting database migration...');
    
    try {
      // Connect to all databases
      console.log('🔌 Connecting to databases...');
      await this.dbManager.connectAll();
      
      // Setup test data
      console.log('📊 Setting up test schemas and data...');
      const setupResults = await this.dbManager.setupTestData();
      
      // Report results
      console.log('\n📊 Migration Results:');
      console.log('='.repeat(50));
      
      let successCount = 0;
      for (const [dbName, result] of setupResults) {
        const status = result.success ? '✅ SUCCESS' : '❌ FAILED';
        const duration = result.duration ? `(${result.duration}ms)` : '';
        
        console.log(`${status} ${dbName.padEnd(12)} ${duration}`);
        
        if (result.success) {
          successCount++;
        } else {
          console.log(`   Error: ${result.error}`);
        }
      }
      
      console.log('='.repeat(50));
      console.log(`📈 Summary: ${successCount}/${setupResults.size} databases migrated successfully`);
      
      if (successCount === setupResults.size) {
        console.log('🎉 All database migrations completed successfully!');
      } else {
        console.warn('⚠️ Some database migrations failed. Check logs above.');
      }
      
      // Disconnect
      await this.dbManager.disconnectAll();
      
    } catch (error) {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    }
  }

  /**
   * Rollback database changes
   */
  async rollback() {
    console.log('🔄 Starting database rollback...');
    
    try {
      // Connect to all databases
      await this.dbManager.connectAll();
      
      // Cleanup test data
      console.log('🧹 Cleaning up test data...');
      const cleanupResults = await this.dbManager.cleanupTestData();
      
      // Report results
      console.log('\n📊 Rollback Results:');
      console.log('='.repeat(50));
      
      let successCount = 0;
      for (const [dbName, result] of cleanupResults) {
        const status = result.success ? '✅ SUCCESS' : '❌ FAILED';
        const duration = result.duration ? `(${result.duration}ms)` : '';
        
        console.log(`${status} ${dbName.padEnd(12)} ${duration}`);
        
        if (result.success) {
          successCount++;
        } else {
          console.log(`   Error: ${result.error}`);
        }
      }
      
      console.log('='.repeat(50));
      console.log(`📈 Summary: ${successCount}/${cleanupResults.size} databases rolled back successfully`);
      
      // Disconnect
      await this.dbManager.disconnectAll();
      
    } catch (error) {
      console.error('❌ Rollback failed:', error);
      process.exit(1);
    }
  }

  /**
   * Test database connections
   */
  async testConnections() {
    console.log('🧪 Testing database connections...');
    
    try {
      const connectionResults = await this.dbManager.testAllConnections();
      
      console.log('\n📊 Connection Test Results:');
      console.log('='.repeat(40));
      
      let successCount = 0;
      for (const [dbName, isConnected] of connectionResults) {
        const status = isConnected ? '✅ CONNECTED' : '❌ FAILED';
        console.log(`${status} ${dbName}`);
        
        if (isConnected) {
          successCount++;
        }
      }
      
      console.log('='.repeat(40));
      console.log(`📈 Summary: ${successCount}/${connectionResults.size} connections successful`);
      
      return successCount > 0;
      
    } catch (error) {
      console.error('❌ Connection test failed:', error);
      return false;
    }
  }
}

// CLI interface
if (require.main === module) {
  const migration = new DatabaseMigration();
  const command = process.argv[2];
  
  switch (command) {
    case 'migrate':
      migration.migrate();
      break;
    case 'rollback':
      migration.rollback();
      break;
    case 'test':
      migration.testConnections().then(success => {
        process.exit(success ? 0 : 1);
      });
      break;
    default:
      console.log('📚 Database Migration Tool');
      console.log('');
      console.log('Usage:');
      console.log('  node migrate.js migrate   - Run database migrations');
      console.log('  node migrate.js rollback  - Rollback database changes');
      console.log('  node migrate.js test      - Test database connections');
      console.log('');
      console.log('Environment Variables:');
      console.log('  MYSQL_HOST, MYSQL_PORT, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE');
      console.log('  MONGO_HOST, MONGO_PORT, MONGO_DATABASE');
      console.log('  POSTGRES_HOST, POSTGRES_PORT, POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DATABASE');
  }
}

module.exports = DatabaseMigration;