variable "primary_region" {
  type = string
  default = "us-east-1"
  description = "ID of the AWS region for the primary region. There is no secondary as of now, but there could be!"
}
