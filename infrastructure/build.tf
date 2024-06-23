resource "aws_ecr_repository" "discord_werewolf" {
  name = "discord-werewolf"
  image_tag_mutability = "IMMUTABLE"
}

resource "aws_s3_bucket" "werewolf_builder" {
  name = var.builder_cache_bucket
}

module "builder_service_role" {
  source = "github.com/code-butter/aws-tf//iam_role"
  name   = "werewolf-builder"
  assume_services = ["codebuild.amazonaws.com"]
  inline_policies = [
    {
      sid: "AppRepoAccess"
      effect: "allow",
      resources: [aws_ecr_repository.discord_werewolf.arn],
      actions: [
        "ecr:DescribeRepositories",
        "ecr:DescribeImages",
        "ecr:ListImages",
        "ecr:GetDownloadUrlForLayer",
        "ecr:BatchGetImage",
        "ecr:BatchCheckLayerAvailability",
        "ecr:PutImage",
        "ecr:InitiateLayerUpload",
        "ecr:UploadLayerPart",
        "ecr:CompleteLayerUpload",
        "ecr:BatchDeleteImage",
        "ecr:GetAuthorizationToken",
        "sts:GetServiceBearerToken"
      ]
    }
  ]
}

resource "aws_codebuild_project" "build_werewolf_app" {
  name         = "build-and-deploy-discord-werewolf"
  service_role = module.builder_service_role.arn
  build_timeout = 10

  source {
    type            = "GITHUB"
    location        = var.github_source
    git_clone_depth = 1
  }

  source_version = "master"
}

