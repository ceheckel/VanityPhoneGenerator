import AWS from 'aws-sdk'

AWS.config.update({ region: 'us-east-1' })

function call(action, params) {
  const dynamoDb = new AWS.DynamoDB.DocumentClient()

  // in order to reduce vulnerabilities, ddb commands should be referenced by dot syntax, not bracket syntax
  // e.g. ddb.put instead of ddb[action] or ddb['put']
  if (action === 'delete') { return dynamoDb.delete(params).promise() }
  if (action === 'put') { return dynamoDb.put(params).promise() }
  if (action === 'scan') { return dynamoDb.scan(params).promise() }
}

export async function fetchAll() {
  const params = {
    TableName: 'VanityGenTopFive'
  }

  try {
    const response = await call('scan', params)
    return response.Items
  } catch (e) {
    console.error(`failed to fetch data from the DB`, e)
    return { status: false, error: e }
  }
}

export async function adjustTopFive(recordToRemove, recordToAdd) {
  try {
    if (recordToRemove !== undefined) {
      // Delete the old record
      console.debug(`Deleting the old record...`)
      const deleteParams = {
        TableName: 'VanityGenTopFive',
        Key: { phoneNumber: recordToRemove.phoneNumber }
      }
      await call('delete', deleteParams)
    }

    if (recordToAdd !== undefined) {
      // Add the new record
      const putParams = {
        TableName: 'VanityGenTopFive',
        Item: recordToAdd
      }
      console.debug(`Adding the new record...`)
      await call('put', putParams)
    }

    console.debug(`Record transaction successful`)
  } catch (e) {
    console.error(`Record transaction failed`, e)
    return { status: false, error: e }
  }
}
