
/**
 * Client
**/

import * as runtime from './runtime/library.js';
import $Types = runtime.Types // general types
import $Public = runtime.Types.Public
import $Utils = runtime.Types.Utils
import $Extensions = runtime.Types.Extensions
import $Result = runtime.Types.Result

export type PrismaPromise<T> = $Public.PrismaPromise<T>


/**
 * Model Contact
 * 
 */
export type Contact = $Result.DefaultSelection<Prisma.$ContactPayload>
/**
 * Model Conversation
 * 
 */
export type Conversation = $Result.DefaultSelection<Prisma.$ConversationPayload>
/**
 * Model Message
 * 
 */
export type Message = $Result.DefaultSelection<Prisma.$MessagePayload>
/**
 * Model History
 * 
 */
export type History = $Result.DefaultSelection<Prisma.$HistoryPayload>
/**
 * Model Task
 * 
 */
export type Task = $Result.DefaultSelection<Prisma.$TaskPayload>
/**
 * Model TaskSourceMessage
 * 
 */
export type TaskSourceMessage = $Result.DefaultSelection<Prisma.$TaskSourceMessagePayload>
/**
 * Model Query
 * 
 */
export type Query = $Result.DefaultSelection<Prisma.$QueryPayload>
/**
 * Model QuerySourceMessage
 * 
 */
export type QuerySourceMessage = $Result.DefaultSelection<Prisma.$QuerySourceMessagePayload>
/**
 * Model Call
 * 
 */
export type Call = $Result.DefaultSelection<Prisma.$CallPayload>
/**
 * Model Email
 * 
 */
export type Email = $Result.DefaultSelection<Prisma.$EmailPayload>
/**
 * Model ContactKnowledge
 * 
 */
export type ContactKnowledge = $Result.DefaultSelection<Prisma.$ContactKnowledgePayload>
/**
 * Model KnowledgeSourceMessage
 * 
 */
export type KnowledgeSourceMessage = $Result.DefaultSelection<Prisma.$KnowledgeSourceMessagePayload>

/**
 * ##  Prisma Client ʲˢ
 *
 * Type-safe database client for TypeScript & Node.js
 * @example
 * ```
 * const prisma = new PrismaClient()
 * // Fetch zero or more Contacts
 * const contacts = await prisma.contact.findMany()
 * ```
 *
 *
 * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
 */
export class PrismaClient<
  ClientOptions extends Prisma.PrismaClientOptions = Prisma.PrismaClientOptions,
  const U = 'log' extends keyof ClientOptions ? ClientOptions['log'] extends Array<Prisma.LogLevel | Prisma.LogDefinition> ? Prisma.GetEvents<ClientOptions['log']> : never : never,
  ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs
> {
  [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['other'] }

    /**
   * ##  Prisma Client ʲˢ
   *
   * Type-safe database client for TypeScript & Node.js
   * @example
   * ```
   * const prisma = new PrismaClient()
   * // Fetch zero or more Contacts
   * const contacts = await prisma.contact.findMany()
   * ```
   *
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
   */

  constructor(optionsArg ?: Prisma.Subset<ClientOptions, Prisma.PrismaClientOptions>);
  $on<V extends U>(eventType: V, callback: (event: V extends 'query' ? Prisma.QueryEvent : Prisma.LogEvent) => void): PrismaClient;

  /**
   * Connect with the database
   */
  $connect(): $Utils.JsPromise<void>;

  /**
   * Disconnect from the database
   */
  $disconnect(): $Utils.JsPromise<void>;

/**
   * Executes a prepared raw query and returns the number of affected rows.
   * @example
   * ```
   * const result = await prisma.$executeRaw`UPDATE User SET cool = ${true} WHERE email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Executes a raw query and returns the number of affected rows.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$executeRawUnsafe('UPDATE User SET cool = $1 WHERE email = $2 ;', true, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Performs a prepared raw query and returns the `SELECT` data.
   * @example
   * ```
   * const result = await prisma.$queryRaw`SELECT * FROM User WHERE id = ${1} OR email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<T>;

  /**
   * Performs a raw query and returns the `SELECT` data.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$queryRawUnsafe('SELECT * FROM User WHERE id = $1 OR email = $2;', 1, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<T>;


  /**
   * Allows the running of a sequence of read/write operations that are guaranteed to either succeed or fail as a whole.
   * @example
   * ```
   * const [george, bob, alice] = await prisma.$transaction([
   *   prisma.user.create({ data: { name: 'George' } }),
   *   prisma.user.create({ data: { name: 'Bob' } }),
   *   prisma.user.create({ data: { name: 'Alice' } }),
   * ])
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/concepts/components/prisma-client/transactions).
   */
  $transaction<P extends Prisma.PrismaPromise<any>[]>(arg: [...P], options?: { isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<runtime.Types.Utils.UnwrapTuple<P>>

  $transaction<R>(fn: (prisma: Omit<PrismaClient, runtime.ITXClientDenyList>) => $Utils.JsPromise<R>, options?: { maxWait?: number, timeout?: number, isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<R>


  $extends: $Extensions.ExtendsHook<"extends", Prisma.TypeMapCb<ClientOptions>, ExtArgs, $Utils.Call<Prisma.TypeMapCb<ClientOptions>, {
    extArgs: ExtArgs
  }>>

      /**
   * `prisma.contact`: Exposes CRUD operations for the **Contact** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Contacts
    * const contacts = await prisma.contact.findMany()
    * ```
    */
  get contact(): Prisma.ContactDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.conversation`: Exposes CRUD operations for the **Conversation** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Conversations
    * const conversations = await prisma.conversation.findMany()
    * ```
    */
  get conversation(): Prisma.ConversationDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.message`: Exposes CRUD operations for the **Message** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Messages
    * const messages = await prisma.message.findMany()
    * ```
    */
  get message(): Prisma.MessageDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.history`: Exposes CRUD operations for the **History** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Histories
    * const histories = await prisma.history.findMany()
    * ```
    */
  get history(): Prisma.HistoryDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.task`: Exposes CRUD operations for the **Task** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Tasks
    * const tasks = await prisma.task.findMany()
    * ```
    */
  get task(): Prisma.TaskDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.taskSourceMessage`: Exposes CRUD operations for the **TaskSourceMessage** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more TaskSourceMessages
    * const taskSourceMessages = await prisma.taskSourceMessage.findMany()
    * ```
    */
  get taskSourceMessage(): Prisma.TaskSourceMessageDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.query`: Exposes CRUD operations for the **Query** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Queries
    * const queries = await prisma.query.findMany()
    * ```
    */
  get query(): Prisma.QueryDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.querySourceMessage`: Exposes CRUD operations for the **QuerySourceMessage** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more QuerySourceMessages
    * const querySourceMessages = await prisma.querySourceMessage.findMany()
    * ```
    */
  get querySourceMessage(): Prisma.QuerySourceMessageDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.call`: Exposes CRUD operations for the **Call** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Calls
    * const calls = await prisma.call.findMany()
    * ```
    */
  get call(): Prisma.CallDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.email`: Exposes CRUD operations for the **Email** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Emails
    * const emails = await prisma.email.findMany()
    * ```
    */
  get email(): Prisma.EmailDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.contactKnowledge`: Exposes CRUD operations for the **ContactKnowledge** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more ContactKnowledges
    * const contactKnowledges = await prisma.contactKnowledge.findMany()
    * ```
    */
  get contactKnowledge(): Prisma.ContactKnowledgeDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.knowledgeSourceMessage`: Exposes CRUD operations for the **KnowledgeSourceMessage** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more KnowledgeSourceMessages
    * const knowledgeSourceMessages = await prisma.knowledgeSourceMessage.findMany()
    * ```
    */
  get knowledgeSourceMessage(): Prisma.KnowledgeSourceMessageDelegate<ExtArgs, ClientOptions>;
}

export namespace Prisma {
  export import DMMF = runtime.DMMF

  export type PrismaPromise<T> = $Public.PrismaPromise<T>

  /**
   * Validator
   */
  export import validator = runtime.Public.validator

  /**
   * Prisma Errors
   */
  export import PrismaClientKnownRequestError = runtime.PrismaClientKnownRequestError
  export import PrismaClientUnknownRequestError = runtime.PrismaClientUnknownRequestError
  export import PrismaClientRustPanicError = runtime.PrismaClientRustPanicError
  export import PrismaClientInitializationError = runtime.PrismaClientInitializationError
  export import PrismaClientValidationError = runtime.PrismaClientValidationError

  /**
   * Re-export of sql-template-tag
   */
  export import sql = runtime.sqltag
  export import empty = runtime.empty
  export import join = runtime.join
  export import raw = runtime.raw
  export import Sql = runtime.Sql



  /**
   * Decimal.js
   */
  export import Decimal = runtime.Decimal

  export type DecimalJsLike = runtime.DecimalJsLike

  /**
   * Metrics
   */
  export type Metrics = runtime.Metrics
  export type Metric<T> = runtime.Metric<T>
  export type MetricHistogram = runtime.MetricHistogram
  export type MetricHistogramBucket = runtime.MetricHistogramBucket

  /**
  * Extensions
  */
  export import Extension = $Extensions.UserArgs
  export import getExtensionContext = runtime.Extensions.getExtensionContext
  export import Args = $Public.Args
  export import Payload = $Public.Payload
  export import Result = $Public.Result
  export import Exact = $Public.Exact

  /**
   * Prisma Client JS version: 6.19.3
   * Query Engine version: c2990dca591cba766e3b7ef5d9e8a84796e47ab7
   */
  export type PrismaVersion = {
    client: string
  }

  export const prismaVersion: PrismaVersion

  /**
   * Utility Types
   */


  export import Bytes = runtime.Bytes
  export import JsonObject = runtime.JsonObject
  export import JsonArray = runtime.JsonArray
  export import JsonValue = runtime.JsonValue
  export import InputJsonObject = runtime.InputJsonObject
  export import InputJsonArray = runtime.InputJsonArray
  export import InputJsonValue = runtime.InputJsonValue

  /**
   * Types of the values used to represent different kinds of `null` values when working with JSON fields.
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  namespace NullTypes {
    /**
    * Type of `Prisma.DbNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.DbNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class DbNull {
      private DbNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.JsonNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.JsonNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class JsonNull {
      private JsonNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.AnyNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.AnyNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class AnyNull {
      private AnyNull: never
      private constructor()
    }
  }

  /**
   * Helper for filtering JSON entries that have `null` on the database (empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const DbNull: NullTypes.DbNull

  /**
   * Helper for filtering JSON entries that have JSON `null` values (not empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const JsonNull: NullTypes.JsonNull

  /**
   * Helper for filtering JSON entries that are `Prisma.DbNull` or `Prisma.JsonNull`
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const AnyNull: NullTypes.AnyNull

  type SelectAndInclude = {
    select: any
    include: any
  }

  type SelectAndOmit = {
    select: any
    omit: any
  }

  /**
   * Get the type of the value, that the Promise holds.
   */
  export type PromiseType<T extends PromiseLike<any>> = T extends PromiseLike<infer U> ? U : T;

  /**
   * Get the return type of a function which returns a Promise.
   */
  export type PromiseReturnType<T extends (...args: any) => $Utils.JsPromise<any>> = PromiseType<ReturnType<T>>

  /**
   * From T, pick a set of properties whose keys are in the union K
   */
  type Prisma__Pick<T, K extends keyof T> = {
      [P in K]: T[P];
  };


  export type Enumerable<T> = T | Array<T>;

  export type RequiredKeys<T> = {
    [K in keyof T]-?: {} extends Prisma__Pick<T, K> ? never : K
  }[keyof T]

  export type TruthyKeys<T> = keyof {
    [K in keyof T as T[K] extends false | undefined | null ? never : K]: K
  }

  export type TrueKeys<T> = TruthyKeys<Prisma__Pick<T, RequiredKeys<T>>>

  /**
   * Subset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection
   */
  export type Subset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
  };

  /**
   * SelectSubset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection.
   * Additionally, it validates, if both select and include are present. If the case, it errors.
   */
  export type SelectSubset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    (T extends SelectAndInclude
      ? 'Please either choose `select` or `include`.'
      : T extends SelectAndOmit
        ? 'Please either choose `select` or `omit`.'
        : {})

  /**
   * Subset + Intersection
   * @desc From `T` pick properties that exist in `U` and intersect `K`
   */
  export type SubsetIntersection<T, U, K> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    K

  type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };

  /**
   * XOR is needed to have a real mutually exclusive union type
   * https://stackoverflow.com/questions/42123407/does-typescript-support-mutually-exclusive-types
   */
  type XOR<T, U> =
    T extends object ?
    U extends object ?
      (Without<T, U> & U) | (Without<U, T> & T)
    : U : T


  /**
   * Is T a Record?
   */
  type IsObject<T extends any> = T extends Array<any>
  ? False
  : T extends Date
  ? False
  : T extends Uint8Array
  ? False
  : T extends BigInt
  ? False
  : T extends object
  ? True
  : False


  /**
   * If it's T[], return T
   */
  export type UnEnumerate<T extends unknown> = T extends Array<infer U> ? U : T

  /**
   * From ts-toolbelt
   */

  type __Either<O extends object, K extends Key> = Omit<O, K> &
    {
      // Merge all but K
      [P in K]: Prisma__Pick<O, P & keyof O> // With K possibilities
    }[K]

  type EitherStrict<O extends object, K extends Key> = Strict<__Either<O, K>>

  type EitherLoose<O extends object, K extends Key> = ComputeRaw<__Either<O, K>>

  type _Either<
    O extends object,
    K extends Key,
    strict extends Boolean
  > = {
    1: EitherStrict<O, K>
    0: EitherLoose<O, K>
  }[strict]

  type Either<
    O extends object,
    K extends Key,
    strict extends Boolean = 1
  > = O extends unknown ? _Either<O, K, strict> : never

  export type Union = any

  type PatchUndefined<O extends object, O1 extends object> = {
    [K in keyof O]: O[K] extends undefined ? At<O1, K> : O[K]
  } & {}

  /** Helper Types for "Merge" **/
  export type IntersectOf<U extends Union> = (
    U extends unknown ? (k: U) => void : never
  ) extends (k: infer I) => void
    ? I
    : never

  export type Overwrite<O extends object, O1 extends object> = {
      [K in keyof O]: K extends keyof O1 ? O1[K] : O[K];
  } & {};

  type _Merge<U extends object> = IntersectOf<Overwrite<U, {
      [K in keyof U]-?: At<U, K>;
  }>>;

  type Key = string | number | symbol;
  type AtBasic<O extends object, K extends Key> = K extends keyof O ? O[K] : never;
  type AtStrict<O extends object, K extends Key> = O[K & keyof O];
  type AtLoose<O extends object, K extends Key> = O extends unknown ? AtStrict<O, K> : never;
  export type At<O extends object, K extends Key, strict extends Boolean = 1> = {
      1: AtStrict<O, K>;
      0: AtLoose<O, K>;
  }[strict];

  export type ComputeRaw<A extends any> = A extends Function ? A : {
    [K in keyof A]: A[K];
  } & {};

  export type OptionalFlat<O> = {
    [K in keyof O]?: O[K];
  } & {};

  type _Record<K extends keyof any, T> = {
    [P in K]: T;
  };

  // cause typescript not to expand types and preserve names
  type NoExpand<T> = T extends unknown ? T : never;

  // this type assumes the passed object is entirely optional
  type AtLeast<O extends object, K extends string> = NoExpand<
    O extends unknown
    ? | (K extends keyof O ? { [P in K]: O[P] } & O : O)
      | {[P in keyof O as P extends K ? P : never]-?: O[P]} & O
    : never>;

  type _Strict<U, _U = U> = U extends unknown ? U & OptionalFlat<_Record<Exclude<Keys<_U>, keyof U>, never>> : never;

  export type Strict<U extends object> = ComputeRaw<_Strict<U>>;
  /** End Helper Types for "Merge" **/

  export type Merge<U extends object> = ComputeRaw<_Merge<Strict<U>>>;

  /**
  A [[Boolean]]
  */
  export type Boolean = True | False

  // /**
  // 1
  // */
  export type True = 1

  /**
  0
  */
  export type False = 0

  export type Not<B extends Boolean> = {
    0: 1
    1: 0
  }[B]

  export type Extends<A1 extends any, A2 extends any> = [A1] extends [never]
    ? 0 // anything `never` is false
    : A1 extends A2
    ? 1
    : 0

  export type Has<U extends Union, U1 extends Union> = Not<
    Extends<Exclude<U1, U>, U1>
  >

  export type Or<B1 extends Boolean, B2 extends Boolean> = {
    0: {
      0: 0
      1: 1
    }
    1: {
      0: 1
      1: 1
    }
  }[B1][B2]

  export type Keys<U extends Union> = U extends unknown ? keyof U : never

  type Cast<A, B> = A extends B ? A : B;

  export const type: unique symbol;



  /**
   * Used by group by
   */

  export type GetScalarType<T, O> = O extends object ? {
    [P in keyof T]: P extends keyof O
      ? O[P]
      : never
  } : never

  type FieldPaths<
    T,
    U = Omit<T, '_avg' | '_sum' | '_count' | '_min' | '_max'>
  > = IsObject<T> extends True ? U : T

  type GetHavingFields<T> = {
    [K in keyof T]: Or<
      Or<Extends<'OR', K>, Extends<'AND', K>>,
      Extends<'NOT', K>
    > extends True
      ? // infer is only needed to not hit TS limit
        // based on the brilliant idea of Pierre-Antoine Mills
        // https://github.com/microsoft/TypeScript/issues/30188#issuecomment-478938437
        T[K] extends infer TK
        ? GetHavingFields<UnEnumerate<TK> extends object ? Merge<UnEnumerate<TK>> : never>
        : never
      : {} extends FieldPaths<T[K]>
      ? never
      : K
  }[keyof T]

  /**
   * Convert tuple to union
   */
  type _TupleToUnion<T> = T extends (infer E)[] ? E : never
  type TupleToUnion<K extends readonly any[]> = _TupleToUnion<K>
  type MaybeTupleToUnion<T> = T extends any[] ? TupleToUnion<T> : T

  /**
   * Like `Pick`, but additionally can also accept an array of keys
   */
  type PickEnumerable<T, K extends Enumerable<keyof T> | keyof T> = Prisma__Pick<T, MaybeTupleToUnion<K>>

  /**
   * Exclude all keys with underscores
   */
  type ExcludeUnderscoreKeys<T extends string> = T extends `_${string}` ? never : T


  export type FieldRef<Model, FieldType> = runtime.FieldRef<Model, FieldType>

  type FieldRefInputType<Model, FieldType> = Model extends never ? never : FieldRef<Model, FieldType>


  export const ModelName: {
    Contact: 'Contact',
    Conversation: 'Conversation',
    Message: 'Message',
    History: 'History',
    Task: 'Task',
    TaskSourceMessage: 'TaskSourceMessage',
    Query: 'Query',
    QuerySourceMessage: 'QuerySourceMessage',
    Call: 'Call',
    Email: 'Email',
    ContactKnowledge: 'ContactKnowledge',
    KnowledgeSourceMessage: 'KnowledgeSourceMessage'
  };

  export type ModelName = (typeof ModelName)[keyof typeof ModelName]


  export type Datasources = {
    db?: Datasource
  }

  interface TypeMapCb<ClientOptions = {}> extends $Utils.Fn<{extArgs: $Extensions.InternalArgs }, $Utils.Record<string, any>> {
    returns: Prisma.TypeMap<this['params']['extArgs'], ClientOptions extends { omit: infer OmitOptions } ? OmitOptions : {}>
  }

  export type TypeMap<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> = {
    globalOmitOptions: {
      omit: GlobalOmitOptions
    }
    meta: {
      modelProps: "contact" | "conversation" | "message" | "history" | "task" | "taskSourceMessage" | "query" | "querySourceMessage" | "call" | "email" | "contactKnowledge" | "knowledgeSourceMessage"
      txIsolationLevel: Prisma.TransactionIsolationLevel
    }
    model: {
      Contact: {
        payload: Prisma.$ContactPayload<ExtArgs>
        fields: Prisma.ContactFieldRefs
        operations: {
          findUnique: {
            args: Prisma.ContactFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ContactPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.ContactFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ContactPayload>
          }
          findFirst: {
            args: Prisma.ContactFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ContactPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.ContactFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ContactPayload>
          }
          findMany: {
            args: Prisma.ContactFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ContactPayload>[]
          }
          create: {
            args: Prisma.ContactCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ContactPayload>
          }
          createMany: {
            args: Prisma.ContactCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.ContactCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ContactPayload>[]
          }
          delete: {
            args: Prisma.ContactDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ContactPayload>
          }
          update: {
            args: Prisma.ContactUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ContactPayload>
          }
          deleteMany: {
            args: Prisma.ContactDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.ContactUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.ContactUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ContactPayload>[]
          }
          upsert: {
            args: Prisma.ContactUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ContactPayload>
          }
          aggregate: {
            args: Prisma.ContactAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateContact>
          }
          groupBy: {
            args: Prisma.ContactGroupByArgs<ExtArgs>
            result: $Utils.Optional<ContactGroupByOutputType>[]
          }
          count: {
            args: Prisma.ContactCountArgs<ExtArgs>
            result: $Utils.Optional<ContactCountAggregateOutputType> | number
          }
        }
      }
      Conversation: {
        payload: Prisma.$ConversationPayload<ExtArgs>
        fields: Prisma.ConversationFieldRefs
        operations: {
          findUnique: {
            args: Prisma.ConversationFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ConversationPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.ConversationFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ConversationPayload>
          }
          findFirst: {
            args: Prisma.ConversationFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ConversationPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.ConversationFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ConversationPayload>
          }
          findMany: {
            args: Prisma.ConversationFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ConversationPayload>[]
          }
          create: {
            args: Prisma.ConversationCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ConversationPayload>
          }
          createMany: {
            args: Prisma.ConversationCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.ConversationCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ConversationPayload>[]
          }
          delete: {
            args: Prisma.ConversationDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ConversationPayload>
          }
          update: {
            args: Prisma.ConversationUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ConversationPayload>
          }
          deleteMany: {
            args: Prisma.ConversationDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.ConversationUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.ConversationUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ConversationPayload>[]
          }
          upsert: {
            args: Prisma.ConversationUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ConversationPayload>
          }
          aggregate: {
            args: Prisma.ConversationAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateConversation>
          }
          groupBy: {
            args: Prisma.ConversationGroupByArgs<ExtArgs>
            result: $Utils.Optional<ConversationGroupByOutputType>[]
          }
          count: {
            args: Prisma.ConversationCountArgs<ExtArgs>
            result: $Utils.Optional<ConversationCountAggregateOutputType> | number
          }
        }
      }
      Message: {
        payload: Prisma.$MessagePayload<ExtArgs>
        fields: Prisma.MessageFieldRefs
        operations: {
          findUnique: {
            args: Prisma.MessageFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MessagePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.MessageFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MessagePayload>
          }
          findFirst: {
            args: Prisma.MessageFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MessagePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.MessageFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MessagePayload>
          }
          findMany: {
            args: Prisma.MessageFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MessagePayload>[]
          }
          create: {
            args: Prisma.MessageCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MessagePayload>
          }
          createMany: {
            args: Prisma.MessageCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.MessageCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MessagePayload>[]
          }
          delete: {
            args: Prisma.MessageDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MessagePayload>
          }
          update: {
            args: Prisma.MessageUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MessagePayload>
          }
          deleteMany: {
            args: Prisma.MessageDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.MessageUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.MessageUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MessagePayload>[]
          }
          upsert: {
            args: Prisma.MessageUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MessagePayload>
          }
          aggregate: {
            args: Prisma.MessageAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateMessage>
          }
          groupBy: {
            args: Prisma.MessageGroupByArgs<ExtArgs>
            result: $Utils.Optional<MessageGroupByOutputType>[]
          }
          count: {
            args: Prisma.MessageCountArgs<ExtArgs>
            result: $Utils.Optional<MessageCountAggregateOutputType> | number
          }
        }
      }
      History: {
        payload: Prisma.$HistoryPayload<ExtArgs>
        fields: Prisma.HistoryFieldRefs
        operations: {
          findUnique: {
            args: Prisma.HistoryFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$HistoryPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.HistoryFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$HistoryPayload>
          }
          findFirst: {
            args: Prisma.HistoryFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$HistoryPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.HistoryFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$HistoryPayload>
          }
          findMany: {
            args: Prisma.HistoryFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$HistoryPayload>[]
          }
          create: {
            args: Prisma.HistoryCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$HistoryPayload>
          }
          createMany: {
            args: Prisma.HistoryCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.HistoryCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$HistoryPayload>[]
          }
          delete: {
            args: Prisma.HistoryDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$HistoryPayload>
          }
          update: {
            args: Prisma.HistoryUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$HistoryPayload>
          }
          deleteMany: {
            args: Prisma.HistoryDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.HistoryUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.HistoryUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$HistoryPayload>[]
          }
          upsert: {
            args: Prisma.HistoryUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$HistoryPayload>
          }
          aggregate: {
            args: Prisma.HistoryAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateHistory>
          }
          groupBy: {
            args: Prisma.HistoryGroupByArgs<ExtArgs>
            result: $Utils.Optional<HistoryGroupByOutputType>[]
          }
          count: {
            args: Prisma.HistoryCountArgs<ExtArgs>
            result: $Utils.Optional<HistoryCountAggregateOutputType> | number
          }
        }
      }
      Task: {
        payload: Prisma.$TaskPayload<ExtArgs>
        fields: Prisma.TaskFieldRefs
        operations: {
          findUnique: {
            args: Prisma.TaskFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TaskPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.TaskFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TaskPayload>
          }
          findFirst: {
            args: Prisma.TaskFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TaskPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.TaskFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TaskPayload>
          }
          findMany: {
            args: Prisma.TaskFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TaskPayload>[]
          }
          create: {
            args: Prisma.TaskCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TaskPayload>
          }
          createMany: {
            args: Prisma.TaskCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.TaskCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TaskPayload>[]
          }
          delete: {
            args: Prisma.TaskDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TaskPayload>
          }
          update: {
            args: Prisma.TaskUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TaskPayload>
          }
          deleteMany: {
            args: Prisma.TaskDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.TaskUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.TaskUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TaskPayload>[]
          }
          upsert: {
            args: Prisma.TaskUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TaskPayload>
          }
          aggregate: {
            args: Prisma.TaskAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateTask>
          }
          groupBy: {
            args: Prisma.TaskGroupByArgs<ExtArgs>
            result: $Utils.Optional<TaskGroupByOutputType>[]
          }
          count: {
            args: Prisma.TaskCountArgs<ExtArgs>
            result: $Utils.Optional<TaskCountAggregateOutputType> | number
          }
        }
      }
      TaskSourceMessage: {
        payload: Prisma.$TaskSourceMessagePayload<ExtArgs>
        fields: Prisma.TaskSourceMessageFieldRefs
        operations: {
          findUnique: {
            args: Prisma.TaskSourceMessageFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TaskSourceMessagePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.TaskSourceMessageFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TaskSourceMessagePayload>
          }
          findFirst: {
            args: Prisma.TaskSourceMessageFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TaskSourceMessagePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.TaskSourceMessageFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TaskSourceMessagePayload>
          }
          findMany: {
            args: Prisma.TaskSourceMessageFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TaskSourceMessagePayload>[]
          }
          create: {
            args: Prisma.TaskSourceMessageCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TaskSourceMessagePayload>
          }
          createMany: {
            args: Prisma.TaskSourceMessageCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.TaskSourceMessageCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TaskSourceMessagePayload>[]
          }
          delete: {
            args: Prisma.TaskSourceMessageDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TaskSourceMessagePayload>
          }
          update: {
            args: Prisma.TaskSourceMessageUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TaskSourceMessagePayload>
          }
          deleteMany: {
            args: Prisma.TaskSourceMessageDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.TaskSourceMessageUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.TaskSourceMessageUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TaskSourceMessagePayload>[]
          }
          upsert: {
            args: Prisma.TaskSourceMessageUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TaskSourceMessagePayload>
          }
          aggregate: {
            args: Prisma.TaskSourceMessageAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateTaskSourceMessage>
          }
          groupBy: {
            args: Prisma.TaskSourceMessageGroupByArgs<ExtArgs>
            result: $Utils.Optional<TaskSourceMessageGroupByOutputType>[]
          }
          count: {
            args: Prisma.TaskSourceMessageCountArgs<ExtArgs>
            result: $Utils.Optional<TaskSourceMessageCountAggregateOutputType> | number
          }
        }
      }
      Query: {
        payload: Prisma.$QueryPayload<ExtArgs>
        fields: Prisma.QueryFieldRefs
        operations: {
          findUnique: {
            args: Prisma.QueryFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QueryPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.QueryFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QueryPayload>
          }
          findFirst: {
            args: Prisma.QueryFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QueryPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.QueryFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QueryPayload>
          }
          findMany: {
            args: Prisma.QueryFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QueryPayload>[]
          }
          create: {
            args: Prisma.QueryCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QueryPayload>
          }
          createMany: {
            args: Prisma.QueryCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.QueryCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QueryPayload>[]
          }
          delete: {
            args: Prisma.QueryDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QueryPayload>
          }
          update: {
            args: Prisma.QueryUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QueryPayload>
          }
          deleteMany: {
            args: Prisma.QueryDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.QueryUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.QueryUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QueryPayload>[]
          }
          upsert: {
            args: Prisma.QueryUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QueryPayload>
          }
          aggregate: {
            args: Prisma.QueryAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateQuery>
          }
          groupBy: {
            args: Prisma.QueryGroupByArgs<ExtArgs>
            result: $Utils.Optional<QueryGroupByOutputType>[]
          }
          count: {
            args: Prisma.QueryCountArgs<ExtArgs>
            result: $Utils.Optional<QueryCountAggregateOutputType> | number
          }
        }
      }
      QuerySourceMessage: {
        payload: Prisma.$QuerySourceMessagePayload<ExtArgs>
        fields: Prisma.QuerySourceMessageFieldRefs
        operations: {
          findUnique: {
            args: Prisma.QuerySourceMessageFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuerySourceMessagePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.QuerySourceMessageFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuerySourceMessagePayload>
          }
          findFirst: {
            args: Prisma.QuerySourceMessageFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuerySourceMessagePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.QuerySourceMessageFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuerySourceMessagePayload>
          }
          findMany: {
            args: Prisma.QuerySourceMessageFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuerySourceMessagePayload>[]
          }
          create: {
            args: Prisma.QuerySourceMessageCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuerySourceMessagePayload>
          }
          createMany: {
            args: Prisma.QuerySourceMessageCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.QuerySourceMessageCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuerySourceMessagePayload>[]
          }
          delete: {
            args: Prisma.QuerySourceMessageDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuerySourceMessagePayload>
          }
          update: {
            args: Prisma.QuerySourceMessageUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuerySourceMessagePayload>
          }
          deleteMany: {
            args: Prisma.QuerySourceMessageDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.QuerySourceMessageUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.QuerySourceMessageUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuerySourceMessagePayload>[]
          }
          upsert: {
            args: Prisma.QuerySourceMessageUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuerySourceMessagePayload>
          }
          aggregate: {
            args: Prisma.QuerySourceMessageAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateQuerySourceMessage>
          }
          groupBy: {
            args: Prisma.QuerySourceMessageGroupByArgs<ExtArgs>
            result: $Utils.Optional<QuerySourceMessageGroupByOutputType>[]
          }
          count: {
            args: Prisma.QuerySourceMessageCountArgs<ExtArgs>
            result: $Utils.Optional<QuerySourceMessageCountAggregateOutputType> | number
          }
        }
      }
      Call: {
        payload: Prisma.$CallPayload<ExtArgs>
        fields: Prisma.CallFieldRefs
        operations: {
          findUnique: {
            args: Prisma.CallFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CallPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.CallFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CallPayload>
          }
          findFirst: {
            args: Prisma.CallFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CallPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.CallFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CallPayload>
          }
          findMany: {
            args: Prisma.CallFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CallPayload>[]
          }
          create: {
            args: Prisma.CallCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CallPayload>
          }
          createMany: {
            args: Prisma.CallCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.CallCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CallPayload>[]
          }
          delete: {
            args: Prisma.CallDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CallPayload>
          }
          update: {
            args: Prisma.CallUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CallPayload>
          }
          deleteMany: {
            args: Prisma.CallDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.CallUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.CallUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CallPayload>[]
          }
          upsert: {
            args: Prisma.CallUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CallPayload>
          }
          aggregate: {
            args: Prisma.CallAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateCall>
          }
          groupBy: {
            args: Prisma.CallGroupByArgs<ExtArgs>
            result: $Utils.Optional<CallGroupByOutputType>[]
          }
          count: {
            args: Prisma.CallCountArgs<ExtArgs>
            result: $Utils.Optional<CallCountAggregateOutputType> | number
          }
        }
      }
      Email: {
        payload: Prisma.$EmailPayload<ExtArgs>
        fields: Prisma.EmailFieldRefs
        operations: {
          findUnique: {
            args: Prisma.EmailFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EmailPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.EmailFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EmailPayload>
          }
          findFirst: {
            args: Prisma.EmailFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EmailPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.EmailFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EmailPayload>
          }
          findMany: {
            args: Prisma.EmailFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EmailPayload>[]
          }
          create: {
            args: Prisma.EmailCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EmailPayload>
          }
          createMany: {
            args: Prisma.EmailCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.EmailCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EmailPayload>[]
          }
          delete: {
            args: Prisma.EmailDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EmailPayload>
          }
          update: {
            args: Prisma.EmailUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EmailPayload>
          }
          deleteMany: {
            args: Prisma.EmailDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.EmailUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.EmailUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EmailPayload>[]
          }
          upsert: {
            args: Prisma.EmailUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EmailPayload>
          }
          aggregate: {
            args: Prisma.EmailAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateEmail>
          }
          groupBy: {
            args: Prisma.EmailGroupByArgs<ExtArgs>
            result: $Utils.Optional<EmailGroupByOutputType>[]
          }
          count: {
            args: Prisma.EmailCountArgs<ExtArgs>
            result: $Utils.Optional<EmailCountAggregateOutputType> | number
          }
        }
      }
      ContactKnowledge: {
        payload: Prisma.$ContactKnowledgePayload<ExtArgs>
        fields: Prisma.ContactKnowledgeFieldRefs
        operations: {
          findUnique: {
            args: Prisma.ContactKnowledgeFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ContactKnowledgePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.ContactKnowledgeFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ContactKnowledgePayload>
          }
          findFirst: {
            args: Prisma.ContactKnowledgeFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ContactKnowledgePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.ContactKnowledgeFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ContactKnowledgePayload>
          }
          findMany: {
            args: Prisma.ContactKnowledgeFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ContactKnowledgePayload>[]
          }
          create: {
            args: Prisma.ContactKnowledgeCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ContactKnowledgePayload>
          }
          createMany: {
            args: Prisma.ContactKnowledgeCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.ContactKnowledgeCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ContactKnowledgePayload>[]
          }
          delete: {
            args: Prisma.ContactKnowledgeDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ContactKnowledgePayload>
          }
          update: {
            args: Prisma.ContactKnowledgeUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ContactKnowledgePayload>
          }
          deleteMany: {
            args: Prisma.ContactKnowledgeDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.ContactKnowledgeUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.ContactKnowledgeUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ContactKnowledgePayload>[]
          }
          upsert: {
            args: Prisma.ContactKnowledgeUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ContactKnowledgePayload>
          }
          aggregate: {
            args: Prisma.ContactKnowledgeAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateContactKnowledge>
          }
          groupBy: {
            args: Prisma.ContactKnowledgeGroupByArgs<ExtArgs>
            result: $Utils.Optional<ContactKnowledgeGroupByOutputType>[]
          }
          count: {
            args: Prisma.ContactKnowledgeCountArgs<ExtArgs>
            result: $Utils.Optional<ContactKnowledgeCountAggregateOutputType> | number
          }
        }
      }
      KnowledgeSourceMessage: {
        payload: Prisma.$KnowledgeSourceMessagePayload<ExtArgs>
        fields: Prisma.KnowledgeSourceMessageFieldRefs
        operations: {
          findUnique: {
            args: Prisma.KnowledgeSourceMessageFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$KnowledgeSourceMessagePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.KnowledgeSourceMessageFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$KnowledgeSourceMessagePayload>
          }
          findFirst: {
            args: Prisma.KnowledgeSourceMessageFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$KnowledgeSourceMessagePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.KnowledgeSourceMessageFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$KnowledgeSourceMessagePayload>
          }
          findMany: {
            args: Prisma.KnowledgeSourceMessageFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$KnowledgeSourceMessagePayload>[]
          }
          create: {
            args: Prisma.KnowledgeSourceMessageCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$KnowledgeSourceMessagePayload>
          }
          createMany: {
            args: Prisma.KnowledgeSourceMessageCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.KnowledgeSourceMessageCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$KnowledgeSourceMessagePayload>[]
          }
          delete: {
            args: Prisma.KnowledgeSourceMessageDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$KnowledgeSourceMessagePayload>
          }
          update: {
            args: Prisma.KnowledgeSourceMessageUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$KnowledgeSourceMessagePayload>
          }
          deleteMany: {
            args: Prisma.KnowledgeSourceMessageDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.KnowledgeSourceMessageUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.KnowledgeSourceMessageUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$KnowledgeSourceMessagePayload>[]
          }
          upsert: {
            args: Prisma.KnowledgeSourceMessageUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$KnowledgeSourceMessagePayload>
          }
          aggregate: {
            args: Prisma.KnowledgeSourceMessageAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateKnowledgeSourceMessage>
          }
          groupBy: {
            args: Prisma.KnowledgeSourceMessageGroupByArgs<ExtArgs>
            result: $Utils.Optional<KnowledgeSourceMessageGroupByOutputType>[]
          }
          count: {
            args: Prisma.KnowledgeSourceMessageCountArgs<ExtArgs>
            result: $Utils.Optional<KnowledgeSourceMessageCountAggregateOutputType> | number
          }
        }
      }
    }
  } & {
    other: {
      payload: any
      operations: {
        $executeRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $executeRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
        $queryRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $queryRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
      }
    }
  }
  export const defineExtension: $Extensions.ExtendsHook<"define", Prisma.TypeMapCb, $Extensions.DefaultArgs>
  export type DefaultPrismaClient = PrismaClient
  export type ErrorFormat = 'pretty' | 'colorless' | 'minimal'
  export interface PrismaClientOptions {
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasources?: Datasources
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasourceUrl?: string
    /**
     * @default "colorless"
     */
    errorFormat?: ErrorFormat
    /**
     * @example
     * ```
     * // Shorthand for `emit: 'stdout'`
     * log: ['query', 'info', 'warn', 'error']
     * 
     * // Emit as events only
     * log: [
     *   { emit: 'event', level: 'query' },
     *   { emit: 'event', level: 'info' },
     *   { emit: 'event', level: 'warn' }
     *   { emit: 'event', level: 'error' }
     * ]
     * 
     * / Emit as events and log to stdout
     * og: [
     *  { emit: 'stdout', level: 'query' },
     *  { emit: 'stdout', level: 'info' },
     *  { emit: 'stdout', level: 'warn' }
     *  { emit: 'stdout', level: 'error' }
     * 
     * ```
     * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/logging#the-log-option).
     */
    log?: (LogLevel | LogDefinition)[]
    /**
     * The default values for transactionOptions
     * maxWait ?= 2000
     * timeout ?= 5000
     */
    transactionOptions?: {
      maxWait?: number
      timeout?: number
      isolationLevel?: Prisma.TransactionIsolationLevel
    }
    /**
     * Instance of a Driver Adapter, e.g., like one provided by `@prisma/adapter-planetscale`
     */
    adapter?: runtime.SqlDriverAdapterFactory | null
    /**
     * Global configuration for omitting model fields by default.
     * 
     * @example
     * ```
     * const prisma = new PrismaClient({
     *   omit: {
     *     user: {
     *       password: true
     *     }
     *   }
     * })
     * ```
     */
    omit?: Prisma.GlobalOmitConfig
  }
  export type GlobalOmitConfig = {
    contact?: ContactOmit
    conversation?: ConversationOmit
    message?: MessageOmit
    history?: HistoryOmit
    task?: TaskOmit
    taskSourceMessage?: TaskSourceMessageOmit
    query?: QueryOmit
    querySourceMessage?: QuerySourceMessageOmit
    call?: CallOmit
    email?: EmailOmit
    contactKnowledge?: ContactKnowledgeOmit
    knowledgeSourceMessage?: KnowledgeSourceMessageOmit
  }

  /* Types for Logging */
  export type LogLevel = 'info' | 'query' | 'warn' | 'error'
  export type LogDefinition = {
    level: LogLevel
    emit: 'stdout' | 'event'
  }

  export type CheckIsLogLevel<T> = T extends LogLevel ? T : never;

  export type GetLogType<T> = CheckIsLogLevel<
    T extends LogDefinition ? T['level'] : T
  >;

  export type GetEvents<T extends any[]> = T extends Array<LogLevel | LogDefinition>
    ? GetLogType<T[number]>
    : never;

  export type QueryEvent = {
    timestamp: Date
    query: string
    params: string
    duration: number
    target: string
  }

  export type LogEvent = {
    timestamp: Date
    message: string
    target: string
  }
  /* End Types for Logging */


  export type PrismaAction =
    | 'findUnique'
    | 'findUniqueOrThrow'
    | 'findMany'
    | 'findFirst'
    | 'findFirstOrThrow'
    | 'create'
    | 'createMany'
    | 'createManyAndReturn'
    | 'update'
    | 'updateMany'
    | 'updateManyAndReturn'
    | 'upsert'
    | 'delete'
    | 'deleteMany'
    | 'executeRaw'
    | 'queryRaw'
    | 'aggregate'
    | 'count'
    | 'runCommandRaw'
    | 'findRaw'
    | 'groupBy'

  // tested in getLogLevel.test.ts
  export function getLogLevel(log: Array<LogLevel | LogDefinition>): LogLevel | undefined;

  /**
   * `PrismaClient` proxy available in interactive transactions.
   */
  export type TransactionClient = Omit<Prisma.DefaultPrismaClient, runtime.ITXClientDenyList>

  export type Datasource = {
    url?: string
  }

  /**
   * Count Types
   */


  /**
   * Count Type ContactCountOutputType
   */

  export type ContactCountOutputType = {
    conversations: number
    tasks: number
    queries: number
    knowledge: number
    calls: number
    emails: number
  }

  export type ContactCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    conversations?: boolean | ContactCountOutputTypeCountConversationsArgs
    tasks?: boolean | ContactCountOutputTypeCountTasksArgs
    queries?: boolean | ContactCountOutputTypeCountQueriesArgs
    knowledge?: boolean | ContactCountOutputTypeCountKnowledgeArgs
    calls?: boolean | ContactCountOutputTypeCountCallsArgs
    emails?: boolean | ContactCountOutputTypeCountEmailsArgs
  }

  // Custom InputTypes
  /**
   * ContactCountOutputType without action
   */
  export type ContactCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ContactCountOutputType
     */
    select?: ContactCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * ContactCountOutputType without action
   */
  export type ContactCountOutputTypeCountConversationsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ConversationWhereInput
  }

  /**
   * ContactCountOutputType without action
   */
  export type ContactCountOutputTypeCountTasksArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: TaskWhereInput
  }

  /**
   * ContactCountOutputType without action
   */
  export type ContactCountOutputTypeCountQueriesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: QueryWhereInput
  }

  /**
   * ContactCountOutputType without action
   */
  export type ContactCountOutputTypeCountKnowledgeArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ContactKnowledgeWhereInput
  }

  /**
   * ContactCountOutputType without action
   */
  export type ContactCountOutputTypeCountCallsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: CallWhereInput
  }

  /**
   * ContactCountOutputType without action
   */
  export type ContactCountOutputTypeCountEmailsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: EmailWhereInput
  }


  /**
   * Count Type ConversationCountOutputType
   */

  export type ConversationCountOutputType = {
    messages: number
    history: number
    tasks: number
    queries: number
    calls: number
    emails: number
  }

  export type ConversationCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    messages?: boolean | ConversationCountOutputTypeCountMessagesArgs
    history?: boolean | ConversationCountOutputTypeCountHistoryArgs
    tasks?: boolean | ConversationCountOutputTypeCountTasksArgs
    queries?: boolean | ConversationCountOutputTypeCountQueriesArgs
    calls?: boolean | ConversationCountOutputTypeCountCallsArgs
    emails?: boolean | ConversationCountOutputTypeCountEmailsArgs
  }

  // Custom InputTypes
  /**
   * ConversationCountOutputType without action
   */
  export type ConversationCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ConversationCountOutputType
     */
    select?: ConversationCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * ConversationCountOutputType without action
   */
  export type ConversationCountOutputTypeCountMessagesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: MessageWhereInput
  }

  /**
   * ConversationCountOutputType without action
   */
  export type ConversationCountOutputTypeCountHistoryArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: HistoryWhereInput
  }

  /**
   * ConversationCountOutputType without action
   */
  export type ConversationCountOutputTypeCountTasksArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: TaskWhereInput
  }

  /**
   * ConversationCountOutputType without action
   */
  export type ConversationCountOutputTypeCountQueriesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: QueryWhereInput
  }

  /**
   * ConversationCountOutputType without action
   */
  export type ConversationCountOutputTypeCountCallsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: CallWhereInput
  }

  /**
   * ConversationCountOutputType without action
   */
  export type ConversationCountOutputTypeCountEmailsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: EmailWhereInput
  }


  /**
   * Count Type MessageCountOutputType
   */

  export type MessageCountOutputType = {
    taskSources: number
    querySources: number
    knowledgeSources: number
  }

  export type MessageCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    taskSources?: boolean | MessageCountOutputTypeCountTaskSourcesArgs
    querySources?: boolean | MessageCountOutputTypeCountQuerySourcesArgs
    knowledgeSources?: boolean | MessageCountOutputTypeCountKnowledgeSourcesArgs
  }

  // Custom InputTypes
  /**
   * MessageCountOutputType without action
   */
  export type MessageCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MessageCountOutputType
     */
    select?: MessageCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * MessageCountOutputType without action
   */
  export type MessageCountOutputTypeCountTaskSourcesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: TaskSourceMessageWhereInput
  }

  /**
   * MessageCountOutputType without action
   */
  export type MessageCountOutputTypeCountQuerySourcesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: QuerySourceMessageWhereInput
  }

  /**
   * MessageCountOutputType without action
   */
  export type MessageCountOutputTypeCountKnowledgeSourcesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: KnowledgeSourceMessageWhereInput
  }


  /**
   * Count Type TaskCountOutputType
   */

  export type TaskCountOutputType = {
    sources: number
  }

  export type TaskCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    sources?: boolean | TaskCountOutputTypeCountSourcesArgs
  }

  // Custom InputTypes
  /**
   * TaskCountOutputType without action
   */
  export type TaskCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TaskCountOutputType
     */
    select?: TaskCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * TaskCountOutputType without action
   */
  export type TaskCountOutputTypeCountSourcesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: TaskSourceMessageWhereInput
  }


  /**
   * Count Type QueryCountOutputType
   */

  export type QueryCountOutputType = {
    sources: number
  }

  export type QueryCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    sources?: boolean | QueryCountOutputTypeCountSourcesArgs
  }

  // Custom InputTypes
  /**
   * QueryCountOutputType without action
   */
  export type QueryCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QueryCountOutputType
     */
    select?: QueryCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * QueryCountOutputType without action
   */
  export type QueryCountOutputTypeCountSourcesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: QuerySourceMessageWhereInput
  }


  /**
   * Count Type CallCountOutputType
   */

  export type CallCountOutputType = {
    messages: number
  }

  export type CallCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    messages?: boolean | CallCountOutputTypeCountMessagesArgs
  }

  // Custom InputTypes
  /**
   * CallCountOutputType without action
   */
  export type CallCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CallCountOutputType
     */
    select?: CallCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * CallCountOutputType without action
   */
  export type CallCountOutputTypeCountMessagesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: MessageWhereInput
  }


  /**
   * Count Type ContactKnowledgeCountOutputType
   */

  export type ContactKnowledgeCountOutputType = {
    sources: number
  }

  export type ContactKnowledgeCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    sources?: boolean | ContactKnowledgeCountOutputTypeCountSourcesArgs
  }

  // Custom InputTypes
  /**
   * ContactKnowledgeCountOutputType without action
   */
  export type ContactKnowledgeCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ContactKnowledgeCountOutputType
     */
    select?: ContactKnowledgeCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * ContactKnowledgeCountOutputType without action
   */
  export type ContactKnowledgeCountOutputTypeCountSourcesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: KnowledgeSourceMessageWhereInput
  }


  /**
   * Models
   */

  /**
   * Model Contact
   */

  export type AggregateContact = {
    _count: ContactCountAggregateOutputType | null
    _min: ContactMinAggregateOutputType | null
    _max: ContactMaxAggregateOutputType | null
  }

  export type ContactMinAggregateOutputType = {
    id: string | null
    name: string | null
    business: string | null
    category: string | null
    phone: string | null
    email: string | null
    initials: string | null
    color: string | null
    note: string | null
    online: boolean | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type ContactMaxAggregateOutputType = {
    id: string | null
    name: string | null
    business: string | null
    category: string | null
    phone: string | null
    email: string | null
    initials: string | null
    color: string | null
    note: string | null
    online: boolean | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type ContactCountAggregateOutputType = {
    id: number
    name: number
    business: number
    category: number
    phone: number
    email: number
    initials: number
    color: number
    note: number
    online: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type ContactMinAggregateInputType = {
    id?: true
    name?: true
    business?: true
    category?: true
    phone?: true
    email?: true
    initials?: true
    color?: true
    note?: true
    online?: true
    createdAt?: true
    updatedAt?: true
  }

  export type ContactMaxAggregateInputType = {
    id?: true
    name?: true
    business?: true
    category?: true
    phone?: true
    email?: true
    initials?: true
    color?: true
    note?: true
    online?: true
    createdAt?: true
    updatedAt?: true
  }

  export type ContactCountAggregateInputType = {
    id?: true
    name?: true
    business?: true
    category?: true
    phone?: true
    email?: true
    initials?: true
    color?: true
    note?: true
    online?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type ContactAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Contact to aggregate.
     */
    where?: ContactWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Contacts to fetch.
     */
    orderBy?: ContactOrderByWithRelationInput | ContactOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: ContactWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Contacts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Contacts.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Contacts
    **/
    _count?: true | ContactCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: ContactMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: ContactMaxAggregateInputType
  }

  export type GetContactAggregateType<T extends ContactAggregateArgs> = {
        [P in keyof T & keyof AggregateContact]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateContact[P]>
      : GetScalarType<T[P], AggregateContact[P]>
  }




  export type ContactGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ContactWhereInput
    orderBy?: ContactOrderByWithAggregationInput | ContactOrderByWithAggregationInput[]
    by: ContactScalarFieldEnum[] | ContactScalarFieldEnum
    having?: ContactScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: ContactCountAggregateInputType | true
    _min?: ContactMinAggregateInputType
    _max?: ContactMaxAggregateInputType
  }

  export type ContactGroupByOutputType = {
    id: string
    name: string
    business: string
    category: string
    phone: string
    email: string | null
    initials: string
    color: string
    note: string | null
    online: boolean
    createdAt: Date
    updatedAt: Date
    _count: ContactCountAggregateOutputType | null
    _min: ContactMinAggregateOutputType | null
    _max: ContactMaxAggregateOutputType | null
  }

  type GetContactGroupByPayload<T extends ContactGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<ContactGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof ContactGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], ContactGroupByOutputType[P]>
            : GetScalarType<T[P], ContactGroupByOutputType[P]>
        }
      >
    >


  export type ContactSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    business?: boolean
    category?: boolean
    phone?: boolean
    email?: boolean
    initials?: boolean
    color?: boolean
    note?: boolean
    online?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    conversations?: boolean | Contact$conversationsArgs<ExtArgs>
    tasks?: boolean | Contact$tasksArgs<ExtArgs>
    queries?: boolean | Contact$queriesArgs<ExtArgs>
    knowledge?: boolean | Contact$knowledgeArgs<ExtArgs>
    calls?: boolean | Contact$callsArgs<ExtArgs>
    emails?: boolean | Contact$emailsArgs<ExtArgs>
    _count?: boolean | ContactCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["contact"]>

  export type ContactSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    business?: boolean
    category?: boolean
    phone?: boolean
    email?: boolean
    initials?: boolean
    color?: boolean
    note?: boolean
    online?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["contact"]>

  export type ContactSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    business?: boolean
    category?: boolean
    phone?: boolean
    email?: boolean
    initials?: boolean
    color?: boolean
    note?: boolean
    online?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["contact"]>

  export type ContactSelectScalar = {
    id?: boolean
    name?: boolean
    business?: boolean
    category?: boolean
    phone?: boolean
    email?: boolean
    initials?: boolean
    color?: boolean
    note?: boolean
    online?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type ContactOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "name" | "business" | "category" | "phone" | "email" | "initials" | "color" | "note" | "online" | "createdAt" | "updatedAt", ExtArgs["result"]["contact"]>
  export type ContactInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    conversations?: boolean | Contact$conversationsArgs<ExtArgs>
    tasks?: boolean | Contact$tasksArgs<ExtArgs>
    queries?: boolean | Contact$queriesArgs<ExtArgs>
    knowledge?: boolean | Contact$knowledgeArgs<ExtArgs>
    calls?: boolean | Contact$callsArgs<ExtArgs>
    emails?: boolean | Contact$emailsArgs<ExtArgs>
    _count?: boolean | ContactCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type ContactIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}
  export type ContactIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $ContactPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Contact"
    objects: {
      conversations: Prisma.$ConversationPayload<ExtArgs>[]
      tasks: Prisma.$TaskPayload<ExtArgs>[]
      queries: Prisma.$QueryPayload<ExtArgs>[]
      knowledge: Prisma.$ContactKnowledgePayload<ExtArgs>[]
      calls: Prisma.$CallPayload<ExtArgs>[]
      emails: Prisma.$EmailPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      name: string
      business: string
      category: string
      phone: string
      email: string | null
      initials: string
      color: string
      note: string | null
      online: boolean
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["contact"]>
    composites: {}
  }

  type ContactGetPayload<S extends boolean | null | undefined | ContactDefaultArgs> = $Result.GetResult<Prisma.$ContactPayload, S>

  type ContactCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<ContactFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: ContactCountAggregateInputType | true
    }

  export interface ContactDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Contact'], meta: { name: 'Contact' } }
    /**
     * Find zero or one Contact that matches the filter.
     * @param {ContactFindUniqueArgs} args - Arguments to find a Contact
     * @example
     * // Get one Contact
     * const contact = await prisma.contact.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends ContactFindUniqueArgs>(args: SelectSubset<T, ContactFindUniqueArgs<ExtArgs>>): Prisma__ContactClient<$Result.GetResult<Prisma.$ContactPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Contact that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {ContactFindUniqueOrThrowArgs} args - Arguments to find a Contact
     * @example
     * // Get one Contact
     * const contact = await prisma.contact.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends ContactFindUniqueOrThrowArgs>(args: SelectSubset<T, ContactFindUniqueOrThrowArgs<ExtArgs>>): Prisma__ContactClient<$Result.GetResult<Prisma.$ContactPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Contact that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ContactFindFirstArgs} args - Arguments to find a Contact
     * @example
     * // Get one Contact
     * const contact = await prisma.contact.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends ContactFindFirstArgs>(args?: SelectSubset<T, ContactFindFirstArgs<ExtArgs>>): Prisma__ContactClient<$Result.GetResult<Prisma.$ContactPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Contact that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ContactFindFirstOrThrowArgs} args - Arguments to find a Contact
     * @example
     * // Get one Contact
     * const contact = await prisma.contact.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends ContactFindFirstOrThrowArgs>(args?: SelectSubset<T, ContactFindFirstOrThrowArgs<ExtArgs>>): Prisma__ContactClient<$Result.GetResult<Prisma.$ContactPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Contacts that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ContactFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Contacts
     * const contacts = await prisma.contact.findMany()
     * 
     * // Get first 10 Contacts
     * const contacts = await prisma.contact.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const contactWithIdOnly = await prisma.contact.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends ContactFindManyArgs>(args?: SelectSubset<T, ContactFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ContactPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Contact.
     * @param {ContactCreateArgs} args - Arguments to create a Contact.
     * @example
     * // Create one Contact
     * const Contact = await prisma.contact.create({
     *   data: {
     *     // ... data to create a Contact
     *   }
     * })
     * 
     */
    create<T extends ContactCreateArgs>(args: SelectSubset<T, ContactCreateArgs<ExtArgs>>): Prisma__ContactClient<$Result.GetResult<Prisma.$ContactPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Contacts.
     * @param {ContactCreateManyArgs} args - Arguments to create many Contacts.
     * @example
     * // Create many Contacts
     * const contact = await prisma.contact.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends ContactCreateManyArgs>(args?: SelectSubset<T, ContactCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Contacts and returns the data saved in the database.
     * @param {ContactCreateManyAndReturnArgs} args - Arguments to create many Contacts.
     * @example
     * // Create many Contacts
     * const contact = await prisma.contact.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Contacts and only return the `id`
     * const contactWithIdOnly = await prisma.contact.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends ContactCreateManyAndReturnArgs>(args?: SelectSubset<T, ContactCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ContactPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Contact.
     * @param {ContactDeleteArgs} args - Arguments to delete one Contact.
     * @example
     * // Delete one Contact
     * const Contact = await prisma.contact.delete({
     *   where: {
     *     // ... filter to delete one Contact
     *   }
     * })
     * 
     */
    delete<T extends ContactDeleteArgs>(args: SelectSubset<T, ContactDeleteArgs<ExtArgs>>): Prisma__ContactClient<$Result.GetResult<Prisma.$ContactPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Contact.
     * @param {ContactUpdateArgs} args - Arguments to update one Contact.
     * @example
     * // Update one Contact
     * const contact = await prisma.contact.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends ContactUpdateArgs>(args: SelectSubset<T, ContactUpdateArgs<ExtArgs>>): Prisma__ContactClient<$Result.GetResult<Prisma.$ContactPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Contacts.
     * @param {ContactDeleteManyArgs} args - Arguments to filter Contacts to delete.
     * @example
     * // Delete a few Contacts
     * const { count } = await prisma.contact.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends ContactDeleteManyArgs>(args?: SelectSubset<T, ContactDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Contacts.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ContactUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Contacts
     * const contact = await prisma.contact.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends ContactUpdateManyArgs>(args: SelectSubset<T, ContactUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Contacts and returns the data updated in the database.
     * @param {ContactUpdateManyAndReturnArgs} args - Arguments to update many Contacts.
     * @example
     * // Update many Contacts
     * const contact = await prisma.contact.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Contacts and only return the `id`
     * const contactWithIdOnly = await prisma.contact.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends ContactUpdateManyAndReturnArgs>(args: SelectSubset<T, ContactUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ContactPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Contact.
     * @param {ContactUpsertArgs} args - Arguments to update or create a Contact.
     * @example
     * // Update or create a Contact
     * const contact = await prisma.contact.upsert({
     *   create: {
     *     // ... data to create a Contact
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Contact we want to update
     *   }
     * })
     */
    upsert<T extends ContactUpsertArgs>(args: SelectSubset<T, ContactUpsertArgs<ExtArgs>>): Prisma__ContactClient<$Result.GetResult<Prisma.$ContactPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Contacts.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ContactCountArgs} args - Arguments to filter Contacts to count.
     * @example
     * // Count the number of Contacts
     * const count = await prisma.contact.count({
     *   where: {
     *     // ... the filter for the Contacts we want to count
     *   }
     * })
    **/
    count<T extends ContactCountArgs>(
      args?: Subset<T, ContactCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], ContactCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Contact.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ContactAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends ContactAggregateArgs>(args: Subset<T, ContactAggregateArgs>): Prisma.PrismaPromise<GetContactAggregateType<T>>

    /**
     * Group by Contact.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ContactGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends ContactGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: ContactGroupByArgs['orderBy'] }
        : { orderBy?: ContactGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, ContactGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetContactGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Contact model
   */
  readonly fields: ContactFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Contact.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__ContactClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    conversations<T extends Contact$conversationsArgs<ExtArgs> = {}>(args?: Subset<T, Contact$conversationsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ConversationPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    tasks<T extends Contact$tasksArgs<ExtArgs> = {}>(args?: Subset<T, Contact$tasksArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TaskPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    queries<T extends Contact$queriesArgs<ExtArgs> = {}>(args?: Subset<T, Contact$queriesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$QueryPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    knowledge<T extends Contact$knowledgeArgs<ExtArgs> = {}>(args?: Subset<T, Contact$knowledgeArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ContactKnowledgePayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    calls<T extends Contact$callsArgs<ExtArgs> = {}>(args?: Subset<T, Contact$callsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CallPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    emails<T extends Contact$emailsArgs<ExtArgs> = {}>(args?: Subset<T, Contact$emailsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$EmailPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Contact model
   */
  interface ContactFieldRefs {
    readonly id: FieldRef<"Contact", 'String'>
    readonly name: FieldRef<"Contact", 'String'>
    readonly business: FieldRef<"Contact", 'String'>
    readonly category: FieldRef<"Contact", 'String'>
    readonly phone: FieldRef<"Contact", 'String'>
    readonly email: FieldRef<"Contact", 'String'>
    readonly initials: FieldRef<"Contact", 'String'>
    readonly color: FieldRef<"Contact", 'String'>
    readonly note: FieldRef<"Contact", 'String'>
    readonly online: FieldRef<"Contact", 'Boolean'>
    readonly createdAt: FieldRef<"Contact", 'DateTime'>
    readonly updatedAt: FieldRef<"Contact", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Contact findUnique
   */
  export type ContactFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Contact
     */
    select?: ContactSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Contact
     */
    omit?: ContactOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ContactInclude<ExtArgs> | null
    /**
     * Filter, which Contact to fetch.
     */
    where: ContactWhereUniqueInput
  }

  /**
   * Contact findUniqueOrThrow
   */
  export type ContactFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Contact
     */
    select?: ContactSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Contact
     */
    omit?: ContactOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ContactInclude<ExtArgs> | null
    /**
     * Filter, which Contact to fetch.
     */
    where: ContactWhereUniqueInput
  }

  /**
   * Contact findFirst
   */
  export type ContactFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Contact
     */
    select?: ContactSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Contact
     */
    omit?: ContactOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ContactInclude<ExtArgs> | null
    /**
     * Filter, which Contact to fetch.
     */
    where?: ContactWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Contacts to fetch.
     */
    orderBy?: ContactOrderByWithRelationInput | ContactOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Contacts.
     */
    cursor?: ContactWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Contacts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Contacts.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Contacts.
     */
    distinct?: ContactScalarFieldEnum | ContactScalarFieldEnum[]
  }

  /**
   * Contact findFirstOrThrow
   */
  export type ContactFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Contact
     */
    select?: ContactSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Contact
     */
    omit?: ContactOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ContactInclude<ExtArgs> | null
    /**
     * Filter, which Contact to fetch.
     */
    where?: ContactWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Contacts to fetch.
     */
    orderBy?: ContactOrderByWithRelationInput | ContactOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Contacts.
     */
    cursor?: ContactWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Contacts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Contacts.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Contacts.
     */
    distinct?: ContactScalarFieldEnum | ContactScalarFieldEnum[]
  }

  /**
   * Contact findMany
   */
  export type ContactFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Contact
     */
    select?: ContactSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Contact
     */
    omit?: ContactOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ContactInclude<ExtArgs> | null
    /**
     * Filter, which Contacts to fetch.
     */
    where?: ContactWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Contacts to fetch.
     */
    orderBy?: ContactOrderByWithRelationInput | ContactOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Contacts.
     */
    cursor?: ContactWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Contacts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Contacts.
     */
    skip?: number
    distinct?: ContactScalarFieldEnum | ContactScalarFieldEnum[]
  }

  /**
   * Contact create
   */
  export type ContactCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Contact
     */
    select?: ContactSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Contact
     */
    omit?: ContactOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ContactInclude<ExtArgs> | null
    /**
     * The data needed to create a Contact.
     */
    data: XOR<ContactCreateInput, ContactUncheckedCreateInput>
  }

  /**
   * Contact createMany
   */
  export type ContactCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Contacts.
     */
    data: ContactCreateManyInput | ContactCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Contact createManyAndReturn
   */
  export type ContactCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Contact
     */
    select?: ContactSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Contact
     */
    omit?: ContactOmit<ExtArgs> | null
    /**
     * The data used to create many Contacts.
     */
    data: ContactCreateManyInput | ContactCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Contact update
   */
  export type ContactUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Contact
     */
    select?: ContactSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Contact
     */
    omit?: ContactOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ContactInclude<ExtArgs> | null
    /**
     * The data needed to update a Contact.
     */
    data: XOR<ContactUpdateInput, ContactUncheckedUpdateInput>
    /**
     * Choose, which Contact to update.
     */
    where: ContactWhereUniqueInput
  }

  /**
   * Contact updateMany
   */
  export type ContactUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Contacts.
     */
    data: XOR<ContactUpdateManyMutationInput, ContactUncheckedUpdateManyInput>
    /**
     * Filter which Contacts to update
     */
    where?: ContactWhereInput
    /**
     * Limit how many Contacts to update.
     */
    limit?: number
  }

  /**
   * Contact updateManyAndReturn
   */
  export type ContactUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Contact
     */
    select?: ContactSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Contact
     */
    omit?: ContactOmit<ExtArgs> | null
    /**
     * The data used to update Contacts.
     */
    data: XOR<ContactUpdateManyMutationInput, ContactUncheckedUpdateManyInput>
    /**
     * Filter which Contacts to update
     */
    where?: ContactWhereInput
    /**
     * Limit how many Contacts to update.
     */
    limit?: number
  }

  /**
   * Contact upsert
   */
  export type ContactUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Contact
     */
    select?: ContactSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Contact
     */
    omit?: ContactOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ContactInclude<ExtArgs> | null
    /**
     * The filter to search for the Contact to update in case it exists.
     */
    where: ContactWhereUniqueInput
    /**
     * In case the Contact found by the `where` argument doesn't exist, create a new Contact with this data.
     */
    create: XOR<ContactCreateInput, ContactUncheckedCreateInput>
    /**
     * In case the Contact was found with the provided `where` argument, update it with this data.
     */
    update: XOR<ContactUpdateInput, ContactUncheckedUpdateInput>
  }

  /**
   * Contact delete
   */
  export type ContactDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Contact
     */
    select?: ContactSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Contact
     */
    omit?: ContactOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ContactInclude<ExtArgs> | null
    /**
     * Filter which Contact to delete.
     */
    where: ContactWhereUniqueInput
  }

  /**
   * Contact deleteMany
   */
  export type ContactDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Contacts to delete
     */
    where?: ContactWhereInput
    /**
     * Limit how many Contacts to delete.
     */
    limit?: number
  }

  /**
   * Contact.conversations
   */
  export type Contact$conversationsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Conversation
     */
    select?: ConversationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Conversation
     */
    omit?: ConversationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ConversationInclude<ExtArgs> | null
    where?: ConversationWhereInput
    orderBy?: ConversationOrderByWithRelationInput | ConversationOrderByWithRelationInput[]
    cursor?: ConversationWhereUniqueInput
    take?: number
    skip?: number
    distinct?: ConversationScalarFieldEnum | ConversationScalarFieldEnum[]
  }

  /**
   * Contact.tasks
   */
  export type Contact$tasksArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Task
     */
    select?: TaskSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Task
     */
    omit?: TaskOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TaskInclude<ExtArgs> | null
    where?: TaskWhereInput
    orderBy?: TaskOrderByWithRelationInput | TaskOrderByWithRelationInput[]
    cursor?: TaskWhereUniqueInput
    take?: number
    skip?: number
    distinct?: TaskScalarFieldEnum | TaskScalarFieldEnum[]
  }

  /**
   * Contact.queries
   */
  export type Contact$queriesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Query
     */
    select?: QuerySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Query
     */
    omit?: QueryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QueryInclude<ExtArgs> | null
    where?: QueryWhereInput
    orderBy?: QueryOrderByWithRelationInput | QueryOrderByWithRelationInput[]
    cursor?: QueryWhereUniqueInput
    take?: number
    skip?: number
    distinct?: QueryScalarFieldEnum | QueryScalarFieldEnum[]
  }

  /**
   * Contact.knowledge
   */
  export type Contact$knowledgeArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ContactKnowledge
     */
    select?: ContactKnowledgeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ContactKnowledge
     */
    omit?: ContactKnowledgeOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ContactKnowledgeInclude<ExtArgs> | null
    where?: ContactKnowledgeWhereInput
    orderBy?: ContactKnowledgeOrderByWithRelationInput | ContactKnowledgeOrderByWithRelationInput[]
    cursor?: ContactKnowledgeWhereUniqueInput
    take?: number
    skip?: number
    distinct?: ContactKnowledgeScalarFieldEnum | ContactKnowledgeScalarFieldEnum[]
  }

  /**
   * Contact.calls
   */
  export type Contact$callsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Call
     */
    select?: CallSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Call
     */
    omit?: CallOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CallInclude<ExtArgs> | null
    where?: CallWhereInput
    orderBy?: CallOrderByWithRelationInput | CallOrderByWithRelationInput[]
    cursor?: CallWhereUniqueInput
    take?: number
    skip?: number
    distinct?: CallScalarFieldEnum | CallScalarFieldEnum[]
  }

  /**
   * Contact.emails
   */
  export type Contact$emailsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Email
     */
    select?: EmailSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Email
     */
    omit?: EmailOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EmailInclude<ExtArgs> | null
    where?: EmailWhereInput
    orderBy?: EmailOrderByWithRelationInput | EmailOrderByWithRelationInput[]
    cursor?: EmailWhereUniqueInput
    take?: number
    skip?: number
    distinct?: EmailScalarFieldEnum | EmailScalarFieldEnum[]
  }

  /**
   * Contact without action
   */
  export type ContactDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Contact
     */
    select?: ContactSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Contact
     */
    omit?: ContactOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ContactInclude<ExtArgs> | null
  }


  /**
   * Model Conversation
   */

  export type AggregateConversation = {
    _count: ConversationCountAggregateOutputType | null
    _min: ConversationMinAggregateOutputType | null
    _max: ConversationMaxAggregateOutputType | null
  }

  export type ConversationMinAggregateOutputType = {
    id: string | null
    title: string | null
    createdAt: Date | null
    updatedAt: Date | null
    lastExtractedMessageId: string | null
    lastExtractedAt: Date | null
    contactId: string | null
  }

  export type ConversationMaxAggregateOutputType = {
    id: string | null
    title: string | null
    createdAt: Date | null
    updatedAt: Date | null
    lastExtractedMessageId: string | null
    lastExtractedAt: Date | null
    contactId: string | null
  }

  export type ConversationCountAggregateOutputType = {
    id: number
    title: number
    createdAt: number
    updatedAt: number
    lastExtractedMessageId: number
    lastExtractedAt: number
    contactId: number
    _all: number
  }


  export type ConversationMinAggregateInputType = {
    id?: true
    title?: true
    createdAt?: true
    updatedAt?: true
    lastExtractedMessageId?: true
    lastExtractedAt?: true
    contactId?: true
  }

  export type ConversationMaxAggregateInputType = {
    id?: true
    title?: true
    createdAt?: true
    updatedAt?: true
    lastExtractedMessageId?: true
    lastExtractedAt?: true
    contactId?: true
  }

  export type ConversationCountAggregateInputType = {
    id?: true
    title?: true
    createdAt?: true
    updatedAt?: true
    lastExtractedMessageId?: true
    lastExtractedAt?: true
    contactId?: true
    _all?: true
  }

  export type ConversationAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Conversation to aggregate.
     */
    where?: ConversationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Conversations to fetch.
     */
    orderBy?: ConversationOrderByWithRelationInput | ConversationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: ConversationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Conversations from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Conversations.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Conversations
    **/
    _count?: true | ConversationCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: ConversationMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: ConversationMaxAggregateInputType
  }

  export type GetConversationAggregateType<T extends ConversationAggregateArgs> = {
        [P in keyof T & keyof AggregateConversation]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateConversation[P]>
      : GetScalarType<T[P], AggregateConversation[P]>
  }




  export type ConversationGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ConversationWhereInput
    orderBy?: ConversationOrderByWithAggregationInput | ConversationOrderByWithAggregationInput[]
    by: ConversationScalarFieldEnum[] | ConversationScalarFieldEnum
    having?: ConversationScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: ConversationCountAggregateInputType | true
    _min?: ConversationMinAggregateInputType
    _max?: ConversationMaxAggregateInputType
  }

  export type ConversationGroupByOutputType = {
    id: string
    title: string | null
    createdAt: Date
    updatedAt: Date
    lastExtractedMessageId: string | null
    lastExtractedAt: Date | null
    contactId: string
    _count: ConversationCountAggregateOutputType | null
    _min: ConversationMinAggregateOutputType | null
    _max: ConversationMaxAggregateOutputType | null
  }

  type GetConversationGroupByPayload<T extends ConversationGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<ConversationGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof ConversationGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], ConversationGroupByOutputType[P]>
            : GetScalarType<T[P], ConversationGroupByOutputType[P]>
        }
      >
    >


  export type ConversationSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    title?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    lastExtractedMessageId?: boolean
    lastExtractedAt?: boolean
    contactId?: boolean
    messages?: boolean | Conversation$messagesArgs<ExtArgs>
    history?: boolean | Conversation$historyArgs<ExtArgs>
    tasks?: boolean | Conversation$tasksArgs<ExtArgs>
    contact?: boolean | ContactDefaultArgs<ExtArgs>
    queries?: boolean | Conversation$queriesArgs<ExtArgs>
    calls?: boolean | Conversation$callsArgs<ExtArgs>
    emails?: boolean | Conversation$emailsArgs<ExtArgs>
    _count?: boolean | ConversationCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["conversation"]>

  export type ConversationSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    title?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    lastExtractedMessageId?: boolean
    lastExtractedAt?: boolean
    contactId?: boolean
    contact?: boolean | ContactDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["conversation"]>

  export type ConversationSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    title?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    lastExtractedMessageId?: boolean
    lastExtractedAt?: boolean
    contactId?: boolean
    contact?: boolean | ContactDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["conversation"]>

  export type ConversationSelectScalar = {
    id?: boolean
    title?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    lastExtractedMessageId?: boolean
    lastExtractedAt?: boolean
    contactId?: boolean
  }

  export type ConversationOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "title" | "createdAt" | "updatedAt" | "lastExtractedMessageId" | "lastExtractedAt" | "contactId", ExtArgs["result"]["conversation"]>
  export type ConversationInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    messages?: boolean | Conversation$messagesArgs<ExtArgs>
    history?: boolean | Conversation$historyArgs<ExtArgs>
    tasks?: boolean | Conversation$tasksArgs<ExtArgs>
    contact?: boolean | ContactDefaultArgs<ExtArgs>
    queries?: boolean | Conversation$queriesArgs<ExtArgs>
    calls?: boolean | Conversation$callsArgs<ExtArgs>
    emails?: boolean | Conversation$emailsArgs<ExtArgs>
    _count?: boolean | ConversationCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type ConversationIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    contact?: boolean | ContactDefaultArgs<ExtArgs>
  }
  export type ConversationIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    contact?: boolean | ContactDefaultArgs<ExtArgs>
  }

  export type $ConversationPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Conversation"
    objects: {
      messages: Prisma.$MessagePayload<ExtArgs>[]
      history: Prisma.$HistoryPayload<ExtArgs>[]
      tasks: Prisma.$TaskPayload<ExtArgs>[]
      contact: Prisma.$ContactPayload<ExtArgs>
      queries: Prisma.$QueryPayload<ExtArgs>[]
      calls: Prisma.$CallPayload<ExtArgs>[]
      emails: Prisma.$EmailPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      title: string | null
      createdAt: Date
      updatedAt: Date
      lastExtractedMessageId: string | null
      lastExtractedAt: Date | null
      contactId: string
    }, ExtArgs["result"]["conversation"]>
    composites: {}
  }

  type ConversationGetPayload<S extends boolean | null | undefined | ConversationDefaultArgs> = $Result.GetResult<Prisma.$ConversationPayload, S>

  type ConversationCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<ConversationFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: ConversationCountAggregateInputType | true
    }

  export interface ConversationDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Conversation'], meta: { name: 'Conversation' } }
    /**
     * Find zero or one Conversation that matches the filter.
     * @param {ConversationFindUniqueArgs} args - Arguments to find a Conversation
     * @example
     * // Get one Conversation
     * const conversation = await prisma.conversation.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends ConversationFindUniqueArgs>(args: SelectSubset<T, ConversationFindUniqueArgs<ExtArgs>>): Prisma__ConversationClient<$Result.GetResult<Prisma.$ConversationPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Conversation that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {ConversationFindUniqueOrThrowArgs} args - Arguments to find a Conversation
     * @example
     * // Get one Conversation
     * const conversation = await prisma.conversation.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends ConversationFindUniqueOrThrowArgs>(args: SelectSubset<T, ConversationFindUniqueOrThrowArgs<ExtArgs>>): Prisma__ConversationClient<$Result.GetResult<Prisma.$ConversationPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Conversation that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ConversationFindFirstArgs} args - Arguments to find a Conversation
     * @example
     * // Get one Conversation
     * const conversation = await prisma.conversation.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends ConversationFindFirstArgs>(args?: SelectSubset<T, ConversationFindFirstArgs<ExtArgs>>): Prisma__ConversationClient<$Result.GetResult<Prisma.$ConversationPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Conversation that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ConversationFindFirstOrThrowArgs} args - Arguments to find a Conversation
     * @example
     * // Get one Conversation
     * const conversation = await prisma.conversation.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends ConversationFindFirstOrThrowArgs>(args?: SelectSubset<T, ConversationFindFirstOrThrowArgs<ExtArgs>>): Prisma__ConversationClient<$Result.GetResult<Prisma.$ConversationPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Conversations that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ConversationFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Conversations
     * const conversations = await prisma.conversation.findMany()
     * 
     * // Get first 10 Conversations
     * const conversations = await prisma.conversation.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const conversationWithIdOnly = await prisma.conversation.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends ConversationFindManyArgs>(args?: SelectSubset<T, ConversationFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ConversationPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Conversation.
     * @param {ConversationCreateArgs} args - Arguments to create a Conversation.
     * @example
     * // Create one Conversation
     * const Conversation = await prisma.conversation.create({
     *   data: {
     *     // ... data to create a Conversation
     *   }
     * })
     * 
     */
    create<T extends ConversationCreateArgs>(args: SelectSubset<T, ConversationCreateArgs<ExtArgs>>): Prisma__ConversationClient<$Result.GetResult<Prisma.$ConversationPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Conversations.
     * @param {ConversationCreateManyArgs} args - Arguments to create many Conversations.
     * @example
     * // Create many Conversations
     * const conversation = await prisma.conversation.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends ConversationCreateManyArgs>(args?: SelectSubset<T, ConversationCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Conversations and returns the data saved in the database.
     * @param {ConversationCreateManyAndReturnArgs} args - Arguments to create many Conversations.
     * @example
     * // Create many Conversations
     * const conversation = await prisma.conversation.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Conversations and only return the `id`
     * const conversationWithIdOnly = await prisma.conversation.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends ConversationCreateManyAndReturnArgs>(args?: SelectSubset<T, ConversationCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ConversationPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Conversation.
     * @param {ConversationDeleteArgs} args - Arguments to delete one Conversation.
     * @example
     * // Delete one Conversation
     * const Conversation = await prisma.conversation.delete({
     *   where: {
     *     // ... filter to delete one Conversation
     *   }
     * })
     * 
     */
    delete<T extends ConversationDeleteArgs>(args: SelectSubset<T, ConversationDeleteArgs<ExtArgs>>): Prisma__ConversationClient<$Result.GetResult<Prisma.$ConversationPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Conversation.
     * @param {ConversationUpdateArgs} args - Arguments to update one Conversation.
     * @example
     * // Update one Conversation
     * const conversation = await prisma.conversation.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends ConversationUpdateArgs>(args: SelectSubset<T, ConversationUpdateArgs<ExtArgs>>): Prisma__ConversationClient<$Result.GetResult<Prisma.$ConversationPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Conversations.
     * @param {ConversationDeleteManyArgs} args - Arguments to filter Conversations to delete.
     * @example
     * // Delete a few Conversations
     * const { count } = await prisma.conversation.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends ConversationDeleteManyArgs>(args?: SelectSubset<T, ConversationDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Conversations.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ConversationUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Conversations
     * const conversation = await prisma.conversation.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends ConversationUpdateManyArgs>(args: SelectSubset<T, ConversationUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Conversations and returns the data updated in the database.
     * @param {ConversationUpdateManyAndReturnArgs} args - Arguments to update many Conversations.
     * @example
     * // Update many Conversations
     * const conversation = await prisma.conversation.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Conversations and only return the `id`
     * const conversationWithIdOnly = await prisma.conversation.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends ConversationUpdateManyAndReturnArgs>(args: SelectSubset<T, ConversationUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ConversationPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Conversation.
     * @param {ConversationUpsertArgs} args - Arguments to update or create a Conversation.
     * @example
     * // Update or create a Conversation
     * const conversation = await prisma.conversation.upsert({
     *   create: {
     *     // ... data to create a Conversation
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Conversation we want to update
     *   }
     * })
     */
    upsert<T extends ConversationUpsertArgs>(args: SelectSubset<T, ConversationUpsertArgs<ExtArgs>>): Prisma__ConversationClient<$Result.GetResult<Prisma.$ConversationPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Conversations.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ConversationCountArgs} args - Arguments to filter Conversations to count.
     * @example
     * // Count the number of Conversations
     * const count = await prisma.conversation.count({
     *   where: {
     *     // ... the filter for the Conversations we want to count
     *   }
     * })
    **/
    count<T extends ConversationCountArgs>(
      args?: Subset<T, ConversationCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], ConversationCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Conversation.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ConversationAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends ConversationAggregateArgs>(args: Subset<T, ConversationAggregateArgs>): Prisma.PrismaPromise<GetConversationAggregateType<T>>

    /**
     * Group by Conversation.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ConversationGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends ConversationGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: ConversationGroupByArgs['orderBy'] }
        : { orderBy?: ConversationGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, ConversationGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetConversationGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Conversation model
   */
  readonly fields: ConversationFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Conversation.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__ConversationClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    messages<T extends Conversation$messagesArgs<ExtArgs> = {}>(args?: Subset<T, Conversation$messagesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$MessagePayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    history<T extends Conversation$historyArgs<ExtArgs> = {}>(args?: Subset<T, Conversation$historyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$HistoryPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    tasks<T extends Conversation$tasksArgs<ExtArgs> = {}>(args?: Subset<T, Conversation$tasksArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TaskPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    contact<T extends ContactDefaultArgs<ExtArgs> = {}>(args?: Subset<T, ContactDefaultArgs<ExtArgs>>): Prisma__ContactClient<$Result.GetResult<Prisma.$ContactPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    queries<T extends Conversation$queriesArgs<ExtArgs> = {}>(args?: Subset<T, Conversation$queriesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$QueryPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    calls<T extends Conversation$callsArgs<ExtArgs> = {}>(args?: Subset<T, Conversation$callsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CallPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    emails<T extends Conversation$emailsArgs<ExtArgs> = {}>(args?: Subset<T, Conversation$emailsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$EmailPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Conversation model
   */
  interface ConversationFieldRefs {
    readonly id: FieldRef<"Conversation", 'String'>
    readonly title: FieldRef<"Conversation", 'String'>
    readonly createdAt: FieldRef<"Conversation", 'DateTime'>
    readonly updatedAt: FieldRef<"Conversation", 'DateTime'>
    readonly lastExtractedMessageId: FieldRef<"Conversation", 'String'>
    readonly lastExtractedAt: FieldRef<"Conversation", 'DateTime'>
    readonly contactId: FieldRef<"Conversation", 'String'>
  }
    

  // Custom InputTypes
  /**
   * Conversation findUnique
   */
  export type ConversationFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Conversation
     */
    select?: ConversationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Conversation
     */
    omit?: ConversationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ConversationInclude<ExtArgs> | null
    /**
     * Filter, which Conversation to fetch.
     */
    where: ConversationWhereUniqueInput
  }

  /**
   * Conversation findUniqueOrThrow
   */
  export type ConversationFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Conversation
     */
    select?: ConversationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Conversation
     */
    omit?: ConversationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ConversationInclude<ExtArgs> | null
    /**
     * Filter, which Conversation to fetch.
     */
    where: ConversationWhereUniqueInput
  }

  /**
   * Conversation findFirst
   */
  export type ConversationFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Conversation
     */
    select?: ConversationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Conversation
     */
    omit?: ConversationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ConversationInclude<ExtArgs> | null
    /**
     * Filter, which Conversation to fetch.
     */
    where?: ConversationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Conversations to fetch.
     */
    orderBy?: ConversationOrderByWithRelationInput | ConversationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Conversations.
     */
    cursor?: ConversationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Conversations from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Conversations.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Conversations.
     */
    distinct?: ConversationScalarFieldEnum | ConversationScalarFieldEnum[]
  }

  /**
   * Conversation findFirstOrThrow
   */
  export type ConversationFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Conversation
     */
    select?: ConversationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Conversation
     */
    omit?: ConversationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ConversationInclude<ExtArgs> | null
    /**
     * Filter, which Conversation to fetch.
     */
    where?: ConversationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Conversations to fetch.
     */
    orderBy?: ConversationOrderByWithRelationInput | ConversationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Conversations.
     */
    cursor?: ConversationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Conversations from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Conversations.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Conversations.
     */
    distinct?: ConversationScalarFieldEnum | ConversationScalarFieldEnum[]
  }

  /**
   * Conversation findMany
   */
  export type ConversationFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Conversation
     */
    select?: ConversationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Conversation
     */
    omit?: ConversationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ConversationInclude<ExtArgs> | null
    /**
     * Filter, which Conversations to fetch.
     */
    where?: ConversationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Conversations to fetch.
     */
    orderBy?: ConversationOrderByWithRelationInput | ConversationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Conversations.
     */
    cursor?: ConversationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Conversations from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Conversations.
     */
    skip?: number
    distinct?: ConversationScalarFieldEnum | ConversationScalarFieldEnum[]
  }

  /**
   * Conversation create
   */
  export type ConversationCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Conversation
     */
    select?: ConversationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Conversation
     */
    omit?: ConversationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ConversationInclude<ExtArgs> | null
    /**
     * The data needed to create a Conversation.
     */
    data: XOR<ConversationCreateInput, ConversationUncheckedCreateInput>
  }

  /**
   * Conversation createMany
   */
  export type ConversationCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Conversations.
     */
    data: ConversationCreateManyInput | ConversationCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Conversation createManyAndReturn
   */
  export type ConversationCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Conversation
     */
    select?: ConversationSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Conversation
     */
    omit?: ConversationOmit<ExtArgs> | null
    /**
     * The data used to create many Conversations.
     */
    data: ConversationCreateManyInput | ConversationCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ConversationIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Conversation update
   */
  export type ConversationUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Conversation
     */
    select?: ConversationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Conversation
     */
    omit?: ConversationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ConversationInclude<ExtArgs> | null
    /**
     * The data needed to update a Conversation.
     */
    data: XOR<ConversationUpdateInput, ConversationUncheckedUpdateInput>
    /**
     * Choose, which Conversation to update.
     */
    where: ConversationWhereUniqueInput
  }

  /**
   * Conversation updateMany
   */
  export type ConversationUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Conversations.
     */
    data: XOR<ConversationUpdateManyMutationInput, ConversationUncheckedUpdateManyInput>
    /**
     * Filter which Conversations to update
     */
    where?: ConversationWhereInput
    /**
     * Limit how many Conversations to update.
     */
    limit?: number
  }

  /**
   * Conversation updateManyAndReturn
   */
  export type ConversationUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Conversation
     */
    select?: ConversationSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Conversation
     */
    omit?: ConversationOmit<ExtArgs> | null
    /**
     * The data used to update Conversations.
     */
    data: XOR<ConversationUpdateManyMutationInput, ConversationUncheckedUpdateManyInput>
    /**
     * Filter which Conversations to update
     */
    where?: ConversationWhereInput
    /**
     * Limit how many Conversations to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ConversationIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * Conversation upsert
   */
  export type ConversationUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Conversation
     */
    select?: ConversationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Conversation
     */
    omit?: ConversationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ConversationInclude<ExtArgs> | null
    /**
     * The filter to search for the Conversation to update in case it exists.
     */
    where: ConversationWhereUniqueInput
    /**
     * In case the Conversation found by the `where` argument doesn't exist, create a new Conversation with this data.
     */
    create: XOR<ConversationCreateInput, ConversationUncheckedCreateInput>
    /**
     * In case the Conversation was found with the provided `where` argument, update it with this data.
     */
    update: XOR<ConversationUpdateInput, ConversationUncheckedUpdateInput>
  }

  /**
   * Conversation delete
   */
  export type ConversationDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Conversation
     */
    select?: ConversationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Conversation
     */
    omit?: ConversationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ConversationInclude<ExtArgs> | null
    /**
     * Filter which Conversation to delete.
     */
    where: ConversationWhereUniqueInput
  }

  /**
   * Conversation deleteMany
   */
  export type ConversationDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Conversations to delete
     */
    where?: ConversationWhereInput
    /**
     * Limit how many Conversations to delete.
     */
    limit?: number
  }

  /**
   * Conversation.messages
   */
  export type Conversation$messagesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Message
     */
    select?: MessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Message
     */
    omit?: MessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MessageInclude<ExtArgs> | null
    where?: MessageWhereInput
    orderBy?: MessageOrderByWithRelationInput | MessageOrderByWithRelationInput[]
    cursor?: MessageWhereUniqueInput
    take?: number
    skip?: number
    distinct?: MessageScalarFieldEnum | MessageScalarFieldEnum[]
  }

  /**
   * Conversation.history
   */
  export type Conversation$historyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the History
     */
    select?: HistorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the History
     */
    omit?: HistoryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: HistoryInclude<ExtArgs> | null
    where?: HistoryWhereInput
    orderBy?: HistoryOrderByWithRelationInput | HistoryOrderByWithRelationInput[]
    cursor?: HistoryWhereUniqueInput
    take?: number
    skip?: number
    distinct?: HistoryScalarFieldEnum | HistoryScalarFieldEnum[]
  }

  /**
   * Conversation.tasks
   */
  export type Conversation$tasksArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Task
     */
    select?: TaskSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Task
     */
    omit?: TaskOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TaskInclude<ExtArgs> | null
    where?: TaskWhereInput
    orderBy?: TaskOrderByWithRelationInput | TaskOrderByWithRelationInput[]
    cursor?: TaskWhereUniqueInput
    take?: number
    skip?: number
    distinct?: TaskScalarFieldEnum | TaskScalarFieldEnum[]
  }

  /**
   * Conversation.queries
   */
  export type Conversation$queriesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Query
     */
    select?: QuerySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Query
     */
    omit?: QueryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QueryInclude<ExtArgs> | null
    where?: QueryWhereInput
    orderBy?: QueryOrderByWithRelationInput | QueryOrderByWithRelationInput[]
    cursor?: QueryWhereUniqueInput
    take?: number
    skip?: number
    distinct?: QueryScalarFieldEnum | QueryScalarFieldEnum[]
  }

  /**
   * Conversation.calls
   */
  export type Conversation$callsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Call
     */
    select?: CallSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Call
     */
    omit?: CallOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CallInclude<ExtArgs> | null
    where?: CallWhereInput
    orderBy?: CallOrderByWithRelationInput | CallOrderByWithRelationInput[]
    cursor?: CallWhereUniqueInput
    take?: number
    skip?: number
    distinct?: CallScalarFieldEnum | CallScalarFieldEnum[]
  }

  /**
   * Conversation.emails
   */
  export type Conversation$emailsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Email
     */
    select?: EmailSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Email
     */
    omit?: EmailOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EmailInclude<ExtArgs> | null
    where?: EmailWhereInput
    orderBy?: EmailOrderByWithRelationInput | EmailOrderByWithRelationInput[]
    cursor?: EmailWhereUniqueInput
    take?: number
    skip?: number
    distinct?: EmailScalarFieldEnum | EmailScalarFieldEnum[]
  }

  /**
   * Conversation without action
   */
  export type ConversationDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Conversation
     */
    select?: ConversationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Conversation
     */
    omit?: ConversationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ConversationInclude<ExtArgs> | null
  }


  /**
   * Model Message
   */

  export type AggregateMessage = {
    _count: MessageCountAggregateOutputType | null
    _min: MessageMinAggregateOutputType | null
    _max: MessageMaxAggregateOutputType | null
  }

  export type MessageMinAggregateOutputType = {
    id: string | null
    role: string | null
    content: string | null
    time: string | null
    pending: boolean | null
    createdAt: Date | null
    updatedAt: Date | null
    conversationId: string | null
    callId: string | null
  }

  export type MessageMaxAggregateOutputType = {
    id: string | null
    role: string | null
    content: string | null
    time: string | null
    pending: boolean | null
    createdAt: Date | null
    updatedAt: Date | null
    conversationId: string | null
    callId: string | null
  }

  export type MessageCountAggregateOutputType = {
    id: number
    role: number
    content: number
    time: number
    pending: number
    createdAt: number
    updatedAt: number
    conversationId: number
    callId: number
    _all: number
  }


  export type MessageMinAggregateInputType = {
    id?: true
    role?: true
    content?: true
    time?: true
    pending?: true
    createdAt?: true
    updatedAt?: true
    conversationId?: true
    callId?: true
  }

  export type MessageMaxAggregateInputType = {
    id?: true
    role?: true
    content?: true
    time?: true
    pending?: true
    createdAt?: true
    updatedAt?: true
    conversationId?: true
    callId?: true
  }

  export type MessageCountAggregateInputType = {
    id?: true
    role?: true
    content?: true
    time?: true
    pending?: true
    createdAt?: true
    updatedAt?: true
    conversationId?: true
    callId?: true
    _all?: true
  }

  export type MessageAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Message to aggregate.
     */
    where?: MessageWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Messages to fetch.
     */
    orderBy?: MessageOrderByWithRelationInput | MessageOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: MessageWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Messages from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Messages.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Messages
    **/
    _count?: true | MessageCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: MessageMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: MessageMaxAggregateInputType
  }

  export type GetMessageAggregateType<T extends MessageAggregateArgs> = {
        [P in keyof T & keyof AggregateMessage]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateMessage[P]>
      : GetScalarType<T[P], AggregateMessage[P]>
  }




  export type MessageGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: MessageWhereInput
    orderBy?: MessageOrderByWithAggregationInput | MessageOrderByWithAggregationInput[]
    by: MessageScalarFieldEnum[] | MessageScalarFieldEnum
    having?: MessageScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: MessageCountAggregateInputType | true
    _min?: MessageMinAggregateInputType
    _max?: MessageMaxAggregateInputType
  }

  export type MessageGroupByOutputType = {
    id: string
    role: string
    content: string
    time: string
    pending: boolean
    createdAt: Date
    updatedAt: Date
    conversationId: string
    callId: string | null
    _count: MessageCountAggregateOutputType | null
    _min: MessageMinAggregateOutputType | null
    _max: MessageMaxAggregateOutputType | null
  }

  type GetMessageGroupByPayload<T extends MessageGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<MessageGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof MessageGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], MessageGroupByOutputType[P]>
            : GetScalarType<T[P], MessageGroupByOutputType[P]>
        }
      >
    >


  export type MessageSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    role?: boolean
    content?: boolean
    time?: boolean
    pending?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    conversationId?: boolean
    callId?: boolean
    conversation?: boolean | ConversationDefaultArgs<ExtArgs>
    call?: boolean | Message$callArgs<ExtArgs>
    taskSources?: boolean | Message$taskSourcesArgs<ExtArgs>
    querySources?: boolean | Message$querySourcesArgs<ExtArgs>
    knowledgeSources?: boolean | Message$knowledgeSourcesArgs<ExtArgs>
    _count?: boolean | MessageCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["message"]>

  export type MessageSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    role?: boolean
    content?: boolean
    time?: boolean
    pending?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    conversationId?: boolean
    callId?: boolean
    conversation?: boolean | ConversationDefaultArgs<ExtArgs>
    call?: boolean | Message$callArgs<ExtArgs>
  }, ExtArgs["result"]["message"]>

  export type MessageSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    role?: boolean
    content?: boolean
    time?: boolean
    pending?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    conversationId?: boolean
    callId?: boolean
    conversation?: boolean | ConversationDefaultArgs<ExtArgs>
    call?: boolean | Message$callArgs<ExtArgs>
  }, ExtArgs["result"]["message"]>

  export type MessageSelectScalar = {
    id?: boolean
    role?: boolean
    content?: boolean
    time?: boolean
    pending?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    conversationId?: boolean
    callId?: boolean
  }

  export type MessageOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "role" | "content" | "time" | "pending" | "createdAt" | "updatedAt" | "conversationId" | "callId", ExtArgs["result"]["message"]>
  export type MessageInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    conversation?: boolean | ConversationDefaultArgs<ExtArgs>
    call?: boolean | Message$callArgs<ExtArgs>
    taskSources?: boolean | Message$taskSourcesArgs<ExtArgs>
    querySources?: boolean | Message$querySourcesArgs<ExtArgs>
    knowledgeSources?: boolean | Message$knowledgeSourcesArgs<ExtArgs>
    _count?: boolean | MessageCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type MessageIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    conversation?: boolean | ConversationDefaultArgs<ExtArgs>
    call?: boolean | Message$callArgs<ExtArgs>
  }
  export type MessageIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    conversation?: boolean | ConversationDefaultArgs<ExtArgs>
    call?: boolean | Message$callArgs<ExtArgs>
  }

  export type $MessagePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Message"
    objects: {
      conversation: Prisma.$ConversationPayload<ExtArgs>
      call: Prisma.$CallPayload<ExtArgs> | null
      taskSources: Prisma.$TaskSourceMessagePayload<ExtArgs>[]
      querySources: Prisma.$QuerySourceMessagePayload<ExtArgs>[]
      knowledgeSources: Prisma.$KnowledgeSourceMessagePayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      role: string
      content: string
      time: string
      pending: boolean
      createdAt: Date
      updatedAt: Date
      conversationId: string
      callId: string | null
    }, ExtArgs["result"]["message"]>
    composites: {}
  }

  type MessageGetPayload<S extends boolean | null | undefined | MessageDefaultArgs> = $Result.GetResult<Prisma.$MessagePayload, S>

  type MessageCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<MessageFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: MessageCountAggregateInputType | true
    }

  export interface MessageDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Message'], meta: { name: 'Message' } }
    /**
     * Find zero or one Message that matches the filter.
     * @param {MessageFindUniqueArgs} args - Arguments to find a Message
     * @example
     * // Get one Message
     * const message = await prisma.message.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends MessageFindUniqueArgs>(args: SelectSubset<T, MessageFindUniqueArgs<ExtArgs>>): Prisma__MessageClient<$Result.GetResult<Prisma.$MessagePayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Message that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {MessageFindUniqueOrThrowArgs} args - Arguments to find a Message
     * @example
     * // Get one Message
     * const message = await prisma.message.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends MessageFindUniqueOrThrowArgs>(args: SelectSubset<T, MessageFindUniqueOrThrowArgs<ExtArgs>>): Prisma__MessageClient<$Result.GetResult<Prisma.$MessagePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Message that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MessageFindFirstArgs} args - Arguments to find a Message
     * @example
     * // Get one Message
     * const message = await prisma.message.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends MessageFindFirstArgs>(args?: SelectSubset<T, MessageFindFirstArgs<ExtArgs>>): Prisma__MessageClient<$Result.GetResult<Prisma.$MessagePayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Message that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MessageFindFirstOrThrowArgs} args - Arguments to find a Message
     * @example
     * // Get one Message
     * const message = await prisma.message.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends MessageFindFirstOrThrowArgs>(args?: SelectSubset<T, MessageFindFirstOrThrowArgs<ExtArgs>>): Prisma__MessageClient<$Result.GetResult<Prisma.$MessagePayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Messages that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MessageFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Messages
     * const messages = await prisma.message.findMany()
     * 
     * // Get first 10 Messages
     * const messages = await prisma.message.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const messageWithIdOnly = await prisma.message.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends MessageFindManyArgs>(args?: SelectSubset<T, MessageFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$MessagePayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Message.
     * @param {MessageCreateArgs} args - Arguments to create a Message.
     * @example
     * // Create one Message
     * const Message = await prisma.message.create({
     *   data: {
     *     // ... data to create a Message
     *   }
     * })
     * 
     */
    create<T extends MessageCreateArgs>(args: SelectSubset<T, MessageCreateArgs<ExtArgs>>): Prisma__MessageClient<$Result.GetResult<Prisma.$MessagePayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Messages.
     * @param {MessageCreateManyArgs} args - Arguments to create many Messages.
     * @example
     * // Create many Messages
     * const message = await prisma.message.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends MessageCreateManyArgs>(args?: SelectSubset<T, MessageCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Messages and returns the data saved in the database.
     * @param {MessageCreateManyAndReturnArgs} args - Arguments to create many Messages.
     * @example
     * // Create many Messages
     * const message = await prisma.message.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Messages and only return the `id`
     * const messageWithIdOnly = await prisma.message.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends MessageCreateManyAndReturnArgs>(args?: SelectSubset<T, MessageCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$MessagePayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Message.
     * @param {MessageDeleteArgs} args - Arguments to delete one Message.
     * @example
     * // Delete one Message
     * const Message = await prisma.message.delete({
     *   where: {
     *     // ... filter to delete one Message
     *   }
     * })
     * 
     */
    delete<T extends MessageDeleteArgs>(args: SelectSubset<T, MessageDeleteArgs<ExtArgs>>): Prisma__MessageClient<$Result.GetResult<Prisma.$MessagePayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Message.
     * @param {MessageUpdateArgs} args - Arguments to update one Message.
     * @example
     * // Update one Message
     * const message = await prisma.message.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends MessageUpdateArgs>(args: SelectSubset<T, MessageUpdateArgs<ExtArgs>>): Prisma__MessageClient<$Result.GetResult<Prisma.$MessagePayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Messages.
     * @param {MessageDeleteManyArgs} args - Arguments to filter Messages to delete.
     * @example
     * // Delete a few Messages
     * const { count } = await prisma.message.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends MessageDeleteManyArgs>(args?: SelectSubset<T, MessageDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Messages.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MessageUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Messages
     * const message = await prisma.message.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends MessageUpdateManyArgs>(args: SelectSubset<T, MessageUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Messages and returns the data updated in the database.
     * @param {MessageUpdateManyAndReturnArgs} args - Arguments to update many Messages.
     * @example
     * // Update many Messages
     * const message = await prisma.message.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Messages and only return the `id`
     * const messageWithIdOnly = await prisma.message.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends MessageUpdateManyAndReturnArgs>(args: SelectSubset<T, MessageUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$MessagePayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Message.
     * @param {MessageUpsertArgs} args - Arguments to update or create a Message.
     * @example
     * // Update or create a Message
     * const message = await prisma.message.upsert({
     *   create: {
     *     // ... data to create a Message
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Message we want to update
     *   }
     * })
     */
    upsert<T extends MessageUpsertArgs>(args: SelectSubset<T, MessageUpsertArgs<ExtArgs>>): Prisma__MessageClient<$Result.GetResult<Prisma.$MessagePayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Messages.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MessageCountArgs} args - Arguments to filter Messages to count.
     * @example
     * // Count the number of Messages
     * const count = await prisma.message.count({
     *   where: {
     *     // ... the filter for the Messages we want to count
     *   }
     * })
    **/
    count<T extends MessageCountArgs>(
      args?: Subset<T, MessageCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], MessageCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Message.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MessageAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends MessageAggregateArgs>(args: Subset<T, MessageAggregateArgs>): Prisma.PrismaPromise<GetMessageAggregateType<T>>

    /**
     * Group by Message.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MessageGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends MessageGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: MessageGroupByArgs['orderBy'] }
        : { orderBy?: MessageGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, MessageGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetMessageGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Message model
   */
  readonly fields: MessageFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Message.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__MessageClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    conversation<T extends ConversationDefaultArgs<ExtArgs> = {}>(args?: Subset<T, ConversationDefaultArgs<ExtArgs>>): Prisma__ConversationClient<$Result.GetResult<Prisma.$ConversationPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    call<T extends Message$callArgs<ExtArgs> = {}>(args?: Subset<T, Message$callArgs<ExtArgs>>): Prisma__CallClient<$Result.GetResult<Prisma.$CallPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>
    taskSources<T extends Message$taskSourcesArgs<ExtArgs> = {}>(args?: Subset<T, Message$taskSourcesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TaskSourceMessagePayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    querySources<T extends Message$querySourcesArgs<ExtArgs> = {}>(args?: Subset<T, Message$querySourcesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$QuerySourceMessagePayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    knowledgeSources<T extends Message$knowledgeSourcesArgs<ExtArgs> = {}>(args?: Subset<T, Message$knowledgeSourcesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$KnowledgeSourceMessagePayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Message model
   */
  interface MessageFieldRefs {
    readonly id: FieldRef<"Message", 'String'>
    readonly role: FieldRef<"Message", 'String'>
    readonly content: FieldRef<"Message", 'String'>
    readonly time: FieldRef<"Message", 'String'>
    readonly pending: FieldRef<"Message", 'Boolean'>
    readonly createdAt: FieldRef<"Message", 'DateTime'>
    readonly updatedAt: FieldRef<"Message", 'DateTime'>
    readonly conversationId: FieldRef<"Message", 'String'>
    readonly callId: FieldRef<"Message", 'String'>
  }
    

  // Custom InputTypes
  /**
   * Message findUnique
   */
  export type MessageFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Message
     */
    select?: MessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Message
     */
    omit?: MessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MessageInclude<ExtArgs> | null
    /**
     * Filter, which Message to fetch.
     */
    where: MessageWhereUniqueInput
  }

  /**
   * Message findUniqueOrThrow
   */
  export type MessageFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Message
     */
    select?: MessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Message
     */
    omit?: MessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MessageInclude<ExtArgs> | null
    /**
     * Filter, which Message to fetch.
     */
    where: MessageWhereUniqueInput
  }

  /**
   * Message findFirst
   */
  export type MessageFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Message
     */
    select?: MessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Message
     */
    omit?: MessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MessageInclude<ExtArgs> | null
    /**
     * Filter, which Message to fetch.
     */
    where?: MessageWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Messages to fetch.
     */
    orderBy?: MessageOrderByWithRelationInput | MessageOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Messages.
     */
    cursor?: MessageWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Messages from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Messages.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Messages.
     */
    distinct?: MessageScalarFieldEnum | MessageScalarFieldEnum[]
  }

  /**
   * Message findFirstOrThrow
   */
  export type MessageFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Message
     */
    select?: MessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Message
     */
    omit?: MessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MessageInclude<ExtArgs> | null
    /**
     * Filter, which Message to fetch.
     */
    where?: MessageWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Messages to fetch.
     */
    orderBy?: MessageOrderByWithRelationInput | MessageOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Messages.
     */
    cursor?: MessageWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Messages from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Messages.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Messages.
     */
    distinct?: MessageScalarFieldEnum | MessageScalarFieldEnum[]
  }

  /**
   * Message findMany
   */
  export type MessageFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Message
     */
    select?: MessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Message
     */
    omit?: MessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MessageInclude<ExtArgs> | null
    /**
     * Filter, which Messages to fetch.
     */
    where?: MessageWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Messages to fetch.
     */
    orderBy?: MessageOrderByWithRelationInput | MessageOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Messages.
     */
    cursor?: MessageWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Messages from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Messages.
     */
    skip?: number
    distinct?: MessageScalarFieldEnum | MessageScalarFieldEnum[]
  }

  /**
   * Message create
   */
  export type MessageCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Message
     */
    select?: MessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Message
     */
    omit?: MessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MessageInclude<ExtArgs> | null
    /**
     * The data needed to create a Message.
     */
    data: XOR<MessageCreateInput, MessageUncheckedCreateInput>
  }

  /**
   * Message createMany
   */
  export type MessageCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Messages.
     */
    data: MessageCreateManyInput | MessageCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Message createManyAndReturn
   */
  export type MessageCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Message
     */
    select?: MessageSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Message
     */
    omit?: MessageOmit<ExtArgs> | null
    /**
     * The data used to create many Messages.
     */
    data: MessageCreateManyInput | MessageCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MessageIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Message update
   */
  export type MessageUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Message
     */
    select?: MessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Message
     */
    omit?: MessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MessageInclude<ExtArgs> | null
    /**
     * The data needed to update a Message.
     */
    data: XOR<MessageUpdateInput, MessageUncheckedUpdateInput>
    /**
     * Choose, which Message to update.
     */
    where: MessageWhereUniqueInput
  }

  /**
   * Message updateMany
   */
  export type MessageUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Messages.
     */
    data: XOR<MessageUpdateManyMutationInput, MessageUncheckedUpdateManyInput>
    /**
     * Filter which Messages to update
     */
    where?: MessageWhereInput
    /**
     * Limit how many Messages to update.
     */
    limit?: number
  }

  /**
   * Message updateManyAndReturn
   */
  export type MessageUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Message
     */
    select?: MessageSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Message
     */
    omit?: MessageOmit<ExtArgs> | null
    /**
     * The data used to update Messages.
     */
    data: XOR<MessageUpdateManyMutationInput, MessageUncheckedUpdateManyInput>
    /**
     * Filter which Messages to update
     */
    where?: MessageWhereInput
    /**
     * Limit how many Messages to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MessageIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * Message upsert
   */
  export type MessageUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Message
     */
    select?: MessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Message
     */
    omit?: MessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MessageInclude<ExtArgs> | null
    /**
     * The filter to search for the Message to update in case it exists.
     */
    where: MessageWhereUniqueInput
    /**
     * In case the Message found by the `where` argument doesn't exist, create a new Message with this data.
     */
    create: XOR<MessageCreateInput, MessageUncheckedCreateInput>
    /**
     * In case the Message was found with the provided `where` argument, update it with this data.
     */
    update: XOR<MessageUpdateInput, MessageUncheckedUpdateInput>
  }

  /**
   * Message delete
   */
  export type MessageDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Message
     */
    select?: MessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Message
     */
    omit?: MessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MessageInclude<ExtArgs> | null
    /**
     * Filter which Message to delete.
     */
    where: MessageWhereUniqueInput
  }

  /**
   * Message deleteMany
   */
  export type MessageDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Messages to delete
     */
    where?: MessageWhereInput
    /**
     * Limit how many Messages to delete.
     */
    limit?: number
  }

  /**
   * Message.call
   */
  export type Message$callArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Call
     */
    select?: CallSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Call
     */
    omit?: CallOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CallInclude<ExtArgs> | null
    where?: CallWhereInput
  }

  /**
   * Message.taskSources
   */
  export type Message$taskSourcesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TaskSourceMessage
     */
    select?: TaskSourceMessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TaskSourceMessage
     */
    omit?: TaskSourceMessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TaskSourceMessageInclude<ExtArgs> | null
    where?: TaskSourceMessageWhereInput
    orderBy?: TaskSourceMessageOrderByWithRelationInput | TaskSourceMessageOrderByWithRelationInput[]
    cursor?: TaskSourceMessageWhereUniqueInput
    take?: number
    skip?: number
    distinct?: TaskSourceMessageScalarFieldEnum | TaskSourceMessageScalarFieldEnum[]
  }

  /**
   * Message.querySources
   */
  export type Message$querySourcesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QuerySourceMessage
     */
    select?: QuerySourceMessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the QuerySourceMessage
     */
    omit?: QuerySourceMessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuerySourceMessageInclude<ExtArgs> | null
    where?: QuerySourceMessageWhereInput
    orderBy?: QuerySourceMessageOrderByWithRelationInput | QuerySourceMessageOrderByWithRelationInput[]
    cursor?: QuerySourceMessageWhereUniqueInput
    take?: number
    skip?: number
    distinct?: QuerySourceMessageScalarFieldEnum | QuerySourceMessageScalarFieldEnum[]
  }

  /**
   * Message.knowledgeSources
   */
  export type Message$knowledgeSourcesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the KnowledgeSourceMessage
     */
    select?: KnowledgeSourceMessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the KnowledgeSourceMessage
     */
    omit?: KnowledgeSourceMessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: KnowledgeSourceMessageInclude<ExtArgs> | null
    where?: KnowledgeSourceMessageWhereInput
    orderBy?: KnowledgeSourceMessageOrderByWithRelationInput | KnowledgeSourceMessageOrderByWithRelationInput[]
    cursor?: KnowledgeSourceMessageWhereUniqueInput
    take?: number
    skip?: number
    distinct?: KnowledgeSourceMessageScalarFieldEnum | KnowledgeSourceMessageScalarFieldEnum[]
  }

  /**
   * Message without action
   */
  export type MessageDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Message
     */
    select?: MessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Message
     */
    omit?: MessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MessageInclude<ExtArgs> | null
  }


  /**
   * Model History
   */

  export type AggregateHistory = {
    _count: HistoryCountAggregateOutputType | null
    _min: HistoryMinAggregateOutputType | null
    _max: HistoryMaxAggregateOutputType | null
  }

  export type HistoryMinAggregateOutputType = {
    id: string | null
    title: string | null
    detail: string | null
    status: string | null
    time: string | null
    createdAt: Date | null
    updatedAt: Date | null
    conversationId: string | null
  }

  export type HistoryMaxAggregateOutputType = {
    id: string | null
    title: string | null
    detail: string | null
    status: string | null
    time: string | null
    createdAt: Date | null
    updatedAt: Date | null
    conversationId: string | null
  }

  export type HistoryCountAggregateOutputType = {
    id: number
    title: number
    detail: number
    status: number
    time: number
    createdAt: number
    updatedAt: number
    conversationId: number
    _all: number
  }


  export type HistoryMinAggregateInputType = {
    id?: true
    title?: true
    detail?: true
    status?: true
    time?: true
    createdAt?: true
    updatedAt?: true
    conversationId?: true
  }

  export type HistoryMaxAggregateInputType = {
    id?: true
    title?: true
    detail?: true
    status?: true
    time?: true
    createdAt?: true
    updatedAt?: true
    conversationId?: true
  }

  export type HistoryCountAggregateInputType = {
    id?: true
    title?: true
    detail?: true
    status?: true
    time?: true
    createdAt?: true
    updatedAt?: true
    conversationId?: true
    _all?: true
  }

  export type HistoryAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which History to aggregate.
     */
    where?: HistoryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Histories to fetch.
     */
    orderBy?: HistoryOrderByWithRelationInput | HistoryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: HistoryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Histories from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Histories.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Histories
    **/
    _count?: true | HistoryCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: HistoryMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: HistoryMaxAggregateInputType
  }

  export type GetHistoryAggregateType<T extends HistoryAggregateArgs> = {
        [P in keyof T & keyof AggregateHistory]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateHistory[P]>
      : GetScalarType<T[P], AggregateHistory[P]>
  }




  export type HistoryGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: HistoryWhereInput
    orderBy?: HistoryOrderByWithAggregationInput | HistoryOrderByWithAggregationInput[]
    by: HistoryScalarFieldEnum[] | HistoryScalarFieldEnum
    having?: HistoryScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: HistoryCountAggregateInputType | true
    _min?: HistoryMinAggregateInputType
    _max?: HistoryMaxAggregateInputType
  }

  export type HistoryGroupByOutputType = {
    id: string
    title: string
    detail: string
    status: string
    time: string
    createdAt: Date
    updatedAt: Date
    conversationId: string
    _count: HistoryCountAggregateOutputType | null
    _min: HistoryMinAggregateOutputType | null
    _max: HistoryMaxAggregateOutputType | null
  }

  type GetHistoryGroupByPayload<T extends HistoryGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<HistoryGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof HistoryGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], HistoryGroupByOutputType[P]>
            : GetScalarType<T[P], HistoryGroupByOutputType[P]>
        }
      >
    >


  export type HistorySelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    title?: boolean
    detail?: boolean
    status?: boolean
    time?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    conversationId?: boolean
    conversation?: boolean | ConversationDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["history"]>

  export type HistorySelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    title?: boolean
    detail?: boolean
    status?: boolean
    time?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    conversationId?: boolean
    conversation?: boolean | ConversationDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["history"]>

  export type HistorySelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    title?: boolean
    detail?: boolean
    status?: boolean
    time?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    conversationId?: boolean
    conversation?: boolean | ConversationDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["history"]>

  export type HistorySelectScalar = {
    id?: boolean
    title?: boolean
    detail?: boolean
    status?: boolean
    time?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    conversationId?: boolean
  }

  export type HistoryOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "title" | "detail" | "status" | "time" | "createdAt" | "updatedAt" | "conversationId", ExtArgs["result"]["history"]>
  export type HistoryInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    conversation?: boolean | ConversationDefaultArgs<ExtArgs>
  }
  export type HistoryIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    conversation?: boolean | ConversationDefaultArgs<ExtArgs>
  }
  export type HistoryIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    conversation?: boolean | ConversationDefaultArgs<ExtArgs>
  }

  export type $HistoryPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "History"
    objects: {
      conversation: Prisma.$ConversationPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      title: string
      detail: string
      status: string
      time: string
      createdAt: Date
      updatedAt: Date
      conversationId: string
    }, ExtArgs["result"]["history"]>
    composites: {}
  }

  type HistoryGetPayload<S extends boolean | null | undefined | HistoryDefaultArgs> = $Result.GetResult<Prisma.$HistoryPayload, S>

  type HistoryCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<HistoryFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: HistoryCountAggregateInputType | true
    }

  export interface HistoryDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['History'], meta: { name: 'History' } }
    /**
     * Find zero or one History that matches the filter.
     * @param {HistoryFindUniqueArgs} args - Arguments to find a History
     * @example
     * // Get one History
     * const history = await prisma.history.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends HistoryFindUniqueArgs>(args: SelectSubset<T, HistoryFindUniqueArgs<ExtArgs>>): Prisma__HistoryClient<$Result.GetResult<Prisma.$HistoryPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one History that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {HistoryFindUniqueOrThrowArgs} args - Arguments to find a History
     * @example
     * // Get one History
     * const history = await prisma.history.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends HistoryFindUniqueOrThrowArgs>(args: SelectSubset<T, HistoryFindUniqueOrThrowArgs<ExtArgs>>): Prisma__HistoryClient<$Result.GetResult<Prisma.$HistoryPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first History that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {HistoryFindFirstArgs} args - Arguments to find a History
     * @example
     * // Get one History
     * const history = await prisma.history.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends HistoryFindFirstArgs>(args?: SelectSubset<T, HistoryFindFirstArgs<ExtArgs>>): Prisma__HistoryClient<$Result.GetResult<Prisma.$HistoryPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first History that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {HistoryFindFirstOrThrowArgs} args - Arguments to find a History
     * @example
     * // Get one History
     * const history = await prisma.history.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends HistoryFindFirstOrThrowArgs>(args?: SelectSubset<T, HistoryFindFirstOrThrowArgs<ExtArgs>>): Prisma__HistoryClient<$Result.GetResult<Prisma.$HistoryPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Histories that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {HistoryFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Histories
     * const histories = await prisma.history.findMany()
     * 
     * // Get first 10 Histories
     * const histories = await prisma.history.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const historyWithIdOnly = await prisma.history.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends HistoryFindManyArgs>(args?: SelectSubset<T, HistoryFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$HistoryPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a History.
     * @param {HistoryCreateArgs} args - Arguments to create a History.
     * @example
     * // Create one History
     * const History = await prisma.history.create({
     *   data: {
     *     // ... data to create a History
     *   }
     * })
     * 
     */
    create<T extends HistoryCreateArgs>(args: SelectSubset<T, HistoryCreateArgs<ExtArgs>>): Prisma__HistoryClient<$Result.GetResult<Prisma.$HistoryPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Histories.
     * @param {HistoryCreateManyArgs} args - Arguments to create many Histories.
     * @example
     * // Create many Histories
     * const history = await prisma.history.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends HistoryCreateManyArgs>(args?: SelectSubset<T, HistoryCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Histories and returns the data saved in the database.
     * @param {HistoryCreateManyAndReturnArgs} args - Arguments to create many Histories.
     * @example
     * // Create many Histories
     * const history = await prisma.history.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Histories and only return the `id`
     * const historyWithIdOnly = await prisma.history.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends HistoryCreateManyAndReturnArgs>(args?: SelectSubset<T, HistoryCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$HistoryPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a History.
     * @param {HistoryDeleteArgs} args - Arguments to delete one History.
     * @example
     * // Delete one History
     * const History = await prisma.history.delete({
     *   where: {
     *     // ... filter to delete one History
     *   }
     * })
     * 
     */
    delete<T extends HistoryDeleteArgs>(args: SelectSubset<T, HistoryDeleteArgs<ExtArgs>>): Prisma__HistoryClient<$Result.GetResult<Prisma.$HistoryPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one History.
     * @param {HistoryUpdateArgs} args - Arguments to update one History.
     * @example
     * // Update one History
     * const history = await prisma.history.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends HistoryUpdateArgs>(args: SelectSubset<T, HistoryUpdateArgs<ExtArgs>>): Prisma__HistoryClient<$Result.GetResult<Prisma.$HistoryPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Histories.
     * @param {HistoryDeleteManyArgs} args - Arguments to filter Histories to delete.
     * @example
     * // Delete a few Histories
     * const { count } = await prisma.history.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends HistoryDeleteManyArgs>(args?: SelectSubset<T, HistoryDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Histories.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {HistoryUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Histories
     * const history = await prisma.history.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends HistoryUpdateManyArgs>(args: SelectSubset<T, HistoryUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Histories and returns the data updated in the database.
     * @param {HistoryUpdateManyAndReturnArgs} args - Arguments to update many Histories.
     * @example
     * // Update many Histories
     * const history = await prisma.history.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Histories and only return the `id`
     * const historyWithIdOnly = await prisma.history.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends HistoryUpdateManyAndReturnArgs>(args: SelectSubset<T, HistoryUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$HistoryPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one History.
     * @param {HistoryUpsertArgs} args - Arguments to update or create a History.
     * @example
     * // Update or create a History
     * const history = await prisma.history.upsert({
     *   create: {
     *     // ... data to create a History
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the History we want to update
     *   }
     * })
     */
    upsert<T extends HistoryUpsertArgs>(args: SelectSubset<T, HistoryUpsertArgs<ExtArgs>>): Prisma__HistoryClient<$Result.GetResult<Prisma.$HistoryPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Histories.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {HistoryCountArgs} args - Arguments to filter Histories to count.
     * @example
     * // Count the number of Histories
     * const count = await prisma.history.count({
     *   where: {
     *     // ... the filter for the Histories we want to count
     *   }
     * })
    **/
    count<T extends HistoryCountArgs>(
      args?: Subset<T, HistoryCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], HistoryCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a History.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {HistoryAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends HistoryAggregateArgs>(args: Subset<T, HistoryAggregateArgs>): Prisma.PrismaPromise<GetHistoryAggregateType<T>>

    /**
     * Group by History.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {HistoryGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends HistoryGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: HistoryGroupByArgs['orderBy'] }
        : { orderBy?: HistoryGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, HistoryGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetHistoryGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the History model
   */
  readonly fields: HistoryFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for History.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__HistoryClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    conversation<T extends ConversationDefaultArgs<ExtArgs> = {}>(args?: Subset<T, ConversationDefaultArgs<ExtArgs>>): Prisma__ConversationClient<$Result.GetResult<Prisma.$ConversationPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the History model
   */
  interface HistoryFieldRefs {
    readonly id: FieldRef<"History", 'String'>
    readonly title: FieldRef<"History", 'String'>
    readonly detail: FieldRef<"History", 'String'>
    readonly status: FieldRef<"History", 'String'>
    readonly time: FieldRef<"History", 'String'>
    readonly createdAt: FieldRef<"History", 'DateTime'>
    readonly updatedAt: FieldRef<"History", 'DateTime'>
    readonly conversationId: FieldRef<"History", 'String'>
  }
    

  // Custom InputTypes
  /**
   * History findUnique
   */
  export type HistoryFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the History
     */
    select?: HistorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the History
     */
    omit?: HistoryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: HistoryInclude<ExtArgs> | null
    /**
     * Filter, which History to fetch.
     */
    where: HistoryWhereUniqueInput
  }

  /**
   * History findUniqueOrThrow
   */
  export type HistoryFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the History
     */
    select?: HistorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the History
     */
    omit?: HistoryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: HistoryInclude<ExtArgs> | null
    /**
     * Filter, which History to fetch.
     */
    where: HistoryWhereUniqueInput
  }

  /**
   * History findFirst
   */
  export type HistoryFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the History
     */
    select?: HistorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the History
     */
    omit?: HistoryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: HistoryInclude<ExtArgs> | null
    /**
     * Filter, which History to fetch.
     */
    where?: HistoryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Histories to fetch.
     */
    orderBy?: HistoryOrderByWithRelationInput | HistoryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Histories.
     */
    cursor?: HistoryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Histories from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Histories.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Histories.
     */
    distinct?: HistoryScalarFieldEnum | HistoryScalarFieldEnum[]
  }

  /**
   * History findFirstOrThrow
   */
  export type HistoryFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the History
     */
    select?: HistorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the History
     */
    omit?: HistoryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: HistoryInclude<ExtArgs> | null
    /**
     * Filter, which History to fetch.
     */
    where?: HistoryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Histories to fetch.
     */
    orderBy?: HistoryOrderByWithRelationInput | HistoryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Histories.
     */
    cursor?: HistoryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Histories from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Histories.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Histories.
     */
    distinct?: HistoryScalarFieldEnum | HistoryScalarFieldEnum[]
  }

  /**
   * History findMany
   */
  export type HistoryFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the History
     */
    select?: HistorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the History
     */
    omit?: HistoryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: HistoryInclude<ExtArgs> | null
    /**
     * Filter, which Histories to fetch.
     */
    where?: HistoryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Histories to fetch.
     */
    orderBy?: HistoryOrderByWithRelationInput | HistoryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Histories.
     */
    cursor?: HistoryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Histories from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Histories.
     */
    skip?: number
    distinct?: HistoryScalarFieldEnum | HistoryScalarFieldEnum[]
  }

  /**
   * History create
   */
  export type HistoryCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the History
     */
    select?: HistorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the History
     */
    omit?: HistoryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: HistoryInclude<ExtArgs> | null
    /**
     * The data needed to create a History.
     */
    data: XOR<HistoryCreateInput, HistoryUncheckedCreateInput>
  }

  /**
   * History createMany
   */
  export type HistoryCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Histories.
     */
    data: HistoryCreateManyInput | HistoryCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * History createManyAndReturn
   */
  export type HistoryCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the History
     */
    select?: HistorySelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the History
     */
    omit?: HistoryOmit<ExtArgs> | null
    /**
     * The data used to create many Histories.
     */
    data: HistoryCreateManyInput | HistoryCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: HistoryIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * History update
   */
  export type HistoryUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the History
     */
    select?: HistorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the History
     */
    omit?: HistoryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: HistoryInclude<ExtArgs> | null
    /**
     * The data needed to update a History.
     */
    data: XOR<HistoryUpdateInput, HistoryUncheckedUpdateInput>
    /**
     * Choose, which History to update.
     */
    where: HistoryWhereUniqueInput
  }

  /**
   * History updateMany
   */
  export type HistoryUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Histories.
     */
    data: XOR<HistoryUpdateManyMutationInput, HistoryUncheckedUpdateManyInput>
    /**
     * Filter which Histories to update
     */
    where?: HistoryWhereInput
    /**
     * Limit how many Histories to update.
     */
    limit?: number
  }

  /**
   * History updateManyAndReturn
   */
  export type HistoryUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the History
     */
    select?: HistorySelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the History
     */
    omit?: HistoryOmit<ExtArgs> | null
    /**
     * The data used to update Histories.
     */
    data: XOR<HistoryUpdateManyMutationInput, HistoryUncheckedUpdateManyInput>
    /**
     * Filter which Histories to update
     */
    where?: HistoryWhereInput
    /**
     * Limit how many Histories to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: HistoryIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * History upsert
   */
  export type HistoryUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the History
     */
    select?: HistorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the History
     */
    omit?: HistoryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: HistoryInclude<ExtArgs> | null
    /**
     * The filter to search for the History to update in case it exists.
     */
    where: HistoryWhereUniqueInput
    /**
     * In case the History found by the `where` argument doesn't exist, create a new History with this data.
     */
    create: XOR<HistoryCreateInput, HistoryUncheckedCreateInput>
    /**
     * In case the History was found with the provided `where` argument, update it with this data.
     */
    update: XOR<HistoryUpdateInput, HistoryUncheckedUpdateInput>
  }

  /**
   * History delete
   */
  export type HistoryDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the History
     */
    select?: HistorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the History
     */
    omit?: HistoryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: HistoryInclude<ExtArgs> | null
    /**
     * Filter which History to delete.
     */
    where: HistoryWhereUniqueInput
  }

  /**
   * History deleteMany
   */
  export type HistoryDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Histories to delete
     */
    where?: HistoryWhereInput
    /**
     * Limit how many Histories to delete.
     */
    limit?: number
  }

  /**
   * History without action
   */
  export type HistoryDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the History
     */
    select?: HistorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the History
     */
    omit?: HistoryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: HistoryInclude<ExtArgs> | null
  }


  /**
   * Model Task
   */

  export type AggregateTask = {
    _count: TaskCountAggregateOutputType | null
    _avg: TaskAvgAggregateOutputType | null
    _sum: TaskSumAggregateOutputType | null
    _min: TaskMinAggregateOutputType | null
    _max: TaskMaxAggregateOutputType | null
  }

  export type TaskAvgAggregateOutputType = {
    confidence: number | null
  }

  export type TaskSumAggregateOutputType = {
    confidence: number | null
  }

  export type TaskMinAggregateOutputType = {
    id: string | null
    title: string | null
    description: string | null
    status: string | null
    priority: string | null
    dueDate: Date | null
    confidence: number | null
    source: string | null
    createdAt: Date | null
    updatedAt: Date | null
    completedAt: Date | null
    conversationId: string | null
    contactId: string | null
  }

  export type TaskMaxAggregateOutputType = {
    id: string | null
    title: string | null
    description: string | null
    status: string | null
    priority: string | null
    dueDate: Date | null
    confidence: number | null
    source: string | null
    createdAt: Date | null
    updatedAt: Date | null
    completedAt: Date | null
    conversationId: string | null
    contactId: string | null
  }

  export type TaskCountAggregateOutputType = {
    id: number
    title: number
    description: number
    status: number
    priority: number
    dueDate: number
    confidence: number
    source: number
    createdAt: number
    updatedAt: number
    completedAt: number
    conversationId: number
    contactId: number
    _all: number
  }


  export type TaskAvgAggregateInputType = {
    confidence?: true
  }

  export type TaskSumAggregateInputType = {
    confidence?: true
  }

  export type TaskMinAggregateInputType = {
    id?: true
    title?: true
    description?: true
    status?: true
    priority?: true
    dueDate?: true
    confidence?: true
    source?: true
    createdAt?: true
    updatedAt?: true
    completedAt?: true
    conversationId?: true
    contactId?: true
  }

  export type TaskMaxAggregateInputType = {
    id?: true
    title?: true
    description?: true
    status?: true
    priority?: true
    dueDate?: true
    confidence?: true
    source?: true
    createdAt?: true
    updatedAt?: true
    completedAt?: true
    conversationId?: true
    contactId?: true
  }

  export type TaskCountAggregateInputType = {
    id?: true
    title?: true
    description?: true
    status?: true
    priority?: true
    dueDate?: true
    confidence?: true
    source?: true
    createdAt?: true
    updatedAt?: true
    completedAt?: true
    conversationId?: true
    contactId?: true
    _all?: true
  }

  export type TaskAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Task to aggregate.
     */
    where?: TaskWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Tasks to fetch.
     */
    orderBy?: TaskOrderByWithRelationInput | TaskOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: TaskWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Tasks from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Tasks.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Tasks
    **/
    _count?: true | TaskCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: TaskAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: TaskSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: TaskMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: TaskMaxAggregateInputType
  }

  export type GetTaskAggregateType<T extends TaskAggregateArgs> = {
        [P in keyof T & keyof AggregateTask]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateTask[P]>
      : GetScalarType<T[P], AggregateTask[P]>
  }




  export type TaskGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: TaskWhereInput
    orderBy?: TaskOrderByWithAggregationInput | TaskOrderByWithAggregationInput[]
    by: TaskScalarFieldEnum[] | TaskScalarFieldEnum
    having?: TaskScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: TaskCountAggregateInputType | true
    _avg?: TaskAvgAggregateInputType
    _sum?: TaskSumAggregateInputType
    _min?: TaskMinAggregateInputType
    _max?: TaskMaxAggregateInputType
  }

  export type TaskGroupByOutputType = {
    id: string
    title: string
    description: string | null
    status: string
    priority: string
    dueDate: Date | null
    confidence: number
    source: string
    createdAt: Date
    updatedAt: Date
    completedAt: Date | null
    conversationId: string
    contactId: string
    _count: TaskCountAggregateOutputType | null
    _avg: TaskAvgAggregateOutputType | null
    _sum: TaskSumAggregateOutputType | null
    _min: TaskMinAggregateOutputType | null
    _max: TaskMaxAggregateOutputType | null
  }

  type GetTaskGroupByPayload<T extends TaskGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<TaskGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof TaskGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], TaskGroupByOutputType[P]>
            : GetScalarType<T[P], TaskGroupByOutputType[P]>
        }
      >
    >


  export type TaskSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    title?: boolean
    description?: boolean
    status?: boolean
    priority?: boolean
    dueDate?: boolean
    confidence?: boolean
    source?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    completedAt?: boolean
    conversationId?: boolean
    contactId?: boolean
    conversation?: boolean | ConversationDefaultArgs<ExtArgs>
    contact?: boolean | ContactDefaultArgs<ExtArgs>
    sources?: boolean | Task$sourcesArgs<ExtArgs>
    _count?: boolean | TaskCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["task"]>

  export type TaskSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    title?: boolean
    description?: boolean
    status?: boolean
    priority?: boolean
    dueDate?: boolean
    confidence?: boolean
    source?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    completedAt?: boolean
    conversationId?: boolean
    contactId?: boolean
    conversation?: boolean | ConversationDefaultArgs<ExtArgs>
    contact?: boolean | ContactDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["task"]>

  export type TaskSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    title?: boolean
    description?: boolean
    status?: boolean
    priority?: boolean
    dueDate?: boolean
    confidence?: boolean
    source?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    completedAt?: boolean
    conversationId?: boolean
    contactId?: boolean
    conversation?: boolean | ConversationDefaultArgs<ExtArgs>
    contact?: boolean | ContactDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["task"]>

  export type TaskSelectScalar = {
    id?: boolean
    title?: boolean
    description?: boolean
    status?: boolean
    priority?: boolean
    dueDate?: boolean
    confidence?: boolean
    source?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    completedAt?: boolean
    conversationId?: boolean
    contactId?: boolean
  }

  export type TaskOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "title" | "description" | "status" | "priority" | "dueDate" | "confidence" | "source" | "createdAt" | "updatedAt" | "completedAt" | "conversationId" | "contactId", ExtArgs["result"]["task"]>
  export type TaskInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    conversation?: boolean | ConversationDefaultArgs<ExtArgs>
    contact?: boolean | ContactDefaultArgs<ExtArgs>
    sources?: boolean | Task$sourcesArgs<ExtArgs>
    _count?: boolean | TaskCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type TaskIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    conversation?: boolean | ConversationDefaultArgs<ExtArgs>
    contact?: boolean | ContactDefaultArgs<ExtArgs>
  }
  export type TaskIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    conversation?: boolean | ConversationDefaultArgs<ExtArgs>
    contact?: boolean | ContactDefaultArgs<ExtArgs>
  }

  export type $TaskPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Task"
    objects: {
      conversation: Prisma.$ConversationPayload<ExtArgs>
      contact: Prisma.$ContactPayload<ExtArgs>
      sources: Prisma.$TaskSourceMessagePayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      title: string
      description: string | null
      status: string
      priority: string
      dueDate: Date | null
      confidence: number
      source: string
      createdAt: Date
      updatedAt: Date
      completedAt: Date | null
      conversationId: string
      contactId: string
    }, ExtArgs["result"]["task"]>
    composites: {}
  }

  type TaskGetPayload<S extends boolean | null | undefined | TaskDefaultArgs> = $Result.GetResult<Prisma.$TaskPayload, S>

  type TaskCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<TaskFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: TaskCountAggregateInputType | true
    }

  export interface TaskDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Task'], meta: { name: 'Task' } }
    /**
     * Find zero or one Task that matches the filter.
     * @param {TaskFindUniqueArgs} args - Arguments to find a Task
     * @example
     * // Get one Task
     * const task = await prisma.task.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends TaskFindUniqueArgs>(args: SelectSubset<T, TaskFindUniqueArgs<ExtArgs>>): Prisma__TaskClient<$Result.GetResult<Prisma.$TaskPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Task that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {TaskFindUniqueOrThrowArgs} args - Arguments to find a Task
     * @example
     * // Get one Task
     * const task = await prisma.task.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends TaskFindUniqueOrThrowArgs>(args: SelectSubset<T, TaskFindUniqueOrThrowArgs<ExtArgs>>): Prisma__TaskClient<$Result.GetResult<Prisma.$TaskPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Task that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TaskFindFirstArgs} args - Arguments to find a Task
     * @example
     * // Get one Task
     * const task = await prisma.task.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends TaskFindFirstArgs>(args?: SelectSubset<T, TaskFindFirstArgs<ExtArgs>>): Prisma__TaskClient<$Result.GetResult<Prisma.$TaskPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Task that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TaskFindFirstOrThrowArgs} args - Arguments to find a Task
     * @example
     * // Get one Task
     * const task = await prisma.task.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends TaskFindFirstOrThrowArgs>(args?: SelectSubset<T, TaskFindFirstOrThrowArgs<ExtArgs>>): Prisma__TaskClient<$Result.GetResult<Prisma.$TaskPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Tasks that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TaskFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Tasks
     * const tasks = await prisma.task.findMany()
     * 
     * // Get first 10 Tasks
     * const tasks = await prisma.task.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const taskWithIdOnly = await prisma.task.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends TaskFindManyArgs>(args?: SelectSubset<T, TaskFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TaskPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Task.
     * @param {TaskCreateArgs} args - Arguments to create a Task.
     * @example
     * // Create one Task
     * const Task = await prisma.task.create({
     *   data: {
     *     // ... data to create a Task
     *   }
     * })
     * 
     */
    create<T extends TaskCreateArgs>(args: SelectSubset<T, TaskCreateArgs<ExtArgs>>): Prisma__TaskClient<$Result.GetResult<Prisma.$TaskPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Tasks.
     * @param {TaskCreateManyArgs} args - Arguments to create many Tasks.
     * @example
     * // Create many Tasks
     * const task = await prisma.task.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends TaskCreateManyArgs>(args?: SelectSubset<T, TaskCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Tasks and returns the data saved in the database.
     * @param {TaskCreateManyAndReturnArgs} args - Arguments to create many Tasks.
     * @example
     * // Create many Tasks
     * const task = await prisma.task.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Tasks and only return the `id`
     * const taskWithIdOnly = await prisma.task.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends TaskCreateManyAndReturnArgs>(args?: SelectSubset<T, TaskCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TaskPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Task.
     * @param {TaskDeleteArgs} args - Arguments to delete one Task.
     * @example
     * // Delete one Task
     * const Task = await prisma.task.delete({
     *   where: {
     *     // ... filter to delete one Task
     *   }
     * })
     * 
     */
    delete<T extends TaskDeleteArgs>(args: SelectSubset<T, TaskDeleteArgs<ExtArgs>>): Prisma__TaskClient<$Result.GetResult<Prisma.$TaskPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Task.
     * @param {TaskUpdateArgs} args - Arguments to update one Task.
     * @example
     * // Update one Task
     * const task = await prisma.task.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends TaskUpdateArgs>(args: SelectSubset<T, TaskUpdateArgs<ExtArgs>>): Prisma__TaskClient<$Result.GetResult<Prisma.$TaskPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Tasks.
     * @param {TaskDeleteManyArgs} args - Arguments to filter Tasks to delete.
     * @example
     * // Delete a few Tasks
     * const { count } = await prisma.task.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends TaskDeleteManyArgs>(args?: SelectSubset<T, TaskDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Tasks.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TaskUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Tasks
     * const task = await prisma.task.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends TaskUpdateManyArgs>(args: SelectSubset<T, TaskUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Tasks and returns the data updated in the database.
     * @param {TaskUpdateManyAndReturnArgs} args - Arguments to update many Tasks.
     * @example
     * // Update many Tasks
     * const task = await prisma.task.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Tasks and only return the `id`
     * const taskWithIdOnly = await prisma.task.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends TaskUpdateManyAndReturnArgs>(args: SelectSubset<T, TaskUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TaskPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Task.
     * @param {TaskUpsertArgs} args - Arguments to update or create a Task.
     * @example
     * // Update or create a Task
     * const task = await prisma.task.upsert({
     *   create: {
     *     // ... data to create a Task
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Task we want to update
     *   }
     * })
     */
    upsert<T extends TaskUpsertArgs>(args: SelectSubset<T, TaskUpsertArgs<ExtArgs>>): Prisma__TaskClient<$Result.GetResult<Prisma.$TaskPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Tasks.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TaskCountArgs} args - Arguments to filter Tasks to count.
     * @example
     * // Count the number of Tasks
     * const count = await prisma.task.count({
     *   where: {
     *     // ... the filter for the Tasks we want to count
     *   }
     * })
    **/
    count<T extends TaskCountArgs>(
      args?: Subset<T, TaskCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], TaskCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Task.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TaskAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends TaskAggregateArgs>(args: Subset<T, TaskAggregateArgs>): Prisma.PrismaPromise<GetTaskAggregateType<T>>

    /**
     * Group by Task.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TaskGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends TaskGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: TaskGroupByArgs['orderBy'] }
        : { orderBy?: TaskGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, TaskGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetTaskGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Task model
   */
  readonly fields: TaskFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Task.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__TaskClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    conversation<T extends ConversationDefaultArgs<ExtArgs> = {}>(args?: Subset<T, ConversationDefaultArgs<ExtArgs>>): Prisma__ConversationClient<$Result.GetResult<Prisma.$ConversationPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    contact<T extends ContactDefaultArgs<ExtArgs> = {}>(args?: Subset<T, ContactDefaultArgs<ExtArgs>>): Prisma__ContactClient<$Result.GetResult<Prisma.$ContactPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    sources<T extends Task$sourcesArgs<ExtArgs> = {}>(args?: Subset<T, Task$sourcesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TaskSourceMessagePayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Task model
   */
  interface TaskFieldRefs {
    readonly id: FieldRef<"Task", 'String'>
    readonly title: FieldRef<"Task", 'String'>
    readonly description: FieldRef<"Task", 'String'>
    readonly status: FieldRef<"Task", 'String'>
    readonly priority: FieldRef<"Task", 'String'>
    readonly dueDate: FieldRef<"Task", 'DateTime'>
    readonly confidence: FieldRef<"Task", 'Float'>
    readonly source: FieldRef<"Task", 'String'>
    readonly createdAt: FieldRef<"Task", 'DateTime'>
    readonly updatedAt: FieldRef<"Task", 'DateTime'>
    readonly completedAt: FieldRef<"Task", 'DateTime'>
    readonly conversationId: FieldRef<"Task", 'String'>
    readonly contactId: FieldRef<"Task", 'String'>
  }
    

  // Custom InputTypes
  /**
   * Task findUnique
   */
  export type TaskFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Task
     */
    select?: TaskSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Task
     */
    omit?: TaskOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TaskInclude<ExtArgs> | null
    /**
     * Filter, which Task to fetch.
     */
    where: TaskWhereUniqueInput
  }

  /**
   * Task findUniqueOrThrow
   */
  export type TaskFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Task
     */
    select?: TaskSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Task
     */
    omit?: TaskOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TaskInclude<ExtArgs> | null
    /**
     * Filter, which Task to fetch.
     */
    where: TaskWhereUniqueInput
  }

  /**
   * Task findFirst
   */
  export type TaskFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Task
     */
    select?: TaskSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Task
     */
    omit?: TaskOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TaskInclude<ExtArgs> | null
    /**
     * Filter, which Task to fetch.
     */
    where?: TaskWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Tasks to fetch.
     */
    orderBy?: TaskOrderByWithRelationInput | TaskOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Tasks.
     */
    cursor?: TaskWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Tasks from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Tasks.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Tasks.
     */
    distinct?: TaskScalarFieldEnum | TaskScalarFieldEnum[]
  }

  /**
   * Task findFirstOrThrow
   */
  export type TaskFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Task
     */
    select?: TaskSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Task
     */
    omit?: TaskOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TaskInclude<ExtArgs> | null
    /**
     * Filter, which Task to fetch.
     */
    where?: TaskWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Tasks to fetch.
     */
    orderBy?: TaskOrderByWithRelationInput | TaskOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Tasks.
     */
    cursor?: TaskWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Tasks from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Tasks.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Tasks.
     */
    distinct?: TaskScalarFieldEnum | TaskScalarFieldEnum[]
  }

  /**
   * Task findMany
   */
  export type TaskFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Task
     */
    select?: TaskSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Task
     */
    omit?: TaskOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TaskInclude<ExtArgs> | null
    /**
     * Filter, which Tasks to fetch.
     */
    where?: TaskWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Tasks to fetch.
     */
    orderBy?: TaskOrderByWithRelationInput | TaskOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Tasks.
     */
    cursor?: TaskWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Tasks from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Tasks.
     */
    skip?: number
    distinct?: TaskScalarFieldEnum | TaskScalarFieldEnum[]
  }

  /**
   * Task create
   */
  export type TaskCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Task
     */
    select?: TaskSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Task
     */
    omit?: TaskOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TaskInclude<ExtArgs> | null
    /**
     * The data needed to create a Task.
     */
    data: XOR<TaskCreateInput, TaskUncheckedCreateInput>
  }

  /**
   * Task createMany
   */
  export type TaskCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Tasks.
     */
    data: TaskCreateManyInput | TaskCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Task createManyAndReturn
   */
  export type TaskCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Task
     */
    select?: TaskSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Task
     */
    omit?: TaskOmit<ExtArgs> | null
    /**
     * The data used to create many Tasks.
     */
    data: TaskCreateManyInput | TaskCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TaskIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Task update
   */
  export type TaskUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Task
     */
    select?: TaskSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Task
     */
    omit?: TaskOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TaskInclude<ExtArgs> | null
    /**
     * The data needed to update a Task.
     */
    data: XOR<TaskUpdateInput, TaskUncheckedUpdateInput>
    /**
     * Choose, which Task to update.
     */
    where: TaskWhereUniqueInput
  }

  /**
   * Task updateMany
   */
  export type TaskUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Tasks.
     */
    data: XOR<TaskUpdateManyMutationInput, TaskUncheckedUpdateManyInput>
    /**
     * Filter which Tasks to update
     */
    where?: TaskWhereInput
    /**
     * Limit how many Tasks to update.
     */
    limit?: number
  }

  /**
   * Task updateManyAndReturn
   */
  export type TaskUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Task
     */
    select?: TaskSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Task
     */
    omit?: TaskOmit<ExtArgs> | null
    /**
     * The data used to update Tasks.
     */
    data: XOR<TaskUpdateManyMutationInput, TaskUncheckedUpdateManyInput>
    /**
     * Filter which Tasks to update
     */
    where?: TaskWhereInput
    /**
     * Limit how many Tasks to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TaskIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * Task upsert
   */
  export type TaskUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Task
     */
    select?: TaskSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Task
     */
    omit?: TaskOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TaskInclude<ExtArgs> | null
    /**
     * The filter to search for the Task to update in case it exists.
     */
    where: TaskWhereUniqueInput
    /**
     * In case the Task found by the `where` argument doesn't exist, create a new Task with this data.
     */
    create: XOR<TaskCreateInput, TaskUncheckedCreateInput>
    /**
     * In case the Task was found with the provided `where` argument, update it with this data.
     */
    update: XOR<TaskUpdateInput, TaskUncheckedUpdateInput>
  }

  /**
   * Task delete
   */
  export type TaskDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Task
     */
    select?: TaskSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Task
     */
    omit?: TaskOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TaskInclude<ExtArgs> | null
    /**
     * Filter which Task to delete.
     */
    where: TaskWhereUniqueInput
  }

  /**
   * Task deleteMany
   */
  export type TaskDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Tasks to delete
     */
    where?: TaskWhereInput
    /**
     * Limit how many Tasks to delete.
     */
    limit?: number
  }

  /**
   * Task.sources
   */
  export type Task$sourcesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TaskSourceMessage
     */
    select?: TaskSourceMessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TaskSourceMessage
     */
    omit?: TaskSourceMessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TaskSourceMessageInclude<ExtArgs> | null
    where?: TaskSourceMessageWhereInput
    orderBy?: TaskSourceMessageOrderByWithRelationInput | TaskSourceMessageOrderByWithRelationInput[]
    cursor?: TaskSourceMessageWhereUniqueInput
    take?: number
    skip?: number
    distinct?: TaskSourceMessageScalarFieldEnum | TaskSourceMessageScalarFieldEnum[]
  }

  /**
   * Task without action
   */
  export type TaskDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Task
     */
    select?: TaskSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Task
     */
    omit?: TaskOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TaskInclude<ExtArgs> | null
  }


  /**
   * Model TaskSourceMessage
   */

  export type AggregateTaskSourceMessage = {
    _count: TaskSourceMessageCountAggregateOutputType | null
    _min: TaskSourceMessageMinAggregateOutputType | null
    _max: TaskSourceMessageMaxAggregateOutputType | null
  }

  export type TaskSourceMessageMinAggregateOutputType = {
    id: string | null
    taskId: string | null
    messageId: string | null
    role: string | null
  }

  export type TaskSourceMessageMaxAggregateOutputType = {
    id: string | null
    taskId: string | null
    messageId: string | null
    role: string | null
  }

  export type TaskSourceMessageCountAggregateOutputType = {
    id: number
    taskId: number
    messageId: number
    role: number
    _all: number
  }


  export type TaskSourceMessageMinAggregateInputType = {
    id?: true
    taskId?: true
    messageId?: true
    role?: true
  }

  export type TaskSourceMessageMaxAggregateInputType = {
    id?: true
    taskId?: true
    messageId?: true
    role?: true
  }

  export type TaskSourceMessageCountAggregateInputType = {
    id?: true
    taskId?: true
    messageId?: true
    role?: true
    _all?: true
  }

  export type TaskSourceMessageAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which TaskSourceMessage to aggregate.
     */
    where?: TaskSourceMessageWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TaskSourceMessages to fetch.
     */
    orderBy?: TaskSourceMessageOrderByWithRelationInput | TaskSourceMessageOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: TaskSourceMessageWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TaskSourceMessages from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TaskSourceMessages.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned TaskSourceMessages
    **/
    _count?: true | TaskSourceMessageCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: TaskSourceMessageMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: TaskSourceMessageMaxAggregateInputType
  }

  export type GetTaskSourceMessageAggregateType<T extends TaskSourceMessageAggregateArgs> = {
        [P in keyof T & keyof AggregateTaskSourceMessage]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateTaskSourceMessage[P]>
      : GetScalarType<T[P], AggregateTaskSourceMessage[P]>
  }




  export type TaskSourceMessageGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: TaskSourceMessageWhereInput
    orderBy?: TaskSourceMessageOrderByWithAggregationInput | TaskSourceMessageOrderByWithAggregationInput[]
    by: TaskSourceMessageScalarFieldEnum[] | TaskSourceMessageScalarFieldEnum
    having?: TaskSourceMessageScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: TaskSourceMessageCountAggregateInputType | true
    _min?: TaskSourceMessageMinAggregateInputType
    _max?: TaskSourceMessageMaxAggregateInputType
  }

  export type TaskSourceMessageGroupByOutputType = {
    id: string
    taskId: string
    messageId: string
    role: string
    _count: TaskSourceMessageCountAggregateOutputType | null
    _min: TaskSourceMessageMinAggregateOutputType | null
    _max: TaskSourceMessageMaxAggregateOutputType | null
  }

  type GetTaskSourceMessageGroupByPayload<T extends TaskSourceMessageGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<TaskSourceMessageGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof TaskSourceMessageGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], TaskSourceMessageGroupByOutputType[P]>
            : GetScalarType<T[P], TaskSourceMessageGroupByOutputType[P]>
        }
      >
    >


  export type TaskSourceMessageSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    taskId?: boolean
    messageId?: boolean
    role?: boolean
    task?: boolean | TaskDefaultArgs<ExtArgs>
    message?: boolean | MessageDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["taskSourceMessage"]>

  export type TaskSourceMessageSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    taskId?: boolean
    messageId?: boolean
    role?: boolean
    task?: boolean | TaskDefaultArgs<ExtArgs>
    message?: boolean | MessageDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["taskSourceMessage"]>

  export type TaskSourceMessageSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    taskId?: boolean
    messageId?: boolean
    role?: boolean
    task?: boolean | TaskDefaultArgs<ExtArgs>
    message?: boolean | MessageDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["taskSourceMessage"]>

  export type TaskSourceMessageSelectScalar = {
    id?: boolean
    taskId?: boolean
    messageId?: boolean
    role?: boolean
  }

  export type TaskSourceMessageOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "taskId" | "messageId" | "role", ExtArgs["result"]["taskSourceMessage"]>
  export type TaskSourceMessageInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    task?: boolean | TaskDefaultArgs<ExtArgs>
    message?: boolean | MessageDefaultArgs<ExtArgs>
  }
  export type TaskSourceMessageIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    task?: boolean | TaskDefaultArgs<ExtArgs>
    message?: boolean | MessageDefaultArgs<ExtArgs>
  }
  export type TaskSourceMessageIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    task?: boolean | TaskDefaultArgs<ExtArgs>
    message?: boolean | MessageDefaultArgs<ExtArgs>
  }

  export type $TaskSourceMessagePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "TaskSourceMessage"
    objects: {
      task: Prisma.$TaskPayload<ExtArgs>
      message: Prisma.$MessagePayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      taskId: string
      messageId: string
      role: string
    }, ExtArgs["result"]["taskSourceMessage"]>
    composites: {}
  }

  type TaskSourceMessageGetPayload<S extends boolean | null | undefined | TaskSourceMessageDefaultArgs> = $Result.GetResult<Prisma.$TaskSourceMessagePayload, S>

  type TaskSourceMessageCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<TaskSourceMessageFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: TaskSourceMessageCountAggregateInputType | true
    }

  export interface TaskSourceMessageDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['TaskSourceMessage'], meta: { name: 'TaskSourceMessage' } }
    /**
     * Find zero or one TaskSourceMessage that matches the filter.
     * @param {TaskSourceMessageFindUniqueArgs} args - Arguments to find a TaskSourceMessage
     * @example
     * // Get one TaskSourceMessage
     * const taskSourceMessage = await prisma.taskSourceMessage.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends TaskSourceMessageFindUniqueArgs>(args: SelectSubset<T, TaskSourceMessageFindUniqueArgs<ExtArgs>>): Prisma__TaskSourceMessageClient<$Result.GetResult<Prisma.$TaskSourceMessagePayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one TaskSourceMessage that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {TaskSourceMessageFindUniqueOrThrowArgs} args - Arguments to find a TaskSourceMessage
     * @example
     * // Get one TaskSourceMessage
     * const taskSourceMessage = await prisma.taskSourceMessage.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends TaskSourceMessageFindUniqueOrThrowArgs>(args: SelectSubset<T, TaskSourceMessageFindUniqueOrThrowArgs<ExtArgs>>): Prisma__TaskSourceMessageClient<$Result.GetResult<Prisma.$TaskSourceMessagePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first TaskSourceMessage that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TaskSourceMessageFindFirstArgs} args - Arguments to find a TaskSourceMessage
     * @example
     * // Get one TaskSourceMessage
     * const taskSourceMessage = await prisma.taskSourceMessage.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends TaskSourceMessageFindFirstArgs>(args?: SelectSubset<T, TaskSourceMessageFindFirstArgs<ExtArgs>>): Prisma__TaskSourceMessageClient<$Result.GetResult<Prisma.$TaskSourceMessagePayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first TaskSourceMessage that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TaskSourceMessageFindFirstOrThrowArgs} args - Arguments to find a TaskSourceMessage
     * @example
     * // Get one TaskSourceMessage
     * const taskSourceMessage = await prisma.taskSourceMessage.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends TaskSourceMessageFindFirstOrThrowArgs>(args?: SelectSubset<T, TaskSourceMessageFindFirstOrThrowArgs<ExtArgs>>): Prisma__TaskSourceMessageClient<$Result.GetResult<Prisma.$TaskSourceMessagePayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more TaskSourceMessages that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TaskSourceMessageFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all TaskSourceMessages
     * const taskSourceMessages = await prisma.taskSourceMessage.findMany()
     * 
     * // Get first 10 TaskSourceMessages
     * const taskSourceMessages = await prisma.taskSourceMessage.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const taskSourceMessageWithIdOnly = await prisma.taskSourceMessage.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends TaskSourceMessageFindManyArgs>(args?: SelectSubset<T, TaskSourceMessageFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TaskSourceMessagePayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a TaskSourceMessage.
     * @param {TaskSourceMessageCreateArgs} args - Arguments to create a TaskSourceMessage.
     * @example
     * // Create one TaskSourceMessage
     * const TaskSourceMessage = await prisma.taskSourceMessage.create({
     *   data: {
     *     // ... data to create a TaskSourceMessage
     *   }
     * })
     * 
     */
    create<T extends TaskSourceMessageCreateArgs>(args: SelectSubset<T, TaskSourceMessageCreateArgs<ExtArgs>>): Prisma__TaskSourceMessageClient<$Result.GetResult<Prisma.$TaskSourceMessagePayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many TaskSourceMessages.
     * @param {TaskSourceMessageCreateManyArgs} args - Arguments to create many TaskSourceMessages.
     * @example
     * // Create many TaskSourceMessages
     * const taskSourceMessage = await prisma.taskSourceMessage.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends TaskSourceMessageCreateManyArgs>(args?: SelectSubset<T, TaskSourceMessageCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many TaskSourceMessages and returns the data saved in the database.
     * @param {TaskSourceMessageCreateManyAndReturnArgs} args - Arguments to create many TaskSourceMessages.
     * @example
     * // Create many TaskSourceMessages
     * const taskSourceMessage = await prisma.taskSourceMessage.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many TaskSourceMessages and only return the `id`
     * const taskSourceMessageWithIdOnly = await prisma.taskSourceMessage.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends TaskSourceMessageCreateManyAndReturnArgs>(args?: SelectSubset<T, TaskSourceMessageCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TaskSourceMessagePayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a TaskSourceMessage.
     * @param {TaskSourceMessageDeleteArgs} args - Arguments to delete one TaskSourceMessage.
     * @example
     * // Delete one TaskSourceMessage
     * const TaskSourceMessage = await prisma.taskSourceMessage.delete({
     *   where: {
     *     // ... filter to delete one TaskSourceMessage
     *   }
     * })
     * 
     */
    delete<T extends TaskSourceMessageDeleteArgs>(args: SelectSubset<T, TaskSourceMessageDeleteArgs<ExtArgs>>): Prisma__TaskSourceMessageClient<$Result.GetResult<Prisma.$TaskSourceMessagePayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one TaskSourceMessage.
     * @param {TaskSourceMessageUpdateArgs} args - Arguments to update one TaskSourceMessage.
     * @example
     * // Update one TaskSourceMessage
     * const taskSourceMessage = await prisma.taskSourceMessage.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends TaskSourceMessageUpdateArgs>(args: SelectSubset<T, TaskSourceMessageUpdateArgs<ExtArgs>>): Prisma__TaskSourceMessageClient<$Result.GetResult<Prisma.$TaskSourceMessagePayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more TaskSourceMessages.
     * @param {TaskSourceMessageDeleteManyArgs} args - Arguments to filter TaskSourceMessages to delete.
     * @example
     * // Delete a few TaskSourceMessages
     * const { count } = await prisma.taskSourceMessage.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends TaskSourceMessageDeleteManyArgs>(args?: SelectSubset<T, TaskSourceMessageDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more TaskSourceMessages.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TaskSourceMessageUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many TaskSourceMessages
     * const taskSourceMessage = await prisma.taskSourceMessage.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends TaskSourceMessageUpdateManyArgs>(args: SelectSubset<T, TaskSourceMessageUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more TaskSourceMessages and returns the data updated in the database.
     * @param {TaskSourceMessageUpdateManyAndReturnArgs} args - Arguments to update many TaskSourceMessages.
     * @example
     * // Update many TaskSourceMessages
     * const taskSourceMessage = await prisma.taskSourceMessage.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more TaskSourceMessages and only return the `id`
     * const taskSourceMessageWithIdOnly = await prisma.taskSourceMessage.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends TaskSourceMessageUpdateManyAndReturnArgs>(args: SelectSubset<T, TaskSourceMessageUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TaskSourceMessagePayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one TaskSourceMessage.
     * @param {TaskSourceMessageUpsertArgs} args - Arguments to update or create a TaskSourceMessage.
     * @example
     * // Update or create a TaskSourceMessage
     * const taskSourceMessage = await prisma.taskSourceMessage.upsert({
     *   create: {
     *     // ... data to create a TaskSourceMessage
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the TaskSourceMessage we want to update
     *   }
     * })
     */
    upsert<T extends TaskSourceMessageUpsertArgs>(args: SelectSubset<T, TaskSourceMessageUpsertArgs<ExtArgs>>): Prisma__TaskSourceMessageClient<$Result.GetResult<Prisma.$TaskSourceMessagePayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of TaskSourceMessages.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TaskSourceMessageCountArgs} args - Arguments to filter TaskSourceMessages to count.
     * @example
     * // Count the number of TaskSourceMessages
     * const count = await prisma.taskSourceMessage.count({
     *   where: {
     *     // ... the filter for the TaskSourceMessages we want to count
     *   }
     * })
    **/
    count<T extends TaskSourceMessageCountArgs>(
      args?: Subset<T, TaskSourceMessageCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], TaskSourceMessageCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a TaskSourceMessage.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TaskSourceMessageAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends TaskSourceMessageAggregateArgs>(args: Subset<T, TaskSourceMessageAggregateArgs>): Prisma.PrismaPromise<GetTaskSourceMessageAggregateType<T>>

    /**
     * Group by TaskSourceMessage.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TaskSourceMessageGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends TaskSourceMessageGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: TaskSourceMessageGroupByArgs['orderBy'] }
        : { orderBy?: TaskSourceMessageGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, TaskSourceMessageGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetTaskSourceMessageGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the TaskSourceMessage model
   */
  readonly fields: TaskSourceMessageFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for TaskSourceMessage.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__TaskSourceMessageClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    task<T extends TaskDefaultArgs<ExtArgs> = {}>(args?: Subset<T, TaskDefaultArgs<ExtArgs>>): Prisma__TaskClient<$Result.GetResult<Prisma.$TaskPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    message<T extends MessageDefaultArgs<ExtArgs> = {}>(args?: Subset<T, MessageDefaultArgs<ExtArgs>>): Prisma__MessageClient<$Result.GetResult<Prisma.$MessagePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the TaskSourceMessage model
   */
  interface TaskSourceMessageFieldRefs {
    readonly id: FieldRef<"TaskSourceMessage", 'String'>
    readonly taskId: FieldRef<"TaskSourceMessage", 'String'>
    readonly messageId: FieldRef<"TaskSourceMessage", 'String'>
    readonly role: FieldRef<"TaskSourceMessage", 'String'>
  }
    

  // Custom InputTypes
  /**
   * TaskSourceMessage findUnique
   */
  export type TaskSourceMessageFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TaskSourceMessage
     */
    select?: TaskSourceMessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TaskSourceMessage
     */
    omit?: TaskSourceMessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TaskSourceMessageInclude<ExtArgs> | null
    /**
     * Filter, which TaskSourceMessage to fetch.
     */
    where: TaskSourceMessageWhereUniqueInput
  }

  /**
   * TaskSourceMessage findUniqueOrThrow
   */
  export type TaskSourceMessageFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TaskSourceMessage
     */
    select?: TaskSourceMessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TaskSourceMessage
     */
    omit?: TaskSourceMessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TaskSourceMessageInclude<ExtArgs> | null
    /**
     * Filter, which TaskSourceMessage to fetch.
     */
    where: TaskSourceMessageWhereUniqueInput
  }

  /**
   * TaskSourceMessage findFirst
   */
  export type TaskSourceMessageFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TaskSourceMessage
     */
    select?: TaskSourceMessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TaskSourceMessage
     */
    omit?: TaskSourceMessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TaskSourceMessageInclude<ExtArgs> | null
    /**
     * Filter, which TaskSourceMessage to fetch.
     */
    where?: TaskSourceMessageWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TaskSourceMessages to fetch.
     */
    orderBy?: TaskSourceMessageOrderByWithRelationInput | TaskSourceMessageOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for TaskSourceMessages.
     */
    cursor?: TaskSourceMessageWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TaskSourceMessages from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TaskSourceMessages.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of TaskSourceMessages.
     */
    distinct?: TaskSourceMessageScalarFieldEnum | TaskSourceMessageScalarFieldEnum[]
  }

  /**
   * TaskSourceMessage findFirstOrThrow
   */
  export type TaskSourceMessageFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TaskSourceMessage
     */
    select?: TaskSourceMessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TaskSourceMessage
     */
    omit?: TaskSourceMessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TaskSourceMessageInclude<ExtArgs> | null
    /**
     * Filter, which TaskSourceMessage to fetch.
     */
    where?: TaskSourceMessageWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TaskSourceMessages to fetch.
     */
    orderBy?: TaskSourceMessageOrderByWithRelationInput | TaskSourceMessageOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for TaskSourceMessages.
     */
    cursor?: TaskSourceMessageWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TaskSourceMessages from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TaskSourceMessages.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of TaskSourceMessages.
     */
    distinct?: TaskSourceMessageScalarFieldEnum | TaskSourceMessageScalarFieldEnum[]
  }

  /**
   * TaskSourceMessage findMany
   */
  export type TaskSourceMessageFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TaskSourceMessage
     */
    select?: TaskSourceMessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TaskSourceMessage
     */
    omit?: TaskSourceMessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TaskSourceMessageInclude<ExtArgs> | null
    /**
     * Filter, which TaskSourceMessages to fetch.
     */
    where?: TaskSourceMessageWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TaskSourceMessages to fetch.
     */
    orderBy?: TaskSourceMessageOrderByWithRelationInput | TaskSourceMessageOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing TaskSourceMessages.
     */
    cursor?: TaskSourceMessageWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TaskSourceMessages from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TaskSourceMessages.
     */
    skip?: number
    distinct?: TaskSourceMessageScalarFieldEnum | TaskSourceMessageScalarFieldEnum[]
  }

  /**
   * TaskSourceMessage create
   */
  export type TaskSourceMessageCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TaskSourceMessage
     */
    select?: TaskSourceMessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TaskSourceMessage
     */
    omit?: TaskSourceMessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TaskSourceMessageInclude<ExtArgs> | null
    /**
     * The data needed to create a TaskSourceMessage.
     */
    data: XOR<TaskSourceMessageCreateInput, TaskSourceMessageUncheckedCreateInput>
  }

  /**
   * TaskSourceMessage createMany
   */
  export type TaskSourceMessageCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many TaskSourceMessages.
     */
    data: TaskSourceMessageCreateManyInput | TaskSourceMessageCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * TaskSourceMessage createManyAndReturn
   */
  export type TaskSourceMessageCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TaskSourceMessage
     */
    select?: TaskSourceMessageSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the TaskSourceMessage
     */
    omit?: TaskSourceMessageOmit<ExtArgs> | null
    /**
     * The data used to create many TaskSourceMessages.
     */
    data: TaskSourceMessageCreateManyInput | TaskSourceMessageCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TaskSourceMessageIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * TaskSourceMessage update
   */
  export type TaskSourceMessageUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TaskSourceMessage
     */
    select?: TaskSourceMessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TaskSourceMessage
     */
    omit?: TaskSourceMessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TaskSourceMessageInclude<ExtArgs> | null
    /**
     * The data needed to update a TaskSourceMessage.
     */
    data: XOR<TaskSourceMessageUpdateInput, TaskSourceMessageUncheckedUpdateInput>
    /**
     * Choose, which TaskSourceMessage to update.
     */
    where: TaskSourceMessageWhereUniqueInput
  }

  /**
   * TaskSourceMessage updateMany
   */
  export type TaskSourceMessageUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update TaskSourceMessages.
     */
    data: XOR<TaskSourceMessageUpdateManyMutationInput, TaskSourceMessageUncheckedUpdateManyInput>
    /**
     * Filter which TaskSourceMessages to update
     */
    where?: TaskSourceMessageWhereInput
    /**
     * Limit how many TaskSourceMessages to update.
     */
    limit?: number
  }

  /**
   * TaskSourceMessage updateManyAndReturn
   */
  export type TaskSourceMessageUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TaskSourceMessage
     */
    select?: TaskSourceMessageSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the TaskSourceMessage
     */
    omit?: TaskSourceMessageOmit<ExtArgs> | null
    /**
     * The data used to update TaskSourceMessages.
     */
    data: XOR<TaskSourceMessageUpdateManyMutationInput, TaskSourceMessageUncheckedUpdateManyInput>
    /**
     * Filter which TaskSourceMessages to update
     */
    where?: TaskSourceMessageWhereInput
    /**
     * Limit how many TaskSourceMessages to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TaskSourceMessageIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * TaskSourceMessage upsert
   */
  export type TaskSourceMessageUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TaskSourceMessage
     */
    select?: TaskSourceMessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TaskSourceMessage
     */
    omit?: TaskSourceMessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TaskSourceMessageInclude<ExtArgs> | null
    /**
     * The filter to search for the TaskSourceMessage to update in case it exists.
     */
    where: TaskSourceMessageWhereUniqueInput
    /**
     * In case the TaskSourceMessage found by the `where` argument doesn't exist, create a new TaskSourceMessage with this data.
     */
    create: XOR<TaskSourceMessageCreateInput, TaskSourceMessageUncheckedCreateInput>
    /**
     * In case the TaskSourceMessage was found with the provided `where` argument, update it with this data.
     */
    update: XOR<TaskSourceMessageUpdateInput, TaskSourceMessageUncheckedUpdateInput>
  }

  /**
   * TaskSourceMessage delete
   */
  export type TaskSourceMessageDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TaskSourceMessage
     */
    select?: TaskSourceMessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TaskSourceMessage
     */
    omit?: TaskSourceMessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TaskSourceMessageInclude<ExtArgs> | null
    /**
     * Filter which TaskSourceMessage to delete.
     */
    where: TaskSourceMessageWhereUniqueInput
  }

  /**
   * TaskSourceMessage deleteMany
   */
  export type TaskSourceMessageDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which TaskSourceMessages to delete
     */
    where?: TaskSourceMessageWhereInput
    /**
     * Limit how many TaskSourceMessages to delete.
     */
    limit?: number
  }

  /**
   * TaskSourceMessage without action
   */
  export type TaskSourceMessageDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TaskSourceMessage
     */
    select?: TaskSourceMessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TaskSourceMessage
     */
    omit?: TaskSourceMessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TaskSourceMessageInclude<ExtArgs> | null
  }


  /**
   * Model Query
   */

  export type AggregateQuery = {
    _count: QueryCountAggregateOutputType | null
    _min: QueryMinAggregateOutputType | null
    _max: QueryMaxAggregateOutputType | null
  }

  export type QueryMinAggregateOutputType = {
    id: string | null
    question: string | null
    answer: string | null
    status: string | null
    createdAt: Date | null
    updatedAt: Date | null
    answeredAt: Date | null
    answerMessageId: string | null
    conversationId: string | null
    contactId: string | null
  }

  export type QueryMaxAggregateOutputType = {
    id: string | null
    question: string | null
    answer: string | null
    status: string | null
    createdAt: Date | null
    updatedAt: Date | null
    answeredAt: Date | null
    answerMessageId: string | null
    conversationId: string | null
    contactId: string | null
  }

  export type QueryCountAggregateOutputType = {
    id: number
    question: number
    answer: number
    status: number
    createdAt: number
    updatedAt: number
    answeredAt: number
    answerMessageId: number
    conversationId: number
    contactId: number
    _all: number
  }


  export type QueryMinAggregateInputType = {
    id?: true
    question?: true
    answer?: true
    status?: true
    createdAt?: true
    updatedAt?: true
    answeredAt?: true
    answerMessageId?: true
    conversationId?: true
    contactId?: true
  }

  export type QueryMaxAggregateInputType = {
    id?: true
    question?: true
    answer?: true
    status?: true
    createdAt?: true
    updatedAt?: true
    answeredAt?: true
    answerMessageId?: true
    conversationId?: true
    contactId?: true
  }

  export type QueryCountAggregateInputType = {
    id?: true
    question?: true
    answer?: true
    status?: true
    createdAt?: true
    updatedAt?: true
    answeredAt?: true
    answerMessageId?: true
    conversationId?: true
    contactId?: true
    _all?: true
  }

  export type QueryAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Query to aggregate.
     */
    where?: QueryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Queries to fetch.
     */
    orderBy?: QueryOrderByWithRelationInput | QueryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: QueryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Queries from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Queries.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Queries
    **/
    _count?: true | QueryCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: QueryMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: QueryMaxAggregateInputType
  }

  export type GetQueryAggregateType<T extends QueryAggregateArgs> = {
        [P in keyof T & keyof AggregateQuery]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateQuery[P]>
      : GetScalarType<T[P], AggregateQuery[P]>
  }




  export type QueryGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: QueryWhereInput
    orderBy?: QueryOrderByWithAggregationInput | QueryOrderByWithAggregationInput[]
    by: QueryScalarFieldEnum[] | QueryScalarFieldEnum
    having?: QueryScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: QueryCountAggregateInputType | true
    _min?: QueryMinAggregateInputType
    _max?: QueryMaxAggregateInputType
  }

  export type QueryGroupByOutputType = {
    id: string
    question: string
    answer: string | null
    status: string
    createdAt: Date
    updatedAt: Date
    answeredAt: Date | null
    answerMessageId: string | null
    conversationId: string
    contactId: string
    _count: QueryCountAggregateOutputType | null
    _min: QueryMinAggregateOutputType | null
    _max: QueryMaxAggregateOutputType | null
  }

  type GetQueryGroupByPayload<T extends QueryGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<QueryGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof QueryGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], QueryGroupByOutputType[P]>
            : GetScalarType<T[P], QueryGroupByOutputType[P]>
        }
      >
    >


  export type QuerySelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    question?: boolean
    answer?: boolean
    status?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    answeredAt?: boolean
    answerMessageId?: boolean
    conversationId?: boolean
    contactId?: boolean
    conversation?: boolean | ConversationDefaultArgs<ExtArgs>
    contact?: boolean | ContactDefaultArgs<ExtArgs>
    sources?: boolean | Query$sourcesArgs<ExtArgs>
    _count?: boolean | QueryCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["query"]>

  export type QuerySelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    question?: boolean
    answer?: boolean
    status?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    answeredAt?: boolean
    answerMessageId?: boolean
    conversationId?: boolean
    contactId?: boolean
    conversation?: boolean | ConversationDefaultArgs<ExtArgs>
    contact?: boolean | ContactDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["query"]>

  export type QuerySelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    question?: boolean
    answer?: boolean
    status?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    answeredAt?: boolean
    answerMessageId?: boolean
    conversationId?: boolean
    contactId?: boolean
    conversation?: boolean | ConversationDefaultArgs<ExtArgs>
    contact?: boolean | ContactDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["query"]>

  export type QuerySelectScalar = {
    id?: boolean
    question?: boolean
    answer?: boolean
    status?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    answeredAt?: boolean
    answerMessageId?: boolean
    conversationId?: boolean
    contactId?: boolean
  }

  export type QueryOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "question" | "answer" | "status" | "createdAt" | "updatedAt" | "answeredAt" | "answerMessageId" | "conversationId" | "contactId", ExtArgs["result"]["query"]>
  export type QueryInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    conversation?: boolean | ConversationDefaultArgs<ExtArgs>
    contact?: boolean | ContactDefaultArgs<ExtArgs>
    sources?: boolean | Query$sourcesArgs<ExtArgs>
    _count?: boolean | QueryCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type QueryIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    conversation?: boolean | ConversationDefaultArgs<ExtArgs>
    contact?: boolean | ContactDefaultArgs<ExtArgs>
  }
  export type QueryIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    conversation?: boolean | ConversationDefaultArgs<ExtArgs>
    contact?: boolean | ContactDefaultArgs<ExtArgs>
  }

  export type $QueryPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Query"
    objects: {
      conversation: Prisma.$ConversationPayload<ExtArgs>
      contact: Prisma.$ContactPayload<ExtArgs>
      sources: Prisma.$QuerySourceMessagePayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      question: string
      answer: string | null
      status: string
      createdAt: Date
      updatedAt: Date
      answeredAt: Date | null
      answerMessageId: string | null
      conversationId: string
      contactId: string
    }, ExtArgs["result"]["query"]>
    composites: {}
  }

  type QueryGetPayload<S extends boolean | null | undefined | QueryDefaultArgs> = $Result.GetResult<Prisma.$QueryPayload, S>

  type QueryCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<QueryFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: QueryCountAggregateInputType | true
    }

  export interface QueryDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Query'], meta: { name: 'Query' } }
    /**
     * Find zero or one Query that matches the filter.
     * @param {QueryFindUniqueArgs} args - Arguments to find a Query
     * @example
     * // Get one Query
     * const query = await prisma.query.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends QueryFindUniqueArgs>(args: SelectSubset<T, QueryFindUniqueArgs<ExtArgs>>): Prisma__QueryClient<$Result.GetResult<Prisma.$QueryPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Query that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {QueryFindUniqueOrThrowArgs} args - Arguments to find a Query
     * @example
     * // Get one Query
     * const query = await prisma.query.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends QueryFindUniqueOrThrowArgs>(args: SelectSubset<T, QueryFindUniqueOrThrowArgs<ExtArgs>>): Prisma__QueryClient<$Result.GetResult<Prisma.$QueryPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Query that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {QueryFindFirstArgs} args - Arguments to find a Query
     * @example
     * // Get one Query
     * const query = await prisma.query.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends QueryFindFirstArgs>(args?: SelectSubset<T, QueryFindFirstArgs<ExtArgs>>): Prisma__QueryClient<$Result.GetResult<Prisma.$QueryPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Query that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {QueryFindFirstOrThrowArgs} args - Arguments to find a Query
     * @example
     * // Get one Query
     * const query = await prisma.query.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends QueryFindFirstOrThrowArgs>(args?: SelectSubset<T, QueryFindFirstOrThrowArgs<ExtArgs>>): Prisma__QueryClient<$Result.GetResult<Prisma.$QueryPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Queries that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {QueryFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Queries
     * const queries = await prisma.query.findMany()
     * 
     * // Get first 10 Queries
     * const queries = await prisma.query.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const queryWithIdOnly = await prisma.query.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends QueryFindManyArgs>(args?: SelectSubset<T, QueryFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$QueryPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Query.
     * @param {QueryCreateArgs} args - Arguments to create a Query.
     * @example
     * // Create one Query
     * const Query = await prisma.query.create({
     *   data: {
     *     // ... data to create a Query
     *   }
     * })
     * 
     */
    create<T extends QueryCreateArgs>(args: SelectSubset<T, QueryCreateArgs<ExtArgs>>): Prisma__QueryClient<$Result.GetResult<Prisma.$QueryPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Queries.
     * @param {QueryCreateManyArgs} args - Arguments to create many Queries.
     * @example
     * // Create many Queries
     * const query = await prisma.query.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends QueryCreateManyArgs>(args?: SelectSubset<T, QueryCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Queries and returns the data saved in the database.
     * @param {QueryCreateManyAndReturnArgs} args - Arguments to create many Queries.
     * @example
     * // Create many Queries
     * const query = await prisma.query.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Queries and only return the `id`
     * const queryWithIdOnly = await prisma.query.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends QueryCreateManyAndReturnArgs>(args?: SelectSubset<T, QueryCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$QueryPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Query.
     * @param {QueryDeleteArgs} args - Arguments to delete one Query.
     * @example
     * // Delete one Query
     * const Query = await prisma.query.delete({
     *   where: {
     *     // ... filter to delete one Query
     *   }
     * })
     * 
     */
    delete<T extends QueryDeleteArgs>(args: SelectSubset<T, QueryDeleteArgs<ExtArgs>>): Prisma__QueryClient<$Result.GetResult<Prisma.$QueryPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Query.
     * @param {QueryUpdateArgs} args - Arguments to update one Query.
     * @example
     * // Update one Query
     * const query = await prisma.query.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends QueryUpdateArgs>(args: SelectSubset<T, QueryUpdateArgs<ExtArgs>>): Prisma__QueryClient<$Result.GetResult<Prisma.$QueryPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Queries.
     * @param {QueryDeleteManyArgs} args - Arguments to filter Queries to delete.
     * @example
     * // Delete a few Queries
     * const { count } = await prisma.query.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends QueryDeleteManyArgs>(args?: SelectSubset<T, QueryDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Queries.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {QueryUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Queries
     * const query = await prisma.query.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends QueryUpdateManyArgs>(args: SelectSubset<T, QueryUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Queries and returns the data updated in the database.
     * @param {QueryUpdateManyAndReturnArgs} args - Arguments to update many Queries.
     * @example
     * // Update many Queries
     * const query = await prisma.query.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Queries and only return the `id`
     * const queryWithIdOnly = await prisma.query.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends QueryUpdateManyAndReturnArgs>(args: SelectSubset<T, QueryUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$QueryPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Query.
     * @param {QueryUpsertArgs} args - Arguments to update or create a Query.
     * @example
     * // Update or create a Query
     * const query = await prisma.query.upsert({
     *   create: {
     *     // ... data to create a Query
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Query we want to update
     *   }
     * })
     */
    upsert<T extends QueryUpsertArgs>(args: SelectSubset<T, QueryUpsertArgs<ExtArgs>>): Prisma__QueryClient<$Result.GetResult<Prisma.$QueryPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Queries.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {QueryCountArgs} args - Arguments to filter Queries to count.
     * @example
     * // Count the number of Queries
     * const count = await prisma.query.count({
     *   where: {
     *     // ... the filter for the Queries we want to count
     *   }
     * })
    **/
    count<T extends QueryCountArgs>(
      args?: Subset<T, QueryCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], QueryCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Query.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {QueryAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends QueryAggregateArgs>(args: Subset<T, QueryAggregateArgs>): Prisma.PrismaPromise<GetQueryAggregateType<T>>

    /**
     * Group by Query.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {QueryGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends QueryGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: QueryGroupByArgs['orderBy'] }
        : { orderBy?: QueryGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, QueryGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetQueryGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Query model
   */
  readonly fields: QueryFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Query.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__QueryClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    conversation<T extends ConversationDefaultArgs<ExtArgs> = {}>(args?: Subset<T, ConversationDefaultArgs<ExtArgs>>): Prisma__ConversationClient<$Result.GetResult<Prisma.$ConversationPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    contact<T extends ContactDefaultArgs<ExtArgs> = {}>(args?: Subset<T, ContactDefaultArgs<ExtArgs>>): Prisma__ContactClient<$Result.GetResult<Prisma.$ContactPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    sources<T extends Query$sourcesArgs<ExtArgs> = {}>(args?: Subset<T, Query$sourcesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$QuerySourceMessagePayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Query model
   */
  interface QueryFieldRefs {
    readonly id: FieldRef<"Query", 'String'>
    readonly question: FieldRef<"Query", 'String'>
    readonly answer: FieldRef<"Query", 'String'>
    readonly status: FieldRef<"Query", 'String'>
    readonly createdAt: FieldRef<"Query", 'DateTime'>
    readonly updatedAt: FieldRef<"Query", 'DateTime'>
    readonly answeredAt: FieldRef<"Query", 'DateTime'>
    readonly answerMessageId: FieldRef<"Query", 'String'>
    readonly conversationId: FieldRef<"Query", 'String'>
    readonly contactId: FieldRef<"Query", 'String'>
  }
    

  // Custom InputTypes
  /**
   * Query findUnique
   */
  export type QueryFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Query
     */
    select?: QuerySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Query
     */
    omit?: QueryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QueryInclude<ExtArgs> | null
    /**
     * Filter, which Query to fetch.
     */
    where: QueryWhereUniqueInput
  }

  /**
   * Query findUniqueOrThrow
   */
  export type QueryFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Query
     */
    select?: QuerySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Query
     */
    omit?: QueryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QueryInclude<ExtArgs> | null
    /**
     * Filter, which Query to fetch.
     */
    where: QueryWhereUniqueInput
  }

  /**
   * Query findFirst
   */
  export type QueryFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Query
     */
    select?: QuerySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Query
     */
    omit?: QueryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QueryInclude<ExtArgs> | null
    /**
     * Filter, which Query to fetch.
     */
    where?: QueryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Queries to fetch.
     */
    orderBy?: QueryOrderByWithRelationInput | QueryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Queries.
     */
    cursor?: QueryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Queries from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Queries.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Queries.
     */
    distinct?: QueryScalarFieldEnum | QueryScalarFieldEnum[]
  }

  /**
   * Query findFirstOrThrow
   */
  export type QueryFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Query
     */
    select?: QuerySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Query
     */
    omit?: QueryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QueryInclude<ExtArgs> | null
    /**
     * Filter, which Query to fetch.
     */
    where?: QueryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Queries to fetch.
     */
    orderBy?: QueryOrderByWithRelationInput | QueryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Queries.
     */
    cursor?: QueryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Queries from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Queries.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Queries.
     */
    distinct?: QueryScalarFieldEnum | QueryScalarFieldEnum[]
  }

  /**
   * Query findMany
   */
  export type QueryFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Query
     */
    select?: QuerySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Query
     */
    omit?: QueryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QueryInclude<ExtArgs> | null
    /**
     * Filter, which Queries to fetch.
     */
    where?: QueryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Queries to fetch.
     */
    orderBy?: QueryOrderByWithRelationInput | QueryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Queries.
     */
    cursor?: QueryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Queries from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Queries.
     */
    skip?: number
    distinct?: QueryScalarFieldEnum | QueryScalarFieldEnum[]
  }

  /**
   * Query create
   */
  export type QueryCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Query
     */
    select?: QuerySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Query
     */
    omit?: QueryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QueryInclude<ExtArgs> | null
    /**
     * The data needed to create a Query.
     */
    data: XOR<QueryCreateInput, QueryUncheckedCreateInput>
  }

  /**
   * Query createMany
   */
  export type QueryCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Queries.
     */
    data: QueryCreateManyInput | QueryCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Query createManyAndReturn
   */
  export type QueryCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Query
     */
    select?: QuerySelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Query
     */
    omit?: QueryOmit<ExtArgs> | null
    /**
     * The data used to create many Queries.
     */
    data: QueryCreateManyInput | QueryCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QueryIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Query update
   */
  export type QueryUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Query
     */
    select?: QuerySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Query
     */
    omit?: QueryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QueryInclude<ExtArgs> | null
    /**
     * The data needed to update a Query.
     */
    data: XOR<QueryUpdateInput, QueryUncheckedUpdateInput>
    /**
     * Choose, which Query to update.
     */
    where: QueryWhereUniqueInput
  }

  /**
   * Query updateMany
   */
  export type QueryUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Queries.
     */
    data: XOR<QueryUpdateManyMutationInput, QueryUncheckedUpdateManyInput>
    /**
     * Filter which Queries to update
     */
    where?: QueryWhereInput
    /**
     * Limit how many Queries to update.
     */
    limit?: number
  }

  /**
   * Query updateManyAndReturn
   */
  export type QueryUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Query
     */
    select?: QuerySelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Query
     */
    omit?: QueryOmit<ExtArgs> | null
    /**
     * The data used to update Queries.
     */
    data: XOR<QueryUpdateManyMutationInput, QueryUncheckedUpdateManyInput>
    /**
     * Filter which Queries to update
     */
    where?: QueryWhereInput
    /**
     * Limit how many Queries to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QueryIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * Query upsert
   */
  export type QueryUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Query
     */
    select?: QuerySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Query
     */
    omit?: QueryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QueryInclude<ExtArgs> | null
    /**
     * The filter to search for the Query to update in case it exists.
     */
    where: QueryWhereUniqueInput
    /**
     * In case the Query found by the `where` argument doesn't exist, create a new Query with this data.
     */
    create: XOR<QueryCreateInput, QueryUncheckedCreateInput>
    /**
     * In case the Query was found with the provided `where` argument, update it with this data.
     */
    update: XOR<QueryUpdateInput, QueryUncheckedUpdateInput>
  }

  /**
   * Query delete
   */
  export type QueryDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Query
     */
    select?: QuerySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Query
     */
    omit?: QueryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QueryInclude<ExtArgs> | null
    /**
     * Filter which Query to delete.
     */
    where: QueryWhereUniqueInput
  }

  /**
   * Query deleteMany
   */
  export type QueryDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Queries to delete
     */
    where?: QueryWhereInput
    /**
     * Limit how many Queries to delete.
     */
    limit?: number
  }

  /**
   * Query.sources
   */
  export type Query$sourcesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QuerySourceMessage
     */
    select?: QuerySourceMessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the QuerySourceMessage
     */
    omit?: QuerySourceMessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuerySourceMessageInclude<ExtArgs> | null
    where?: QuerySourceMessageWhereInput
    orderBy?: QuerySourceMessageOrderByWithRelationInput | QuerySourceMessageOrderByWithRelationInput[]
    cursor?: QuerySourceMessageWhereUniqueInput
    take?: number
    skip?: number
    distinct?: QuerySourceMessageScalarFieldEnum | QuerySourceMessageScalarFieldEnum[]
  }

  /**
   * Query without action
   */
  export type QueryDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Query
     */
    select?: QuerySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Query
     */
    omit?: QueryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QueryInclude<ExtArgs> | null
  }


  /**
   * Model QuerySourceMessage
   */

  export type AggregateQuerySourceMessage = {
    _count: QuerySourceMessageCountAggregateOutputType | null
    _min: QuerySourceMessageMinAggregateOutputType | null
    _max: QuerySourceMessageMaxAggregateOutputType | null
  }

  export type QuerySourceMessageMinAggregateOutputType = {
    id: string | null
    queryId: string | null
    messageId: string | null
    role: string | null
  }

  export type QuerySourceMessageMaxAggregateOutputType = {
    id: string | null
    queryId: string | null
    messageId: string | null
    role: string | null
  }

  export type QuerySourceMessageCountAggregateOutputType = {
    id: number
    queryId: number
    messageId: number
    role: number
    _all: number
  }


  export type QuerySourceMessageMinAggregateInputType = {
    id?: true
    queryId?: true
    messageId?: true
    role?: true
  }

  export type QuerySourceMessageMaxAggregateInputType = {
    id?: true
    queryId?: true
    messageId?: true
    role?: true
  }

  export type QuerySourceMessageCountAggregateInputType = {
    id?: true
    queryId?: true
    messageId?: true
    role?: true
    _all?: true
  }

  export type QuerySourceMessageAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which QuerySourceMessage to aggregate.
     */
    where?: QuerySourceMessageWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of QuerySourceMessages to fetch.
     */
    orderBy?: QuerySourceMessageOrderByWithRelationInput | QuerySourceMessageOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: QuerySourceMessageWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` QuerySourceMessages from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` QuerySourceMessages.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned QuerySourceMessages
    **/
    _count?: true | QuerySourceMessageCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: QuerySourceMessageMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: QuerySourceMessageMaxAggregateInputType
  }

  export type GetQuerySourceMessageAggregateType<T extends QuerySourceMessageAggregateArgs> = {
        [P in keyof T & keyof AggregateQuerySourceMessage]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateQuerySourceMessage[P]>
      : GetScalarType<T[P], AggregateQuerySourceMessage[P]>
  }




  export type QuerySourceMessageGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: QuerySourceMessageWhereInput
    orderBy?: QuerySourceMessageOrderByWithAggregationInput | QuerySourceMessageOrderByWithAggregationInput[]
    by: QuerySourceMessageScalarFieldEnum[] | QuerySourceMessageScalarFieldEnum
    having?: QuerySourceMessageScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: QuerySourceMessageCountAggregateInputType | true
    _min?: QuerySourceMessageMinAggregateInputType
    _max?: QuerySourceMessageMaxAggregateInputType
  }

  export type QuerySourceMessageGroupByOutputType = {
    id: string
    queryId: string
    messageId: string
    role: string
    _count: QuerySourceMessageCountAggregateOutputType | null
    _min: QuerySourceMessageMinAggregateOutputType | null
    _max: QuerySourceMessageMaxAggregateOutputType | null
  }

  type GetQuerySourceMessageGroupByPayload<T extends QuerySourceMessageGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<QuerySourceMessageGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof QuerySourceMessageGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], QuerySourceMessageGroupByOutputType[P]>
            : GetScalarType<T[P], QuerySourceMessageGroupByOutputType[P]>
        }
      >
    >


  export type QuerySourceMessageSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    queryId?: boolean
    messageId?: boolean
    role?: boolean
    query?: boolean | QueryDefaultArgs<ExtArgs>
    message?: boolean | MessageDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["querySourceMessage"]>

  export type QuerySourceMessageSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    queryId?: boolean
    messageId?: boolean
    role?: boolean
    query?: boolean | QueryDefaultArgs<ExtArgs>
    message?: boolean | MessageDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["querySourceMessage"]>

  export type QuerySourceMessageSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    queryId?: boolean
    messageId?: boolean
    role?: boolean
    query?: boolean | QueryDefaultArgs<ExtArgs>
    message?: boolean | MessageDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["querySourceMessage"]>

  export type QuerySourceMessageSelectScalar = {
    id?: boolean
    queryId?: boolean
    messageId?: boolean
    role?: boolean
  }

  export type QuerySourceMessageOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "queryId" | "messageId" | "role", ExtArgs["result"]["querySourceMessage"]>
  export type QuerySourceMessageInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    query?: boolean | QueryDefaultArgs<ExtArgs>
    message?: boolean | MessageDefaultArgs<ExtArgs>
  }
  export type QuerySourceMessageIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    query?: boolean | QueryDefaultArgs<ExtArgs>
    message?: boolean | MessageDefaultArgs<ExtArgs>
  }
  export type QuerySourceMessageIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    query?: boolean | QueryDefaultArgs<ExtArgs>
    message?: boolean | MessageDefaultArgs<ExtArgs>
  }

  export type $QuerySourceMessagePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "QuerySourceMessage"
    objects: {
      query: Prisma.$QueryPayload<ExtArgs>
      message: Prisma.$MessagePayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      queryId: string
      messageId: string
      role: string
    }, ExtArgs["result"]["querySourceMessage"]>
    composites: {}
  }

  type QuerySourceMessageGetPayload<S extends boolean | null | undefined | QuerySourceMessageDefaultArgs> = $Result.GetResult<Prisma.$QuerySourceMessagePayload, S>

  type QuerySourceMessageCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<QuerySourceMessageFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: QuerySourceMessageCountAggregateInputType | true
    }

  export interface QuerySourceMessageDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['QuerySourceMessage'], meta: { name: 'QuerySourceMessage' } }
    /**
     * Find zero or one QuerySourceMessage that matches the filter.
     * @param {QuerySourceMessageFindUniqueArgs} args - Arguments to find a QuerySourceMessage
     * @example
     * // Get one QuerySourceMessage
     * const querySourceMessage = await prisma.querySourceMessage.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends QuerySourceMessageFindUniqueArgs>(args: SelectSubset<T, QuerySourceMessageFindUniqueArgs<ExtArgs>>): Prisma__QuerySourceMessageClient<$Result.GetResult<Prisma.$QuerySourceMessagePayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one QuerySourceMessage that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {QuerySourceMessageFindUniqueOrThrowArgs} args - Arguments to find a QuerySourceMessage
     * @example
     * // Get one QuerySourceMessage
     * const querySourceMessage = await prisma.querySourceMessage.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends QuerySourceMessageFindUniqueOrThrowArgs>(args: SelectSubset<T, QuerySourceMessageFindUniqueOrThrowArgs<ExtArgs>>): Prisma__QuerySourceMessageClient<$Result.GetResult<Prisma.$QuerySourceMessagePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first QuerySourceMessage that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {QuerySourceMessageFindFirstArgs} args - Arguments to find a QuerySourceMessage
     * @example
     * // Get one QuerySourceMessage
     * const querySourceMessage = await prisma.querySourceMessage.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends QuerySourceMessageFindFirstArgs>(args?: SelectSubset<T, QuerySourceMessageFindFirstArgs<ExtArgs>>): Prisma__QuerySourceMessageClient<$Result.GetResult<Prisma.$QuerySourceMessagePayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first QuerySourceMessage that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {QuerySourceMessageFindFirstOrThrowArgs} args - Arguments to find a QuerySourceMessage
     * @example
     * // Get one QuerySourceMessage
     * const querySourceMessage = await prisma.querySourceMessage.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends QuerySourceMessageFindFirstOrThrowArgs>(args?: SelectSubset<T, QuerySourceMessageFindFirstOrThrowArgs<ExtArgs>>): Prisma__QuerySourceMessageClient<$Result.GetResult<Prisma.$QuerySourceMessagePayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more QuerySourceMessages that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {QuerySourceMessageFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all QuerySourceMessages
     * const querySourceMessages = await prisma.querySourceMessage.findMany()
     * 
     * // Get first 10 QuerySourceMessages
     * const querySourceMessages = await prisma.querySourceMessage.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const querySourceMessageWithIdOnly = await prisma.querySourceMessage.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends QuerySourceMessageFindManyArgs>(args?: SelectSubset<T, QuerySourceMessageFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$QuerySourceMessagePayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a QuerySourceMessage.
     * @param {QuerySourceMessageCreateArgs} args - Arguments to create a QuerySourceMessage.
     * @example
     * // Create one QuerySourceMessage
     * const QuerySourceMessage = await prisma.querySourceMessage.create({
     *   data: {
     *     // ... data to create a QuerySourceMessage
     *   }
     * })
     * 
     */
    create<T extends QuerySourceMessageCreateArgs>(args: SelectSubset<T, QuerySourceMessageCreateArgs<ExtArgs>>): Prisma__QuerySourceMessageClient<$Result.GetResult<Prisma.$QuerySourceMessagePayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many QuerySourceMessages.
     * @param {QuerySourceMessageCreateManyArgs} args - Arguments to create many QuerySourceMessages.
     * @example
     * // Create many QuerySourceMessages
     * const querySourceMessage = await prisma.querySourceMessage.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends QuerySourceMessageCreateManyArgs>(args?: SelectSubset<T, QuerySourceMessageCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many QuerySourceMessages and returns the data saved in the database.
     * @param {QuerySourceMessageCreateManyAndReturnArgs} args - Arguments to create many QuerySourceMessages.
     * @example
     * // Create many QuerySourceMessages
     * const querySourceMessage = await prisma.querySourceMessage.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many QuerySourceMessages and only return the `id`
     * const querySourceMessageWithIdOnly = await prisma.querySourceMessage.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends QuerySourceMessageCreateManyAndReturnArgs>(args?: SelectSubset<T, QuerySourceMessageCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$QuerySourceMessagePayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a QuerySourceMessage.
     * @param {QuerySourceMessageDeleteArgs} args - Arguments to delete one QuerySourceMessage.
     * @example
     * // Delete one QuerySourceMessage
     * const QuerySourceMessage = await prisma.querySourceMessage.delete({
     *   where: {
     *     // ... filter to delete one QuerySourceMessage
     *   }
     * })
     * 
     */
    delete<T extends QuerySourceMessageDeleteArgs>(args: SelectSubset<T, QuerySourceMessageDeleteArgs<ExtArgs>>): Prisma__QuerySourceMessageClient<$Result.GetResult<Prisma.$QuerySourceMessagePayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one QuerySourceMessage.
     * @param {QuerySourceMessageUpdateArgs} args - Arguments to update one QuerySourceMessage.
     * @example
     * // Update one QuerySourceMessage
     * const querySourceMessage = await prisma.querySourceMessage.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends QuerySourceMessageUpdateArgs>(args: SelectSubset<T, QuerySourceMessageUpdateArgs<ExtArgs>>): Prisma__QuerySourceMessageClient<$Result.GetResult<Prisma.$QuerySourceMessagePayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more QuerySourceMessages.
     * @param {QuerySourceMessageDeleteManyArgs} args - Arguments to filter QuerySourceMessages to delete.
     * @example
     * // Delete a few QuerySourceMessages
     * const { count } = await prisma.querySourceMessage.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends QuerySourceMessageDeleteManyArgs>(args?: SelectSubset<T, QuerySourceMessageDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more QuerySourceMessages.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {QuerySourceMessageUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many QuerySourceMessages
     * const querySourceMessage = await prisma.querySourceMessage.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends QuerySourceMessageUpdateManyArgs>(args: SelectSubset<T, QuerySourceMessageUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more QuerySourceMessages and returns the data updated in the database.
     * @param {QuerySourceMessageUpdateManyAndReturnArgs} args - Arguments to update many QuerySourceMessages.
     * @example
     * // Update many QuerySourceMessages
     * const querySourceMessage = await prisma.querySourceMessage.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more QuerySourceMessages and only return the `id`
     * const querySourceMessageWithIdOnly = await prisma.querySourceMessage.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends QuerySourceMessageUpdateManyAndReturnArgs>(args: SelectSubset<T, QuerySourceMessageUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$QuerySourceMessagePayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one QuerySourceMessage.
     * @param {QuerySourceMessageUpsertArgs} args - Arguments to update or create a QuerySourceMessage.
     * @example
     * // Update or create a QuerySourceMessage
     * const querySourceMessage = await prisma.querySourceMessage.upsert({
     *   create: {
     *     // ... data to create a QuerySourceMessage
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the QuerySourceMessage we want to update
     *   }
     * })
     */
    upsert<T extends QuerySourceMessageUpsertArgs>(args: SelectSubset<T, QuerySourceMessageUpsertArgs<ExtArgs>>): Prisma__QuerySourceMessageClient<$Result.GetResult<Prisma.$QuerySourceMessagePayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of QuerySourceMessages.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {QuerySourceMessageCountArgs} args - Arguments to filter QuerySourceMessages to count.
     * @example
     * // Count the number of QuerySourceMessages
     * const count = await prisma.querySourceMessage.count({
     *   where: {
     *     // ... the filter for the QuerySourceMessages we want to count
     *   }
     * })
    **/
    count<T extends QuerySourceMessageCountArgs>(
      args?: Subset<T, QuerySourceMessageCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], QuerySourceMessageCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a QuerySourceMessage.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {QuerySourceMessageAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends QuerySourceMessageAggregateArgs>(args: Subset<T, QuerySourceMessageAggregateArgs>): Prisma.PrismaPromise<GetQuerySourceMessageAggregateType<T>>

    /**
     * Group by QuerySourceMessage.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {QuerySourceMessageGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends QuerySourceMessageGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: QuerySourceMessageGroupByArgs['orderBy'] }
        : { orderBy?: QuerySourceMessageGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, QuerySourceMessageGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetQuerySourceMessageGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the QuerySourceMessage model
   */
  readonly fields: QuerySourceMessageFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for QuerySourceMessage.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__QuerySourceMessageClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    query<T extends QueryDefaultArgs<ExtArgs> = {}>(args?: Subset<T, QueryDefaultArgs<ExtArgs>>): Prisma__QueryClient<$Result.GetResult<Prisma.$QueryPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    message<T extends MessageDefaultArgs<ExtArgs> = {}>(args?: Subset<T, MessageDefaultArgs<ExtArgs>>): Prisma__MessageClient<$Result.GetResult<Prisma.$MessagePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the QuerySourceMessage model
   */
  interface QuerySourceMessageFieldRefs {
    readonly id: FieldRef<"QuerySourceMessage", 'String'>
    readonly queryId: FieldRef<"QuerySourceMessage", 'String'>
    readonly messageId: FieldRef<"QuerySourceMessage", 'String'>
    readonly role: FieldRef<"QuerySourceMessage", 'String'>
  }
    

  // Custom InputTypes
  /**
   * QuerySourceMessage findUnique
   */
  export type QuerySourceMessageFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QuerySourceMessage
     */
    select?: QuerySourceMessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the QuerySourceMessage
     */
    omit?: QuerySourceMessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuerySourceMessageInclude<ExtArgs> | null
    /**
     * Filter, which QuerySourceMessage to fetch.
     */
    where: QuerySourceMessageWhereUniqueInput
  }

  /**
   * QuerySourceMessage findUniqueOrThrow
   */
  export type QuerySourceMessageFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QuerySourceMessage
     */
    select?: QuerySourceMessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the QuerySourceMessage
     */
    omit?: QuerySourceMessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuerySourceMessageInclude<ExtArgs> | null
    /**
     * Filter, which QuerySourceMessage to fetch.
     */
    where: QuerySourceMessageWhereUniqueInput
  }

  /**
   * QuerySourceMessage findFirst
   */
  export type QuerySourceMessageFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QuerySourceMessage
     */
    select?: QuerySourceMessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the QuerySourceMessage
     */
    omit?: QuerySourceMessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuerySourceMessageInclude<ExtArgs> | null
    /**
     * Filter, which QuerySourceMessage to fetch.
     */
    where?: QuerySourceMessageWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of QuerySourceMessages to fetch.
     */
    orderBy?: QuerySourceMessageOrderByWithRelationInput | QuerySourceMessageOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for QuerySourceMessages.
     */
    cursor?: QuerySourceMessageWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` QuerySourceMessages from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` QuerySourceMessages.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of QuerySourceMessages.
     */
    distinct?: QuerySourceMessageScalarFieldEnum | QuerySourceMessageScalarFieldEnum[]
  }

  /**
   * QuerySourceMessage findFirstOrThrow
   */
  export type QuerySourceMessageFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QuerySourceMessage
     */
    select?: QuerySourceMessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the QuerySourceMessage
     */
    omit?: QuerySourceMessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuerySourceMessageInclude<ExtArgs> | null
    /**
     * Filter, which QuerySourceMessage to fetch.
     */
    where?: QuerySourceMessageWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of QuerySourceMessages to fetch.
     */
    orderBy?: QuerySourceMessageOrderByWithRelationInput | QuerySourceMessageOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for QuerySourceMessages.
     */
    cursor?: QuerySourceMessageWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` QuerySourceMessages from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` QuerySourceMessages.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of QuerySourceMessages.
     */
    distinct?: QuerySourceMessageScalarFieldEnum | QuerySourceMessageScalarFieldEnum[]
  }

  /**
   * QuerySourceMessage findMany
   */
  export type QuerySourceMessageFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QuerySourceMessage
     */
    select?: QuerySourceMessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the QuerySourceMessage
     */
    omit?: QuerySourceMessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuerySourceMessageInclude<ExtArgs> | null
    /**
     * Filter, which QuerySourceMessages to fetch.
     */
    where?: QuerySourceMessageWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of QuerySourceMessages to fetch.
     */
    orderBy?: QuerySourceMessageOrderByWithRelationInput | QuerySourceMessageOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing QuerySourceMessages.
     */
    cursor?: QuerySourceMessageWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` QuerySourceMessages from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` QuerySourceMessages.
     */
    skip?: number
    distinct?: QuerySourceMessageScalarFieldEnum | QuerySourceMessageScalarFieldEnum[]
  }

  /**
   * QuerySourceMessage create
   */
  export type QuerySourceMessageCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QuerySourceMessage
     */
    select?: QuerySourceMessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the QuerySourceMessage
     */
    omit?: QuerySourceMessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuerySourceMessageInclude<ExtArgs> | null
    /**
     * The data needed to create a QuerySourceMessage.
     */
    data: XOR<QuerySourceMessageCreateInput, QuerySourceMessageUncheckedCreateInput>
  }

  /**
   * QuerySourceMessage createMany
   */
  export type QuerySourceMessageCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many QuerySourceMessages.
     */
    data: QuerySourceMessageCreateManyInput | QuerySourceMessageCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * QuerySourceMessage createManyAndReturn
   */
  export type QuerySourceMessageCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QuerySourceMessage
     */
    select?: QuerySourceMessageSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the QuerySourceMessage
     */
    omit?: QuerySourceMessageOmit<ExtArgs> | null
    /**
     * The data used to create many QuerySourceMessages.
     */
    data: QuerySourceMessageCreateManyInput | QuerySourceMessageCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuerySourceMessageIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * QuerySourceMessage update
   */
  export type QuerySourceMessageUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QuerySourceMessage
     */
    select?: QuerySourceMessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the QuerySourceMessage
     */
    omit?: QuerySourceMessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuerySourceMessageInclude<ExtArgs> | null
    /**
     * The data needed to update a QuerySourceMessage.
     */
    data: XOR<QuerySourceMessageUpdateInput, QuerySourceMessageUncheckedUpdateInput>
    /**
     * Choose, which QuerySourceMessage to update.
     */
    where: QuerySourceMessageWhereUniqueInput
  }

  /**
   * QuerySourceMessage updateMany
   */
  export type QuerySourceMessageUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update QuerySourceMessages.
     */
    data: XOR<QuerySourceMessageUpdateManyMutationInput, QuerySourceMessageUncheckedUpdateManyInput>
    /**
     * Filter which QuerySourceMessages to update
     */
    where?: QuerySourceMessageWhereInput
    /**
     * Limit how many QuerySourceMessages to update.
     */
    limit?: number
  }

  /**
   * QuerySourceMessage updateManyAndReturn
   */
  export type QuerySourceMessageUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QuerySourceMessage
     */
    select?: QuerySourceMessageSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the QuerySourceMessage
     */
    omit?: QuerySourceMessageOmit<ExtArgs> | null
    /**
     * The data used to update QuerySourceMessages.
     */
    data: XOR<QuerySourceMessageUpdateManyMutationInput, QuerySourceMessageUncheckedUpdateManyInput>
    /**
     * Filter which QuerySourceMessages to update
     */
    where?: QuerySourceMessageWhereInput
    /**
     * Limit how many QuerySourceMessages to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuerySourceMessageIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * QuerySourceMessage upsert
   */
  export type QuerySourceMessageUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QuerySourceMessage
     */
    select?: QuerySourceMessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the QuerySourceMessage
     */
    omit?: QuerySourceMessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuerySourceMessageInclude<ExtArgs> | null
    /**
     * The filter to search for the QuerySourceMessage to update in case it exists.
     */
    where: QuerySourceMessageWhereUniqueInput
    /**
     * In case the QuerySourceMessage found by the `where` argument doesn't exist, create a new QuerySourceMessage with this data.
     */
    create: XOR<QuerySourceMessageCreateInput, QuerySourceMessageUncheckedCreateInput>
    /**
     * In case the QuerySourceMessage was found with the provided `where` argument, update it with this data.
     */
    update: XOR<QuerySourceMessageUpdateInput, QuerySourceMessageUncheckedUpdateInput>
  }

  /**
   * QuerySourceMessage delete
   */
  export type QuerySourceMessageDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QuerySourceMessage
     */
    select?: QuerySourceMessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the QuerySourceMessage
     */
    omit?: QuerySourceMessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuerySourceMessageInclude<ExtArgs> | null
    /**
     * Filter which QuerySourceMessage to delete.
     */
    where: QuerySourceMessageWhereUniqueInput
  }

  /**
   * QuerySourceMessage deleteMany
   */
  export type QuerySourceMessageDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which QuerySourceMessages to delete
     */
    where?: QuerySourceMessageWhereInput
    /**
     * Limit how many QuerySourceMessages to delete.
     */
    limit?: number
  }

  /**
   * QuerySourceMessage without action
   */
  export type QuerySourceMessageDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QuerySourceMessage
     */
    select?: QuerySourceMessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the QuerySourceMessage
     */
    omit?: QuerySourceMessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuerySourceMessageInclude<ExtArgs> | null
  }


  /**
   * Model Call
   */

  export type AggregateCall = {
    _count: CallCountAggregateOutputType | null
    _avg: CallAvgAggregateOutputType | null
    _sum: CallSumAggregateOutputType | null
    _min: CallMinAggregateOutputType | null
    _max: CallMaxAggregateOutputType | null
  }

  export type CallAvgAggregateOutputType = {
    duration: number | null
  }

  export type CallSumAggregateOutputType = {
    duration: number | null
  }

  export type CallMinAggregateOutputType = {
    id: string | null
    twilioSid: string | null
    status: string | null
    direction: string | null
    duration: number | null
    startedAt: Date | null
    endedAt: Date | null
    createdAt: Date | null
    updatedAt: Date | null
    conversationId: string | null
    contactId: string | null
  }

  export type CallMaxAggregateOutputType = {
    id: string | null
    twilioSid: string | null
    status: string | null
    direction: string | null
    duration: number | null
    startedAt: Date | null
    endedAt: Date | null
    createdAt: Date | null
    updatedAt: Date | null
    conversationId: string | null
    contactId: string | null
  }

  export type CallCountAggregateOutputType = {
    id: number
    twilioSid: number
    status: number
    direction: number
    duration: number
    startedAt: number
    endedAt: number
    createdAt: number
    updatedAt: number
    conversationId: number
    contactId: number
    _all: number
  }


  export type CallAvgAggregateInputType = {
    duration?: true
  }

  export type CallSumAggregateInputType = {
    duration?: true
  }

  export type CallMinAggregateInputType = {
    id?: true
    twilioSid?: true
    status?: true
    direction?: true
    duration?: true
    startedAt?: true
    endedAt?: true
    createdAt?: true
    updatedAt?: true
    conversationId?: true
    contactId?: true
  }

  export type CallMaxAggregateInputType = {
    id?: true
    twilioSid?: true
    status?: true
    direction?: true
    duration?: true
    startedAt?: true
    endedAt?: true
    createdAt?: true
    updatedAt?: true
    conversationId?: true
    contactId?: true
  }

  export type CallCountAggregateInputType = {
    id?: true
    twilioSid?: true
    status?: true
    direction?: true
    duration?: true
    startedAt?: true
    endedAt?: true
    createdAt?: true
    updatedAt?: true
    conversationId?: true
    contactId?: true
    _all?: true
  }

  export type CallAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Call to aggregate.
     */
    where?: CallWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Calls to fetch.
     */
    orderBy?: CallOrderByWithRelationInput | CallOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: CallWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Calls from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Calls.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Calls
    **/
    _count?: true | CallCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: CallAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: CallSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: CallMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: CallMaxAggregateInputType
  }

  export type GetCallAggregateType<T extends CallAggregateArgs> = {
        [P in keyof T & keyof AggregateCall]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateCall[P]>
      : GetScalarType<T[P], AggregateCall[P]>
  }




  export type CallGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: CallWhereInput
    orderBy?: CallOrderByWithAggregationInput | CallOrderByWithAggregationInput[]
    by: CallScalarFieldEnum[] | CallScalarFieldEnum
    having?: CallScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: CallCountAggregateInputType | true
    _avg?: CallAvgAggregateInputType
    _sum?: CallSumAggregateInputType
    _min?: CallMinAggregateInputType
    _max?: CallMaxAggregateInputType
  }

  export type CallGroupByOutputType = {
    id: string
    twilioSid: string | null
    status: string
    direction: string
    duration: number | null
    startedAt: Date | null
    endedAt: Date | null
    createdAt: Date
    updatedAt: Date
    conversationId: string
    contactId: string
    _count: CallCountAggregateOutputType | null
    _avg: CallAvgAggregateOutputType | null
    _sum: CallSumAggregateOutputType | null
    _min: CallMinAggregateOutputType | null
    _max: CallMaxAggregateOutputType | null
  }

  type GetCallGroupByPayload<T extends CallGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<CallGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof CallGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], CallGroupByOutputType[P]>
            : GetScalarType<T[P], CallGroupByOutputType[P]>
        }
      >
    >


  export type CallSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    twilioSid?: boolean
    status?: boolean
    direction?: boolean
    duration?: boolean
    startedAt?: boolean
    endedAt?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    conversationId?: boolean
    contactId?: boolean
    conversation?: boolean | ConversationDefaultArgs<ExtArgs>
    contact?: boolean | ContactDefaultArgs<ExtArgs>
    messages?: boolean | Call$messagesArgs<ExtArgs>
    _count?: boolean | CallCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["call"]>

  export type CallSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    twilioSid?: boolean
    status?: boolean
    direction?: boolean
    duration?: boolean
    startedAt?: boolean
    endedAt?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    conversationId?: boolean
    contactId?: boolean
    conversation?: boolean | ConversationDefaultArgs<ExtArgs>
    contact?: boolean | ContactDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["call"]>

  export type CallSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    twilioSid?: boolean
    status?: boolean
    direction?: boolean
    duration?: boolean
    startedAt?: boolean
    endedAt?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    conversationId?: boolean
    contactId?: boolean
    conversation?: boolean | ConversationDefaultArgs<ExtArgs>
    contact?: boolean | ContactDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["call"]>

  export type CallSelectScalar = {
    id?: boolean
    twilioSid?: boolean
    status?: boolean
    direction?: boolean
    duration?: boolean
    startedAt?: boolean
    endedAt?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    conversationId?: boolean
    contactId?: boolean
  }

  export type CallOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "twilioSid" | "status" | "direction" | "duration" | "startedAt" | "endedAt" | "createdAt" | "updatedAt" | "conversationId" | "contactId", ExtArgs["result"]["call"]>
  export type CallInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    conversation?: boolean | ConversationDefaultArgs<ExtArgs>
    contact?: boolean | ContactDefaultArgs<ExtArgs>
    messages?: boolean | Call$messagesArgs<ExtArgs>
    _count?: boolean | CallCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type CallIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    conversation?: boolean | ConversationDefaultArgs<ExtArgs>
    contact?: boolean | ContactDefaultArgs<ExtArgs>
  }
  export type CallIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    conversation?: boolean | ConversationDefaultArgs<ExtArgs>
    contact?: boolean | ContactDefaultArgs<ExtArgs>
  }

  export type $CallPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Call"
    objects: {
      conversation: Prisma.$ConversationPayload<ExtArgs>
      contact: Prisma.$ContactPayload<ExtArgs>
      messages: Prisma.$MessagePayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      twilioSid: string | null
      status: string
      direction: string
      duration: number | null
      startedAt: Date | null
      endedAt: Date | null
      createdAt: Date
      updatedAt: Date
      conversationId: string
      contactId: string
    }, ExtArgs["result"]["call"]>
    composites: {}
  }

  type CallGetPayload<S extends boolean | null | undefined | CallDefaultArgs> = $Result.GetResult<Prisma.$CallPayload, S>

  type CallCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<CallFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: CallCountAggregateInputType | true
    }

  export interface CallDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Call'], meta: { name: 'Call' } }
    /**
     * Find zero or one Call that matches the filter.
     * @param {CallFindUniqueArgs} args - Arguments to find a Call
     * @example
     * // Get one Call
     * const call = await prisma.call.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends CallFindUniqueArgs>(args: SelectSubset<T, CallFindUniqueArgs<ExtArgs>>): Prisma__CallClient<$Result.GetResult<Prisma.$CallPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Call that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {CallFindUniqueOrThrowArgs} args - Arguments to find a Call
     * @example
     * // Get one Call
     * const call = await prisma.call.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends CallFindUniqueOrThrowArgs>(args: SelectSubset<T, CallFindUniqueOrThrowArgs<ExtArgs>>): Prisma__CallClient<$Result.GetResult<Prisma.$CallPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Call that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CallFindFirstArgs} args - Arguments to find a Call
     * @example
     * // Get one Call
     * const call = await prisma.call.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends CallFindFirstArgs>(args?: SelectSubset<T, CallFindFirstArgs<ExtArgs>>): Prisma__CallClient<$Result.GetResult<Prisma.$CallPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Call that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CallFindFirstOrThrowArgs} args - Arguments to find a Call
     * @example
     * // Get one Call
     * const call = await prisma.call.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends CallFindFirstOrThrowArgs>(args?: SelectSubset<T, CallFindFirstOrThrowArgs<ExtArgs>>): Prisma__CallClient<$Result.GetResult<Prisma.$CallPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Calls that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CallFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Calls
     * const calls = await prisma.call.findMany()
     * 
     * // Get first 10 Calls
     * const calls = await prisma.call.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const callWithIdOnly = await prisma.call.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends CallFindManyArgs>(args?: SelectSubset<T, CallFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CallPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Call.
     * @param {CallCreateArgs} args - Arguments to create a Call.
     * @example
     * // Create one Call
     * const Call = await prisma.call.create({
     *   data: {
     *     // ... data to create a Call
     *   }
     * })
     * 
     */
    create<T extends CallCreateArgs>(args: SelectSubset<T, CallCreateArgs<ExtArgs>>): Prisma__CallClient<$Result.GetResult<Prisma.$CallPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Calls.
     * @param {CallCreateManyArgs} args - Arguments to create many Calls.
     * @example
     * // Create many Calls
     * const call = await prisma.call.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends CallCreateManyArgs>(args?: SelectSubset<T, CallCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Calls and returns the data saved in the database.
     * @param {CallCreateManyAndReturnArgs} args - Arguments to create many Calls.
     * @example
     * // Create many Calls
     * const call = await prisma.call.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Calls and only return the `id`
     * const callWithIdOnly = await prisma.call.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends CallCreateManyAndReturnArgs>(args?: SelectSubset<T, CallCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CallPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Call.
     * @param {CallDeleteArgs} args - Arguments to delete one Call.
     * @example
     * // Delete one Call
     * const Call = await prisma.call.delete({
     *   where: {
     *     // ... filter to delete one Call
     *   }
     * })
     * 
     */
    delete<T extends CallDeleteArgs>(args: SelectSubset<T, CallDeleteArgs<ExtArgs>>): Prisma__CallClient<$Result.GetResult<Prisma.$CallPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Call.
     * @param {CallUpdateArgs} args - Arguments to update one Call.
     * @example
     * // Update one Call
     * const call = await prisma.call.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends CallUpdateArgs>(args: SelectSubset<T, CallUpdateArgs<ExtArgs>>): Prisma__CallClient<$Result.GetResult<Prisma.$CallPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Calls.
     * @param {CallDeleteManyArgs} args - Arguments to filter Calls to delete.
     * @example
     * // Delete a few Calls
     * const { count } = await prisma.call.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends CallDeleteManyArgs>(args?: SelectSubset<T, CallDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Calls.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CallUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Calls
     * const call = await prisma.call.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends CallUpdateManyArgs>(args: SelectSubset<T, CallUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Calls and returns the data updated in the database.
     * @param {CallUpdateManyAndReturnArgs} args - Arguments to update many Calls.
     * @example
     * // Update many Calls
     * const call = await prisma.call.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Calls and only return the `id`
     * const callWithIdOnly = await prisma.call.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends CallUpdateManyAndReturnArgs>(args: SelectSubset<T, CallUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CallPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Call.
     * @param {CallUpsertArgs} args - Arguments to update or create a Call.
     * @example
     * // Update or create a Call
     * const call = await prisma.call.upsert({
     *   create: {
     *     // ... data to create a Call
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Call we want to update
     *   }
     * })
     */
    upsert<T extends CallUpsertArgs>(args: SelectSubset<T, CallUpsertArgs<ExtArgs>>): Prisma__CallClient<$Result.GetResult<Prisma.$CallPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Calls.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CallCountArgs} args - Arguments to filter Calls to count.
     * @example
     * // Count the number of Calls
     * const count = await prisma.call.count({
     *   where: {
     *     // ... the filter for the Calls we want to count
     *   }
     * })
    **/
    count<T extends CallCountArgs>(
      args?: Subset<T, CallCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], CallCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Call.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CallAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends CallAggregateArgs>(args: Subset<T, CallAggregateArgs>): Prisma.PrismaPromise<GetCallAggregateType<T>>

    /**
     * Group by Call.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CallGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends CallGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: CallGroupByArgs['orderBy'] }
        : { orderBy?: CallGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, CallGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetCallGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Call model
   */
  readonly fields: CallFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Call.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__CallClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    conversation<T extends ConversationDefaultArgs<ExtArgs> = {}>(args?: Subset<T, ConversationDefaultArgs<ExtArgs>>): Prisma__ConversationClient<$Result.GetResult<Prisma.$ConversationPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    contact<T extends ContactDefaultArgs<ExtArgs> = {}>(args?: Subset<T, ContactDefaultArgs<ExtArgs>>): Prisma__ContactClient<$Result.GetResult<Prisma.$ContactPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    messages<T extends Call$messagesArgs<ExtArgs> = {}>(args?: Subset<T, Call$messagesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$MessagePayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Call model
   */
  interface CallFieldRefs {
    readonly id: FieldRef<"Call", 'String'>
    readonly twilioSid: FieldRef<"Call", 'String'>
    readonly status: FieldRef<"Call", 'String'>
    readonly direction: FieldRef<"Call", 'String'>
    readonly duration: FieldRef<"Call", 'Int'>
    readonly startedAt: FieldRef<"Call", 'DateTime'>
    readonly endedAt: FieldRef<"Call", 'DateTime'>
    readonly createdAt: FieldRef<"Call", 'DateTime'>
    readonly updatedAt: FieldRef<"Call", 'DateTime'>
    readonly conversationId: FieldRef<"Call", 'String'>
    readonly contactId: FieldRef<"Call", 'String'>
  }
    

  // Custom InputTypes
  /**
   * Call findUnique
   */
  export type CallFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Call
     */
    select?: CallSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Call
     */
    omit?: CallOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CallInclude<ExtArgs> | null
    /**
     * Filter, which Call to fetch.
     */
    where: CallWhereUniqueInput
  }

  /**
   * Call findUniqueOrThrow
   */
  export type CallFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Call
     */
    select?: CallSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Call
     */
    omit?: CallOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CallInclude<ExtArgs> | null
    /**
     * Filter, which Call to fetch.
     */
    where: CallWhereUniqueInput
  }

  /**
   * Call findFirst
   */
  export type CallFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Call
     */
    select?: CallSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Call
     */
    omit?: CallOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CallInclude<ExtArgs> | null
    /**
     * Filter, which Call to fetch.
     */
    where?: CallWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Calls to fetch.
     */
    orderBy?: CallOrderByWithRelationInput | CallOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Calls.
     */
    cursor?: CallWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Calls from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Calls.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Calls.
     */
    distinct?: CallScalarFieldEnum | CallScalarFieldEnum[]
  }

  /**
   * Call findFirstOrThrow
   */
  export type CallFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Call
     */
    select?: CallSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Call
     */
    omit?: CallOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CallInclude<ExtArgs> | null
    /**
     * Filter, which Call to fetch.
     */
    where?: CallWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Calls to fetch.
     */
    orderBy?: CallOrderByWithRelationInput | CallOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Calls.
     */
    cursor?: CallWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Calls from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Calls.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Calls.
     */
    distinct?: CallScalarFieldEnum | CallScalarFieldEnum[]
  }

  /**
   * Call findMany
   */
  export type CallFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Call
     */
    select?: CallSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Call
     */
    omit?: CallOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CallInclude<ExtArgs> | null
    /**
     * Filter, which Calls to fetch.
     */
    where?: CallWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Calls to fetch.
     */
    orderBy?: CallOrderByWithRelationInput | CallOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Calls.
     */
    cursor?: CallWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Calls from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Calls.
     */
    skip?: number
    distinct?: CallScalarFieldEnum | CallScalarFieldEnum[]
  }

  /**
   * Call create
   */
  export type CallCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Call
     */
    select?: CallSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Call
     */
    omit?: CallOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CallInclude<ExtArgs> | null
    /**
     * The data needed to create a Call.
     */
    data: XOR<CallCreateInput, CallUncheckedCreateInput>
  }

  /**
   * Call createMany
   */
  export type CallCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Calls.
     */
    data: CallCreateManyInput | CallCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Call createManyAndReturn
   */
  export type CallCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Call
     */
    select?: CallSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Call
     */
    omit?: CallOmit<ExtArgs> | null
    /**
     * The data used to create many Calls.
     */
    data: CallCreateManyInput | CallCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CallIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Call update
   */
  export type CallUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Call
     */
    select?: CallSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Call
     */
    omit?: CallOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CallInclude<ExtArgs> | null
    /**
     * The data needed to update a Call.
     */
    data: XOR<CallUpdateInput, CallUncheckedUpdateInput>
    /**
     * Choose, which Call to update.
     */
    where: CallWhereUniqueInput
  }

  /**
   * Call updateMany
   */
  export type CallUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Calls.
     */
    data: XOR<CallUpdateManyMutationInput, CallUncheckedUpdateManyInput>
    /**
     * Filter which Calls to update
     */
    where?: CallWhereInput
    /**
     * Limit how many Calls to update.
     */
    limit?: number
  }

  /**
   * Call updateManyAndReturn
   */
  export type CallUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Call
     */
    select?: CallSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Call
     */
    omit?: CallOmit<ExtArgs> | null
    /**
     * The data used to update Calls.
     */
    data: XOR<CallUpdateManyMutationInput, CallUncheckedUpdateManyInput>
    /**
     * Filter which Calls to update
     */
    where?: CallWhereInput
    /**
     * Limit how many Calls to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CallIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * Call upsert
   */
  export type CallUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Call
     */
    select?: CallSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Call
     */
    omit?: CallOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CallInclude<ExtArgs> | null
    /**
     * The filter to search for the Call to update in case it exists.
     */
    where: CallWhereUniqueInput
    /**
     * In case the Call found by the `where` argument doesn't exist, create a new Call with this data.
     */
    create: XOR<CallCreateInput, CallUncheckedCreateInput>
    /**
     * In case the Call was found with the provided `where` argument, update it with this data.
     */
    update: XOR<CallUpdateInput, CallUncheckedUpdateInput>
  }

  /**
   * Call delete
   */
  export type CallDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Call
     */
    select?: CallSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Call
     */
    omit?: CallOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CallInclude<ExtArgs> | null
    /**
     * Filter which Call to delete.
     */
    where: CallWhereUniqueInput
  }

  /**
   * Call deleteMany
   */
  export type CallDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Calls to delete
     */
    where?: CallWhereInput
    /**
     * Limit how many Calls to delete.
     */
    limit?: number
  }

  /**
   * Call.messages
   */
  export type Call$messagesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Message
     */
    select?: MessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Message
     */
    omit?: MessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MessageInclude<ExtArgs> | null
    where?: MessageWhereInput
    orderBy?: MessageOrderByWithRelationInput | MessageOrderByWithRelationInput[]
    cursor?: MessageWhereUniqueInput
    take?: number
    skip?: number
    distinct?: MessageScalarFieldEnum | MessageScalarFieldEnum[]
  }

  /**
   * Call without action
   */
  export type CallDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Call
     */
    select?: CallSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Call
     */
    omit?: CallOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CallInclude<ExtArgs> | null
  }


  /**
   * Model Email
   */

  export type AggregateEmail = {
    _count: EmailCountAggregateOutputType | null
    _min: EmailMinAggregateOutputType | null
    _max: EmailMaxAggregateOutputType | null
  }

  export type EmailMinAggregateOutputType = {
    id: string | null
    twilioSid: string | null
    status: string | null
    direction: string | null
    subject: string | null
    from: string | null
    to: string | null
    body: string | null
    html: string | null
    sentAt: Date | null
    deliveredAt: Date | null
    createdAt: Date | null
    updatedAt: Date | null
    conversationId: string | null
    contactId: string | null
  }

  export type EmailMaxAggregateOutputType = {
    id: string | null
    twilioSid: string | null
    status: string | null
    direction: string | null
    subject: string | null
    from: string | null
    to: string | null
    body: string | null
    html: string | null
    sentAt: Date | null
    deliveredAt: Date | null
    createdAt: Date | null
    updatedAt: Date | null
    conversationId: string | null
    contactId: string | null
  }

  export type EmailCountAggregateOutputType = {
    id: number
    twilioSid: number
    status: number
    direction: number
    subject: number
    from: number
    to: number
    body: number
    html: number
    sentAt: number
    deliveredAt: number
    createdAt: number
    updatedAt: number
    conversationId: number
    contactId: number
    _all: number
  }


  export type EmailMinAggregateInputType = {
    id?: true
    twilioSid?: true
    status?: true
    direction?: true
    subject?: true
    from?: true
    to?: true
    body?: true
    html?: true
    sentAt?: true
    deliveredAt?: true
    createdAt?: true
    updatedAt?: true
    conversationId?: true
    contactId?: true
  }

  export type EmailMaxAggregateInputType = {
    id?: true
    twilioSid?: true
    status?: true
    direction?: true
    subject?: true
    from?: true
    to?: true
    body?: true
    html?: true
    sentAt?: true
    deliveredAt?: true
    createdAt?: true
    updatedAt?: true
    conversationId?: true
    contactId?: true
  }

  export type EmailCountAggregateInputType = {
    id?: true
    twilioSid?: true
    status?: true
    direction?: true
    subject?: true
    from?: true
    to?: true
    body?: true
    html?: true
    sentAt?: true
    deliveredAt?: true
    createdAt?: true
    updatedAt?: true
    conversationId?: true
    contactId?: true
    _all?: true
  }

  export type EmailAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Email to aggregate.
     */
    where?: EmailWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Emails to fetch.
     */
    orderBy?: EmailOrderByWithRelationInput | EmailOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: EmailWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Emails from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Emails.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Emails
    **/
    _count?: true | EmailCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: EmailMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: EmailMaxAggregateInputType
  }

  export type GetEmailAggregateType<T extends EmailAggregateArgs> = {
        [P in keyof T & keyof AggregateEmail]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateEmail[P]>
      : GetScalarType<T[P], AggregateEmail[P]>
  }




  export type EmailGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: EmailWhereInput
    orderBy?: EmailOrderByWithAggregationInput | EmailOrderByWithAggregationInput[]
    by: EmailScalarFieldEnum[] | EmailScalarFieldEnum
    having?: EmailScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: EmailCountAggregateInputType | true
    _min?: EmailMinAggregateInputType
    _max?: EmailMaxAggregateInputType
  }

  export type EmailGroupByOutputType = {
    id: string
    twilioSid: string | null
    status: string
    direction: string
    subject: string
    from: string
    to: string
    body: string | null
    html: string | null
    sentAt: Date | null
    deliveredAt: Date | null
    createdAt: Date
    updatedAt: Date
    conversationId: string
    contactId: string
    _count: EmailCountAggregateOutputType | null
    _min: EmailMinAggregateOutputType | null
    _max: EmailMaxAggregateOutputType | null
  }

  type GetEmailGroupByPayload<T extends EmailGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<EmailGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof EmailGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], EmailGroupByOutputType[P]>
            : GetScalarType<T[P], EmailGroupByOutputType[P]>
        }
      >
    >


  export type EmailSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    twilioSid?: boolean
    status?: boolean
    direction?: boolean
    subject?: boolean
    from?: boolean
    to?: boolean
    body?: boolean
    html?: boolean
    sentAt?: boolean
    deliveredAt?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    conversationId?: boolean
    contactId?: boolean
    conversation?: boolean | ConversationDefaultArgs<ExtArgs>
    contact?: boolean | ContactDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["email"]>

  export type EmailSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    twilioSid?: boolean
    status?: boolean
    direction?: boolean
    subject?: boolean
    from?: boolean
    to?: boolean
    body?: boolean
    html?: boolean
    sentAt?: boolean
    deliveredAt?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    conversationId?: boolean
    contactId?: boolean
    conversation?: boolean | ConversationDefaultArgs<ExtArgs>
    contact?: boolean | ContactDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["email"]>

  export type EmailSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    twilioSid?: boolean
    status?: boolean
    direction?: boolean
    subject?: boolean
    from?: boolean
    to?: boolean
    body?: boolean
    html?: boolean
    sentAt?: boolean
    deliveredAt?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    conversationId?: boolean
    contactId?: boolean
    conversation?: boolean | ConversationDefaultArgs<ExtArgs>
    contact?: boolean | ContactDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["email"]>

  export type EmailSelectScalar = {
    id?: boolean
    twilioSid?: boolean
    status?: boolean
    direction?: boolean
    subject?: boolean
    from?: boolean
    to?: boolean
    body?: boolean
    html?: boolean
    sentAt?: boolean
    deliveredAt?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    conversationId?: boolean
    contactId?: boolean
  }

  export type EmailOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "twilioSid" | "status" | "direction" | "subject" | "from" | "to" | "body" | "html" | "sentAt" | "deliveredAt" | "createdAt" | "updatedAt" | "conversationId" | "contactId", ExtArgs["result"]["email"]>
  export type EmailInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    conversation?: boolean | ConversationDefaultArgs<ExtArgs>
    contact?: boolean | ContactDefaultArgs<ExtArgs>
  }
  export type EmailIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    conversation?: boolean | ConversationDefaultArgs<ExtArgs>
    contact?: boolean | ContactDefaultArgs<ExtArgs>
  }
  export type EmailIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    conversation?: boolean | ConversationDefaultArgs<ExtArgs>
    contact?: boolean | ContactDefaultArgs<ExtArgs>
  }

  export type $EmailPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Email"
    objects: {
      conversation: Prisma.$ConversationPayload<ExtArgs>
      contact: Prisma.$ContactPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      twilioSid: string | null
      status: string
      direction: string
      subject: string
      from: string
      to: string
      body: string | null
      html: string | null
      sentAt: Date | null
      deliveredAt: Date | null
      createdAt: Date
      updatedAt: Date
      conversationId: string
      contactId: string
    }, ExtArgs["result"]["email"]>
    composites: {}
  }

  type EmailGetPayload<S extends boolean | null | undefined | EmailDefaultArgs> = $Result.GetResult<Prisma.$EmailPayload, S>

  type EmailCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<EmailFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: EmailCountAggregateInputType | true
    }

  export interface EmailDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Email'], meta: { name: 'Email' } }
    /**
     * Find zero or one Email that matches the filter.
     * @param {EmailFindUniqueArgs} args - Arguments to find a Email
     * @example
     * // Get one Email
     * const email = await prisma.email.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends EmailFindUniqueArgs>(args: SelectSubset<T, EmailFindUniqueArgs<ExtArgs>>): Prisma__EmailClient<$Result.GetResult<Prisma.$EmailPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Email that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {EmailFindUniqueOrThrowArgs} args - Arguments to find a Email
     * @example
     * // Get one Email
     * const email = await prisma.email.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends EmailFindUniqueOrThrowArgs>(args: SelectSubset<T, EmailFindUniqueOrThrowArgs<ExtArgs>>): Prisma__EmailClient<$Result.GetResult<Prisma.$EmailPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Email that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EmailFindFirstArgs} args - Arguments to find a Email
     * @example
     * // Get one Email
     * const email = await prisma.email.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends EmailFindFirstArgs>(args?: SelectSubset<T, EmailFindFirstArgs<ExtArgs>>): Prisma__EmailClient<$Result.GetResult<Prisma.$EmailPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Email that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EmailFindFirstOrThrowArgs} args - Arguments to find a Email
     * @example
     * // Get one Email
     * const email = await prisma.email.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends EmailFindFirstOrThrowArgs>(args?: SelectSubset<T, EmailFindFirstOrThrowArgs<ExtArgs>>): Prisma__EmailClient<$Result.GetResult<Prisma.$EmailPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Emails that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EmailFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Emails
     * const emails = await prisma.email.findMany()
     * 
     * // Get first 10 Emails
     * const emails = await prisma.email.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const emailWithIdOnly = await prisma.email.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends EmailFindManyArgs>(args?: SelectSubset<T, EmailFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$EmailPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Email.
     * @param {EmailCreateArgs} args - Arguments to create a Email.
     * @example
     * // Create one Email
     * const Email = await prisma.email.create({
     *   data: {
     *     // ... data to create a Email
     *   }
     * })
     * 
     */
    create<T extends EmailCreateArgs>(args: SelectSubset<T, EmailCreateArgs<ExtArgs>>): Prisma__EmailClient<$Result.GetResult<Prisma.$EmailPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Emails.
     * @param {EmailCreateManyArgs} args - Arguments to create many Emails.
     * @example
     * // Create many Emails
     * const email = await prisma.email.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends EmailCreateManyArgs>(args?: SelectSubset<T, EmailCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Emails and returns the data saved in the database.
     * @param {EmailCreateManyAndReturnArgs} args - Arguments to create many Emails.
     * @example
     * // Create many Emails
     * const email = await prisma.email.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Emails and only return the `id`
     * const emailWithIdOnly = await prisma.email.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends EmailCreateManyAndReturnArgs>(args?: SelectSubset<T, EmailCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$EmailPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Email.
     * @param {EmailDeleteArgs} args - Arguments to delete one Email.
     * @example
     * // Delete one Email
     * const Email = await prisma.email.delete({
     *   where: {
     *     // ... filter to delete one Email
     *   }
     * })
     * 
     */
    delete<T extends EmailDeleteArgs>(args: SelectSubset<T, EmailDeleteArgs<ExtArgs>>): Prisma__EmailClient<$Result.GetResult<Prisma.$EmailPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Email.
     * @param {EmailUpdateArgs} args - Arguments to update one Email.
     * @example
     * // Update one Email
     * const email = await prisma.email.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends EmailUpdateArgs>(args: SelectSubset<T, EmailUpdateArgs<ExtArgs>>): Prisma__EmailClient<$Result.GetResult<Prisma.$EmailPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Emails.
     * @param {EmailDeleteManyArgs} args - Arguments to filter Emails to delete.
     * @example
     * // Delete a few Emails
     * const { count } = await prisma.email.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends EmailDeleteManyArgs>(args?: SelectSubset<T, EmailDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Emails.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EmailUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Emails
     * const email = await prisma.email.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends EmailUpdateManyArgs>(args: SelectSubset<T, EmailUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Emails and returns the data updated in the database.
     * @param {EmailUpdateManyAndReturnArgs} args - Arguments to update many Emails.
     * @example
     * // Update many Emails
     * const email = await prisma.email.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Emails and only return the `id`
     * const emailWithIdOnly = await prisma.email.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends EmailUpdateManyAndReturnArgs>(args: SelectSubset<T, EmailUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$EmailPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Email.
     * @param {EmailUpsertArgs} args - Arguments to update or create a Email.
     * @example
     * // Update or create a Email
     * const email = await prisma.email.upsert({
     *   create: {
     *     // ... data to create a Email
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Email we want to update
     *   }
     * })
     */
    upsert<T extends EmailUpsertArgs>(args: SelectSubset<T, EmailUpsertArgs<ExtArgs>>): Prisma__EmailClient<$Result.GetResult<Prisma.$EmailPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Emails.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EmailCountArgs} args - Arguments to filter Emails to count.
     * @example
     * // Count the number of Emails
     * const count = await prisma.email.count({
     *   where: {
     *     // ... the filter for the Emails we want to count
     *   }
     * })
    **/
    count<T extends EmailCountArgs>(
      args?: Subset<T, EmailCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], EmailCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Email.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EmailAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends EmailAggregateArgs>(args: Subset<T, EmailAggregateArgs>): Prisma.PrismaPromise<GetEmailAggregateType<T>>

    /**
     * Group by Email.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EmailGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends EmailGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: EmailGroupByArgs['orderBy'] }
        : { orderBy?: EmailGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, EmailGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetEmailGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Email model
   */
  readonly fields: EmailFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Email.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__EmailClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    conversation<T extends ConversationDefaultArgs<ExtArgs> = {}>(args?: Subset<T, ConversationDefaultArgs<ExtArgs>>): Prisma__ConversationClient<$Result.GetResult<Prisma.$ConversationPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    contact<T extends ContactDefaultArgs<ExtArgs> = {}>(args?: Subset<T, ContactDefaultArgs<ExtArgs>>): Prisma__ContactClient<$Result.GetResult<Prisma.$ContactPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Email model
   */
  interface EmailFieldRefs {
    readonly id: FieldRef<"Email", 'String'>
    readonly twilioSid: FieldRef<"Email", 'String'>
    readonly status: FieldRef<"Email", 'String'>
    readonly direction: FieldRef<"Email", 'String'>
    readonly subject: FieldRef<"Email", 'String'>
    readonly from: FieldRef<"Email", 'String'>
    readonly to: FieldRef<"Email", 'String'>
    readonly body: FieldRef<"Email", 'String'>
    readonly html: FieldRef<"Email", 'String'>
    readonly sentAt: FieldRef<"Email", 'DateTime'>
    readonly deliveredAt: FieldRef<"Email", 'DateTime'>
    readonly createdAt: FieldRef<"Email", 'DateTime'>
    readonly updatedAt: FieldRef<"Email", 'DateTime'>
    readonly conversationId: FieldRef<"Email", 'String'>
    readonly contactId: FieldRef<"Email", 'String'>
  }
    

  // Custom InputTypes
  /**
   * Email findUnique
   */
  export type EmailFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Email
     */
    select?: EmailSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Email
     */
    omit?: EmailOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EmailInclude<ExtArgs> | null
    /**
     * Filter, which Email to fetch.
     */
    where: EmailWhereUniqueInput
  }

  /**
   * Email findUniqueOrThrow
   */
  export type EmailFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Email
     */
    select?: EmailSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Email
     */
    omit?: EmailOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EmailInclude<ExtArgs> | null
    /**
     * Filter, which Email to fetch.
     */
    where: EmailWhereUniqueInput
  }

  /**
   * Email findFirst
   */
  export type EmailFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Email
     */
    select?: EmailSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Email
     */
    omit?: EmailOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EmailInclude<ExtArgs> | null
    /**
     * Filter, which Email to fetch.
     */
    where?: EmailWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Emails to fetch.
     */
    orderBy?: EmailOrderByWithRelationInput | EmailOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Emails.
     */
    cursor?: EmailWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Emails from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Emails.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Emails.
     */
    distinct?: EmailScalarFieldEnum | EmailScalarFieldEnum[]
  }

  /**
   * Email findFirstOrThrow
   */
  export type EmailFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Email
     */
    select?: EmailSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Email
     */
    omit?: EmailOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EmailInclude<ExtArgs> | null
    /**
     * Filter, which Email to fetch.
     */
    where?: EmailWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Emails to fetch.
     */
    orderBy?: EmailOrderByWithRelationInput | EmailOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Emails.
     */
    cursor?: EmailWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Emails from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Emails.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Emails.
     */
    distinct?: EmailScalarFieldEnum | EmailScalarFieldEnum[]
  }

  /**
   * Email findMany
   */
  export type EmailFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Email
     */
    select?: EmailSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Email
     */
    omit?: EmailOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EmailInclude<ExtArgs> | null
    /**
     * Filter, which Emails to fetch.
     */
    where?: EmailWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Emails to fetch.
     */
    orderBy?: EmailOrderByWithRelationInput | EmailOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Emails.
     */
    cursor?: EmailWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Emails from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Emails.
     */
    skip?: number
    distinct?: EmailScalarFieldEnum | EmailScalarFieldEnum[]
  }

  /**
   * Email create
   */
  export type EmailCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Email
     */
    select?: EmailSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Email
     */
    omit?: EmailOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EmailInclude<ExtArgs> | null
    /**
     * The data needed to create a Email.
     */
    data: XOR<EmailCreateInput, EmailUncheckedCreateInput>
  }

  /**
   * Email createMany
   */
  export type EmailCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Emails.
     */
    data: EmailCreateManyInput | EmailCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Email createManyAndReturn
   */
  export type EmailCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Email
     */
    select?: EmailSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Email
     */
    omit?: EmailOmit<ExtArgs> | null
    /**
     * The data used to create many Emails.
     */
    data: EmailCreateManyInput | EmailCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EmailIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Email update
   */
  export type EmailUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Email
     */
    select?: EmailSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Email
     */
    omit?: EmailOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EmailInclude<ExtArgs> | null
    /**
     * The data needed to update a Email.
     */
    data: XOR<EmailUpdateInput, EmailUncheckedUpdateInput>
    /**
     * Choose, which Email to update.
     */
    where: EmailWhereUniqueInput
  }

  /**
   * Email updateMany
   */
  export type EmailUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Emails.
     */
    data: XOR<EmailUpdateManyMutationInput, EmailUncheckedUpdateManyInput>
    /**
     * Filter which Emails to update
     */
    where?: EmailWhereInput
    /**
     * Limit how many Emails to update.
     */
    limit?: number
  }

  /**
   * Email updateManyAndReturn
   */
  export type EmailUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Email
     */
    select?: EmailSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Email
     */
    omit?: EmailOmit<ExtArgs> | null
    /**
     * The data used to update Emails.
     */
    data: XOR<EmailUpdateManyMutationInput, EmailUncheckedUpdateManyInput>
    /**
     * Filter which Emails to update
     */
    where?: EmailWhereInput
    /**
     * Limit how many Emails to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EmailIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * Email upsert
   */
  export type EmailUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Email
     */
    select?: EmailSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Email
     */
    omit?: EmailOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EmailInclude<ExtArgs> | null
    /**
     * The filter to search for the Email to update in case it exists.
     */
    where: EmailWhereUniqueInput
    /**
     * In case the Email found by the `where` argument doesn't exist, create a new Email with this data.
     */
    create: XOR<EmailCreateInput, EmailUncheckedCreateInput>
    /**
     * In case the Email was found with the provided `where` argument, update it with this data.
     */
    update: XOR<EmailUpdateInput, EmailUncheckedUpdateInput>
  }

  /**
   * Email delete
   */
  export type EmailDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Email
     */
    select?: EmailSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Email
     */
    omit?: EmailOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EmailInclude<ExtArgs> | null
    /**
     * Filter which Email to delete.
     */
    where: EmailWhereUniqueInput
  }

  /**
   * Email deleteMany
   */
  export type EmailDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Emails to delete
     */
    where?: EmailWhereInput
    /**
     * Limit how many Emails to delete.
     */
    limit?: number
  }

  /**
   * Email without action
   */
  export type EmailDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Email
     */
    select?: EmailSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Email
     */
    omit?: EmailOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EmailInclude<ExtArgs> | null
  }


  /**
   * Model ContactKnowledge
   */

  export type AggregateContactKnowledge = {
    _count: ContactKnowledgeCountAggregateOutputType | null
    _avg: ContactKnowledgeAvgAggregateOutputType | null
    _sum: ContactKnowledgeSumAggregateOutputType | null
    _min: ContactKnowledgeMinAggregateOutputType | null
    _max: ContactKnowledgeMaxAggregateOutputType | null
  }

  export type ContactKnowledgeAvgAggregateOutputType = {
    confidence: number | null
  }

  export type ContactKnowledgeSumAggregateOutputType = {
    confidence: number | null
  }

  export type ContactKnowledgeMinAggregateOutputType = {
    id: string | null
    contactId: string | null
    category: string | null
    key: string | null
    value: string | null
    confidence: number | null
    status: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type ContactKnowledgeMaxAggregateOutputType = {
    id: string | null
    contactId: string | null
    category: string | null
    key: string | null
    value: string | null
    confidence: number | null
    status: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type ContactKnowledgeCountAggregateOutputType = {
    id: number
    contactId: number
    category: number
    key: number
    value: number
    confidence: number
    status: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type ContactKnowledgeAvgAggregateInputType = {
    confidence?: true
  }

  export type ContactKnowledgeSumAggregateInputType = {
    confidence?: true
  }

  export type ContactKnowledgeMinAggregateInputType = {
    id?: true
    contactId?: true
    category?: true
    key?: true
    value?: true
    confidence?: true
    status?: true
    createdAt?: true
    updatedAt?: true
  }

  export type ContactKnowledgeMaxAggregateInputType = {
    id?: true
    contactId?: true
    category?: true
    key?: true
    value?: true
    confidence?: true
    status?: true
    createdAt?: true
    updatedAt?: true
  }

  export type ContactKnowledgeCountAggregateInputType = {
    id?: true
    contactId?: true
    category?: true
    key?: true
    value?: true
    confidence?: true
    status?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type ContactKnowledgeAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which ContactKnowledge to aggregate.
     */
    where?: ContactKnowledgeWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ContactKnowledges to fetch.
     */
    orderBy?: ContactKnowledgeOrderByWithRelationInput | ContactKnowledgeOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: ContactKnowledgeWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ContactKnowledges from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ContactKnowledges.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned ContactKnowledges
    **/
    _count?: true | ContactKnowledgeCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: ContactKnowledgeAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: ContactKnowledgeSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: ContactKnowledgeMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: ContactKnowledgeMaxAggregateInputType
  }

  export type GetContactKnowledgeAggregateType<T extends ContactKnowledgeAggregateArgs> = {
        [P in keyof T & keyof AggregateContactKnowledge]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateContactKnowledge[P]>
      : GetScalarType<T[P], AggregateContactKnowledge[P]>
  }




  export type ContactKnowledgeGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ContactKnowledgeWhereInput
    orderBy?: ContactKnowledgeOrderByWithAggregationInput | ContactKnowledgeOrderByWithAggregationInput[]
    by: ContactKnowledgeScalarFieldEnum[] | ContactKnowledgeScalarFieldEnum
    having?: ContactKnowledgeScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: ContactKnowledgeCountAggregateInputType | true
    _avg?: ContactKnowledgeAvgAggregateInputType
    _sum?: ContactKnowledgeSumAggregateInputType
    _min?: ContactKnowledgeMinAggregateInputType
    _max?: ContactKnowledgeMaxAggregateInputType
  }

  export type ContactKnowledgeGroupByOutputType = {
    id: string
    contactId: string
    category: string
    key: string
    value: string
    confidence: number
    status: string
    createdAt: Date
    updatedAt: Date
    _count: ContactKnowledgeCountAggregateOutputType | null
    _avg: ContactKnowledgeAvgAggregateOutputType | null
    _sum: ContactKnowledgeSumAggregateOutputType | null
    _min: ContactKnowledgeMinAggregateOutputType | null
    _max: ContactKnowledgeMaxAggregateOutputType | null
  }

  type GetContactKnowledgeGroupByPayload<T extends ContactKnowledgeGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<ContactKnowledgeGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof ContactKnowledgeGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], ContactKnowledgeGroupByOutputType[P]>
            : GetScalarType<T[P], ContactKnowledgeGroupByOutputType[P]>
        }
      >
    >


  export type ContactKnowledgeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    contactId?: boolean
    category?: boolean
    key?: boolean
    value?: boolean
    confidence?: boolean
    status?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    contact?: boolean | ContactDefaultArgs<ExtArgs>
    sources?: boolean | ContactKnowledge$sourcesArgs<ExtArgs>
    _count?: boolean | ContactKnowledgeCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["contactKnowledge"]>

  export type ContactKnowledgeSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    contactId?: boolean
    category?: boolean
    key?: boolean
    value?: boolean
    confidence?: boolean
    status?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    contact?: boolean | ContactDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["contactKnowledge"]>

  export type ContactKnowledgeSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    contactId?: boolean
    category?: boolean
    key?: boolean
    value?: boolean
    confidence?: boolean
    status?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    contact?: boolean | ContactDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["contactKnowledge"]>

  export type ContactKnowledgeSelectScalar = {
    id?: boolean
    contactId?: boolean
    category?: boolean
    key?: boolean
    value?: boolean
    confidence?: boolean
    status?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type ContactKnowledgeOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "contactId" | "category" | "key" | "value" | "confidence" | "status" | "createdAt" | "updatedAt", ExtArgs["result"]["contactKnowledge"]>
  export type ContactKnowledgeInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    contact?: boolean | ContactDefaultArgs<ExtArgs>
    sources?: boolean | ContactKnowledge$sourcesArgs<ExtArgs>
    _count?: boolean | ContactKnowledgeCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type ContactKnowledgeIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    contact?: boolean | ContactDefaultArgs<ExtArgs>
  }
  export type ContactKnowledgeIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    contact?: boolean | ContactDefaultArgs<ExtArgs>
  }

  export type $ContactKnowledgePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "ContactKnowledge"
    objects: {
      contact: Prisma.$ContactPayload<ExtArgs>
      sources: Prisma.$KnowledgeSourceMessagePayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      contactId: string
      category: string
      key: string
      value: string
      confidence: number
      status: string
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["contactKnowledge"]>
    composites: {}
  }

  type ContactKnowledgeGetPayload<S extends boolean | null | undefined | ContactKnowledgeDefaultArgs> = $Result.GetResult<Prisma.$ContactKnowledgePayload, S>

  type ContactKnowledgeCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<ContactKnowledgeFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: ContactKnowledgeCountAggregateInputType | true
    }

  export interface ContactKnowledgeDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['ContactKnowledge'], meta: { name: 'ContactKnowledge' } }
    /**
     * Find zero or one ContactKnowledge that matches the filter.
     * @param {ContactKnowledgeFindUniqueArgs} args - Arguments to find a ContactKnowledge
     * @example
     * // Get one ContactKnowledge
     * const contactKnowledge = await prisma.contactKnowledge.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends ContactKnowledgeFindUniqueArgs>(args: SelectSubset<T, ContactKnowledgeFindUniqueArgs<ExtArgs>>): Prisma__ContactKnowledgeClient<$Result.GetResult<Prisma.$ContactKnowledgePayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one ContactKnowledge that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {ContactKnowledgeFindUniqueOrThrowArgs} args - Arguments to find a ContactKnowledge
     * @example
     * // Get one ContactKnowledge
     * const contactKnowledge = await prisma.contactKnowledge.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends ContactKnowledgeFindUniqueOrThrowArgs>(args: SelectSubset<T, ContactKnowledgeFindUniqueOrThrowArgs<ExtArgs>>): Prisma__ContactKnowledgeClient<$Result.GetResult<Prisma.$ContactKnowledgePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first ContactKnowledge that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ContactKnowledgeFindFirstArgs} args - Arguments to find a ContactKnowledge
     * @example
     * // Get one ContactKnowledge
     * const contactKnowledge = await prisma.contactKnowledge.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends ContactKnowledgeFindFirstArgs>(args?: SelectSubset<T, ContactKnowledgeFindFirstArgs<ExtArgs>>): Prisma__ContactKnowledgeClient<$Result.GetResult<Prisma.$ContactKnowledgePayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first ContactKnowledge that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ContactKnowledgeFindFirstOrThrowArgs} args - Arguments to find a ContactKnowledge
     * @example
     * // Get one ContactKnowledge
     * const contactKnowledge = await prisma.contactKnowledge.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends ContactKnowledgeFindFirstOrThrowArgs>(args?: SelectSubset<T, ContactKnowledgeFindFirstOrThrowArgs<ExtArgs>>): Prisma__ContactKnowledgeClient<$Result.GetResult<Prisma.$ContactKnowledgePayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more ContactKnowledges that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ContactKnowledgeFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all ContactKnowledges
     * const contactKnowledges = await prisma.contactKnowledge.findMany()
     * 
     * // Get first 10 ContactKnowledges
     * const contactKnowledges = await prisma.contactKnowledge.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const contactKnowledgeWithIdOnly = await prisma.contactKnowledge.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends ContactKnowledgeFindManyArgs>(args?: SelectSubset<T, ContactKnowledgeFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ContactKnowledgePayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a ContactKnowledge.
     * @param {ContactKnowledgeCreateArgs} args - Arguments to create a ContactKnowledge.
     * @example
     * // Create one ContactKnowledge
     * const ContactKnowledge = await prisma.contactKnowledge.create({
     *   data: {
     *     // ... data to create a ContactKnowledge
     *   }
     * })
     * 
     */
    create<T extends ContactKnowledgeCreateArgs>(args: SelectSubset<T, ContactKnowledgeCreateArgs<ExtArgs>>): Prisma__ContactKnowledgeClient<$Result.GetResult<Prisma.$ContactKnowledgePayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many ContactKnowledges.
     * @param {ContactKnowledgeCreateManyArgs} args - Arguments to create many ContactKnowledges.
     * @example
     * // Create many ContactKnowledges
     * const contactKnowledge = await prisma.contactKnowledge.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends ContactKnowledgeCreateManyArgs>(args?: SelectSubset<T, ContactKnowledgeCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many ContactKnowledges and returns the data saved in the database.
     * @param {ContactKnowledgeCreateManyAndReturnArgs} args - Arguments to create many ContactKnowledges.
     * @example
     * // Create many ContactKnowledges
     * const contactKnowledge = await prisma.contactKnowledge.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many ContactKnowledges and only return the `id`
     * const contactKnowledgeWithIdOnly = await prisma.contactKnowledge.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends ContactKnowledgeCreateManyAndReturnArgs>(args?: SelectSubset<T, ContactKnowledgeCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ContactKnowledgePayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a ContactKnowledge.
     * @param {ContactKnowledgeDeleteArgs} args - Arguments to delete one ContactKnowledge.
     * @example
     * // Delete one ContactKnowledge
     * const ContactKnowledge = await prisma.contactKnowledge.delete({
     *   where: {
     *     // ... filter to delete one ContactKnowledge
     *   }
     * })
     * 
     */
    delete<T extends ContactKnowledgeDeleteArgs>(args: SelectSubset<T, ContactKnowledgeDeleteArgs<ExtArgs>>): Prisma__ContactKnowledgeClient<$Result.GetResult<Prisma.$ContactKnowledgePayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one ContactKnowledge.
     * @param {ContactKnowledgeUpdateArgs} args - Arguments to update one ContactKnowledge.
     * @example
     * // Update one ContactKnowledge
     * const contactKnowledge = await prisma.contactKnowledge.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends ContactKnowledgeUpdateArgs>(args: SelectSubset<T, ContactKnowledgeUpdateArgs<ExtArgs>>): Prisma__ContactKnowledgeClient<$Result.GetResult<Prisma.$ContactKnowledgePayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more ContactKnowledges.
     * @param {ContactKnowledgeDeleteManyArgs} args - Arguments to filter ContactKnowledges to delete.
     * @example
     * // Delete a few ContactKnowledges
     * const { count } = await prisma.contactKnowledge.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends ContactKnowledgeDeleteManyArgs>(args?: SelectSubset<T, ContactKnowledgeDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more ContactKnowledges.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ContactKnowledgeUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many ContactKnowledges
     * const contactKnowledge = await prisma.contactKnowledge.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends ContactKnowledgeUpdateManyArgs>(args: SelectSubset<T, ContactKnowledgeUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more ContactKnowledges and returns the data updated in the database.
     * @param {ContactKnowledgeUpdateManyAndReturnArgs} args - Arguments to update many ContactKnowledges.
     * @example
     * // Update many ContactKnowledges
     * const contactKnowledge = await prisma.contactKnowledge.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more ContactKnowledges and only return the `id`
     * const contactKnowledgeWithIdOnly = await prisma.contactKnowledge.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends ContactKnowledgeUpdateManyAndReturnArgs>(args: SelectSubset<T, ContactKnowledgeUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ContactKnowledgePayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one ContactKnowledge.
     * @param {ContactKnowledgeUpsertArgs} args - Arguments to update or create a ContactKnowledge.
     * @example
     * // Update or create a ContactKnowledge
     * const contactKnowledge = await prisma.contactKnowledge.upsert({
     *   create: {
     *     // ... data to create a ContactKnowledge
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the ContactKnowledge we want to update
     *   }
     * })
     */
    upsert<T extends ContactKnowledgeUpsertArgs>(args: SelectSubset<T, ContactKnowledgeUpsertArgs<ExtArgs>>): Prisma__ContactKnowledgeClient<$Result.GetResult<Prisma.$ContactKnowledgePayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of ContactKnowledges.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ContactKnowledgeCountArgs} args - Arguments to filter ContactKnowledges to count.
     * @example
     * // Count the number of ContactKnowledges
     * const count = await prisma.contactKnowledge.count({
     *   where: {
     *     // ... the filter for the ContactKnowledges we want to count
     *   }
     * })
    **/
    count<T extends ContactKnowledgeCountArgs>(
      args?: Subset<T, ContactKnowledgeCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], ContactKnowledgeCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a ContactKnowledge.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ContactKnowledgeAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends ContactKnowledgeAggregateArgs>(args: Subset<T, ContactKnowledgeAggregateArgs>): Prisma.PrismaPromise<GetContactKnowledgeAggregateType<T>>

    /**
     * Group by ContactKnowledge.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ContactKnowledgeGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends ContactKnowledgeGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: ContactKnowledgeGroupByArgs['orderBy'] }
        : { orderBy?: ContactKnowledgeGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, ContactKnowledgeGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetContactKnowledgeGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the ContactKnowledge model
   */
  readonly fields: ContactKnowledgeFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for ContactKnowledge.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__ContactKnowledgeClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    contact<T extends ContactDefaultArgs<ExtArgs> = {}>(args?: Subset<T, ContactDefaultArgs<ExtArgs>>): Prisma__ContactClient<$Result.GetResult<Prisma.$ContactPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    sources<T extends ContactKnowledge$sourcesArgs<ExtArgs> = {}>(args?: Subset<T, ContactKnowledge$sourcesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$KnowledgeSourceMessagePayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the ContactKnowledge model
   */
  interface ContactKnowledgeFieldRefs {
    readonly id: FieldRef<"ContactKnowledge", 'String'>
    readonly contactId: FieldRef<"ContactKnowledge", 'String'>
    readonly category: FieldRef<"ContactKnowledge", 'String'>
    readonly key: FieldRef<"ContactKnowledge", 'String'>
    readonly value: FieldRef<"ContactKnowledge", 'String'>
    readonly confidence: FieldRef<"ContactKnowledge", 'Float'>
    readonly status: FieldRef<"ContactKnowledge", 'String'>
    readonly createdAt: FieldRef<"ContactKnowledge", 'DateTime'>
    readonly updatedAt: FieldRef<"ContactKnowledge", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * ContactKnowledge findUnique
   */
  export type ContactKnowledgeFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ContactKnowledge
     */
    select?: ContactKnowledgeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ContactKnowledge
     */
    omit?: ContactKnowledgeOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ContactKnowledgeInclude<ExtArgs> | null
    /**
     * Filter, which ContactKnowledge to fetch.
     */
    where: ContactKnowledgeWhereUniqueInput
  }

  /**
   * ContactKnowledge findUniqueOrThrow
   */
  export type ContactKnowledgeFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ContactKnowledge
     */
    select?: ContactKnowledgeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ContactKnowledge
     */
    omit?: ContactKnowledgeOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ContactKnowledgeInclude<ExtArgs> | null
    /**
     * Filter, which ContactKnowledge to fetch.
     */
    where: ContactKnowledgeWhereUniqueInput
  }

  /**
   * ContactKnowledge findFirst
   */
  export type ContactKnowledgeFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ContactKnowledge
     */
    select?: ContactKnowledgeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ContactKnowledge
     */
    omit?: ContactKnowledgeOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ContactKnowledgeInclude<ExtArgs> | null
    /**
     * Filter, which ContactKnowledge to fetch.
     */
    where?: ContactKnowledgeWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ContactKnowledges to fetch.
     */
    orderBy?: ContactKnowledgeOrderByWithRelationInput | ContactKnowledgeOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for ContactKnowledges.
     */
    cursor?: ContactKnowledgeWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ContactKnowledges from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ContactKnowledges.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ContactKnowledges.
     */
    distinct?: ContactKnowledgeScalarFieldEnum | ContactKnowledgeScalarFieldEnum[]
  }

  /**
   * ContactKnowledge findFirstOrThrow
   */
  export type ContactKnowledgeFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ContactKnowledge
     */
    select?: ContactKnowledgeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ContactKnowledge
     */
    omit?: ContactKnowledgeOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ContactKnowledgeInclude<ExtArgs> | null
    /**
     * Filter, which ContactKnowledge to fetch.
     */
    where?: ContactKnowledgeWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ContactKnowledges to fetch.
     */
    orderBy?: ContactKnowledgeOrderByWithRelationInput | ContactKnowledgeOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for ContactKnowledges.
     */
    cursor?: ContactKnowledgeWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ContactKnowledges from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ContactKnowledges.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ContactKnowledges.
     */
    distinct?: ContactKnowledgeScalarFieldEnum | ContactKnowledgeScalarFieldEnum[]
  }

  /**
   * ContactKnowledge findMany
   */
  export type ContactKnowledgeFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ContactKnowledge
     */
    select?: ContactKnowledgeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ContactKnowledge
     */
    omit?: ContactKnowledgeOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ContactKnowledgeInclude<ExtArgs> | null
    /**
     * Filter, which ContactKnowledges to fetch.
     */
    where?: ContactKnowledgeWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ContactKnowledges to fetch.
     */
    orderBy?: ContactKnowledgeOrderByWithRelationInput | ContactKnowledgeOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing ContactKnowledges.
     */
    cursor?: ContactKnowledgeWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ContactKnowledges from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ContactKnowledges.
     */
    skip?: number
    distinct?: ContactKnowledgeScalarFieldEnum | ContactKnowledgeScalarFieldEnum[]
  }

  /**
   * ContactKnowledge create
   */
  export type ContactKnowledgeCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ContactKnowledge
     */
    select?: ContactKnowledgeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ContactKnowledge
     */
    omit?: ContactKnowledgeOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ContactKnowledgeInclude<ExtArgs> | null
    /**
     * The data needed to create a ContactKnowledge.
     */
    data: XOR<ContactKnowledgeCreateInput, ContactKnowledgeUncheckedCreateInput>
  }

  /**
   * ContactKnowledge createMany
   */
  export type ContactKnowledgeCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many ContactKnowledges.
     */
    data: ContactKnowledgeCreateManyInput | ContactKnowledgeCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * ContactKnowledge createManyAndReturn
   */
  export type ContactKnowledgeCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ContactKnowledge
     */
    select?: ContactKnowledgeSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the ContactKnowledge
     */
    omit?: ContactKnowledgeOmit<ExtArgs> | null
    /**
     * The data used to create many ContactKnowledges.
     */
    data: ContactKnowledgeCreateManyInput | ContactKnowledgeCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ContactKnowledgeIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * ContactKnowledge update
   */
  export type ContactKnowledgeUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ContactKnowledge
     */
    select?: ContactKnowledgeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ContactKnowledge
     */
    omit?: ContactKnowledgeOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ContactKnowledgeInclude<ExtArgs> | null
    /**
     * The data needed to update a ContactKnowledge.
     */
    data: XOR<ContactKnowledgeUpdateInput, ContactKnowledgeUncheckedUpdateInput>
    /**
     * Choose, which ContactKnowledge to update.
     */
    where: ContactKnowledgeWhereUniqueInput
  }

  /**
   * ContactKnowledge updateMany
   */
  export type ContactKnowledgeUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update ContactKnowledges.
     */
    data: XOR<ContactKnowledgeUpdateManyMutationInput, ContactKnowledgeUncheckedUpdateManyInput>
    /**
     * Filter which ContactKnowledges to update
     */
    where?: ContactKnowledgeWhereInput
    /**
     * Limit how many ContactKnowledges to update.
     */
    limit?: number
  }

  /**
   * ContactKnowledge updateManyAndReturn
   */
  export type ContactKnowledgeUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ContactKnowledge
     */
    select?: ContactKnowledgeSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the ContactKnowledge
     */
    omit?: ContactKnowledgeOmit<ExtArgs> | null
    /**
     * The data used to update ContactKnowledges.
     */
    data: XOR<ContactKnowledgeUpdateManyMutationInput, ContactKnowledgeUncheckedUpdateManyInput>
    /**
     * Filter which ContactKnowledges to update
     */
    where?: ContactKnowledgeWhereInput
    /**
     * Limit how many ContactKnowledges to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ContactKnowledgeIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * ContactKnowledge upsert
   */
  export type ContactKnowledgeUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ContactKnowledge
     */
    select?: ContactKnowledgeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ContactKnowledge
     */
    omit?: ContactKnowledgeOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ContactKnowledgeInclude<ExtArgs> | null
    /**
     * The filter to search for the ContactKnowledge to update in case it exists.
     */
    where: ContactKnowledgeWhereUniqueInput
    /**
     * In case the ContactKnowledge found by the `where` argument doesn't exist, create a new ContactKnowledge with this data.
     */
    create: XOR<ContactKnowledgeCreateInput, ContactKnowledgeUncheckedCreateInput>
    /**
     * In case the ContactKnowledge was found with the provided `where` argument, update it with this data.
     */
    update: XOR<ContactKnowledgeUpdateInput, ContactKnowledgeUncheckedUpdateInput>
  }

  /**
   * ContactKnowledge delete
   */
  export type ContactKnowledgeDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ContactKnowledge
     */
    select?: ContactKnowledgeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ContactKnowledge
     */
    omit?: ContactKnowledgeOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ContactKnowledgeInclude<ExtArgs> | null
    /**
     * Filter which ContactKnowledge to delete.
     */
    where: ContactKnowledgeWhereUniqueInput
  }

  /**
   * ContactKnowledge deleteMany
   */
  export type ContactKnowledgeDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which ContactKnowledges to delete
     */
    where?: ContactKnowledgeWhereInput
    /**
     * Limit how many ContactKnowledges to delete.
     */
    limit?: number
  }

  /**
   * ContactKnowledge.sources
   */
  export type ContactKnowledge$sourcesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the KnowledgeSourceMessage
     */
    select?: KnowledgeSourceMessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the KnowledgeSourceMessage
     */
    omit?: KnowledgeSourceMessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: KnowledgeSourceMessageInclude<ExtArgs> | null
    where?: KnowledgeSourceMessageWhereInput
    orderBy?: KnowledgeSourceMessageOrderByWithRelationInput | KnowledgeSourceMessageOrderByWithRelationInput[]
    cursor?: KnowledgeSourceMessageWhereUniqueInput
    take?: number
    skip?: number
    distinct?: KnowledgeSourceMessageScalarFieldEnum | KnowledgeSourceMessageScalarFieldEnum[]
  }

  /**
   * ContactKnowledge without action
   */
  export type ContactKnowledgeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ContactKnowledge
     */
    select?: ContactKnowledgeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ContactKnowledge
     */
    omit?: ContactKnowledgeOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ContactKnowledgeInclude<ExtArgs> | null
  }


  /**
   * Model KnowledgeSourceMessage
   */

  export type AggregateKnowledgeSourceMessage = {
    _count: KnowledgeSourceMessageCountAggregateOutputType | null
    _min: KnowledgeSourceMessageMinAggregateOutputType | null
    _max: KnowledgeSourceMessageMaxAggregateOutputType | null
  }

  export type KnowledgeSourceMessageMinAggregateOutputType = {
    id: string | null
    knowledgeId: string | null
    messageId: string | null
    role: string | null
  }

  export type KnowledgeSourceMessageMaxAggregateOutputType = {
    id: string | null
    knowledgeId: string | null
    messageId: string | null
    role: string | null
  }

  export type KnowledgeSourceMessageCountAggregateOutputType = {
    id: number
    knowledgeId: number
    messageId: number
    role: number
    _all: number
  }


  export type KnowledgeSourceMessageMinAggregateInputType = {
    id?: true
    knowledgeId?: true
    messageId?: true
    role?: true
  }

  export type KnowledgeSourceMessageMaxAggregateInputType = {
    id?: true
    knowledgeId?: true
    messageId?: true
    role?: true
  }

  export type KnowledgeSourceMessageCountAggregateInputType = {
    id?: true
    knowledgeId?: true
    messageId?: true
    role?: true
    _all?: true
  }

  export type KnowledgeSourceMessageAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which KnowledgeSourceMessage to aggregate.
     */
    where?: KnowledgeSourceMessageWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of KnowledgeSourceMessages to fetch.
     */
    orderBy?: KnowledgeSourceMessageOrderByWithRelationInput | KnowledgeSourceMessageOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: KnowledgeSourceMessageWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` KnowledgeSourceMessages from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` KnowledgeSourceMessages.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned KnowledgeSourceMessages
    **/
    _count?: true | KnowledgeSourceMessageCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: KnowledgeSourceMessageMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: KnowledgeSourceMessageMaxAggregateInputType
  }

  export type GetKnowledgeSourceMessageAggregateType<T extends KnowledgeSourceMessageAggregateArgs> = {
        [P in keyof T & keyof AggregateKnowledgeSourceMessage]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateKnowledgeSourceMessage[P]>
      : GetScalarType<T[P], AggregateKnowledgeSourceMessage[P]>
  }




  export type KnowledgeSourceMessageGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: KnowledgeSourceMessageWhereInput
    orderBy?: KnowledgeSourceMessageOrderByWithAggregationInput | KnowledgeSourceMessageOrderByWithAggregationInput[]
    by: KnowledgeSourceMessageScalarFieldEnum[] | KnowledgeSourceMessageScalarFieldEnum
    having?: KnowledgeSourceMessageScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: KnowledgeSourceMessageCountAggregateInputType | true
    _min?: KnowledgeSourceMessageMinAggregateInputType
    _max?: KnowledgeSourceMessageMaxAggregateInputType
  }

  export type KnowledgeSourceMessageGroupByOutputType = {
    id: string
    knowledgeId: string
    messageId: string
    role: string
    _count: KnowledgeSourceMessageCountAggregateOutputType | null
    _min: KnowledgeSourceMessageMinAggregateOutputType | null
    _max: KnowledgeSourceMessageMaxAggregateOutputType | null
  }

  type GetKnowledgeSourceMessageGroupByPayload<T extends KnowledgeSourceMessageGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<KnowledgeSourceMessageGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof KnowledgeSourceMessageGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], KnowledgeSourceMessageGroupByOutputType[P]>
            : GetScalarType<T[P], KnowledgeSourceMessageGroupByOutputType[P]>
        }
      >
    >


  export type KnowledgeSourceMessageSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    knowledgeId?: boolean
    messageId?: boolean
    role?: boolean
    knowledge?: boolean | ContactKnowledgeDefaultArgs<ExtArgs>
    message?: boolean | MessageDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["knowledgeSourceMessage"]>

  export type KnowledgeSourceMessageSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    knowledgeId?: boolean
    messageId?: boolean
    role?: boolean
    knowledge?: boolean | ContactKnowledgeDefaultArgs<ExtArgs>
    message?: boolean | MessageDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["knowledgeSourceMessage"]>

  export type KnowledgeSourceMessageSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    knowledgeId?: boolean
    messageId?: boolean
    role?: boolean
    knowledge?: boolean | ContactKnowledgeDefaultArgs<ExtArgs>
    message?: boolean | MessageDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["knowledgeSourceMessage"]>

  export type KnowledgeSourceMessageSelectScalar = {
    id?: boolean
    knowledgeId?: boolean
    messageId?: boolean
    role?: boolean
  }

  export type KnowledgeSourceMessageOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "knowledgeId" | "messageId" | "role", ExtArgs["result"]["knowledgeSourceMessage"]>
  export type KnowledgeSourceMessageInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    knowledge?: boolean | ContactKnowledgeDefaultArgs<ExtArgs>
    message?: boolean | MessageDefaultArgs<ExtArgs>
  }
  export type KnowledgeSourceMessageIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    knowledge?: boolean | ContactKnowledgeDefaultArgs<ExtArgs>
    message?: boolean | MessageDefaultArgs<ExtArgs>
  }
  export type KnowledgeSourceMessageIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    knowledge?: boolean | ContactKnowledgeDefaultArgs<ExtArgs>
    message?: boolean | MessageDefaultArgs<ExtArgs>
  }

  export type $KnowledgeSourceMessagePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "KnowledgeSourceMessage"
    objects: {
      knowledge: Prisma.$ContactKnowledgePayload<ExtArgs>
      message: Prisma.$MessagePayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      knowledgeId: string
      messageId: string
      role: string
    }, ExtArgs["result"]["knowledgeSourceMessage"]>
    composites: {}
  }

  type KnowledgeSourceMessageGetPayload<S extends boolean | null | undefined | KnowledgeSourceMessageDefaultArgs> = $Result.GetResult<Prisma.$KnowledgeSourceMessagePayload, S>

  type KnowledgeSourceMessageCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<KnowledgeSourceMessageFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: KnowledgeSourceMessageCountAggregateInputType | true
    }

  export interface KnowledgeSourceMessageDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['KnowledgeSourceMessage'], meta: { name: 'KnowledgeSourceMessage' } }
    /**
     * Find zero or one KnowledgeSourceMessage that matches the filter.
     * @param {KnowledgeSourceMessageFindUniqueArgs} args - Arguments to find a KnowledgeSourceMessage
     * @example
     * // Get one KnowledgeSourceMessage
     * const knowledgeSourceMessage = await prisma.knowledgeSourceMessage.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends KnowledgeSourceMessageFindUniqueArgs>(args: SelectSubset<T, KnowledgeSourceMessageFindUniqueArgs<ExtArgs>>): Prisma__KnowledgeSourceMessageClient<$Result.GetResult<Prisma.$KnowledgeSourceMessagePayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one KnowledgeSourceMessage that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {KnowledgeSourceMessageFindUniqueOrThrowArgs} args - Arguments to find a KnowledgeSourceMessage
     * @example
     * // Get one KnowledgeSourceMessage
     * const knowledgeSourceMessage = await prisma.knowledgeSourceMessage.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends KnowledgeSourceMessageFindUniqueOrThrowArgs>(args: SelectSubset<T, KnowledgeSourceMessageFindUniqueOrThrowArgs<ExtArgs>>): Prisma__KnowledgeSourceMessageClient<$Result.GetResult<Prisma.$KnowledgeSourceMessagePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first KnowledgeSourceMessage that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {KnowledgeSourceMessageFindFirstArgs} args - Arguments to find a KnowledgeSourceMessage
     * @example
     * // Get one KnowledgeSourceMessage
     * const knowledgeSourceMessage = await prisma.knowledgeSourceMessage.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends KnowledgeSourceMessageFindFirstArgs>(args?: SelectSubset<T, KnowledgeSourceMessageFindFirstArgs<ExtArgs>>): Prisma__KnowledgeSourceMessageClient<$Result.GetResult<Prisma.$KnowledgeSourceMessagePayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first KnowledgeSourceMessage that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {KnowledgeSourceMessageFindFirstOrThrowArgs} args - Arguments to find a KnowledgeSourceMessage
     * @example
     * // Get one KnowledgeSourceMessage
     * const knowledgeSourceMessage = await prisma.knowledgeSourceMessage.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends KnowledgeSourceMessageFindFirstOrThrowArgs>(args?: SelectSubset<T, KnowledgeSourceMessageFindFirstOrThrowArgs<ExtArgs>>): Prisma__KnowledgeSourceMessageClient<$Result.GetResult<Prisma.$KnowledgeSourceMessagePayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more KnowledgeSourceMessages that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {KnowledgeSourceMessageFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all KnowledgeSourceMessages
     * const knowledgeSourceMessages = await prisma.knowledgeSourceMessage.findMany()
     * 
     * // Get first 10 KnowledgeSourceMessages
     * const knowledgeSourceMessages = await prisma.knowledgeSourceMessage.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const knowledgeSourceMessageWithIdOnly = await prisma.knowledgeSourceMessage.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends KnowledgeSourceMessageFindManyArgs>(args?: SelectSubset<T, KnowledgeSourceMessageFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$KnowledgeSourceMessagePayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a KnowledgeSourceMessage.
     * @param {KnowledgeSourceMessageCreateArgs} args - Arguments to create a KnowledgeSourceMessage.
     * @example
     * // Create one KnowledgeSourceMessage
     * const KnowledgeSourceMessage = await prisma.knowledgeSourceMessage.create({
     *   data: {
     *     // ... data to create a KnowledgeSourceMessage
     *   }
     * })
     * 
     */
    create<T extends KnowledgeSourceMessageCreateArgs>(args: SelectSubset<T, KnowledgeSourceMessageCreateArgs<ExtArgs>>): Prisma__KnowledgeSourceMessageClient<$Result.GetResult<Prisma.$KnowledgeSourceMessagePayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many KnowledgeSourceMessages.
     * @param {KnowledgeSourceMessageCreateManyArgs} args - Arguments to create many KnowledgeSourceMessages.
     * @example
     * // Create many KnowledgeSourceMessages
     * const knowledgeSourceMessage = await prisma.knowledgeSourceMessage.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends KnowledgeSourceMessageCreateManyArgs>(args?: SelectSubset<T, KnowledgeSourceMessageCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many KnowledgeSourceMessages and returns the data saved in the database.
     * @param {KnowledgeSourceMessageCreateManyAndReturnArgs} args - Arguments to create many KnowledgeSourceMessages.
     * @example
     * // Create many KnowledgeSourceMessages
     * const knowledgeSourceMessage = await prisma.knowledgeSourceMessage.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many KnowledgeSourceMessages and only return the `id`
     * const knowledgeSourceMessageWithIdOnly = await prisma.knowledgeSourceMessage.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends KnowledgeSourceMessageCreateManyAndReturnArgs>(args?: SelectSubset<T, KnowledgeSourceMessageCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$KnowledgeSourceMessagePayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a KnowledgeSourceMessage.
     * @param {KnowledgeSourceMessageDeleteArgs} args - Arguments to delete one KnowledgeSourceMessage.
     * @example
     * // Delete one KnowledgeSourceMessage
     * const KnowledgeSourceMessage = await prisma.knowledgeSourceMessage.delete({
     *   where: {
     *     // ... filter to delete one KnowledgeSourceMessage
     *   }
     * })
     * 
     */
    delete<T extends KnowledgeSourceMessageDeleteArgs>(args: SelectSubset<T, KnowledgeSourceMessageDeleteArgs<ExtArgs>>): Prisma__KnowledgeSourceMessageClient<$Result.GetResult<Prisma.$KnowledgeSourceMessagePayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one KnowledgeSourceMessage.
     * @param {KnowledgeSourceMessageUpdateArgs} args - Arguments to update one KnowledgeSourceMessage.
     * @example
     * // Update one KnowledgeSourceMessage
     * const knowledgeSourceMessage = await prisma.knowledgeSourceMessage.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends KnowledgeSourceMessageUpdateArgs>(args: SelectSubset<T, KnowledgeSourceMessageUpdateArgs<ExtArgs>>): Prisma__KnowledgeSourceMessageClient<$Result.GetResult<Prisma.$KnowledgeSourceMessagePayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more KnowledgeSourceMessages.
     * @param {KnowledgeSourceMessageDeleteManyArgs} args - Arguments to filter KnowledgeSourceMessages to delete.
     * @example
     * // Delete a few KnowledgeSourceMessages
     * const { count } = await prisma.knowledgeSourceMessage.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends KnowledgeSourceMessageDeleteManyArgs>(args?: SelectSubset<T, KnowledgeSourceMessageDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more KnowledgeSourceMessages.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {KnowledgeSourceMessageUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many KnowledgeSourceMessages
     * const knowledgeSourceMessage = await prisma.knowledgeSourceMessage.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends KnowledgeSourceMessageUpdateManyArgs>(args: SelectSubset<T, KnowledgeSourceMessageUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more KnowledgeSourceMessages and returns the data updated in the database.
     * @param {KnowledgeSourceMessageUpdateManyAndReturnArgs} args - Arguments to update many KnowledgeSourceMessages.
     * @example
     * // Update many KnowledgeSourceMessages
     * const knowledgeSourceMessage = await prisma.knowledgeSourceMessage.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more KnowledgeSourceMessages and only return the `id`
     * const knowledgeSourceMessageWithIdOnly = await prisma.knowledgeSourceMessage.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends KnowledgeSourceMessageUpdateManyAndReturnArgs>(args: SelectSubset<T, KnowledgeSourceMessageUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$KnowledgeSourceMessagePayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one KnowledgeSourceMessage.
     * @param {KnowledgeSourceMessageUpsertArgs} args - Arguments to update or create a KnowledgeSourceMessage.
     * @example
     * // Update or create a KnowledgeSourceMessage
     * const knowledgeSourceMessage = await prisma.knowledgeSourceMessage.upsert({
     *   create: {
     *     // ... data to create a KnowledgeSourceMessage
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the KnowledgeSourceMessage we want to update
     *   }
     * })
     */
    upsert<T extends KnowledgeSourceMessageUpsertArgs>(args: SelectSubset<T, KnowledgeSourceMessageUpsertArgs<ExtArgs>>): Prisma__KnowledgeSourceMessageClient<$Result.GetResult<Prisma.$KnowledgeSourceMessagePayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of KnowledgeSourceMessages.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {KnowledgeSourceMessageCountArgs} args - Arguments to filter KnowledgeSourceMessages to count.
     * @example
     * // Count the number of KnowledgeSourceMessages
     * const count = await prisma.knowledgeSourceMessage.count({
     *   where: {
     *     // ... the filter for the KnowledgeSourceMessages we want to count
     *   }
     * })
    **/
    count<T extends KnowledgeSourceMessageCountArgs>(
      args?: Subset<T, KnowledgeSourceMessageCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], KnowledgeSourceMessageCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a KnowledgeSourceMessage.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {KnowledgeSourceMessageAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends KnowledgeSourceMessageAggregateArgs>(args: Subset<T, KnowledgeSourceMessageAggregateArgs>): Prisma.PrismaPromise<GetKnowledgeSourceMessageAggregateType<T>>

    /**
     * Group by KnowledgeSourceMessage.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {KnowledgeSourceMessageGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends KnowledgeSourceMessageGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: KnowledgeSourceMessageGroupByArgs['orderBy'] }
        : { orderBy?: KnowledgeSourceMessageGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, KnowledgeSourceMessageGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetKnowledgeSourceMessageGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the KnowledgeSourceMessage model
   */
  readonly fields: KnowledgeSourceMessageFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for KnowledgeSourceMessage.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__KnowledgeSourceMessageClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    knowledge<T extends ContactKnowledgeDefaultArgs<ExtArgs> = {}>(args?: Subset<T, ContactKnowledgeDefaultArgs<ExtArgs>>): Prisma__ContactKnowledgeClient<$Result.GetResult<Prisma.$ContactKnowledgePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    message<T extends MessageDefaultArgs<ExtArgs> = {}>(args?: Subset<T, MessageDefaultArgs<ExtArgs>>): Prisma__MessageClient<$Result.GetResult<Prisma.$MessagePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the KnowledgeSourceMessage model
   */
  interface KnowledgeSourceMessageFieldRefs {
    readonly id: FieldRef<"KnowledgeSourceMessage", 'String'>
    readonly knowledgeId: FieldRef<"KnowledgeSourceMessage", 'String'>
    readonly messageId: FieldRef<"KnowledgeSourceMessage", 'String'>
    readonly role: FieldRef<"KnowledgeSourceMessage", 'String'>
  }
    

  // Custom InputTypes
  /**
   * KnowledgeSourceMessage findUnique
   */
  export type KnowledgeSourceMessageFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the KnowledgeSourceMessage
     */
    select?: KnowledgeSourceMessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the KnowledgeSourceMessage
     */
    omit?: KnowledgeSourceMessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: KnowledgeSourceMessageInclude<ExtArgs> | null
    /**
     * Filter, which KnowledgeSourceMessage to fetch.
     */
    where: KnowledgeSourceMessageWhereUniqueInput
  }

  /**
   * KnowledgeSourceMessage findUniqueOrThrow
   */
  export type KnowledgeSourceMessageFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the KnowledgeSourceMessage
     */
    select?: KnowledgeSourceMessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the KnowledgeSourceMessage
     */
    omit?: KnowledgeSourceMessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: KnowledgeSourceMessageInclude<ExtArgs> | null
    /**
     * Filter, which KnowledgeSourceMessage to fetch.
     */
    where: KnowledgeSourceMessageWhereUniqueInput
  }

  /**
   * KnowledgeSourceMessage findFirst
   */
  export type KnowledgeSourceMessageFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the KnowledgeSourceMessage
     */
    select?: KnowledgeSourceMessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the KnowledgeSourceMessage
     */
    omit?: KnowledgeSourceMessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: KnowledgeSourceMessageInclude<ExtArgs> | null
    /**
     * Filter, which KnowledgeSourceMessage to fetch.
     */
    where?: KnowledgeSourceMessageWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of KnowledgeSourceMessages to fetch.
     */
    orderBy?: KnowledgeSourceMessageOrderByWithRelationInput | KnowledgeSourceMessageOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for KnowledgeSourceMessages.
     */
    cursor?: KnowledgeSourceMessageWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` KnowledgeSourceMessages from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` KnowledgeSourceMessages.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of KnowledgeSourceMessages.
     */
    distinct?: KnowledgeSourceMessageScalarFieldEnum | KnowledgeSourceMessageScalarFieldEnum[]
  }

  /**
   * KnowledgeSourceMessage findFirstOrThrow
   */
  export type KnowledgeSourceMessageFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the KnowledgeSourceMessage
     */
    select?: KnowledgeSourceMessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the KnowledgeSourceMessage
     */
    omit?: KnowledgeSourceMessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: KnowledgeSourceMessageInclude<ExtArgs> | null
    /**
     * Filter, which KnowledgeSourceMessage to fetch.
     */
    where?: KnowledgeSourceMessageWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of KnowledgeSourceMessages to fetch.
     */
    orderBy?: KnowledgeSourceMessageOrderByWithRelationInput | KnowledgeSourceMessageOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for KnowledgeSourceMessages.
     */
    cursor?: KnowledgeSourceMessageWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` KnowledgeSourceMessages from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` KnowledgeSourceMessages.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of KnowledgeSourceMessages.
     */
    distinct?: KnowledgeSourceMessageScalarFieldEnum | KnowledgeSourceMessageScalarFieldEnum[]
  }

  /**
   * KnowledgeSourceMessage findMany
   */
  export type KnowledgeSourceMessageFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the KnowledgeSourceMessage
     */
    select?: KnowledgeSourceMessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the KnowledgeSourceMessage
     */
    omit?: KnowledgeSourceMessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: KnowledgeSourceMessageInclude<ExtArgs> | null
    /**
     * Filter, which KnowledgeSourceMessages to fetch.
     */
    where?: KnowledgeSourceMessageWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of KnowledgeSourceMessages to fetch.
     */
    orderBy?: KnowledgeSourceMessageOrderByWithRelationInput | KnowledgeSourceMessageOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing KnowledgeSourceMessages.
     */
    cursor?: KnowledgeSourceMessageWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` KnowledgeSourceMessages from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` KnowledgeSourceMessages.
     */
    skip?: number
    distinct?: KnowledgeSourceMessageScalarFieldEnum | KnowledgeSourceMessageScalarFieldEnum[]
  }

  /**
   * KnowledgeSourceMessage create
   */
  export type KnowledgeSourceMessageCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the KnowledgeSourceMessage
     */
    select?: KnowledgeSourceMessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the KnowledgeSourceMessage
     */
    omit?: KnowledgeSourceMessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: KnowledgeSourceMessageInclude<ExtArgs> | null
    /**
     * The data needed to create a KnowledgeSourceMessage.
     */
    data: XOR<KnowledgeSourceMessageCreateInput, KnowledgeSourceMessageUncheckedCreateInput>
  }

  /**
   * KnowledgeSourceMessage createMany
   */
  export type KnowledgeSourceMessageCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many KnowledgeSourceMessages.
     */
    data: KnowledgeSourceMessageCreateManyInput | KnowledgeSourceMessageCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * KnowledgeSourceMessage createManyAndReturn
   */
  export type KnowledgeSourceMessageCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the KnowledgeSourceMessage
     */
    select?: KnowledgeSourceMessageSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the KnowledgeSourceMessage
     */
    omit?: KnowledgeSourceMessageOmit<ExtArgs> | null
    /**
     * The data used to create many KnowledgeSourceMessages.
     */
    data: KnowledgeSourceMessageCreateManyInput | KnowledgeSourceMessageCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: KnowledgeSourceMessageIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * KnowledgeSourceMessage update
   */
  export type KnowledgeSourceMessageUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the KnowledgeSourceMessage
     */
    select?: KnowledgeSourceMessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the KnowledgeSourceMessage
     */
    omit?: KnowledgeSourceMessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: KnowledgeSourceMessageInclude<ExtArgs> | null
    /**
     * The data needed to update a KnowledgeSourceMessage.
     */
    data: XOR<KnowledgeSourceMessageUpdateInput, KnowledgeSourceMessageUncheckedUpdateInput>
    /**
     * Choose, which KnowledgeSourceMessage to update.
     */
    where: KnowledgeSourceMessageWhereUniqueInput
  }

  /**
   * KnowledgeSourceMessage updateMany
   */
  export type KnowledgeSourceMessageUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update KnowledgeSourceMessages.
     */
    data: XOR<KnowledgeSourceMessageUpdateManyMutationInput, KnowledgeSourceMessageUncheckedUpdateManyInput>
    /**
     * Filter which KnowledgeSourceMessages to update
     */
    where?: KnowledgeSourceMessageWhereInput
    /**
     * Limit how many KnowledgeSourceMessages to update.
     */
    limit?: number
  }

  /**
   * KnowledgeSourceMessage updateManyAndReturn
   */
  export type KnowledgeSourceMessageUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the KnowledgeSourceMessage
     */
    select?: KnowledgeSourceMessageSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the KnowledgeSourceMessage
     */
    omit?: KnowledgeSourceMessageOmit<ExtArgs> | null
    /**
     * The data used to update KnowledgeSourceMessages.
     */
    data: XOR<KnowledgeSourceMessageUpdateManyMutationInput, KnowledgeSourceMessageUncheckedUpdateManyInput>
    /**
     * Filter which KnowledgeSourceMessages to update
     */
    where?: KnowledgeSourceMessageWhereInput
    /**
     * Limit how many KnowledgeSourceMessages to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: KnowledgeSourceMessageIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * KnowledgeSourceMessage upsert
   */
  export type KnowledgeSourceMessageUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the KnowledgeSourceMessage
     */
    select?: KnowledgeSourceMessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the KnowledgeSourceMessage
     */
    omit?: KnowledgeSourceMessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: KnowledgeSourceMessageInclude<ExtArgs> | null
    /**
     * The filter to search for the KnowledgeSourceMessage to update in case it exists.
     */
    where: KnowledgeSourceMessageWhereUniqueInput
    /**
     * In case the KnowledgeSourceMessage found by the `where` argument doesn't exist, create a new KnowledgeSourceMessage with this data.
     */
    create: XOR<KnowledgeSourceMessageCreateInput, KnowledgeSourceMessageUncheckedCreateInput>
    /**
     * In case the KnowledgeSourceMessage was found with the provided `where` argument, update it with this data.
     */
    update: XOR<KnowledgeSourceMessageUpdateInput, KnowledgeSourceMessageUncheckedUpdateInput>
  }

  /**
   * KnowledgeSourceMessage delete
   */
  export type KnowledgeSourceMessageDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the KnowledgeSourceMessage
     */
    select?: KnowledgeSourceMessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the KnowledgeSourceMessage
     */
    omit?: KnowledgeSourceMessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: KnowledgeSourceMessageInclude<ExtArgs> | null
    /**
     * Filter which KnowledgeSourceMessage to delete.
     */
    where: KnowledgeSourceMessageWhereUniqueInput
  }

  /**
   * KnowledgeSourceMessage deleteMany
   */
  export type KnowledgeSourceMessageDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which KnowledgeSourceMessages to delete
     */
    where?: KnowledgeSourceMessageWhereInput
    /**
     * Limit how many KnowledgeSourceMessages to delete.
     */
    limit?: number
  }

  /**
   * KnowledgeSourceMessage without action
   */
  export type KnowledgeSourceMessageDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the KnowledgeSourceMessage
     */
    select?: KnowledgeSourceMessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the KnowledgeSourceMessage
     */
    omit?: KnowledgeSourceMessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: KnowledgeSourceMessageInclude<ExtArgs> | null
  }


  /**
   * Enums
   */

  export const TransactionIsolationLevel: {
    ReadUncommitted: 'ReadUncommitted',
    ReadCommitted: 'ReadCommitted',
    RepeatableRead: 'RepeatableRead',
    Serializable: 'Serializable'
  };

  export type TransactionIsolationLevel = (typeof TransactionIsolationLevel)[keyof typeof TransactionIsolationLevel]


  export const ContactScalarFieldEnum: {
    id: 'id',
    name: 'name',
    business: 'business',
    category: 'category',
    phone: 'phone',
    email: 'email',
    initials: 'initials',
    color: 'color',
    note: 'note',
    online: 'online',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type ContactScalarFieldEnum = (typeof ContactScalarFieldEnum)[keyof typeof ContactScalarFieldEnum]


  export const ConversationScalarFieldEnum: {
    id: 'id',
    title: 'title',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    lastExtractedMessageId: 'lastExtractedMessageId',
    lastExtractedAt: 'lastExtractedAt',
    contactId: 'contactId'
  };

  export type ConversationScalarFieldEnum = (typeof ConversationScalarFieldEnum)[keyof typeof ConversationScalarFieldEnum]


  export const MessageScalarFieldEnum: {
    id: 'id',
    role: 'role',
    content: 'content',
    time: 'time',
    pending: 'pending',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    conversationId: 'conversationId',
    callId: 'callId'
  };

  export type MessageScalarFieldEnum = (typeof MessageScalarFieldEnum)[keyof typeof MessageScalarFieldEnum]


  export const HistoryScalarFieldEnum: {
    id: 'id',
    title: 'title',
    detail: 'detail',
    status: 'status',
    time: 'time',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    conversationId: 'conversationId'
  };

  export type HistoryScalarFieldEnum = (typeof HistoryScalarFieldEnum)[keyof typeof HistoryScalarFieldEnum]


  export const TaskScalarFieldEnum: {
    id: 'id',
    title: 'title',
    description: 'description',
    status: 'status',
    priority: 'priority',
    dueDate: 'dueDate',
    confidence: 'confidence',
    source: 'source',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    completedAt: 'completedAt',
    conversationId: 'conversationId',
    contactId: 'contactId'
  };

  export type TaskScalarFieldEnum = (typeof TaskScalarFieldEnum)[keyof typeof TaskScalarFieldEnum]


  export const TaskSourceMessageScalarFieldEnum: {
    id: 'id',
    taskId: 'taskId',
    messageId: 'messageId',
    role: 'role'
  };

  export type TaskSourceMessageScalarFieldEnum = (typeof TaskSourceMessageScalarFieldEnum)[keyof typeof TaskSourceMessageScalarFieldEnum]


  export const QueryScalarFieldEnum: {
    id: 'id',
    question: 'question',
    answer: 'answer',
    status: 'status',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    answeredAt: 'answeredAt',
    answerMessageId: 'answerMessageId',
    conversationId: 'conversationId',
    contactId: 'contactId'
  };

  export type QueryScalarFieldEnum = (typeof QueryScalarFieldEnum)[keyof typeof QueryScalarFieldEnum]


  export const QuerySourceMessageScalarFieldEnum: {
    id: 'id',
    queryId: 'queryId',
    messageId: 'messageId',
    role: 'role'
  };

  export type QuerySourceMessageScalarFieldEnum = (typeof QuerySourceMessageScalarFieldEnum)[keyof typeof QuerySourceMessageScalarFieldEnum]


  export const CallScalarFieldEnum: {
    id: 'id',
    twilioSid: 'twilioSid',
    status: 'status',
    direction: 'direction',
    duration: 'duration',
    startedAt: 'startedAt',
    endedAt: 'endedAt',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    conversationId: 'conversationId',
    contactId: 'contactId'
  };

  export type CallScalarFieldEnum = (typeof CallScalarFieldEnum)[keyof typeof CallScalarFieldEnum]


  export const EmailScalarFieldEnum: {
    id: 'id',
    twilioSid: 'twilioSid',
    status: 'status',
    direction: 'direction',
    subject: 'subject',
    from: 'from',
    to: 'to',
    body: 'body',
    html: 'html',
    sentAt: 'sentAt',
    deliveredAt: 'deliveredAt',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    conversationId: 'conversationId',
    contactId: 'contactId'
  };

  export type EmailScalarFieldEnum = (typeof EmailScalarFieldEnum)[keyof typeof EmailScalarFieldEnum]


  export const ContactKnowledgeScalarFieldEnum: {
    id: 'id',
    contactId: 'contactId',
    category: 'category',
    key: 'key',
    value: 'value',
    confidence: 'confidence',
    status: 'status',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type ContactKnowledgeScalarFieldEnum = (typeof ContactKnowledgeScalarFieldEnum)[keyof typeof ContactKnowledgeScalarFieldEnum]


  export const KnowledgeSourceMessageScalarFieldEnum: {
    id: 'id',
    knowledgeId: 'knowledgeId',
    messageId: 'messageId',
    role: 'role'
  };

  export type KnowledgeSourceMessageScalarFieldEnum = (typeof KnowledgeSourceMessageScalarFieldEnum)[keyof typeof KnowledgeSourceMessageScalarFieldEnum]


  export const SortOrder: {
    asc: 'asc',
    desc: 'desc'
  };

  export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder]


  export const QueryMode: {
    default: 'default',
    insensitive: 'insensitive'
  };

  export type QueryMode = (typeof QueryMode)[keyof typeof QueryMode]


  export const NullsOrder: {
    first: 'first',
    last: 'last'
  };

  export type NullsOrder = (typeof NullsOrder)[keyof typeof NullsOrder]


  /**
   * Field references
   */


  /**
   * Reference to a field of type 'String'
   */
  export type StringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String'>
    


  /**
   * Reference to a field of type 'String[]'
   */
  export type ListStringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String[]'>
    


  /**
   * Reference to a field of type 'Boolean'
   */
  export type BooleanFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Boolean'>
    


  /**
   * Reference to a field of type 'DateTime'
   */
  export type DateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime'>
    


  /**
   * Reference to a field of type 'DateTime[]'
   */
  export type ListDateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime[]'>
    


  /**
   * Reference to a field of type 'Float'
   */
  export type FloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float'>
    


  /**
   * Reference to a field of type 'Float[]'
   */
  export type ListFloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float[]'>
    


  /**
   * Reference to a field of type 'Int'
   */
  export type IntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int'>
    


  /**
   * Reference to a field of type 'Int[]'
   */
  export type ListIntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int[]'>
    
  /**
   * Deep Input Types
   */


  export type ContactWhereInput = {
    AND?: ContactWhereInput | ContactWhereInput[]
    OR?: ContactWhereInput[]
    NOT?: ContactWhereInput | ContactWhereInput[]
    id?: StringFilter<"Contact"> | string
    name?: StringFilter<"Contact"> | string
    business?: StringFilter<"Contact"> | string
    category?: StringFilter<"Contact"> | string
    phone?: StringFilter<"Contact"> | string
    email?: StringNullableFilter<"Contact"> | string | null
    initials?: StringFilter<"Contact"> | string
    color?: StringFilter<"Contact"> | string
    note?: StringNullableFilter<"Contact"> | string | null
    online?: BoolFilter<"Contact"> | boolean
    createdAt?: DateTimeFilter<"Contact"> | Date | string
    updatedAt?: DateTimeFilter<"Contact"> | Date | string
    conversations?: ConversationListRelationFilter
    tasks?: TaskListRelationFilter
    queries?: QueryListRelationFilter
    knowledge?: ContactKnowledgeListRelationFilter
    calls?: CallListRelationFilter
    emails?: EmailListRelationFilter
  }

  export type ContactOrderByWithRelationInput = {
    id?: SortOrder
    name?: SortOrder
    business?: SortOrder
    category?: SortOrder
    phone?: SortOrder
    email?: SortOrderInput | SortOrder
    initials?: SortOrder
    color?: SortOrder
    note?: SortOrderInput | SortOrder
    online?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    conversations?: ConversationOrderByRelationAggregateInput
    tasks?: TaskOrderByRelationAggregateInput
    queries?: QueryOrderByRelationAggregateInput
    knowledge?: ContactKnowledgeOrderByRelationAggregateInput
    calls?: CallOrderByRelationAggregateInput
    emails?: EmailOrderByRelationAggregateInput
  }

  export type ContactWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: ContactWhereInput | ContactWhereInput[]
    OR?: ContactWhereInput[]
    NOT?: ContactWhereInput | ContactWhereInput[]
    name?: StringFilter<"Contact"> | string
    business?: StringFilter<"Contact"> | string
    category?: StringFilter<"Contact"> | string
    phone?: StringFilter<"Contact"> | string
    email?: StringNullableFilter<"Contact"> | string | null
    initials?: StringFilter<"Contact"> | string
    color?: StringFilter<"Contact"> | string
    note?: StringNullableFilter<"Contact"> | string | null
    online?: BoolFilter<"Contact"> | boolean
    createdAt?: DateTimeFilter<"Contact"> | Date | string
    updatedAt?: DateTimeFilter<"Contact"> | Date | string
    conversations?: ConversationListRelationFilter
    tasks?: TaskListRelationFilter
    queries?: QueryListRelationFilter
    knowledge?: ContactKnowledgeListRelationFilter
    calls?: CallListRelationFilter
    emails?: EmailListRelationFilter
  }, "id">

  export type ContactOrderByWithAggregationInput = {
    id?: SortOrder
    name?: SortOrder
    business?: SortOrder
    category?: SortOrder
    phone?: SortOrder
    email?: SortOrderInput | SortOrder
    initials?: SortOrder
    color?: SortOrder
    note?: SortOrderInput | SortOrder
    online?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: ContactCountOrderByAggregateInput
    _max?: ContactMaxOrderByAggregateInput
    _min?: ContactMinOrderByAggregateInput
  }

  export type ContactScalarWhereWithAggregatesInput = {
    AND?: ContactScalarWhereWithAggregatesInput | ContactScalarWhereWithAggregatesInput[]
    OR?: ContactScalarWhereWithAggregatesInput[]
    NOT?: ContactScalarWhereWithAggregatesInput | ContactScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Contact"> | string
    name?: StringWithAggregatesFilter<"Contact"> | string
    business?: StringWithAggregatesFilter<"Contact"> | string
    category?: StringWithAggregatesFilter<"Contact"> | string
    phone?: StringWithAggregatesFilter<"Contact"> | string
    email?: StringNullableWithAggregatesFilter<"Contact"> | string | null
    initials?: StringWithAggregatesFilter<"Contact"> | string
    color?: StringWithAggregatesFilter<"Contact"> | string
    note?: StringNullableWithAggregatesFilter<"Contact"> | string | null
    online?: BoolWithAggregatesFilter<"Contact"> | boolean
    createdAt?: DateTimeWithAggregatesFilter<"Contact"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Contact"> | Date | string
  }

  export type ConversationWhereInput = {
    AND?: ConversationWhereInput | ConversationWhereInput[]
    OR?: ConversationWhereInput[]
    NOT?: ConversationWhereInput | ConversationWhereInput[]
    id?: StringFilter<"Conversation"> | string
    title?: StringNullableFilter<"Conversation"> | string | null
    createdAt?: DateTimeFilter<"Conversation"> | Date | string
    updatedAt?: DateTimeFilter<"Conversation"> | Date | string
    lastExtractedMessageId?: StringNullableFilter<"Conversation"> | string | null
    lastExtractedAt?: DateTimeNullableFilter<"Conversation"> | Date | string | null
    contactId?: StringFilter<"Conversation"> | string
    messages?: MessageListRelationFilter
    history?: HistoryListRelationFilter
    tasks?: TaskListRelationFilter
    contact?: XOR<ContactScalarRelationFilter, ContactWhereInput>
    queries?: QueryListRelationFilter
    calls?: CallListRelationFilter
    emails?: EmailListRelationFilter
  }

  export type ConversationOrderByWithRelationInput = {
    id?: SortOrder
    title?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    lastExtractedMessageId?: SortOrderInput | SortOrder
    lastExtractedAt?: SortOrderInput | SortOrder
    contactId?: SortOrder
    messages?: MessageOrderByRelationAggregateInput
    history?: HistoryOrderByRelationAggregateInput
    tasks?: TaskOrderByRelationAggregateInput
    contact?: ContactOrderByWithRelationInput
    queries?: QueryOrderByRelationAggregateInput
    calls?: CallOrderByRelationAggregateInput
    emails?: EmailOrderByRelationAggregateInput
  }

  export type ConversationWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: ConversationWhereInput | ConversationWhereInput[]
    OR?: ConversationWhereInput[]
    NOT?: ConversationWhereInput | ConversationWhereInput[]
    title?: StringNullableFilter<"Conversation"> | string | null
    createdAt?: DateTimeFilter<"Conversation"> | Date | string
    updatedAt?: DateTimeFilter<"Conversation"> | Date | string
    lastExtractedMessageId?: StringNullableFilter<"Conversation"> | string | null
    lastExtractedAt?: DateTimeNullableFilter<"Conversation"> | Date | string | null
    contactId?: StringFilter<"Conversation"> | string
    messages?: MessageListRelationFilter
    history?: HistoryListRelationFilter
    tasks?: TaskListRelationFilter
    contact?: XOR<ContactScalarRelationFilter, ContactWhereInput>
    queries?: QueryListRelationFilter
    calls?: CallListRelationFilter
    emails?: EmailListRelationFilter
  }, "id">

  export type ConversationOrderByWithAggregationInput = {
    id?: SortOrder
    title?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    lastExtractedMessageId?: SortOrderInput | SortOrder
    lastExtractedAt?: SortOrderInput | SortOrder
    contactId?: SortOrder
    _count?: ConversationCountOrderByAggregateInput
    _max?: ConversationMaxOrderByAggregateInput
    _min?: ConversationMinOrderByAggregateInput
  }

  export type ConversationScalarWhereWithAggregatesInput = {
    AND?: ConversationScalarWhereWithAggregatesInput | ConversationScalarWhereWithAggregatesInput[]
    OR?: ConversationScalarWhereWithAggregatesInput[]
    NOT?: ConversationScalarWhereWithAggregatesInput | ConversationScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Conversation"> | string
    title?: StringNullableWithAggregatesFilter<"Conversation"> | string | null
    createdAt?: DateTimeWithAggregatesFilter<"Conversation"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Conversation"> | Date | string
    lastExtractedMessageId?: StringNullableWithAggregatesFilter<"Conversation"> | string | null
    lastExtractedAt?: DateTimeNullableWithAggregatesFilter<"Conversation"> | Date | string | null
    contactId?: StringWithAggregatesFilter<"Conversation"> | string
  }

  export type MessageWhereInput = {
    AND?: MessageWhereInput | MessageWhereInput[]
    OR?: MessageWhereInput[]
    NOT?: MessageWhereInput | MessageWhereInput[]
    id?: StringFilter<"Message"> | string
    role?: StringFilter<"Message"> | string
    content?: StringFilter<"Message"> | string
    time?: StringFilter<"Message"> | string
    pending?: BoolFilter<"Message"> | boolean
    createdAt?: DateTimeFilter<"Message"> | Date | string
    updatedAt?: DateTimeFilter<"Message"> | Date | string
    conversationId?: StringFilter<"Message"> | string
    callId?: StringNullableFilter<"Message"> | string | null
    conversation?: XOR<ConversationScalarRelationFilter, ConversationWhereInput>
    call?: XOR<CallNullableScalarRelationFilter, CallWhereInput> | null
    taskSources?: TaskSourceMessageListRelationFilter
    querySources?: QuerySourceMessageListRelationFilter
    knowledgeSources?: KnowledgeSourceMessageListRelationFilter
  }

  export type MessageOrderByWithRelationInput = {
    id?: SortOrder
    role?: SortOrder
    content?: SortOrder
    time?: SortOrder
    pending?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    conversationId?: SortOrder
    callId?: SortOrderInput | SortOrder
    conversation?: ConversationOrderByWithRelationInput
    call?: CallOrderByWithRelationInput
    taskSources?: TaskSourceMessageOrderByRelationAggregateInput
    querySources?: QuerySourceMessageOrderByRelationAggregateInput
    knowledgeSources?: KnowledgeSourceMessageOrderByRelationAggregateInput
  }

  export type MessageWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: MessageWhereInput | MessageWhereInput[]
    OR?: MessageWhereInput[]
    NOT?: MessageWhereInput | MessageWhereInput[]
    role?: StringFilter<"Message"> | string
    content?: StringFilter<"Message"> | string
    time?: StringFilter<"Message"> | string
    pending?: BoolFilter<"Message"> | boolean
    createdAt?: DateTimeFilter<"Message"> | Date | string
    updatedAt?: DateTimeFilter<"Message"> | Date | string
    conversationId?: StringFilter<"Message"> | string
    callId?: StringNullableFilter<"Message"> | string | null
    conversation?: XOR<ConversationScalarRelationFilter, ConversationWhereInput>
    call?: XOR<CallNullableScalarRelationFilter, CallWhereInput> | null
    taskSources?: TaskSourceMessageListRelationFilter
    querySources?: QuerySourceMessageListRelationFilter
    knowledgeSources?: KnowledgeSourceMessageListRelationFilter
  }, "id">

  export type MessageOrderByWithAggregationInput = {
    id?: SortOrder
    role?: SortOrder
    content?: SortOrder
    time?: SortOrder
    pending?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    conversationId?: SortOrder
    callId?: SortOrderInput | SortOrder
    _count?: MessageCountOrderByAggregateInput
    _max?: MessageMaxOrderByAggregateInput
    _min?: MessageMinOrderByAggregateInput
  }

  export type MessageScalarWhereWithAggregatesInput = {
    AND?: MessageScalarWhereWithAggregatesInput | MessageScalarWhereWithAggregatesInput[]
    OR?: MessageScalarWhereWithAggregatesInput[]
    NOT?: MessageScalarWhereWithAggregatesInput | MessageScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Message"> | string
    role?: StringWithAggregatesFilter<"Message"> | string
    content?: StringWithAggregatesFilter<"Message"> | string
    time?: StringWithAggregatesFilter<"Message"> | string
    pending?: BoolWithAggregatesFilter<"Message"> | boolean
    createdAt?: DateTimeWithAggregatesFilter<"Message"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Message"> | Date | string
    conversationId?: StringWithAggregatesFilter<"Message"> | string
    callId?: StringNullableWithAggregatesFilter<"Message"> | string | null
  }

  export type HistoryWhereInput = {
    AND?: HistoryWhereInput | HistoryWhereInput[]
    OR?: HistoryWhereInput[]
    NOT?: HistoryWhereInput | HistoryWhereInput[]
    id?: StringFilter<"History"> | string
    title?: StringFilter<"History"> | string
    detail?: StringFilter<"History"> | string
    status?: StringFilter<"History"> | string
    time?: StringFilter<"History"> | string
    createdAt?: DateTimeFilter<"History"> | Date | string
    updatedAt?: DateTimeFilter<"History"> | Date | string
    conversationId?: StringFilter<"History"> | string
    conversation?: XOR<ConversationScalarRelationFilter, ConversationWhereInput>
  }

  export type HistoryOrderByWithRelationInput = {
    id?: SortOrder
    title?: SortOrder
    detail?: SortOrder
    status?: SortOrder
    time?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    conversationId?: SortOrder
    conversation?: ConversationOrderByWithRelationInput
  }

  export type HistoryWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: HistoryWhereInput | HistoryWhereInput[]
    OR?: HistoryWhereInput[]
    NOT?: HistoryWhereInput | HistoryWhereInput[]
    title?: StringFilter<"History"> | string
    detail?: StringFilter<"History"> | string
    status?: StringFilter<"History"> | string
    time?: StringFilter<"History"> | string
    createdAt?: DateTimeFilter<"History"> | Date | string
    updatedAt?: DateTimeFilter<"History"> | Date | string
    conversationId?: StringFilter<"History"> | string
    conversation?: XOR<ConversationScalarRelationFilter, ConversationWhereInput>
  }, "id">

  export type HistoryOrderByWithAggregationInput = {
    id?: SortOrder
    title?: SortOrder
    detail?: SortOrder
    status?: SortOrder
    time?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    conversationId?: SortOrder
    _count?: HistoryCountOrderByAggregateInput
    _max?: HistoryMaxOrderByAggregateInput
    _min?: HistoryMinOrderByAggregateInput
  }

  export type HistoryScalarWhereWithAggregatesInput = {
    AND?: HistoryScalarWhereWithAggregatesInput | HistoryScalarWhereWithAggregatesInput[]
    OR?: HistoryScalarWhereWithAggregatesInput[]
    NOT?: HistoryScalarWhereWithAggregatesInput | HistoryScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"History"> | string
    title?: StringWithAggregatesFilter<"History"> | string
    detail?: StringWithAggregatesFilter<"History"> | string
    status?: StringWithAggregatesFilter<"History"> | string
    time?: StringWithAggregatesFilter<"History"> | string
    createdAt?: DateTimeWithAggregatesFilter<"History"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"History"> | Date | string
    conversationId?: StringWithAggregatesFilter<"History"> | string
  }

  export type TaskWhereInput = {
    AND?: TaskWhereInput | TaskWhereInput[]
    OR?: TaskWhereInput[]
    NOT?: TaskWhereInput | TaskWhereInput[]
    id?: StringFilter<"Task"> | string
    title?: StringFilter<"Task"> | string
    description?: StringNullableFilter<"Task"> | string | null
    status?: StringFilter<"Task"> | string
    priority?: StringFilter<"Task"> | string
    dueDate?: DateTimeNullableFilter<"Task"> | Date | string | null
    confidence?: FloatFilter<"Task"> | number
    source?: StringFilter<"Task"> | string
    createdAt?: DateTimeFilter<"Task"> | Date | string
    updatedAt?: DateTimeFilter<"Task"> | Date | string
    completedAt?: DateTimeNullableFilter<"Task"> | Date | string | null
    conversationId?: StringFilter<"Task"> | string
    contactId?: StringFilter<"Task"> | string
    conversation?: XOR<ConversationScalarRelationFilter, ConversationWhereInput>
    contact?: XOR<ContactScalarRelationFilter, ContactWhereInput>
    sources?: TaskSourceMessageListRelationFilter
  }

  export type TaskOrderByWithRelationInput = {
    id?: SortOrder
    title?: SortOrder
    description?: SortOrderInput | SortOrder
    status?: SortOrder
    priority?: SortOrder
    dueDate?: SortOrderInput | SortOrder
    confidence?: SortOrder
    source?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    completedAt?: SortOrderInput | SortOrder
    conversationId?: SortOrder
    contactId?: SortOrder
    conversation?: ConversationOrderByWithRelationInput
    contact?: ContactOrderByWithRelationInput
    sources?: TaskSourceMessageOrderByRelationAggregateInput
  }

  export type TaskWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: TaskWhereInput | TaskWhereInput[]
    OR?: TaskWhereInput[]
    NOT?: TaskWhereInput | TaskWhereInput[]
    title?: StringFilter<"Task"> | string
    description?: StringNullableFilter<"Task"> | string | null
    status?: StringFilter<"Task"> | string
    priority?: StringFilter<"Task"> | string
    dueDate?: DateTimeNullableFilter<"Task"> | Date | string | null
    confidence?: FloatFilter<"Task"> | number
    source?: StringFilter<"Task"> | string
    createdAt?: DateTimeFilter<"Task"> | Date | string
    updatedAt?: DateTimeFilter<"Task"> | Date | string
    completedAt?: DateTimeNullableFilter<"Task"> | Date | string | null
    conversationId?: StringFilter<"Task"> | string
    contactId?: StringFilter<"Task"> | string
    conversation?: XOR<ConversationScalarRelationFilter, ConversationWhereInput>
    contact?: XOR<ContactScalarRelationFilter, ContactWhereInput>
    sources?: TaskSourceMessageListRelationFilter
  }, "id">

  export type TaskOrderByWithAggregationInput = {
    id?: SortOrder
    title?: SortOrder
    description?: SortOrderInput | SortOrder
    status?: SortOrder
    priority?: SortOrder
    dueDate?: SortOrderInput | SortOrder
    confidence?: SortOrder
    source?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    completedAt?: SortOrderInput | SortOrder
    conversationId?: SortOrder
    contactId?: SortOrder
    _count?: TaskCountOrderByAggregateInput
    _avg?: TaskAvgOrderByAggregateInput
    _max?: TaskMaxOrderByAggregateInput
    _min?: TaskMinOrderByAggregateInput
    _sum?: TaskSumOrderByAggregateInput
  }

  export type TaskScalarWhereWithAggregatesInput = {
    AND?: TaskScalarWhereWithAggregatesInput | TaskScalarWhereWithAggregatesInput[]
    OR?: TaskScalarWhereWithAggregatesInput[]
    NOT?: TaskScalarWhereWithAggregatesInput | TaskScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Task"> | string
    title?: StringWithAggregatesFilter<"Task"> | string
    description?: StringNullableWithAggregatesFilter<"Task"> | string | null
    status?: StringWithAggregatesFilter<"Task"> | string
    priority?: StringWithAggregatesFilter<"Task"> | string
    dueDate?: DateTimeNullableWithAggregatesFilter<"Task"> | Date | string | null
    confidence?: FloatWithAggregatesFilter<"Task"> | number
    source?: StringWithAggregatesFilter<"Task"> | string
    createdAt?: DateTimeWithAggregatesFilter<"Task"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Task"> | Date | string
    completedAt?: DateTimeNullableWithAggregatesFilter<"Task"> | Date | string | null
    conversationId?: StringWithAggregatesFilter<"Task"> | string
    contactId?: StringWithAggregatesFilter<"Task"> | string
  }

  export type TaskSourceMessageWhereInput = {
    AND?: TaskSourceMessageWhereInput | TaskSourceMessageWhereInput[]
    OR?: TaskSourceMessageWhereInput[]
    NOT?: TaskSourceMessageWhereInput | TaskSourceMessageWhereInput[]
    id?: StringFilter<"TaskSourceMessage"> | string
    taskId?: StringFilter<"TaskSourceMessage"> | string
    messageId?: StringFilter<"TaskSourceMessage"> | string
    role?: StringFilter<"TaskSourceMessage"> | string
    task?: XOR<TaskScalarRelationFilter, TaskWhereInput>
    message?: XOR<MessageScalarRelationFilter, MessageWhereInput>
  }

  export type TaskSourceMessageOrderByWithRelationInput = {
    id?: SortOrder
    taskId?: SortOrder
    messageId?: SortOrder
    role?: SortOrder
    task?: TaskOrderByWithRelationInput
    message?: MessageOrderByWithRelationInput
  }

  export type TaskSourceMessageWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    taskId_messageId_role?: TaskSourceMessageTaskIdMessageIdRoleCompoundUniqueInput
    AND?: TaskSourceMessageWhereInput | TaskSourceMessageWhereInput[]
    OR?: TaskSourceMessageWhereInput[]
    NOT?: TaskSourceMessageWhereInput | TaskSourceMessageWhereInput[]
    taskId?: StringFilter<"TaskSourceMessage"> | string
    messageId?: StringFilter<"TaskSourceMessage"> | string
    role?: StringFilter<"TaskSourceMessage"> | string
    task?: XOR<TaskScalarRelationFilter, TaskWhereInput>
    message?: XOR<MessageScalarRelationFilter, MessageWhereInput>
  }, "id" | "taskId_messageId_role">

  export type TaskSourceMessageOrderByWithAggregationInput = {
    id?: SortOrder
    taskId?: SortOrder
    messageId?: SortOrder
    role?: SortOrder
    _count?: TaskSourceMessageCountOrderByAggregateInput
    _max?: TaskSourceMessageMaxOrderByAggregateInput
    _min?: TaskSourceMessageMinOrderByAggregateInput
  }

  export type TaskSourceMessageScalarWhereWithAggregatesInput = {
    AND?: TaskSourceMessageScalarWhereWithAggregatesInput | TaskSourceMessageScalarWhereWithAggregatesInput[]
    OR?: TaskSourceMessageScalarWhereWithAggregatesInput[]
    NOT?: TaskSourceMessageScalarWhereWithAggregatesInput | TaskSourceMessageScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"TaskSourceMessage"> | string
    taskId?: StringWithAggregatesFilter<"TaskSourceMessage"> | string
    messageId?: StringWithAggregatesFilter<"TaskSourceMessage"> | string
    role?: StringWithAggregatesFilter<"TaskSourceMessage"> | string
  }

  export type QueryWhereInput = {
    AND?: QueryWhereInput | QueryWhereInput[]
    OR?: QueryWhereInput[]
    NOT?: QueryWhereInput | QueryWhereInput[]
    id?: StringFilter<"Query"> | string
    question?: StringFilter<"Query"> | string
    answer?: StringNullableFilter<"Query"> | string | null
    status?: StringFilter<"Query"> | string
    createdAt?: DateTimeFilter<"Query"> | Date | string
    updatedAt?: DateTimeFilter<"Query"> | Date | string
    answeredAt?: DateTimeNullableFilter<"Query"> | Date | string | null
    answerMessageId?: StringNullableFilter<"Query"> | string | null
    conversationId?: StringFilter<"Query"> | string
    contactId?: StringFilter<"Query"> | string
    conversation?: XOR<ConversationScalarRelationFilter, ConversationWhereInput>
    contact?: XOR<ContactScalarRelationFilter, ContactWhereInput>
    sources?: QuerySourceMessageListRelationFilter
  }

  export type QueryOrderByWithRelationInput = {
    id?: SortOrder
    question?: SortOrder
    answer?: SortOrderInput | SortOrder
    status?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    answeredAt?: SortOrderInput | SortOrder
    answerMessageId?: SortOrderInput | SortOrder
    conversationId?: SortOrder
    contactId?: SortOrder
    conversation?: ConversationOrderByWithRelationInput
    contact?: ContactOrderByWithRelationInput
    sources?: QuerySourceMessageOrderByRelationAggregateInput
  }

  export type QueryWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: QueryWhereInput | QueryWhereInput[]
    OR?: QueryWhereInput[]
    NOT?: QueryWhereInput | QueryWhereInput[]
    question?: StringFilter<"Query"> | string
    answer?: StringNullableFilter<"Query"> | string | null
    status?: StringFilter<"Query"> | string
    createdAt?: DateTimeFilter<"Query"> | Date | string
    updatedAt?: DateTimeFilter<"Query"> | Date | string
    answeredAt?: DateTimeNullableFilter<"Query"> | Date | string | null
    answerMessageId?: StringNullableFilter<"Query"> | string | null
    conversationId?: StringFilter<"Query"> | string
    contactId?: StringFilter<"Query"> | string
    conversation?: XOR<ConversationScalarRelationFilter, ConversationWhereInput>
    contact?: XOR<ContactScalarRelationFilter, ContactWhereInput>
    sources?: QuerySourceMessageListRelationFilter
  }, "id">

  export type QueryOrderByWithAggregationInput = {
    id?: SortOrder
    question?: SortOrder
    answer?: SortOrderInput | SortOrder
    status?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    answeredAt?: SortOrderInput | SortOrder
    answerMessageId?: SortOrderInput | SortOrder
    conversationId?: SortOrder
    contactId?: SortOrder
    _count?: QueryCountOrderByAggregateInput
    _max?: QueryMaxOrderByAggregateInput
    _min?: QueryMinOrderByAggregateInput
  }

  export type QueryScalarWhereWithAggregatesInput = {
    AND?: QueryScalarWhereWithAggregatesInput | QueryScalarWhereWithAggregatesInput[]
    OR?: QueryScalarWhereWithAggregatesInput[]
    NOT?: QueryScalarWhereWithAggregatesInput | QueryScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Query"> | string
    question?: StringWithAggregatesFilter<"Query"> | string
    answer?: StringNullableWithAggregatesFilter<"Query"> | string | null
    status?: StringWithAggregatesFilter<"Query"> | string
    createdAt?: DateTimeWithAggregatesFilter<"Query"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Query"> | Date | string
    answeredAt?: DateTimeNullableWithAggregatesFilter<"Query"> | Date | string | null
    answerMessageId?: StringNullableWithAggregatesFilter<"Query"> | string | null
    conversationId?: StringWithAggregatesFilter<"Query"> | string
    contactId?: StringWithAggregatesFilter<"Query"> | string
  }

  export type QuerySourceMessageWhereInput = {
    AND?: QuerySourceMessageWhereInput | QuerySourceMessageWhereInput[]
    OR?: QuerySourceMessageWhereInput[]
    NOT?: QuerySourceMessageWhereInput | QuerySourceMessageWhereInput[]
    id?: StringFilter<"QuerySourceMessage"> | string
    queryId?: StringFilter<"QuerySourceMessage"> | string
    messageId?: StringFilter<"QuerySourceMessage"> | string
    role?: StringFilter<"QuerySourceMessage"> | string
    query?: XOR<QueryScalarRelationFilter, QueryWhereInput>
    message?: XOR<MessageScalarRelationFilter, MessageWhereInput>
  }

  export type QuerySourceMessageOrderByWithRelationInput = {
    id?: SortOrder
    queryId?: SortOrder
    messageId?: SortOrder
    role?: SortOrder
    query?: QueryOrderByWithRelationInput
    message?: MessageOrderByWithRelationInput
  }

  export type QuerySourceMessageWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    queryId_messageId_role?: QuerySourceMessageQueryIdMessageIdRoleCompoundUniqueInput
    AND?: QuerySourceMessageWhereInput | QuerySourceMessageWhereInput[]
    OR?: QuerySourceMessageWhereInput[]
    NOT?: QuerySourceMessageWhereInput | QuerySourceMessageWhereInput[]
    queryId?: StringFilter<"QuerySourceMessage"> | string
    messageId?: StringFilter<"QuerySourceMessage"> | string
    role?: StringFilter<"QuerySourceMessage"> | string
    query?: XOR<QueryScalarRelationFilter, QueryWhereInput>
    message?: XOR<MessageScalarRelationFilter, MessageWhereInput>
  }, "id" | "queryId_messageId_role">

  export type QuerySourceMessageOrderByWithAggregationInput = {
    id?: SortOrder
    queryId?: SortOrder
    messageId?: SortOrder
    role?: SortOrder
    _count?: QuerySourceMessageCountOrderByAggregateInput
    _max?: QuerySourceMessageMaxOrderByAggregateInput
    _min?: QuerySourceMessageMinOrderByAggregateInput
  }

  export type QuerySourceMessageScalarWhereWithAggregatesInput = {
    AND?: QuerySourceMessageScalarWhereWithAggregatesInput | QuerySourceMessageScalarWhereWithAggregatesInput[]
    OR?: QuerySourceMessageScalarWhereWithAggregatesInput[]
    NOT?: QuerySourceMessageScalarWhereWithAggregatesInput | QuerySourceMessageScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"QuerySourceMessage"> | string
    queryId?: StringWithAggregatesFilter<"QuerySourceMessage"> | string
    messageId?: StringWithAggregatesFilter<"QuerySourceMessage"> | string
    role?: StringWithAggregatesFilter<"QuerySourceMessage"> | string
  }

  export type CallWhereInput = {
    AND?: CallWhereInput | CallWhereInput[]
    OR?: CallWhereInput[]
    NOT?: CallWhereInput | CallWhereInput[]
    id?: StringFilter<"Call"> | string
    twilioSid?: StringNullableFilter<"Call"> | string | null
    status?: StringFilter<"Call"> | string
    direction?: StringFilter<"Call"> | string
    duration?: IntNullableFilter<"Call"> | number | null
    startedAt?: DateTimeNullableFilter<"Call"> | Date | string | null
    endedAt?: DateTimeNullableFilter<"Call"> | Date | string | null
    createdAt?: DateTimeFilter<"Call"> | Date | string
    updatedAt?: DateTimeFilter<"Call"> | Date | string
    conversationId?: StringFilter<"Call"> | string
    contactId?: StringFilter<"Call"> | string
    conversation?: XOR<ConversationScalarRelationFilter, ConversationWhereInput>
    contact?: XOR<ContactScalarRelationFilter, ContactWhereInput>
    messages?: MessageListRelationFilter
  }

  export type CallOrderByWithRelationInput = {
    id?: SortOrder
    twilioSid?: SortOrderInput | SortOrder
    status?: SortOrder
    direction?: SortOrder
    duration?: SortOrderInput | SortOrder
    startedAt?: SortOrderInput | SortOrder
    endedAt?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    conversationId?: SortOrder
    contactId?: SortOrder
    conversation?: ConversationOrderByWithRelationInput
    contact?: ContactOrderByWithRelationInput
    messages?: MessageOrderByRelationAggregateInput
  }

  export type CallWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    twilioSid?: string
    AND?: CallWhereInput | CallWhereInput[]
    OR?: CallWhereInput[]
    NOT?: CallWhereInput | CallWhereInput[]
    status?: StringFilter<"Call"> | string
    direction?: StringFilter<"Call"> | string
    duration?: IntNullableFilter<"Call"> | number | null
    startedAt?: DateTimeNullableFilter<"Call"> | Date | string | null
    endedAt?: DateTimeNullableFilter<"Call"> | Date | string | null
    createdAt?: DateTimeFilter<"Call"> | Date | string
    updatedAt?: DateTimeFilter<"Call"> | Date | string
    conversationId?: StringFilter<"Call"> | string
    contactId?: StringFilter<"Call"> | string
    conversation?: XOR<ConversationScalarRelationFilter, ConversationWhereInput>
    contact?: XOR<ContactScalarRelationFilter, ContactWhereInput>
    messages?: MessageListRelationFilter
  }, "id" | "twilioSid">

  export type CallOrderByWithAggregationInput = {
    id?: SortOrder
    twilioSid?: SortOrderInput | SortOrder
    status?: SortOrder
    direction?: SortOrder
    duration?: SortOrderInput | SortOrder
    startedAt?: SortOrderInput | SortOrder
    endedAt?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    conversationId?: SortOrder
    contactId?: SortOrder
    _count?: CallCountOrderByAggregateInput
    _avg?: CallAvgOrderByAggregateInput
    _max?: CallMaxOrderByAggregateInput
    _min?: CallMinOrderByAggregateInput
    _sum?: CallSumOrderByAggregateInput
  }

  export type CallScalarWhereWithAggregatesInput = {
    AND?: CallScalarWhereWithAggregatesInput | CallScalarWhereWithAggregatesInput[]
    OR?: CallScalarWhereWithAggregatesInput[]
    NOT?: CallScalarWhereWithAggregatesInput | CallScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Call"> | string
    twilioSid?: StringNullableWithAggregatesFilter<"Call"> | string | null
    status?: StringWithAggregatesFilter<"Call"> | string
    direction?: StringWithAggregatesFilter<"Call"> | string
    duration?: IntNullableWithAggregatesFilter<"Call"> | number | null
    startedAt?: DateTimeNullableWithAggregatesFilter<"Call"> | Date | string | null
    endedAt?: DateTimeNullableWithAggregatesFilter<"Call"> | Date | string | null
    createdAt?: DateTimeWithAggregatesFilter<"Call"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Call"> | Date | string
    conversationId?: StringWithAggregatesFilter<"Call"> | string
    contactId?: StringWithAggregatesFilter<"Call"> | string
  }

  export type EmailWhereInput = {
    AND?: EmailWhereInput | EmailWhereInput[]
    OR?: EmailWhereInput[]
    NOT?: EmailWhereInput | EmailWhereInput[]
    id?: StringFilter<"Email"> | string
    twilioSid?: StringNullableFilter<"Email"> | string | null
    status?: StringFilter<"Email"> | string
    direction?: StringFilter<"Email"> | string
    subject?: StringFilter<"Email"> | string
    from?: StringFilter<"Email"> | string
    to?: StringFilter<"Email"> | string
    body?: StringNullableFilter<"Email"> | string | null
    html?: StringNullableFilter<"Email"> | string | null
    sentAt?: DateTimeNullableFilter<"Email"> | Date | string | null
    deliveredAt?: DateTimeNullableFilter<"Email"> | Date | string | null
    createdAt?: DateTimeFilter<"Email"> | Date | string
    updatedAt?: DateTimeFilter<"Email"> | Date | string
    conversationId?: StringFilter<"Email"> | string
    contactId?: StringFilter<"Email"> | string
    conversation?: XOR<ConversationScalarRelationFilter, ConversationWhereInput>
    contact?: XOR<ContactScalarRelationFilter, ContactWhereInput>
  }

  export type EmailOrderByWithRelationInput = {
    id?: SortOrder
    twilioSid?: SortOrderInput | SortOrder
    status?: SortOrder
    direction?: SortOrder
    subject?: SortOrder
    from?: SortOrder
    to?: SortOrder
    body?: SortOrderInput | SortOrder
    html?: SortOrderInput | SortOrder
    sentAt?: SortOrderInput | SortOrder
    deliveredAt?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    conversationId?: SortOrder
    contactId?: SortOrder
    conversation?: ConversationOrderByWithRelationInput
    contact?: ContactOrderByWithRelationInput
  }

  export type EmailWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    twilioSid?: string
    AND?: EmailWhereInput | EmailWhereInput[]
    OR?: EmailWhereInput[]
    NOT?: EmailWhereInput | EmailWhereInput[]
    status?: StringFilter<"Email"> | string
    direction?: StringFilter<"Email"> | string
    subject?: StringFilter<"Email"> | string
    from?: StringFilter<"Email"> | string
    to?: StringFilter<"Email"> | string
    body?: StringNullableFilter<"Email"> | string | null
    html?: StringNullableFilter<"Email"> | string | null
    sentAt?: DateTimeNullableFilter<"Email"> | Date | string | null
    deliveredAt?: DateTimeNullableFilter<"Email"> | Date | string | null
    createdAt?: DateTimeFilter<"Email"> | Date | string
    updatedAt?: DateTimeFilter<"Email"> | Date | string
    conversationId?: StringFilter<"Email"> | string
    contactId?: StringFilter<"Email"> | string
    conversation?: XOR<ConversationScalarRelationFilter, ConversationWhereInput>
    contact?: XOR<ContactScalarRelationFilter, ContactWhereInput>
  }, "id" | "twilioSid">

  export type EmailOrderByWithAggregationInput = {
    id?: SortOrder
    twilioSid?: SortOrderInput | SortOrder
    status?: SortOrder
    direction?: SortOrder
    subject?: SortOrder
    from?: SortOrder
    to?: SortOrder
    body?: SortOrderInput | SortOrder
    html?: SortOrderInput | SortOrder
    sentAt?: SortOrderInput | SortOrder
    deliveredAt?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    conversationId?: SortOrder
    contactId?: SortOrder
    _count?: EmailCountOrderByAggregateInput
    _max?: EmailMaxOrderByAggregateInput
    _min?: EmailMinOrderByAggregateInput
  }

  export type EmailScalarWhereWithAggregatesInput = {
    AND?: EmailScalarWhereWithAggregatesInput | EmailScalarWhereWithAggregatesInput[]
    OR?: EmailScalarWhereWithAggregatesInput[]
    NOT?: EmailScalarWhereWithAggregatesInput | EmailScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Email"> | string
    twilioSid?: StringNullableWithAggregatesFilter<"Email"> | string | null
    status?: StringWithAggregatesFilter<"Email"> | string
    direction?: StringWithAggregatesFilter<"Email"> | string
    subject?: StringWithAggregatesFilter<"Email"> | string
    from?: StringWithAggregatesFilter<"Email"> | string
    to?: StringWithAggregatesFilter<"Email"> | string
    body?: StringNullableWithAggregatesFilter<"Email"> | string | null
    html?: StringNullableWithAggregatesFilter<"Email"> | string | null
    sentAt?: DateTimeNullableWithAggregatesFilter<"Email"> | Date | string | null
    deliveredAt?: DateTimeNullableWithAggregatesFilter<"Email"> | Date | string | null
    createdAt?: DateTimeWithAggregatesFilter<"Email"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Email"> | Date | string
    conversationId?: StringWithAggregatesFilter<"Email"> | string
    contactId?: StringWithAggregatesFilter<"Email"> | string
  }

  export type ContactKnowledgeWhereInput = {
    AND?: ContactKnowledgeWhereInput | ContactKnowledgeWhereInput[]
    OR?: ContactKnowledgeWhereInput[]
    NOT?: ContactKnowledgeWhereInput | ContactKnowledgeWhereInput[]
    id?: StringFilter<"ContactKnowledge"> | string
    contactId?: StringFilter<"ContactKnowledge"> | string
    category?: StringFilter<"ContactKnowledge"> | string
    key?: StringFilter<"ContactKnowledge"> | string
    value?: StringFilter<"ContactKnowledge"> | string
    confidence?: FloatFilter<"ContactKnowledge"> | number
    status?: StringFilter<"ContactKnowledge"> | string
    createdAt?: DateTimeFilter<"ContactKnowledge"> | Date | string
    updatedAt?: DateTimeFilter<"ContactKnowledge"> | Date | string
    contact?: XOR<ContactScalarRelationFilter, ContactWhereInput>
    sources?: KnowledgeSourceMessageListRelationFilter
  }

  export type ContactKnowledgeOrderByWithRelationInput = {
    id?: SortOrder
    contactId?: SortOrder
    category?: SortOrder
    key?: SortOrder
    value?: SortOrder
    confidence?: SortOrder
    status?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    contact?: ContactOrderByWithRelationInput
    sources?: KnowledgeSourceMessageOrderByRelationAggregateInput
  }

  export type ContactKnowledgeWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    contactId_key?: ContactKnowledgeContactIdKeyCompoundUniqueInput
    AND?: ContactKnowledgeWhereInput | ContactKnowledgeWhereInput[]
    OR?: ContactKnowledgeWhereInput[]
    NOT?: ContactKnowledgeWhereInput | ContactKnowledgeWhereInput[]
    contactId?: StringFilter<"ContactKnowledge"> | string
    category?: StringFilter<"ContactKnowledge"> | string
    key?: StringFilter<"ContactKnowledge"> | string
    value?: StringFilter<"ContactKnowledge"> | string
    confidence?: FloatFilter<"ContactKnowledge"> | number
    status?: StringFilter<"ContactKnowledge"> | string
    createdAt?: DateTimeFilter<"ContactKnowledge"> | Date | string
    updatedAt?: DateTimeFilter<"ContactKnowledge"> | Date | string
    contact?: XOR<ContactScalarRelationFilter, ContactWhereInput>
    sources?: KnowledgeSourceMessageListRelationFilter
  }, "id" | "contactId_key">

  export type ContactKnowledgeOrderByWithAggregationInput = {
    id?: SortOrder
    contactId?: SortOrder
    category?: SortOrder
    key?: SortOrder
    value?: SortOrder
    confidence?: SortOrder
    status?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: ContactKnowledgeCountOrderByAggregateInput
    _avg?: ContactKnowledgeAvgOrderByAggregateInput
    _max?: ContactKnowledgeMaxOrderByAggregateInput
    _min?: ContactKnowledgeMinOrderByAggregateInput
    _sum?: ContactKnowledgeSumOrderByAggregateInput
  }

  export type ContactKnowledgeScalarWhereWithAggregatesInput = {
    AND?: ContactKnowledgeScalarWhereWithAggregatesInput | ContactKnowledgeScalarWhereWithAggregatesInput[]
    OR?: ContactKnowledgeScalarWhereWithAggregatesInput[]
    NOT?: ContactKnowledgeScalarWhereWithAggregatesInput | ContactKnowledgeScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"ContactKnowledge"> | string
    contactId?: StringWithAggregatesFilter<"ContactKnowledge"> | string
    category?: StringWithAggregatesFilter<"ContactKnowledge"> | string
    key?: StringWithAggregatesFilter<"ContactKnowledge"> | string
    value?: StringWithAggregatesFilter<"ContactKnowledge"> | string
    confidence?: FloatWithAggregatesFilter<"ContactKnowledge"> | number
    status?: StringWithAggregatesFilter<"ContactKnowledge"> | string
    createdAt?: DateTimeWithAggregatesFilter<"ContactKnowledge"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"ContactKnowledge"> | Date | string
  }

  export type KnowledgeSourceMessageWhereInput = {
    AND?: KnowledgeSourceMessageWhereInput | KnowledgeSourceMessageWhereInput[]
    OR?: KnowledgeSourceMessageWhereInput[]
    NOT?: KnowledgeSourceMessageWhereInput | KnowledgeSourceMessageWhereInput[]
    id?: StringFilter<"KnowledgeSourceMessage"> | string
    knowledgeId?: StringFilter<"KnowledgeSourceMessage"> | string
    messageId?: StringFilter<"KnowledgeSourceMessage"> | string
    role?: StringFilter<"KnowledgeSourceMessage"> | string
    knowledge?: XOR<ContactKnowledgeScalarRelationFilter, ContactKnowledgeWhereInput>
    message?: XOR<MessageScalarRelationFilter, MessageWhereInput>
  }

  export type KnowledgeSourceMessageOrderByWithRelationInput = {
    id?: SortOrder
    knowledgeId?: SortOrder
    messageId?: SortOrder
    role?: SortOrder
    knowledge?: ContactKnowledgeOrderByWithRelationInput
    message?: MessageOrderByWithRelationInput
  }

  export type KnowledgeSourceMessageWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    knowledgeId_messageId_role?: KnowledgeSourceMessageKnowledgeIdMessageIdRoleCompoundUniqueInput
    AND?: KnowledgeSourceMessageWhereInput | KnowledgeSourceMessageWhereInput[]
    OR?: KnowledgeSourceMessageWhereInput[]
    NOT?: KnowledgeSourceMessageWhereInput | KnowledgeSourceMessageWhereInput[]
    knowledgeId?: StringFilter<"KnowledgeSourceMessage"> | string
    messageId?: StringFilter<"KnowledgeSourceMessage"> | string
    role?: StringFilter<"KnowledgeSourceMessage"> | string
    knowledge?: XOR<ContactKnowledgeScalarRelationFilter, ContactKnowledgeWhereInput>
    message?: XOR<MessageScalarRelationFilter, MessageWhereInput>
  }, "id" | "knowledgeId_messageId_role">

  export type KnowledgeSourceMessageOrderByWithAggregationInput = {
    id?: SortOrder
    knowledgeId?: SortOrder
    messageId?: SortOrder
    role?: SortOrder
    _count?: KnowledgeSourceMessageCountOrderByAggregateInput
    _max?: KnowledgeSourceMessageMaxOrderByAggregateInput
    _min?: KnowledgeSourceMessageMinOrderByAggregateInput
  }

  export type KnowledgeSourceMessageScalarWhereWithAggregatesInput = {
    AND?: KnowledgeSourceMessageScalarWhereWithAggregatesInput | KnowledgeSourceMessageScalarWhereWithAggregatesInput[]
    OR?: KnowledgeSourceMessageScalarWhereWithAggregatesInput[]
    NOT?: KnowledgeSourceMessageScalarWhereWithAggregatesInput | KnowledgeSourceMessageScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"KnowledgeSourceMessage"> | string
    knowledgeId?: StringWithAggregatesFilter<"KnowledgeSourceMessage"> | string
    messageId?: StringWithAggregatesFilter<"KnowledgeSourceMessage"> | string
    role?: StringWithAggregatesFilter<"KnowledgeSourceMessage"> | string
  }

  export type ContactCreateInput = {
    id?: string
    name: string
    business: string
    category: string
    phone: string
    email?: string | null
    initials: string
    color: string
    note?: string | null
    online?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    conversations?: ConversationCreateNestedManyWithoutContactInput
    tasks?: TaskCreateNestedManyWithoutContactInput
    queries?: QueryCreateNestedManyWithoutContactInput
    knowledge?: ContactKnowledgeCreateNestedManyWithoutContactInput
    calls?: CallCreateNestedManyWithoutContactInput
    emails?: EmailCreateNestedManyWithoutContactInput
  }

  export type ContactUncheckedCreateInput = {
    id?: string
    name: string
    business: string
    category: string
    phone: string
    email?: string | null
    initials: string
    color: string
    note?: string | null
    online?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    conversations?: ConversationUncheckedCreateNestedManyWithoutContactInput
    tasks?: TaskUncheckedCreateNestedManyWithoutContactInput
    queries?: QueryUncheckedCreateNestedManyWithoutContactInput
    knowledge?: ContactKnowledgeUncheckedCreateNestedManyWithoutContactInput
    calls?: CallUncheckedCreateNestedManyWithoutContactInput
    emails?: EmailUncheckedCreateNestedManyWithoutContactInput
  }

  export type ContactUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    business?: StringFieldUpdateOperationsInput | string
    category?: StringFieldUpdateOperationsInput | string
    phone?: StringFieldUpdateOperationsInput | string
    email?: NullableStringFieldUpdateOperationsInput | string | null
    initials?: StringFieldUpdateOperationsInput | string
    color?: StringFieldUpdateOperationsInput | string
    note?: NullableStringFieldUpdateOperationsInput | string | null
    online?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    conversations?: ConversationUpdateManyWithoutContactNestedInput
    tasks?: TaskUpdateManyWithoutContactNestedInput
    queries?: QueryUpdateManyWithoutContactNestedInput
    knowledge?: ContactKnowledgeUpdateManyWithoutContactNestedInput
    calls?: CallUpdateManyWithoutContactNestedInput
    emails?: EmailUpdateManyWithoutContactNestedInput
  }

  export type ContactUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    business?: StringFieldUpdateOperationsInput | string
    category?: StringFieldUpdateOperationsInput | string
    phone?: StringFieldUpdateOperationsInput | string
    email?: NullableStringFieldUpdateOperationsInput | string | null
    initials?: StringFieldUpdateOperationsInput | string
    color?: StringFieldUpdateOperationsInput | string
    note?: NullableStringFieldUpdateOperationsInput | string | null
    online?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    conversations?: ConversationUncheckedUpdateManyWithoutContactNestedInput
    tasks?: TaskUncheckedUpdateManyWithoutContactNestedInput
    queries?: QueryUncheckedUpdateManyWithoutContactNestedInput
    knowledge?: ContactKnowledgeUncheckedUpdateManyWithoutContactNestedInput
    calls?: CallUncheckedUpdateManyWithoutContactNestedInput
    emails?: EmailUncheckedUpdateManyWithoutContactNestedInput
  }

  export type ContactCreateManyInput = {
    id?: string
    name: string
    business: string
    category: string
    phone: string
    email?: string | null
    initials: string
    color: string
    note?: string | null
    online?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ContactUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    business?: StringFieldUpdateOperationsInput | string
    category?: StringFieldUpdateOperationsInput | string
    phone?: StringFieldUpdateOperationsInput | string
    email?: NullableStringFieldUpdateOperationsInput | string | null
    initials?: StringFieldUpdateOperationsInput | string
    color?: StringFieldUpdateOperationsInput | string
    note?: NullableStringFieldUpdateOperationsInput | string | null
    online?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ContactUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    business?: StringFieldUpdateOperationsInput | string
    category?: StringFieldUpdateOperationsInput | string
    phone?: StringFieldUpdateOperationsInput | string
    email?: NullableStringFieldUpdateOperationsInput | string | null
    initials?: StringFieldUpdateOperationsInput | string
    color?: StringFieldUpdateOperationsInput | string
    note?: NullableStringFieldUpdateOperationsInput | string | null
    online?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ConversationCreateInput = {
    id?: string
    title?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    lastExtractedMessageId?: string | null
    lastExtractedAt?: Date | string | null
    messages?: MessageCreateNestedManyWithoutConversationInput
    history?: HistoryCreateNestedManyWithoutConversationInput
    tasks?: TaskCreateNestedManyWithoutConversationInput
    contact: ContactCreateNestedOneWithoutConversationsInput
    queries?: QueryCreateNestedManyWithoutConversationInput
    calls?: CallCreateNestedManyWithoutConversationInput
    emails?: EmailCreateNestedManyWithoutConversationInput
  }

  export type ConversationUncheckedCreateInput = {
    id?: string
    title?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    lastExtractedMessageId?: string | null
    lastExtractedAt?: Date | string | null
    contactId: string
    messages?: MessageUncheckedCreateNestedManyWithoutConversationInput
    history?: HistoryUncheckedCreateNestedManyWithoutConversationInput
    tasks?: TaskUncheckedCreateNestedManyWithoutConversationInput
    queries?: QueryUncheckedCreateNestedManyWithoutConversationInput
    calls?: CallUncheckedCreateNestedManyWithoutConversationInput
    emails?: EmailUncheckedCreateNestedManyWithoutConversationInput
  }

  export type ConversationUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    lastExtractedMessageId?: NullableStringFieldUpdateOperationsInput | string | null
    lastExtractedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    messages?: MessageUpdateManyWithoutConversationNestedInput
    history?: HistoryUpdateManyWithoutConversationNestedInput
    tasks?: TaskUpdateManyWithoutConversationNestedInput
    contact?: ContactUpdateOneRequiredWithoutConversationsNestedInput
    queries?: QueryUpdateManyWithoutConversationNestedInput
    calls?: CallUpdateManyWithoutConversationNestedInput
    emails?: EmailUpdateManyWithoutConversationNestedInput
  }

  export type ConversationUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    lastExtractedMessageId?: NullableStringFieldUpdateOperationsInput | string | null
    lastExtractedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    contactId?: StringFieldUpdateOperationsInput | string
    messages?: MessageUncheckedUpdateManyWithoutConversationNestedInput
    history?: HistoryUncheckedUpdateManyWithoutConversationNestedInput
    tasks?: TaskUncheckedUpdateManyWithoutConversationNestedInput
    queries?: QueryUncheckedUpdateManyWithoutConversationNestedInput
    calls?: CallUncheckedUpdateManyWithoutConversationNestedInput
    emails?: EmailUncheckedUpdateManyWithoutConversationNestedInput
  }

  export type ConversationCreateManyInput = {
    id?: string
    title?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    lastExtractedMessageId?: string | null
    lastExtractedAt?: Date | string | null
    contactId: string
  }

  export type ConversationUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    lastExtractedMessageId?: NullableStringFieldUpdateOperationsInput | string | null
    lastExtractedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type ConversationUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    lastExtractedMessageId?: NullableStringFieldUpdateOperationsInput | string | null
    lastExtractedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    contactId?: StringFieldUpdateOperationsInput | string
  }

  export type MessageCreateInput = {
    id?: string
    role: string
    content: string
    time: string
    pending?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    conversation: ConversationCreateNestedOneWithoutMessagesInput
    call?: CallCreateNestedOneWithoutMessagesInput
    taskSources?: TaskSourceMessageCreateNestedManyWithoutMessageInput
    querySources?: QuerySourceMessageCreateNestedManyWithoutMessageInput
    knowledgeSources?: KnowledgeSourceMessageCreateNestedManyWithoutMessageInput
  }

  export type MessageUncheckedCreateInput = {
    id?: string
    role: string
    content: string
    time: string
    pending?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    conversationId: string
    callId?: string | null
    taskSources?: TaskSourceMessageUncheckedCreateNestedManyWithoutMessageInput
    querySources?: QuerySourceMessageUncheckedCreateNestedManyWithoutMessageInput
    knowledgeSources?: KnowledgeSourceMessageUncheckedCreateNestedManyWithoutMessageInput
  }

  export type MessageUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    role?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    time?: StringFieldUpdateOperationsInput | string
    pending?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    conversation?: ConversationUpdateOneRequiredWithoutMessagesNestedInput
    call?: CallUpdateOneWithoutMessagesNestedInput
    taskSources?: TaskSourceMessageUpdateManyWithoutMessageNestedInput
    querySources?: QuerySourceMessageUpdateManyWithoutMessageNestedInput
    knowledgeSources?: KnowledgeSourceMessageUpdateManyWithoutMessageNestedInput
  }

  export type MessageUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    role?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    time?: StringFieldUpdateOperationsInput | string
    pending?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    conversationId?: StringFieldUpdateOperationsInput | string
    callId?: NullableStringFieldUpdateOperationsInput | string | null
    taskSources?: TaskSourceMessageUncheckedUpdateManyWithoutMessageNestedInput
    querySources?: QuerySourceMessageUncheckedUpdateManyWithoutMessageNestedInput
    knowledgeSources?: KnowledgeSourceMessageUncheckedUpdateManyWithoutMessageNestedInput
  }

  export type MessageCreateManyInput = {
    id?: string
    role: string
    content: string
    time: string
    pending?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    conversationId: string
    callId?: string | null
  }

  export type MessageUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    role?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    time?: StringFieldUpdateOperationsInput | string
    pending?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type MessageUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    role?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    time?: StringFieldUpdateOperationsInput | string
    pending?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    conversationId?: StringFieldUpdateOperationsInput | string
    callId?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type HistoryCreateInput = {
    id?: string
    title: string
    detail: string
    status: string
    time: string
    createdAt?: Date | string
    updatedAt?: Date | string
    conversation: ConversationCreateNestedOneWithoutHistoryInput
  }

  export type HistoryUncheckedCreateInput = {
    id?: string
    title: string
    detail: string
    status: string
    time: string
    createdAt?: Date | string
    updatedAt?: Date | string
    conversationId: string
  }

  export type HistoryUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    detail?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    time?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    conversation?: ConversationUpdateOneRequiredWithoutHistoryNestedInput
  }

  export type HistoryUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    detail?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    time?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    conversationId?: StringFieldUpdateOperationsInput | string
  }

  export type HistoryCreateManyInput = {
    id?: string
    title: string
    detail: string
    status: string
    time: string
    createdAt?: Date | string
    updatedAt?: Date | string
    conversationId: string
  }

  export type HistoryUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    detail?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    time?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type HistoryUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    detail?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    time?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    conversationId?: StringFieldUpdateOperationsInput | string
  }

  export type TaskCreateInput = {
    id?: string
    title: string
    description?: string | null
    status?: string
    priority?: string
    dueDate?: Date | string | null
    confidence?: number
    source?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    completedAt?: Date | string | null
    conversation: ConversationCreateNestedOneWithoutTasksInput
    contact: ContactCreateNestedOneWithoutTasksInput
    sources?: TaskSourceMessageCreateNestedManyWithoutTaskInput
  }

  export type TaskUncheckedCreateInput = {
    id?: string
    title: string
    description?: string | null
    status?: string
    priority?: string
    dueDate?: Date | string | null
    confidence?: number
    source?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    completedAt?: Date | string | null
    conversationId: string
    contactId: string
    sources?: TaskSourceMessageUncheckedCreateNestedManyWithoutTaskInput
  }

  export type TaskUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    priority?: StringFieldUpdateOperationsInput | string
    dueDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    confidence?: FloatFieldUpdateOperationsInput | number
    source?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    conversation?: ConversationUpdateOneRequiredWithoutTasksNestedInput
    contact?: ContactUpdateOneRequiredWithoutTasksNestedInput
    sources?: TaskSourceMessageUpdateManyWithoutTaskNestedInput
  }

  export type TaskUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    priority?: StringFieldUpdateOperationsInput | string
    dueDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    confidence?: FloatFieldUpdateOperationsInput | number
    source?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    conversationId?: StringFieldUpdateOperationsInput | string
    contactId?: StringFieldUpdateOperationsInput | string
    sources?: TaskSourceMessageUncheckedUpdateManyWithoutTaskNestedInput
  }

  export type TaskCreateManyInput = {
    id?: string
    title: string
    description?: string | null
    status?: string
    priority?: string
    dueDate?: Date | string | null
    confidence?: number
    source?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    completedAt?: Date | string | null
    conversationId: string
    contactId: string
  }

  export type TaskUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    priority?: StringFieldUpdateOperationsInput | string
    dueDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    confidence?: FloatFieldUpdateOperationsInput | number
    source?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type TaskUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    priority?: StringFieldUpdateOperationsInput | string
    dueDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    confidence?: FloatFieldUpdateOperationsInput | number
    source?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    conversationId?: StringFieldUpdateOperationsInput | string
    contactId?: StringFieldUpdateOperationsInput | string
  }

  export type TaskSourceMessageCreateInput = {
    id?: string
    role: string
    task: TaskCreateNestedOneWithoutSourcesInput
    message: MessageCreateNestedOneWithoutTaskSourcesInput
  }

  export type TaskSourceMessageUncheckedCreateInput = {
    id?: string
    taskId: string
    messageId: string
    role: string
  }

  export type TaskSourceMessageUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    role?: StringFieldUpdateOperationsInput | string
    task?: TaskUpdateOneRequiredWithoutSourcesNestedInput
    message?: MessageUpdateOneRequiredWithoutTaskSourcesNestedInput
  }

  export type TaskSourceMessageUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    taskId?: StringFieldUpdateOperationsInput | string
    messageId?: StringFieldUpdateOperationsInput | string
    role?: StringFieldUpdateOperationsInput | string
  }

  export type TaskSourceMessageCreateManyInput = {
    id?: string
    taskId: string
    messageId: string
    role: string
  }

  export type TaskSourceMessageUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    role?: StringFieldUpdateOperationsInput | string
  }

  export type TaskSourceMessageUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    taskId?: StringFieldUpdateOperationsInput | string
    messageId?: StringFieldUpdateOperationsInput | string
    role?: StringFieldUpdateOperationsInput | string
  }

  export type QueryCreateInput = {
    id?: string
    question: string
    answer?: string | null
    status?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    answeredAt?: Date | string | null
    answerMessageId?: string | null
    conversation: ConversationCreateNestedOneWithoutQueriesInput
    contact: ContactCreateNestedOneWithoutQueriesInput
    sources?: QuerySourceMessageCreateNestedManyWithoutQueryInput
  }

  export type QueryUncheckedCreateInput = {
    id?: string
    question: string
    answer?: string | null
    status?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    answeredAt?: Date | string | null
    answerMessageId?: string | null
    conversationId: string
    contactId: string
    sources?: QuerySourceMessageUncheckedCreateNestedManyWithoutQueryInput
  }

  export type QueryUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    question?: StringFieldUpdateOperationsInput | string
    answer?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    answeredAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    answerMessageId?: NullableStringFieldUpdateOperationsInput | string | null
    conversation?: ConversationUpdateOneRequiredWithoutQueriesNestedInput
    contact?: ContactUpdateOneRequiredWithoutQueriesNestedInput
    sources?: QuerySourceMessageUpdateManyWithoutQueryNestedInput
  }

  export type QueryUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    question?: StringFieldUpdateOperationsInput | string
    answer?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    answeredAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    answerMessageId?: NullableStringFieldUpdateOperationsInput | string | null
    conversationId?: StringFieldUpdateOperationsInput | string
    contactId?: StringFieldUpdateOperationsInput | string
    sources?: QuerySourceMessageUncheckedUpdateManyWithoutQueryNestedInput
  }

  export type QueryCreateManyInput = {
    id?: string
    question: string
    answer?: string | null
    status?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    answeredAt?: Date | string | null
    answerMessageId?: string | null
    conversationId: string
    contactId: string
  }

  export type QueryUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    question?: StringFieldUpdateOperationsInput | string
    answer?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    answeredAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    answerMessageId?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type QueryUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    question?: StringFieldUpdateOperationsInput | string
    answer?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    answeredAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    answerMessageId?: NullableStringFieldUpdateOperationsInput | string | null
    conversationId?: StringFieldUpdateOperationsInput | string
    contactId?: StringFieldUpdateOperationsInput | string
  }

  export type QuerySourceMessageCreateInput = {
    id?: string
    role: string
    query: QueryCreateNestedOneWithoutSourcesInput
    message: MessageCreateNestedOneWithoutQuerySourcesInput
  }

  export type QuerySourceMessageUncheckedCreateInput = {
    id?: string
    queryId: string
    messageId: string
    role: string
  }

  export type QuerySourceMessageUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    role?: StringFieldUpdateOperationsInput | string
    query?: QueryUpdateOneRequiredWithoutSourcesNestedInput
    message?: MessageUpdateOneRequiredWithoutQuerySourcesNestedInput
  }

  export type QuerySourceMessageUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    queryId?: StringFieldUpdateOperationsInput | string
    messageId?: StringFieldUpdateOperationsInput | string
    role?: StringFieldUpdateOperationsInput | string
  }

  export type QuerySourceMessageCreateManyInput = {
    id?: string
    queryId: string
    messageId: string
    role: string
  }

  export type QuerySourceMessageUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    role?: StringFieldUpdateOperationsInput | string
  }

  export type QuerySourceMessageUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    queryId?: StringFieldUpdateOperationsInput | string
    messageId?: StringFieldUpdateOperationsInput | string
    role?: StringFieldUpdateOperationsInput | string
  }

  export type CallCreateInput = {
    id?: string
    twilioSid?: string | null
    status?: string
    direction?: string
    duration?: number | null
    startedAt?: Date | string | null
    endedAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    conversation: ConversationCreateNestedOneWithoutCallsInput
    contact: ContactCreateNestedOneWithoutCallsInput
    messages?: MessageCreateNestedManyWithoutCallInput
  }

  export type CallUncheckedCreateInput = {
    id?: string
    twilioSid?: string | null
    status?: string
    direction?: string
    duration?: number | null
    startedAt?: Date | string | null
    endedAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    conversationId: string
    contactId: string
    messages?: MessageUncheckedCreateNestedManyWithoutCallInput
  }

  export type CallUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    twilioSid?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    direction?: StringFieldUpdateOperationsInput | string
    duration?: NullableIntFieldUpdateOperationsInput | number | null
    startedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    endedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    conversation?: ConversationUpdateOneRequiredWithoutCallsNestedInput
    contact?: ContactUpdateOneRequiredWithoutCallsNestedInput
    messages?: MessageUpdateManyWithoutCallNestedInput
  }

  export type CallUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    twilioSid?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    direction?: StringFieldUpdateOperationsInput | string
    duration?: NullableIntFieldUpdateOperationsInput | number | null
    startedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    endedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    conversationId?: StringFieldUpdateOperationsInput | string
    contactId?: StringFieldUpdateOperationsInput | string
    messages?: MessageUncheckedUpdateManyWithoutCallNestedInput
  }

  export type CallCreateManyInput = {
    id?: string
    twilioSid?: string | null
    status?: string
    direction?: string
    duration?: number | null
    startedAt?: Date | string | null
    endedAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    conversationId: string
    contactId: string
  }

  export type CallUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    twilioSid?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    direction?: StringFieldUpdateOperationsInput | string
    duration?: NullableIntFieldUpdateOperationsInput | number | null
    startedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    endedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CallUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    twilioSid?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    direction?: StringFieldUpdateOperationsInput | string
    duration?: NullableIntFieldUpdateOperationsInput | number | null
    startedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    endedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    conversationId?: StringFieldUpdateOperationsInput | string
    contactId?: StringFieldUpdateOperationsInput | string
  }

  export type EmailCreateInput = {
    id?: string
    twilioSid?: string | null
    status?: string
    direction?: string
    subject: string
    from: string
    to: string
    body?: string | null
    html?: string | null
    sentAt?: Date | string | null
    deliveredAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    conversation: ConversationCreateNestedOneWithoutEmailsInput
    contact: ContactCreateNestedOneWithoutEmailsInput
  }

  export type EmailUncheckedCreateInput = {
    id?: string
    twilioSid?: string | null
    status?: string
    direction?: string
    subject: string
    from: string
    to: string
    body?: string | null
    html?: string | null
    sentAt?: Date | string | null
    deliveredAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    conversationId: string
    contactId: string
  }

  export type EmailUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    twilioSid?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    direction?: StringFieldUpdateOperationsInput | string
    subject?: StringFieldUpdateOperationsInput | string
    from?: StringFieldUpdateOperationsInput | string
    to?: StringFieldUpdateOperationsInput | string
    body?: NullableStringFieldUpdateOperationsInput | string | null
    html?: NullableStringFieldUpdateOperationsInput | string | null
    sentAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    deliveredAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    conversation?: ConversationUpdateOneRequiredWithoutEmailsNestedInput
    contact?: ContactUpdateOneRequiredWithoutEmailsNestedInput
  }

  export type EmailUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    twilioSid?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    direction?: StringFieldUpdateOperationsInput | string
    subject?: StringFieldUpdateOperationsInput | string
    from?: StringFieldUpdateOperationsInput | string
    to?: StringFieldUpdateOperationsInput | string
    body?: NullableStringFieldUpdateOperationsInput | string | null
    html?: NullableStringFieldUpdateOperationsInput | string | null
    sentAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    deliveredAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    conversationId?: StringFieldUpdateOperationsInput | string
    contactId?: StringFieldUpdateOperationsInput | string
  }

  export type EmailCreateManyInput = {
    id?: string
    twilioSid?: string | null
    status?: string
    direction?: string
    subject: string
    from: string
    to: string
    body?: string | null
    html?: string | null
    sentAt?: Date | string | null
    deliveredAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    conversationId: string
    contactId: string
  }

  export type EmailUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    twilioSid?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    direction?: StringFieldUpdateOperationsInput | string
    subject?: StringFieldUpdateOperationsInput | string
    from?: StringFieldUpdateOperationsInput | string
    to?: StringFieldUpdateOperationsInput | string
    body?: NullableStringFieldUpdateOperationsInput | string | null
    html?: NullableStringFieldUpdateOperationsInput | string | null
    sentAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    deliveredAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type EmailUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    twilioSid?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    direction?: StringFieldUpdateOperationsInput | string
    subject?: StringFieldUpdateOperationsInput | string
    from?: StringFieldUpdateOperationsInput | string
    to?: StringFieldUpdateOperationsInput | string
    body?: NullableStringFieldUpdateOperationsInput | string | null
    html?: NullableStringFieldUpdateOperationsInput | string | null
    sentAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    deliveredAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    conversationId?: StringFieldUpdateOperationsInput | string
    contactId?: StringFieldUpdateOperationsInput | string
  }

  export type ContactKnowledgeCreateInput = {
    id?: string
    category: string
    key: string
    value: string
    confidence?: number
    status?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    contact: ContactCreateNestedOneWithoutKnowledgeInput
    sources?: KnowledgeSourceMessageCreateNestedManyWithoutKnowledgeInput
  }

  export type ContactKnowledgeUncheckedCreateInput = {
    id?: string
    contactId: string
    category: string
    key: string
    value: string
    confidence?: number
    status?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    sources?: KnowledgeSourceMessageUncheckedCreateNestedManyWithoutKnowledgeInput
  }

  export type ContactKnowledgeUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    category?: StringFieldUpdateOperationsInput | string
    key?: StringFieldUpdateOperationsInput | string
    value?: StringFieldUpdateOperationsInput | string
    confidence?: FloatFieldUpdateOperationsInput | number
    status?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    contact?: ContactUpdateOneRequiredWithoutKnowledgeNestedInput
    sources?: KnowledgeSourceMessageUpdateManyWithoutKnowledgeNestedInput
  }

  export type ContactKnowledgeUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    contactId?: StringFieldUpdateOperationsInput | string
    category?: StringFieldUpdateOperationsInput | string
    key?: StringFieldUpdateOperationsInput | string
    value?: StringFieldUpdateOperationsInput | string
    confidence?: FloatFieldUpdateOperationsInput | number
    status?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    sources?: KnowledgeSourceMessageUncheckedUpdateManyWithoutKnowledgeNestedInput
  }

  export type ContactKnowledgeCreateManyInput = {
    id?: string
    contactId: string
    category: string
    key: string
    value: string
    confidence?: number
    status?: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ContactKnowledgeUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    category?: StringFieldUpdateOperationsInput | string
    key?: StringFieldUpdateOperationsInput | string
    value?: StringFieldUpdateOperationsInput | string
    confidence?: FloatFieldUpdateOperationsInput | number
    status?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ContactKnowledgeUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    contactId?: StringFieldUpdateOperationsInput | string
    category?: StringFieldUpdateOperationsInput | string
    key?: StringFieldUpdateOperationsInput | string
    value?: StringFieldUpdateOperationsInput | string
    confidence?: FloatFieldUpdateOperationsInput | number
    status?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type KnowledgeSourceMessageCreateInput = {
    id?: string
    role: string
    knowledge: ContactKnowledgeCreateNestedOneWithoutSourcesInput
    message: MessageCreateNestedOneWithoutKnowledgeSourcesInput
  }

  export type KnowledgeSourceMessageUncheckedCreateInput = {
    id?: string
    knowledgeId: string
    messageId: string
    role: string
  }

  export type KnowledgeSourceMessageUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    role?: StringFieldUpdateOperationsInput | string
    knowledge?: ContactKnowledgeUpdateOneRequiredWithoutSourcesNestedInput
    message?: MessageUpdateOneRequiredWithoutKnowledgeSourcesNestedInput
  }

  export type KnowledgeSourceMessageUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    knowledgeId?: StringFieldUpdateOperationsInput | string
    messageId?: StringFieldUpdateOperationsInput | string
    role?: StringFieldUpdateOperationsInput | string
  }

  export type KnowledgeSourceMessageCreateManyInput = {
    id?: string
    knowledgeId: string
    messageId: string
    role: string
  }

  export type KnowledgeSourceMessageUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    role?: StringFieldUpdateOperationsInput | string
  }

  export type KnowledgeSourceMessageUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    knowledgeId?: StringFieldUpdateOperationsInput | string
    messageId?: StringFieldUpdateOperationsInput | string
    role?: StringFieldUpdateOperationsInput | string
  }

  export type StringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type StringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type BoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type DateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type ConversationListRelationFilter = {
    every?: ConversationWhereInput
    some?: ConversationWhereInput
    none?: ConversationWhereInput
  }

  export type TaskListRelationFilter = {
    every?: TaskWhereInput
    some?: TaskWhereInput
    none?: TaskWhereInput
  }

  export type QueryListRelationFilter = {
    every?: QueryWhereInput
    some?: QueryWhereInput
    none?: QueryWhereInput
  }

  export type ContactKnowledgeListRelationFilter = {
    every?: ContactKnowledgeWhereInput
    some?: ContactKnowledgeWhereInput
    none?: ContactKnowledgeWhereInput
  }

  export type CallListRelationFilter = {
    every?: CallWhereInput
    some?: CallWhereInput
    none?: CallWhereInput
  }

  export type EmailListRelationFilter = {
    every?: EmailWhereInput
    some?: EmailWhereInput
    none?: EmailWhereInput
  }

  export type SortOrderInput = {
    sort: SortOrder
    nulls?: NullsOrder
  }

  export type ConversationOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type TaskOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type QueryOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type ContactKnowledgeOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type CallOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type EmailOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type ContactCountOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    business?: SortOrder
    category?: SortOrder
    phone?: SortOrder
    email?: SortOrder
    initials?: SortOrder
    color?: SortOrder
    note?: SortOrder
    online?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ContactMaxOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    business?: SortOrder
    category?: SortOrder
    phone?: SortOrder
    email?: SortOrder
    initials?: SortOrder
    color?: SortOrder
    note?: SortOrder
    online?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ContactMinOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    business?: SortOrder
    category?: SortOrder
    phone?: SortOrder
    email?: SortOrder
    initials?: SortOrder
    color?: SortOrder
    note?: SortOrder
    online?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type StringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type StringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type BoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type DateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type DateTimeNullableFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableFilter<$PrismaModel> | Date | string | null
  }

  export type MessageListRelationFilter = {
    every?: MessageWhereInput
    some?: MessageWhereInput
    none?: MessageWhereInput
  }

  export type HistoryListRelationFilter = {
    every?: HistoryWhereInput
    some?: HistoryWhereInput
    none?: HistoryWhereInput
  }

  export type ContactScalarRelationFilter = {
    is?: ContactWhereInput
    isNot?: ContactWhereInput
  }

  export type MessageOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type HistoryOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type ConversationCountOrderByAggregateInput = {
    id?: SortOrder
    title?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    lastExtractedMessageId?: SortOrder
    lastExtractedAt?: SortOrder
    contactId?: SortOrder
  }

  export type ConversationMaxOrderByAggregateInput = {
    id?: SortOrder
    title?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    lastExtractedMessageId?: SortOrder
    lastExtractedAt?: SortOrder
    contactId?: SortOrder
  }

  export type ConversationMinOrderByAggregateInput = {
    id?: SortOrder
    title?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    lastExtractedMessageId?: SortOrder
    lastExtractedAt?: SortOrder
    contactId?: SortOrder
  }

  export type DateTimeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableWithAggregatesFilter<$PrismaModel> | Date | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedDateTimeNullableFilter<$PrismaModel>
    _max?: NestedDateTimeNullableFilter<$PrismaModel>
  }

  export type ConversationScalarRelationFilter = {
    is?: ConversationWhereInput
    isNot?: ConversationWhereInput
  }

  export type CallNullableScalarRelationFilter = {
    is?: CallWhereInput | null
    isNot?: CallWhereInput | null
  }

  export type TaskSourceMessageListRelationFilter = {
    every?: TaskSourceMessageWhereInput
    some?: TaskSourceMessageWhereInput
    none?: TaskSourceMessageWhereInput
  }

  export type QuerySourceMessageListRelationFilter = {
    every?: QuerySourceMessageWhereInput
    some?: QuerySourceMessageWhereInput
    none?: QuerySourceMessageWhereInput
  }

  export type KnowledgeSourceMessageListRelationFilter = {
    every?: KnowledgeSourceMessageWhereInput
    some?: KnowledgeSourceMessageWhereInput
    none?: KnowledgeSourceMessageWhereInput
  }

  export type TaskSourceMessageOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type QuerySourceMessageOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type KnowledgeSourceMessageOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type MessageCountOrderByAggregateInput = {
    id?: SortOrder
    role?: SortOrder
    content?: SortOrder
    time?: SortOrder
    pending?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    conversationId?: SortOrder
    callId?: SortOrder
  }

  export type MessageMaxOrderByAggregateInput = {
    id?: SortOrder
    role?: SortOrder
    content?: SortOrder
    time?: SortOrder
    pending?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    conversationId?: SortOrder
    callId?: SortOrder
  }

  export type MessageMinOrderByAggregateInput = {
    id?: SortOrder
    role?: SortOrder
    content?: SortOrder
    time?: SortOrder
    pending?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    conversationId?: SortOrder
    callId?: SortOrder
  }

  export type HistoryCountOrderByAggregateInput = {
    id?: SortOrder
    title?: SortOrder
    detail?: SortOrder
    status?: SortOrder
    time?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    conversationId?: SortOrder
  }

  export type HistoryMaxOrderByAggregateInput = {
    id?: SortOrder
    title?: SortOrder
    detail?: SortOrder
    status?: SortOrder
    time?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    conversationId?: SortOrder
  }

  export type HistoryMinOrderByAggregateInput = {
    id?: SortOrder
    title?: SortOrder
    detail?: SortOrder
    status?: SortOrder
    time?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    conversationId?: SortOrder
  }

  export type FloatFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[] | ListFloatFieldRefInput<$PrismaModel>
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel>
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatFilter<$PrismaModel> | number
  }

  export type TaskCountOrderByAggregateInput = {
    id?: SortOrder
    title?: SortOrder
    description?: SortOrder
    status?: SortOrder
    priority?: SortOrder
    dueDate?: SortOrder
    confidence?: SortOrder
    source?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    completedAt?: SortOrder
    conversationId?: SortOrder
    contactId?: SortOrder
  }

  export type TaskAvgOrderByAggregateInput = {
    confidence?: SortOrder
  }

  export type TaskMaxOrderByAggregateInput = {
    id?: SortOrder
    title?: SortOrder
    description?: SortOrder
    status?: SortOrder
    priority?: SortOrder
    dueDate?: SortOrder
    confidence?: SortOrder
    source?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    completedAt?: SortOrder
    conversationId?: SortOrder
    contactId?: SortOrder
  }

  export type TaskMinOrderByAggregateInput = {
    id?: SortOrder
    title?: SortOrder
    description?: SortOrder
    status?: SortOrder
    priority?: SortOrder
    dueDate?: SortOrder
    confidence?: SortOrder
    source?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    completedAt?: SortOrder
    conversationId?: SortOrder
    contactId?: SortOrder
  }

  export type TaskSumOrderByAggregateInput = {
    confidence?: SortOrder
  }

  export type FloatWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[] | ListFloatFieldRefInput<$PrismaModel>
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel>
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedFloatFilter<$PrismaModel>
    _min?: NestedFloatFilter<$PrismaModel>
    _max?: NestedFloatFilter<$PrismaModel>
  }

  export type TaskScalarRelationFilter = {
    is?: TaskWhereInput
    isNot?: TaskWhereInput
  }

  export type MessageScalarRelationFilter = {
    is?: MessageWhereInput
    isNot?: MessageWhereInput
  }

  export type TaskSourceMessageTaskIdMessageIdRoleCompoundUniqueInput = {
    taskId: string
    messageId: string
    role: string
  }

  export type TaskSourceMessageCountOrderByAggregateInput = {
    id?: SortOrder
    taskId?: SortOrder
    messageId?: SortOrder
    role?: SortOrder
  }

  export type TaskSourceMessageMaxOrderByAggregateInput = {
    id?: SortOrder
    taskId?: SortOrder
    messageId?: SortOrder
    role?: SortOrder
  }

  export type TaskSourceMessageMinOrderByAggregateInput = {
    id?: SortOrder
    taskId?: SortOrder
    messageId?: SortOrder
    role?: SortOrder
  }

  export type QueryCountOrderByAggregateInput = {
    id?: SortOrder
    question?: SortOrder
    answer?: SortOrder
    status?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    answeredAt?: SortOrder
    answerMessageId?: SortOrder
    conversationId?: SortOrder
    contactId?: SortOrder
  }

  export type QueryMaxOrderByAggregateInput = {
    id?: SortOrder
    question?: SortOrder
    answer?: SortOrder
    status?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    answeredAt?: SortOrder
    answerMessageId?: SortOrder
    conversationId?: SortOrder
    contactId?: SortOrder
  }

  export type QueryMinOrderByAggregateInput = {
    id?: SortOrder
    question?: SortOrder
    answer?: SortOrder
    status?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    answeredAt?: SortOrder
    answerMessageId?: SortOrder
    conversationId?: SortOrder
    contactId?: SortOrder
  }

  export type QueryScalarRelationFilter = {
    is?: QueryWhereInput
    isNot?: QueryWhereInput
  }

  export type QuerySourceMessageQueryIdMessageIdRoleCompoundUniqueInput = {
    queryId: string
    messageId: string
    role: string
  }

  export type QuerySourceMessageCountOrderByAggregateInput = {
    id?: SortOrder
    queryId?: SortOrder
    messageId?: SortOrder
    role?: SortOrder
  }

  export type QuerySourceMessageMaxOrderByAggregateInput = {
    id?: SortOrder
    queryId?: SortOrder
    messageId?: SortOrder
    role?: SortOrder
  }

  export type QuerySourceMessageMinOrderByAggregateInput = {
    id?: SortOrder
    queryId?: SortOrder
    messageId?: SortOrder
    role?: SortOrder
  }

  export type IntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }

  export type CallCountOrderByAggregateInput = {
    id?: SortOrder
    twilioSid?: SortOrder
    status?: SortOrder
    direction?: SortOrder
    duration?: SortOrder
    startedAt?: SortOrder
    endedAt?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    conversationId?: SortOrder
    contactId?: SortOrder
  }

  export type CallAvgOrderByAggregateInput = {
    duration?: SortOrder
  }

  export type CallMaxOrderByAggregateInput = {
    id?: SortOrder
    twilioSid?: SortOrder
    status?: SortOrder
    direction?: SortOrder
    duration?: SortOrder
    startedAt?: SortOrder
    endedAt?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    conversationId?: SortOrder
    contactId?: SortOrder
  }

  export type CallMinOrderByAggregateInput = {
    id?: SortOrder
    twilioSid?: SortOrder
    status?: SortOrder
    direction?: SortOrder
    duration?: SortOrder
    startedAt?: SortOrder
    endedAt?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    conversationId?: SortOrder
    contactId?: SortOrder
  }

  export type CallSumOrderByAggregateInput = {
    duration?: SortOrder
  }

  export type IntNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableWithAggregatesFilter<$PrismaModel> | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedIntNullableFilter<$PrismaModel>
    _max?: NestedIntNullableFilter<$PrismaModel>
  }

  export type EmailCountOrderByAggregateInput = {
    id?: SortOrder
    twilioSid?: SortOrder
    status?: SortOrder
    direction?: SortOrder
    subject?: SortOrder
    from?: SortOrder
    to?: SortOrder
    body?: SortOrder
    html?: SortOrder
    sentAt?: SortOrder
    deliveredAt?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    conversationId?: SortOrder
    contactId?: SortOrder
  }

  export type EmailMaxOrderByAggregateInput = {
    id?: SortOrder
    twilioSid?: SortOrder
    status?: SortOrder
    direction?: SortOrder
    subject?: SortOrder
    from?: SortOrder
    to?: SortOrder
    body?: SortOrder
    html?: SortOrder
    sentAt?: SortOrder
    deliveredAt?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    conversationId?: SortOrder
    contactId?: SortOrder
  }

  export type EmailMinOrderByAggregateInput = {
    id?: SortOrder
    twilioSid?: SortOrder
    status?: SortOrder
    direction?: SortOrder
    subject?: SortOrder
    from?: SortOrder
    to?: SortOrder
    body?: SortOrder
    html?: SortOrder
    sentAt?: SortOrder
    deliveredAt?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    conversationId?: SortOrder
    contactId?: SortOrder
  }

  export type ContactKnowledgeContactIdKeyCompoundUniqueInput = {
    contactId: string
    key: string
  }

  export type ContactKnowledgeCountOrderByAggregateInput = {
    id?: SortOrder
    contactId?: SortOrder
    category?: SortOrder
    key?: SortOrder
    value?: SortOrder
    confidence?: SortOrder
    status?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ContactKnowledgeAvgOrderByAggregateInput = {
    confidence?: SortOrder
  }

  export type ContactKnowledgeMaxOrderByAggregateInput = {
    id?: SortOrder
    contactId?: SortOrder
    category?: SortOrder
    key?: SortOrder
    value?: SortOrder
    confidence?: SortOrder
    status?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ContactKnowledgeMinOrderByAggregateInput = {
    id?: SortOrder
    contactId?: SortOrder
    category?: SortOrder
    key?: SortOrder
    value?: SortOrder
    confidence?: SortOrder
    status?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ContactKnowledgeSumOrderByAggregateInput = {
    confidence?: SortOrder
  }

  export type ContactKnowledgeScalarRelationFilter = {
    is?: ContactKnowledgeWhereInput
    isNot?: ContactKnowledgeWhereInput
  }

  export type KnowledgeSourceMessageKnowledgeIdMessageIdRoleCompoundUniqueInput = {
    knowledgeId: string
    messageId: string
    role: string
  }

  export type KnowledgeSourceMessageCountOrderByAggregateInput = {
    id?: SortOrder
    knowledgeId?: SortOrder
    messageId?: SortOrder
    role?: SortOrder
  }

  export type KnowledgeSourceMessageMaxOrderByAggregateInput = {
    id?: SortOrder
    knowledgeId?: SortOrder
    messageId?: SortOrder
    role?: SortOrder
  }

  export type KnowledgeSourceMessageMinOrderByAggregateInput = {
    id?: SortOrder
    knowledgeId?: SortOrder
    messageId?: SortOrder
    role?: SortOrder
  }

  export type ConversationCreateNestedManyWithoutContactInput = {
    create?: XOR<ConversationCreateWithoutContactInput, ConversationUncheckedCreateWithoutContactInput> | ConversationCreateWithoutContactInput[] | ConversationUncheckedCreateWithoutContactInput[]
    connectOrCreate?: ConversationCreateOrConnectWithoutContactInput | ConversationCreateOrConnectWithoutContactInput[]
    createMany?: ConversationCreateManyContactInputEnvelope
    connect?: ConversationWhereUniqueInput | ConversationWhereUniqueInput[]
  }

  export type TaskCreateNestedManyWithoutContactInput = {
    create?: XOR<TaskCreateWithoutContactInput, TaskUncheckedCreateWithoutContactInput> | TaskCreateWithoutContactInput[] | TaskUncheckedCreateWithoutContactInput[]
    connectOrCreate?: TaskCreateOrConnectWithoutContactInput | TaskCreateOrConnectWithoutContactInput[]
    createMany?: TaskCreateManyContactInputEnvelope
    connect?: TaskWhereUniqueInput | TaskWhereUniqueInput[]
  }

  export type QueryCreateNestedManyWithoutContactInput = {
    create?: XOR<QueryCreateWithoutContactInput, QueryUncheckedCreateWithoutContactInput> | QueryCreateWithoutContactInput[] | QueryUncheckedCreateWithoutContactInput[]
    connectOrCreate?: QueryCreateOrConnectWithoutContactInput | QueryCreateOrConnectWithoutContactInput[]
    createMany?: QueryCreateManyContactInputEnvelope
    connect?: QueryWhereUniqueInput | QueryWhereUniqueInput[]
  }

  export type ContactKnowledgeCreateNestedManyWithoutContactInput = {
    create?: XOR<ContactKnowledgeCreateWithoutContactInput, ContactKnowledgeUncheckedCreateWithoutContactInput> | ContactKnowledgeCreateWithoutContactInput[] | ContactKnowledgeUncheckedCreateWithoutContactInput[]
    connectOrCreate?: ContactKnowledgeCreateOrConnectWithoutContactInput | ContactKnowledgeCreateOrConnectWithoutContactInput[]
    createMany?: ContactKnowledgeCreateManyContactInputEnvelope
    connect?: ContactKnowledgeWhereUniqueInput | ContactKnowledgeWhereUniqueInput[]
  }

  export type CallCreateNestedManyWithoutContactInput = {
    create?: XOR<CallCreateWithoutContactInput, CallUncheckedCreateWithoutContactInput> | CallCreateWithoutContactInput[] | CallUncheckedCreateWithoutContactInput[]
    connectOrCreate?: CallCreateOrConnectWithoutContactInput | CallCreateOrConnectWithoutContactInput[]
    createMany?: CallCreateManyContactInputEnvelope
    connect?: CallWhereUniqueInput | CallWhereUniqueInput[]
  }

  export type EmailCreateNestedManyWithoutContactInput = {
    create?: XOR<EmailCreateWithoutContactInput, EmailUncheckedCreateWithoutContactInput> | EmailCreateWithoutContactInput[] | EmailUncheckedCreateWithoutContactInput[]
    connectOrCreate?: EmailCreateOrConnectWithoutContactInput | EmailCreateOrConnectWithoutContactInput[]
    createMany?: EmailCreateManyContactInputEnvelope
    connect?: EmailWhereUniqueInput | EmailWhereUniqueInput[]
  }

  export type ConversationUncheckedCreateNestedManyWithoutContactInput = {
    create?: XOR<ConversationCreateWithoutContactInput, ConversationUncheckedCreateWithoutContactInput> | ConversationCreateWithoutContactInput[] | ConversationUncheckedCreateWithoutContactInput[]
    connectOrCreate?: ConversationCreateOrConnectWithoutContactInput | ConversationCreateOrConnectWithoutContactInput[]
    createMany?: ConversationCreateManyContactInputEnvelope
    connect?: ConversationWhereUniqueInput | ConversationWhereUniqueInput[]
  }

  export type TaskUncheckedCreateNestedManyWithoutContactInput = {
    create?: XOR<TaskCreateWithoutContactInput, TaskUncheckedCreateWithoutContactInput> | TaskCreateWithoutContactInput[] | TaskUncheckedCreateWithoutContactInput[]
    connectOrCreate?: TaskCreateOrConnectWithoutContactInput | TaskCreateOrConnectWithoutContactInput[]
    createMany?: TaskCreateManyContactInputEnvelope
    connect?: TaskWhereUniqueInput | TaskWhereUniqueInput[]
  }

  export type QueryUncheckedCreateNestedManyWithoutContactInput = {
    create?: XOR<QueryCreateWithoutContactInput, QueryUncheckedCreateWithoutContactInput> | QueryCreateWithoutContactInput[] | QueryUncheckedCreateWithoutContactInput[]
    connectOrCreate?: QueryCreateOrConnectWithoutContactInput | QueryCreateOrConnectWithoutContactInput[]
    createMany?: QueryCreateManyContactInputEnvelope
    connect?: QueryWhereUniqueInput | QueryWhereUniqueInput[]
  }

  export type ContactKnowledgeUncheckedCreateNestedManyWithoutContactInput = {
    create?: XOR<ContactKnowledgeCreateWithoutContactInput, ContactKnowledgeUncheckedCreateWithoutContactInput> | ContactKnowledgeCreateWithoutContactInput[] | ContactKnowledgeUncheckedCreateWithoutContactInput[]
    connectOrCreate?: ContactKnowledgeCreateOrConnectWithoutContactInput | ContactKnowledgeCreateOrConnectWithoutContactInput[]
    createMany?: ContactKnowledgeCreateManyContactInputEnvelope
    connect?: ContactKnowledgeWhereUniqueInput | ContactKnowledgeWhereUniqueInput[]
  }

  export type CallUncheckedCreateNestedManyWithoutContactInput = {
    create?: XOR<CallCreateWithoutContactInput, CallUncheckedCreateWithoutContactInput> | CallCreateWithoutContactInput[] | CallUncheckedCreateWithoutContactInput[]
    connectOrCreate?: CallCreateOrConnectWithoutContactInput | CallCreateOrConnectWithoutContactInput[]
    createMany?: CallCreateManyContactInputEnvelope
    connect?: CallWhereUniqueInput | CallWhereUniqueInput[]
  }

  export type EmailUncheckedCreateNestedManyWithoutContactInput = {
    create?: XOR<EmailCreateWithoutContactInput, EmailUncheckedCreateWithoutContactInput> | EmailCreateWithoutContactInput[] | EmailUncheckedCreateWithoutContactInput[]
    connectOrCreate?: EmailCreateOrConnectWithoutContactInput | EmailCreateOrConnectWithoutContactInput[]
    createMany?: EmailCreateManyContactInputEnvelope
    connect?: EmailWhereUniqueInput | EmailWhereUniqueInput[]
  }

  export type StringFieldUpdateOperationsInput = {
    set?: string
  }

  export type NullableStringFieldUpdateOperationsInput = {
    set?: string | null
  }

  export type BoolFieldUpdateOperationsInput = {
    set?: boolean
  }

  export type DateTimeFieldUpdateOperationsInput = {
    set?: Date | string
  }

  export type ConversationUpdateManyWithoutContactNestedInput = {
    create?: XOR<ConversationCreateWithoutContactInput, ConversationUncheckedCreateWithoutContactInput> | ConversationCreateWithoutContactInput[] | ConversationUncheckedCreateWithoutContactInput[]
    connectOrCreate?: ConversationCreateOrConnectWithoutContactInput | ConversationCreateOrConnectWithoutContactInput[]
    upsert?: ConversationUpsertWithWhereUniqueWithoutContactInput | ConversationUpsertWithWhereUniqueWithoutContactInput[]
    createMany?: ConversationCreateManyContactInputEnvelope
    set?: ConversationWhereUniqueInput | ConversationWhereUniqueInput[]
    disconnect?: ConversationWhereUniqueInput | ConversationWhereUniqueInput[]
    delete?: ConversationWhereUniqueInput | ConversationWhereUniqueInput[]
    connect?: ConversationWhereUniqueInput | ConversationWhereUniqueInput[]
    update?: ConversationUpdateWithWhereUniqueWithoutContactInput | ConversationUpdateWithWhereUniqueWithoutContactInput[]
    updateMany?: ConversationUpdateManyWithWhereWithoutContactInput | ConversationUpdateManyWithWhereWithoutContactInput[]
    deleteMany?: ConversationScalarWhereInput | ConversationScalarWhereInput[]
  }

  export type TaskUpdateManyWithoutContactNestedInput = {
    create?: XOR<TaskCreateWithoutContactInput, TaskUncheckedCreateWithoutContactInput> | TaskCreateWithoutContactInput[] | TaskUncheckedCreateWithoutContactInput[]
    connectOrCreate?: TaskCreateOrConnectWithoutContactInput | TaskCreateOrConnectWithoutContactInput[]
    upsert?: TaskUpsertWithWhereUniqueWithoutContactInput | TaskUpsertWithWhereUniqueWithoutContactInput[]
    createMany?: TaskCreateManyContactInputEnvelope
    set?: TaskWhereUniqueInput | TaskWhereUniqueInput[]
    disconnect?: TaskWhereUniqueInput | TaskWhereUniqueInput[]
    delete?: TaskWhereUniqueInput | TaskWhereUniqueInput[]
    connect?: TaskWhereUniqueInput | TaskWhereUniqueInput[]
    update?: TaskUpdateWithWhereUniqueWithoutContactInput | TaskUpdateWithWhereUniqueWithoutContactInput[]
    updateMany?: TaskUpdateManyWithWhereWithoutContactInput | TaskUpdateManyWithWhereWithoutContactInput[]
    deleteMany?: TaskScalarWhereInput | TaskScalarWhereInput[]
  }

  export type QueryUpdateManyWithoutContactNestedInput = {
    create?: XOR<QueryCreateWithoutContactInput, QueryUncheckedCreateWithoutContactInput> | QueryCreateWithoutContactInput[] | QueryUncheckedCreateWithoutContactInput[]
    connectOrCreate?: QueryCreateOrConnectWithoutContactInput | QueryCreateOrConnectWithoutContactInput[]
    upsert?: QueryUpsertWithWhereUniqueWithoutContactInput | QueryUpsertWithWhereUniqueWithoutContactInput[]
    createMany?: QueryCreateManyContactInputEnvelope
    set?: QueryWhereUniqueInput | QueryWhereUniqueInput[]
    disconnect?: QueryWhereUniqueInput | QueryWhereUniqueInput[]
    delete?: QueryWhereUniqueInput | QueryWhereUniqueInput[]
    connect?: QueryWhereUniqueInput | QueryWhereUniqueInput[]
    update?: QueryUpdateWithWhereUniqueWithoutContactInput | QueryUpdateWithWhereUniqueWithoutContactInput[]
    updateMany?: QueryUpdateManyWithWhereWithoutContactInput | QueryUpdateManyWithWhereWithoutContactInput[]
    deleteMany?: QueryScalarWhereInput | QueryScalarWhereInput[]
  }

  export type ContactKnowledgeUpdateManyWithoutContactNestedInput = {
    create?: XOR<ContactKnowledgeCreateWithoutContactInput, ContactKnowledgeUncheckedCreateWithoutContactInput> | ContactKnowledgeCreateWithoutContactInput[] | ContactKnowledgeUncheckedCreateWithoutContactInput[]
    connectOrCreate?: ContactKnowledgeCreateOrConnectWithoutContactInput | ContactKnowledgeCreateOrConnectWithoutContactInput[]
    upsert?: ContactKnowledgeUpsertWithWhereUniqueWithoutContactInput | ContactKnowledgeUpsertWithWhereUniqueWithoutContactInput[]
    createMany?: ContactKnowledgeCreateManyContactInputEnvelope
    set?: ContactKnowledgeWhereUniqueInput | ContactKnowledgeWhereUniqueInput[]
    disconnect?: ContactKnowledgeWhereUniqueInput | ContactKnowledgeWhereUniqueInput[]
    delete?: ContactKnowledgeWhereUniqueInput | ContactKnowledgeWhereUniqueInput[]
    connect?: ContactKnowledgeWhereUniqueInput | ContactKnowledgeWhereUniqueInput[]
    update?: ContactKnowledgeUpdateWithWhereUniqueWithoutContactInput | ContactKnowledgeUpdateWithWhereUniqueWithoutContactInput[]
    updateMany?: ContactKnowledgeUpdateManyWithWhereWithoutContactInput | ContactKnowledgeUpdateManyWithWhereWithoutContactInput[]
    deleteMany?: ContactKnowledgeScalarWhereInput | ContactKnowledgeScalarWhereInput[]
  }

  export type CallUpdateManyWithoutContactNestedInput = {
    create?: XOR<CallCreateWithoutContactInput, CallUncheckedCreateWithoutContactInput> | CallCreateWithoutContactInput[] | CallUncheckedCreateWithoutContactInput[]
    connectOrCreate?: CallCreateOrConnectWithoutContactInput | CallCreateOrConnectWithoutContactInput[]
    upsert?: CallUpsertWithWhereUniqueWithoutContactInput | CallUpsertWithWhereUniqueWithoutContactInput[]
    createMany?: CallCreateManyContactInputEnvelope
    set?: CallWhereUniqueInput | CallWhereUniqueInput[]
    disconnect?: CallWhereUniqueInput | CallWhereUniqueInput[]
    delete?: CallWhereUniqueInput | CallWhereUniqueInput[]
    connect?: CallWhereUniqueInput | CallWhereUniqueInput[]
    update?: CallUpdateWithWhereUniqueWithoutContactInput | CallUpdateWithWhereUniqueWithoutContactInput[]
    updateMany?: CallUpdateManyWithWhereWithoutContactInput | CallUpdateManyWithWhereWithoutContactInput[]
    deleteMany?: CallScalarWhereInput | CallScalarWhereInput[]
  }

  export type EmailUpdateManyWithoutContactNestedInput = {
    create?: XOR<EmailCreateWithoutContactInput, EmailUncheckedCreateWithoutContactInput> | EmailCreateWithoutContactInput[] | EmailUncheckedCreateWithoutContactInput[]
    connectOrCreate?: EmailCreateOrConnectWithoutContactInput | EmailCreateOrConnectWithoutContactInput[]
    upsert?: EmailUpsertWithWhereUniqueWithoutContactInput | EmailUpsertWithWhereUniqueWithoutContactInput[]
    createMany?: EmailCreateManyContactInputEnvelope
    set?: EmailWhereUniqueInput | EmailWhereUniqueInput[]
    disconnect?: EmailWhereUniqueInput | EmailWhereUniqueInput[]
    delete?: EmailWhereUniqueInput | EmailWhereUniqueInput[]
    connect?: EmailWhereUniqueInput | EmailWhereUniqueInput[]
    update?: EmailUpdateWithWhereUniqueWithoutContactInput | EmailUpdateWithWhereUniqueWithoutContactInput[]
    updateMany?: EmailUpdateManyWithWhereWithoutContactInput | EmailUpdateManyWithWhereWithoutContactInput[]
    deleteMany?: EmailScalarWhereInput | EmailScalarWhereInput[]
  }

  export type ConversationUncheckedUpdateManyWithoutContactNestedInput = {
    create?: XOR<ConversationCreateWithoutContactInput, ConversationUncheckedCreateWithoutContactInput> | ConversationCreateWithoutContactInput[] | ConversationUncheckedCreateWithoutContactInput[]
    connectOrCreate?: ConversationCreateOrConnectWithoutContactInput | ConversationCreateOrConnectWithoutContactInput[]
    upsert?: ConversationUpsertWithWhereUniqueWithoutContactInput | ConversationUpsertWithWhereUniqueWithoutContactInput[]
    createMany?: ConversationCreateManyContactInputEnvelope
    set?: ConversationWhereUniqueInput | ConversationWhereUniqueInput[]
    disconnect?: ConversationWhereUniqueInput | ConversationWhereUniqueInput[]
    delete?: ConversationWhereUniqueInput | ConversationWhereUniqueInput[]
    connect?: ConversationWhereUniqueInput | ConversationWhereUniqueInput[]
    update?: ConversationUpdateWithWhereUniqueWithoutContactInput | ConversationUpdateWithWhereUniqueWithoutContactInput[]
    updateMany?: ConversationUpdateManyWithWhereWithoutContactInput | ConversationUpdateManyWithWhereWithoutContactInput[]
    deleteMany?: ConversationScalarWhereInput | ConversationScalarWhereInput[]
  }

  export type TaskUncheckedUpdateManyWithoutContactNestedInput = {
    create?: XOR<TaskCreateWithoutContactInput, TaskUncheckedCreateWithoutContactInput> | TaskCreateWithoutContactInput[] | TaskUncheckedCreateWithoutContactInput[]
    connectOrCreate?: TaskCreateOrConnectWithoutContactInput | TaskCreateOrConnectWithoutContactInput[]
    upsert?: TaskUpsertWithWhereUniqueWithoutContactInput | TaskUpsertWithWhereUniqueWithoutContactInput[]
    createMany?: TaskCreateManyContactInputEnvelope
    set?: TaskWhereUniqueInput | TaskWhereUniqueInput[]
    disconnect?: TaskWhereUniqueInput | TaskWhereUniqueInput[]
    delete?: TaskWhereUniqueInput | TaskWhereUniqueInput[]
    connect?: TaskWhereUniqueInput | TaskWhereUniqueInput[]
    update?: TaskUpdateWithWhereUniqueWithoutContactInput | TaskUpdateWithWhereUniqueWithoutContactInput[]
    updateMany?: TaskUpdateManyWithWhereWithoutContactInput | TaskUpdateManyWithWhereWithoutContactInput[]
    deleteMany?: TaskScalarWhereInput | TaskScalarWhereInput[]
  }

  export type QueryUncheckedUpdateManyWithoutContactNestedInput = {
    create?: XOR<QueryCreateWithoutContactInput, QueryUncheckedCreateWithoutContactInput> | QueryCreateWithoutContactInput[] | QueryUncheckedCreateWithoutContactInput[]
    connectOrCreate?: QueryCreateOrConnectWithoutContactInput | QueryCreateOrConnectWithoutContactInput[]
    upsert?: QueryUpsertWithWhereUniqueWithoutContactInput | QueryUpsertWithWhereUniqueWithoutContactInput[]
    createMany?: QueryCreateManyContactInputEnvelope
    set?: QueryWhereUniqueInput | QueryWhereUniqueInput[]
    disconnect?: QueryWhereUniqueInput | QueryWhereUniqueInput[]
    delete?: QueryWhereUniqueInput | QueryWhereUniqueInput[]
    connect?: QueryWhereUniqueInput | QueryWhereUniqueInput[]
    update?: QueryUpdateWithWhereUniqueWithoutContactInput | QueryUpdateWithWhereUniqueWithoutContactInput[]
    updateMany?: QueryUpdateManyWithWhereWithoutContactInput | QueryUpdateManyWithWhereWithoutContactInput[]
    deleteMany?: QueryScalarWhereInput | QueryScalarWhereInput[]
  }

  export type ContactKnowledgeUncheckedUpdateManyWithoutContactNestedInput = {
    create?: XOR<ContactKnowledgeCreateWithoutContactInput, ContactKnowledgeUncheckedCreateWithoutContactInput> | ContactKnowledgeCreateWithoutContactInput[] | ContactKnowledgeUncheckedCreateWithoutContactInput[]
    connectOrCreate?: ContactKnowledgeCreateOrConnectWithoutContactInput | ContactKnowledgeCreateOrConnectWithoutContactInput[]
    upsert?: ContactKnowledgeUpsertWithWhereUniqueWithoutContactInput | ContactKnowledgeUpsertWithWhereUniqueWithoutContactInput[]
    createMany?: ContactKnowledgeCreateManyContactInputEnvelope
    set?: ContactKnowledgeWhereUniqueInput | ContactKnowledgeWhereUniqueInput[]
    disconnect?: ContactKnowledgeWhereUniqueInput | ContactKnowledgeWhereUniqueInput[]
    delete?: ContactKnowledgeWhereUniqueInput | ContactKnowledgeWhereUniqueInput[]
    connect?: ContactKnowledgeWhereUniqueInput | ContactKnowledgeWhereUniqueInput[]
    update?: ContactKnowledgeUpdateWithWhereUniqueWithoutContactInput | ContactKnowledgeUpdateWithWhereUniqueWithoutContactInput[]
    updateMany?: ContactKnowledgeUpdateManyWithWhereWithoutContactInput | ContactKnowledgeUpdateManyWithWhereWithoutContactInput[]
    deleteMany?: ContactKnowledgeScalarWhereInput | ContactKnowledgeScalarWhereInput[]
  }

  export type CallUncheckedUpdateManyWithoutContactNestedInput = {
    create?: XOR<CallCreateWithoutContactInput, CallUncheckedCreateWithoutContactInput> | CallCreateWithoutContactInput[] | CallUncheckedCreateWithoutContactInput[]
    connectOrCreate?: CallCreateOrConnectWithoutContactInput | CallCreateOrConnectWithoutContactInput[]
    upsert?: CallUpsertWithWhereUniqueWithoutContactInput | CallUpsertWithWhereUniqueWithoutContactInput[]
    createMany?: CallCreateManyContactInputEnvelope
    set?: CallWhereUniqueInput | CallWhereUniqueInput[]
    disconnect?: CallWhereUniqueInput | CallWhereUniqueInput[]
    delete?: CallWhereUniqueInput | CallWhereUniqueInput[]
    connect?: CallWhereUniqueInput | CallWhereUniqueInput[]
    update?: CallUpdateWithWhereUniqueWithoutContactInput | CallUpdateWithWhereUniqueWithoutContactInput[]
    updateMany?: CallUpdateManyWithWhereWithoutContactInput | CallUpdateManyWithWhereWithoutContactInput[]
    deleteMany?: CallScalarWhereInput | CallScalarWhereInput[]
  }

  export type EmailUncheckedUpdateManyWithoutContactNestedInput = {
    create?: XOR<EmailCreateWithoutContactInput, EmailUncheckedCreateWithoutContactInput> | EmailCreateWithoutContactInput[] | EmailUncheckedCreateWithoutContactInput[]
    connectOrCreate?: EmailCreateOrConnectWithoutContactInput | EmailCreateOrConnectWithoutContactInput[]
    upsert?: EmailUpsertWithWhereUniqueWithoutContactInput | EmailUpsertWithWhereUniqueWithoutContactInput[]
    createMany?: EmailCreateManyContactInputEnvelope
    set?: EmailWhereUniqueInput | EmailWhereUniqueInput[]
    disconnect?: EmailWhereUniqueInput | EmailWhereUniqueInput[]
    delete?: EmailWhereUniqueInput | EmailWhereUniqueInput[]
    connect?: EmailWhereUniqueInput | EmailWhereUniqueInput[]
    update?: EmailUpdateWithWhereUniqueWithoutContactInput | EmailUpdateWithWhereUniqueWithoutContactInput[]
    updateMany?: EmailUpdateManyWithWhereWithoutContactInput | EmailUpdateManyWithWhereWithoutContactInput[]
    deleteMany?: EmailScalarWhereInput | EmailScalarWhereInput[]
  }

  export type MessageCreateNestedManyWithoutConversationInput = {
    create?: XOR<MessageCreateWithoutConversationInput, MessageUncheckedCreateWithoutConversationInput> | MessageCreateWithoutConversationInput[] | MessageUncheckedCreateWithoutConversationInput[]
    connectOrCreate?: MessageCreateOrConnectWithoutConversationInput | MessageCreateOrConnectWithoutConversationInput[]
    createMany?: MessageCreateManyConversationInputEnvelope
    connect?: MessageWhereUniqueInput | MessageWhereUniqueInput[]
  }

  export type HistoryCreateNestedManyWithoutConversationInput = {
    create?: XOR<HistoryCreateWithoutConversationInput, HistoryUncheckedCreateWithoutConversationInput> | HistoryCreateWithoutConversationInput[] | HistoryUncheckedCreateWithoutConversationInput[]
    connectOrCreate?: HistoryCreateOrConnectWithoutConversationInput | HistoryCreateOrConnectWithoutConversationInput[]
    createMany?: HistoryCreateManyConversationInputEnvelope
    connect?: HistoryWhereUniqueInput | HistoryWhereUniqueInput[]
  }

  export type TaskCreateNestedManyWithoutConversationInput = {
    create?: XOR<TaskCreateWithoutConversationInput, TaskUncheckedCreateWithoutConversationInput> | TaskCreateWithoutConversationInput[] | TaskUncheckedCreateWithoutConversationInput[]
    connectOrCreate?: TaskCreateOrConnectWithoutConversationInput | TaskCreateOrConnectWithoutConversationInput[]
    createMany?: TaskCreateManyConversationInputEnvelope
    connect?: TaskWhereUniqueInput | TaskWhereUniqueInput[]
  }

  export type ContactCreateNestedOneWithoutConversationsInput = {
    create?: XOR<ContactCreateWithoutConversationsInput, ContactUncheckedCreateWithoutConversationsInput>
    connectOrCreate?: ContactCreateOrConnectWithoutConversationsInput
    connect?: ContactWhereUniqueInput
  }

  export type QueryCreateNestedManyWithoutConversationInput = {
    create?: XOR<QueryCreateWithoutConversationInput, QueryUncheckedCreateWithoutConversationInput> | QueryCreateWithoutConversationInput[] | QueryUncheckedCreateWithoutConversationInput[]
    connectOrCreate?: QueryCreateOrConnectWithoutConversationInput | QueryCreateOrConnectWithoutConversationInput[]
    createMany?: QueryCreateManyConversationInputEnvelope
    connect?: QueryWhereUniqueInput | QueryWhereUniqueInput[]
  }

  export type CallCreateNestedManyWithoutConversationInput = {
    create?: XOR<CallCreateWithoutConversationInput, CallUncheckedCreateWithoutConversationInput> | CallCreateWithoutConversationInput[] | CallUncheckedCreateWithoutConversationInput[]
    connectOrCreate?: CallCreateOrConnectWithoutConversationInput | CallCreateOrConnectWithoutConversationInput[]
    createMany?: CallCreateManyConversationInputEnvelope
    connect?: CallWhereUniqueInput | CallWhereUniqueInput[]
  }

  export type EmailCreateNestedManyWithoutConversationInput = {
    create?: XOR<EmailCreateWithoutConversationInput, EmailUncheckedCreateWithoutConversationInput> | EmailCreateWithoutConversationInput[] | EmailUncheckedCreateWithoutConversationInput[]
    connectOrCreate?: EmailCreateOrConnectWithoutConversationInput | EmailCreateOrConnectWithoutConversationInput[]
    createMany?: EmailCreateManyConversationInputEnvelope
    connect?: EmailWhereUniqueInput | EmailWhereUniqueInput[]
  }

  export type MessageUncheckedCreateNestedManyWithoutConversationInput = {
    create?: XOR<MessageCreateWithoutConversationInput, MessageUncheckedCreateWithoutConversationInput> | MessageCreateWithoutConversationInput[] | MessageUncheckedCreateWithoutConversationInput[]
    connectOrCreate?: MessageCreateOrConnectWithoutConversationInput | MessageCreateOrConnectWithoutConversationInput[]
    createMany?: MessageCreateManyConversationInputEnvelope
    connect?: MessageWhereUniqueInput | MessageWhereUniqueInput[]
  }

  export type HistoryUncheckedCreateNestedManyWithoutConversationInput = {
    create?: XOR<HistoryCreateWithoutConversationInput, HistoryUncheckedCreateWithoutConversationInput> | HistoryCreateWithoutConversationInput[] | HistoryUncheckedCreateWithoutConversationInput[]
    connectOrCreate?: HistoryCreateOrConnectWithoutConversationInput | HistoryCreateOrConnectWithoutConversationInput[]
    createMany?: HistoryCreateManyConversationInputEnvelope
    connect?: HistoryWhereUniqueInput | HistoryWhereUniqueInput[]
  }

  export type TaskUncheckedCreateNestedManyWithoutConversationInput = {
    create?: XOR<TaskCreateWithoutConversationInput, TaskUncheckedCreateWithoutConversationInput> | TaskCreateWithoutConversationInput[] | TaskUncheckedCreateWithoutConversationInput[]
    connectOrCreate?: TaskCreateOrConnectWithoutConversationInput | TaskCreateOrConnectWithoutConversationInput[]
    createMany?: TaskCreateManyConversationInputEnvelope
    connect?: TaskWhereUniqueInput | TaskWhereUniqueInput[]
  }

  export type QueryUncheckedCreateNestedManyWithoutConversationInput = {
    create?: XOR<QueryCreateWithoutConversationInput, QueryUncheckedCreateWithoutConversationInput> | QueryCreateWithoutConversationInput[] | QueryUncheckedCreateWithoutConversationInput[]
    connectOrCreate?: QueryCreateOrConnectWithoutConversationInput | QueryCreateOrConnectWithoutConversationInput[]
    createMany?: QueryCreateManyConversationInputEnvelope
    connect?: QueryWhereUniqueInput | QueryWhereUniqueInput[]
  }

  export type CallUncheckedCreateNestedManyWithoutConversationInput = {
    create?: XOR<CallCreateWithoutConversationInput, CallUncheckedCreateWithoutConversationInput> | CallCreateWithoutConversationInput[] | CallUncheckedCreateWithoutConversationInput[]
    connectOrCreate?: CallCreateOrConnectWithoutConversationInput | CallCreateOrConnectWithoutConversationInput[]
    createMany?: CallCreateManyConversationInputEnvelope
    connect?: CallWhereUniqueInput | CallWhereUniqueInput[]
  }

  export type EmailUncheckedCreateNestedManyWithoutConversationInput = {
    create?: XOR<EmailCreateWithoutConversationInput, EmailUncheckedCreateWithoutConversationInput> | EmailCreateWithoutConversationInput[] | EmailUncheckedCreateWithoutConversationInput[]
    connectOrCreate?: EmailCreateOrConnectWithoutConversationInput | EmailCreateOrConnectWithoutConversationInput[]
    createMany?: EmailCreateManyConversationInputEnvelope
    connect?: EmailWhereUniqueInput | EmailWhereUniqueInput[]
  }

  export type NullableDateTimeFieldUpdateOperationsInput = {
    set?: Date | string | null
  }

  export type MessageUpdateManyWithoutConversationNestedInput = {
    create?: XOR<MessageCreateWithoutConversationInput, MessageUncheckedCreateWithoutConversationInput> | MessageCreateWithoutConversationInput[] | MessageUncheckedCreateWithoutConversationInput[]
    connectOrCreate?: MessageCreateOrConnectWithoutConversationInput | MessageCreateOrConnectWithoutConversationInput[]
    upsert?: MessageUpsertWithWhereUniqueWithoutConversationInput | MessageUpsertWithWhereUniqueWithoutConversationInput[]
    createMany?: MessageCreateManyConversationInputEnvelope
    set?: MessageWhereUniqueInput | MessageWhereUniqueInput[]
    disconnect?: MessageWhereUniqueInput | MessageWhereUniqueInput[]
    delete?: MessageWhereUniqueInput | MessageWhereUniqueInput[]
    connect?: MessageWhereUniqueInput | MessageWhereUniqueInput[]
    update?: MessageUpdateWithWhereUniqueWithoutConversationInput | MessageUpdateWithWhereUniqueWithoutConversationInput[]
    updateMany?: MessageUpdateManyWithWhereWithoutConversationInput | MessageUpdateManyWithWhereWithoutConversationInput[]
    deleteMany?: MessageScalarWhereInput | MessageScalarWhereInput[]
  }

  export type HistoryUpdateManyWithoutConversationNestedInput = {
    create?: XOR<HistoryCreateWithoutConversationInput, HistoryUncheckedCreateWithoutConversationInput> | HistoryCreateWithoutConversationInput[] | HistoryUncheckedCreateWithoutConversationInput[]
    connectOrCreate?: HistoryCreateOrConnectWithoutConversationInput | HistoryCreateOrConnectWithoutConversationInput[]
    upsert?: HistoryUpsertWithWhereUniqueWithoutConversationInput | HistoryUpsertWithWhereUniqueWithoutConversationInput[]
    createMany?: HistoryCreateManyConversationInputEnvelope
    set?: HistoryWhereUniqueInput | HistoryWhereUniqueInput[]
    disconnect?: HistoryWhereUniqueInput | HistoryWhereUniqueInput[]
    delete?: HistoryWhereUniqueInput | HistoryWhereUniqueInput[]
    connect?: HistoryWhereUniqueInput | HistoryWhereUniqueInput[]
    update?: HistoryUpdateWithWhereUniqueWithoutConversationInput | HistoryUpdateWithWhereUniqueWithoutConversationInput[]
    updateMany?: HistoryUpdateManyWithWhereWithoutConversationInput | HistoryUpdateManyWithWhereWithoutConversationInput[]
    deleteMany?: HistoryScalarWhereInput | HistoryScalarWhereInput[]
  }

  export type TaskUpdateManyWithoutConversationNestedInput = {
    create?: XOR<TaskCreateWithoutConversationInput, TaskUncheckedCreateWithoutConversationInput> | TaskCreateWithoutConversationInput[] | TaskUncheckedCreateWithoutConversationInput[]
    connectOrCreate?: TaskCreateOrConnectWithoutConversationInput | TaskCreateOrConnectWithoutConversationInput[]
    upsert?: TaskUpsertWithWhereUniqueWithoutConversationInput | TaskUpsertWithWhereUniqueWithoutConversationInput[]
    createMany?: TaskCreateManyConversationInputEnvelope
    set?: TaskWhereUniqueInput | TaskWhereUniqueInput[]
    disconnect?: TaskWhereUniqueInput | TaskWhereUniqueInput[]
    delete?: TaskWhereUniqueInput | TaskWhereUniqueInput[]
    connect?: TaskWhereUniqueInput | TaskWhereUniqueInput[]
    update?: TaskUpdateWithWhereUniqueWithoutConversationInput | TaskUpdateWithWhereUniqueWithoutConversationInput[]
    updateMany?: TaskUpdateManyWithWhereWithoutConversationInput | TaskUpdateManyWithWhereWithoutConversationInput[]
    deleteMany?: TaskScalarWhereInput | TaskScalarWhereInput[]
  }

  export type ContactUpdateOneRequiredWithoutConversationsNestedInput = {
    create?: XOR<ContactCreateWithoutConversationsInput, ContactUncheckedCreateWithoutConversationsInput>
    connectOrCreate?: ContactCreateOrConnectWithoutConversationsInput
    upsert?: ContactUpsertWithoutConversationsInput
    connect?: ContactWhereUniqueInput
    update?: XOR<XOR<ContactUpdateToOneWithWhereWithoutConversationsInput, ContactUpdateWithoutConversationsInput>, ContactUncheckedUpdateWithoutConversationsInput>
  }

  export type QueryUpdateManyWithoutConversationNestedInput = {
    create?: XOR<QueryCreateWithoutConversationInput, QueryUncheckedCreateWithoutConversationInput> | QueryCreateWithoutConversationInput[] | QueryUncheckedCreateWithoutConversationInput[]
    connectOrCreate?: QueryCreateOrConnectWithoutConversationInput | QueryCreateOrConnectWithoutConversationInput[]
    upsert?: QueryUpsertWithWhereUniqueWithoutConversationInput | QueryUpsertWithWhereUniqueWithoutConversationInput[]
    createMany?: QueryCreateManyConversationInputEnvelope
    set?: QueryWhereUniqueInput | QueryWhereUniqueInput[]
    disconnect?: QueryWhereUniqueInput | QueryWhereUniqueInput[]
    delete?: QueryWhereUniqueInput | QueryWhereUniqueInput[]
    connect?: QueryWhereUniqueInput | QueryWhereUniqueInput[]
    update?: QueryUpdateWithWhereUniqueWithoutConversationInput | QueryUpdateWithWhereUniqueWithoutConversationInput[]
    updateMany?: QueryUpdateManyWithWhereWithoutConversationInput | QueryUpdateManyWithWhereWithoutConversationInput[]
    deleteMany?: QueryScalarWhereInput | QueryScalarWhereInput[]
  }

  export type CallUpdateManyWithoutConversationNestedInput = {
    create?: XOR<CallCreateWithoutConversationInput, CallUncheckedCreateWithoutConversationInput> | CallCreateWithoutConversationInput[] | CallUncheckedCreateWithoutConversationInput[]
    connectOrCreate?: CallCreateOrConnectWithoutConversationInput | CallCreateOrConnectWithoutConversationInput[]
    upsert?: CallUpsertWithWhereUniqueWithoutConversationInput | CallUpsertWithWhereUniqueWithoutConversationInput[]
    createMany?: CallCreateManyConversationInputEnvelope
    set?: CallWhereUniqueInput | CallWhereUniqueInput[]
    disconnect?: CallWhereUniqueInput | CallWhereUniqueInput[]
    delete?: CallWhereUniqueInput | CallWhereUniqueInput[]
    connect?: CallWhereUniqueInput | CallWhereUniqueInput[]
    update?: CallUpdateWithWhereUniqueWithoutConversationInput | CallUpdateWithWhereUniqueWithoutConversationInput[]
    updateMany?: CallUpdateManyWithWhereWithoutConversationInput | CallUpdateManyWithWhereWithoutConversationInput[]
    deleteMany?: CallScalarWhereInput | CallScalarWhereInput[]
  }

  export type EmailUpdateManyWithoutConversationNestedInput = {
    create?: XOR<EmailCreateWithoutConversationInput, EmailUncheckedCreateWithoutConversationInput> | EmailCreateWithoutConversationInput[] | EmailUncheckedCreateWithoutConversationInput[]
    connectOrCreate?: EmailCreateOrConnectWithoutConversationInput | EmailCreateOrConnectWithoutConversationInput[]
    upsert?: EmailUpsertWithWhereUniqueWithoutConversationInput | EmailUpsertWithWhereUniqueWithoutConversationInput[]
    createMany?: EmailCreateManyConversationInputEnvelope
    set?: EmailWhereUniqueInput | EmailWhereUniqueInput[]
    disconnect?: EmailWhereUniqueInput | EmailWhereUniqueInput[]
    delete?: EmailWhereUniqueInput | EmailWhereUniqueInput[]
    connect?: EmailWhereUniqueInput | EmailWhereUniqueInput[]
    update?: EmailUpdateWithWhereUniqueWithoutConversationInput | EmailUpdateWithWhereUniqueWithoutConversationInput[]
    updateMany?: EmailUpdateManyWithWhereWithoutConversationInput | EmailUpdateManyWithWhereWithoutConversationInput[]
    deleteMany?: EmailScalarWhereInput | EmailScalarWhereInput[]
  }

  export type MessageUncheckedUpdateManyWithoutConversationNestedInput = {
    create?: XOR<MessageCreateWithoutConversationInput, MessageUncheckedCreateWithoutConversationInput> | MessageCreateWithoutConversationInput[] | MessageUncheckedCreateWithoutConversationInput[]
    connectOrCreate?: MessageCreateOrConnectWithoutConversationInput | MessageCreateOrConnectWithoutConversationInput[]
    upsert?: MessageUpsertWithWhereUniqueWithoutConversationInput | MessageUpsertWithWhereUniqueWithoutConversationInput[]
    createMany?: MessageCreateManyConversationInputEnvelope
    set?: MessageWhereUniqueInput | MessageWhereUniqueInput[]
    disconnect?: MessageWhereUniqueInput | MessageWhereUniqueInput[]
    delete?: MessageWhereUniqueInput | MessageWhereUniqueInput[]
    connect?: MessageWhereUniqueInput | MessageWhereUniqueInput[]
    update?: MessageUpdateWithWhereUniqueWithoutConversationInput | MessageUpdateWithWhereUniqueWithoutConversationInput[]
    updateMany?: MessageUpdateManyWithWhereWithoutConversationInput | MessageUpdateManyWithWhereWithoutConversationInput[]
    deleteMany?: MessageScalarWhereInput | MessageScalarWhereInput[]
  }

  export type HistoryUncheckedUpdateManyWithoutConversationNestedInput = {
    create?: XOR<HistoryCreateWithoutConversationInput, HistoryUncheckedCreateWithoutConversationInput> | HistoryCreateWithoutConversationInput[] | HistoryUncheckedCreateWithoutConversationInput[]
    connectOrCreate?: HistoryCreateOrConnectWithoutConversationInput | HistoryCreateOrConnectWithoutConversationInput[]
    upsert?: HistoryUpsertWithWhereUniqueWithoutConversationInput | HistoryUpsertWithWhereUniqueWithoutConversationInput[]
    createMany?: HistoryCreateManyConversationInputEnvelope
    set?: HistoryWhereUniqueInput | HistoryWhereUniqueInput[]
    disconnect?: HistoryWhereUniqueInput | HistoryWhereUniqueInput[]
    delete?: HistoryWhereUniqueInput | HistoryWhereUniqueInput[]
    connect?: HistoryWhereUniqueInput | HistoryWhereUniqueInput[]
    update?: HistoryUpdateWithWhereUniqueWithoutConversationInput | HistoryUpdateWithWhereUniqueWithoutConversationInput[]
    updateMany?: HistoryUpdateManyWithWhereWithoutConversationInput | HistoryUpdateManyWithWhereWithoutConversationInput[]
    deleteMany?: HistoryScalarWhereInput | HistoryScalarWhereInput[]
  }

  export type TaskUncheckedUpdateManyWithoutConversationNestedInput = {
    create?: XOR<TaskCreateWithoutConversationInput, TaskUncheckedCreateWithoutConversationInput> | TaskCreateWithoutConversationInput[] | TaskUncheckedCreateWithoutConversationInput[]
    connectOrCreate?: TaskCreateOrConnectWithoutConversationInput | TaskCreateOrConnectWithoutConversationInput[]
    upsert?: TaskUpsertWithWhereUniqueWithoutConversationInput | TaskUpsertWithWhereUniqueWithoutConversationInput[]
    createMany?: TaskCreateManyConversationInputEnvelope
    set?: TaskWhereUniqueInput | TaskWhereUniqueInput[]
    disconnect?: TaskWhereUniqueInput | TaskWhereUniqueInput[]
    delete?: TaskWhereUniqueInput | TaskWhereUniqueInput[]
    connect?: TaskWhereUniqueInput | TaskWhereUniqueInput[]
    update?: TaskUpdateWithWhereUniqueWithoutConversationInput | TaskUpdateWithWhereUniqueWithoutConversationInput[]
    updateMany?: TaskUpdateManyWithWhereWithoutConversationInput | TaskUpdateManyWithWhereWithoutConversationInput[]
    deleteMany?: TaskScalarWhereInput | TaskScalarWhereInput[]
  }

  export type QueryUncheckedUpdateManyWithoutConversationNestedInput = {
    create?: XOR<QueryCreateWithoutConversationInput, QueryUncheckedCreateWithoutConversationInput> | QueryCreateWithoutConversationInput[] | QueryUncheckedCreateWithoutConversationInput[]
    connectOrCreate?: QueryCreateOrConnectWithoutConversationInput | QueryCreateOrConnectWithoutConversationInput[]
    upsert?: QueryUpsertWithWhereUniqueWithoutConversationInput | QueryUpsertWithWhereUniqueWithoutConversationInput[]
    createMany?: QueryCreateManyConversationInputEnvelope
    set?: QueryWhereUniqueInput | QueryWhereUniqueInput[]
    disconnect?: QueryWhereUniqueInput | QueryWhereUniqueInput[]
    delete?: QueryWhereUniqueInput | QueryWhereUniqueInput[]
    connect?: QueryWhereUniqueInput | QueryWhereUniqueInput[]
    update?: QueryUpdateWithWhereUniqueWithoutConversationInput | QueryUpdateWithWhereUniqueWithoutConversationInput[]
    updateMany?: QueryUpdateManyWithWhereWithoutConversationInput | QueryUpdateManyWithWhereWithoutConversationInput[]
    deleteMany?: QueryScalarWhereInput | QueryScalarWhereInput[]
  }

  export type CallUncheckedUpdateManyWithoutConversationNestedInput = {
    create?: XOR<CallCreateWithoutConversationInput, CallUncheckedCreateWithoutConversationInput> | CallCreateWithoutConversationInput[] | CallUncheckedCreateWithoutConversationInput[]
    connectOrCreate?: CallCreateOrConnectWithoutConversationInput | CallCreateOrConnectWithoutConversationInput[]
    upsert?: CallUpsertWithWhereUniqueWithoutConversationInput | CallUpsertWithWhereUniqueWithoutConversationInput[]
    createMany?: CallCreateManyConversationInputEnvelope
    set?: CallWhereUniqueInput | CallWhereUniqueInput[]
    disconnect?: CallWhereUniqueInput | CallWhereUniqueInput[]
    delete?: CallWhereUniqueInput | CallWhereUniqueInput[]
    connect?: CallWhereUniqueInput | CallWhereUniqueInput[]
    update?: CallUpdateWithWhereUniqueWithoutConversationInput | CallUpdateWithWhereUniqueWithoutConversationInput[]
    updateMany?: CallUpdateManyWithWhereWithoutConversationInput | CallUpdateManyWithWhereWithoutConversationInput[]
    deleteMany?: CallScalarWhereInput | CallScalarWhereInput[]
  }

  export type EmailUncheckedUpdateManyWithoutConversationNestedInput = {
    create?: XOR<EmailCreateWithoutConversationInput, EmailUncheckedCreateWithoutConversationInput> | EmailCreateWithoutConversationInput[] | EmailUncheckedCreateWithoutConversationInput[]
    connectOrCreate?: EmailCreateOrConnectWithoutConversationInput | EmailCreateOrConnectWithoutConversationInput[]
    upsert?: EmailUpsertWithWhereUniqueWithoutConversationInput | EmailUpsertWithWhereUniqueWithoutConversationInput[]
    createMany?: EmailCreateManyConversationInputEnvelope
    set?: EmailWhereUniqueInput | EmailWhereUniqueInput[]
    disconnect?: EmailWhereUniqueInput | EmailWhereUniqueInput[]
    delete?: EmailWhereUniqueInput | EmailWhereUniqueInput[]
    connect?: EmailWhereUniqueInput | EmailWhereUniqueInput[]
    update?: EmailUpdateWithWhereUniqueWithoutConversationInput | EmailUpdateWithWhereUniqueWithoutConversationInput[]
    updateMany?: EmailUpdateManyWithWhereWithoutConversationInput | EmailUpdateManyWithWhereWithoutConversationInput[]
    deleteMany?: EmailScalarWhereInput | EmailScalarWhereInput[]
  }

  export type ConversationCreateNestedOneWithoutMessagesInput = {
    create?: XOR<ConversationCreateWithoutMessagesInput, ConversationUncheckedCreateWithoutMessagesInput>
    connectOrCreate?: ConversationCreateOrConnectWithoutMessagesInput
    connect?: ConversationWhereUniqueInput
  }

  export type CallCreateNestedOneWithoutMessagesInput = {
    create?: XOR<CallCreateWithoutMessagesInput, CallUncheckedCreateWithoutMessagesInput>
    connectOrCreate?: CallCreateOrConnectWithoutMessagesInput
    connect?: CallWhereUniqueInput
  }

  export type TaskSourceMessageCreateNestedManyWithoutMessageInput = {
    create?: XOR<TaskSourceMessageCreateWithoutMessageInput, TaskSourceMessageUncheckedCreateWithoutMessageInput> | TaskSourceMessageCreateWithoutMessageInput[] | TaskSourceMessageUncheckedCreateWithoutMessageInput[]
    connectOrCreate?: TaskSourceMessageCreateOrConnectWithoutMessageInput | TaskSourceMessageCreateOrConnectWithoutMessageInput[]
    createMany?: TaskSourceMessageCreateManyMessageInputEnvelope
    connect?: TaskSourceMessageWhereUniqueInput | TaskSourceMessageWhereUniqueInput[]
  }

  export type QuerySourceMessageCreateNestedManyWithoutMessageInput = {
    create?: XOR<QuerySourceMessageCreateWithoutMessageInput, QuerySourceMessageUncheckedCreateWithoutMessageInput> | QuerySourceMessageCreateWithoutMessageInput[] | QuerySourceMessageUncheckedCreateWithoutMessageInput[]
    connectOrCreate?: QuerySourceMessageCreateOrConnectWithoutMessageInput | QuerySourceMessageCreateOrConnectWithoutMessageInput[]
    createMany?: QuerySourceMessageCreateManyMessageInputEnvelope
    connect?: QuerySourceMessageWhereUniqueInput | QuerySourceMessageWhereUniqueInput[]
  }

  export type KnowledgeSourceMessageCreateNestedManyWithoutMessageInput = {
    create?: XOR<KnowledgeSourceMessageCreateWithoutMessageInput, KnowledgeSourceMessageUncheckedCreateWithoutMessageInput> | KnowledgeSourceMessageCreateWithoutMessageInput[] | KnowledgeSourceMessageUncheckedCreateWithoutMessageInput[]
    connectOrCreate?: KnowledgeSourceMessageCreateOrConnectWithoutMessageInput | KnowledgeSourceMessageCreateOrConnectWithoutMessageInput[]
    createMany?: KnowledgeSourceMessageCreateManyMessageInputEnvelope
    connect?: KnowledgeSourceMessageWhereUniqueInput | KnowledgeSourceMessageWhereUniqueInput[]
  }

  export type TaskSourceMessageUncheckedCreateNestedManyWithoutMessageInput = {
    create?: XOR<TaskSourceMessageCreateWithoutMessageInput, TaskSourceMessageUncheckedCreateWithoutMessageInput> | TaskSourceMessageCreateWithoutMessageInput[] | TaskSourceMessageUncheckedCreateWithoutMessageInput[]
    connectOrCreate?: TaskSourceMessageCreateOrConnectWithoutMessageInput | TaskSourceMessageCreateOrConnectWithoutMessageInput[]
    createMany?: TaskSourceMessageCreateManyMessageInputEnvelope
    connect?: TaskSourceMessageWhereUniqueInput | TaskSourceMessageWhereUniqueInput[]
  }

  export type QuerySourceMessageUncheckedCreateNestedManyWithoutMessageInput = {
    create?: XOR<QuerySourceMessageCreateWithoutMessageInput, QuerySourceMessageUncheckedCreateWithoutMessageInput> | QuerySourceMessageCreateWithoutMessageInput[] | QuerySourceMessageUncheckedCreateWithoutMessageInput[]
    connectOrCreate?: QuerySourceMessageCreateOrConnectWithoutMessageInput | QuerySourceMessageCreateOrConnectWithoutMessageInput[]
    createMany?: QuerySourceMessageCreateManyMessageInputEnvelope
    connect?: QuerySourceMessageWhereUniqueInput | QuerySourceMessageWhereUniqueInput[]
  }

  export type KnowledgeSourceMessageUncheckedCreateNestedManyWithoutMessageInput = {
    create?: XOR<KnowledgeSourceMessageCreateWithoutMessageInput, KnowledgeSourceMessageUncheckedCreateWithoutMessageInput> | KnowledgeSourceMessageCreateWithoutMessageInput[] | KnowledgeSourceMessageUncheckedCreateWithoutMessageInput[]
    connectOrCreate?: KnowledgeSourceMessageCreateOrConnectWithoutMessageInput | KnowledgeSourceMessageCreateOrConnectWithoutMessageInput[]
    createMany?: KnowledgeSourceMessageCreateManyMessageInputEnvelope
    connect?: KnowledgeSourceMessageWhereUniqueInput | KnowledgeSourceMessageWhereUniqueInput[]
  }

  export type ConversationUpdateOneRequiredWithoutMessagesNestedInput = {
    create?: XOR<ConversationCreateWithoutMessagesInput, ConversationUncheckedCreateWithoutMessagesInput>
    connectOrCreate?: ConversationCreateOrConnectWithoutMessagesInput
    upsert?: ConversationUpsertWithoutMessagesInput
    connect?: ConversationWhereUniqueInput
    update?: XOR<XOR<ConversationUpdateToOneWithWhereWithoutMessagesInput, ConversationUpdateWithoutMessagesInput>, ConversationUncheckedUpdateWithoutMessagesInput>
  }

  export type CallUpdateOneWithoutMessagesNestedInput = {
    create?: XOR<CallCreateWithoutMessagesInput, CallUncheckedCreateWithoutMessagesInput>
    connectOrCreate?: CallCreateOrConnectWithoutMessagesInput
    upsert?: CallUpsertWithoutMessagesInput
    disconnect?: CallWhereInput | boolean
    delete?: CallWhereInput | boolean
    connect?: CallWhereUniqueInput
    update?: XOR<XOR<CallUpdateToOneWithWhereWithoutMessagesInput, CallUpdateWithoutMessagesInput>, CallUncheckedUpdateWithoutMessagesInput>
  }

  export type TaskSourceMessageUpdateManyWithoutMessageNestedInput = {
    create?: XOR<TaskSourceMessageCreateWithoutMessageInput, TaskSourceMessageUncheckedCreateWithoutMessageInput> | TaskSourceMessageCreateWithoutMessageInput[] | TaskSourceMessageUncheckedCreateWithoutMessageInput[]
    connectOrCreate?: TaskSourceMessageCreateOrConnectWithoutMessageInput | TaskSourceMessageCreateOrConnectWithoutMessageInput[]
    upsert?: TaskSourceMessageUpsertWithWhereUniqueWithoutMessageInput | TaskSourceMessageUpsertWithWhereUniqueWithoutMessageInput[]
    createMany?: TaskSourceMessageCreateManyMessageInputEnvelope
    set?: TaskSourceMessageWhereUniqueInput | TaskSourceMessageWhereUniqueInput[]
    disconnect?: TaskSourceMessageWhereUniqueInput | TaskSourceMessageWhereUniqueInput[]
    delete?: TaskSourceMessageWhereUniqueInput | TaskSourceMessageWhereUniqueInput[]
    connect?: TaskSourceMessageWhereUniqueInput | TaskSourceMessageWhereUniqueInput[]
    update?: TaskSourceMessageUpdateWithWhereUniqueWithoutMessageInput | TaskSourceMessageUpdateWithWhereUniqueWithoutMessageInput[]
    updateMany?: TaskSourceMessageUpdateManyWithWhereWithoutMessageInput | TaskSourceMessageUpdateManyWithWhereWithoutMessageInput[]
    deleteMany?: TaskSourceMessageScalarWhereInput | TaskSourceMessageScalarWhereInput[]
  }

  export type QuerySourceMessageUpdateManyWithoutMessageNestedInput = {
    create?: XOR<QuerySourceMessageCreateWithoutMessageInput, QuerySourceMessageUncheckedCreateWithoutMessageInput> | QuerySourceMessageCreateWithoutMessageInput[] | QuerySourceMessageUncheckedCreateWithoutMessageInput[]
    connectOrCreate?: QuerySourceMessageCreateOrConnectWithoutMessageInput | QuerySourceMessageCreateOrConnectWithoutMessageInput[]
    upsert?: QuerySourceMessageUpsertWithWhereUniqueWithoutMessageInput | QuerySourceMessageUpsertWithWhereUniqueWithoutMessageInput[]
    createMany?: QuerySourceMessageCreateManyMessageInputEnvelope
    set?: QuerySourceMessageWhereUniqueInput | QuerySourceMessageWhereUniqueInput[]
    disconnect?: QuerySourceMessageWhereUniqueInput | QuerySourceMessageWhereUniqueInput[]
    delete?: QuerySourceMessageWhereUniqueInput | QuerySourceMessageWhereUniqueInput[]
    connect?: QuerySourceMessageWhereUniqueInput | QuerySourceMessageWhereUniqueInput[]
    update?: QuerySourceMessageUpdateWithWhereUniqueWithoutMessageInput | QuerySourceMessageUpdateWithWhereUniqueWithoutMessageInput[]
    updateMany?: QuerySourceMessageUpdateManyWithWhereWithoutMessageInput | QuerySourceMessageUpdateManyWithWhereWithoutMessageInput[]
    deleteMany?: QuerySourceMessageScalarWhereInput | QuerySourceMessageScalarWhereInput[]
  }

  export type KnowledgeSourceMessageUpdateManyWithoutMessageNestedInput = {
    create?: XOR<KnowledgeSourceMessageCreateWithoutMessageInput, KnowledgeSourceMessageUncheckedCreateWithoutMessageInput> | KnowledgeSourceMessageCreateWithoutMessageInput[] | KnowledgeSourceMessageUncheckedCreateWithoutMessageInput[]
    connectOrCreate?: KnowledgeSourceMessageCreateOrConnectWithoutMessageInput | KnowledgeSourceMessageCreateOrConnectWithoutMessageInput[]
    upsert?: KnowledgeSourceMessageUpsertWithWhereUniqueWithoutMessageInput | KnowledgeSourceMessageUpsertWithWhereUniqueWithoutMessageInput[]
    createMany?: KnowledgeSourceMessageCreateManyMessageInputEnvelope
    set?: KnowledgeSourceMessageWhereUniqueInput | KnowledgeSourceMessageWhereUniqueInput[]
    disconnect?: KnowledgeSourceMessageWhereUniqueInput | KnowledgeSourceMessageWhereUniqueInput[]
    delete?: KnowledgeSourceMessageWhereUniqueInput | KnowledgeSourceMessageWhereUniqueInput[]
    connect?: KnowledgeSourceMessageWhereUniqueInput | KnowledgeSourceMessageWhereUniqueInput[]
    update?: KnowledgeSourceMessageUpdateWithWhereUniqueWithoutMessageInput | KnowledgeSourceMessageUpdateWithWhereUniqueWithoutMessageInput[]
    updateMany?: KnowledgeSourceMessageUpdateManyWithWhereWithoutMessageInput | KnowledgeSourceMessageUpdateManyWithWhereWithoutMessageInput[]
    deleteMany?: KnowledgeSourceMessageScalarWhereInput | KnowledgeSourceMessageScalarWhereInput[]
  }

  export type TaskSourceMessageUncheckedUpdateManyWithoutMessageNestedInput = {
    create?: XOR<TaskSourceMessageCreateWithoutMessageInput, TaskSourceMessageUncheckedCreateWithoutMessageInput> | TaskSourceMessageCreateWithoutMessageInput[] | TaskSourceMessageUncheckedCreateWithoutMessageInput[]
    connectOrCreate?: TaskSourceMessageCreateOrConnectWithoutMessageInput | TaskSourceMessageCreateOrConnectWithoutMessageInput[]
    upsert?: TaskSourceMessageUpsertWithWhereUniqueWithoutMessageInput | TaskSourceMessageUpsertWithWhereUniqueWithoutMessageInput[]
    createMany?: TaskSourceMessageCreateManyMessageInputEnvelope
    set?: TaskSourceMessageWhereUniqueInput | TaskSourceMessageWhereUniqueInput[]
    disconnect?: TaskSourceMessageWhereUniqueInput | TaskSourceMessageWhereUniqueInput[]
    delete?: TaskSourceMessageWhereUniqueInput | TaskSourceMessageWhereUniqueInput[]
    connect?: TaskSourceMessageWhereUniqueInput | TaskSourceMessageWhereUniqueInput[]
    update?: TaskSourceMessageUpdateWithWhereUniqueWithoutMessageInput | TaskSourceMessageUpdateWithWhereUniqueWithoutMessageInput[]
    updateMany?: TaskSourceMessageUpdateManyWithWhereWithoutMessageInput | TaskSourceMessageUpdateManyWithWhereWithoutMessageInput[]
    deleteMany?: TaskSourceMessageScalarWhereInput | TaskSourceMessageScalarWhereInput[]
  }

  export type QuerySourceMessageUncheckedUpdateManyWithoutMessageNestedInput = {
    create?: XOR<QuerySourceMessageCreateWithoutMessageInput, QuerySourceMessageUncheckedCreateWithoutMessageInput> | QuerySourceMessageCreateWithoutMessageInput[] | QuerySourceMessageUncheckedCreateWithoutMessageInput[]
    connectOrCreate?: QuerySourceMessageCreateOrConnectWithoutMessageInput | QuerySourceMessageCreateOrConnectWithoutMessageInput[]
    upsert?: QuerySourceMessageUpsertWithWhereUniqueWithoutMessageInput | QuerySourceMessageUpsertWithWhereUniqueWithoutMessageInput[]
    createMany?: QuerySourceMessageCreateManyMessageInputEnvelope
    set?: QuerySourceMessageWhereUniqueInput | QuerySourceMessageWhereUniqueInput[]
    disconnect?: QuerySourceMessageWhereUniqueInput | QuerySourceMessageWhereUniqueInput[]
    delete?: QuerySourceMessageWhereUniqueInput | QuerySourceMessageWhereUniqueInput[]
    connect?: QuerySourceMessageWhereUniqueInput | QuerySourceMessageWhereUniqueInput[]
    update?: QuerySourceMessageUpdateWithWhereUniqueWithoutMessageInput | QuerySourceMessageUpdateWithWhereUniqueWithoutMessageInput[]
    updateMany?: QuerySourceMessageUpdateManyWithWhereWithoutMessageInput | QuerySourceMessageUpdateManyWithWhereWithoutMessageInput[]
    deleteMany?: QuerySourceMessageScalarWhereInput | QuerySourceMessageScalarWhereInput[]
  }

  export type KnowledgeSourceMessageUncheckedUpdateManyWithoutMessageNestedInput = {
    create?: XOR<KnowledgeSourceMessageCreateWithoutMessageInput, KnowledgeSourceMessageUncheckedCreateWithoutMessageInput> | KnowledgeSourceMessageCreateWithoutMessageInput[] | KnowledgeSourceMessageUncheckedCreateWithoutMessageInput[]
    connectOrCreate?: KnowledgeSourceMessageCreateOrConnectWithoutMessageInput | KnowledgeSourceMessageCreateOrConnectWithoutMessageInput[]
    upsert?: KnowledgeSourceMessageUpsertWithWhereUniqueWithoutMessageInput | KnowledgeSourceMessageUpsertWithWhereUniqueWithoutMessageInput[]
    createMany?: KnowledgeSourceMessageCreateManyMessageInputEnvelope
    set?: KnowledgeSourceMessageWhereUniqueInput | KnowledgeSourceMessageWhereUniqueInput[]
    disconnect?: KnowledgeSourceMessageWhereUniqueInput | KnowledgeSourceMessageWhereUniqueInput[]
    delete?: KnowledgeSourceMessageWhereUniqueInput | KnowledgeSourceMessageWhereUniqueInput[]
    connect?: KnowledgeSourceMessageWhereUniqueInput | KnowledgeSourceMessageWhereUniqueInput[]
    update?: KnowledgeSourceMessageUpdateWithWhereUniqueWithoutMessageInput | KnowledgeSourceMessageUpdateWithWhereUniqueWithoutMessageInput[]
    updateMany?: KnowledgeSourceMessageUpdateManyWithWhereWithoutMessageInput | KnowledgeSourceMessageUpdateManyWithWhereWithoutMessageInput[]
    deleteMany?: KnowledgeSourceMessageScalarWhereInput | KnowledgeSourceMessageScalarWhereInput[]
  }

  export type ConversationCreateNestedOneWithoutHistoryInput = {
    create?: XOR<ConversationCreateWithoutHistoryInput, ConversationUncheckedCreateWithoutHistoryInput>
    connectOrCreate?: ConversationCreateOrConnectWithoutHistoryInput
    connect?: ConversationWhereUniqueInput
  }

  export type ConversationUpdateOneRequiredWithoutHistoryNestedInput = {
    create?: XOR<ConversationCreateWithoutHistoryInput, ConversationUncheckedCreateWithoutHistoryInput>
    connectOrCreate?: ConversationCreateOrConnectWithoutHistoryInput
    upsert?: ConversationUpsertWithoutHistoryInput
    connect?: ConversationWhereUniqueInput
    update?: XOR<XOR<ConversationUpdateToOneWithWhereWithoutHistoryInput, ConversationUpdateWithoutHistoryInput>, ConversationUncheckedUpdateWithoutHistoryInput>
  }

  export type ConversationCreateNestedOneWithoutTasksInput = {
    create?: XOR<ConversationCreateWithoutTasksInput, ConversationUncheckedCreateWithoutTasksInput>
    connectOrCreate?: ConversationCreateOrConnectWithoutTasksInput
    connect?: ConversationWhereUniqueInput
  }

  export type ContactCreateNestedOneWithoutTasksInput = {
    create?: XOR<ContactCreateWithoutTasksInput, ContactUncheckedCreateWithoutTasksInput>
    connectOrCreate?: ContactCreateOrConnectWithoutTasksInput
    connect?: ContactWhereUniqueInput
  }

  export type TaskSourceMessageCreateNestedManyWithoutTaskInput = {
    create?: XOR<TaskSourceMessageCreateWithoutTaskInput, TaskSourceMessageUncheckedCreateWithoutTaskInput> | TaskSourceMessageCreateWithoutTaskInput[] | TaskSourceMessageUncheckedCreateWithoutTaskInput[]
    connectOrCreate?: TaskSourceMessageCreateOrConnectWithoutTaskInput | TaskSourceMessageCreateOrConnectWithoutTaskInput[]
    createMany?: TaskSourceMessageCreateManyTaskInputEnvelope
    connect?: TaskSourceMessageWhereUniqueInput | TaskSourceMessageWhereUniqueInput[]
  }

  export type TaskSourceMessageUncheckedCreateNestedManyWithoutTaskInput = {
    create?: XOR<TaskSourceMessageCreateWithoutTaskInput, TaskSourceMessageUncheckedCreateWithoutTaskInput> | TaskSourceMessageCreateWithoutTaskInput[] | TaskSourceMessageUncheckedCreateWithoutTaskInput[]
    connectOrCreate?: TaskSourceMessageCreateOrConnectWithoutTaskInput | TaskSourceMessageCreateOrConnectWithoutTaskInput[]
    createMany?: TaskSourceMessageCreateManyTaskInputEnvelope
    connect?: TaskSourceMessageWhereUniqueInput | TaskSourceMessageWhereUniqueInput[]
  }

  export type FloatFieldUpdateOperationsInput = {
    set?: number
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type ConversationUpdateOneRequiredWithoutTasksNestedInput = {
    create?: XOR<ConversationCreateWithoutTasksInput, ConversationUncheckedCreateWithoutTasksInput>
    connectOrCreate?: ConversationCreateOrConnectWithoutTasksInput
    upsert?: ConversationUpsertWithoutTasksInput
    connect?: ConversationWhereUniqueInput
    update?: XOR<XOR<ConversationUpdateToOneWithWhereWithoutTasksInput, ConversationUpdateWithoutTasksInput>, ConversationUncheckedUpdateWithoutTasksInput>
  }

  export type ContactUpdateOneRequiredWithoutTasksNestedInput = {
    create?: XOR<ContactCreateWithoutTasksInput, ContactUncheckedCreateWithoutTasksInput>
    connectOrCreate?: ContactCreateOrConnectWithoutTasksInput
    upsert?: ContactUpsertWithoutTasksInput
    connect?: ContactWhereUniqueInput
    update?: XOR<XOR<ContactUpdateToOneWithWhereWithoutTasksInput, ContactUpdateWithoutTasksInput>, ContactUncheckedUpdateWithoutTasksInput>
  }

  export type TaskSourceMessageUpdateManyWithoutTaskNestedInput = {
    create?: XOR<TaskSourceMessageCreateWithoutTaskInput, TaskSourceMessageUncheckedCreateWithoutTaskInput> | TaskSourceMessageCreateWithoutTaskInput[] | TaskSourceMessageUncheckedCreateWithoutTaskInput[]
    connectOrCreate?: TaskSourceMessageCreateOrConnectWithoutTaskInput | TaskSourceMessageCreateOrConnectWithoutTaskInput[]
    upsert?: TaskSourceMessageUpsertWithWhereUniqueWithoutTaskInput | TaskSourceMessageUpsertWithWhereUniqueWithoutTaskInput[]
    createMany?: TaskSourceMessageCreateManyTaskInputEnvelope
    set?: TaskSourceMessageWhereUniqueInput | TaskSourceMessageWhereUniqueInput[]
    disconnect?: TaskSourceMessageWhereUniqueInput | TaskSourceMessageWhereUniqueInput[]
    delete?: TaskSourceMessageWhereUniqueInput | TaskSourceMessageWhereUniqueInput[]
    connect?: TaskSourceMessageWhereUniqueInput | TaskSourceMessageWhereUniqueInput[]
    update?: TaskSourceMessageUpdateWithWhereUniqueWithoutTaskInput | TaskSourceMessageUpdateWithWhereUniqueWithoutTaskInput[]
    updateMany?: TaskSourceMessageUpdateManyWithWhereWithoutTaskInput | TaskSourceMessageUpdateManyWithWhereWithoutTaskInput[]
    deleteMany?: TaskSourceMessageScalarWhereInput | TaskSourceMessageScalarWhereInput[]
  }

  export type TaskSourceMessageUncheckedUpdateManyWithoutTaskNestedInput = {
    create?: XOR<TaskSourceMessageCreateWithoutTaskInput, TaskSourceMessageUncheckedCreateWithoutTaskInput> | TaskSourceMessageCreateWithoutTaskInput[] | TaskSourceMessageUncheckedCreateWithoutTaskInput[]
    connectOrCreate?: TaskSourceMessageCreateOrConnectWithoutTaskInput | TaskSourceMessageCreateOrConnectWithoutTaskInput[]
    upsert?: TaskSourceMessageUpsertWithWhereUniqueWithoutTaskInput | TaskSourceMessageUpsertWithWhereUniqueWithoutTaskInput[]
    createMany?: TaskSourceMessageCreateManyTaskInputEnvelope
    set?: TaskSourceMessageWhereUniqueInput | TaskSourceMessageWhereUniqueInput[]
    disconnect?: TaskSourceMessageWhereUniqueInput | TaskSourceMessageWhereUniqueInput[]
    delete?: TaskSourceMessageWhereUniqueInput | TaskSourceMessageWhereUniqueInput[]
    connect?: TaskSourceMessageWhereUniqueInput | TaskSourceMessageWhereUniqueInput[]
    update?: TaskSourceMessageUpdateWithWhereUniqueWithoutTaskInput | TaskSourceMessageUpdateWithWhereUniqueWithoutTaskInput[]
    updateMany?: TaskSourceMessageUpdateManyWithWhereWithoutTaskInput | TaskSourceMessageUpdateManyWithWhereWithoutTaskInput[]
    deleteMany?: TaskSourceMessageScalarWhereInput | TaskSourceMessageScalarWhereInput[]
  }

  export type TaskCreateNestedOneWithoutSourcesInput = {
    create?: XOR<TaskCreateWithoutSourcesInput, TaskUncheckedCreateWithoutSourcesInput>
    connectOrCreate?: TaskCreateOrConnectWithoutSourcesInput
    connect?: TaskWhereUniqueInput
  }

  export type MessageCreateNestedOneWithoutTaskSourcesInput = {
    create?: XOR<MessageCreateWithoutTaskSourcesInput, MessageUncheckedCreateWithoutTaskSourcesInput>
    connectOrCreate?: MessageCreateOrConnectWithoutTaskSourcesInput
    connect?: MessageWhereUniqueInput
  }

  export type TaskUpdateOneRequiredWithoutSourcesNestedInput = {
    create?: XOR<TaskCreateWithoutSourcesInput, TaskUncheckedCreateWithoutSourcesInput>
    connectOrCreate?: TaskCreateOrConnectWithoutSourcesInput
    upsert?: TaskUpsertWithoutSourcesInput
    connect?: TaskWhereUniqueInput
    update?: XOR<XOR<TaskUpdateToOneWithWhereWithoutSourcesInput, TaskUpdateWithoutSourcesInput>, TaskUncheckedUpdateWithoutSourcesInput>
  }

  export type MessageUpdateOneRequiredWithoutTaskSourcesNestedInput = {
    create?: XOR<MessageCreateWithoutTaskSourcesInput, MessageUncheckedCreateWithoutTaskSourcesInput>
    connectOrCreate?: MessageCreateOrConnectWithoutTaskSourcesInput
    upsert?: MessageUpsertWithoutTaskSourcesInput
    connect?: MessageWhereUniqueInput
    update?: XOR<XOR<MessageUpdateToOneWithWhereWithoutTaskSourcesInput, MessageUpdateWithoutTaskSourcesInput>, MessageUncheckedUpdateWithoutTaskSourcesInput>
  }

  export type ConversationCreateNestedOneWithoutQueriesInput = {
    create?: XOR<ConversationCreateWithoutQueriesInput, ConversationUncheckedCreateWithoutQueriesInput>
    connectOrCreate?: ConversationCreateOrConnectWithoutQueriesInput
    connect?: ConversationWhereUniqueInput
  }

  export type ContactCreateNestedOneWithoutQueriesInput = {
    create?: XOR<ContactCreateWithoutQueriesInput, ContactUncheckedCreateWithoutQueriesInput>
    connectOrCreate?: ContactCreateOrConnectWithoutQueriesInput
    connect?: ContactWhereUniqueInput
  }

  export type QuerySourceMessageCreateNestedManyWithoutQueryInput = {
    create?: XOR<QuerySourceMessageCreateWithoutQueryInput, QuerySourceMessageUncheckedCreateWithoutQueryInput> | QuerySourceMessageCreateWithoutQueryInput[] | QuerySourceMessageUncheckedCreateWithoutQueryInput[]
    connectOrCreate?: QuerySourceMessageCreateOrConnectWithoutQueryInput | QuerySourceMessageCreateOrConnectWithoutQueryInput[]
    createMany?: QuerySourceMessageCreateManyQueryInputEnvelope
    connect?: QuerySourceMessageWhereUniqueInput | QuerySourceMessageWhereUniqueInput[]
  }

  export type QuerySourceMessageUncheckedCreateNestedManyWithoutQueryInput = {
    create?: XOR<QuerySourceMessageCreateWithoutQueryInput, QuerySourceMessageUncheckedCreateWithoutQueryInput> | QuerySourceMessageCreateWithoutQueryInput[] | QuerySourceMessageUncheckedCreateWithoutQueryInput[]
    connectOrCreate?: QuerySourceMessageCreateOrConnectWithoutQueryInput | QuerySourceMessageCreateOrConnectWithoutQueryInput[]
    createMany?: QuerySourceMessageCreateManyQueryInputEnvelope
    connect?: QuerySourceMessageWhereUniqueInput | QuerySourceMessageWhereUniqueInput[]
  }

  export type ConversationUpdateOneRequiredWithoutQueriesNestedInput = {
    create?: XOR<ConversationCreateWithoutQueriesInput, ConversationUncheckedCreateWithoutQueriesInput>
    connectOrCreate?: ConversationCreateOrConnectWithoutQueriesInput
    upsert?: ConversationUpsertWithoutQueriesInput
    connect?: ConversationWhereUniqueInput
    update?: XOR<XOR<ConversationUpdateToOneWithWhereWithoutQueriesInput, ConversationUpdateWithoutQueriesInput>, ConversationUncheckedUpdateWithoutQueriesInput>
  }

  export type ContactUpdateOneRequiredWithoutQueriesNestedInput = {
    create?: XOR<ContactCreateWithoutQueriesInput, ContactUncheckedCreateWithoutQueriesInput>
    connectOrCreate?: ContactCreateOrConnectWithoutQueriesInput
    upsert?: ContactUpsertWithoutQueriesInput
    connect?: ContactWhereUniqueInput
    update?: XOR<XOR<ContactUpdateToOneWithWhereWithoutQueriesInput, ContactUpdateWithoutQueriesInput>, ContactUncheckedUpdateWithoutQueriesInput>
  }

  export type QuerySourceMessageUpdateManyWithoutQueryNestedInput = {
    create?: XOR<QuerySourceMessageCreateWithoutQueryInput, QuerySourceMessageUncheckedCreateWithoutQueryInput> | QuerySourceMessageCreateWithoutQueryInput[] | QuerySourceMessageUncheckedCreateWithoutQueryInput[]
    connectOrCreate?: QuerySourceMessageCreateOrConnectWithoutQueryInput | QuerySourceMessageCreateOrConnectWithoutQueryInput[]
    upsert?: QuerySourceMessageUpsertWithWhereUniqueWithoutQueryInput | QuerySourceMessageUpsertWithWhereUniqueWithoutQueryInput[]
    createMany?: QuerySourceMessageCreateManyQueryInputEnvelope
    set?: QuerySourceMessageWhereUniqueInput | QuerySourceMessageWhereUniqueInput[]
    disconnect?: QuerySourceMessageWhereUniqueInput | QuerySourceMessageWhereUniqueInput[]
    delete?: QuerySourceMessageWhereUniqueInput | QuerySourceMessageWhereUniqueInput[]
    connect?: QuerySourceMessageWhereUniqueInput | QuerySourceMessageWhereUniqueInput[]
    update?: QuerySourceMessageUpdateWithWhereUniqueWithoutQueryInput | QuerySourceMessageUpdateWithWhereUniqueWithoutQueryInput[]
    updateMany?: QuerySourceMessageUpdateManyWithWhereWithoutQueryInput | QuerySourceMessageUpdateManyWithWhereWithoutQueryInput[]
    deleteMany?: QuerySourceMessageScalarWhereInput | QuerySourceMessageScalarWhereInput[]
  }

  export type QuerySourceMessageUncheckedUpdateManyWithoutQueryNestedInput = {
    create?: XOR<QuerySourceMessageCreateWithoutQueryInput, QuerySourceMessageUncheckedCreateWithoutQueryInput> | QuerySourceMessageCreateWithoutQueryInput[] | QuerySourceMessageUncheckedCreateWithoutQueryInput[]
    connectOrCreate?: QuerySourceMessageCreateOrConnectWithoutQueryInput | QuerySourceMessageCreateOrConnectWithoutQueryInput[]
    upsert?: QuerySourceMessageUpsertWithWhereUniqueWithoutQueryInput | QuerySourceMessageUpsertWithWhereUniqueWithoutQueryInput[]
    createMany?: QuerySourceMessageCreateManyQueryInputEnvelope
    set?: QuerySourceMessageWhereUniqueInput | QuerySourceMessageWhereUniqueInput[]
    disconnect?: QuerySourceMessageWhereUniqueInput | QuerySourceMessageWhereUniqueInput[]
    delete?: QuerySourceMessageWhereUniqueInput | QuerySourceMessageWhereUniqueInput[]
    connect?: QuerySourceMessageWhereUniqueInput | QuerySourceMessageWhereUniqueInput[]
    update?: QuerySourceMessageUpdateWithWhereUniqueWithoutQueryInput | QuerySourceMessageUpdateWithWhereUniqueWithoutQueryInput[]
    updateMany?: QuerySourceMessageUpdateManyWithWhereWithoutQueryInput | QuerySourceMessageUpdateManyWithWhereWithoutQueryInput[]
    deleteMany?: QuerySourceMessageScalarWhereInput | QuerySourceMessageScalarWhereInput[]
  }

  export type QueryCreateNestedOneWithoutSourcesInput = {
    create?: XOR<QueryCreateWithoutSourcesInput, QueryUncheckedCreateWithoutSourcesInput>
    connectOrCreate?: QueryCreateOrConnectWithoutSourcesInput
    connect?: QueryWhereUniqueInput
  }

  export type MessageCreateNestedOneWithoutQuerySourcesInput = {
    create?: XOR<MessageCreateWithoutQuerySourcesInput, MessageUncheckedCreateWithoutQuerySourcesInput>
    connectOrCreate?: MessageCreateOrConnectWithoutQuerySourcesInput
    connect?: MessageWhereUniqueInput
  }

  export type QueryUpdateOneRequiredWithoutSourcesNestedInput = {
    create?: XOR<QueryCreateWithoutSourcesInput, QueryUncheckedCreateWithoutSourcesInput>
    connectOrCreate?: QueryCreateOrConnectWithoutSourcesInput
    upsert?: QueryUpsertWithoutSourcesInput
    connect?: QueryWhereUniqueInput
    update?: XOR<XOR<QueryUpdateToOneWithWhereWithoutSourcesInput, QueryUpdateWithoutSourcesInput>, QueryUncheckedUpdateWithoutSourcesInput>
  }

  export type MessageUpdateOneRequiredWithoutQuerySourcesNestedInput = {
    create?: XOR<MessageCreateWithoutQuerySourcesInput, MessageUncheckedCreateWithoutQuerySourcesInput>
    connectOrCreate?: MessageCreateOrConnectWithoutQuerySourcesInput
    upsert?: MessageUpsertWithoutQuerySourcesInput
    connect?: MessageWhereUniqueInput
    update?: XOR<XOR<MessageUpdateToOneWithWhereWithoutQuerySourcesInput, MessageUpdateWithoutQuerySourcesInput>, MessageUncheckedUpdateWithoutQuerySourcesInput>
  }

  export type ConversationCreateNestedOneWithoutCallsInput = {
    create?: XOR<ConversationCreateWithoutCallsInput, ConversationUncheckedCreateWithoutCallsInput>
    connectOrCreate?: ConversationCreateOrConnectWithoutCallsInput
    connect?: ConversationWhereUniqueInput
  }

  export type ContactCreateNestedOneWithoutCallsInput = {
    create?: XOR<ContactCreateWithoutCallsInput, ContactUncheckedCreateWithoutCallsInput>
    connectOrCreate?: ContactCreateOrConnectWithoutCallsInput
    connect?: ContactWhereUniqueInput
  }

  export type MessageCreateNestedManyWithoutCallInput = {
    create?: XOR<MessageCreateWithoutCallInput, MessageUncheckedCreateWithoutCallInput> | MessageCreateWithoutCallInput[] | MessageUncheckedCreateWithoutCallInput[]
    connectOrCreate?: MessageCreateOrConnectWithoutCallInput | MessageCreateOrConnectWithoutCallInput[]
    createMany?: MessageCreateManyCallInputEnvelope
    connect?: MessageWhereUniqueInput | MessageWhereUniqueInput[]
  }

  export type MessageUncheckedCreateNestedManyWithoutCallInput = {
    create?: XOR<MessageCreateWithoutCallInput, MessageUncheckedCreateWithoutCallInput> | MessageCreateWithoutCallInput[] | MessageUncheckedCreateWithoutCallInput[]
    connectOrCreate?: MessageCreateOrConnectWithoutCallInput | MessageCreateOrConnectWithoutCallInput[]
    createMany?: MessageCreateManyCallInputEnvelope
    connect?: MessageWhereUniqueInput | MessageWhereUniqueInput[]
  }

  export type NullableIntFieldUpdateOperationsInput = {
    set?: number | null
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type ConversationUpdateOneRequiredWithoutCallsNestedInput = {
    create?: XOR<ConversationCreateWithoutCallsInput, ConversationUncheckedCreateWithoutCallsInput>
    connectOrCreate?: ConversationCreateOrConnectWithoutCallsInput
    upsert?: ConversationUpsertWithoutCallsInput
    connect?: ConversationWhereUniqueInput
    update?: XOR<XOR<ConversationUpdateToOneWithWhereWithoutCallsInput, ConversationUpdateWithoutCallsInput>, ConversationUncheckedUpdateWithoutCallsInput>
  }

  export type ContactUpdateOneRequiredWithoutCallsNestedInput = {
    create?: XOR<ContactCreateWithoutCallsInput, ContactUncheckedCreateWithoutCallsInput>
    connectOrCreate?: ContactCreateOrConnectWithoutCallsInput
    upsert?: ContactUpsertWithoutCallsInput
    connect?: ContactWhereUniqueInput
    update?: XOR<XOR<ContactUpdateToOneWithWhereWithoutCallsInput, ContactUpdateWithoutCallsInput>, ContactUncheckedUpdateWithoutCallsInput>
  }

  export type MessageUpdateManyWithoutCallNestedInput = {
    create?: XOR<MessageCreateWithoutCallInput, MessageUncheckedCreateWithoutCallInput> | MessageCreateWithoutCallInput[] | MessageUncheckedCreateWithoutCallInput[]
    connectOrCreate?: MessageCreateOrConnectWithoutCallInput | MessageCreateOrConnectWithoutCallInput[]
    upsert?: MessageUpsertWithWhereUniqueWithoutCallInput | MessageUpsertWithWhereUniqueWithoutCallInput[]
    createMany?: MessageCreateManyCallInputEnvelope
    set?: MessageWhereUniqueInput | MessageWhereUniqueInput[]
    disconnect?: MessageWhereUniqueInput | MessageWhereUniqueInput[]
    delete?: MessageWhereUniqueInput | MessageWhereUniqueInput[]
    connect?: MessageWhereUniqueInput | MessageWhereUniqueInput[]
    update?: MessageUpdateWithWhereUniqueWithoutCallInput | MessageUpdateWithWhereUniqueWithoutCallInput[]
    updateMany?: MessageUpdateManyWithWhereWithoutCallInput | MessageUpdateManyWithWhereWithoutCallInput[]
    deleteMany?: MessageScalarWhereInput | MessageScalarWhereInput[]
  }

  export type MessageUncheckedUpdateManyWithoutCallNestedInput = {
    create?: XOR<MessageCreateWithoutCallInput, MessageUncheckedCreateWithoutCallInput> | MessageCreateWithoutCallInput[] | MessageUncheckedCreateWithoutCallInput[]
    connectOrCreate?: MessageCreateOrConnectWithoutCallInput | MessageCreateOrConnectWithoutCallInput[]
    upsert?: MessageUpsertWithWhereUniqueWithoutCallInput | MessageUpsertWithWhereUniqueWithoutCallInput[]
    createMany?: MessageCreateManyCallInputEnvelope
    set?: MessageWhereUniqueInput | MessageWhereUniqueInput[]
    disconnect?: MessageWhereUniqueInput | MessageWhereUniqueInput[]
    delete?: MessageWhereUniqueInput | MessageWhereUniqueInput[]
    connect?: MessageWhereUniqueInput | MessageWhereUniqueInput[]
    update?: MessageUpdateWithWhereUniqueWithoutCallInput | MessageUpdateWithWhereUniqueWithoutCallInput[]
    updateMany?: MessageUpdateManyWithWhereWithoutCallInput | MessageUpdateManyWithWhereWithoutCallInput[]
    deleteMany?: MessageScalarWhereInput | MessageScalarWhereInput[]
  }

  export type ConversationCreateNestedOneWithoutEmailsInput = {
    create?: XOR<ConversationCreateWithoutEmailsInput, ConversationUncheckedCreateWithoutEmailsInput>
    connectOrCreate?: ConversationCreateOrConnectWithoutEmailsInput
    connect?: ConversationWhereUniqueInput
  }

  export type ContactCreateNestedOneWithoutEmailsInput = {
    create?: XOR<ContactCreateWithoutEmailsInput, ContactUncheckedCreateWithoutEmailsInput>
    connectOrCreate?: ContactCreateOrConnectWithoutEmailsInput
    connect?: ContactWhereUniqueInput
  }

  export type ConversationUpdateOneRequiredWithoutEmailsNestedInput = {
    create?: XOR<ConversationCreateWithoutEmailsInput, ConversationUncheckedCreateWithoutEmailsInput>
    connectOrCreate?: ConversationCreateOrConnectWithoutEmailsInput
    upsert?: ConversationUpsertWithoutEmailsInput
    connect?: ConversationWhereUniqueInput
    update?: XOR<XOR<ConversationUpdateToOneWithWhereWithoutEmailsInput, ConversationUpdateWithoutEmailsInput>, ConversationUncheckedUpdateWithoutEmailsInput>
  }

  export type ContactUpdateOneRequiredWithoutEmailsNestedInput = {
    create?: XOR<ContactCreateWithoutEmailsInput, ContactUncheckedCreateWithoutEmailsInput>
    connectOrCreate?: ContactCreateOrConnectWithoutEmailsInput
    upsert?: ContactUpsertWithoutEmailsInput
    connect?: ContactWhereUniqueInput
    update?: XOR<XOR<ContactUpdateToOneWithWhereWithoutEmailsInput, ContactUpdateWithoutEmailsInput>, ContactUncheckedUpdateWithoutEmailsInput>
  }

  export type ContactCreateNestedOneWithoutKnowledgeInput = {
    create?: XOR<ContactCreateWithoutKnowledgeInput, ContactUncheckedCreateWithoutKnowledgeInput>
    connectOrCreate?: ContactCreateOrConnectWithoutKnowledgeInput
    connect?: ContactWhereUniqueInput
  }

  export type KnowledgeSourceMessageCreateNestedManyWithoutKnowledgeInput = {
    create?: XOR<KnowledgeSourceMessageCreateWithoutKnowledgeInput, KnowledgeSourceMessageUncheckedCreateWithoutKnowledgeInput> | KnowledgeSourceMessageCreateWithoutKnowledgeInput[] | KnowledgeSourceMessageUncheckedCreateWithoutKnowledgeInput[]
    connectOrCreate?: KnowledgeSourceMessageCreateOrConnectWithoutKnowledgeInput | KnowledgeSourceMessageCreateOrConnectWithoutKnowledgeInput[]
    createMany?: KnowledgeSourceMessageCreateManyKnowledgeInputEnvelope
    connect?: KnowledgeSourceMessageWhereUniqueInput | KnowledgeSourceMessageWhereUniqueInput[]
  }

  export type KnowledgeSourceMessageUncheckedCreateNestedManyWithoutKnowledgeInput = {
    create?: XOR<KnowledgeSourceMessageCreateWithoutKnowledgeInput, KnowledgeSourceMessageUncheckedCreateWithoutKnowledgeInput> | KnowledgeSourceMessageCreateWithoutKnowledgeInput[] | KnowledgeSourceMessageUncheckedCreateWithoutKnowledgeInput[]
    connectOrCreate?: KnowledgeSourceMessageCreateOrConnectWithoutKnowledgeInput | KnowledgeSourceMessageCreateOrConnectWithoutKnowledgeInput[]
    createMany?: KnowledgeSourceMessageCreateManyKnowledgeInputEnvelope
    connect?: KnowledgeSourceMessageWhereUniqueInput | KnowledgeSourceMessageWhereUniqueInput[]
  }

  export type ContactUpdateOneRequiredWithoutKnowledgeNestedInput = {
    create?: XOR<ContactCreateWithoutKnowledgeInput, ContactUncheckedCreateWithoutKnowledgeInput>
    connectOrCreate?: ContactCreateOrConnectWithoutKnowledgeInput
    upsert?: ContactUpsertWithoutKnowledgeInput
    connect?: ContactWhereUniqueInput
    update?: XOR<XOR<ContactUpdateToOneWithWhereWithoutKnowledgeInput, ContactUpdateWithoutKnowledgeInput>, ContactUncheckedUpdateWithoutKnowledgeInput>
  }

  export type KnowledgeSourceMessageUpdateManyWithoutKnowledgeNestedInput = {
    create?: XOR<KnowledgeSourceMessageCreateWithoutKnowledgeInput, KnowledgeSourceMessageUncheckedCreateWithoutKnowledgeInput> | KnowledgeSourceMessageCreateWithoutKnowledgeInput[] | KnowledgeSourceMessageUncheckedCreateWithoutKnowledgeInput[]
    connectOrCreate?: KnowledgeSourceMessageCreateOrConnectWithoutKnowledgeInput | KnowledgeSourceMessageCreateOrConnectWithoutKnowledgeInput[]
    upsert?: KnowledgeSourceMessageUpsertWithWhereUniqueWithoutKnowledgeInput | KnowledgeSourceMessageUpsertWithWhereUniqueWithoutKnowledgeInput[]
    createMany?: KnowledgeSourceMessageCreateManyKnowledgeInputEnvelope
    set?: KnowledgeSourceMessageWhereUniqueInput | KnowledgeSourceMessageWhereUniqueInput[]
    disconnect?: KnowledgeSourceMessageWhereUniqueInput | KnowledgeSourceMessageWhereUniqueInput[]
    delete?: KnowledgeSourceMessageWhereUniqueInput | KnowledgeSourceMessageWhereUniqueInput[]
    connect?: KnowledgeSourceMessageWhereUniqueInput | KnowledgeSourceMessageWhereUniqueInput[]
    update?: KnowledgeSourceMessageUpdateWithWhereUniqueWithoutKnowledgeInput | KnowledgeSourceMessageUpdateWithWhereUniqueWithoutKnowledgeInput[]
    updateMany?: KnowledgeSourceMessageUpdateManyWithWhereWithoutKnowledgeInput | KnowledgeSourceMessageUpdateManyWithWhereWithoutKnowledgeInput[]
    deleteMany?: KnowledgeSourceMessageScalarWhereInput | KnowledgeSourceMessageScalarWhereInput[]
  }

  export type KnowledgeSourceMessageUncheckedUpdateManyWithoutKnowledgeNestedInput = {
    create?: XOR<KnowledgeSourceMessageCreateWithoutKnowledgeInput, KnowledgeSourceMessageUncheckedCreateWithoutKnowledgeInput> | KnowledgeSourceMessageCreateWithoutKnowledgeInput[] | KnowledgeSourceMessageUncheckedCreateWithoutKnowledgeInput[]
    connectOrCreate?: KnowledgeSourceMessageCreateOrConnectWithoutKnowledgeInput | KnowledgeSourceMessageCreateOrConnectWithoutKnowledgeInput[]
    upsert?: KnowledgeSourceMessageUpsertWithWhereUniqueWithoutKnowledgeInput | KnowledgeSourceMessageUpsertWithWhereUniqueWithoutKnowledgeInput[]
    createMany?: KnowledgeSourceMessageCreateManyKnowledgeInputEnvelope
    set?: KnowledgeSourceMessageWhereUniqueInput | KnowledgeSourceMessageWhereUniqueInput[]
    disconnect?: KnowledgeSourceMessageWhereUniqueInput | KnowledgeSourceMessageWhereUniqueInput[]
    delete?: KnowledgeSourceMessageWhereUniqueInput | KnowledgeSourceMessageWhereUniqueInput[]
    connect?: KnowledgeSourceMessageWhereUniqueInput | KnowledgeSourceMessageWhereUniqueInput[]
    update?: KnowledgeSourceMessageUpdateWithWhereUniqueWithoutKnowledgeInput | KnowledgeSourceMessageUpdateWithWhereUniqueWithoutKnowledgeInput[]
    updateMany?: KnowledgeSourceMessageUpdateManyWithWhereWithoutKnowledgeInput | KnowledgeSourceMessageUpdateManyWithWhereWithoutKnowledgeInput[]
    deleteMany?: KnowledgeSourceMessageScalarWhereInput | KnowledgeSourceMessageScalarWhereInput[]
  }

  export type ContactKnowledgeCreateNestedOneWithoutSourcesInput = {
    create?: XOR<ContactKnowledgeCreateWithoutSourcesInput, ContactKnowledgeUncheckedCreateWithoutSourcesInput>
    connectOrCreate?: ContactKnowledgeCreateOrConnectWithoutSourcesInput
    connect?: ContactKnowledgeWhereUniqueInput
  }

  export type MessageCreateNestedOneWithoutKnowledgeSourcesInput = {
    create?: XOR<MessageCreateWithoutKnowledgeSourcesInput, MessageUncheckedCreateWithoutKnowledgeSourcesInput>
    connectOrCreate?: MessageCreateOrConnectWithoutKnowledgeSourcesInput
    connect?: MessageWhereUniqueInput
  }

  export type ContactKnowledgeUpdateOneRequiredWithoutSourcesNestedInput = {
    create?: XOR<ContactKnowledgeCreateWithoutSourcesInput, ContactKnowledgeUncheckedCreateWithoutSourcesInput>
    connectOrCreate?: ContactKnowledgeCreateOrConnectWithoutSourcesInput
    upsert?: ContactKnowledgeUpsertWithoutSourcesInput
    connect?: ContactKnowledgeWhereUniqueInput
    update?: XOR<XOR<ContactKnowledgeUpdateToOneWithWhereWithoutSourcesInput, ContactKnowledgeUpdateWithoutSourcesInput>, ContactKnowledgeUncheckedUpdateWithoutSourcesInput>
  }

  export type MessageUpdateOneRequiredWithoutKnowledgeSourcesNestedInput = {
    create?: XOR<MessageCreateWithoutKnowledgeSourcesInput, MessageUncheckedCreateWithoutKnowledgeSourcesInput>
    connectOrCreate?: MessageCreateOrConnectWithoutKnowledgeSourcesInput
    upsert?: MessageUpsertWithoutKnowledgeSourcesInput
    connect?: MessageWhereUniqueInput
    update?: XOR<XOR<MessageUpdateToOneWithWhereWithoutKnowledgeSourcesInput, MessageUpdateWithoutKnowledgeSourcesInput>, MessageUncheckedUpdateWithoutKnowledgeSourcesInput>
  }

  export type NestedStringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type NestedStringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type NestedBoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type NestedDateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type NestedStringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type NestedIntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type NestedStringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type NestedIntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }

  export type NestedBoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type NestedDateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type NestedDateTimeNullableFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableFilter<$PrismaModel> | Date | string | null
  }

  export type NestedDateTimeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableWithAggregatesFilter<$PrismaModel> | Date | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedDateTimeNullableFilter<$PrismaModel>
    _max?: NestedDateTimeNullableFilter<$PrismaModel>
  }

  export type NestedFloatFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[] | ListFloatFieldRefInput<$PrismaModel>
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel>
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatFilter<$PrismaModel> | number
  }

  export type NestedFloatWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[] | ListFloatFieldRefInput<$PrismaModel>
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel>
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedFloatFilter<$PrismaModel>
    _min?: NestedFloatFilter<$PrismaModel>
    _max?: NestedFloatFilter<$PrismaModel>
  }

  export type NestedIntNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableWithAggregatesFilter<$PrismaModel> | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedIntNullableFilter<$PrismaModel>
    _max?: NestedIntNullableFilter<$PrismaModel>
  }

  export type NestedFloatNullableFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel> | null
    in?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatNullableFilter<$PrismaModel> | number | null
  }

  export type ConversationCreateWithoutContactInput = {
    id?: string
    title?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    lastExtractedMessageId?: string | null
    lastExtractedAt?: Date | string | null
    messages?: MessageCreateNestedManyWithoutConversationInput
    history?: HistoryCreateNestedManyWithoutConversationInput
    tasks?: TaskCreateNestedManyWithoutConversationInput
    queries?: QueryCreateNestedManyWithoutConversationInput
    calls?: CallCreateNestedManyWithoutConversationInput
    emails?: EmailCreateNestedManyWithoutConversationInput
  }

  export type ConversationUncheckedCreateWithoutContactInput = {
    id?: string
    title?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    lastExtractedMessageId?: string | null
    lastExtractedAt?: Date | string | null
    messages?: MessageUncheckedCreateNestedManyWithoutConversationInput
    history?: HistoryUncheckedCreateNestedManyWithoutConversationInput
    tasks?: TaskUncheckedCreateNestedManyWithoutConversationInput
    queries?: QueryUncheckedCreateNestedManyWithoutConversationInput
    calls?: CallUncheckedCreateNestedManyWithoutConversationInput
    emails?: EmailUncheckedCreateNestedManyWithoutConversationInput
  }

  export type ConversationCreateOrConnectWithoutContactInput = {
    where: ConversationWhereUniqueInput
    create: XOR<ConversationCreateWithoutContactInput, ConversationUncheckedCreateWithoutContactInput>
  }

  export type ConversationCreateManyContactInputEnvelope = {
    data: ConversationCreateManyContactInput | ConversationCreateManyContactInput[]
    skipDuplicates?: boolean
  }

  export type TaskCreateWithoutContactInput = {
    id?: string
    title: string
    description?: string | null
    status?: string
    priority?: string
    dueDate?: Date | string | null
    confidence?: number
    source?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    completedAt?: Date | string | null
    conversation: ConversationCreateNestedOneWithoutTasksInput
    sources?: TaskSourceMessageCreateNestedManyWithoutTaskInput
  }

  export type TaskUncheckedCreateWithoutContactInput = {
    id?: string
    title: string
    description?: string | null
    status?: string
    priority?: string
    dueDate?: Date | string | null
    confidence?: number
    source?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    completedAt?: Date | string | null
    conversationId: string
    sources?: TaskSourceMessageUncheckedCreateNestedManyWithoutTaskInput
  }

  export type TaskCreateOrConnectWithoutContactInput = {
    where: TaskWhereUniqueInput
    create: XOR<TaskCreateWithoutContactInput, TaskUncheckedCreateWithoutContactInput>
  }

  export type TaskCreateManyContactInputEnvelope = {
    data: TaskCreateManyContactInput | TaskCreateManyContactInput[]
    skipDuplicates?: boolean
  }

  export type QueryCreateWithoutContactInput = {
    id?: string
    question: string
    answer?: string | null
    status?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    answeredAt?: Date | string | null
    answerMessageId?: string | null
    conversation: ConversationCreateNestedOneWithoutQueriesInput
    sources?: QuerySourceMessageCreateNestedManyWithoutQueryInput
  }

  export type QueryUncheckedCreateWithoutContactInput = {
    id?: string
    question: string
    answer?: string | null
    status?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    answeredAt?: Date | string | null
    answerMessageId?: string | null
    conversationId: string
    sources?: QuerySourceMessageUncheckedCreateNestedManyWithoutQueryInput
  }

  export type QueryCreateOrConnectWithoutContactInput = {
    where: QueryWhereUniqueInput
    create: XOR<QueryCreateWithoutContactInput, QueryUncheckedCreateWithoutContactInput>
  }

  export type QueryCreateManyContactInputEnvelope = {
    data: QueryCreateManyContactInput | QueryCreateManyContactInput[]
    skipDuplicates?: boolean
  }

  export type ContactKnowledgeCreateWithoutContactInput = {
    id?: string
    category: string
    key: string
    value: string
    confidence?: number
    status?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    sources?: KnowledgeSourceMessageCreateNestedManyWithoutKnowledgeInput
  }

  export type ContactKnowledgeUncheckedCreateWithoutContactInput = {
    id?: string
    category: string
    key: string
    value: string
    confidence?: number
    status?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    sources?: KnowledgeSourceMessageUncheckedCreateNestedManyWithoutKnowledgeInput
  }

  export type ContactKnowledgeCreateOrConnectWithoutContactInput = {
    where: ContactKnowledgeWhereUniqueInput
    create: XOR<ContactKnowledgeCreateWithoutContactInput, ContactKnowledgeUncheckedCreateWithoutContactInput>
  }

  export type ContactKnowledgeCreateManyContactInputEnvelope = {
    data: ContactKnowledgeCreateManyContactInput | ContactKnowledgeCreateManyContactInput[]
    skipDuplicates?: boolean
  }

  export type CallCreateWithoutContactInput = {
    id?: string
    twilioSid?: string | null
    status?: string
    direction?: string
    duration?: number | null
    startedAt?: Date | string | null
    endedAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    conversation: ConversationCreateNestedOneWithoutCallsInput
    messages?: MessageCreateNestedManyWithoutCallInput
  }

  export type CallUncheckedCreateWithoutContactInput = {
    id?: string
    twilioSid?: string | null
    status?: string
    direction?: string
    duration?: number | null
    startedAt?: Date | string | null
    endedAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    conversationId: string
    messages?: MessageUncheckedCreateNestedManyWithoutCallInput
  }

  export type CallCreateOrConnectWithoutContactInput = {
    where: CallWhereUniqueInput
    create: XOR<CallCreateWithoutContactInput, CallUncheckedCreateWithoutContactInput>
  }

  export type CallCreateManyContactInputEnvelope = {
    data: CallCreateManyContactInput | CallCreateManyContactInput[]
    skipDuplicates?: boolean
  }

  export type EmailCreateWithoutContactInput = {
    id?: string
    twilioSid?: string | null
    status?: string
    direction?: string
    subject: string
    from: string
    to: string
    body?: string | null
    html?: string | null
    sentAt?: Date | string | null
    deliveredAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    conversation: ConversationCreateNestedOneWithoutEmailsInput
  }

  export type EmailUncheckedCreateWithoutContactInput = {
    id?: string
    twilioSid?: string | null
    status?: string
    direction?: string
    subject: string
    from: string
    to: string
    body?: string | null
    html?: string | null
    sentAt?: Date | string | null
    deliveredAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    conversationId: string
  }

  export type EmailCreateOrConnectWithoutContactInput = {
    where: EmailWhereUniqueInput
    create: XOR<EmailCreateWithoutContactInput, EmailUncheckedCreateWithoutContactInput>
  }

  export type EmailCreateManyContactInputEnvelope = {
    data: EmailCreateManyContactInput | EmailCreateManyContactInput[]
    skipDuplicates?: boolean
  }

  export type ConversationUpsertWithWhereUniqueWithoutContactInput = {
    where: ConversationWhereUniqueInput
    update: XOR<ConversationUpdateWithoutContactInput, ConversationUncheckedUpdateWithoutContactInput>
    create: XOR<ConversationCreateWithoutContactInput, ConversationUncheckedCreateWithoutContactInput>
  }

  export type ConversationUpdateWithWhereUniqueWithoutContactInput = {
    where: ConversationWhereUniqueInput
    data: XOR<ConversationUpdateWithoutContactInput, ConversationUncheckedUpdateWithoutContactInput>
  }

  export type ConversationUpdateManyWithWhereWithoutContactInput = {
    where: ConversationScalarWhereInput
    data: XOR<ConversationUpdateManyMutationInput, ConversationUncheckedUpdateManyWithoutContactInput>
  }

  export type ConversationScalarWhereInput = {
    AND?: ConversationScalarWhereInput | ConversationScalarWhereInput[]
    OR?: ConversationScalarWhereInput[]
    NOT?: ConversationScalarWhereInput | ConversationScalarWhereInput[]
    id?: StringFilter<"Conversation"> | string
    title?: StringNullableFilter<"Conversation"> | string | null
    createdAt?: DateTimeFilter<"Conversation"> | Date | string
    updatedAt?: DateTimeFilter<"Conversation"> | Date | string
    lastExtractedMessageId?: StringNullableFilter<"Conversation"> | string | null
    lastExtractedAt?: DateTimeNullableFilter<"Conversation"> | Date | string | null
    contactId?: StringFilter<"Conversation"> | string
  }

  export type TaskUpsertWithWhereUniqueWithoutContactInput = {
    where: TaskWhereUniqueInput
    update: XOR<TaskUpdateWithoutContactInput, TaskUncheckedUpdateWithoutContactInput>
    create: XOR<TaskCreateWithoutContactInput, TaskUncheckedCreateWithoutContactInput>
  }

  export type TaskUpdateWithWhereUniqueWithoutContactInput = {
    where: TaskWhereUniqueInput
    data: XOR<TaskUpdateWithoutContactInput, TaskUncheckedUpdateWithoutContactInput>
  }

  export type TaskUpdateManyWithWhereWithoutContactInput = {
    where: TaskScalarWhereInput
    data: XOR<TaskUpdateManyMutationInput, TaskUncheckedUpdateManyWithoutContactInput>
  }

  export type TaskScalarWhereInput = {
    AND?: TaskScalarWhereInput | TaskScalarWhereInput[]
    OR?: TaskScalarWhereInput[]
    NOT?: TaskScalarWhereInput | TaskScalarWhereInput[]
    id?: StringFilter<"Task"> | string
    title?: StringFilter<"Task"> | string
    description?: StringNullableFilter<"Task"> | string | null
    status?: StringFilter<"Task"> | string
    priority?: StringFilter<"Task"> | string
    dueDate?: DateTimeNullableFilter<"Task"> | Date | string | null
    confidence?: FloatFilter<"Task"> | number
    source?: StringFilter<"Task"> | string
    createdAt?: DateTimeFilter<"Task"> | Date | string
    updatedAt?: DateTimeFilter<"Task"> | Date | string
    completedAt?: DateTimeNullableFilter<"Task"> | Date | string | null
    conversationId?: StringFilter<"Task"> | string
    contactId?: StringFilter<"Task"> | string
  }

  export type QueryUpsertWithWhereUniqueWithoutContactInput = {
    where: QueryWhereUniqueInput
    update: XOR<QueryUpdateWithoutContactInput, QueryUncheckedUpdateWithoutContactInput>
    create: XOR<QueryCreateWithoutContactInput, QueryUncheckedCreateWithoutContactInput>
  }

  export type QueryUpdateWithWhereUniqueWithoutContactInput = {
    where: QueryWhereUniqueInput
    data: XOR<QueryUpdateWithoutContactInput, QueryUncheckedUpdateWithoutContactInput>
  }

  export type QueryUpdateManyWithWhereWithoutContactInput = {
    where: QueryScalarWhereInput
    data: XOR<QueryUpdateManyMutationInput, QueryUncheckedUpdateManyWithoutContactInput>
  }

  export type QueryScalarWhereInput = {
    AND?: QueryScalarWhereInput | QueryScalarWhereInput[]
    OR?: QueryScalarWhereInput[]
    NOT?: QueryScalarWhereInput | QueryScalarWhereInput[]
    id?: StringFilter<"Query"> | string
    question?: StringFilter<"Query"> | string
    answer?: StringNullableFilter<"Query"> | string | null
    status?: StringFilter<"Query"> | string
    createdAt?: DateTimeFilter<"Query"> | Date | string
    updatedAt?: DateTimeFilter<"Query"> | Date | string
    answeredAt?: DateTimeNullableFilter<"Query"> | Date | string | null
    answerMessageId?: StringNullableFilter<"Query"> | string | null
    conversationId?: StringFilter<"Query"> | string
    contactId?: StringFilter<"Query"> | string
  }

  export type ContactKnowledgeUpsertWithWhereUniqueWithoutContactInput = {
    where: ContactKnowledgeWhereUniqueInput
    update: XOR<ContactKnowledgeUpdateWithoutContactInput, ContactKnowledgeUncheckedUpdateWithoutContactInput>
    create: XOR<ContactKnowledgeCreateWithoutContactInput, ContactKnowledgeUncheckedCreateWithoutContactInput>
  }

  export type ContactKnowledgeUpdateWithWhereUniqueWithoutContactInput = {
    where: ContactKnowledgeWhereUniqueInput
    data: XOR<ContactKnowledgeUpdateWithoutContactInput, ContactKnowledgeUncheckedUpdateWithoutContactInput>
  }

  export type ContactKnowledgeUpdateManyWithWhereWithoutContactInput = {
    where: ContactKnowledgeScalarWhereInput
    data: XOR<ContactKnowledgeUpdateManyMutationInput, ContactKnowledgeUncheckedUpdateManyWithoutContactInput>
  }

  export type ContactKnowledgeScalarWhereInput = {
    AND?: ContactKnowledgeScalarWhereInput | ContactKnowledgeScalarWhereInput[]
    OR?: ContactKnowledgeScalarWhereInput[]
    NOT?: ContactKnowledgeScalarWhereInput | ContactKnowledgeScalarWhereInput[]
    id?: StringFilter<"ContactKnowledge"> | string
    contactId?: StringFilter<"ContactKnowledge"> | string
    category?: StringFilter<"ContactKnowledge"> | string
    key?: StringFilter<"ContactKnowledge"> | string
    value?: StringFilter<"ContactKnowledge"> | string
    confidence?: FloatFilter<"ContactKnowledge"> | number
    status?: StringFilter<"ContactKnowledge"> | string
    createdAt?: DateTimeFilter<"ContactKnowledge"> | Date | string
    updatedAt?: DateTimeFilter<"ContactKnowledge"> | Date | string
  }

  export type CallUpsertWithWhereUniqueWithoutContactInput = {
    where: CallWhereUniqueInput
    update: XOR<CallUpdateWithoutContactInput, CallUncheckedUpdateWithoutContactInput>
    create: XOR<CallCreateWithoutContactInput, CallUncheckedCreateWithoutContactInput>
  }

  export type CallUpdateWithWhereUniqueWithoutContactInput = {
    where: CallWhereUniqueInput
    data: XOR<CallUpdateWithoutContactInput, CallUncheckedUpdateWithoutContactInput>
  }

  export type CallUpdateManyWithWhereWithoutContactInput = {
    where: CallScalarWhereInput
    data: XOR<CallUpdateManyMutationInput, CallUncheckedUpdateManyWithoutContactInput>
  }

  export type CallScalarWhereInput = {
    AND?: CallScalarWhereInput | CallScalarWhereInput[]
    OR?: CallScalarWhereInput[]
    NOT?: CallScalarWhereInput | CallScalarWhereInput[]
    id?: StringFilter<"Call"> | string
    twilioSid?: StringNullableFilter<"Call"> | string | null
    status?: StringFilter<"Call"> | string
    direction?: StringFilter<"Call"> | string
    duration?: IntNullableFilter<"Call"> | number | null
    startedAt?: DateTimeNullableFilter<"Call"> | Date | string | null
    endedAt?: DateTimeNullableFilter<"Call"> | Date | string | null
    createdAt?: DateTimeFilter<"Call"> | Date | string
    updatedAt?: DateTimeFilter<"Call"> | Date | string
    conversationId?: StringFilter<"Call"> | string
    contactId?: StringFilter<"Call"> | string
  }

  export type EmailUpsertWithWhereUniqueWithoutContactInput = {
    where: EmailWhereUniqueInput
    update: XOR<EmailUpdateWithoutContactInput, EmailUncheckedUpdateWithoutContactInput>
    create: XOR<EmailCreateWithoutContactInput, EmailUncheckedCreateWithoutContactInput>
  }

  export type EmailUpdateWithWhereUniqueWithoutContactInput = {
    where: EmailWhereUniqueInput
    data: XOR<EmailUpdateWithoutContactInput, EmailUncheckedUpdateWithoutContactInput>
  }

  export type EmailUpdateManyWithWhereWithoutContactInput = {
    where: EmailScalarWhereInput
    data: XOR<EmailUpdateManyMutationInput, EmailUncheckedUpdateManyWithoutContactInput>
  }

  export type EmailScalarWhereInput = {
    AND?: EmailScalarWhereInput | EmailScalarWhereInput[]
    OR?: EmailScalarWhereInput[]
    NOT?: EmailScalarWhereInput | EmailScalarWhereInput[]
    id?: StringFilter<"Email"> | string
    twilioSid?: StringNullableFilter<"Email"> | string | null
    status?: StringFilter<"Email"> | string
    direction?: StringFilter<"Email"> | string
    subject?: StringFilter<"Email"> | string
    from?: StringFilter<"Email"> | string
    to?: StringFilter<"Email"> | string
    body?: StringNullableFilter<"Email"> | string | null
    html?: StringNullableFilter<"Email"> | string | null
    sentAt?: DateTimeNullableFilter<"Email"> | Date | string | null
    deliveredAt?: DateTimeNullableFilter<"Email"> | Date | string | null
    createdAt?: DateTimeFilter<"Email"> | Date | string
    updatedAt?: DateTimeFilter<"Email"> | Date | string
    conversationId?: StringFilter<"Email"> | string
    contactId?: StringFilter<"Email"> | string
  }

  export type MessageCreateWithoutConversationInput = {
    id?: string
    role: string
    content: string
    time: string
    pending?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    call?: CallCreateNestedOneWithoutMessagesInput
    taskSources?: TaskSourceMessageCreateNestedManyWithoutMessageInput
    querySources?: QuerySourceMessageCreateNestedManyWithoutMessageInput
    knowledgeSources?: KnowledgeSourceMessageCreateNestedManyWithoutMessageInput
  }

  export type MessageUncheckedCreateWithoutConversationInput = {
    id?: string
    role: string
    content: string
    time: string
    pending?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    callId?: string | null
    taskSources?: TaskSourceMessageUncheckedCreateNestedManyWithoutMessageInput
    querySources?: QuerySourceMessageUncheckedCreateNestedManyWithoutMessageInput
    knowledgeSources?: KnowledgeSourceMessageUncheckedCreateNestedManyWithoutMessageInput
  }

  export type MessageCreateOrConnectWithoutConversationInput = {
    where: MessageWhereUniqueInput
    create: XOR<MessageCreateWithoutConversationInput, MessageUncheckedCreateWithoutConversationInput>
  }

  export type MessageCreateManyConversationInputEnvelope = {
    data: MessageCreateManyConversationInput | MessageCreateManyConversationInput[]
    skipDuplicates?: boolean
  }

  export type HistoryCreateWithoutConversationInput = {
    id?: string
    title: string
    detail: string
    status: string
    time: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type HistoryUncheckedCreateWithoutConversationInput = {
    id?: string
    title: string
    detail: string
    status: string
    time: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type HistoryCreateOrConnectWithoutConversationInput = {
    where: HistoryWhereUniqueInput
    create: XOR<HistoryCreateWithoutConversationInput, HistoryUncheckedCreateWithoutConversationInput>
  }

  export type HistoryCreateManyConversationInputEnvelope = {
    data: HistoryCreateManyConversationInput | HistoryCreateManyConversationInput[]
    skipDuplicates?: boolean
  }

  export type TaskCreateWithoutConversationInput = {
    id?: string
    title: string
    description?: string | null
    status?: string
    priority?: string
    dueDate?: Date | string | null
    confidence?: number
    source?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    completedAt?: Date | string | null
    contact: ContactCreateNestedOneWithoutTasksInput
    sources?: TaskSourceMessageCreateNestedManyWithoutTaskInput
  }

  export type TaskUncheckedCreateWithoutConversationInput = {
    id?: string
    title: string
    description?: string | null
    status?: string
    priority?: string
    dueDate?: Date | string | null
    confidence?: number
    source?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    completedAt?: Date | string | null
    contactId: string
    sources?: TaskSourceMessageUncheckedCreateNestedManyWithoutTaskInput
  }

  export type TaskCreateOrConnectWithoutConversationInput = {
    where: TaskWhereUniqueInput
    create: XOR<TaskCreateWithoutConversationInput, TaskUncheckedCreateWithoutConversationInput>
  }

  export type TaskCreateManyConversationInputEnvelope = {
    data: TaskCreateManyConversationInput | TaskCreateManyConversationInput[]
    skipDuplicates?: boolean
  }

  export type ContactCreateWithoutConversationsInput = {
    id?: string
    name: string
    business: string
    category: string
    phone: string
    email?: string | null
    initials: string
    color: string
    note?: string | null
    online?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    tasks?: TaskCreateNestedManyWithoutContactInput
    queries?: QueryCreateNestedManyWithoutContactInput
    knowledge?: ContactKnowledgeCreateNestedManyWithoutContactInput
    calls?: CallCreateNestedManyWithoutContactInput
    emails?: EmailCreateNestedManyWithoutContactInput
  }

  export type ContactUncheckedCreateWithoutConversationsInput = {
    id?: string
    name: string
    business: string
    category: string
    phone: string
    email?: string | null
    initials: string
    color: string
    note?: string | null
    online?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    tasks?: TaskUncheckedCreateNestedManyWithoutContactInput
    queries?: QueryUncheckedCreateNestedManyWithoutContactInput
    knowledge?: ContactKnowledgeUncheckedCreateNestedManyWithoutContactInput
    calls?: CallUncheckedCreateNestedManyWithoutContactInput
    emails?: EmailUncheckedCreateNestedManyWithoutContactInput
  }

  export type ContactCreateOrConnectWithoutConversationsInput = {
    where: ContactWhereUniqueInput
    create: XOR<ContactCreateWithoutConversationsInput, ContactUncheckedCreateWithoutConversationsInput>
  }

  export type QueryCreateWithoutConversationInput = {
    id?: string
    question: string
    answer?: string | null
    status?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    answeredAt?: Date | string | null
    answerMessageId?: string | null
    contact: ContactCreateNestedOneWithoutQueriesInput
    sources?: QuerySourceMessageCreateNestedManyWithoutQueryInput
  }

  export type QueryUncheckedCreateWithoutConversationInput = {
    id?: string
    question: string
    answer?: string | null
    status?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    answeredAt?: Date | string | null
    answerMessageId?: string | null
    contactId: string
    sources?: QuerySourceMessageUncheckedCreateNestedManyWithoutQueryInput
  }

  export type QueryCreateOrConnectWithoutConversationInput = {
    where: QueryWhereUniqueInput
    create: XOR<QueryCreateWithoutConversationInput, QueryUncheckedCreateWithoutConversationInput>
  }

  export type QueryCreateManyConversationInputEnvelope = {
    data: QueryCreateManyConversationInput | QueryCreateManyConversationInput[]
    skipDuplicates?: boolean
  }

  export type CallCreateWithoutConversationInput = {
    id?: string
    twilioSid?: string | null
    status?: string
    direction?: string
    duration?: number | null
    startedAt?: Date | string | null
    endedAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    contact: ContactCreateNestedOneWithoutCallsInput
    messages?: MessageCreateNestedManyWithoutCallInput
  }

  export type CallUncheckedCreateWithoutConversationInput = {
    id?: string
    twilioSid?: string | null
    status?: string
    direction?: string
    duration?: number | null
    startedAt?: Date | string | null
    endedAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    contactId: string
    messages?: MessageUncheckedCreateNestedManyWithoutCallInput
  }

  export type CallCreateOrConnectWithoutConversationInput = {
    where: CallWhereUniqueInput
    create: XOR<CallCreateWithoutConversationInput, CallUncheckedCreateWithoutConversationInput>
  }

  export type CallCreateManyConversationInputEnvelope = {
    data: CallCreateManyConversationInput | CallCreateManyConversationInput[]
    skipDuplicates?: boolean
  }

  export type EmailCreateWithoutConversationInput = {
    id?: string
    twilioSid?: string | null
    status?: string
    direction?: string
    subject: string
    from: string
    to: string
    body?: string | null
    html?: string | null
    sentAt?: Date | string | null
    deliveredAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    contact: ContactCreateNestedOneWithoutEmailsInput
  }

  export type EmailUncheckedCreateWithoutConversationInput = {
    id?: string
    twilioSid?: string | null
    status?: string
    direction?: string
    subject: string
    from: string
    to: string
    body?: string | null
    html?: string | null
    sentAt?: Date | string | null
    deliveredAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    contactId: string
  }

  export type EmailCreateOrConnectWithoutConversationInput = {
    where: EmailWhereUniqueInput
    create: XOR<EmailCreateWithoutConversationInput, EmailUncheckedCreateWithoutConversationInput>
  }

  export type EmailCreateManyConversationInputEnvelope = {
    data: EmailCreateManyConversationInput | EmailCreateManyConversationInput[]
    skipDuplicates?: boolean
  }

  export type MessageUpsertWithWhereUniqueWithoutConversationInput = {
    where: MessageWhereUniqueInput
    update: XOR<MessageUpdateWithoutConversationInput, MessageUncheckedUpdateWithoutConversationInput>
    create: XOR<MessageCreateWithoutConversationInput, MessageUncheckedCreateWithoutConversationInput>
  }

  export type MessageUpdateWithWhereUniqueWithoutConversationInput = {
    where: MessageWhereUniqueInput
    data: XOR<MessageUpdateWithoutConversationInput, MessageUncheckedUpdateWithoutConversationInput>
  }

  export type MessageUpdateManyWithWhereWithoutConversationInput = {
    where: MessageScalarWhereInput
    data: XOR<MessageUpdateManyMutationInput, MessageUncheckedUpdateManyWithoutConversationInput>
  }

  export type MessageScalarWhereInput = {
    AND?: MessageScalarWhereInput | MessageScalarWhereInput[]
    OR?: MessageScalarWhereInput[]
    NOT?: MessageScalarWhereInput | MessageScalarWhereInput[]
    id?: StringFilter<"Message"> | string
    role?: StringFilter<"Message"> | string
    content?: StringFilter<"Message"> | string
    time?: StringFilter<"Message"> | string
    pending?: BoolFilter<"Message"> | boolean
    createdAt?: DateTimeFilter<"Message"> | Date | string
    updatedAt?: DateTimeFilter<"Message"> | Date | string
    conversationId?: StringFilter<"Message"> | string
    callId?: StringNullableFilter<"Message"> | string | null
  }

  export type HistoryUpsertWithWhereUniqueWithoutConversationInput = {
    where: HistoryWhereUniqueInput
    update: XOR<HistoryUpdateWithoutConversationInput, HistoryUncheckedUpdateWithoutConversationInput>
    create: XOR<HistoryCreateWithoutConversationInput, HistoryUncheckedCreateWithoutConversationInput>
  }

  export type HistoryUpdateWithWhereUniqueWithoutConversationInput = {
    where: HistoryWhereUniqueInput
    data: XOR<HistoryUpdateWithoutConversationInput, HistoryUncheckedUpdateWithoutConversationInput>
  }

  export type HistoryUpdateManyWithWhereWithoutConversationInput = {
    where: HistoryScalarWhereInput
    data: XOR<HistoryUpdateManyMutationInput, HistoryUncheckedUpdateManyWithoutConversationInput>
  }

  export type HistoryScalarWhereInput = {
    AND?: HistoryScalarWhereInput | HistoryScalarWhereInput[]
    OR?: HistoryScalarWhereInput[]
    NOT?: HistoryScalarWhereInput | HistoryScalarWhereInput[]
    id?: StringFilter<"History"> | string
    title?: StringFilter<"History"> | string
    detail?: StringFilter<"History"> | string
    status?: StringFilter<"History"> | string
    time?: StringFilter<"History"> | string
    createdAt?: DateTimeFilter<"History"> | Date | string
    updatedAt?: DateTimeFilter<"History"> | Date | string
    conversationId?: StringFilter<"History"> | string
  }

  export type TaskUpsertWithWhereUniqueWithoutConversationInput = {
    where: TaskWhereUniqueInput
    update: XOR<TaskUpdateWithoutConversationInput, TaskUncheckedUpdateWithoutConversationInput>
    create: XOR<TaskCreateWithoutConversationInput, TaskUncheckedCreateWithoutConversationInput>
  }

  export type TaskUpdateWithWhereUniqueWithoutConversationInput = {
    where: TaskWhereUniqueInput
    data: XOR<TaskUpdateWithoutConversationInput, TaskUncheckedUpdateWithoutConversationInput>
  }

  export type TaskUpdateManyWithWhereWithoutConversationInput = {
    where: TaskScalarWhereInput
    data: XOR<TaskUpdateManyMutationInput, TaskUncheckedUpdateManyWithoutConversationInput>
  }

  export type ContactUpsertWithoutConversationsInput = {
    update: XOR<ContactUpdateWithoutConversationsInput, ContactUncheckedUpdateWithoutConversationsInput>
    create: XOR<ContactCreateWithoutConversationsInput, ContactUncheckedCreateWithoutConversationsInput>
    where?: ContactWhereInput
  }

  export type ContactUpdateToOneWithWhereWithoutConversationsInput = {
    where?: ContactWhereInput
    data: XOR<ContactUpdateWithoutConversationsInput, ContactUncheckedUpdateWithoutConversationsInput>
  }

  export type ContactUpdateWithoutConversationsInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    business?: StringFieldUpdateOperationsInput | string
    category?: StringFieldUpdateOperationsInput | string
    phone?: StringFieldUpdateOperationsInput | string
    email?: NullableStringFieldUpdateOperationsInput | string | null
    initials?: StringFieldUpdateOperationsInput | string
    color?: StringFieldUpdateOperationsInput | string
    note?: NullableStringFieldUpdateOperationsInput | string | null
    online?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    tasks?: TaskUpdateManyWithoutContactNestedInput
    queries?: QueryUpdateManyWithoutContactNestedInput
    knowledge?: ContactKnowledgeUpdateManyWithoutContactNestedInput
    calls?: CallUpdateManyWithoutContactNestedInput
    emails?: EmailUpdateManyWithoutContactNestedInput
  }

  export type ContactUncheckedUpdateWithoutConversationsInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    business?: StringFieldUpdateOperationsInput | string
    category?: StringFieldUpdateOperationsInput | string
    phone?: StringFieldUpdateOperationsInput | string
    email?: NullableStringFieldUpdateOperationsInput | string | null
    initials?: StringFieldUpdateOperationsInput | string
    color?: StringFieldUpdateOperationsInput | string
    note?: NullableStringFieldUpdateOperationsInput | string | null
    online?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    tasks?: TaskUncheckedUpdateManyWithoutContactNestedInput
    queries?: QueryUncheckedUpdateManyWithoutContactNestedInput
    knowledge?: ContactKnowledgeUncheckedUpdateManyWithoutContactNestedInput
    calls?: CallUncheckedUpdateManyWithoutContactNestedInput
    emails?: EmailUncheckedUpdateManyWithoutContactNestedInput
  }

  export type QueryUpsertWithWhereUniqueWithoutConversationInput = {
    where: QueryWhereUniqueInput
    update: XOR<QueryUpdateWithoutConversationInput, QueryUncheckedUpdateWithoutConversationInput>
    create: XOR<QueryCreateWithoutConversationInput, QueryUncheckedCreateWithoutConversationInput>
  }

  export type QueryUpdateWithWhereUniqueWithoutConversationInput = {
    where: QueryWhereUniqueInput
    data: XOR<QueryUpdateWithoutConversationInput, QueryUncheckedUpdateWithoutConversationInput>
  }

  export type QueryUpdateManyWithWhereWithoutConversationInput = {
    where: QueryScalarWhereInput
    data: XOR<QueryUpdateManyMutationInput, QueryUncheckedUpdateManyWithoutConversationInput>
  }

  export type CallUpsertWithWhereUniqueWithoutConversationInput = {
    where: CallWhereUniqueInput
    update: XOR<CallUpdateWithoutConversationInput, CallUncheckedUpdateWithoutConversationInput>
    create: XOR<CallCreateWithoutConversationInput, CallUncheckedCreateWithoutConversationInput>
  }

  export type CallUpdateWithWhereUniqueWithoutConversationInput = {
    where: CallWhereUniqueInput
    data: XOR<CallUpdateWithoutConversationInput, CallUncheckedUpdateWithoutConversationInput>
  }

  export type CallUpdateManyWithWhereWithoutConversationInput = {
    where: CallScalarWhereInput
    data: XOR<CallUpdateManyMutationInput, CallUncheckedUpdateManyWithoutConversationInput>
  }

  export type EmailUpsertWithWhereUniqueWithoutConversationInput = {
    where: EmailWhereUniqueInput
    update: XOR<EmailUpdateWithoutConversationInput, EmailUncheckedUpdateWithoutConversationInput>
    create: XOR<EmailCreateWithoutConversationInput, EmailUncheckedCreateWithoutConversationInput>
  }

  export type EmailUpdateWithWhereUniqueWithoutConversationInput = {
    where: EmailWhereUniqueInput
    data: XOR<EmailUpdateWithoutConversationInput, EmailUncheckedUpdateWithoutConversationInput>
  }

  export type EmailUpdateManyWithWhereWithoutConversationInput = {
    where: EmailScalarWhereInput
    data: XOR<EmailUpdateManyMutationInput, EmailUncheckedUpdateManyWithoutConversationInput>
  }

  export type ConversationCreateWithoutMessagesInput = {
    id?: string
    title?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    lastExtractedMessageId?: string | null
    lastExtractedAt?: Date | string | null
    history?: HistoryCreateNestedManyWithoutConversationInput
    tasks?: TaskCreateNestedManyWithoutConversationInput
    contact: ContactCreateNestedOneWithoutConversationsInput
    queries?: QueryCreateNestedManyWithoutConversationInput
    calls?: CallCreateNestedManyWithoutConversationInput
    emails?: EmailCreateNestedManyWithoutConversationInput
  }

  export type ConversationUncheckedCreateWithoutMessagesInput = {
    id?: string
    title?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    lastExtractedMessageId?: string | null
    lastExtractedAt?: Date | string | null
    contactId: string
    history?: HistoryUncheckedCreateNestedManyWithoutConversationInput
    tasks?: TaskUncheckedCreateNestedManyWithoutConversationInput
    queries?: QueryUncheckedCreateNestedManyWithoutConversationInput
    calls?: CallUncheckedCreateNestedManyWithoutConversationInput
    emails?: EmailUncheckedCreateNestedManyWithoutConversationInput
  }

  export type ConversationCreateOrConnectWithoutMessagesInput = {
    where: ConversationWhereUniqueInput
    create: XOR<ConversationCreateWithoutMessagesInput, ConversationUncheckedCreateWithoutMessagesInput>
  }

  export type CallCreateWithoutMessagesInput = {
    id?: string
    twilioSid?: string | null
    status?: string
    direction?: string
    duration?: number | null
    startedAt?: Date | string | null
    endedAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    conversation: ConversationCreateNestedOneWithoutCallsInput
    contact: ContactCreateNestedOneWithoutCallsInput
  }

  export type CallUncheckedCreateWithoutMessagesInput = {
    id?: string
    twilioSid?: string | null
    status?: string
    direction?: string
    duration?: number | null
    startedAt?: Date | string | null
    endedAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    conversationId: string
    contactId: string
  }

  export type CallCreateOrConnectWithoutMessagesInput = {
    where: CallWhereUniqueInput
    create: XOR<CallCreateWithoutMessagesInput, CallUncheckedCreateWithoutMessagesInput>
  }

  export type TaskSourceMessageCreateWithoutMessageInput = {
    id?: string
    role: string
    task: TaskCreateNestedOneWithoutSourcesInput
  }

  export type TaskSourceMessageUncheckedCreateWithoutMessageInput = {
    id?: string
    taskId: string
    role: string
  }

  export type TaskSourceMessageCreateOrConnectWithoutMessageInput = {
    where: TaskSourceMessageWhereUniqueInput
    create: XOR<TaskSourceMessageCreateWithoutMessageInput, TaskSourceMessageUncheckedCreateWithoutMessageInput>
  }

  export type TaskSourceMessageCreateManyMessageInputEnvelope = {
    data: TaskSourceMessageCreateManyMessageInput | TaskSourceMessageCreateManyMessageInput[]
    skipDuplicates?: boolean
  }

  export type QuerySourceMessageCreateWithoutMessageInput = {
    id?: string
    role: string
    query: QueryCreateNestedOneWithoutSourcesInput
  }

  export type QuerySourceMessageUncheckedCreateWithoutMessageInput = {
    id?: string
    queryId: string
    role: string
  }

  export type QuerySourceMessageCreateOrConnectWithoutMessageInput = {
    where: QuerySourceMessageWhereUniqueInput
    create: XOR<QuerySourceMessageCreateWithoutMessageInput, QuerySourceMessageUncheckedCreateWithoutMessageInput>
  }

  export type QuerySourceMessageCreateManyMessageInputEnvelope = {
    data: QuerySourceMessageCreateManyMessageInput | QuerySourceMessageCreateManyMessageInput[]
    skipDuplicates?: boolean
  }

  export type KnowledgeSourceMessageCreateWithoutMessageInput = {
    id?: string
    role: string
    knowledge: ContactKnowledgeCreateNestedOneWithoutSourcesInput
  }

  export type KnowledgeSourceMessageUncheckedCreateWithoutMessageInput = {
    id?: string
    knowledgeId: string
    role: string
  }

  export type KnowledgeSourceMessageCreateOrConnectWithoutMessageInput = {
    where: KnowledgeSourceMessageWhereUniqueInput
    create: XOR<KnowledgeSourceMessageCreateWithoutMessageInput, KnowledgeSourceMessageUncheckedCreateWithoutMessageInput>
  }

  export type KnowledgeSourceMessageCreateManyMessageInputEnvelope = {
    data: KnowledgeSourceMessageCreateManyMessageInput | KnowledgeSourceMessageCreateManyMessageInput[]
    skipDuplicates?: boolean
  }

  export type ConversationUpsertWithoutMessagesInput = {
    update: XOR<ConversationUpdateWithoutMessagesInput, ConversationUncheckedUpdateWithoutMessagesInput>
    create: XOR<ConversationCreateWithoutMessagesInput, ConversationUncheckedCreateWithoutMessagesInput>
    where?: ConversationWhereInput
  }

  export type ConversationUpdateToOneWithWhereWithoutMessagesInput = {
    where?: ConversationWhereInput
    data: XOR<ConversationUpdateWithoutMessagesInput, ConversationUncheckedUpdateWithoutMessagesInput>
  }

  export type ConversationUpdateWithoutMessagesInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    lastExtractedMessageId?: NullableStringFieldUpdateOperationsInput | string | null
    lastExtractedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    history?: HistoryUpdateManyWithoutConversationNestedInput
    tasks?: TaskUpdateManyWithoutConversationNestedInput
    contact?: ContactUpdateOneRequiredWithoutConversationsNestedInput
    queries?: QueryUpdateManyWithoutConversationNestedInput
    calls?: CallUpdateManyWithoutConversationNestedInput
    emails?: EmailUpdateManyWithoutConversationNestedInput
  }

  export type ConversationUncheckedUpdateWithoutMessagesInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    lastExtractedMessageId?: NullableStringFieldUpdateOperationsInput | string | null
    lastExtractedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    contactId?: StringFieldUpdateOperationsInput | string
    history?: HistoryUncheckedUpdateManyWithoutConversationNestedInput
    tasks?: TaskUncheckedUpdateManyWithoutConversationNestedInput
    queries?: QueryUncheckedUpdateManyWithoutConversationNestedInput
    calls?: CallUncheckedUpdateManyWithoutConversationNestedInput
    emails?: EmailUncheckedUpdateManyWithoutConversationNestedInput
  }

  export type CallUpsertWithoutMessagesInput = {
    update: XOR<CallUpdateWithoutMessagesInput, CallUncheckedUpdateWithoutMessagesInput>
    create: XOR<CallCreateWithoutMessagesInput, CallUncheckedCreateWithoutMessagesInput>
    where?: CallWhereInput
  }

  export type CallUpdateToOneWithWhereWithoutMessagesInput = {
    where?: CallWhereInput
    data: XOR<CallUpdateWithoutMessagesInput, CallUncheckedUpdateWithoutMessagesInput>
  }

  export type CallUpdateWithoutMessagesInput = {
    id?: StringFieldUpdateOperationsInput | string
    twilioSid?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    direction?: StringFieldUpdateOperationsInput | string
    duration?: NullableIntFieldUpdateOperationsInput | number | null
    startedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    endedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    conversation?: ConversationUpdateOneRequiredWithoutCallsNestedInput
    contact?: ContactUpdateOneRequiredWithoutCallsNestedInput
  }

  export type CallUncheckedUpdateWithoutMessagesInput = {
    id?: StringFieldUpdateOperationsInput | string
    twilioSid?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    direction?: StringFieldUpdateOperationsInput | string
    duration?: NullableIntFieldUpdateOperationsInput | number | null
    startedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    endedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    conversationId?: StringFieldUpdateOperationsInput | string
    contactId?: StringFieldUpdateOperationsInput | string
  }

  export type TaskSourceMessageUpsertWithWhereUniqueWithoutMessageInput = {
    where: TaskSourceMessageWhereUniqueInput
    update: XOR<TaskSourceMessageUpdateWithoutMessageInput, TaskSourceMessageUncheckedUpdateWithoutMessageInput>
    create: XOR<TaskSourceMessageCreateWithoutMessageInput, TaskSourceMessageUncheckedCreateWithoutMessageInput>
  }

  export type TaskSourceMessageUpdateWithWhereUniqueWithoutMessageInput = {
    where: TaskSourceMessageWhereUniqueInput
    data: XOR<TaskSourceMessageUpdateWithoutMessageInput, TaskSourceMessageUncheckedUpdateWithoutMessageInput>
  }

  export type TaskSourceMessageUpdateManyWithWhereWithoutMessageInput = {
    where: TaskSourceMessageScalarWhereInput
    data: XOR<TaskSourceMessageUpdateManyMutationInput, TaskSourceMessageUncheckedUpdateManyWithoutMessageInput>
  }

  export type TaskSourceMessageScalarWhereInput = {
    AND?: TaskSourceMessageScalarWhereInput | TaskSourceMessageScalarWhereInput[]
    OR?: TaskSourceMessageScalarWhereInput[]
    NOT?: TaskSourceMessageScalarWhereInput | TaskSourceMessageScalarWhereInput[]
    id?: StringFilter<"TaskSourceMessage"> | string
    taskId?: StringFilter<"TaskSourceMessage"> | string
    messageId?: StringFilter<"TaskSourceMessage"> | string
    role?: StringFilter<"TaskSourceMessage"> | string
  }

  export type QuerySourceMessageUpsertWithWhereUniqueWithoutMessageInput = {
    where: QuerySourceMessageWhereUniqueInput
    update: XOR<QuerySourceMessageUpdateWithoutMessageInput, QuerySourceMessageUncheckedUpdateWithoutMessageInput>
    create: XOR<QuerySourceMessageCreateWithoutMessageInput, QuerySourceMessageUncheckedCreateWithoutMessageInput>
  }

  export type QuerySourceMessageUpdateWithWhereUniqueWithoutMessageInput = {
    where: QuerySourceMessageWhereUniqueInput
    data: XOR<QuerySourceMessageUpdateWithoutMessageInput, QuerySourceMessageUncheckedUpdateWithoutMessageInput>
  }

  export type QuerySourceMessageUpdateManyWithWhereWithoutMessageInput = {
    where: QuerySourceMessageScalarWhereInput
    data: XOR<QuerySourceMessageUpdateManyMutationInput, QuerySourceMessageUncheckedUpdateManyWithoutMessageInput>
  }

  export type QuerySourceMessageScalarWhereInput = {
    AND?: QuerySourceMessageScalarWhereInput | QuerySourceMessageScalarWhereInput[]
    OR?: QuerySourceMessageScalarWhereInput[]
    NOT?: QuerySourceMessageScalarWhereInput | QuerySourceMessageScalarWhereInput[]
    id?: StringFilter<"QuerySourceMessage"> | string
    queryId?: StringFilter<"QuerySourceMessage"> | string
    messageId?: StringFilter<"QuerySourceMessage"> | string
    role?: StringFilter<"QuerySourceMessage"> | string
  }

  export type KnowledgeSourceMessageUpsertWithWhereUniqueWithoutMessageInput = {
    where: KnowledgeSourceMessageWhereUniqueInput
    update: XOR<KnowledgeSourceMessageUpdateWithoutMessageInput, KnowledgeSourceMessageUncheckedUpdateWithoutMessageInput>
    create: XOR<KnowledgeSourceMessageCreateWithoutMessageInput, KnowledgeSourceMessageUncheckedCreateWithoutMessageInput>
  }

  export type KnowledgeSourceMessageUpdateWithWhereUniqueWithoutMessageInput = {
    where: KnowledgeSourceMessageWhereUniqueInput
    data: XOR<KnowledgeSourceMessageUpdateWithoutMessageInput, KnowledgeSourceMessageUncheckedUpdateWithoutMessageInput>
  }

  export type KnowledgeSourceMessageUpdateManyWithWhereWithoutMessageInput = {
    where: KnowledgeSourceMessageScalarWhereInput
    data: XOR<KnowledgeSourceMessageUpdateManyMutationInput, KnowledgeSourceMessageUncheckedUpdateManyWithoutMessageInput>
  }

  export type KnowledgeSourceMessageScalarWhereInput = {
    AND?: KnowledgeSourceMessageScalarWhereInput | KnowledgeSourceMessageScalarWhereInput[]
    OR?: KnowledgeSourceMessageScalarWhereInput[]
    NOT?: KnowledgeSourceMessageScalarWhereInput | KnowledgeSourceMessageScalarWhereInput[]
    id?: StringFilter<"KnowledgeSourceMessage"> | string
    knowledgeId?: StringFilter<"KnowledgeSourceMessage"> | string
    messageId?: StringFilter<"KnowledgeSourceMessage"> | string
    role?: StringFilter<"KnowledgeSourceMessage"> | string
  }

  export type ConversationCreateWithoutHistoryInput = {
    id?: string
    title?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    lastExtractedMessageId?: string | null
    lastExtractedAt?: Date | string | null
    messages?: MessageCreateNestedManyWithoutConversationInput
    tasks?: TaskCreateNestedManyWithoutConversationInput
    contact: ContactCreateNestedOneWithoutConversationsInput
    queries?: QueryCreateNestedManyWithoutConversationInput
    calls?: CallCreateNestedManyWithoutConversationInput
    emails?: EmailCreateNestedManyWithoutConversationInput
  }

  export type ConversationUncheckedCreateWithoutHistoryInput = {
    id?: string
    title?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    lastExtractedMessageId?: string | null
    lastExtractedAt?: Date | string | null
    contactId: string
    messages?: MessageUncheckedCreateNestedManyWithoutConversationInput
    tasks?: TaskUncheckedCreateNestedManyWithoutConversationInput
    queries?: QueryUncheckedCreateNestedManyWithoutConversationInput
    calls?: CallUncheckedCreateNestedManyWithoutConversationInput
    emails?: EmailUncheckedCreateNestedManyWithoutConversationInput
  }

  export type ConversationCreateOrConnectWithoutHistoryInput = {
    where: ConversationWhereUniqueInput
    create: XOR<ConversationCreateWithoutHistoryInput, ConversationUncheckedCreateWithoutHistoryInput>
  }

  export type ConversationUpsertWithoutHistoryInput = {
    update: XOR<ConversationUpdateWithoutHistoryInput, ConversationUncheckedUpdateWithoutHistoryInput>
    create: XOR<ConversationCreateWithoutHistoryInput, ConversationUncheckedCreateWithoutHistoryInput>
    where?: ConversationWhereInput
  }

  export type ConversationUpdateToOneWithWhereWithoutHistoryInput = {
    where?: ConversationWhereInput
    data: XOR<ConversationUpdateWithoutHistoryInput, ConversationUncheckedUpdateWithoutHistoryInput>
  }

  export type ConversationUpdateWithoutHistoryInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    lastExtractedMessageId?: NullableStringFieldUpdateOperationsInput | string | null
    lastExtractedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    messages?: MessageUpdateManyWithoutConversationNestedInput
    tasks?: TaskUpdateManyWithoutConversationNestedInput
    contact?: ContactUpdateOneRequiredWithoutConversationsNestedInput
    queries?: QueryUpdateManyWithoutConversationNestedInput
    calls?: CallUpdateManyWithoutConversationNestedInput
    emails?: EmailUpdateManyWithoutConversationNestedInput
  }

  export type ConversationUncheckedUpdateWithoutHistoryInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    lastExtractedMessageId?: NullableStringFieldUpdateOperationsInput | string | null
    lastExtractedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    contactId?: StringFieldUpdateOperationsInput | string
    messages?: MessageUncheckedUpdateManyWithoutConversationNestedInput
    tasks?: TaskUncheckedUpdateManyWithoutConversationNestedInput
    queries?: QueryUncheckedUpdateManyWithoutConversationNestedInput
    calls?: CallUncheckedUpdateManyWithoutConversationNestedInput
    emails?: EmailUncheckedUpdateManyWithoutConversationNestedInput
  }

  export type ConversationCreateWithoutTasksInput = {
    id?: string
    title?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    lastExtractedMessageId?: string | null
    lastExtractedAt?: Date | string | null
    messages?: MessageCreateNestedManyWithoutConversationInput
    history?: HistoryCreateNestedManyWithoutConversationInput
    contact: ContactCreateNestedOneWithoutConversationsInput
    queries?: QueryCreateNestedManyWithoutConversationInput
    calls?: CallCreateNestedManyWithoutConversationInput
    emails?: EmailCreateNestedManyWithoutConversationInput
  }

  export type ConversationUncheckedCreateWithoutTasksInput = {
    id?: string
    title?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    lastExtractedMessageId?: string | null
    lastExtractedAt?: Date | string | null
    contactId: string
    messages?: MessageUncheckedCreateNestedManyWithoutConversationInput
    history?: HistoryUncheckedCreateNestedManyWithoutConversationInput
    queries?: QueryUncheckedCreateNestedManyWithoutConversationInput
    calls?: CallUncheckedCreateNestedManyWithoutConversationInput
    emails?: EmailUncheckedCreateNestedManyWithoutConversationInput
  }

  export type ConversationCreateOrConnectWithoutTasksInput = {
    where: ConversationWhereUniqueInput
    create: XOR<ConversationCreateWithoutTasksInput, ConversationUncheckedCreateWithoutTasksInput>
  }

  export type ContactCreateWithoutTasksInput = {
    id?: string
    name: string
    business: string
    category: string
    phone: string
    email?: string | null
    initials: string
    color: string
    note?: string | null
    online?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    conversations?: ConversationCreateNestedManyWithoutContactInput
    queries?: QueryCreateNestedManyWithoutContactInput
    knowledge?: ContactKnowledgeCreateNestedManyWithoutContactInput
    calls?: CallCreateNestedManyWithoutContactInput
    emails?: EmailCreateNestedManyWithoutContactInput
  }

  export type ContactUncheckedCreateWithoutTasksInput = {
    id?: string
    name: string
    business: string
    category: string
    phone: string
    email?: string | null
    initials: string
    color: string
    note?: string | null
    online?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    conversations?: ConversationUncheckedCreateNestedManyWithoutContactInput
    queries?: QueryUncheckedCreateNestedManyWithoutContactInput
    knowledge?: ContactKnowledgeUncheckedCreateNestedManyWithoutContactInput
    calls?: CallUncheckedCreateNestedManyWithoutContactInput
    emails?: EmailUncheckedCreateNestedManyWithoutContactInput
  }

  export type ContactCreateOrConnectWithoutTasksInput = {
    where: ContactWhereUniqueInput
    create: XOR<ContactCreateWithoutTasksInput, ContactUncheckedCreateWithoutTasksInput>
  }

  export type TaskSourceMessageCreateWithoutTaskInput = {
    id?: string
    role: string
    message: MessageCreateNestedOneWithoutTaskSourcesInput
  }

  export type TaskSourceMessageUncheckedCreateWithoutTaskInput = {
    id?: string
    messageId: string
    role: string
  }

  export type TaskSourceMessageCreateOrConnectWithoutTaskInput = {
    where: TaskSourceMessageWhereUniqueInput
    create: XOR<TaskSourceMessageCreateWithoutTaskInput, TaskSourceMessageUncheckedCreateWithoutTaskInput>
  }

  export type TaskSourceMessageCreateManyTaskInputEnvelope = {
    data: TaskSourceMessageCreateManyTaskInput | TaskSourceMessageCreateManyTaskInput[]
    skipDuplicates?: boolean
  }

  export type ConversationUpsertWithoutTasksInput = {
    update: XOR<ConversationUpdateWithoutTasksInput, ConversationUncheckedUpdateWithoutTasksInput>
    create: XOR<ConversationCreateWithoutTasksInput, ConversationUncheckedCreateWithoutTasksInput>
    where?: ConversationWhereInput
  }

  export type ConversationUpdateToOneWithWhereWithoutTasksInput = {
    where?: ConversationWhereInput
    data: XOR<ConversationUpdateWithoutTasksInput, ConversationUncheckedUpdateWithoutTasksInput>
  }

  export type ConversationUpdateWithoutTasksInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    lastExtractedMessageId?: NullableStringFieldUpdateOperationsInput | string | null
    lastExtractedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    messages?: MessageUpdateManyWithoutConversationNestedInput
    history?: HistoryUpdateManyWithoutConversationNestedInput
    contact?: ContactUpdateOneRequiredWithoutConversationsNestedInput
    queries?: QueryUpdateManyWithoutConversationNestedInput
    calls?: CallUpdateManyWithoutConversationNestedInput
    emails?: EmailUpdateManyWithoutConversationNestedInput
  }

  export type ConversationUncheckedUpdateWithoutTasksInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    lastExtractedMessageId?: NullableStringFieldUpdateOperationsInput | string | null
    lastExtractedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    contactId?: StringFieldUpdateOperationsInput | string
    messages?: MessageUncheckedUpdateManyWithoutConversationNestedInput
    history?: HistoryUncheckedUpdateManyWithoutConversationNestedInput
    queries?: QueryUncheckedUpdateManyWithoutConversationNestedInput
    calls?: CallUncheckedUpdateManyWithoutConversationNestedInput
    emails?: EmailUncheckedUpdateManyWithoutConversationNestedInput
  }

  export type ContactUpsertWithoutTasksInput = {
    update: XOR<ContactUpdateWithoutTasksInput, ContactUncheckedUpdateWithoutTasksInput>
    create: XOR<ContactCreateWithoutTasksInput, ContactUncheckedCreateWithoutTasksInput>
    where?: ContactWhereInput
  }

  export type ContactUpdateToOneWithWhereWithoutTasksInput = {
    where?: ContactWhereInput
    data: XOR<ContactUpdateWithoutTasksInput, ContactUncheckedUpdateWithoutTasksInput>
  }

  export type ContactUpdateWithoutTasksInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    business?: StringFieldUpdateOperationsInput | string
    category?: StringFieldUpdateOperationsInput | string
    phone?: StringFieldUpdateOperationsInput | string
    email?: NullableStringFieldUpdateOperationsInput | string | null
    initials?: StringFieldUpdateOperationsInput | string
    color?: StringFieldUpdateOperationsInput | string
    note?: NullableStringFieldUpdateOperationsInput | string | null
    online?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    conversations?: ConversationUpdateManyWithoutContactNestedInput
    queries?: QueryUpdateManyWithoutContactNestedInput
    knowledge?: ContactKnowledgeUpdateManyWithoutContactNestedInput
    calls?: CallUpdateManyWithoutContactNestedInput
    emails?: EmailUpdateManyWithoutContactNestedInput
  }

  export type ContactUncheckedUpdateWithoutTasksInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    business?: StringFieldUpdateOperationsInput | string
    category?: StringFieldUpdateOperationsInput | string
    phone?: StringFieldUpdateOperationsInput | string
    email?: NullableStringFieldUpdateOperationsInput | string | null
    initials?: StringFieldUpdateOperationsInput | string
    color?: StringFieldUpdateOperationsInput | string
    note?: NullableStringFieldUpdateOperationsInput | string | null
    online?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    conversations?: ConversationUncheckedUpdateManyWithoutContactNestedInput
    queries?: QueryUncheckedUpdateManyWithoutContactNestedInput
    knowledge?: ContactKnowledgeUncheckedUpdateManyWithoutContactNestedInput
    calls?: CallUncheckedUpdateManyWithoutContactNestedInput
    emails?: EmailUncheckedUpdateManyWithoutContactNestedInput
  }

  export type TaskSourceMessageUpsertWithWhereUniqueWithoutTaskInput = {
    where: TaskSourceMessageWhereUniqueInput
    update: XOR<TaskSourceMessageUpdateWithoutTaskInput, TaskSourceMessageUncheckedUpdateWithoutTaskInput>
    create: XOR<TaskSourceMessageCreateWithoutTaskInput, TaskSourceMessageUncheckedCreateWithoutTaskInput>
  }

  export type TaskSourceMessageUpdateWithWhereUniqueWithoutTaskInput = {
    where: TaskSourceMessageWhereUniqueInput
    data: XOR<TaskSourceMessageUpdateWithoutTaskInput, TaskSourceMessageUncheckedUpdateWithoutTaskInput>
  }

  export type TaskSourceMessageUpdateManyWithWhereWithoutTaskInput = {
    where: TaskSourceMessageScalarWhereInput
    data: XOR<TaskSourceMessageUpdateManyMutationInput, TaskSourceMessageUncheckedUpdateManyWithoutTaskInput>
  }

  export type TaskCreateWithoutSourcesInput = {
    id?: string
    title: string
    description?: string | null
    status?: string
    priority?: string
    dueDate?: Date | string | null
    confidence?: number
    source?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    completedAt?: Date | string | null
    conversation: ConversationCreateNestedOneWithoutTasksInput
    contact: ContactCreateNestedOneWithoutTasksInput
  }

  export type TaskUncheckedCreateWithoutSourcesInput = {
    id?: string
    title: string
    description?: string | null
    status?: string
    priority?: string
    dueDate?: Date | string | null
    confidence?: number
    source?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    completedAt?: Date | string | null
    conversationId: string
    contactId: string
  }

  export type TaskCreateOrConnectWithoutSourcesInput = {
    where: TaskWhereUniqueInput
    create: XOR<TaskCreateWithoutSourcesInput, TaskUncheckedCreateWithoutSourcesInput>
  }

  export type MessageCreateWithoutTaskSourcesInput = {
    id?: string
    role: string
    content: string
    time: string
    pending?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    conversation: ConversationCreateNestedOneWithoutMessagesInput
    call?: CallCreateNestedOneWithoutMessagesInput
    querySources?: QuerySourceMessageCreateNestedManyWithoutMessageInput
    knowledgeSources?: KnowledgeSourceMessageCreateNestedManyWithoutMessageInput
  }

  export type MessageUncheckedCreateWithoutTaskSourcesInput = {
    id?: string
    role: string
    content: string
    time: string
    pending?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    conversationId: string
    callId?: string | null
    querySources?: QuerySourceMessageUncheckedCreateNestedManyWithoutMessageInput
    knowledgeSources?: KnowledgeSourceMessageUncheckedCreateNestedManyWithoutMessageInput
  }

  export type MessageCreateOrConnectWithoutTaskSourcesInput = {
    where: MessageWhereUniqueInput
    create: XOR<MessageCreateWithoutTaskSourcesInput, MessageUncheckedCreateWithoutTaskSourcesInput>
  }

  export type TaskUpsertWithoutSourcesInput = {
    update: XOR<TaskUpdateWithoutSourcesInput, TaskUncheckedUpdateWithoutSourcesInput>
    create: XOR<TaskCreateWithoutSourcesInput, TaskUncheckedCreateWithoutSourcesInput>
    where?: TaskWhereInput
  }

  export type TaskUpdateToOneWithWhereWithoutSourcesInput = {
    where?: TaskWhereInput
    data: XOR<TaskUpdateWithoutSourcesInput, TaskUncheckedUpdateWithoutSourcesInput>
  }

  export type TaskUpdateWithoutSourcesInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    priority?: StringFieldUpdateOperationsInput | string
    dueDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    confidence?: FloatFieldUpdateOperationsInput | number
    source?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    conversation?: ConversationUpdateOneRequiredWithoutTasksNestedInput
    contact?: ContactUpdateOneRequiredWithoutTasksNestedInput
  }

  export type TaskUncheckedUpdateWithoutSourcesInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    priority?: StringFieldUpdateOperationsInput | string
    dueDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    confidence?: FloatFieldUpdateOperationsInput | number
    source?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    conversationId?: StringFieldUpdateOperationsInput | string
    contactId?: StringFieldUpdateOperationsInput | string
  }

  export type MessageUpsertWithoutTaskSourcesInput = {
    update: XOR<MessageUpdateWithoutTaskSourcesInput, MessageUncheckedUpdateWithoutTaskSourcesInput>
    create: XOR<MessageCreateWithoutTaskSourcesInput, MessageUncheckedCreateWithoutTaskSourcesInput>
    where?: MessageWhereInput
  }

  export type MessageUpdateToOneWithWhereWithoutTaskSourcesInput = {
    where?: MessageWhereInput
    data: XOR<MessageUpdateWithoutTaskSourcesInput, MessageUncheckedUpdateWithoutTaskSourcesInput>
  }

  export type MessageUpdateWithoutTaskSourcesInput = {
    id?: StringFieldUpdateOperationsInput | string
    role?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    time?: StringFieldUpdateOperationsInput | string
    pending?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    conversation?: ConversationUpdateOneRequiredWithoutMessagesNestedInput
    call?: CallUpdateOneWithoutMessagesNestedInput
    querySources?: QuerySourceMessageUpdateManyWithoutMessageNestedInput
    knowledgeSources?: KnowledgeSourceMessageUpdateManyWithoutMessageNestedInput
  }

  export type MessageUncheckedUpdateWithoutTaskSourcesInput = {
    id?: StringFieldUpdateOperationsInput | string
    role?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    time?: StringFieldUpdateOperationsInput | string
    pending?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    conversationId?: StringFieldUpdateOperationsInput | string
    callId?: NullableStringFieldUpdateOperationsInput | string | null
    querySources?: QuerySourceMessageUncheckedUpdateManyWithoutMessageNestedInput
    knowledgeSources?: KnowledgeSourceMessageUncheckedUpdateManyWithoutMessageNestedInput
  }

  export type ConversationCreateWithoutQueriesInput = {
    id?: string
    title?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    lastExtractedMessageId?: string | null
    lastExtractedAt?: Date | string | null
    messages?: MessageCreateNestedManyWithoutConversationInput
    history?: HistoryCreateNestedManyWithoutConversationInput
    tasks?: TaskCreateNestedManyWithoutConversationInput
    contact: ContactCreateNestedOneWithoutConversationsInput
    calls?: CallCreateNestedManyWithoutConversationInput
    emails?: EmailCreateNestedManyWithoutConversationInput
  }

  export type ConversationUncheckedCreateWithoutQueriesInput = {
    id?: string
    title?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    lastExtractedMessageId?: string | null
    lastExtractedAt?: Date | string | null
    contactId: string
    messages?: MessageUncheckedCreateNestedManyWithoutConversationInput
    history?: HistoryUncheckedCreateNestedManyWithoutConversationInput
    tasks?: TaskUncheckedCreateNestedManyWithoutConversationInput
    calls?: CallUncheckedCreateNestedManyWithoutConversationInput
    emails?: EmailUncheckedCreateNestedManyWithoutConversationInput
  }

  export type ConversationCreateOrConnectWithoutQueriesInput = {
    where: ConversationWhereUniqueInput
    create: XOR<ConversationCreateWithoutQueriesInput, ConversationUncheckedCreateWithoutQueriesInput>
  }

  export type ContactCreateWithoutQueriesInput = {
    id?: string
    name: string
    business: string
    category: string
    phone: string
    email?: string | null
    initials: string
    color: string
    note?: string | null
    online?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    conversations?: ConversationCreateNestedManyWithoutContactInput
    tasks?: TaskCreateNestedManyWithoutContactInput
    knowledge?: ContactKnowledgeCreateNestedManyWithoutContactInput
    calls?: CallCreateNestedManyWithoutContactInput
    emails?: EmailCreateNestedManyWithoutContactInput
  }

  export type ContactUncheckedCreateWithoutQueriesInput = {
    id?: string
    name: string
    business: string
    category: string
    phone: string
    email?: string | null
    initials: string
    color: string
    note?: string | null
    online?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    conversations?: ConversationUncheckedCreateNestedManyWithoutContactInput
    tasks?: TaskUncheckedCreateNestedManyWithoutContactInput
    knowledge?: ContactKnowledgeUncheckedCreateNestedManyWithoutContactInput
    calls?: CallUncheckedCreateNestedManyWithoutContactInput
    emails?: EmailUncheckedCreateNestedManyWithoutContactInput
  }

  export type ContactCreateOrConnectWithoutQueriesInput = {
    where: ContactWhereUniqueInput
    create: XOR<ContactCreateWithoutQueriesInput, ContactUncheckedCreateWithoutQueriesInput>
  }

  export type QuerySourceMessageCreateWithoutQueryInput = {
    id?: string
    role: string
    message: MessageCreateNestedOneWithoutQuerySourcesInput
  }

  export type QuerySourceMessageUncheckedCreateWithoutQueryInput = {
    id?: string
    messageId: string
    role: string
  }

  export type QuerySourceMessageCreateOrConnectWithoutQueryInput = {
    where: QuerySourceMessageWhereUniqueInput
    create: XOR<QuerySourceMessageCreateWithoutQueryInput, QuerySourceMessageUncheckedCreateWithoutQueryInput>
  }

  export type QuerySourceMessageCreateManyQueryInputEnvelope = {
    data: QuerySourceMessageCreateManyQueryInput | QuerySourceMessageCreateManyQueryInput[]
    skipDuplicates?: boolean
  }

  export type ConversationUpsertWithoutQueriesInput = {
    update: XOR<ConversationUpdateWithoutQueriesInput, ConversationUncheckedUpdateWithoutQueriesInput>
    create: XOR<ConversationCreateWithoutQueriesInput, ConversationUncheckedCreateWithoutQueriesInput>
    where?: ConversationWhereInput
  }

  export type ConversationUpdateToOneWithWhereWithoutQueriesInput = {
    where?: ConversationWhereInput
    data: XOR<ConversationUpdateWithoutQueriesInput, ConversationUncheckedUpdateWithoutQueriesInput>
  }

  export type ConversationUpdateWithoutQueriesInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    lastExtractedMessageId?: NullableStringFieldUpdateOperationsInput | string | null
    lastExtractedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    messages?: MessageUpdateManyWithoutConversationNestedInput
    history?: HistoryUpdateManyWithoutConversationNestedInput
    tasks?: TaskUpdateManyWithoutConversationNestedInput
    contact?: ContactUpdateOneRequiredWithoutConversationsNestedInput
    calls?: CallUpdateManyWithoutConversationNestedInput
    emails?: EmailUpdateManyWithoutConversationNestedInput
  }

  export type ConversationUncheckedUpdateWithoutQueriesInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    lastExtractedMessageId?: NullableStringFieldUpdateOperationsInput | string | null
    lastExtractedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    contactId?: StringFieldUpdateOperationsInput | string
    messages?: MessageUncheckedUpdateManyWithoutConversationNestedInput
    history?: HistoryUncheckedUpdateManyWithoutConversationNestedInput
    tasks?: TaskUncheckedUpdateManyWithoutConversationNestedInput
    calls?: CallUncheckedUpdateManyWithoutConversationNestedInput
    emails?: EmailUncheckedUpdateManyWithoutConversationNestedInput
  }

  export type ContactUpsertWithoutQueriesInput = {
    update: XOR<ContactUpdateWithoutQueriesInput, ContactUncheckedUpdateWithoutQueriesInput>
    create: XOR<ContactCreateWithoutQueriesInput, ContactUncheckedCreateWithoutQueriesInput>
    where?: ContactWhereInput
  }

  export type ContactUpdateToOneWithWhereWithoutQueriesInput = {
    where?: ContactWhereInput
    data: XOR<ContactUpdateWithoutQueriesInput, ContactUncheckedUpdateWithoutQueriesInput>
  }

  export type ContactUpdateWithoutQueriesInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    business?: StringFieldUpdateOperationsInput | string
    category?: StringFieldUpdateOperationsInput | string
    phone?: StringFieldUpdateOperationsInput | string
    email?: NullableStringFieldUpdateOperationsInput | string | null
    initials?: StringFieldUpdateOperationsInput | string
    color?: StringFieldUpdateOperationsInput | string
    note?: NullableStringFieldUpdateOperationsInput | string | null
    online?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    conversations?: ConversationUpdateManyWithoutContactNestedInput
    tasks?: TaskUpdateManyWithoutContactNestedInput
    knowledge?: ContactKnowledgeUpdateManyWithoutContactNestedInput
    calls?: CallUpdateManyWithoutContactNestedInput
    emails?: EmailUpdateManyWithoutContactNestedInput
  }

  export type ContactUncheckedUpdateWithoutQueriesInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    business?: StringFieldUpdateOperationsInput | string
    category?: StringFieldUpdateOperationsInput | string
    phone?: StringFieldUpdateOperationsInput | string
    email?: NullableStringFieldUpdateOperationsInput | string | null
    initials?: StringFieldUpdateOperationsInput | string
    color?: StringFieldUpdateOperationsInput | string
    note?: NullableStringFieldUpdateOperationsInput | string | null
    online?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    conversations?: ConversationUncheckedUpdateManyWithoutContactNestedInput
    tasks?: TaskUncheckedUpdateManyWithoutContactNestedInput
    knowledge?: ContactKnowledgeUncheckedUpdateManyWithoutContactNestedInput
    calls?: CallUncheckedUpdateManyWithoutContactNestedInput
    emails?: EmailUncheckedUpdateManyWithoutContactNestedInput
  }

  export type QuerySourceMessageUpsertWithWhereUniqueWithoutQueryInput = {
    where: QuerySourceMessageWhereUniqueInput
    update: XOR<QuerySourceMessageUpdateWithoutQueryInput, QuerySourceMessageUncheckedUpdateWithoutQueryInput>
    create: XOR<QuerySourceMessageCreateWithoutQueryInput, QuerySourceMessageUncheckedCreateWithoutQueryInput>
  }

  export type QuerySourceMessageUpdateWithWhereUniqueWithoutQueryInput = {
    where: QuerySourceMessageWhereUniqueInput
    data: XOR<QuerySourceMessageUpdateWithoutQueryInput, QuerySourceMessageUncheckedUpdateWithoutQueryInput>
  }

  export type QuerySourceMessageUpdateManyWithWhereWithoutQueryInput = {
    where: QuerySourceMessageScalarWhereInput
    data: XOR<QuerySourceMessageUpdateManyMutationInput, QuerySourceMessageUncheckedUpdateManyWithoutQueryInput>
  }

  export type QueryCreateWithoutSourcesInput = {
    id?: string
    question: string
    answer?: string | null
    status?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    answeredAt?: Date | string | null
    answerMessageId?: string | null
    conversation: ConversationCreateNestedOneWithoutQueriesInput
    contact: ContactCreateNestedOneWithoutQueriesInput
  }

  export type QueryUncheckedCreateWithoutSourcesInput = {
    id?: string
    question: string
    answer?: string | null
    status?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    answeredAt?: Date | string | null
    answerMessageId?: string | null
    conversationId: string
    contactId: string
  }

  export type QueryCreateOrConnectWithoutSourcesInput = {
    where: QueryWhereUniqueInput
    create: XOR<QueryCreateWithoutSourcesInput, QueryUncheckedCreateWithoutSourcesInput>
  }

  export type MessageCreateWithoutQuerySourcesInput = {
    id?: string
    role: string
    content: string
    time: string
    pending?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    conversation: ConversationCreateNestedOneWithoutMessagesInput
    call?: CallCreateNestedOneWithoutMessagesInput
    taskSources?: TaskSourceMessageCreateNestedManyWithoutMessageInput
    knowledgeSources?: KnowledgeSourceMessageCreateNestedManyWithoutMessageInput
  }

  export type MessageUncheckedCreateWithoutQuerySourcesInput = {
    id?: string
    role: string
    content: string
    time: string
    pending?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    conversationId: string
    callId?: string | null
    taskSources?: TaskSourceMessageUncheckedCreateNestedManyWithoutMessageInput
    knowledgeSources?: KnowledgeSourceMessageUncheckedCreateNestedManyWithoutMessageInput
  }

  export type MessageCreateOrConnectWithoutQuerySourcesInput = {
    where: MessageWhereUniqueInput
    create: XOR<MessageCreateWithoutQuerySourcesInput, MessageUncheckedCreateWithoutQuerySourcesInput>
  }

  export type QueryUpsertWithoutSourcesInput = {
    update: XOR<QueryUpdateWithoutSourcesInput, QueryUncheckedUpdateWithoutSourcesInput>
    create: XOR<QueryCreateWithoutSourcesInput, QueryUncheckedCreateWithoutSourcesInput>
    where?: QueryWhereInput
  }

  export type QueryUpdateToOneWithWhereWithoutSourcesInput = {
    where?: QueryWhereInput
    data: XOR<QueryUpdateWithoutSourcesInput, QueryUncheckedUpdateWithoutSourcesInput>
  }

  export type QueryUpdateWithoutSourcesInput = {
    id?: StringFieldUpdateOperationsInput | string
    question?: StringFieldUpdateOperationsInput | string
    answer?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    answeredAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    answerMessageId?: NullableStringFieldUpdateOperationsInput | string | null
    conversation?: ConversationUpdateOneRequiredWithoutQueriesNestedInput
    contact?: ContactUpdateOneRequiredWithoutQueriesNestedInput
  }

  export type QueryUncheckedUpdateWithoutSourcesInput = {
    id?: StringFieldUpdateOperationsInput | string
    question?: StringFieldUpdateOperationsInput | string
    answer?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    answeredAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    answerMessageId?: NullableStringFieldUpdateOperationsInput | string | null
    conversationId?: StringFieldUpdateOperationsInput | string
    contactId?: StringFieldUpdateOperationsInput | string
  }

  export type MessageUpsertWithoutQuerySourcesInput = {
    update: XOR<MessageUpdateWithoutQuerySourcesInput, MessageUncheckedUpdateWithoutQuerySourcesInput>
    create: XOR<MessageCreateWithoutQuerySourcesInput, MessageUncheckedCreateWithoutQuerySourcesInput>
    where?: MessageWhereInput
  }

  export type MessageUpdateToOneWithWhereWithoutQuerySourcesInput = {
    where?: MessageWhereInput
    data: XOR<MessageUpdateWithoutQuerySourcesInput, MessageUncheckedUpdateWithoutQuerySourcesInput>
  }

  export type MessageUpdateWithoutQuerySourcesInput = {
    id?: StringFieldUpdateOperationsInput | string
    role?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    time?: StringFieldUpdateOperationsInput | string
    pending?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    conversation?: ConversationUpdateOneRequiredWithoutMessagesNestedInput
    call?: CallUpdateOneWithoutMessagesNestedInput
    taskSources?: TaskSourceMessageUpdateManyWithoutMessageNestedInput
    knowledgeSources?: KnowledgeSourceMessageUpdateManyWithoutMessageNestedInput
  }

  export type MessageUncheckedUpdateWithoutQuerySourcesInput = {
    id?: StringFieldUpdateOperationsInput | string
    role?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    time?: StringFieldUpdateOperationsInput | string
    pending?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    conversationId?: StringFieldUpdateOperationsInput | string
    callId?: NullableStringFieldUpdateOperationsInput | string | null
    taskSources?: TaskSourceMessageUncheckedUpdateManyWithoutMessageNestedInput
    knowledgeSources?: KnowledgeSourceMessageUncheckedUpdateManyWithoutMessageNestedInput
  }

  export type ConversationCreateWithoutCallsInput = {
    id?: string
    title?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    lastExtractedMessageId?: string | null
    lastExtractedAt?: Date | string | null
    messages?: MessageCreateNestedManyWithoutConversationInput
    history?: HistoryCreateNestedManyWithoutConversationInput
    tasks?: TaskCreateNestedManyWithoutConversationInput
    contact: ContactCreateNestedOneWithoutConversationsInput
    queries?: QueryCreateNestedManyWithoutConversationInput
    emails?: EmailCreateNestedManyWithoutConversationInput
  }

  export type ConversationUncheckedCreateWithoutCallsInput = {
    id?: string
    title?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    lastExtractedMessageId?: string | null
    lastExtractedAt?: Date | string | null
    contactId: string
    messages?: MessageUncheckedCreateNestedManyWithoutConversationInput
    history?: HistoryUncheckedCreateNestedManyWithoutConversationInput
    tasks?: TaskUncheckedCreateNestedManyWithoutConversationInput
    queries?: QueryUncheckedCreateNestedManyWithoutConversationInput
    emails?: EmailUncheckedCreateNestedManyWithoutConversationInput
  }

  export type ConversationCreateOrConnectWithoutCallsInput = {
    where: ConversationWhereUniqueInput
    create: XOR<ConversationCreateWithoutCallsInput, ConversationUncheckedCreateWithoutCallsInput>
  }

  export type ContactCreateWithoutCallsInput = {
    id?: string
    name: string
    business: string
    category: string
    phone: string
    email?: string | null
    initials: string
    color: string
    note?: string | null
    online?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    conversations?: ConversationCreateNestedManyWithoutContactInput
    tasks?: TaskCreateNestedManyWithoutContactInput
    queries?: QueryCreateNestedManyWithoutContactInput
    knowledge?: ContactKnowledgeCreateNestedManyWithoutContactInput
    emails?: EmailCreateNestedManyWithoutContactInput
  }

  export type ContactUncheckedCreateWithoutCallsInput = {
    id?: string
    name: string
    business: string
    category: string
    phone: string
    email?: string | null
    initials: string
    color: string
    note?: string | null
    online?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    conversations?: ConversationUncheckedCreateNestedManyWithoutContactInput
    tasks?: TaskUncheckedCreateNestedManyWithoutContactInput
    queries?: QueryUncheckedCreateNestedManyWithoutContactInput
    knowledge?: ContactKnowledgeUncheckedCreateNestedManyWithoutContactInput
    emails?: EmailUncheckedCreateNestedManyWithoutContactInput
  }

  export type ContactCreateOrConnectWithoutCallsInput = {
    where: ContactWhereUniqueInput
    create: XOR<ContactCreateWithoutCallsInput, ContactUncheckedCreateWithoutCallsInput>
  }

  export type MessageCreateWithoutCallInput = {
    id?: string
    role: string
    content: string
    time: string
    pending?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    conversation: ConversationCreateNestedOneWithoutMessagesInput
    taskSources?: TaskSourceMessageCreateNestedManyWithoutMessageInput
    querySources?: QuerySourceMessageCreateNestedManyWithoutMessageInput
    knowledgeSources?: KnowledgeSourceMessageCreateNestedManyWithoutMessageInput
  }

  export type MessageUncheckedCreateWithoutCallInput = {
    id?: string
    role: string
    content: string
    time: string
    pending?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    conversationId: string
    taskSources?: TaskSourceMessageUncheckedCreateNestedManyWithoutMessageInput
    querySources?: QuerySourceMessageUncheckedCreateNestedManyWithoutMessageInput
    knowledgeSources?: KnowledgeSourceMessageUncheckedCreateNestedManyWithoutMessageInput
  }

  export type MessageCreateOrConnectWithoutCallInput = {
    where: MessageWhereUniqueInput
    create: XOR<MessageCreateWithoutCallInput, MessageUncheckedCreateWithoutCallInput>
  }

  export type MessageCreateManyCallInputEnvelope = {
    data: MessageCreateManyCallInput | MessageCreateManyCallInput[]
    skipDuplicates?: boolean
  }

  export type ConversationUpsertWithoutCallsInput = {
    update: XOR<ConversationUpdateWithoutCallsInput, ConversationUncheckedUpdateWithoutCallsInput>
    create: XOR<ConversationCreateWithoutCallsInput, ConversationUncheckedCreateWithoutCallsInput>
    where?: ConversationWhereInput
  }

  export type ConversationUpdateToOneWithWhereWithoutCallsInput = {
    where?: ConversationWhereInput
    data: XOR<ConversationUpdateWithoutCallsInput, ConversationUncheckedUpdateWithoutCallsInput>
  }

  export type ConversationUpdateWithoutCallsInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    lastExtractedMessageId?: NullableStringFieldUpdateOperationsInput | string | null
    lastExtractedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    messages?: MessageUpdateManyWithoutConversationNestedInput
    history?: HistoryUpdateManyWithoutConversationNestedInput
    tasks?: TaskUpdateManyWithoutConversationNestedInput
    contact?: ContactUpdateOneRequiredWithoutConversationsNestedInput
    queries?: QueryUpdateManyWithoutConversationNestedInput
    emails?: EmailUpdateManyWithoutConversationNestedInput
  }

  export type ConversationUncheckedUpdateWithoutCallsInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    lastExtractedMessageId?: NullableStringFieldUpdateOperationsInput | string | null
    lastExtractedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    contactId?: StringFieldUpdateOperationsInput | string
    messages?: MessageUncheckedUpdateManyWithoutConversationNestedInput
    history?: HistoryUncheckedUpdateManyWithoutConversationNestedInput
    tasks?: TaskUncheckedUpdateManyWithoutConversationNestedInput
    queries?: QueryUncheckedUpdateManyWithoutConversationNestedInput
    emails?: EmailUncheckedUpdateManyWithoutConversationNestedInput
  }

  export type ContactUpsertWithoutCallsInput = {
    update: XOR<ContactUpdateWithoutCallsInput, ContactUncheckedUpdateWithoutCallsInput>
    create: XOR<ContactCreateWithoutCallsInput, ContactUncheckedCreateWithoutCallsInput>
    where?: ContactWhereInput
  }

  export type ContactUpdateToOneWithWhereWithoutCallsInput = {
    where?: ContactWhereInput
    data: XOR<ContactUpdateWithoutCallsInput, ContactUncheckedUpdateWithoutCallsInput>
  }

  export type ContactUpdateWithoutCallsInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    business?: StringFieldUpdateOperationsInput | string
    category?: StringFieldUpdateOperationsInput | string
    phone?: StringFieldUpdateOperationsInput | string
    email?: NullableStringFieldUpdateOperationsInput | string | null
    initials?: StringFieldUpdateOperationsInput | string
    color?: StringFieldUpdateOperationsInput | string
    note?: NullableStringFieldUpdateOperationsInput | string | null
    online?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    conversations?: ConversationUpdateManyWithoutContactNestedInput
    tasks?: TaskUpdateManyWithoutContactNestedInput
    queries?: QueryUpdateManyWithoutContactNestedInput
    knowledge?: ContactKnowledgeUpdateManyWithoutContactNestedInput
    emails?: EmailUpdateManyWithoutContactNestedInput
  }

  export type ContactUncheckedUpdateWithoutCallsInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    business?: StringFieldUpdateOperationsInput | string
    category?: StringFieldUpdateOperationsInput | string
    phone?: StringFieldUpdateOperationsInput | string
    email?: NullableStringFieldUpdateOperationsInput | string | null
    initials?: StringFieldUpdateOperationsInput | string
    color?: StringFieldUpdateOperationsInput | string
    note?: NullableStringFieldUpdateOperationsInput | string | null
    online?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    conversations?: ConversationUncheckedUpdateManyWithoutContactNestedInput
    tasks?: TaskUncheckedUpdateManyWithoutContactNestedInput
    queries?: QueryUncheckedUpdateManyWithoutContactNestedInput
    knowledge?: ContactKnowledgeUncheckedUpdateManyWithoutContactNestedInput
    emails?: EmailUncheckedUpdateManyWithoutContactNestedInput
  }

  export type MessageUpsertWithWhereUniqueWithoutCallInput = {
    where: MessageWhereUniqueInput
    update: XOR<MessageUpdateWithoutCallInput, MessageUncheckedUpdateWithoutCallInput>
    create: XOR<MessageCreateWithoutCallInput, MessageUncheckedCreateWithoutCallInput>
  }

  export type MessageUpdateWithWhereUniqueWithoutCallInput = {
    where: MessageWhereUniqueInput
    data: XOR<MessageUpdateWithoutCallInput, MessageUncheckedUpdateWithoutCallInput>
  }

  export type MessageUpdateManyWithWhereWithoutCallInput = {
    where: MessageScalarWhereInput
    data: XOR<MessageUpdateManyMutationInput, MessageUncheckedUpdateManyWithoutCallInput>
  }

  export type ConversationCreateWithoutEmailsInput = {
    id?: string
    title?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    lastExtractedMessageId?: string | null
    lastExtractedAt?: Date | string | null
    messages?: MessageCreateNestedManyWithoutConversationInput
    history?: HistoryCreateNestedManyWithoutConversationInput
    tasks?: TaskCreateNestedManyWithoutConversationInput
    contact: ContactCreateNestedOneWithoutConversationsInput
    queries?: QueryCreateNestedManyWithoutConversationInput
    calls?: CallCreateNestedManyWithoutConversationInput
  }

  export type ConversationUncheckedCreateWithoutEmailsInput = {
    id?: string
    title?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    lastExtractedMessageId?: string | null
    lastExtractedAt?: Date | string | null
    contactId: string
    messages?: MessageUncheckedCreateNestedManyWithoutConversationInput
    history?: HistoryUncheckedCreateNestedManyWithoutConversationInput
    tasks?: TaskUncheckedCreateNestedManyWithoutConversationInput
    queries?: QueryUncheckedCreateNestedManyWithoutConversationInput
    calls?: CallUncheckedCreateNestedManyWithoutConversationInput
  }

  export type ConversationCreateOrConnectWithoutEmailsInput = {
    where: ConversationWhereUniqueInput
    create: XOR<ConversationCreateWithoutEmailsInput, ConversationUncheckedCreateWithoutEmailsInput>
  }

  export type ContactCreateWithoutEmailsInput = {
    id?: string
    name: string
    business: string
    category: string
    phone: string
    email?: string | null
    initials: string
    color: string
    note?: string | null
    online?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    conversations?: ConversationCreateNestedManyWithoutContactInput
    tasks?: TaskCreateNestedManyWithoutContactInput
    queries?: QueryCreateNestedManyWithoutContactInput
    knowledge?: ContactKnowledgeCreateNestedManyWithoutContactInput
    calls?: CallCreateNestedManyWithoutContactInput
  }

  export type ContactUncheckedCreateWithoutEmailsInput = {
    id?: string
    name: string
    business: string
    category: string
    phone: string
    email?: string | null
    initials: string
    color: string
    note?: string | null
    online?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    conversations?: ConversationUncheckedCreateNestedManyWithoutContactInput
    tasks?: TaskUncheckedCreateNestedManyWithoutContactInput
    queries?: QueryUncheckedCreateNestedManyWithoutContactInput
    knowledge?: ContactKnowledgeUncheckedCreateNestedManyWithoutContactInput
    calls?: CallUncheckedCreateNestedManyWithoutContactInput
  }

  export type ContactCreateOrConnectWithoutEmailsInput = {
    where: ContactWhereUniqueInput
    create: XOR<ContactCreateWithoutEmailsInput, ContactUncheckedCreateWithoutEmailsInput>
  }

  export type ConversationUpsertWithoutEmailsInput = {
    update: XOR<ConversationUpdateWithoutEmailsInput, ConversationUncheckedUpdateWithoutEmailsInput>
    create: XOR<ConversationCreateWithoutEmailsInput, ConversationUncheckedCreateWithoutEmailsInput>
    where?: ConversationWhereInput
  }

  export type ConversationUpdateToOneWithWhereWithoutEmailsInput = {
    where?: ConversationWhereInput
    data: XOR<ConversationUpdateWithoutEmailsInput, ConversationUncheckedUpdateWithoutEmailsInput>
  }

  export type ConversationUpdateWithoutEmailsInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    lastExtractedMessageId?: NullableStringFieldUpdateOperationsInput | string | null
    lastExtractedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    messages?: MessageUpdateManyWithoutConversationNestedInput
    history?: HistoryUpdateManyWithoutConversationNestedInput
    tasks?: TaskUpdateManyWithoutConversationNestedInput
    contact?: ContactUpdateOneRequiredWithoutConversationsNestedInput
    queries?: QueryUpdateManyWithoutConversationNestedInput
    calls?: CallUpdateManyWithoutConversationNestedInput
  }

  export type ConversationUncheckedUpdateWithoutEmailsInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    lastExtractedMessageId?: NullableStringFieldUpdateOperationsInput | string | null
    lastExtractedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    contactId?: StringFieldUpdateOperationsInput | string
    messages?: MessageUncheckedUpdateManyWithoutConversationNestedInput
    history?: HistoryUncheckedUpdateManyWithoutConversationNestedInput
    tasks?: TaskUncheckedUpdateManyWithoutConversationNestedInput
    queries?: QueryUncheckedUpdateManyWithoutConversationNestedInput
    calls?: CallUncheckedUpdateManyWithoutConversationNestedInput
  }

  export type ContactUpsertWithoutEmailsInput = {
    update: XOR<ContactUpdateWithoutEmailsInput, ContactUncheckedUpdateWithoutEmailsInput>
    create: XOR<ContactCreateWithoutEmailsInput, ContactUncheckedCreateWithoutEmailsInput>
    where?: ContactWhereInput
  }

  export type ContactUpdateToOneWithWhereWithoutEmailsInput = {
    where?: ContactWhereInput
    data: XOR<ContactUpdateWithoutEmailsInput, ContactUncheckedUpdateWithoutEmailsInput>
  }

  export type ContactUpdateWithoutEmailsInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    business?: StringFieldUpdateOperationsInput | string
    category?: StringFieldUpdateOperationsInput | string
    phone?: StringFieldUpdateOperationsInput | string
    email?: NullableStringFieldUpdateOperationsInput | string | null
    initials?: StringFieldUpdateOperationsInput | string
    color?: StringFieldUpdateOperationsInput | string
    note?: NullableStringFieldUpdateOperationsInput | string | null
    online?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    conversations?: ConversationUpdateManyWithoutContactNestedInput
    tasks?: TaskUpdateManyWithoutContactNestedInput
    queries?: QueryUpdateManyWithoutContactNestedInput
    knowledge?: ContactKnowledgeUpdateManyWithoutContactNestedInput
    calls?: CallUpdateManyWithoutContactNestedInput
  }

  export type ContactUncheckedUpdateWithoutEmailsInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    business?: StringFieldUpdateOperationsInput | string
    category?: StringFieldUpdateOperationsInput | string
    phone?: StringFieldUpdateOperationsInput | string
    email?: NullableStringFieldUpdateOperationsInput | string | null
    initials?: StringFieldUpdateOperationsInput | string
    color?: StringFieldUpdateOperationsInput | string
    note?: NullableStringFieldUpdateOperationsInput | string | null
    online?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    conversations?: ConversationUncheckedUpdateManyWithoutContactNestedInput
    tasks?: TaskUncheckedUpdateManyWithoutContactNestedInput
    queries?: QueryUncheckedUpdateManyWithoutContactNestedInput
    knowledge?: ContactKnowledgeUncheckedUpdateManyWithoutContactNestedInput
    calls?: CallUncheckedUpdateManyWithoutContactNestedInput
  }

  export type ContactCreateWithoutKnowledgeInput = {
    id?: string
    name: string
    business: string
    category: string
    phone: string
    email?: string | null
    initials: string
    color: string
    note?: string | null
    online?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    conversations?: ConversationCreateNestedManyWithoutContactInput
    tasks?: TaskCreateNestedManyWithoutContactInput
    queries?: QueryCreateNestedManyWithoutContactInput
    calls?: CallCreateNestedManyWithoutContactInput
    emails?: EmailCreateNestedManyWithoutContactInput
  }

  export type ContactUncheckedCreateWithoutKnowledgeInput = {
    id?: string
    name: string
    business: string
    category: string
    phone: string
    email?: string | null
    initials: string
    color: string
    note?: string | null
    online?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    conversations?: ConversationUncheckedCreateNestedManyWithoutContactInput
    tasks?: TaskUncheckedCreateNestedManyWithoutContactInput
    queries?: QueryUncheckedCreateNestedManyWithoutContactInput
    calls?: CallUncheckedCreateNestedManyWithoutContactInput
    emails?: EmailUncheckedCreateNestedManyWithoutContactInput
  }

  export type ContactCreateOrConnectWithoutKnowledgeInput = {
    where: ContactWhereUniqueInput
    create: XOR<ContactCreateWithoutKnowledgeInput, ContactUncheckedCreateWithoutKnowledgeInput>
  }

  export type KnowledgeSourceMessageCreateWithoutKnowledgeInput = {
    id?: string
    role: string
    message: MessageCreateNestedOneWithoutKnowledgeSourcesInput
  }

  export type KnowledgeSourceMessageUncheckedCreateWithoutKnowledgeInput = {
    id?: string
    messageId: string
    role: string
  }

  export type KnowledgeSourceMessageCreateOrConnectWithoutKnowledgeInput = {
    where: KnowledgeSourceMessageWhereUniqueInput
    create: XOR<KnowledgeSourceMessageCreateWithoutKnowledgeInput, KnowledgeSourceMessageUncheckedCreateWithoutKnowledgeInput>
  }

  export type KnowledgeSourceMessageCreateManyKnowledgeInputEnvelope = {
    data: KnowledgeSourceMessageCreateManyKnowledgeInput | KnowledgeSourceMessageCreateManyKnowledgeInput[]
    skipDuplicates?: boolean
  }

  export type ContactUpsertWithoutKnowledgeInput = {
    update: XOR<ContactUpdateWithoutKnowledgeInput, ContactUncheckedUpdateWithoutKnowledgeInput>
    create: XOR<ContactCreateWithoutKnowledgeInput, ContactUncheckedCreateWithoutKnowledgeInput>
    where?: ContactWhereInput
  }

  export type ContactUpdateToOneWithWhereWithoutKnowledgeInput = {
    where?: ContactWhereInput
    data: XOR<ContactUpdateWithoutKnowledgeInput, ContactUncheckedUpdateWithoutKnowledgeInput>
  }

  export type ContactUpdateWithoutKnowledgeInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    business?: StringFieldUpdateOperationsInput | string
    category?: StringFieldUpdateOperationsInput | string
    phone?: StringFieldUpdateOperationsInput | string
    email?: NullableStringFieldUpdateOperationsInput | string | null
    initials?: StringFieldUpdateOperationsInput | string
    color?: StringFieldUpdateOperationsInput | string
    note?: NullableStringFieldUpdateOperationsInput | string | null
    online?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    conversations?: ConversationUpdateManyWithoutContactNestedInput
    tasks?: TaskUpdateManyWithoutContactNestedInput
    queries?: QueryUpdateManyWithoutContactNestedInput
    calls?: CallUpdateManyWithoutContactNestedInput
    emails?: EmailUpdateManyWithoutContactNestedInput
  }

  export type ContactUncheckedUpdateWithoutKnowledgeInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    business?: StringFieldUpdateOperationsInput | string
    category?: StringFieldUpdateOperationsInput | string
    phone?: StringFieldUpdateOperationsInput | string
    email?: NullableStringFieldUpdateOperationsInput | string | null
    initials?: StringFieldUpdateOperationsInput | string
    color?: StringFieldUpdateOperationsInput | string
    note?: NullableStringFieldUpdateOperationsInput | string | null
    online?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    conversations?: ConversationUncheckedUpdateManyWithoutContactNestedInput
    tasks?: TaskUncheckedUpdateManyWithoutContactNestedInput
    queries?: QueryUncheckedUpdateManyWithoutContactNestedInput
    calls?: CallUncheckedUpdateManyWithoutContactNestedInput
    emails?: EmailUncheckedUpdateManyWithoutContactNestedInput
  }

  export type KnowledgeSourceMessageUpsertWithWhereUniqueWithoutKnowledgeInput = {
    where: KnowledgeSourceMessageWhereUniqueInput
    update: XOR<KnowledgeSourceMessageUpdateWithoutKnowledgeInput, KnowledgeSourceMessageUncheckedUpdateWithoutKnowledgeInput>
    create: XOR<KnowledgeSourceMessageCreateWithoutKnowledgeInput, KnowledgeSourceMessageUncheckedCreateWithoutKnowledgeInput>
  }

  export type KnowledgeSourceMessageUpdateWithWhereUniqueWithoutKnowledgeInput = {
    where: KnowledgeSourceMessageWhereUniqueInput
    data: XOR<KnowledgeSourceMessageUpdateWithoutKnowledgeInput, KnowledgeSourceMessageUncheckedUpdateWithoutKnowledgeInput>
  }

  export type KnowledgeSourceMessageUpdateManyWithWhereWithoutKnowledgeInput = {
    where: KnowledgeSourceMessageScalarWhereInput
    data: XOR<KnowledgeSourceMessageUpdateManyMutationInput, KnowledgeSourceMessageUncheckedUpdateManyWithoutKnowledgeInput>
  }

  export type ContactKnowledgeCreateWithoutSourcesInput = {
    id?: string
    category: string
    key: string
    value: string
    confidence?: number
    status?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    contact: ContactCreateNestedOneWithoutKnowledgeInput
  }

  export type ContactKnowledgeUncheckedCreateWithoutSourcesInput = {
    id?: string
    contactId: string
    category: string
    key: string
    value: string
    confidence?: number
    status?: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ContactKnowledgeCreateOrConnectWithoutSourcesInput = {
    where: ContactKnowledgeWhereUniqueInput
    create: XOR<ContactKnowledgeCreateWithoutSourcesInput, ContactKnowledgeUncheckedCreateWithoutSourcesInput>
  }

  export type MessageCreateWithoutKnowledgeSourcesInput = {
    id?: string
    role: string
    content: string
    time: string
    pending?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    conversation: ConversationCreateNestedOneWithoutMessagesInput
    call?: CallCreateNestedOneWithoutMessagesInput
    taskSources?: TaskSourceMessageCreateNestedManyWithoutMessageInput
    querySources?: QuerySourceMessageCreateNestedManyWithoutMessageInput
  }

  export type MessageUncheckedCreateWithoutKnowledgeSourcesInput = {
    id?: string
    role: string
    content: string
    time: string
    pending?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    conversationId: string
    callId?: string | null
    taskSources?: TaskSourceMessageUncheckedCreateNestedManyWithoutMessageInput
    querySources?: QuerySourceMessageUncheckedCreateNestedManyWithoutMessageInput
  }

  export type MessageCreateOrConnectWithoutKnowledgeSourcesInput = {
    where: MessageWhereUniqueInput
    create: XOR<MessageCreateWithoutKnowledgeSourcesInput, MessageUncheckedCreateWithoutKnowledgeSourcesInput>
  }

  export type ContactKnowledgeUpsertWithoutSourcesInput = {
    update: XOR<ContactKnowledgeUpdateWithoutSourcesInput, ContactKnowledgeUncheckedUpdateWithoutSourcesInput>
    create: XOR<ContactKnowledgeCreateWithoutSourcesInput, ContactKnowledgeUncheckedCreateWithoutSourcesInput>
    where?: ContactKnowledgeWhereInput
  }

  export type ContactKnowledgeUpdateToOneWithWhereWithoutSourcesInput = {
    where?: ContactKnowledgeWhereInput
    data: XOR<ContactKnowledgeUpdateWithoutSourcesInput, ContactKnowledgeUncheckedUpdateWithoutSourcesInput>
  }

  export type ContactKnowledgeUpdateWithoutSourcesInput = {
    id?: StringFieldUpdateOperationsInput | string
    category?: StringFieldUpdateOperationsInput | string
    key?: StringFieldUpdateOperationsInput | string
    value?: StringFieldUpdateOperationsInput | string
    confidence?: FloatFieldUpdateOperationsInput | number
    status?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    contact?: ContactUpdateOneRequiredWithoutKnowledgeNestedInput
  }

  export type ContactKnowledgeUncheckedUpdateWithoutSourcesInput = {
    id?: StringFieldUpdateOperationsInput | string
    contactId?: StringFieldUpdateOperationsInput | string
    category?: StringFieldUpdateOperationsInput | string
    key?: StringFieldUpdateOperationsInput | string
    value?: StringFieldUpdateOperationsInput | string
    confidence?: FloatFieldUpdateOperationsInput | number
    status?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type MessageUpsertWithoutKnowledgeSourcesInput = {
    update: XOR<MessageUpdateWithoutKnowledgeSourcesInput, MessageUncheckedUpdateWithoutKnowledgeSourcesInput>
    create: XOR<MessageCreateWithoutKnowledgeSourcesInput, MessageUncheckedCreateWithoutKnowledgeSourcesInput>
    where?: MessageWhereInput
  }

  export type MessageUpdateToOneWithWhereWithoutKnowledgeSourcesInput = {
    where?: MessageWhereInput
    data: XOR<MessageUpdateWithoutKnowledgeSourcesInput, MessageUncheckedUpdateWithoutKnowledgeSourcesInput>
  }

  export type MessageUpdateWithoutKnowledgeSourcesInput = {
    id?: StringFieldUpdateOperationsInput | string
    role?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    time?: StringFieldUpdateOperationsInput | string
    pending?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    conversation?: ConversationUpdateOneRequiredWithoutMessagesNestedInput
    call?: CallUpdateOneWithoutMessagesNestedInput
    taskSources?: TaskSourceMessageUpdateManyWithoutMessageNestedInput
    querySources?: QuerySourceMessageUpdateManyWithoutMessageNestedInput
  }

  export type MessageUncheckedUpdateWithoutKnowledgeSourcesInput = {
    id?: StringFieldUpdateOperationsInput | string
    role?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    time?: StringFieldUpdateOperationsInput | string
    pending?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    conversationId?: StringFieldUpdateOperationsInput | string
    callId?: NullableStringFieldUpdateOperationsInput | string | null
    taskSources?: TaskSourceMessageUncheckedUpdateManyWithoutMessageNestedInput
    querySources?: QuerySourceMessageUncheckedUpdateManyWithoutMessageNestedInput
  }

  export type ConversationCreateManyContactInput = {
    id?: string
    title?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    lastExtractedMessageId?: string | null
    lastExtractedAt?: Date | string | null
  }

  export type TaskCreateManyContactInput = {
    id?: string
    title: string
    description?: string | null
    status?: string
    priority?: string
    dueDate?: Date | string | null
    confidence?: number
    source?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    completedAt?: Date | string | null
    conversationId: string
  }

  export type QueryCreateManyContactInput = {
    id?: string
    question: string
    answer?: string | null
    status?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    answeredAt?: Date | string | null
    answerMessageId?: string | null
    conversationId: string
  }

  export type ContactKnowledgeCreateManyContactInput = {
    id?: string
    category: string
    key: string
    value: string
    confidence?: number
    status?: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type CallCreateManyContactInput = {
    id?: string
    twilioSid?: string | null
    status?: string
    direction?: string
    duration?: number | null
    startedAt?: Date | string | null
    endedAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    conversationId: string
  }

  export type EmailCreateManyContactInput = {
    id?: string
    twilioSid?: string | null
    status?: string
    direction?: string
    subject: string
    from: string
    to: string
    body?: string | null
    html?: string | null
    sentAt?: Date | string | null
    deliveredAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    conversationId: string
  }

  export type ConversationUpdateWithoutContactInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    lastExtractedMessageId?: NullableStringFieldUpdateOperationsInput | string | null
    lastExtractedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    messages?: MessageUpdateManyWithoutConversationNestedInput
    history?: HistoryUpdateManyWithoutConversationNestedInput
    tasks?: TaskUpdateManyWithoutConversationNestedInput
    queries?: QueryUpdateManyWithoutConversationNestedInput
    calls?: CallUpdateManyWithoutConversationNestedInput
    emails?: EmailUpdateManyWithoutConversationNestedInput
  }

  export type ConversationUncheckedUpdateWithoutContactInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    lastExtractedMessageId?: NullableStringFieldUpdateOperationsInput | string | null
    lastExtractedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    messages?: MessageUncheckedUpdateManyWithoutConversationNestedInput
    history?: HistoryUncheckedUpdateManyWithoutConversationNestedInput
    tasks?: TaskUncheckedUpdateManyWithoutConversationNestedInput
    queries?: QueryUncheckedUpdateManyWithoutConversationNestedInput
    calls?: CallUncheckedUpdateManyWithoutConversationNestedInput
    emails?: EmailUncheckedUpdateManyWithoutConversationNestedInput
  }

  export type ConversationUncheckedUpdateManyWithoutContactInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    lastExtractedMessageId?: NullableStringFieldUpdateOperationsInput | string | null
    lastExtractedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type TaskUpdateWithoutContactInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    priority?: StringFieldUpdateOperationsInput | string
    dueDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    confidence?: FloatFieldUpdateOperationsInput | number
    source?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    conversation?: ConversationUpdateOneRequiredWithoutTasksNestedInput
    sources?: TaskSourceMessageUpdateManyWithoutTaskNestedInput
  }

  export type TaskUncheckedUpdateWithoutContactInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    priority?: StringFieldUpdateOperationsInput | string
    dueDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    confidence?: FloatFieldUpdateOperationsInput | number
    source?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    conversationId?: StringFieldUpdateOperationsInput | string
    sources?: TaskSourceMessageUncheckedUpdateManyWithoutTaskNestedInput
  }

  export type TaskUncheckedUpdateManyWithoutContactInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    priority?: StringFieldUpdateOperationsInput | string
    dueDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    confidence?: FloatFieldUpdateOperationsInput | number
    source?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    conversationId?: StringFieldUpdateOperationsInput | string
  }

  export type QueryUpdateWithoutContactInput = {
    id?: StringFieldUpdateOperationsInput | string
    question?: StringFieldUpdateOperationsInput | string
    answer?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    answeredAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    answerMessageId?: NullableStringFieldUpdateOperationsInput | string | null
    conversation?: ConversationUpdateOneRequiredWithoutQueriesNestedInput
    sources?: QuerySourceMessageUpdateManyWithoutQueryNestedInput
  }

  export type QueryUncheckedUpdateWithoutContactInput = {
    id?: StringFieldUpdateOperationsInput | string
    question?: StringFieldUpdateOperationsInput | string
    answer?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    answeredAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    answerMessageId?: NullableStringFieldUpdateOperationsInput | string | null
    conversationId?: StringFieldUpdateOperationsInput | string
    sources?: QuerySourceMessageUncheckedUpdateManyWithoutQueryNestedInput
  }

  export type QueryUncheckedUpdateManyWithoutContactInput = {
    id?: StringFieldUpdateOperationsInput | string
    question?: StringFieldUpdateOperationsInput | string
    answer?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    answeredAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    answerMessageId?: NullableStringFieldUpdateOperationsInput | string | null
    conversationId?: StringFieldUpdateOperationsInput | string
  }

  export type ContactKnowledgeUpdateWithoutContactInput = {
    id?: StringFieldUpdateOperationsInput | string
    category?: StringFieldUpdateOperationsInput | string
    key?: StringFieldUpdateOperationsInput | string
    value?: StringFieldUpdateOperationsInput | string
    confidence?: FloatFieldUpdateOperationsInput | number
    status?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    sources?: KnowledgeSourceMessageUpdateManyWithoutKnowledgeNestedInput
  }

  export type ContactKnowledgeUncheckedUpdateWithoutContactInput = {
    id?: StringFieldUpdateOperationsInput | string
    category?: StringFieldUpdateOperationsInput | string
    key?: StringFieldUpdateOperationsInput | string
    value?: StringFieldUpdateOperationsInput | string
    confidence?: FloatFieldUpdateOperationsInput | number
    status?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    sources?: KnowledgeSourceMessageUncheckedUpdateManyWithoutKnowledgeNestedInput
  }

  export type ContactKnowledgeUncheckedUpdateManyWithoutContactInput = {
    id?: StringFieldUpdateOperationsInput | string
    category?: StringFieldUpdateOperationsInput | string
    key?: StringFieldUpdateOperationsInput | string
    value?: StringFieldUpdateOperationsInput | string
    confidence?: FloatFieldUpdateOperationsInput | number
    status?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CallUpdateWithoutContactInput = {
    id?: StringFieldUpdateOperationsInput | string
    twilioSid?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    direction?: StringFieldUpdateOperationsInput | string
    duration?: NullableIntFieldUpdateOperationsInput | number | null
    startedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    endedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    conversation?: ConversationUpdateOneRequiredWithoutCallsNestedInput
    messages?: MessageUpdateManyWithoutCallNestedInput
  }

  export type CallUncheckedUpdateWithoutContactInput = {
    id?: StringFieldUpdateOperationsInput | string
    twilioSid?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    direction?: StringFieldUpdateOperationsInput | string
    duration?: NullableIntFieldUpdateOperationsInput | number | null
    startedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    endedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    conversationId?: StringFieldUpdateOperationsInput | string
    messages?: MessageUncheckedUpdateManyWithoutCallNestedInput
  }

  export type CallUncheckedUpdateManyWithoutContactInput = {
    id?: StringFieldUpdateOperationsInput | string
    twilioSid?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    direction?: StringFieldUpdateOperationsInput | string
    duration?: NullableIntFieldUpdateOperationsInput | number | null
    startedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    endedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    conversationId?: StringFieldUpdateOperationsInput | string
  }

  export type EmailUpdateWithoutContactInput = {
    id?: StringFieldUpdateOperationsInput | string
    twilioSid?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    direction?: StringFieldUpdateOperationsInput | string
    subject?: StringFieldUpdateOperationsInput | string
    from?: StringFieldUpdateOperationsInput | string
    to?: StringFieldUpdateOperationsInput | string
    body?: NullableStringFieldUpdateOperationsInput | string | null
    html?: NullableStringFieldUpdateOperationsInput | string | null
    sentAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    deliveredAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    conversation?: ConversationUpdateOneRequiredWithoutEmailsNestedInput
  }

  export type EmailUncheckedUpdateWithoutContactInput = {
    id?: StringFieldUpdateOperationsInput | string
    twilioSid?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    direction?: StringFieldUpdateOperationsInput | string
    subject?: StringFieldUpdateOperationsInput | string
    from?: StringFieldUpdateOperationsInput | string
    to?: StringFieldUpdateOperationsInput | string
    body?: NullableStringFieldUpdateOperationsInput | string | null
    html?: NullableStringFieldUpdateOperationsInput | string | null
    sentAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    deliveredAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    conversationId?: StringFieldUpdateOperationsInput | string
  }

  export type EmailUncheckedUpdateManyWithoutContactInput = {
    id?: StringFieldUpdateOperationsInput | string
    twilioSid?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    direction?: StringFieldUpdateOperationsInput | string
    subject?: StringFieldUpdateOperationsInput | string
    from?: StringFieldUpdateOperationsInput | string
    to?: StringFieldUpdateOperationsInput | string
    body?: NullableStringFieldUpdateOperationsInput | string | null
    html?: NullableStringFieldUpdateOperationsInput | string | null
    sentAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    deliveredAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    conversationId?: StringFieldUpdateOperationsInput | string
  }

  export type MessageCreateManyConversationInput = {
    id?: string
    role: string
    content: string
    time: string
    pending?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    callId?: string | null
  }

  export type HistoryCreateManyConversationInput = {
    id?: string
    title: string
    detail: string
    status: string
    time: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type TaskCreateManyConversationInput = {
    id?: string
    title: string
    description?: string | null
    status?: string
    priority?: string
    dueDate?: Date | string | null
    confidence?: number
    source?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    completedAt?: Date | string | null
    contactId: string
  }

  export type QueryCreateManyConversationInput = {
    id?: string
    question: string
    answer?: string | null
    status?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    answeredAt?: Date | string | null
    answerMessageId?: string | null
    contactId: string
  }

  export type CallCreateManyConversationInput = {
    id?: string
    twilioSid?: string | null
    status?: string
    direction?: string
    duration?: number | null
    startedAt?: Date | string | null
    endedAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    contactId: string
  }

  export type EmailCreateManyConversationInput = {
    id?: string
    twilioSid?: string | null
    status?: string
    direction?: string
    subject: string
    from: string
    to: string
    body?: string | null
    html?: string | null
    sentAt?: Date | string | null
    deliveredAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    contactId: string
  }

  export type MessageUpdateWithoutConversationInput = {
    id?: StringFieldUpdateOperationsInput | string
    role?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    time?: StringFieldUpdateOperationsInput | string
    pending?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    call?: CallUpdateOneWithoutMessagesNestedInput
    taskSources?: TaskSourceMessageUpdateManyWithoutMessageNestedInput
    querySources?: QuerySourceMessageUpdateManyWithoutMessageNestedInput
    knowledgeSources?: KnowledgeSourceMessageUpdateManyWithoutMessageNestedInput
  }

  export type MessageUncheckedUpdateWithoutConversationInput = {
    id?: StringFieldUpdateOperationsInput | string
    role?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    time?: StringFieldUpdateOperationsInput | string
    pending?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    callId?: NullableStringFieldUpdateOperationsInput | string | null
    taskSources?: TaskSourceMessageUncheckedUpdateManyWithoutMessageNestedInput
    querySources?: QuerySourceMessageUncheckedUpdateManyWithoutMessageNestedInput
    knowledgeSources?: KnowledgeSourceMessageUncheckedUpdateManyWithoutMessageNestedInput
  }

  export type MessageUncheckedUpdateManyWithoutConversationInput = {
    id?: StringFieldUpdateOperationsInput | string
    role?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    time?: StringFieldUpdateOperationsInput | string
    pending?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    callId?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type HistoryUpdateWithoutConversationInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    detail?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    time?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type HistoryUncheckedUpdateWithoutConversationInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    detail?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    time?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type HistoryUncheckedUpdateManyWithoutConversationInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    detail?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    time?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TaskUpdateWithoutConversationInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    priority?: StringFieldUpdateOperationsInput | string
    dueDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    confidence?: FloatFieldUpdateOperationsInput | number
    source?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    contact?: ContactUpdateOneRequiredWithoutTasksNestedInput
    sources?: TaskSourceMessageUpdateManyWithoutTaskNestedInput
  }

  export type TaskUncheckedUpdateWithoutConversationInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    priority?: StringFieldUpdateOperationsInput | string
    dueDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    confidence?: FloatFieldUpdateOperationsInput | number
    source?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    contactId?: StringFieldUpdateOperationsInput | string
    sources?: TaskSourceMessageUncheckedUpdateManyWithoutTaskNestedInput
  }

  export type TaskUncheckedUpdateManyWithoutConversationInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    priority?: StringFieldUpdateOperationsInput | string
    dueDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    confidence?: FloatFieldUpdateOperationsInput | number
    source?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    contactId?: StringFieldUpdateOperationsInput | string
  }

  export type QueryUpdateWithoutConversationInput = {
    id?: StringFieldUpdateOperationsInput | string
    question?: StringFieldUpdateOperationsInput | string
    answer?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    answeredAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    answerMessageId?: NullableStringFieldUpdateOperationsInput | string | null
    contact?: ContactUpdateOneRequiredWithoutQueriesNestedInput
    sources?: QuerySourceMessageUpdateManyWithoutQueryNestedInput
  }

  export type QueryUncheckedUpdateWithoutConversationInput = {
    id?: StringFieldUpdateOperationsInput | string
    question?: StringFieldUpdateOperationsInput | string
    answer?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    answeredAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    answerMessageId?: NullableStringFieldUpdateOperationsInput | string | null
    contactId?: StringFieldUpdateOperationsInput | string
    sources?: QuerySourceMessageUncheckedUpdateManyWithoutQueryNestedInput
  }

  export type QueryUncheckedUpdateManyWithoutConversationInput = {
    id?: StringFieldUpdateOperationsInput | string
    question?: StringFieldUpdateOperationsInput | string
    answer?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    answeredAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    answerMessageId?: NullableStringFieldUpdateOperationsInput | string | null
    contactId?: StringFieldUpdateOperationsInput | string
  }

  export type CallUpdateWithoutConversationInput = {
    id?: StringFieldUpdateOperationsInput | string
    twilioSid?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    direction?: StringFieldUpdateOperationsInput | string
    duration?: NullableIntFieldUpdateOperationsInput | number | null
    startedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    endedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    contact?: ContactUpdateOneRequiredWithoutCallsNestedInput
    messages?: MessageUpdateManyWithoutCallNestedInput
  }

  export type CallUncheckedUpdateWithoutConversationInput = {
    id?: StringFieldUpdateOperationsInput | string
    twilioSid?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    direction?: StringFieldUpdateOperationsInput | string
    duration?: NullableIntFieldUpdateOperationsInput | number | null
    startedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    endedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    contactId?: StringFieldUpdateOperationsInput | string
    messages?: MessageUncheckedUpdateManyWithoutCallNestedInput
  }

  export type CallUncheckedUpdateManyWithoutConversationInput = {
    id?: StringFieldUpdateOperationsInput | string
    twilioSid?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    direction?: StringFieldUpdateOperationsInput | string
    duration?: NullableIntFieldUpdateOperationsInput | number | null
    startedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    endedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    contactId?: StringFieldUpdateOperationsInput | string
  }

  export type EmailUpdateWithoutConversationInput = {
    id?: StringFieldUpdateOperationsInput | string
    twilioSid?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    direction?: StringFieldUpdateOperationsInput | string
    subject?: StringFieldUpdateOperationsInput | string
    from?: StringFieldUpdateOperationsInput | string
    to?: StringFieldUpdateOperationsInput | string
    body?: NullableStringFieldUpdateOperationsInput | string | null
    html?: NullableStringFieldUpdateOperationsInput | string | null
    sentAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    deliveredAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    contact?: ContactUpdateOneRequiredWithoutEmailsNestedInput
  }

  export type EmailUncheckedUpdateWithoutConversationInput = {
    id?: StringFieldUpdateOperationsInput | string
    twilioSid?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    direction?: StringFieldUpdateOperationsInput | string
    subject?: StringFieldUpdateOperationsInput | string
    from?: StringFieldUpdateOperationsInput | string
    to?: StringFieldUpdateOperationsInput | string
    body?: NullableStringFieldUpdateOperationsInput | string | null
    html?: NullableStringFieldUpdateOperationsInput | string | null
    sentAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    deliveredAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    contactId?: StringFieldUpdateOperationsInput | string
  }

  export type EmailUncheckedUpdateManyWithoutConversationInput = {
    id?: StringFieldUpdateOperationsInput | string
    twilioSid?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    direction?: StringFieldUpdateOperationsInput | string
    subject?: StringFieldUpdateOperationsInput | string
    from?: StringFieldUpdateOperationsInput | string
    to?: StringFieldUpdateOperationsInput | string
    body?: NullableStringFieldUpdateOperationsInput | string | null
    html?: NullableStringFieldUpdateOperationsInput | string | null
    sentAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    deliveredAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    contactId?: StringFieldUpdateOperationsInput | string
  }

  export type TaskSourceMessageCreateManyMessageInput = {
    id?: string
    taskId: string
    role: string
  }

  export type QuerySourceMessageCreateManyMessageInput = {
    id?: string
    queryId: string
    role: string
  }

  export type KnowledgeSourceMessageCreateManyMessageInput = {
    id?: string
    knowledgeId: string
    role: string
  }

  export type TaskSourceMessageUpdateWithoutMessageInput = {
    id?: StringFieldUpdateOperationsInput | string
    role?: StringFieldUpdateOperationsInput | string
    task?: TaskUpdateOneRequiredWithoutSourcesNestedInput
  }

  export type TaskSourceMessageUncheckedUpdateWithoutMessageInput = {
    id?: StringFieldUpdateOperationsInput | string
    taskId?: StringFieldUpdateOperationsInput | string
    role?: StringFieldUpdateOperationsInput | string
  }

  export type TaskSourceMessageUncheckedUpdateManyWithoutMessageInput = {
    id?: StringFieldUpdateOperationsInput | string
    taskId?: StringFieldUpdateOperationsInput | string
    role?: StringFieldUpdateOperationsInput | string
  }

  export type QuerySourceMessageUpdateWithoutMessageInput = {
    id?: StringFieldUpdateOperationsInput | string
    role?: StringFieldUpdateOperationsInput | string
    query?: QueryUpdateOneRequiredWithoutSourcesNestedInput
  }

  export type QuerySourceMessageUncheckedUpdateWithoutMessageInput = {
    id?: StringFieldUpdateOperationsInput | string
    queryId?: StringFieldUpdateOperationsInput | string
    role?: StringFieldUpdateOperationsInput | string
  }

  export type QuerySourceMessageUncheckedUpdateManyWithoutMessageInput = {
    id?: StringFieldUpdateOperationsInput | string
    queryId?: StringFieldUpdateOperationsInput | string
    role?: StringFieldUpdateOperationsInput | string
  }

  export type KnowledgeSourceMessageUpdateWithoutMessageInput = {
    id?: StringFieldUpdateOperationsInput | string
    role?: StringFieldUpdateOperationsInput | string
    knowledge?: ContactKnowledgeUpdateOneRequiredWithoutSourcesNestedInput
  }

  export type KnowledgeSourceMessageUncheckedUpdateWithoutMessageInput = {
    id?: StringFieldUpdateOperationsInput | string
    knowledgeId?: StringFieldUpdateOperationsInput | string
    role?: StringFieldUpdateOperationsInput | string
  }

  export type KnowledgeSourceMessageUncheckedUpdateManyWithoutMessageInput = {
    id?: StringFieldUpdateOperationsInput | string
    knowledgeId?: StringFieldUpdateOperationsInput | string
    role?: StringFieldUpdateOperationsInput | string
  }

  export type TaskSourceMessageCreateManyTaskInput = {
    id?: string
    messageId: string
    role: string
  }

  export type TaskSourceMessageUpdateWithoutTaskInput = {
    id?: StringFieldUpdateOperationsInput | string
    role?: StringFieldUpdateOperationsInput | string
    message?: MessageUpdateOneRequiredWithoutTaskSourcesNestedInput
  }

  export type TaskSourceMessageUncheckedUpdateWithoutTaskInput = {
    id?: StringFieldUpdateOperationsInput | string
    messageId?: StringFieldUpdateOperationsInput | string
    role?: StringFieldUpdateOperationsInput | string
  }

  export type TaskSourceMessageUncheckedUpdateManyWithoutTaskInput = {
    id?: StringFieldUpdateOperationsInput | string
    messageId?: StringFieldUpdateOperationsInput | string
    role?: StringFieldUpdateOperationsInput | string
  }

  export type QuerySourceMessageCreateManyQueryInput = {
    id?: string
    messageId: string
    role: string
  }

  export type QuerySourceMessageUpdateWithoutQueryInput = {
    id?: StringFieldUpdateOperationsInput | string
    role?: StringFieldUpdateOperationsInput | string
    message?: MessageUpdateOneRequiredWithoutQuerySourcesNestedInput
  }

  export type QuerySourceMessageUncheckedUpdateWithoutQueryInput = {
    id?: StringFieldUpdateOperationsInput | string
    messageId?: StringFieldUpdateOperationsInput | string
    role?: StringFieldUpdateOperationsInput | string
  }

  export type QuerySourceMessageUncheckedUpdateManyWithoutQueryInput = {
    id?: StringFieldUpdateOperationsInput | string
    messageId?: StringFieldUpdateOperationsInput | string
    role?: StringFieldUpdateOperationsInput | string
  }

  export type MessageCreateManyCallInput = {
    id?: string
    role: string
    content: string
    time: string
    pending?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    conversationId: string
  }

  export type MessageUpdateWithoutCallInput = {
    id?: StringFieldUpdateOperationsInput | string
    role?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    time?: StringFieldUpdateOperationsInput | string
    pending?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    conversation?: ConversationUpdateOneRequiredWithoutMessagesNestedInput
    taskSources?: TaskSourceMessageUpdateManyWithoutMessageNestedInput
    querySources?: QuerySourceMessageUpdateManyWithoutMessageNestedInput
    knowledgeSources?: KnowledgeSourceMessageUpdateManyWithoutMessageNestedInput
  }

  export type MessageUncheckedUpdateWithoutCallInput = {
    id?: StringFieldUpdateOperationsInput | string
    role?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    time?: StringFieldUpdateOperationsInput | string
    pending?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    conversationId?: StringFieldUpdateOperationsInput | string
    taskSources?: TaskSourceMessageUncheckedUpdateManyWithoutMessageNestedInput
    querySources?: QuerySourceMessageUncheckedUpdateManyWithoutMessageNestedInput
    knowledgeSources?: KnowledgeSourceMessageUncheckedUpdateManyWithoutMessageNestedInput
  }

  export type MessageUncheckedUpdateManyWithoutCallInput = {
    id?: StringFieldUpdateOperationsInput | string
    role?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    time?: StringFieldUpdateOperationsInput | string
    pending?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    conversationId?: StringFieldUpdateOperationsInput | string
  }

  export type KnowledgeSourceMessageCreateManyKnowledgeInput = {
    id?: string
    messageId: string
    role: string
  }

  export type KnowledgeSourceMessageUpdateWithoutKnowledgeInput = {
    id?: StringFieldUpdateOperationsInput | string
    role?: StringFieldUpdateOperationsInput | string
    message?: MessageUpdateOneRequiredWithoutKnowledgeSourcesNestedInput
  }

  export type KnowledgeSourceMessageUncheckedUpdateWithoutKnowledgeInput = {
    id?: StringFieldUpdateOperationsInput | string
    messageId?: StringFieldUpdateOperationsInput | string
    role?: StringFieldUpdateOperationsInput | string
  }

  export type KnowledgeSourceMessageUncheckedUpdateManyWithoutKnowledgeInput = {
    id?: StringFieldUpdateOperationsInput | string
    messageId?: StringFieldUpdateOperationsInput | string
    role?: StringFieldUpdateOperationsInput | string
  }



  /**
   * Batch Payload for updateMany & deleteMany & createMany
   */

  export type BatchPayload = {
    count: number
  }

  /**
   * DMMF
   */
  export const dmmf: runtime.BaseDMMF
}