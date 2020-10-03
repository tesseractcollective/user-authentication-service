# User Authentication Service

## Requirements of other services to work with authentication service:

- Role based permissions defined
  - Any number of roles with any names are allowed, but most services will just have one role called `grant`
  - Roles will use the custom fields `x-hasura-owner-id` and `x-hasura-grant-id` to define permissions. Example: a user will have a JWT with `x-hasura-owner-id: <USER_ID>`, `x-hasura-role: <GIVEN_ROLE>`, and `x-hasura-grant-id: <ORG_ID>`. In the Authentication service, each user or org may only have one role per service. So at any given time, a user will only be able to access things they own or things the org in the token owns given the single defined role. 
  - Question: do we want to establish our own namespace like `x-tsrct-owner-id`?
- JWT authentication setup with a custom claim namespace per service
- Each table that has permissions has an `ownerId`

```gql
type ObjectWithPermissions {
  id: uuid!
  ownerId: uuid!
  ...
}
```

- Each service has a grant table to map from one owner id to another. This allows users and orgs to grant access to each other. 

```gql
type Grants {
  ownerId: uuid!
  granteeId: uuid!
  actions: String! # comma separated values of one or more of the following: insert, select, update, and delete
  tables: String!  # comma separated table names
  createdAt: timestamptz
  updatedAt: timestamptz
}
```

- Row permissions would have the following checks (Note: the action `%insert%` will be changed to match the permission (insert, select, update, or delete) and the tableName `%documentData%` will be changed to match the table the permission is on):

```json
{
  "_or": [
    {
      "_and": [
        {
          "grants": {
            "granteeId": {
              "_eq": "X-Hasura-Owner-Id"
            }
          }
        },
        {
          "grants": {
            "actions": {
              "_like": "%insert%"
            }
          }
        },
        {
          "grants": {
            "tables": {
              "_like": "%documentData%"
            }
          }
        }
      ]
    },
    {
      "_and": [
        {
          "grants": {
            "granteeId": {
              "_eq": "X-Hasura-Grant-Id"
            }
          }
        },
        {
          "grants": {
            "actions": {
              "_like": "%insert%"
            }
          }
        },
        {
          "grants": {
            "tables": {
              "_like": "%documentData%"
            }
          }
        }
      ]
    }
  ]
}
```

## Requirements for Authentication Service

### Policies

A policy defines actions for a table or group of tables. If different actions are needed for different tables, multiple policy documents are created. All services have a `grant` service role with the most often used column level permissions. Other roles with other column level permissions may be defined. 

```gql
type Policy {
  id: uuid!
  name: String!
  service: String!
  serviceRole: String! # default: "grant"
  roleId: uuid!        # the Authentication Service role this policy belongs to
  actions: String!     # comma separated values of one or more of the following: insert, select, update, and delete
  tables: String!      # comma separated table names
  createdAt: timestamptz
  updatedAt: timestamptz
}
```

### Roles 

Roles group policies together and can be assigned to users or organizations

```gql
type Role {
  id: uuid!
  name: String!
  policies: [Policy!]!
  createdAt: timestamptz
  updatedAt: timestamptz
}
```
