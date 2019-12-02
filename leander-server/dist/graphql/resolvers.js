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
Object.defineProperty(exports, "__esModule", { value: true });
const apollo_server_1 = require("apollo-server");
const authorizedResolver = (resolver) => {
    return (parent, args, ctx, info) => {
        if (!ctx.userStore) {
            throw new apollo_server_1.ApolloError('Unauthorized');
        }
        return resolver(parent, args, ctx, info);
    };
};
const resolvers = {
    Query: {
        user: authorizedResolver((_, { login }, { userStore }) => __awaiter(void 0, void 0, void 0, function* () { return login ? yield userStore.getUser(login) : yield userStore.getViewer(); })),
        organization: authorizedResolver((_, { login }, { userStore }) => __awaiter(void 0, void 0, void 0, function* () { return yield userStore.getOrganization(login); })),
    },
    Organization: {
        members: authorizedResolver((organization, _, { userStore }) => __awaiter(void 0, void 0, void 0, function* () {
            return yield Promise.all(organization.members.map((login) => __awaiter(void 0, void 0, void 0, function* () { return yield userStore.getUser(login); })));
        })),
        repositories: authorizedResolver((organization, { names }, { userStore }) => __awaiter(void 0, void 0, void 0, function* () {
            return yield Promise.all(names.map((name) => __awaiter(void 0, void 0, void 0, function* () { return yield userStore.getRepository(organization, name); })));
        })),
    },
    Repository: {
        organization: authorizedResolver((repository, _, { userStore }) => __awaiter(void 0, void 0, void 0, function* () { return yield userStore.getOrganization(repository.organization); })),
        issues: authorizedResolver((repository, _, { userStore }) => __awaiter(void 0, void 0, void 0, function* () { return yield userStore.getIssues(repository); })),
    },
    Issue: {
        assignees: authorizedResolver((issue, _, { userStore }) => __awaiter(void 0, void 0, void 0, function* () {
            return yield Promise.all(issue.assignees.map((login) => __awaiter(void 0, void 0, void 0, function* () { return yield userStore.getUser(login); })));
        })),
    },
};
exports.default = resolvers;
