import { GraphQLResolveInfo, GraphQLScalarType, GraphQLScalarTypeConfig } from 'graphql';
export type Maybe<T> = T | null;
export type RequireFields<T, K extends keyof T> = { [X in Exclude<keyof T, K>]?: T[X] } & { [P in K]-?: NonNullable<T[P]> };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string,
  String: string,
  Boolean: boolean,
  Int: number,
  Float: number,
  /** The `Upload` scalar type represents a file upload. */
  Upload: any,
};


export enum CacheControlScope {
  Public = 'PUBLIC',
  Private = 'PRIVATE'
}

export type Issue = {
   __typename?: 'Issue',
  id: Scalars['ID'],
  repository: Repository,
  number: Scalars['Int'],
  title: Scalars['String'],
  age: Scalars['String'],
  updated: Scalars['String'],
  status: IssueStatus,
  severity?: Maybe<IssueSeverity>,
  priority?: Maybe<IssuePriority>,
  source: IssueSource,
  assigned: Scalars['Boolean'],
  assignees: Array<User>,
  activity: Scalars['Int'],
  triaged: Scalars['Boolean'],
  stage?: Maybe<Scalars['String']>,
  labels: Array<Label>,
  projects: Array<Label>,
  size?: Maybe<Scalars['Int']>,
};

export enum IssuePriority {
  P0 = 'p0',
  P1 = 'p1',
  P2 = 'p2',
  P3 = 'p3'
}

export enum IssueSeverity {
  Bug = 'bug',
  Feature = 'feature'
}

export enum IssueSource {
  Internal = 'internal',
  External = 'external'
}

export enum IssueStatus {
  Open = 'open',
  Closed = 'closed'
}

export type Label = {
   __typename?: 'Label',
  id: Scalars['ID'],
  name: Scalars['String'],
  color: Scalars['String'],
};

export type Organization = {
   __typename?: 'Organization',
  id: Scalars['ID'],
  login: Scalars['String'],
  name?: Maybe<Scalars['String']>,
  members: Array<User>,
  repositories: Array<Repository>,
};


export type OrganizationRepositoriesArgs = {
  names: Array<Scalars['String']>
};

export type Query = {
   __typename?: 'Query',
  user?: Maybe<User>,
  organization?: Maybe<Organization>,
};


export type QueryUserArgs = {
  login?: Maybe<Scalars['String']>
};


export type QueryOrganizationArgs = {
  login: Scalars['String']
};

export type Repository = {
   __typename?: 'Repository',
  id: Scalars['ID'],
  organization: Organization,
  name: Scalars['String'],
  labels: Array<Label>,
  issues: Array<Issue>,
};


export type User = {
   __typename?: 'User',
  id: Scalars['ID'],
  login: Scalars['String'],
  name?: Maybe<Scalars['String']>,
  avatarUrl: Scalars['String'],
};



export type ResolverTypeWrapper<T> = Promise<T> | T;

export type ResolverFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => Promise<TResult> | TResult;


export type StitchingResolver<TResult, TParent, TContext, TArgs> = {
  fragment: string;
  resolve: ResolverFn<TResult, TParent, TContext, TArgs>;
};

export type Resolver<TResult, TParent = {}, TContext = {}, TArgs = {}> =
  | ResolverFn<TResult, TParent, TContext, TArgs>
  | StitchingResolver<TResult, TParent, TContext, TArgs>;

export type SubscriptionSubscribeFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => AsyncIterator<TResult> | Promise<AsyncIterator<TResult>>;

export type SubscriptionResolveFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;

export interface SubscriptionSubscriberObject<TResult, TKey extends string, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<{ [key in TKey]: TResult }, TParent, TContext, TArgs>;
  resolve?: SubscriptionResolveFn<TResult, { [key in TKey]: TResult }, TContext, TArgs>;
}

export interface SubscriptionResolverObject<TResult, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<any, TParent, TContext, TArgs>;
  resolve: SubscriptionResolveFn<TResult, any, TContext, TArgs>;
}

export type SubscriptionObject<TResult, TKey extends string, TParent, TContext, TArgs> =
  | SubscriptionSubscriberObject<TResult, TKey, TParent, TContext, TArgs>
  | SubscriptionResolverObject<TResult, TParent, TContext, TArgs>;

export type SubscriptionResolver<TResult, TKey extends string, TParent = {}, TContext = {}, TArgs = {}> =
  | ((...args: any[]) => SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>)
  | SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>;

export type TypeResolveFn<TTypes, TParent = {}, TContext = {}> = (
  parent: TParent,
  context: TContext,
  info: GraphQLResolveInfo
) => Maybe<TTypes>;

export type NextResolverFn<T> = () => Promise<T>;

