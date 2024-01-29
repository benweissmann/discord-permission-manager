# Overview

This tool allows you to view and edit the permissions for categories and channels in a Discord server via Terraform.

# Setup

This repo uses [asdf](https://asdf-vm.com/) to manage Node.JS and Terraform versions. If you have asdf set up, along with with the [Terraform](https://github.com/asdf-community/asdf-hashicorp) (`asdf plugin-add terraform https://github.com/asdf-community/asdf-hashicorp.git`) and [NodeJS](https://github.com/asdf-vm/asdf-nodejs) (`asdf plugin add nodejs https://github.com/asdf-vm/asdf-nodejs.git`) plugins, you can install and use the correct versions with:

```
asdf install
```

Otherwise, manuall install NodeJS xxx and Terraform xxx (or use other versions at your own risk).

Then, install the NodeJS dependencies:

```
npm install
```

Unfortunately, the upstream Discord provider had a bug that prevents importing channel permission resources. Until they [merge our fix](https://github.com/Lucky3028/terraform-provider-discord/pull/126), you also need to build a forked provider from source.

Clone the repo: https://github.com/benweissmann/terraform-provider-discord

From that repo, with a go 1.20 toolchain (or above) installed:

```
go build -o terraform-provider-discord
```

You should end up with a `terraform-provider-discord` binary. Running this binary should print a message saying that it's a Terraform plugin.

Then, instruct Terraform to use your fork by creating a `.terraformrc` file in your Home directory with:

```terraform
provider_installation {
  dev_overrides {
    "registry.terraform.io/Lucky3028/discord" = "/path/to/repo/for/terraform-provider-discord"
  }
  direct {}
}
```

Note that that path is to the *git repostory directory*, not the binary itself (i.e., that path is to a directory that contains the `terraform-provider-discord` binary, not to the binary itself).

# Setting up a bot token

You'll need to provide your [Bot Token](https://discordjs.guide/preparations/setting-up-a-bot-application.html#your-bot-s-token) via env var (you should set it as `DPM_TOKEN` for this script, and also as `TF_VAR_discord_token` for the Terraform config):

```
export DPM_TOKEN=xxxx
export TF_VAR_discord_token=xxxx # the name is case-sensitive!
```

This tool requires the permission to list all servers users, which is considered a "privileged intent". In your application, navigate to the "Bot" page, find the "Privileged Gateway Intents" section, and toggle on "Server Members Intent"

Then, [add your bot to your Discord server](https://discordjs.guide/preparations/adding-your-bot-to-servers.html#creating-and-using-your-invite-link). Select `bot` permissions, and then select `Administrator` for the "Bot Permissions" that appear after selecting `bot` (you might be able to run this tool with lower permissions, but Bots can only grant permissions they themselves have, so your bot will need at least every permission you want it to manage).

Export the [ID of your Discord server](https://support.discord.com/hc/en-us/articles/206346498-Where-can-I-find-my-User-Server-Message-ID):

```
export DPM_SERVER_ID=xxx
```

# Runnig the tool

Now, you can generate the Terraform for your server's current configuration:

```
npm start
```

This will:

- Delete old generated files (after confirming, if they exist)
- Use the Discord API to generate `./terraform/imports.tf` with imports for every category/category permission/channel/channel permission, `./terraform/data.tf` with data blocks for users/roles used in permissions, and `./terraform/channels.tf` with Terraform declarations for each channel / category.

From there, you can run `cd terraform; terraform init; terraform apply` to confirm that there are not pending changes and the terraform was correctly generated, and then apply to carry out the import. DO NOT make any edits to the `channels.tf` file before doing this first apply to finish the imports.

Then, edit `terraform/channels.tf` and run `cd terraform; terraform apply` to preview and apply your changes.
