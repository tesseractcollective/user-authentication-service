const crypto = require("crypto");
const readline = require("readline");
const yaml = require('js-yaml');
const fs   = require('fs');
const AWS = require("aws-sdk");

const secretsmanager = new AWS.SecretsManager({
  apiVersion: "2017-10-17",
  region: "us-east-1",
});

async function promptForValue(prompt, defaultValue) {
  return new Promise((resolve, reject) => {
    let fullPrompt = prompt;
    if (defaultValue) {
      fullPrompt = `${prompt} (${defaultValue})`;
    }
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.question(`${fullPrompt}: `, (answer) => {
      rl.close();
      if (!answer) {
        return resolve(defaultValue);
      }
      resolve(answer);
    });
  });
}

async function promptForValueAndTest(prompt, test) {
  let value = await promptForValue(prompt);
  if (test) {
    while (!test(value)) {
      value = await promptForValue(prompt);
    }
  }
  return value;
}

(async () => {
  let service;
  try {
    const serverlessYaml = yaml.safeLoad(fs.readFileSync('./serverless.yaml', 'utf8'));
    service = serverlessYaml.service;
  } catch (error) {
    console.log(error);
  }
  if (!service) {
    console.log('no service defined in serverless.yml');
    return;
  }


  const stage = await promptForValueAndTest(
    "Stage (dev or prod)",
    (value) => value === "dev" || value === "prod"
  );
  const secretId = `${service}-${stage}`;

  const previousSecret = await secretsmanager
    .getSecretValue({ SecretId: secretId })
    .promise()
    .catch(() => {}) || {};
  let previousPayload = {};
  if (previousSecret.SecretString) {
    previousPayload = JSON.parse(previousSecret.SecretString);
  }

  const hasuraUrl = await promptForValue(
    "Hasura URL",
    previousPayload.hasuraUrl
  );
  const hasuraAdminSecret = await promptForValue(
    "Hasura Admin Secret",
    previousPayload.hasuraAdminSecret ||
      crypto.randomBytes(42).toString("base64")
  );
  const jwtSecret = await promptForValue(
    "JWT Secret",
    previousPayload.jwtSecret || crypto.randomBytes(52).toString("base64")
  );

  const payload = { hasuraUrl, hasuraAdminSecret, jwtSecret };

  const secret = JSON.stringify(payload, null, 2);

  console.log();
  console.log(`secretId: ${secretId}`);
  console.log(`secret: ${secret}`);
  const ready = await promptForValueAndTest(
    "Ready to save to secrets manager y/n",
    (v) => v.toLowerCase() === "y" || v.toLowerCase() === "n"
  );

  if (ready.toLowerCase() === "y") {
    try {
      const response = await secretsmanager
        .putSecretValue({
          SecretId: secretId,
          SecretString: secret,
        })
        .promise();

      console.log(response);
    } catch (error) {
      console.log(error);
    }
  }
  console.log("done");
})();
