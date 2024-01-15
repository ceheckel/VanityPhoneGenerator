# README

## **Project Name and Description:**

Project Name: VanityGen
Description: A cloud-based call center which generates vanity phone numbers based on the caller's number.  The top 5 "best" vanity numbers are saved to a DB.  Best in this case is defined simply as the longest possible (valid english) word that can be generated from the caller's phone number. 

## **Prerequisites:**

- Git v2+
- Node v18
- Node Package Manager v9
- AWS IAM user

## **Installation:**

The following steps assume you have all the tools listed in the prerequisite section installed.

1. close the repository to get the code and CloudFormation template for deployment
   - `git clone https://github.com/ceheckel/VanityPhoneGenerator.git`
1. cd to the root of the project
   - `cd VanityPhoneGenerator`
1. install the project dependencies
   - `npm install`
1. (Optional) use an npm script to run the function locally using a mock event
   - `npm run test`
   - note that this will likely fail when it attempts to save data to the DB, since the DB has not been deployed
1. configure AWS CLI with your IAM credentials
   - either setup ENV variables for your machine
      ```bash
      export AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY}
      export AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY}
      ```
   - or create a credential file at `~/.aws/credentials`and a config file at `~/.aws/config`
      ```txt
      [default]
      aws_access_key_id = ${AWS_ACCESS_KEY}
      aws_secret_access_key = ${AWS_SECRET_ACCESS_KEY}
      ```
      ```txt
      [profile default]
      region = us-east-1
      output = json
      ```
      - where `${AWS_ACCESS_KEY}` is the access key of the IAM user in AWS and `${AWS_SECRET_ACCESS_KEY}` is the secret key of the IAM user in AWS
1. use an npm script to deploy the CloudFormation stack
   - `npm run deploy`
1. login to Amazon Connect and set the contact flow for the phone number to 'VanityGen Inbound Flow'
1. use an npm script to invoke the function as it is in 'deployment'
   - `npm run invoke`

## **Usage:**

Simply call the Connect Phone Number created as part of the deployed AWS CloudFormation Stack.

In case there are difficulties deploying the stack, you can use `+18007111085` to call the version I have deployed.

## **Project Structure:**

- functions/
  - contains a file for each lambda function that will be deployed in the stack.  Each file contains at least a handler
- mocks/
  - contains files used for testing lambda functions.  The files contain mocked AWS events.
- resources/
  - contains files used to define AWS resources that will be deployed to the stack.  Since this is a small project, only the ContactFlow content is described here.  For all other resources, see [serverless.yml](serverless.yml)
- utils/
  - contains utility functions imported by the lambda functions.  Some utils include interactions with the database via the aws-sdk package, or interactions with the dictionary (word-list) package
- package.json
  - configuration information for the project and NPM.  Executable scripts are defined here as well as a list of project dependencies
- serverless.yml
  - defines the stack that will be deployed via the Serverless framework

## **Technologies Used:**

Languages: NodeJS (JavaScript), YAML, JSON
Major Tools:
- AWS-SDK: provides tools necessary to interact with various resources from our lambda function's code
- word-list: provides a list of legitimate words that we reference to determine which vanity numbers are valuable
- serverless: provides a means of deployment to AWS (as well as other cloud providers if required)
AWS Resources:
- Lambda: two function are added to the stack, 'MainFunction' which does the intended work and 'MockFunction' which simulates a valid output for a specific number.
  - **NOTE**: due to a design/implementation flaw, MainFunction is not able to run in the alloted time given by the AWS Connect Contact Flow.  As a fallback, I added MockFunction which will be called when the invocation of MainFunction inevitably times out during the flow.  MockFunction provides a similar output to MainFunction, but is not dynamic to the caller's phone number.
- DynamoDB Table: See the 'Database Schema' section for more information 
- AWS Connect Instance: the instance is configured to allow incoming calls only and connect users are managed by the instance (as opposed to SAML 2.0 or LDAP)
- AWS Contact Flow: the inbound contact flow that is invoked when a user calls the connect center.  The flow is active by default and is a Generic Contact Flow.
  - **NOTE**: due to a design/implementation flaw, the Contact Flow is not automatically assigned to the claimed phone number.  <b>This will have to be manually configured after the stack is deployed</b>
