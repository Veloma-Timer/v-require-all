"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toArray = exports.isArray = exports.isPromise = void 0;
const isPromise = (value) => typeof value.then === 'function' && value.toString() === '[object Promise]';
exports.isPromise = isPromise;
const isArray = (value) => Array.isArray(value);
exports.isArray = isArray;
const toArray = (value) => exports.isArray(value) ? value : [value];
exports.toArray = toArray;
//# sourceMappingURL=utils.js.map