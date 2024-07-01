data "tls_certificate" "github" {
  url = "https://token.actions.githubusercontent.com/.well-known/openid-configuration"
}

resource "aws_iam_openid_connect_provider" "github" {
  url             = "https://token.actions.githubusercontent.com"
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = [ for c in data.tls_certificate.github.certificates: c.sha1_fingerprint ]
}

resource "aws_iam_role" "github_actions" {
  name = "github-actions"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Federated = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:oidc-provider/token.actions.githubusercontent.com"
        }
        Action = "sts:AssumeRoleWithWebIdentity"
        Condition = {
          StringEquals = {
            "token.actions.githubusercontent.com:aud" = "sts.amazonaws.com"
          }
          StringLike = {
            "token.actions.githubusercontent.com:sub" = "repo:${var.github_source_repo}:*"
          }
        }
      }
    ]
  })
}

resource "aws_iam_role_policy" "github_actions" {
  role   = aws_iam_role.github_actions.id
  policy = data.aws_iam_policy_document.github_actions.json
}

data "aws_iam_policy_document" "github_actions" {
  statement {
    effect = "Allow"
    actions = [
      "codebuild:StartBuild",
      "codebuild:BatchGetBuilds",
      "codebuild:BatchGetProjects",
      "codebuild:ListBuildsForProject"
    ]
    resources = [ aws_codebuild_project.build_werewolf_app.arn ]
  }
}
