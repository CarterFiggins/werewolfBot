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
4. Run the terraform migrations: `terraform apply`. Make a note of the output variables for later.
5. Log into the AWS console and search for "Parameter Store" (it's in Systems Manager)
6. Add values for everything but `bot-deployed-tag`. See the [SETUP for the app](../SETUP.md) for more details on the 
    environment variables used. 
7. Search for "Codebuild" in the AWS console. 
8. Edit the project "build-and-deploy-discord-werewolf". 
9. Scroll down to "Source" and click "Connect to Github" 
     * You can only connect to one Github account this way
10. Get your AWS account ID 
    * You can find this by clicking your profile/role name at the top right. 
11. On your Github project, go to Settings -> Environments. 
12. Create a new environment named "Deploy"
13. Add a secret named AWS_ACCOUNT_ID with your AWS account ID

#### In the `builder-image` directory:

1. Log Docker into ECR:
      ```
        aws ecr get-login-password --region ${aws_region} | docker login --username AWS --password-stdin ${ecr_host}
      ```
   Make sure you replace the appropriate variables (from `terraform apply`) contained in `${}`.
2. Build and push the image for CodeBuild: `docker build --platform linux/arm64 -t ${build_repo}:latest -p .`
