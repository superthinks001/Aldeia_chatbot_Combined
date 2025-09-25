"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const isDebugEnabled = process.env.DEBUG === 'true' || process.env.NODE_ENV === 'development';
exports.logger = {
    info: (...messages) => console.log('[INFO]', ...messages),
    warn: (...messages) => console.warn('[WARN]', ...messages),
    error: (...messages) => console.error('[ERROR]', ...messages),
    debug: (...messages) => {
        if (isDebugEnabled)
            console.debug('[DEBUG]', ...messages);
    }
};
exports.default = exports.logger;