export type DirectiveResolverFn<TResult = {}, TParent = {}, TContext = {}, TArgs = {}> = (
  next: NextResolverFn<TResult>,
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;

/** Mapping between all available schema types and the resolvers types */
export type ResolversTypes = {
  Query: ResolverTypeWrapper<{}>,
  String: ResolverTypeWrapper<Scalars['String']>,
  User: ResolverTypeWrapper<User>,
  ID: ResolverTypeWrapper<Scalars['ID']>,
  Organization: ResolverTypeWrapper<Organization>,
  Repository: ResolverTypeWrapper<Repository>,
  Label: ResolverTypeWrapper<Label>,
  Issue: ResolverTypeWrapper<Issue>,
  Int: ResolverTypeWrapper<Scalars['Int']>,
  IssueStatus: IssueStatus,
  IssueSeverity: IssueSeverity,
  IssuePriority: IssuePriority,
  IssueSource: IssueSource,
  Boolean: ResolverTypeWrapper<Scalars['Boolean']>,
  CacheControlScope: CacheControlScope,
  Upload: ResolverTypeWrapper<Scalars['Upload']>,
};

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = {
  Query: {},
  String: Scalars['String'],
  User: User,
  ID: Scalars['ID'],
  Organization: Organization,
  Repository: Repository,
  Label: Label,
  Issue: Issue,
  Int: Scalars['Int'],
  IssueStatus: IssueStatus,
  IssueSeverity: IssueSeverity,
  IssuePriority: IssuePriority,
  IssueSource: IssueSource,
  Boolean: Scalars['Boolean'],
  CacheControlScope: CacheControlScope,
  Upload: Scalars['Upload'],
};

export type CacheControlDirectiveResolver<Result, Parent, ContextType = any, Args = {   maxAge?: Maybe<Maybe<Scalars['Int']>>,
  scope?: Maybe<Maybe<CacheControlScope>> }> = DirectiveResolverFn<Result, Parent, ContextType, Args>;

export type IssueResolvers<ContextType = any, ParentType extends ResolversParentTypes['Issue'] = ResolversParentTypes['Issue']> = {
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>,
  repository?: Resolver<ResolversTypes['Repository'], ParentType, ContextType>,
  number?: Resolver<ResolversTypes['Int'], ParentType, ContextType>,
  title?: Resolver<ResolversTypes['String'], ParentType, ContextType>,
  age?: Resolver<ResolversTypes['String'], ParentType, ContextType>,
  updated?: Resolver<ResolversTypes['String'], ParentType, ContextType>,
  status?: Resolver<ResolversTypes['IssueStatus'], ParentType, ContextType>,
  severity?: Resolver<Maybe<ResolversTypes['IssueSeverity']>, ParentType, ContextType>,
  priority?: Resolver<Maybe<ResolversTypes['IssuePriority']>, ParentType, ContextType>,
  source?: Resolver<ResolversTypes['IssueSource'], ParentType, ContextType>,
  assigned?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>,
  assignees?: Resolver<Array<ResolversTypes['User']>, ParentType, ContextType>,
  activity?: Resolver<ResolversTypes['Int'], ParentType, ContextType>,
  triaged?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>,
  stage?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>,
  labels?: Resolver<Array<ResolversTypes['Label']>, ParentType, ContextType>,
  projects?: Resolver<Array<ResolversTypes['Label']>, ParentType, ContextType>,
  size?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>,
};

export type LabelResolvers<ContextType = any, ParentType extends ResolversParentTypes['Label'] = ResolversParentTypes['Label']> = {
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>,
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>,
  color?: Resolver<ResolversTypes['String'], ParentType, ContextType>,
};

export type OrganizationResolvers<ContextType = any, ParentType extends ResolversParentTypes['Organization'] = ResolversParentTypes['Organization']> = {
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>,
  login?: Resolver<ResolversTypes['String'], ParentType, ContextType>,
  name?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>,
  members?: Resolver<Array<ResolversTypes['User']>, ParentType, ContextType>,
  repositories?: Resolver<Array<ResolversTypes['Repository']>, ParentType, ContextType, RequireFields<OrganizationRepositoriesArgs, 'names'>>,
};

export type QueryResolvers<ContextType = any, ParentType extends ResolversParentTypes['Query'] = ResolversParentTypes['Query']> = {
  user?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType, QueryUserArgs>,
  organization?: Resolver<Maybe<ResolversTypes['Organization']>, ParentType, ContextType, RequireFields<QueryOrganizationArgs, 'login'>>,
};

export type RepositoryResolvers<ContextType = any, ParentType extends ResolversParentTypes['Repository'] = ResolversParentTypes['Repository']> = {
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>,
  organization?: Resolver<ResolversTypes['Organization'], ParentType, ContextType>,
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>,
  labels?: Resolver<Array<ResolversTypes['Label']>, ParentType, ContextType>,
  issues?: Resolver<Array<ResolversTypes['Issue']>, ParentType, ContextType>,
};

export interface UploadScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['Upload'], any> {
  name: 'Upload'
}

export type UserResolvers<ContextType = any, ParentType extends ResolversParentTypes['User'] = ResolversParentTypes['User']> = {
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>,
  login?: Resolver<ResolversTypes['String'], ParentType, ContextType>,
  name?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>,
  avatarUrl?: Resolver<ResolversTypes['String'], ParentType, ContextType>,
};

export type Resolvers<ContextType = any> = {
  Issue?: IssueResolvers<ContextType>,
  Label?: LabelResolvers<ContextType>,
  Organization?: OrganizationResolvers<ContextType>,
  Query?: QueryResolvers<ContextType>,
  Repository?: RepositoryResolvers<ContextType>,
  Upload?: GraphQLScalarType,
  User?: UserResolvers<ContextType>,
};


/**
 * @deprecated
 * Use "Resolvers" root object instead. If you wish to get "IResolvers", add "typesPrefix: I" to your config.
*/
export type IResolvers<ContextType = any> = Resolvers<ContextType>;
export type DirectiveResolvers<ContextType = any> = {
  cacheControl?: CacheControlDirectiveResolver<any, any, ContextType>,
};


/**
* @deprecated
* Use "DirectiveResolvers" root object instead. If you wish to get "IDirectiveResolvers", add "typesPrefix: I" to your config.
*/
export type IDirectiveResolvers<ContextType = any> = DirectiveResolvers<ContextType>;