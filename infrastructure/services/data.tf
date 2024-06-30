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