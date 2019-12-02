# Leander

Efficient and transparent management of GitHub issues.

![Screenshot](https://raw.githubusercontent.com/Jannis/leander/master/public/screenshot.png)

## Build Instructions

```sh
# Install dependencies
yarn \

# Build the server
cd leander-server \
  && yarn build \
  && cd ..

# Build and run the client
 cd leander-app \
  && yarn build \
  && yarn start
```

During development both client and server can be run with

```sh
yarn dev
```

## Todo

- [x] Authentication via GitHub App
- [x] Configuration
  - [x] `useConfig` hook
  - [x] Load config from `?config` URL parameter
  - [x] Configuration spec as a GraphQL schema
  - [x] Validate configuration
- [x] Navigation
  - [x] Project
  - [x] Repositories
  - [x] Pages
- [ ] Issues
  - [x] Data model
  - [x] Metrics model
  - [x] Load issues
  - [x] Compute metrics
- [ ] Components
  - [x] `IssueTable` component
  - [ ] `IssueActions` component for actions
    - [x] Set severity
    - [-] Set priority
      - [ ] Add priority labels if they don't exist in the repo
    - [x] Set assignees
    - [-] Set projects
      - [ ] Add project labels if they don't exist in the repo
    - [ ] Close issue with a comment
  - [ ] Views
    - [x] Flat list
    - [x] Grouped by e.g. label or assignee
    - [ ] Charts

## License

&copy; 2019 Jannis Pohlmann. Licensed under the [MIT license](LICENSE).
