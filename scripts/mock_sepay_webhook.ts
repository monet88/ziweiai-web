import 'dotenv/config';

async function run() {
  const shortUuid = process.argv[2];
  if (!shortUuid || shortUuid.length !== 8) {
    console.error('Usage: tsx mock_sepay_webhook.ts <short_uuid_8_chars>');
    process.exit(1);
  }

  const payload = {
    id: Math.floor(Math.random() * 1000000),
    gateway: "MBBank",
    transactionDate: new Date().toISOString().replace('T', ' ').substring(0, 19),
    accountNumber: "0123456789",
    code: null,
    content: `TVTT ${shortUuid}`,
    transferType: "in",
    transferAmount: 50000, // 50 XU
    accumulated: 150000,
    referenceCode: `REF${Math.floor(Math.random() * 10000)}`,
    description: "Chuyen khoan nap XU"
  };

  console.log('Sending payload:', payload);

  const response = await fetch('http://localhost:3005/webhooks/sepay', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // 'Authorization': `Bearer ${process.env.SEPAY_WEBHOOK_SECRET}` // If set in .env
    },
    body: JSON.stringify(payload)
  });

  if (response.ok) {
    const data = await response.json();
    console.log('Success:', data);
  } else {
    console.error('Failed:', response.status, response.statusText);
    try {
      const errorData = await response.json();
      console.error(errorData);
    } catch {
      // ignore
    }
  }
}

run().catch(console.error);
