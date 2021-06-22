import 'reflect-metadata';
interface IOptions {
    dirname: string;
    ignore: RegExp | Function;
    filter: RegExp | Function;
    currentFile: string;
}
export declare const requireAll: (options: Partial<IOptions>) => Promise<Map<any, any>>;
export declare const requireSingle: (fullpath: string) => Promise<unknown>;
export declare const mergeMap: (targetMap: Map<any, any>, subMap: Map<any, any>) => void;
export declare const readKeys: (map: Object, callback: (key: any, value: any) => void) => any[];
export declare const requireAllInNest: (options: Partial<IOptions>, type?: 'Controller' | 'Injectable' | 'Module') => Promise<unknown>;
declare type IDepend = Promise<any> | Promise<any>[] | any[];
declare type IPrototypeClass<T = any> = new (...args: any[]) => T;
interface IMetadata {
    imports: IDepend;
    controllers: IDepend;
    providers: IDepend;
}
export declare function Module(metadata: Partial<IMetadata>): (target: IPrototypeClass) => void;
export declare function defineDecorator(metadata: string[]): (target: any) => void;
export {};
