import ApolloClient from 'apollo-client';
import { RepositoryEntity, OrganizationEntity } from '../user-store';
export declare const queryRepositoryIssues: ({ githubClient, organization, repository, }: {
    githubClient: ApolloClient<any>;
    organization: OrganizationEntity;
    repository: RepositoryEntity;
}) => Promise<any[]>;
