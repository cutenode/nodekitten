const semver = require('semver')

// helper variables
const funcNameForLogging = 'kittenWriteLocal'
const outputFileName = 'local.json'
const now = new Date()

module.exports = async function (context) {
  // Pull in remote JSON that kittenFetchAndWrite wrote to blob storage so we can compare against it
  // I'm not sure why we need to JSON.parse this one but not localVersionDataFromBlobStorage.
  // Perhaps it's because this is a trigger ¯\_(ツ)_/¯
  const triggeringRemoteJson = JSON.parse(context.bindings.nodeVersionMetadata)
  
  // Pull in the versions/local.json from Blob storage to compare with remote data
  const localVersionJSONFromBlobStorage = context.bindings.nodeLocalVersionIn
  
  // Initialize arrays we're going to push to for versions.
  let localArray = []
  let remoteArray = []  
  
  // Build out localArray with the version numbers in a format that they can be validly used by
  // in the semver module.
  for(var property in localVersionJSONFromBlobStorage) {
    localArray.push(semver.valid(semver.coerce(localVersionJSONFromBlobStorage[property].version)))
  }
  
  // Build out rermoteArray with the version numbers in a format that they can be validly used by
  // in the semver module.
  for(var property in triggeringRemoteJson) {
    remoteArray.push(semver.valid(semver.coerce(triggeringRemoteJson[property].version)))
  }
  
  // Get list of versions, eventually ending up at the latest version.
  let semverMajorsThatExistArray = []
  
  for(var property in triggeringRemoteJson) {
    const major = semver.major(triggeringRemoteJson[property].version) // get the semver major version of the property
    if(semverMajorsThatExistArray.includes(major) === false){
      semverMajorsThatExistArray.push(major)
    }
  }

  // Figure out the difference bewteen remoteArrayy and localArray
  let diff = remoteArray.filter(semver => !localArray.includes(semver))
  
  // Check if diff is an array and if it's emmpty. If it is, there are no new versions.
  if(Array.isArray(diff) && diff.length === 0) {
    context.log(`\n${funcNameForLogging}: No new versions!\n`)
  } else if (Array.isArray(diff) && diff.length !== 0) { // If diffis an array but not empty, do werk
    context.log(`\n${funcNameForLogging}: New version(s) detected: ${diff}\n`)
    context.bindings.nodeLocalVersionOut = triggeringRemoteJson // write local.json

    //update new.json
    context.bindings.kittenNewOut = diff //write new.json
  } else {
    context.log(`\n${funcNameForLogging}: something\'s wrong!\n`)
  }
}