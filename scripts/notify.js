const { createAppAuth } = require("@octokit/auth-app");
const { Octokit } = require("@octokit/core");
const { paginateRest } = require("@octokit/plugin-paginate-rest");

const APP_ID = process.env.APP_ID;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const EVENT_PAYLOAD = require(process.env.GITHUB_EVENT_PATH);

const OctokitWithPagination = Octokit.plugin(paginateRest);

main();

async function main() {
  const afterCache = require("../cache/index.json");

  try {
    const repoOctokit = new Octokit({
      auth: process.env.GITHUB_TOKEN,
    });

    const [owner, repo] = process.env.GITHUB_REPOSITORY.split("/");
    const requestOptions = await repoOctokit.request.endpoint(
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
    const { data: jsonContent } = await repoOctokit.request(requestOptions);

    const beforeCache = JSON.parse(jsonContent);

    const beforeCacheVersions = beforeCache.map((entry) => entry.version);
    const newVersions = afterCache.filter(
      (entry) => !beforeCacheVersions.includes(entry.version)
    );

    if (newVersions.length === 0) {
      console.log("No new versions found. Bye.");
      return;
    }

    const octokit = new OctokitWithPagination({
      auth: {
        id: APP_ID,
        privateKey: PRIVATE_KEY,
      },
      authStrategy: createAppAuth,
    });

    const installations = await octokit.paginate("GET /app/installations", {
      mediaType: { previews: ["machine-man"] },
      per_page: 100,
    });

    for (const {
      id,
      account: { login },
    } of installations) {
      console.log("Installation found: %s (%d)", login, id);

      const installationOctokit = new OctokitWithPagination({
        auth: {
          id: APP_ID,
          privateKey: PRIVATE_KEY,
          installationId: id,
        },
        authStrategy: createAppAuth,
      });

      const repositories = await installationOctokit.paginate(
        "GET /installation/repositories",
        {
          mediaType: { previews: ["machine-man"] },
          per_page: 100,
        }
      );

      console.log(
        "Repositories found on %s: %d. Dispatching events",
        login,
        repositories.length
      );

      for (const { name, full_name } of repositories) {
        for (const newVersion of newVersions) {
          const options = installationOctokit.request.endpoint.merge(
            "POST /repos/:owner/:repo/dispatches",
            {
              owner: login,
              repo: name,
              event_type: "nodekitten",
              client_payload: newVersion,
            }
          );
          console.log(options);

          await installationOctokit.request(options);
          console.log(
            "Event distpatched for %s and %s",
            full_name,
            newVersion.version
          );
        }
      }
    }
  } catch (error) {
    console.log(error);
    throw error;
  }
}
