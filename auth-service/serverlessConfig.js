const { DynamoDbWrapper } = require('aws-serverless-toolbox');

module.exports.config = function (serverless) {
  const configFile = serverless.pluginManager.serverlessConfigFile;
  const cliOptions = serverless.pluginManager.cliOptions;
  const stage = cliOptions.stage || 'dev';
  serverless.cli.consoleLog(`${configFile.service} stage: ${stage}`);

  const generalConfig = {
    region: 'us-east-1',
    passwordTable: `${configFile.service}-${stage}-password`,
    cacheTable: `${configFile.service}-${stage}-cache`,
  };
  const iamRoleStatements = {
    passwordTableIamRoleStatements: DynamoDbWrapper.iamRoleStatementForTable(generalConfig.passwordTable),
    cacheTableIamRoleStatements: DynamoDbWrapper.iamRoleStatementForTable(generalConfig.cacheTable),
  };
  const resources = {
    passwordTableResource: DynamoDbWrapper.cloudFormationForTableWithId(generalConfig.passwordTable),
    cacheTableResource: DynamoDbWrapper.cloudFormationForTableWithId(generalConfig.cacheTable, 'expires'),
  };

  const config = { ...generalConfig, ...iamRoleStatements, ...resources };
  return config;
};
