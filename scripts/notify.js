const { Octokit } = require("@octokit/core");
const { App } = require("@octokit/app");

const APP_ID = process.env.APP_ID;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const EVENT_PAYLOAD = require(process.env.GITHUB_EVENT_PATH);

main();

async function main() {
  const afterCache = require("../cache/index.json");

  try {
    const octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN,
    });

    const [owner, repo] = process.env.GITHUB_REPOSITORY.split("/");
    const requestOptions = await octokit.request.endpoint(
      "GET /repos/{owner}/{repo}/contents/{path}",
      {
        owner,
        repo,
        path: "cache/index.json",
        ref: EVENT_PAYLOAD.before,
        mediaType: {
          format: "raw",
        },
      }
    );

    console.log(requestOptions.method, requestOptions.url);
    const { data: jsonContent } = await octokit.request(requestOptions);

    const beforeCache = JSON.parse(jsonContent);

    const beforeCacheVersions = beforeCache.map((entry) => entry.version);
    const newVersions = afterCache
      .filter((entry) => !beforeCacheVersions.includes(entry.version))
      .map((entry) => {
        return {
          version: entry.version,
          date: entry.date,
          npm: entry.npm,
          v8: entry.v8,
          libuv: entry.uv,
          openssl: entry.openssl,
          lts: entry.lts,
          security: entry.security,
        };
      });

    if (newVersions.length === 0) {
      console.log("No new versions found. Bye.");
      return;
    }

    const app = new App({
      auth: {
        id: APP_ID,
        privateKey: PRIVATE_KEY,
      },
      authStrategy: createAppAuth,
    });

    for await (const { octokit, repository } of app.eachRepository.iterator()) {
      for (const newVersion of newVersions) {
        const options = octokit.request.endpoint.merge(
          "POST /repos/:owner/:repo/dispatches",
          {
            owner: repository.owner.login,
            repo: repository.name,
            event_type: "nodekitten",
            client_payload: newVersion,
          }
        );
        console.log(options);

        await octokit.request(options);
        console.log(
          "Event distpatched for %s and %s",
          full_name,
          newVersion.version
        );
      }
    }
  } catch (error) {
    console.log(error);
    throw error;
  }
}
