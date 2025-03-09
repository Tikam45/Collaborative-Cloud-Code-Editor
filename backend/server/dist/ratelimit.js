"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteFileRL = exports.createFileRL = exports.saveFileRL = void 0;
const rate_limiter_flexible_1 = require("rate-limiter-flexible");
exports.saveFileRL = new rate_limiter_flexible_1.RateLimiterMemory({
    points: 3,
    duration: 1,
});
exports.createFileRL = new rate_limiter_flexible_1.RateLimiterMemory({
    points: 3,
    duration: 1,
});
exports.deleteFileRL = new rate_limiter_flexible_1.RateLimiterMemory({
    points: 3,
    duration: 1,
});
//# sourceMappingURL=ratelimit.js.map