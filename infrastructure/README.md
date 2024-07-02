# Werewolf Bot Infrastructure Deploy

## Setup

### AWS Account

You will need an AWS account. Once that is set up you will need API credentials. The easiest way is to create a user 
in IAM with the "AdministratorAccess" and create an access key for it under the "Security Credentials" tab on that users'
page in IAM. Set the environment variables `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` with the value of the access
key.

NOTE: Long term access keys are a security risk, but instructions on how to set up short term access keys is out 
of scope for this document. If you do use a long term access key it is suggested to not save it anywhere in plain text 
and only set the environment variables for the current session. Save it in a password manager (like 1Password).  

### Install Software 

[Docker](https://docs.docker.com/engine/install/) - For building the container that will run the build pipeline.
 
[Terraform](https://developer.hashicorp.com/terraform/install) - This is the configuration manager for AWS (and a lot of
other things).

[Node](https://nodejs.org/en/download/prebuilt-installer) - There are many ways to install node. It is suggested to use 
an environment manager like [asdf](https://asdf-vm.com/guide/getting-started.html)

### Mongo DB Server

You're on your own for this one. It is suggested to use MongoDB Atlas.

### Run Commands

#### Initial Terraform setup

In the `infrastructure` directory: 

Create the S3 bucket and DynamoDB table that Terraform will use to track state and locks

* On Linux/MacOS: `./setup`
* On Windows: `node.exe setup`

Follow the prompts. Make note of the bucket and table names for later.

#### Terraform Initial Deploy

In the `infrastructure/services` directory: 

1. Copy `backend.example.tfvars` to `backend.tfvars`. Change the values for the region you're working in and the s3/dynamodb
values. 
2. Copy `terraform.example.tfvars` to `terraform.tfvars`. Change all appropriate variables. 
3. Set up the infrastructure for deploys: `terraform init -backend-config=backend.tfvars`
4. Run the terraform migrations: `terraform apply`. 
    * If you are using MongoDB Atlas, make note of the public IP address in the output and add it to the whitelist.
    * Other outputs are useful for later steps. Record these and keep until setup is complete. 
    * Data is written to `builder-vars.json` for the builder image script

#### In the `builder-image` directory:

1. Make sure you run `terraform apply` in `infrastructure/services` before this if any changes have been made or you are 
   running off a freshly cloned project. 
2. Run the deploy-builder script:
    * Linux/MacOS: `./deploy-builder`
    * Windows: `node.exe deploy-builder`
    
#### AWS 
1. Log into the AWS console and search for "Parameter Store" (it's in Systems Manager)
2. Add values for everything but `bot-deployed-tag`. See the [SETUP for the app](../SETUP.md) for more details on the 
    environment variables used. 
3. Search for "Codebuild" in the AWS console. 
4. Edit the project "build-and-deploy-discord-werewolf". 
5. Scroll down to "Source" and click "Connect to Github" 
     * You can only connect to one Github account per AWS account this way

#### Github

1. On your Github project, go to Settings -> Environments.
2. Create a new environment named "Deploy"
3. Add a secret named AWS_ACCOUNT_ID with your AWS account ID
   * This is one of the outputs from the initial Terraform deploy


## Deploys

### Application Deploy

To do an application deploy, simply tag a commit with the format `rel/${unique-id` and push it. It is suggested to use 
the format `rel/YYYY-mm-dd.increment` to keep track of when releases were made. Git example (in bash):  

```
git tag rel/2024-07-01.1
git push --tags
```

This will run the Github action which will in turn trigger the Codebuild project to build and deploy the application.

### Infrastructure Deploy

Make sure your AWS credentials are in your environment (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION). 

In `infrastructure/services` run `terraform apply`. Verify the changes before accepting. 

### Builder Image

If you ever need to make changes here simply go through the initial setup instructions for this part again.