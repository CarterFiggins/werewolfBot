terraform {
  required_providers {
    aws = {
      source = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  backend "s3" {}
}

provider "aws" {
  region = var.primary_region
}

data "aws_caller_identity" "current" {
}

module "primary_vpc" {
  source = "terraform-aws-modules/vpc/aws"
  name = "primary-werewolf"
  azs = var.primary_azs
  cidr = var.primary_cidr
  public_subnets = [for i,az in range(length(var.primary_azs)) : cidrsubnet(var.primary_cidr, var.subnet_increase, i)]
  public_subnet_tags = {
    VPC = "primary-werewolf"
    Role = "public-subnet"
  }
  create_igw = true
  enable_dns_hostnames = true
}

resource "aws_ecs_cluster" "main" {
  name = "discord-werewolf"
}
