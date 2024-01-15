export const handler = async (event) => {
  const response = {
    statusCode: 200,
    headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": true,
        "Access-Control-Allow-Headers": "Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token,AccessToken"
    },
    body: {
      "option1": "TESTING", 
      "option2": "VERTING",
      "option3": "VESTING"
    }
  };

  return response;
};
