terraform {
  required_providers {
    aws = {
      source = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.primary_region
}

data "aws_ecs_cluster" "main" {
  cluster_name = "discord-werewolf"
}

data "aws_ecr_repository" "bot" {
  name = "discord-werewolf"
}