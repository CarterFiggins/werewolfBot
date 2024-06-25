# Set values manually in SSM Parameter Store

resource "aws_ssm_parameter" "discord_token" {
  name = "discord-token"
  type = "SecureString"
  value = ""
}

resource "aws_ssm_parameter" "discord_app_id" {
  name = "discord-app-id"
  type = "SecureString"
  value= ""
}

resource "aws_ssm_parameter" "mongo_uri" {
  name = "mongo-uri"
  type = "SecureString"
  value = ""
}
