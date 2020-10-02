# User Authentication Service

## Requirements of other services to work with authentication service:

- Role based permissions defined
  - Any number of roles with any names are allowed
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
type Grant {
  ownerId: uuid!
  granteeId: uuid!
}
```

- Row permissions would have the following checks:

```
{
  "_or": [
    {
      "ownerId": {
        "_eq": "x-hasura-owner-id"
      }
    },
    {
      "grants": {
        "granteeId": {
          "_eq": "x-hasura-owner-id"
        }
      }
    },
    {
      "grants": {
        "granteeId": {
          "_eq": "x-hasura-grant-id"
        }
      }
    }
  ]
}
```

## Requirements for Authentication Service