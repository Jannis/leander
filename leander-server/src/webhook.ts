import createWebhookHandler from 'github-webhook-handler'
import { Application } from 'express'
import LRUCache from 'lru-cache'
import { UserStore } from './user-store'

interface WebhookHandlerOptions {
  secret: string
  userStores: LRUCache<string, UserStore>
}

const userStoresForOrganization = (
  userStores: WebhookHandlerOptions['userStores'],
  organization: string,
) =>
  userStores
    .values()
    .filter(userStore =>
      [...userStore.organizations.values()].find(org => org.id === organization),
    )

const userStoresForRepository = (
  userStores: WebhookHandlerOptions['userStores'],
  organization: any,
  repository: any,
) =>
  userStores
    .values()
    .filter(userStore =>
      userStore.repositories.has(
        UserStore.repositoryKey(organization.login, repository.name),
      ),
    )

export const installWebhookHandler = (
  { app, path }: { app: Application; path: string },
  { secret, userStores }: WebhookHandlerOptions,
) => {
  let handler = createWebhookHandler({
    path,
    secret,
  })

  // For a reference of all possible events, see
  // https://developer.github.com/webhooks/#events

  // Handle organization member changes
  handler.on('organization', async event => {
    let { action, membership, organization } = event.payload

    // Do nothing on invitations or when the organization is deleted
    if (action === 'member_invited' || action === 'deleted') {
      return
    }

    // Identify users that have this organization
    let matchingUserStores = userStoresForOrganization(userStores, organization.node_id)

    // Update organization in all of these
    for (let userStore of matchingUserStores) {
      if (action === 'renamed') {
        await userStore.renameOrganization(organization.node_id, organization.login)
      } else if (action === 'member_added') {
        await userStore.addMember(organization.login, membership.login)
      } else if (action === 'member_removed') {
        // Remove the member from the organization
        await userStore.removeMember(organization.login, membership.user.login)

        // Remove the organization and all its data from the previous member's store
        let viewer = await userStore.getViewer()
        if (viewer.login === membership.user.login) {
          await userStore.removeOrganization(organization.login)
        }
      }
    }
  })

  // TODO: Handle user changes (e.g. name, avatar)
  // Question: How? I don't think there's an event for that.

  // Handle repository label changes
  handler.on('label', async event => {
    let { action, label, repository, organization } = event.payload

    // Identify users that have the repository
    let matchingUserStores = userStoresForRepository(userStores, organization, repository)

    // Update these clients by adding/removing/updating the label
    for (let userStore of matchingUserStores) {
      if (action === 'removed') {
        await userStore.removeLabel(organization.login, repository.name, label)
      } else {
        await userStore.updateOrAddLabel(organization.login, repository.name, label)
      }
    }
  })

  // Handle issue changes
  // TODO: Handle issue transfer events properly
  handler.on('issues', async event => {
    let { action, issue, repository, organization } = event.payload

    // Identify users that have the repository
    let matchingUserStores = userStoresForRepository(userStores, organization, repository)

    // Update the issues for these users
    for (let userStore of matchingUserStores) {
      if (action === 'removed') {
        await userStore.removeIssue(organization.login, repository.name, issue)
      } else {
        await userStore.updateOrAddIssue(organization.login, repository.name, issue)
      }
    }
  })

  // Handle issue comment changes
  handler.on('issue_comment', async event => {
    let { issue, repository, organization } = event.payload

    // Identify users that have the repository
    let matchingUserStores = userStoresForRepository(userStores, organization, repository)

    // Update the issues for these users
    for (let userStore of matchingUserStores) {
      await userStore.updateOrAddIssue(organization.login, repository.name, issue)
    }
  })

  app.use(handler)
}
