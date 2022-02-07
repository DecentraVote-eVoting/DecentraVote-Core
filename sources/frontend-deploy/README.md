# DecentraVote
# Copyright (C) 2018-2022 iteratec

# Frontend Deployer
### Usage:

For local development you only need to use the command without additional arguments.

If you want to use an argument you must provide the previous arguments.

### Command:
`node frontend-deploy.js ARGV[2]`

| Arguments | Command | Example | Info|
|---------------|---------------|-----------------|------------------------|
|*`ARGV[2]`*| Task |`build, deploy` | If nothing is set, the build mode is used|
| Environment Variable | Command | Example | Info|
|*`ENVIRONMENT`*| Environment |`local, development, demo`     | If nothing is set, the local profile is used|
|*`MNEMONIC`*| Mnemonic |`mnemonic` | If nothing is set, the default mnemonic is used|
|*`NETWORK`*| Network |`bloxberg` | If nothing is set, the local network is used|