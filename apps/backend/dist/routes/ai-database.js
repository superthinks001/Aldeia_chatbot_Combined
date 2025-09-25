"use strict";
// ====================================================================
// EXPRESS API ENDPOINTS FOR CLAUDE-SUPABASE INTEGRATION
// File: src/routes/ai-database.ts
// ====================================================================
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const supabase_js_1 = require("@supabase/supabase-js");
const logger_1 = require("../utils/logger");
const router = express_1.default.Router();
// Initialize Supabase client with service role key for full access
const supabase = (0, supabase_js_1.createClient)(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, // Important: Use service role key for admin access
{
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});
// ====================================================================
// MIDDLEWARE FOR API KEY VALIDATION (OPTIONAL SECURITY)
// ====================================================================
const validateApiKey = (req, res, next) => {
    const apiKey = req.headers['x-api-key'] || req.query.api_key;
    // Optional: Add API key validation for Claude
    if (process.env.CLAUDE_API_KEY && apiKey !== process.env.CLAUDE_API_KEY) {
        return res.status(401).json({
            success: false,
            error: 'Invalid API key'
        });
    }
    next();
};
// Apply middleware to all routes
router.use(validateApiKey);
// ====================================================================
// 1. EXECUTE RAW SQL (Full Database Control)
// ====================================================================
router.post('/execute-sql', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { query } = req.body;
        if (!query) {
            return res.status(400).json({
                success: false,
                error: 'SQL query is required'
            });
        }
        logger_1.logger.info(`Executing SQL: ${query.substring(0, 100)}...`);
        // Execute using RPC function
        const { data, error } = yield supabase.rpc('exec_sql', {
            sql_query: query
        });
        if (error) {
            logger_1.logger.error('SQL execution error:', error);
            return res.status(400).json({
                success: false,
                error: error.message
            });
        }
        res.json({
            success: true,
            data: data,
            message: 'SQL executed successfully'
        });
    }
    catch (error) {
        logger_1.logger.error('Execute SQL error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
}));
// ====================================================================
// 2. QUERY TABLE WITH FILTERS
// ====================================================================
router.post('/query-table', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { table, select = '*', filters = {}, orderBy, limit, offset = 0 } = req.body;
        if (!table) {
            return res.status(400).json({
                success: false,
                error: 'Table name is required'
            });
        }
        logger_1.logger.info(`Querying table: ${table}`);
        // Use RPC function for safe querying
        const { data, error } = yield supabase.rpc('ai_query_table', {
            table_name: table,
            select_columns: select,
            where_conditions: filters,
            order_by: orderBy,
            limit_count: limit,
            offset_count: offset
        });
        if (error) {
            logger_1.logger.error('Query error:', error);
            return res.status(400).json({
                success: false,
                error: error.message
            });
        }
        res.json({
            success: true,
            data: data,
            count: Array.isArray(data) ? data.length : 0
        });
    }
    catch (error) {
        logger_1.logger.error('Query table error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
}));
// ====================================================================
// 3. INSERT DATA INTO ANY TABLE
// ====================================================================
router.post('/insert', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { table, data } = req.body;
        if (!table || !data) {
            return res.status(400).json({
                success: false,
                error: 'Table name and data are required'
            });
        }
        logger_1.logger.info(`Inserting into table: ${table}`);
        // Handle single or multiple inserts
        const insertData = Array.isArray(data) ? data : [data];
        const results = [];
        for (const item of insertData) {
            const { data: result, error } = yield supabase.rpc('ai_insert_data', {
                table_name: table,
                data_json: item
            });
            if (error) {
                logger_1.logger.error('Insert error:', error);
                return res.status(400).json({
                    success: false,
                    error: error.message
                });
            }
            results.push(result);
        }
        res.json({
            success: true,
            data: results,
            message: `Inserted ${results.length} record(s) successfully`
        });
    }
    catch (error) {
        logger_1.logger.error('Insert error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
}));
// ====================================================================
// 4. UPDATE DATA IN ANY TABLE
// ====================================================================
router.put('/update', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { table, data, filters } = req.body;
        if (!table || !data) {
            return res.status(400).json({
                success: false,
                error: 'Table name and data are required'
            });
        }
        logger_1.logger.info(`Updating table: ${table}`);
        // Build update query
        let query = supabase.from(table).update(data);
        // Apply filters
        if (filters && typeof filters === 'object') {
            Object.entries(filters).forEach(([key, value]) => {
                query = query.eq(key, value);
            });
        }
        const { data: result, error } = yield query.select();
        if (error) {
            logger_1.logger.error('Update error:', error);
            return res.status(400).json({
                success: false,
                error: error.message
            });
        }
        res.json({
            success: true,
            data: result,
            message: `Updated ${(result === null || result === void 0 ? void 0 : result.length) || 0} record(s) successfully`
        });
    }
    catch (error) {
        logger_1.logger.error('Update error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
}));
// ====================================================================
// 5. DELETE DATA FROM ANY TABLE
// ====================================================================
router.delete('/delete', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { table, filters } = req.body;
        if (!table) {
            return res.status(400).json({
                success: false,
                error: 'Table name is required'
            });
        }
        if (!filters || Object.keys(filters).length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Filters are required for delete operations (safety measure)'
            });
        }
        logger_1.logger.info(`Deleting from table: ${table}`);
        // Build delete query
        let query = supabase.from(table).delete();
        // Apply filters
        Object.entries(filters).forEach(([key, value]) => {
            query = query.eq(key, value);
        });
        const { data: result, error } = yield query.select();
        if (error) {
            logger_1.logger.error('Delete error:', error);
            return res.status(400).json({
                success: false,
                error: error.message
            });
        }
        res.json({
            success: true,
            data: result,
            message: `Deleted ${(result === null || result === void 0 ? void 0 : result.length) || 0} record(s) successfully`
        });
    }
    catch (error) {
        logger_1.logger.error('Delete error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
}));
// ====================================================================
// 6. GET TABLE SCHEMA INFORMATION
// ====================================================================
router.get('/table-info/:tableName?', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { tableName } = req.params;
        logger_1.logger.info(`Getting table info: ${tableName || 'all tables'}`);
        const { data, error } = yield supabase.rpc('ai_get_table_info', {
            table_name: tableName || null
        });
        if (error) {
            logger_1.logger.error('Table info error:', error);
            return res.status(400).json({
                success: false,
                error: error.message
            });
        }
        res.json({
            success: true,
            data: data
        });
    }
    catch (error) {
        logger_1.logger.error('Get table info error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
}));
// ====================================================================
// 7. CREATE NEW TABLE
// ====================================================================
router.post('/create-table', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { tableName, columns, indexes } = req.body;
        if (!tableName || !columns) {
            return res.status(400).json({
                success: false,
                error: 'Table name and columns are required'
            });
        }
        logger_1.logger.info(`Creating table: ${tableName}`);
        const { data, error } = yield supabase.rpc('ai_create_table', {
            table_name: tableName,
            table_definition: {
                columns: columns,
                indexes: indexes || []
            }
        });
        if (error) {
            logger_1.logger.error('Create table error:', error);
            return res.status(400).json({
                success: false,
                error: error.message
            });
        }
        res.json({
            success: true,
            data: data,
            message: `Table ${tableName} created successfully`
        });
    }
    catch (error) {
        logger_1.logger.error('Create table error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
}));
// ====================================================================
// 8. GET DATABASE ANALYTICS
// ====================================================================
router.get('/analytics', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        logger_1.logger.info('Getting database analytics');
        const { data, error } = yield supabase.rpc('ai_get_database_analytics');
        if (error) {
            logger_1.logger.error('Analytics error:', error);
            return res.status(400).json({
                success: false,
                error: error.message
            });
        }
        res.json({
            success: true,
            data: data
        });
    }
    catch (error) {
        logger_1.logger.error('Get analytics error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
}));
// ====================================================================
// 9. BATCH OPERATIONS
// ====================================================================
router.post('/batch', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { operations } = req.body;
        if (!operations || !Array.isArray(operations)) {
            return res.status(400).json({
                success: false,
                error: 'Operations array is required'
            });
        }
        logger_1.logger.info(`Executing ${operations.length} batch operations`);
        const results = [];
        for (const op of operations) {
            try {
                let result;
                switch (op.type) {
                    case 'insert':
                        result = yield supabase.rpc('ai_insert_data', {
                            table_name: op.table,
                            data_json: op.data
                        });
                        break;
                    case 'update':
                        result = yield supabase.from(op.table)
                            .update(op.data)
                            .match(op.filters)
                            .select();
                        break;
                    case 'delete':
                        result = yield supabase.from(op.table)
                            .delete()
                            .match(op.filters)
                            .select();
                        break;
                    case 'query':
                        result = yield supabase.rpc('ai_query_table', {
                            table_name: op.table,
                            select_columns: op.select || '*',
                            where_conditions: op.filters || {},
                            order_by: op.orderBy,
                            limit_count: op.limit
                        });
                        break;
                    default:
                        result = { error: `Unknown operation type: ${op.type}` };
                }
                results.push({
                    operation: op.type,
                    table: op.table,
                    success: !result.error,
                    data: result.data || result.error
                });
            }
            catch (error) {
                results.push({
                    operation: op.type,
                    table: op.table,
                    success: false,
                    error: error.message
                });
            }
        }
        res.json({
            success: true,
            results: results,
            summary: {
                total: operations.length,
                successful: results.filter(r => r.success).length,
                failed: results.filter(r => !r.success).length
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Batch operations error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
}));
// ====================================================================
// 10. HEALTH CHECK
// ====================================================================
router.get('/health', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Test database connection
        const { data, error } = yield supabase
            .from('users')
            .select('count')
            .limit(1);
        if (error) {
            throw error;
        }
        res.json({
            success: true,
            status: 'healthy',
            database: 'connected',
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        logger_1.logger.error('Health check failed:', error);
        res.status(503).json({
            success: false,
            status: 'unhealthy',
            database: 'disconnected',
            error: error.message
        });
    }
}));
exports.default = router;
// ====================================================================
// INTEGRATION IN MAIN APP (app.ts or index.ts)
// ====================================================================
/*
import aiDatabaseRoutes from './routes/ai-database';

// Add to your Express app
app.use('/api/ai-db', aiDatabaseRoutes);
*/
// ====================================================================
// ENVIRONMENT VARIABLES REQUIRED (.env)
// ====================================================================
/*
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
CLAUDE_API_KEY=optional_api_key_for_claude_authentication
*/ 
