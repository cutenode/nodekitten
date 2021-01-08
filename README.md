# nodekitten

> A GitHub App to notify repositories about new Node.js versions

## Usage

Create a new [GitHub Action](https://github.com/features/actions) workflow in your repository, e.g. in `.github/workflows/nodekitten.yml`, with the following content

```
name: Nodekitten
on:
  repository_dispatch:
    types: [nodekitten]

jobs:
  new_version:
    runs-on: ubuntu-latest
    steps:
      - run: "echo \"new Node.js Version: ${{ github.event.client_payload.version }}\""
```

An example for `github.event.client_payload` is

```
{
  date: 2020-09-15,
  libuv: 1.34.2,
  lts: Dubnium,
  npm: 6.14.6,
  openssl: 1.1.1g,
  security: true,
  v8: 6.8.275.32,
  version: v10.22.1
}
```

## How this repository works

An [hourly cron job](.github/workflows/update.yml) is downloading a JSON definition of all Node.js versions from https://nodejs.org/dist/index.json. The file is cached in [`cache/index.json`](cache/index.json). If it changed, a pull request is created (such as [#6](https://github.com/cutenode/nodekitten/pull/6)).

On each push to the `main` branch, the previous version of `cache/index.json` is compared to the new one. If new versions are found, a [repository dispatch event](https://docs.github.com/en/free-pro-team@latest/rest/reference/repos#create-a-repository-dispatch-event) is created for each version in each repository that the [nodekitten app](https://github.com/apps/nodekitten) is installed on.

## LICENSE

[MIT](LICENSE)
