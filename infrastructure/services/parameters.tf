# Set these values manually in SSM Parameter Store after creating here
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

resource "aws_ssm_parameter" "mongo_db_name" {
  name = "mongo-db-name"
  type = "String"
  value = ""
}

resource "aws_ssm_parameter" "time_zone" {
  name = "time-zone"
  type = "String"
  value = ""
}

# You do not have to add a value for this
resource "aws_ssm_parameter" "bot_deployed_tag" {
  name = "bot-deployed-tag"
  description = "This is automatically updated by the build pipeline."
  type = "String"
  value = ""
}