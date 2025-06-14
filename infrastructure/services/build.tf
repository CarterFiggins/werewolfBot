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

data "aws_s3_bucket" "tf_state" {
  bucket = var.terraform_bucket
}

data "aws_dynamodb_table" "tf_state" {
  name = var.terraform_table
}

resource "aws_ecr_repository" "discord_werewolf" {
  name = "discord-werewolf"
  image_tag_mutability = "MUTABLE"
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
      sid: "EcsAccess"
      effect: "Allow",
      resources: [
        aws_ecs_cluster.main.arn,
        "${aws_ecs_cluster.main.arn}:*"
      ],
      actions: [
        "ecs:CreateService",
        "ecs:UpdateService",
        "ecs:DeleteService",
        "ecs:DescribeClusters",
        "ecs:DescribeServices",
        "ecs:DescribeTaskDefinition",
        "ecs:DescribeTasks",
        "ecs:ListClusters",
        "ecs:ListServices",
        "ecs:ListTaskDefinitions",
        "ecs:ListTasks"
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
        "ecr:GetAuthorizationToken",
        "ec2:DescribeSubnets",
        "ecs:RegisterTaskDefinition",
        "ecs:DeregisterTaskDefinition",
        "ecs:DescribeTaskDefinition",
        "ecs:DescribeServices",
        "ecs:CreateService",
        "ecs:UpdateService",
        "logs:DescribeLogGroups",
        "logs:CreateLogGroup",
        "logs:PutRetentionPolicy",
        "logs:ListTagsForResource",
        "iam:CreateRole",
        "iam:GetRole",
        "iam:PassRole",
        "iam:ListRolePolicies",
        "iam:GetRolePolicy",
        "iam:ListAttachedRolePolicies",
        "iam:PutRolePolicy",
        "iam:AttachRolePolicy"
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
    },
    {
      sid: "TerraformBucket",
      effect: "Allow",
      actions: [
        "s3:ListBucket",
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:GetObjectVersion"
      ],
      resources: [
        data.aws_s3_bucket.tf_state.arn,
        "${data.aws_s3_bucket.tf_state.arn}/*"
      ]
    },
    {
      sid: "TerraformTable"
      effect: "Allow",
      actions: [
        "dynamodb:ListTables",
        "dynamodb:DescribeTable",
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:DeleteItem"
      ],
      resources: [data.aws_dynamodb_table.tf_state.arn]
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
    report_build_status = true
    buildspec       = templatefile("buildspec.tpl.yaml", {
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
