variable "github_source_repo" {
  type = string
  description = "Where code will be pulled from to build the container. Format: user/repo."
}

variable "terraform_bucket" {
  type = string
  description = "Name of the S3 bucket that holds the terraform state."
}

variable "terraform_table" {
  type = string
  description = "Name of the DynamoDB table that holds the terraform state locks."
}

variable "primary_region" {
  type = string
  default = "us-east-1"
  description = "ID of the AWS region for the primary region. There is no secondary as of now, but there could be!"
}

variable "primary_azs" {
  type = list(string)
  default = ["us-east-1a", "us-east-1b"]
  description = "The availability zones for the primary VPC."
}

variable "primary_cidr" {
  type = string
  default = "10.0.0.0/24"
  description = "The main VPC CIDR."
}

variable "subnet_increase" {
  type = number
  default = 4
  description = "The suffix math that changes the size of the subnet depending on the primary CIDR."
}
