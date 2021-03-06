import 'reflect-metadata';
import { join } from 'path';
import { readdirSync, statSync } from 'fs';
import { isPromise, isArray, toArray } from "./utils";

interface IOptions {
  dirname: string;
  ignore: RegExp | Function;
  filter: RegExp | Function;
  currentFile: string;
}

// 忽略以.开头的文件、文件夹、node_modules、.d.ts、.d.js文件
const DEFAULT_IGNORE_RULE = /(^\.|^node_modules|(\.d\..*)$)/;
// 只取.ts或者.js结尾的文件
const DEFULAT_FILTER = /^([^\.].*)\.(ts|js)$/;
// 当前文件路径
const DEFAULT_CURRENT_FILE = __filename;
// 导入单个文件
export const requireSingle = (fullpath: string) => {
  return new Promise((resolve, reject) => {
    import(fullpath)
      .then(data => resolve(data))
      .catch(error => reject(error));
  });
}
// 导入所有文件
export const requireAll = async (options: Partial<IOptions>) => {
  if (!options.dirname) throw new Error('dirname cannot be empty!');
  if (!options.currentFile) throw new Error('currentFile cannot be empty!');
  const dirname = options.dirname;
  const ignore = options.ignore || DEFAULT_IGNORE_RULE;
  const files = readdirSync(dirname);
  const modules: Map<any, any> = new Map();
  const filter = options.filter || DEFULAT_FILTER;
  const currentFile = options.currentFile || DEFAULT_CURRENT_FILE;

  const ignoreFile: (f: string) => boolean = (fullpath: string) => {
    if (typeof ignore === 'function') {
      return ignore(fullpath);
    } else {
      return fullpath === currentFile || !!fullpath.match(ignore as RegExp);
    }
  }

  const filterFile = (fullpath: string) => {
    if (typeof filter === 'function') {
      return filter(fullpath);
    } else {
      return filter.test(fullpath);
    }
  }
  await Promise.all(
    files.map(async filename => {
      const fullpath = join(dirname, filename);
      // 如果为true, 则为忽略文件
      if (ignoreFile(fullpath)) return;

      // 如果不为true, 则要读取
      if (statSync(fullpath).isDirectory()) {
        const subModules = await requireAll({
          dirname: fullpath,
          ignore: ignore,
          currentFile: currentFile
        });
        mergeMap(modules, subModules);
      } else {
        try {
          if (filterFile(fullpath)) {
            const data = await requireSingle(fullpath);
            modules.set(fullpath, data);
          }
        } catch (error) {
          throw error;
        }
      }

    })
  );

  return modules;
}


// 合并map
export const mergeMap = (targetMap: Map<any, any>, subMap: Map<any, any>) => {
  for (let key of subMap.keys()) {
    targetMap.set(key, subMap.get(key));
  }
}

// 读取属性
export const readKeys = (map: Object, callback: (key: any, value: any) => void) => {
  const results = [];
  if (map instanceof Map) {
    for (let key of map.keys()) {
      const returns = callback(key, map.get(key));
      if (returns !== undefined) {
        results.push(returns);
      }
    }
  } else {
    for (let key of Reflect.ownKeys(map)) {
      // @ts-ignore
      const returns = callback(key, map[key]);
      if (returns !== undefined) {
        results.push(returns);
      }
    }
  }
  if (results.length > 0) {
    return results;
  }
}

// nest中的导入
export const requireAllInNest = (options: Partial<IOptions>, type: 'Controller' | 'Injectable' | 'Module' = 'Module') => {
  return new Promise((resolve, reject) => {
    if (type === 'Controller') {
      options.filter = /^([^\.].*)\.controller\.ts$/;
    } else if (type === 'Injectable') {
      options.filter = /^([^\.].*)\.service\.ts$/;
    } else {
      options.filter = /^([^\.].*)\.module\.ts$/;
    }
    requireAll(options).then(modules => {
      try {
        const importsModule: any[] = readKeys(modules, (key, value) => {
          return readKeys(value, (vKey, target) => {
            if (typeof target === 'function') {
              const metadata = Reflect.getMetadata('decorator', target);
              if (Array.isArray(metadata) && metadata.length > 0 && metadata.indexOf(type) !== -1) {
                return target;
              }
            }
          });
        });
        const results: any[] = [];
        importsModule.forEach((chunk: any[]) => results.push(...chunk));
        resolve(results);
      } catch (error) {
        reject(error);
      }
    }).catch(error => reject(error));
  })
}

type IDepend = Promise<any> | Promise<any>[] | any[];
type IPrototypeClass<T = any> = new (...args: any[]) => T;
const metadataHandler = {
  setMetadata: (key: string, data: any, target: IPrototypeClass) => {
    const oldMetadata = Reflect.getMetadata(key, target);
    const metadata = [];
    if (isArray(oldMetadata)) {
      metadata.push(...[...oldMetadata, ...toArray(data)]);
    } else {
      metadata.push(...toArray(data));
    }
    Reflect.defineMetadata(key, metadata, target);
  },
  handler(data: any, target: IPrototypeClass, key: string) {
    const method: (k: string, v:any, t:IPrototypeClass) => void = this.setMetadata;
    const single = (value: any) => (value && isPromise(value)) ? (value as Promise<any>).then(d => method(key, d, target)) : method(key, value, target);
    isArray(data) ? (data as any[]).forEach(v => single(v)) : single(data);
  }
}
// 约束一下Module的参数
interface IMetadata {
  imports: IDepend;
  controllers: IDepend;
  providers: IDepend;
  exports: IDepend;
}

// 基本算是重写@Module
export function Module (metadata: Partial<IMetadata>) {
  return function (target: IPrototypeClass) {

    for (let key in metadata) {
      metadataHandler.handler(metadata[key], target, key);
    }

  }
}

export function defineDecorator (metadata: string[]) {
  return function (target: any) {
    Reflect.defineMetadata('decorator', metadata, target);
  }
}