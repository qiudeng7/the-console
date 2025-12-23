# Drizzle

在cloudflare vite中使用drizzle ORM访问cloudflare D1数据库，D1是一种类似sqlite的数据库。

我们需要讨论以下场景：

|场景(工具)|开发环境|生产环境|通用|
|---|---|---|---|
|wrangler|创建数据库|创建数据库||
|drizzle-kit|迁移数据库|迁移数据库|创建迁移文件|
|运行时 (drizzle-orm)|||连接和查询数据库|

## 配置

migrations 和 schema 由于是业务相关文件，不应该放在utils目录下。你可以修改 drizzle.config.ts 中的 `databaseDir` 参数来设置他们的位置。

## 创建迁移文件

创建迁移文件不需要关心开发环境还是生产环境，可以直接执行:
```bash
pnpm makemigrations
```

makemigrations脚本实际执行的命令是:
```bash
drizzle-kit generate --config server/utils/drizzle/drizzle.config.ts
```

> 注意这里创建的迁移文件似乎会有问题，下文会进行说明

## 创建数据库

## 生产环境

创建生产环境数据库就是在cloudflare的edge server上创建数据库，你可以用cloudflare的web console也可以用wrangler，我只提供wrangler的方法，官方文档参考: https://developers.cloudflare.com/d1/get-started/#2-create-a-database

```bash
pnpm wrangler d1 create [db-name] --update-config --binding [binding-name]
```

命令参考: https://developers.cloudflare.com/workers/wrangler/commands/#d1-create

说明:
1. `[db-name]` 可以随便填，主要用于人类识别，
2. `--update-config` 会更新项目中的`wrangler.json`
3. `[binding-name]` 需要符合js变量命名规范，我们后面将可以实际通过这个名称来访问数据库对象。


### 开发环境

启动vite开发环境时，cloudflare-vite会通过 workerd运行server部分的代码，从而模拟cloudflare的边缘服务器环境，我们在开发环境要用的D1数据库也由本地的workerd提供。

我们可以通过wrangler创建本地数据库，但是我们不能创建空数据库，只能使用已有的sql文件去创建数据库或者使用wrangler应用迁移，具体的讨论可以看这里 https://github.com/drizzle-team/drizzle-orm/discussions/1388

总之有很多问题，

一个更好的办法是我们可以使用一个空的sql文件去创建本地d1，然后再用drizzle应用迁移，这样就可以得到drizzle的一致的体验。

```bash
pnpm wrangler d1 execute the-console --file server/utils/drizzle/fake_migration.sql --local
```

命令参考: https://developers.cloudflare.com/workers/wrangler/commands/#d1-execute

说明:
1. 本地数据库位于`./wrangler/state/v3/d1`，实际上就是一个sqlite
2. `[db-name]` 必须在`wrangler.jsonc`中存在对应的数据库。


## 迁移数据库

迁移数据库通过 `drizzle-kit` 完成，drizzle-kit 以 `drizzle.config.ts` 为配置文件，我们需要`drizzle.config.ts`中显式地区分生产环境和开发环境的连接方式。

### 开发环境

开发环境数据库毕竟实际上就是一个sqlite，我们通过一个`getLocalD1DB`函数（摘抄自 https://github.com/supermemoryai/cloudflare-saas-stack/blob/main/drizzle.config.ts ）找到开发环境的数据库，然后以sqlite的方式连接他即可，只是要在迁移之前先创建数据库。

迁移直接执行命令
```bash
pnpm migrate
```

migrate脚本实际对应的命令是:
```bash
drizzle-kit migrate --config server/utils/drizzle/drizzle.config.ts
```

但是实际测试发现生成的迁移文件似乎逻辑上就有问题，比如我尝试给表A添加一个字段aa，生成的migrations的逻辑是：
1. 创建一个包含aa字段的new_A表
2. 把表A的数据转移到new_A
3. 删除原表A
4. 把new_A改名为A，

逻辑是没问题的但是操作有问题，表A的数据转移到new_A的时候还是会从原A表中读取aa字段导致报错，需要手动修改migrations。

### 生产环境

为了迁移到生产环境，我们需要让drizzle-kit 连接生产环境数据库，具体方式是使用cloudflare的http API，也就是drizzle的`d1-http` driver，这需要我们手动创建cloudflare token、获取cloudflare账户ID，具体方式已经在 .env.example 中备述。

> 注意这与 client 的连接方式不同，因为 drizzle-kit 在开发者的js运行时环境中运行，client由 drizzle-orm提供，在workerd中运行。

配置好 `CLOUDFLARE_ACCOUNT_ID` 和 `CLOUDFLARE_TOKEN` 之后执行

```bash
pnpm migrate:prod
```

migrate:prod脚本实际执行的命令是
```bash
NODE_ENV=production dotenv -- drizzle-kit migrate --config server/utils/drizzle/drizzle.config.ts
```

## 连接和查询数据库

对于一个最原始的简单worker项目，cloudflare会提供一个env变量，可以在env变量下查询到`bingding_name`引用，它会指向`D1Database`数据库连接对象，我们通过它访问数据库。

`drizzle-orm/d1` 可以通过该连接对象生成client，因此我在client中提供一个函数能够直接从env中获取drizzleClient，你需要设置 `D1_BINDING_NAME` 环境变量来方便他获取数据库连接对象，值为之前创建数据库时用的`binding_name`。