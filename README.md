# auto-update-cloudflare-ip

I use this script to keep my Raspberry Pi's public DNS up to date as my home network has a dynamic public IP address (an IP that can change if the router reboots).

By default the script will check every 5 minutes what the public IP of the computer is against the services defined in the GetIP config. 

It will then check the desired DNS record in Cloudflare to see if the IP matches and If it does not match it will update the desired Cloudflare Record to match and will send a notification to the configured Slack web hook.

To run the script simply clone the repo and run `npm install` to install the dependencies then run `node announce.js` from the root of the repo directory. I recommend using a process manager to run this process such as PM2
