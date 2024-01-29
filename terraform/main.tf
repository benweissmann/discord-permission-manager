
variable "discord_token" {
  type        = string
  description = "The bot token to use to authenticate to the Discord API"
}


terraform {
  backend "local" {
    path = "./terraform.tfstate"
  }

  required_providers {
    discord = {
      source  = "Lucky3028/discord"
      version = "1.6.0"
    }
  }
}

provider "discord" {
  token = var.discord_token
}
