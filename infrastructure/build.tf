resource "aws_ecr_repository" "discord_werewolf" {
  name = "discord-werewolf"
  image_tag_mutability = "IMMUTABLE"
}

resource "aws_ecr_repository" "builder" {
  name = "image-builder"
}

module "builder_service_role" {
  source = "github.com/code-butter/aws-tf//iam_role"
  name   = "werewolf-builder"
  assume_services = ["codebuild.amazonaws.com"]
  inline_policies = [
    {
      sid: "AppRepoAccess",
      effect: "Allow",
      resources: [
        aws_ecr_repository.builder.arn,
        aws_ecr_repository.discord_werewolf.arn
      ],
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
        "ecr:GetAuthorizationToken"
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
        "sts:GetServiceBearerToken"
      ]
    }
  ]
}

resource "aws_codebuild_project" "build_werewolf_app" {
  name         = "build-and-deploy-discord-werewolf"
  service_role = module.builder_service_role.arn
  build_timeout = 10



  environment {
    compute_type = "BUILD_GENERAL1_SMALL"
    image        = "${aws_ecr_repository.builder.repository_url}:latest"
    type         = "LINUX_CONTAINER"
    image_pull_credentials_type = "CODEBUILD"

    environment_variable {
      name  = "TAG"
      value = "override_on_run"
    }

    environment_variable {
      name  = "AWS_REGION"
      value = var.primary_region
    }

    environment_variable {
      name  = "REPO"
      value = aws_ecr_repository.discord_werewolf.repository_url
    }

    environment_variable {
      name = "TIME_ZONE"
      value = var.time_zone
    }

    environment_variable {
      name  = "DB_NAME"
      value = var.db_name
    }

    environment_variable {
      name  = "DEPLOY_DOCUMENT"
      value = aws_ssm_document.deploy.name
    }

    environment_variable {
      name  = "ECR_HOST"
      value = "${data.aws_caller_identity.current.account_id}.dkr.ecr.${var.primary_region}.amazonaws.com"
    }

    environment_variable {
      name  = "MONGO_URI"
      value = aws_ssm_parameter.mongo_uri.name
      type  = "PARAMETER_STORE"
    }

    environment_variable {
      name  = "DISCORD_TOKEN"
      value = aws_ssm_parameter.discord_token.name
      type  = "PARAMETER_STORE"
    }

    environment_variable {
      name  = "DISCORD_APP_ID"
      value = aws_ssm_parameter.discord_app_id.name
      type  = "PARAMETER_STORE"
    }
  }

  source {
    type            = "GITHUB"
    location        = var.github_source
    git_clone_depth = 1
    buildspec = templatefile("buildspec.yml", {
      parameters_argument: replace(jsonencode({
        image:        "$IMAGE_TAG",
        mongoUri:     "$MONGO_URI",
        dbName:       "$DB_NAME",
        discordAppId: "$DISCORD_APP_ID",
        discordToken: "$DISCORD_TOKEN",
        timeZone:     "$TIME_ZONE"
      }), "\"", "\\\"")
    })
  }

  source_version = "override_on_run"

}

