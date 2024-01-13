export function success (body) {
  return buildResponse(200, body)
}

export function failure (body) {
  return buildResponse(500, body)
}

function buildResponse (statusCode, body) {
  return {
    statusCode,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true,
      'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token,AccessToken'
    },
    body: JSON.stringify(body)
  }
}