- AWS Connect Phone Number: the initial point of contact for the connect center.  The number is a US-based toll-free phone number.
- AWS Integration Association: two integration associations are added to the stack; one for each of the lambda functions described above.  This allow the contact flow to invoke lambda functions in the same region.

## **Database Schema:**

A Dynamo Database is added to the stack with a Read Capacity Unit (RCU) and Write Capacity Unit (WCU) of 5 per second.  The database contains a single table, 'TopFive' which contains three columns, 'phoneNumber' (PK), 'vanityNumber', and 'word'.  When the labmda function is operating as intended, the table will contain at most 5 records.

## **Configuration:**

The project only has one (default) configuration and is not intended to be deployed to other environments or with different env variables.

## **Contributing:**

This is an experimental project and will not be maintained after January 2024.  Please do not create pull requests.

## **Testing:**

- See the Installation section

## **Deployment:**

- See the Installation section

## **License:**

- TODO

## **Authors:**

Charles Heckel

## **Acknowledgments:**

- TODO

## **Troubleshooting:**

- TODO

## **FAQ:**

- TODO

## **Changelog:**

- TODO

## **Roadmap:**

- TODO

## **Security:**

- TODO

## Debrief

In this section, I will describe some of the reasoning behind my design decisions, roadblocks that arose during the development process, shortcuts I took while developing the project, and things I would have changed given more time and/or knowledge.

The first major design decision I made was how to generate vanity numbers from an input. The first choice (also the final choice) was an exhaustive, iterative approach. Given a phone number as a string, I would convert each digit of the phone number to each of its respective characters and add the new string to an array. For example, given '234-2345', the generate function would convert the '5' first and add ['234234J', '234234K', '234234L'] to the array. It would then move on to the adjacent '4' and produce ['23423GJ', '23423GK', '23423GL', '23423HJ', '23423HK', '23423HL', '23423IJ', '23423IK', '23423IL'].  Eventually, the array would contain all possible letter combinations.

This is definitely not the fastest (in execution) or the smallest in memory, but it is usually quick to implement. At one point, I considered converting from an array to a tree structure to improve execution time. Given more time and importance, I would certainly try it.  A significant drawback to this approach (especially in a cloud environment where billing costs are based on computation times), is that searching through this list will take a long time.  I had to limit the longest possible word to 7 characters to keep the execution time until a minute.  With 8 character words, the function took a few minutes to run, and 11 characters, it was more than 15 minutes.

The second major decision reflected how I was going to identify words within the generated strings. This part of the function requires the most time and resources and would have the highest priority if the algorithm needed to improve. Again, I chose an exhaustive approach: using an arbitrary element from the array of generated vanity number, 'LAWNRGH', I use nested for-loops with indices starting on each end of the string to loop through all possible substrings and look for valid words starting with the largest possible substring "LAWNRGH". This entry is not a valid word so it is skipped, then the substring "LAWNRG" is checked. Since it is also not a word, that entry is skipped. "LAWNR" is checked but not added. "LAWN" is next.  It is valid, so an entry is made in the return value. "LAW" is also valid and added to the return value, and the function proceeds with "LA", "L", "AWNRGH", "AWNRG", "AWNR", etc. There are small optimizations that could easily be added here, but ultimately, it would not reduce the worst-case runtime O(n * m^2 + l) (simplifies to O(m^2)), where n is the length of all possible vanity numbers, m is the length of any given vanity number, and l is the length of the validation dictionary. I believe that with the right data structure (perhaps a tree as mentioned earlier) for the generated numbers and the proper accompanying search algorithm, the worst-case runtime could be reduced to O(n), where n is the length of any given vanity number.

At this point, the hard work is over, and it's just housekeeping. I take each of the entries that have valid words in them, convert the unused letters back to numbers, see what's currently in the DB table, PUT and DELETE records as necessary, and return information to the caller.

When returning information to the caller, I would have liked to tell them about all of their possible options, but due to a lack of knowledge about AWS Connect Flow, I wasn't able to loop through an array of all options. Instead, the response body contains three keys which hold the 3 longest words that could be generated. For example, +18008378464 has three seven-letter words, 'TESTING', 'VERTING', and 'VESTING' that get read to the caller.
