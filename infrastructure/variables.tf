variable "primary_region" {
  type = string
  default = "us-east-1"
  description = "ID of the AWS region for the primary region. There is no secondary as of now, but there could be!"
}

variable "primary_cidr" {
  type = string
  default = "10.0.0.0/24"
}

variable "primary_azs" {
  type = list(string)
  default = ["us-east-1a"]
}

variable "subnet_increase" {
  type = number
  default = 4
}

variable "github_source" {
  type = string
}
