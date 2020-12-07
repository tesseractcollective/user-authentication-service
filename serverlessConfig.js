const { DynamoDbWrapper, SesEmail, SnsSms } = require('@tesseractcollective/serverless-toolbox');

module.exports.config = function (serverless) {
  const configFile = serverless.pluginManager.serverlessConfigFile;
  const cliOptions = serverless.pluginManager.cliOptions;
  const stage = cliOptions.stage || 'dev';
  serverless.cli.consoleLog(`${configFile.service} stage: ${stage}`);

  const generalConfig = {
    region: 'us-east-1',
    passwordTable: `${configFile.service}-${stage}-password`,
    userTable: `${configFile.service}-${stage}-user`,
    cacheTable: `${configFile.service}-${stage}-cache`,
  };
  const iamRoleStatements = {
    passwordTableIamRoleStatements: DynamoDbWrapper.iamRoleStatementForTable(generalConfig.passwordTable),
    cacheTableIamRoleStatements: DynamoDbWrapper.iamRoleStatementForTable(generalConfig.cacheTable),
    userTableIamRoleStatements: DynamoDbWrapper.iamRoleStatementForTable(generalConfig.userTable),
    sesIamRoleStatements: SesEmail.iamRoleStatements(),
    smsIamRoleStatements: SnsSms.iamRoleStatements(),
  };
  const resources = {
    passwordTableResource: DynamoDbWrapper.cloudFormationForTableWithId(generalConfig.passwordTable),
    userTableResource: DynamoDbWrapper.cloudFormationForTableWithId(generalConfig.userTable),
    cacheTableResource: DynamoDbWrapper.cloudFormationForTableWithId(generalConfig.cacheTable, 'expires'),
  };

  const config = { ...generalConfig, ...iamRoleStatements, ...resources };
  return config;
};
