const Twitter = require('twit')

// Consume environment variables as JavaScript variables – not required, it just makes me feel a bit more clean
const twitterConsumerKey       = process.env.CONSUMER_KEY
const twitterConsumerSecret    = process.env.CONSUMER_SECRET
const twitterAccessToken       = process.env.ACCESS_TOKEN
const twitterAccessTokenSecret = process.env.ACCESS_TOKEN_SECRET
const environment              = process.env.FUNCTION_ENVIRONMENT

// authenticate with Twitter
const twitterAPI = new Twitter({
  consumer_key:         twitterConsumerKey,
  consumer_secret:      twitterConsumerSecret,
  access_token:         twitterAccessToken,
  access_token_secret:  twitterAccessTokenSecret,
  timeout_ms:           60*1000  // optional HTTP request timeout to apply to all requests.
})

// helper variables
const funcNameForLogging = 'kittenWriteLatest'

module.exports = async function (context) {
  const newVersions = JSON.parse(context.bindings.tweetTriggerFromNew)

  for(var version in newVersions) { // loop over new.json
    const tweet = `There's a new @nodejs release available: Node.js v${newVersions[version]} is out now! 🙀\n\n$ nvm install ${newVersions[version]}\n\n🔗 Release post (will be) available here:\nhttps://nodejs.org/en/blog/release/v${newVersions[version]}/` // define what we're going to tweet
    
    if(environment === 'production') {
      twitterAPI.post('statuses/update', { status: tweet }, (error, data, response) => { // Actually call the Twitter API and post a new status
        if (error) throw error
        context.log(`${funcNameForLogging}: Running in production mode`)
        context.log(`${funcNameForLogging}: Twitter response: ${response}`) // log the response because it could be useful if things are not working
        context.log(`\nThere's a new version out! Tweeting it: \n\n${tweet}\n`) // log what we've tweeted because it could be wrong and that information is useful!
        }
      )
    } else if (environment === 'development') {
      context.log(`${funcNameForLogging}: Running in development mode`)
      context.log('Tweet contents:')
      context.log(tweet) // log the tweet so we can see what's up!
    }  
  }
};