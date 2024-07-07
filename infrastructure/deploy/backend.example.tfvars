# This is an example file that needs to be uploaded and changed to the SSM parameter deploy-backend
# You can also copy to backend.tfvars and use it to configure for local debugging

bucket         = "replace-me"
dynamodb_table = "replace-me"
region         = "replace-me"

# Do not change this
key            = "werewolf-deploy/terraform.tfstate"
