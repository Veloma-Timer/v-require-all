"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defineDecorator = exports.Module = exports.requireAllInNest = exports.readKeys = exports.mergeMap = exports.requireAll = exports.requireSingle = void 0;
require("reflect-metadata");
const path_1 = require("path");
const fs_1 = require("fs");
const utils_1 = require("./utils");
const DEFAULT_IGNORE_RULE = /(^\.|^node_modules|(\.d\..*)$)/;
const DEFULAT_FILTER = /^([^\.].*)\.(ts|js)$/;
const DEFAULT_CURRENT_FILE = __filename;
const requireSingle = (fullpath) => {
    return new Promise((resolve, reject) => {
        Promise.resolve().then(() => require(fullpath)).then(data => resolve(data))
            .catch(error => reject(error));
    });
};
exports.requireSingle = requireSingle;
const requireAll = async (options) => {
    if (!options.dirname)
        throw new Error('dirname cannot be empty!');
    if (!options.currentFile)
        throw new Error('currentFile cannot be empty!');
    const dirname = options.dirname;
    const ignore = options.ignore || DEFAULT_IGNORE_RULE;
    const files = fs_1.readdirSync(dirname);
    const modules = new Map();
    const filter = options.filter || DEFULAT_FILTER;
    const currentFile = options.currentFile || DEFAULT_CURRENT_FILE;
    const ignoreFile = (fullpath) => {
        if (typeof ignore === 'function') {
            return ignore(fullpath);
        }
        else {
            return fullpath === currentFile || !!fullpath.match(ignore);
        }
    };
    const filterFile = (fullpath) => {
        if (typeof filter === 'function') {
            return filter(fullpath);
        }
        else {
            return filter.test(fullpath);
        }
    };
    await Promise.all(files.map(async (filename) => {
        const fullpath = path_1.join(dirname, filename);
        if (ignoreFile(fullpath))
            return;
        if (fs_1.statSync(fullpath).isDirectory()) {
            const subModules = await exports.requireAll({
                dirname: fullpath,
                ignore: ignore,
                currentFile: currentFile
            });
            exports.mergeMap(modules, subModules);
        }
        else {
            try {
                if (filterFile(fullpath)) {
                    const data = await exports.requireSingle(fullpath);
                    modules.set(fullpath, data);
                }
            }
            catch (error) {
                throw error;
            }
        }
    }));
    return modules;
};
exports.requireAll = requireAll;
const mergeMap = (targetMap, subMap) => {
    for (let key of subMap.keys()) {
        targetMap.set(key, subMap.get(key));
    }
};
exports.mergeMap = mergeMap;
const readKeys = (map, callback) => {
    const results = [];
    if (map instanceof Map) {
        for (let key of map.keys()) {
            const returns = callback(key, map.get(key));
            if (returns !== undefined) {
                results.push(returns);
            }
        }
    }
    else {
        for (let key of Reflect.ownKeys(map)) {
            const returns = callback(key, map[key]);
            if (returns !== undefined) {
                results.push(returns);
            }
        }
    }
    if (results.length > 0) {
        return results;
    }
};
exports.readKeys = readKeys;
const requireAllInNest = (options, type = 'Module') => {
    return new Promise((resolve, reject) => {
        if (type === 'Controller') {
            options.filter = /^([^\.].*)\.controller\.ts$/;
        }
        else if (type === 'Injectable') {
            options.filter = /^([^\.].*)\.service\.ts$/;
        }
        else {
            options.filter = /^([^\.].*)\.module\.ts$/;
        }
        exports.requireAll(options).then(modules => {
            try {
                const importsModule = exports.readKeys(modules, (key, value) => {
                    return exports.readKeys(value, (vKey, target) => {
                        if (typeof target === 'function') {
                            const metadata = Reflect.getMetadata('decorator', target);
                            if (Array.isArray(metadata) && metadata.length > 0 && metadata.indexOf(type) !== -1) {
                                return target;
                            }
                        }
                    });
                });
                const results = [];
                importsModule.forEach((chunk) => results.push(...chunk));
                resolve(results);
            }
            catch (error) {
                reject(error);
            }
        }).catch(error => reject(error));
    });
};
exports.requireAllInNest = requireAllInNest;
const metadataHandler = {
    setMetadata: (key, data, target) => Reflect.defineMetadata(key, utils_1.toArray(data), target),
    handler(data, target, key) {
        const method = this.setMetadata;
        const single = (value) => (value && utils_1.isPromise(value)) ? value.then(d => method(key, d, target)) : method(key, value, target);
        utils_1.isArray(data) ? data.forEach(v => single(v)) : single(data);
    }
};
function Module(metadata) {
    return function (target) {
        for (let key in metadata) {
            metadataHandler.handler(metadata[key], target, key);
        }
    };
}
exports.Module = Module;
function defineDecorator(metadata) {
    return function (target) {
        Reflect.defineMetadata('decorator', metadata, target);
    };
}
exports.defineDecorator = defineDecorator;
//# sourceMappingURL=index.js.map