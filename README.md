# nodekitten

This repository pulls the latest Node versions from https://nodejs.org/dist/index.json using an hourly cronjob. When ever it finds new versions, it creates [repository dispatch events](https://docs.github.com/en/actions/reference/events-that-trigger-workflows#repository_dispatch) for every new node version.

The repository dispatch event name is `nodekitten`. The `client_payload` is

```js
{
  "version": "12.21.0",
  "date": "2021-02-23",
  "npm": "6.14.11",
  "v8": "7.8.279.23",
  "libuv": "1.40.0",
  "openssl": "1.1.1j",
  "lts": "Erbium",
  "security": true
}
```

In order to receive the events on your repository, install the [nodekitten app](https://github.com/apps/nodekitten)
