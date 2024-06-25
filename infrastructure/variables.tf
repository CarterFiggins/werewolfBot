variable "primary_region" {
  type = string
  default = "us-east-1"
  description = "ID of the AWS region for the primary region. There is no secondary as of now, but there could be!"
}

variable "primary_cidr" {
  type = string
  default = "10.0.0.0/24"
  description = "The main VPC CIDR."
}

variable "primary_azs" {
  type = list(string)
  default = ["us-east-1a"]
  description = "The availability zones for the primary VPC."
}

variable "subnet_increase" {
  type = number
  default = 4
  description = "The suffix math that changes the size of the subnet depending on the primary CIDR."
}

variable "github_source" {
  type = string
  description = "Where code will be pulled from to build the container."
}

variable "deploy_bucket_name" {
  type = string
  description = "Name of the S3 deploy bucket. This is universal so make it unique for each account."
}

variable "time_zone" {
  type = string
  description = "Timezone the bot will operate in. Format is from NodeJS."
}

variable "db_name" {
  type = string
  description = "Name of the Mongo database"
  default = "werewolf"
}

