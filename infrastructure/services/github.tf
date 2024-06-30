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
