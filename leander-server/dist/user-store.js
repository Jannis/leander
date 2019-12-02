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
const types_1 = require("./generated/graphql/types");
const issues_1 = require("./graphql/issues");
const moment = require("moment");
const USER_QUERY = graphql_tag_1.default `
  query user($login: String!) {
    user(login: $login) {
      id
      login
      name
      avatarUrl
    }
  }
`;
const VIEWER_QUERY = graphql_tag_1.default `
  {
    viewer {
      id
      login
      name
      avatarUrl
    }
  }
`;
const ORGANIZATION_QUERY = graphql_tag_1.default `
  query organization($login: String!) {
    organization(login: $login) {
      id
      login
      name
      membersWithRole(first: 100) {
        nodes {
          id
          login
          name
          avatarUrl
        }
      }
    }
  }
`;
const REPOSITORY_QUERY = graphql_tag_1.default `
  query repository($owner: String!, $name: String!) {
    repository(owner: $owner, name: $name) {
      id
      name
      labels(first: 100) {
        nodes {
          id
          name
          color
        }
      }
    }
  }
`;
exports.parseUser = (node) => ({
    id: node.id,
    login: node.login,
    name: node.name || undefined,
    avatarUrl: node.avatarUrl,
});
exports.parseOrganization = (node) => {
    let members = node.membersWithRole.nodes.map(exports.parseUser);
    let organization = {
        id: node.id,
        login: node.login,
        name: node.name,
        members: members.map(member => member.login),
    };
    return { organization, users: members };
};
exports.parseRepository = ({ node, organization, }) => ({
    id: node.id,
    name: node.name,
    labels: node.labels.nodes,
    organization: organization.login,
});
const hasLabel = (labels, name) => labels.find(label => label.name === name) !== undefined;
const matchingLabel = (labels, prefix) => labels.find(label => label.name.match(prefix));
const matchingLabels = (labels, prefix) => labels.filter(label => label.name.match(prefix));
const parseSeverity = (labels) => hasLabel(labels, 'bug')
    ? types_1.IssueSeverity.Bug
    : hasLabel(labels, 'enhancement')
        ? types_1.IssueSeverity.Feature
        : null;
const parseSource = (members, author) => members.find(member => author.login === member.login)
    ? types_1.IssueSource.Internal
    : types_1.IssueSource.External;
const parseSize = (labels) => {
    let prefix = /^size\//;
    let label = matchingLabel(labels, prefix);
    if (label) {
        try {
            return parseInt(label.name.replace(prefix, ''));
        }
        catch (_a) {
            return null;
        }
    }
    else {
        return null;
    }
};
const parseStage = (labels) => {
    let prefix = /^stage\//;
    let label = matchingLabel(labels, prefix);
    if (label) {
        try {
            return label.name.replace(prefix, '');
        }
        catch (_a) {
            return null;
        }
    }
    else {
        return null;
    }
};
const parsePriority = (labels) => hasLabel(labels, 'p0')
    ? types_1.IssuePriority.P0
    : hasLabel(labels, 'p1')
        ? types_1.IssuePriority.P1
        : hasLabel(labels, 'p2')
            ? types_1.IssuePriority.P2
            : hasLabel(labels, 'p3')
                ? types_1.IssuePriority.P3
                : null;
