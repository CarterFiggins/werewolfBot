data "aws_caller_identity" "current" {
}

module "primary_vpc" {
  source = "terraform-aws-modules/vpc/aws"
  name = "primary-werewolf"
  cidr = var.primary_cidr
  azs = var.primary_azs
  public_subnets = [for i,az in range(length(var.primary_azs)) : cidrsubnet(var.primary_cidr, var.subnet_increase, i)]
  create_igw = true
}

resource "aws_ssm_document" "deploy" {
  content       = file("deploy_runcommand.json")
  document_type = "Command"
  name          = "deploy-werewolf-container"
}
