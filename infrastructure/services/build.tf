locals {
  expired_rule = {
    rulePriority: 1,
    description: "Expire untagged images older than 14 days",
    selection: {
      tagStatus: "untagged",
      countType: "sinceImagePushed",
      countUnit: "days",
      countNumber: 14
    },
    action: {
      type: "expire"
    }
  }
}

resource "aws_ecr_repository" "discord_werewolf" {
  name = "discord-werewolf"
  image_tag_mutability = "IMMUTABLE"
}

resource "aws_ecr_lifecycle_policy" "discord_werewolf" {
  repository = aws_ecr_repository.discord_werewolf.name
  policy = jsonencode({
    rules: [ local.expired_rule ]
  })
}

resource "aws_ecr_repository" "builder" {
  name = "image-builder"
}

resource "aws_ecr_lifecycle_policy" "builder" {
  repository = aws_ecr_repository.builder.name
  policy = jsonencode({
    rules: [ local.expired_rule ]
  })
}

module "builder_service_role" {
  source = "github.com/code-butter/aws-tf//iam_role"
  name   = "werewolf-builder"
  assume_services = ["codebuild.amazonaws.com"]
  attach_policy_arns = [
    "arn:aws:iam::aws:policy/AWSCodeBuildDeveloperAccess"
  ]
  inline_policy_name = "BuilderAccess"
  inline_policies = [
    {
      sid: "AppRepoAccess",
      effect: "Allow",
      resources: [
        aws_ecr_repository.builder.arn,
        aws_ecr_repository.discord_werewolf.arn
      ],
      actions: [
        "ecr:UploadLayerPart",
        "ecr:PutImage",
        "ecr:ListImages",
        "ecr:InitiateLayerUpload",
        "ecr:GetDownloadUrlForLayer",
        "ecr:DescribeRepositories",
        "ecr:DescribeImages",
        "ecr:CompleteLayerUpload",
        "ecr:BatchGetImage",
        "ecr:BatchCheckLayerAvailability"
      ]
    },
    {
      sid: "GlobalResources",
      effect: "Allow",
      resources: ["*"],
      actions: [
        "ssm:GetParameter",
        "ssm:GetParameters",
        "ssm:GetParametersByPath",
        "sts:GetServiceBearerToken",
        "ssm:PutParameter",
        "ecr:GetAuthorizationToken"
      ]
    },
    {
      sid: "LogGroup"
      effect: "Allow",
      actions: [
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ]
      resources: [
        "${aws_cloudwatch_log_group.build_werewolf_app.arn}:*"
      ]
    }
  ]
}

resource "aws_cloudwatch_log_group" "build_werewolf_app" {
  name = "build-and-deploy-discord-werewolf"
}

resource "aws_codebuild_project" "build_werewolf_app" {
  name         = "build-and-deploy-discord-werewolf"
  resource_access_role = module.builder_service_role.arn
  service_role = module.builder_service_role.arn
  build_timeout = 10

  artifacts {
    type = "NO_ARTIFACTS"
  }

  environment {
    compute_type = "BUILD_GENERAL1_SMALL"
    image        = "${aws_ecr_repository.builder.repository_url}:latest"
    type         = "ARM_CONTAINER"
    image_pull_credentials_type = "SERVICE_ROLE"
  }

  source {
    type            = "GITHUB"
    location        = "https://github.com/${var.github_source_repo}.git"
    git_clone_depth = 1
    buildspec       = templatefile("buildspec.yml.tftpl", {
      tag_parameter = aws_ssm_parameter.bot_deployed_tag.name,
      aws_region = var.primary_region,
      ecr_host = local.ecr_host,
      repo = aws_ecr_repository.discord_werewolf.repository_url
    })
  }

  source_version = "override_on_run"

  logs_config {
    cloudwatch_logs {
      group_name = aws_cloudwatch_log_group.build_werewolf_app.name
    }
  }
}