const parseProjects = (labels) => matchingLabels(labels, /^projects?\//);
exports.parseIssue = ({ node, organizationMembers, repository, }) => {
    let author = exports.parseUser(node.author);
    let assignees = node.assignees.nodes.map(exports.parseUser);
    let labels = node.labels.nodes;
    let issue = {
        id: node.id,
        number: node.number,
        title: node.title,
        age: moment()
            .diff(moment(node.createdAt))
            .toString(),
        updated: moment()
            .diff(moment(node.updatedAt))
            .toString(),
        status: node.state === 'CLOSED' ? types_1.IssueStatus.Closed : types_1.IssueStatus.Open,
        assigned: assignees.length > 0,
        assignees: assignees.map(assignee => assignee.login),
        activity: node.comments.totalCount,
        triaged: labels.length > 0,
        labels,
        severity: parseSeverity(labels),
        priority: parsePriority(labels),
        source: parseSource(organizationMembers, author),
        phase: parseStage(labels),
        projects: parseProjects(labels),
        size: parseSize(labels),
    };
    // Don't include the author as authors don't have an ID
    return { issue, users: assignees };
};
const parseUserFromWebhook = (node) => ({
    id: node.node_id,
    login: node.login,
    name: node.name || undefined,
    avatarUrl: node.avatar_url,
});
const parseLabelFromWebhook = (label) => ({
    id: label.node_id,
    name: label.name,
    color: label.color,
});
exports.parseIssueFromWebhook = ({ data, organizationMembers, repository, }) => {
    let author = parseUserFromWebhook(data.user);
    let assignees = data.assignees.map(parseUserFromWebhook);
    let labels = data.labels.map(parseLabelFromWebhook);
    let issue = {
        id: data.node_id,
        number: data.number,
        title: data.title,
        age: moment()
            .diff(moment(data.created_at))
            .toString(),
        updated: moment()
            .diff(moment(data.updated_at))
            .toString(),
        status: data.state === 'closed' ? types_1.IssueStatus.Closed : types_1.IssueStatus.Open,
        assigned: assignees.length > 0,
        assignees: assignees.map(assignee => assignee.login),
        activity: data.comments,
        triaged: labels.length > 0,
        labels,
        severity: parseSeverity(labels),
        priority: parsePriority(labels),
        source: parseSource(organizationMembers, author),
        phase: parseStage(labels),
        projects: parseProjects(labels),
        size: parseSize(labels),
    };
    // Don't include the author because in webhooks they don't include their name
    return { issue, users: assignees };
};
class UserStore {
    constructor(githubClient) {
        this.githubClient = githubClient;
        this.users = new Map();
        this.organizations = new Map();
        this.repositories = new Map();
        this.issues = new Map();
    }
    static repositoryKey(owner, name) {
        return `${owner}:${name}`;
    }
    getUser(login) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.users.has(login)) {
                let { errors, data } = yield this.githubClient.query({
                    query: USER_QUERY,
                    variables: { login },
                });
                if (errors) {
                    throw errors;
                }
                this.users.set(login, exports.parseUser(data.user));
            }
            return this.users.get(login);
        });
    }
    getViewer() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.viewer) {
                let { errors, data } = yield this.githubClient.query({ query: VIEWER_QUERY });
                if (errors) {
                    throw errors;
                }
                this.viewer = exports.parseUser(data.viewer);
            }
            return this.viewer;
        });
    }
    getOrganization(login) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.organizations.has(login)) {
                let { errors, data } = yield this.githubClient.query({
                    query: ORGANIZATION_QUERY,
                    variables: { login },
                });
                if (errors) {
                    throw errors;
                }
                let { organization, users } = exports.parseOrganization(data.organization);
                for (let user of users) {
                    this.updateOrAddUser(user);
                }
                this.organizations.set(login, organization);
            }
            return this.organizations.get(login);
        });
    }
    getRepository(organization, name) {
        return __awaiter(this, void 0, void 0, function* () {
            let key = UserStore.repositoryKey(organization.login, name);
            if (!this.repositories.has(key)) {
                let { errors, data } = yield this.githubClient.query({
                    query: REPOSITORY_QUERY,
                    variables: { owner: organization.login, name },
                });
                if (errors) {
                    throw errors;
                }
                let repository = exports.parseRepository({ node: data.repository, organization });
                this.repositories.set(key, repository);
            }
            return this.repositories.get(key);
        });
    }
    getIssues(repository) {
        return __awaiter(this, void 0, void 0, function* () {
            let organization = yield this.getOrganization(repository.organization);
            let organizationMembers = yield Promise.all(organization.members.map((login) => __awaiter(this, void 0, void 0, function* () { return yield this.getUser(login); })));
            let key = UserStore.repositoryKey(organization.login, repository.name);
            if (!this.issues.has(key)) {
                let issueNodes = yield issues_1.queryRepositoryIssues({
                    organization,
                    repository,
                    githubClient: this.githubClient,
                });
                let issues = [];
                for (let node of issueNodes) {
                    let { issue, users } = exports.parseIssue({ node, organizationMembers, repository });
                    // Save all users
                    for (let user of users) {
                        yield this.updateOrAddUser(user);
                    }
                    issues.push(issue);
                }
                // Save all issues
                this.issues.set(key, issues);
            }
            // Inject the repository into the issues
            return this.issues.get(key);
        });
    }
    updateOrAddUser(user) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.users.has(user.login)) {
                let existing = this.users.get(user.login);
                this.users.set(user.login, Object.assign(Object.assign({}, existing), user));
            }
            else {
                this.users.set(user.login, user);
            }
        });
    }
    removeOrganization(organizationLogin) {
        return __awaiter(this, void 0, void 0, function* () {
            // Drop organization from the store
            this.organizations.delete(organizationLogin);
            // Collect repositories for this organization
            let repositories = [...this.repositories].filter(kv => {
                let [_, repository] = kv;
                return repository.organization === organizationLogin;
            });
            // Delete these repositories
            for (let [key, repository] of repositories) {
                // Delete the repository itself
                this.repositories.delete(key);
                // Delete issues from this repository
                let repositoryKey = UserStore.repositoryKey(organizationLogin, repository.name);
                this.issues.delete(repositoryKey);
            }
        });
    }
    renameOrganization(organizationId, newLogin) {
        return __awaiter(this, void 0, void 0, function* () {
            // Find the organization in the store
            let result = [...this.organizations].find(kv => {
                let [key, org] = kv;
                return org.id === organizationId;
            });
            if (result === undefined) {
                console.warn(`Organization to be renamed (${organizationId}) not found`);
            }
            let [key, _] = result;
            // Remove the organization
            this.organizations.delete(key);
            // Fetch the renamed organization
            let _organization = this.getOrganization(newLogin);
            // Update all matching repositorie to point to the new organization
            for (let repo of this.repositories.values()) {
                repo.organization = newLogin;
            }
        });
    }
    addMember(organizationLogin, userLogin) {
        return __awaiter(this, void 0, void 0, function* () {
            // Make sure we have the new member
            let user = yield this.getUser(userLogin);
            // Add them to the organization (if they aren't already a member)
            let organization = this.organizations.get(organizationLogin);
            if (organization.members.find(member => member === user.login) === undefined) {
                organization.members = [...organization.members, user.login];
            }
        });
    }
    removeMember(organizationLogin, userLogin) {
        return __awaiter(this, void 0, void 0, function* () {
            let organization = this.organizations.get(organizationLogin);
            organization.members = organization.members.filter(member => member !== userLogin);
        });
    }
    removeLabel(organizationLogin, repositoryName, data) {
        return __awaiter(this, void 0, void 0, function* () {
            let organization = yield this.getOrganization(organizationLogin);
            let repository = yield this.getRepository(organization, repositoryName);
            repository.labels = repository.labels.filter(existingLabel => existingLabel.id !== data.node_id);
        });
    }
    updateOrAddLabel(organizationLogin, repositoryName, data) {
        return __awaiter(this, void 0, void 0, function* () {
            let organization = yield this.getOrganization(organizationLogin);
            let repository = yield this.getRepository(organization, repositoryName);
            repository.labels = repository.labels.map(existingLabel => existingLabel.id === data.node_id
                ? Object.assign(Object.assign({}, existingLabel), parseLabelFromWebhook(data)) : existingLabel);
        });
    }
    removeIssue(organizationLogin, repositoryName, data) {
        return __awaiter(this, void 0, void 0, function* () {
            let key = UserStore.repositoryKey(organizationLogin, repositoryName);
            let issues = this.issues.get(key);
            this.issues.set(key, issues.filter(existingIssue => existingIssue.id !== data.node_id));
        });
    }
    updateOrAddIssue(organizationLogin, repositoryName, data) {
        return __awaiter(this, void 0, void 0, function* () {
            let organization = yield this.getOrganization(organizationLogin);
            let organizationMembers = yield Promise.all(organization.members.map((login) => __awaiter(this, void 0, void 0, function* () { return yield this.getUser(login); })));
            let repository = yield this.getRepository(organization, repositoryName);
            let key = UserStore.repositoryKey(organizationLogin, repositoryName);
            let issues = this.issues.get(key);
            let existingIssue = issues.find(existingIssue => existingIssue.id === data.node_id);
            // Parse incoming issue data
            let { issue, users } = exports.parseIssueFromWebhook({
                data,
                organizationMembers,
                repository,
            });
            // Update the users involved in the issue
            for (let user of users) {
                yield this.updateOrAddUser(user);
            }
            if (existingIssue !== undefined) {
                // Merge data into the existing issue
                let updatedIssue = Object.assign(Object.assign({}, existingIssue), issue);
                // Replace the existing issue
                this.issues.set(key, issues.map(issue => (issue.id === updatedIssue.id ? updatedIssue : issue)));
            }
            else {
                issues.push(issue);
            }
        });
    }
}
exports.UserStore = UserStore;
