import ApolloClient from 'apollo-client';
import { Organization, Repository, Issue, User } from './generated/graphql/types';
export declare type UserEntity = User;
export declare type OrganizationEntity = Omit<Organization, 'members' | 'repositories'> & {
    members: string[];
};
export declare type RepositoryEntity = Omit<Repository, 'organization' | 'issues'> & {
    organization: string;
};
export declare type IssueEntity = Omit<Issue, 'repository' | 'assignees'> & {
    assignees: string[];
};
export declare const parseUser: (node: any) => User;
export declare const parseOrganization: (node: any) => {
    organization: OrganizationEntity;
    users: User[];
};
export declare const parseRepository: ({ node, organization, }: {
    node: any;
    organization: OrganizationEntity;
}) => RepositoryEntity;
export declare const parseIssue: ({ node, organizationMembers, repository, }: {
    node: any;
    organizationMembers: User[];
    repository: RepositoryEntity;
}) => {
    issue: IssueEntity;
    users: User[];
};
export declare const parseIssueFromWebhook: ({ data, organizationMembers, repository, }: {
    data: any;
    organizationMembers: User[];
    repository: RepositoryEntity;
}) => {
    issue: IssueEntity;
    users: User[];
};
export declare class UserStore {
    viewer: User | undefined;
    users: Map<string, UserEntity>;
    organizations: Map<string, OrganizationEntity>;
    repositories: Map<string, RepositoryEntity>;
    issues: Map<string, IssueEntity[]>;
    githubClient: ApolloClient<any>;
    constructor(githubClient: ApolloClient<any>);
    static repositoryKey(owner: string, name: string): string;
    getUser(login: string): Promise<UserEntity>;
    getViewer(): Promise<UserEntity>;
    getOrganization(login: string): Promise<OrganizationEntity>;
    getRepository(organization: OrganizationEntity, name: string): Promise<RepositoryEntity>;
    getIssues(repository: RepositoryEntity): Promise<IssueEntity[]>;
    updateOrAddUser(user: UserEntity): Promise<void>;
    removeOrganization(organizationLogin: string): Promise<void>;
    renameOrganization(organizationId: string, newLogin: string): Promise<void>;
    addMember(organizationLogin: string, userLogin: string): Promise<void>;
    removeMember(organizationLogin: string, userLogin: string): Promise<void>;
    removeLabel(organizationLogin: string, repositoryName: string, data: any): Promise<void>;
    updateOrAddLabel(organizationLogin: string, repositoryName: string, data: any): Promise<void>;
    removeIssue(organizationLogin: string, repositoryName: string, data: any): Promise<void>;
    updateOrAddIssue(organizationLogin: string, repositoryName: string, data: any): Promise<void>;
}
