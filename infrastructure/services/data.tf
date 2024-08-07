locals {
  ecr_host = "${data.aws_caller_identity.current.account_id}.dkr.ecr.${var.primary_region}.amazonaws.com"
}

resource "local_file" "builder_vars" {
  filename = "${path.module}/../builder-vars.json"
  content = jsonencode({
    awsRegion = var.primary_region,
    ecrHost = local.ecr_host,
    buildRepo = aws_ecr_repository.builder.repository_url
  })
}

output "public_ip" {
  value = aws_eip.ec2_esc_service.public_ip
}

output "ecr_host" {
  value = local.ecr_host
}

output "build_repo" {
  value = aws_ecr_repository.builder.repository_url
}

output "account_id" {
  value = data.aws_caller_identity.current.account_id
}