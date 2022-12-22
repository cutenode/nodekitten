require('dotenv').config()
const nodevu = require('@nodevu/core')
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(process.env.SUPABASE_DOMAIN, process.env.SUPABASE_KEY)

async function getData() {
    const data = await nodevu() // returns a lot of data!
    return data
}

async function bulkCreate() {
  const data = await getData() // fetches our data
  const result = [] // the array we'll eventually toss to the database
  for(const line in data) {
    for (const release in data[line].releases) { // extract all the data we want to insert into the database
      const output = {
        version: release,
        dependencies: data[line].releases[release].dependencies,
        lts: data[line].releases[release].lts.isLts,
        security: data[line].releases[release].security.isSecurity,
        semver: data[line].releases[release].semver
      }
      result.push(output)
    }
  }

  // insert IDs into our result after building the data into it
  for (const release in result) {
    const total = result.length
    const current = result.indexOf(result[release])
    // console.log(total, current, total - current, result[release].version)
    result[release].id = total - current
  }

  const { error } = await supabase
  .from('versions')
  .insert(result)
}

bulkCreate()