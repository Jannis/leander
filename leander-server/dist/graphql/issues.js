"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const graphql_tag_1 = __importDefault(require("graphql-tag"));
const ISSUES_QUERY = graphql_tag_1.default `
  query repository($owner: String!, $name: String!, $after: String) {
    repository(owner: $owner, name: $name) {
      id
      issues(first: 100, after: $after, states: [OPEN]) {
        pageInfo {
          hasNextPage
          endCursor
        }
        nodes {
          id
          number
          title
          state
          createdAt
          updatedAt
          author {
            login
            avatarUrl
          }
          labels(first: 100) {
            nodes {
              id
              name
              color
            }
          }
          assignees(first: 100) {
            nodes {
              id
              login
              name
              avatarUrl
            }
          }
          comments(first: 1) {
            totalCount
          }
        }
      }
    }
  }
`;
exports.queryRepositoryIssues = ({ githubClient, organization, repository, }) => __awaiter(void 0, void 0, void 0, function* () {
    let pageInfo = { hasNextPage: true, endCursor: null };
    let issues = [];
    let counter = 0;
    while (pageInfo.hasNextPage) {
        console.log('Query issues', organization.login, repository.name, 'page', counter);
        counter += 1;
        let { errors, data } = yield githubClient.query({
            query: ISSUES_QUERY,
            variables: {
                owner: organization.login,
                name: repository.name,
                after: pageInfo.endCursor,
            },
        });
        if (errors) {
            throw errors;
        }
        if (data) {
            issues.push(...data.repository.issues.nodes);
        }
        pageInfo = data.repository.issues.pageInfo;
    }
    return issues;
});
