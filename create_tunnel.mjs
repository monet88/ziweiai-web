import crypto from 'crypto';

const accountId = "ac634c95b84b2c72e3ce2c221374b52b";
const zoneId = "1c5d822c34f9f118715871cbe653ad35";
const email = process.env.CLOUDFLARE_EMAIL;
const key = process.env.CLOUDFLARE_GLOBAL_API;
const tunnelName = "ziwei-demo";
const hostname = "ziwei.7app.online";

const headers = {
  "X-Auth-Email": email,
  "X-Auth-Key": key,
  "Content-Type": "application/json"
};

async function run() {
  const secret = crypto.randomBytes(32).toString('base64');
  console.log("Creating tunnel...");
  let res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/cfd_tunnel`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ name: tunnelName, tunnel_secret: secret })
  });
  let data = await res.json();
  if (!data.success) {
    console.error("Failed to create tunnel", data.errors);
    return;
  }
  const tunnelId = data.result.id;
  
  // Construct token
  const tokenPayload = { a: accountId, t: tunnelId, s: secret };
  const token = Buffer.from(JSON.stringify(tokenPayload)).toString('base64');
  console.log(`Tunnel ID: ${tunnelId}`);
  console.log(`Token: ${token}`);

  console.log("Configuring routing...");
  res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/cfd_tunnel/${tunnelId}/configurations`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({
      config: {
        ingress: [
          { hostname: hostname, service: "http://localhost:3005" },
          { service: "http_status:404" }
        ]
      }
    })
  });
  data = await res.json();
  if (!data.success) {
      console.error("Failed to config tunnel", data.errors);
  } else {
      console.log("Routing configured.");
  }

  console.log("Creating CNAME...");
  res = await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      type: "CNAME",
      name: hostname,
      content: `${tunnelId}.cfargotunnel.com`,
      proxied: true
    })
  });
  data = await res.json();
  if (!data.success) {
      if (data.errors.some(e => JSON.stringify(e).includes('already exists'))) {
          console.log("CNAME already exists. Let's find it and update it.");
          // To update, we'd need its ID. Let's skip update logic for now and just warn.
          console.warn(data.errors);
      } else {
          console.error("Failed to create CNAME", data.errors);
      }
  } else {
      console.log("CNAME created.");
  }
}
run();
