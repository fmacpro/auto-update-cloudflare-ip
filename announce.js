'use strict';

// Set config values here
let config = {
    email: 'myemail@email.com', // Cloudflare Email
    key: 'mycloudflareapikey', // Cloudflare API Key
    zone: 'mydomain.com', // DNS Zone (Top Level Domain Name e.g. mydomain.com)
    record: 'subdomain.mydomain.com', // DNS Record (A Record to update e.g. subdomain.mydomain.com)
    schedule: '*/5 * * * *', // How often to do the check e.g. every 5 minutes
    webhook: '', // Slack webhook URL for notification of IP changes
    getIP: {
	    replace: true,
	    services: ['http://ipv4bot.whatismyipaddress.com/'],
	    timeout: 600,
	    getIP: 'parallel'
    }
}

// Don't edit below this line
let slack = require('slack-notify')(config.webhook);

let zoneID = '';

let extIP = require('external-ip');
let getIP = extIP(config.getIP);

let CFClient = require('cloudflare');

let client = new CFClient({
    email: config.email,
    key: config.key
});

let schedule = require('node-schedule');
 
let j = schedule.scheduleJob(config.schedule, function(){
  checkDNS();
});

checkDNS(config);

function checkDNS(config) {

	// Get the DNS Zone for the configured zone
	let zones = client.browseZones([config.zone]);

	zones
		.then(function (zones) {

			// Return the zone ID (it will always be the first result)
			return zones.result[1].id

		}, function (error) {
		    console.error('uh oh: ', error);
		})
		.then(function (id) {
			
			console.log(id);

			// Store the DNS Zone ID for later
			zoneID = id;

			// Get the DNS Records for the configured zone
			let dns = client.browseDNS(id);

		    dns.then(function (dns) {

		        // Loop through the DNS records and find the matching record
				for (let i = 0; i < dns.result.length; i++) { 

					if (dns.result[i].name == config.record) {

						console.log(dns.result[i].name);

						// return the matching DNS record's ID
						return dns.result[i].id

					}

				}

		    }, function (error) {
		        console.error('uh oh: ', error);
		    })
		    .then(function (id) {

		    	console.log(id);

		    	let record = client.readDNS(id, zoneID);

		        record.then(function (record) {
		            
		            console.log("Declared IP: " + record.content);
		            
		            let cloudflareIP = record.content;

		            // Get the public IP address of the computer the script is running on
		            getIP(function (err, myIP) {
		            
		                if (err) {
		                    throw err;
		                }
		                else {

		                    console.log("Actual IP: " + myIP);

		                    // If the IP is different to the Cloudflare record update the record with the public IP address of the computer the script is running on
		                    if (myIP != cloudflareIP) {

		                        console.log("IP mismatch DNS update required");

		                        record.content = myIP;

		                        let result = client.editDNS(record);

		                        result.then(function (result) {

		                            console.log("IP set to " + result.content);

			                        slack.send({
			                        	text: "Public IP changed to " + result.content,
			                        	username: 'IP Alert'
			                        })

		                        }, function (error) {
		                            console.error('uh oh: ', error);
		                        });

		                    }
		                    // If the IP is the same do nothing
		                    else {

		                        console.log("IP match no DNS update required");

		                        //slack.send({
		                        //	text: "Public IP: " + myIP + " (no change)",
		                        //	username: 'IP Alert'
		                        //})

		                    }
		                }
		                
		            });

		        }, function (error) {
		            console.error('uh oh: ', error);
		        });

		    });

		});

}