const semver = require('semver')

// helper variables
const funcNameForLogging = 'kittenWriteLatest'
const outputFileName = 'latest.json'
const now = new Date()

module.exports = async function (context) {
  // Pull in remote JSON that kittenFetchAndWrite wrote to blob storage so we can compare against it
  // I'm not sure why we need to JSON.parse this one but not localVersionDataFromBlobStorage.
  // Perhaps it's because this is a trigger ¯\_(ツ)_/¯
  const triggeringRemoteJson = JSON.parse(context.bindings.nodeVersionMetadata)

  // Initialize the object we're going to ship out as latest.json
  const exportedLatestObject = {}
  const theNewVersions = {}

  // Loop over triggeringRemoteJson and update the specific version(s) that are new
  for(var property in triggeringRemoteJson) {
    const version = triggeringRemoteJson[property].version // get the version of the release
    const major = semver.major(version) // get the major for the release
    const majorToString = major.toString() //make it a string because the line two lines after this is dumb
    const propertyAsAnObject = {} // initalize the prop object
    propertyAsAnObject[majorToString] = version // initalize the property with the name of the major 

    // build the object to export
    if(exportedLatestObject[major] === undefined) { // handle the case in which a new semver major doesn't exist – good for when a new release line is cut and for re-populating the data from scratch
      Object.assign(exportedLatestObject, propertyAsAnObject)
    } else if(semver.lt(exportedLatestObject[major], version)) { // if the release line already exists, compare the value to the current loop iteration – if it's less than 
      exportedLatestObject[major] = semver.valid(semver.coerce(propertyAsAnObject[major]))
    }
  }
  
  context.log(`\n${funcNameForLogging}: Writing versions/latest.json\n`)
  context.bindings.nodeLatestVersionsOut = exportedLatestObject // update latest.json

    // update `update.json` file
    // this should be after the actual logic of updating the file, since if that fails this should not run
    const functionUpdatesData = { [outputFileName]: now, 'updates.json': now}
    const update = Object.assign(context.bindings.kittenUpdateTimingsIn, functionUpdatesData)
    context.bindings.kittenUpdateTimingsOut = update

    context.log(update)
    context.log(`\n${funcNameForLogging}: Updated versions/${outputFileName} at: ${now}\n`)
    // end `update.json` file logic
}
