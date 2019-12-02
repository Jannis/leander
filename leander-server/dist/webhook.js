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
const github_webhook_handler_1 = __importDefault(require("github-webhook-handler"));
const user_store_1 = require("./user-store");
const userStoresForOrganization = (userStores, organization) => userStores
    .values()
    .filter(userStore => [...userStore.organizations.values()].find(org => org.id === organization));
const userStoresForRepository = (userStores, organization, repository) => userStores
    .values()
    .filter(userStore => userStore.repositories.has(user_store_1.UserStore.repositoryKey(organization.login, repository.name)));
exports.installWebhookHandler = ({ app, path }, { secret, userStores }) => {
    let handler = github_webhook_handler_1.default({
        path,
        secret,
    });
    // For a reference of all possible events, see
    // https://developer.github.com/webhooks/#events
    // Handle organization member changes
    handler.on('organization', (event) => __awaiter(void 0, void 0, void 0, function* () {
        let { action, membership, organization } = event.payload;
        // Do nothing on invitations or when the organization is deleted
        if (action === 'member_invited' || action === 'deleted') {
            return;
        }
        // Identify users that have this organization
        let matchingUserStores = userStoresForOrganization(userStores, organization.node_id);
        // Update organization in all of these
        for (let userStore of matchingUserStores) {
            if (action === 'renamed') {
                yield userStore.renameOrganization(organization.node_id, organization.login);
            }
            else if (action === 'member_added') {
                yield userStore.addMember(organization.login, membership.login);
            }
            else if (action === 'member_removed') {
                // Remove the member from the organization
                yield userStore.removeMember(organization.login, membership.user.login);
                // Remove the organization and all its data from the previous member's store
                let viewer = yield userStore.getViewer();
                if (viewer.login === membership.user.login) {
                    yield userStore.removeOrganization(organization.login);
                }
            }
        }
    }));
    // TODO: Handle user changes (e.g. name, avatar)
    // Question: How? I don't think there's an event for that.
    // Handle repository label changes
    handler.on('label', (event) => __awaiter(void 0, void 0, void 0, function* () {
        let { action, label, repository, organization } = event.payload;
        // Identify users that have the repository
        let matchingUserStores = userStoresForRepository(userStores, organization, repository);
        // Update these clients by adding/removing/updating the label
        for (let userStore of matchingUserStores) {
            if (action === 'removed') {
                yield userStore.removeLabel(organization.login, repository.name, label);
            }
            else {
                yield userStore.updateOrAddLabel(organization.login, repository.name, label);
            }
        }
    }));
    // Handle issue changes
    // TODO: Handle issue transfer events properly
    handler.on('issues', (event) => __awaiter(void 0, void 0, void 0, function* () {
        let { action, issue, repository, organization } = event.payload;
        // Identify users that have the repository
        let matchingUserStores = userStoresForRepository(userStores, organization, repository);
        // Update the issues for these users
        for (let userStore of matchingUserStores) {
            if (action === 'removed') {
                yield userStore.removeIssue(organization.login, repository.name, issue);
            }
            else {
                yield userStore.updateOrAddIssue(organization.login, repository.name, issue);
            }
        }
    }));
    // Handle issue comment changes
    handler.on('issue_comment', (event) => __awaiter(void 0, void 0, void 0, function* () {
        let { issue, repository, organization } = event.payload;
        // Identify users that have the repository
        let matchingUserStores = userStoresForRepository(userStores, organization, repository);
        // Update the issues for these users
        for (let userStore of matchingUserStores) {
            yield userStore.updateOrAddIssue(organization.login, repository.name, issue);
        }
    }));
    app.use(handler);
};
