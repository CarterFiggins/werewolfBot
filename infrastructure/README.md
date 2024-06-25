# Werewolf Bot Infrastructure Deploy

## Setup

### AWS account

You will need an AWS account. Once that is set up you will need API credentials. The easiest way is to create a user 
in IAM with the "AdministratorAccess" and create an access key for it under the "Security Credentials" tab on that users'
page in IAM. Set the environment variables `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` with the value of the access
key.

NOTE: Long term access keys are a security risk, but instructions on how to set up short term access keys is out 
of scope for this document. If you do use a long term access key it is suggested to not save it anywhere in plain text 
and only set the environment variables for the current session. Save it in a password manager (like 1Password).  

### You will need to install: 

[Terraform](https://developer.hashicorp.com/terraform/install) - This is the configuration manager for AWS (and a lot of
other things).






  