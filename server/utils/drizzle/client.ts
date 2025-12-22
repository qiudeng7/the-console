import { drizzle } from 'drizzle-orm/libsql';
import { createClient as createLibsqlClient } from '@libsql/client';
import { devDataBaseFileConnectionURL } from './config-dev';

const libsqlClient = createLibsqlClient({ url: devDataBaseFileConnectionURL });

/**
 * drizzleClient 基本使用参考 https://orm.drizzle.team/docs/data-querying
 */
export const drizzleClient = drizzle({ client: libsqlClient });

export default drizzleClient