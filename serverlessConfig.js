const {
  DynamoDbWrapper,
  SesEmail,
  SnsSms,
} = require("@tesseractcollective/serverless-toolbox"); // eslint-disable-line

module.exports.config = function (serverless) {
  const configFile = serverless.pluginManager.serverlessConfigFile;
  const cliOptions = serverless.pluginManager.cliOptions;
  const stage = cliOptions.stage || "dev";
  serverless.cli.consoleLog(`${configFile.service} stage: ${stage}`);

  const generalConfig = {
    region: "us-east-1",
    passwordTable: `${configFile.service}-${stage}-password`,
    userTable: `${configFile.service}-${stage}-user`,
    cacheTable: `${configFile.service}-${stage}-cache`,
    oAuthTables: {
      clientTable: `${configFile.service}-${stage}-oauth2-client`,
      tokenTable: `${configFile.service}-${stage}-oauth2-token`,
      authCodeTable: `${configFile.service}-${stage}-oauth2-code`,
      scopeTable: `${configFile.service}-${stage}-oauth2-scope`,
    },
  };

  const iamRoleStatements = {
    passwordTableIamRoleStatements: DynamoDbWrapper.iamRoleStatementForTable(
      generalConfig.passwordTable
    ),
    cacheTableIamRoleStatements: DynamoDbWrapper.iamRoleStatementForTable(
      generalConfig.cacheTable
    ),
    userTableIamRoleStatements: DynamoDbWrapper.iamRoleStatementForTable(
      generalConfig.userTable
    ),
    sesIamRoleStatements: SesEmail.iamRoleStatements(),
    smsIamRoleStatements: SnsSms.iamRoleStatements(),
    // oauth2 tables
    clientTableResource: DynamoDbWrapper.iamRoleStatementForTable(
      generalConfig.oAuthTables.clientTable
    ),
    tokenTableResource: DynamoDbWrapper.iamRoleStatementForTable(
      generalConfig.oAuthTables.tokenTable
    ),
    authCodeTableResource: DynamoDbWrapper.iamRoleStatementForTable(
      generalConfig.oAuthTables.authCodeTable
    ),
    scopeTableResource: DynamoDbWrapper.iamRoleStatementForTable(
      generalConfig.oAuthTables.scopeTable
    ),
  };
  const resources = {
    passwordTableResource: DynamoDbWrapper.cloudFormationForTableWithId(
      generalConfig.passwordTable
    ),
    userTableResource: DynamoDbWrapper.cloudFormationForTableWithId(
      generalConfig.userTable
    ),
    cacheTableResource: DynamoDbWrapper.cloudFormationForTableWithId(
      generalConfig.cacheTable,
      "expires"
    ),
    clientTableResource: DynamoDbWrapper.cloudFormationForTableWithId(
      generalConfig.oAuthTables.clientTable
    ),
    tokenTableResource: DynamoDbWrapper.cloudFormationForTableWithId(
      generalConfig.oAuthTables.tokenTable
    ),
    authCodeTableResource: DynamoDbWrapper.cloudFormationForTableWithId(
      generalConfig.oAuthTables.authCodeTable
    ),
    scopeTableResource: DynamoDbWrapper.cloudFormationForTable(
      generalConfig.oAuthTables.scopeTable,
      { name: "name", type: "S" }
    ),
  };

  const config = { ...generalConfig, ...iamRoleStatements, ...resources };
  return config;
};
