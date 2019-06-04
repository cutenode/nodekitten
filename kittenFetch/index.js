const bent = require('bent')

const getJSON = bent('json')

// helper variables
const funcNameForLogging = 'kittenFetch'
const outputFileName = 'data.json'
const now = new Date()


module.exports = async function (context) {
    const currentData = context.bindings.nodeVersionMetadataIn // versions/data.json
    let nodeVersions = await getJSON('https://nodejs.org/dist/index.json') // read the remote JSON from an official source
    let sanitizedNodeVersions = [] // initalize the sanitized array that we can write to in loops
    for(var node in nodeVersions) {
        sanitizedNode = { // make our data a little bit more useful for the context that we're working in – a lot of future planning in this strucutre.
            'version': nodeVersions[node].version,
            'metadata': {
                'date': nodeVersions[node].date,
                'npm': nodeVersions[node].npm,
                'v8': nodeVersions[node].v8,
                'libuv': nodeVersions[node].uv,
                'openssl': nodeVersions[node].openssl,
                'lts': nodeVersions[node].lts,
                'security': nodeVersions[node].security
            }
        }
        sanitizedNodeVersions.push(sanitizedNode)
    }

    if(sanitizedNodeVersions.length !== currentData.length) { // if there are more (or less? hopefully that will never happen) entries in the remote versions than there are in the versions we've got locally
        context.bindings.nodeVersionMetadata = sanitizedNodeVersions // overwrite the internal data data
        context.log(`\n${funcNameForLogging}: wrote versions to Azure Blob Storage\n`)

        // update `update.json` file
        const functionUpdatesData = { [outputFileName]: now, 'updates.json': now}
        const update = Object.assign(context.bindings.kittenUpdateTimingsIn, functionUpdatesData)
        context.bindings.kittenUpdateTimingsOut = update

        context.log(update)
        context.log(`\n${funcNameForLogging}: Updated versions/${outputFileName} at: ${now}\n`)
        // end `update.json` file logic
    } else { // if the two sources are the same length... there's theotrecially no change. If there are edge cases here, please feel free to PR waays to handle them!
        context.log(`\n${funcNameForLogging}: data on the nodejs.org server has not changed since the last update.\n`)
        context.log(`Previous update: ${context.bindings.kittenUpdateTimingsIn[outputFileName]}\n`)
    }
}