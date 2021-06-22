# v-require-all

用一个简单的方法来导入指定的文件(因NestJs导入模块而生).

## 在NestJs中使用

`文件目录` <br />
```ts
├── assets
├── main.ts
├── modules
│   ├── app
│   │   ├── app.controller.ts
│   │   ├── app.module.ts
│   │   └── app.service.ts
│   ├── config
│   │   ├── config.controller.ts
│   │   ├── config.module.ts
│   │   └── config.service.ts
│   └── user
│       ├── user.controller.ts
│       ├── user.module.ts
│       └── user.service.ts
├── types
└── utils
    ├── requreAll.ts
    └── utils.ts
```

## 需求
将modules中所有xx.module.ts导入

## 实现
`app.module.ts`
```ts
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { requireAllInNest, Module } from "v-require-all";
import { join } from 'path';


@Module({
  imports: requireAllInNest({ dirname: join(__dirname, '..'), currentFile: __filename }, 'Module'),
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

`config.module.ts`
```ts
import { Module } from '@nestjs/common';
import { ConfigController } from './config.controller';
import { ConfigService } from './config.service';
import { defineDecorator } from "v-require-all";

@defineDecorator(['Module'])
@Module({
  imports: [],
  controllers: [ConfigController],
  providers: [ConfigService],
})
export class ConfigModule {}
```

`user.config.ts`
```ts
import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { defineDecorator } from "v-require-all";


@defineDecorator(['Module'])
@Module({
  imports: [],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
```

## 说明
这个方法其实不只能导入指定目录的module, 也能导入controller或者service, 并且app.moudule中的@Module被重写后传入的参数也可以更灵活, 该方法也可不在NestJs中使用.

## NestJs以外使用
```ts
import { requireAll } from 'v-require-all';

requireAll({ dirname: __dirname }).then(modules => {
  console.log(modules);
}).catch(error => {
  console.log(error);
});
```
执行结果
```ts
Map(3) {
  '/Users/zhangxuefei/Desktop/ra/package/a.ts' => { a: 'veloma', default: [Function: sum] },
  '/Users/zhangxuefei/Desktop/ra/package/b.ts' => { b: 'timer', default: [Function: sayHello] },
  '/Users/zhangxuefei/Desktop/ra/package/children/c.ts' => {
    name: '山竹',
    defineDecorator: [Function: defineDecorator],
    Person: [Function: Person],
    default: [Function: sayName]
  }
}
```

## 联系方式
wx: \_\_veloma\_\_ <br />
emial: 981931727@qq.com