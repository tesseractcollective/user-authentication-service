import React, { useEffect, useState } from "react";
import buildHasuraProvider from "ra-data-hasura-graphql";
import { Admin, Resource } from "react-admin";
import "./App.css";
import { UserEdit, UserList, UserShow } from "./component/user";
import { ServiceList, ServiceEdit, ServiceCreate } from "./component/service";
import {
  IdentityTypeList,
  IdentityTypeEdit,
  IdentityTypeCreate,
} from "./component/identityType";
import {
  IdentityCreate,
  IdentityEdit,
  IdentityList,
} from "./component/identity";
import { OrgCreate, OrgEdit, OrgList, OrgShow } from "./component/org";
import { PolicyCreate, PolicyEdit, PolicyList } from "./component/policy";
import { RoleList } from "./component/role";

const apiUrl = 'https://needed-pony-62.hasura.app/v1/graphql'
// const apiUrl = "http://localhost:8080/v1/graphql";

const App = () => {
  const [dataProvider, setDataProvider] = useState<any>(undefined);
  useEffect(() => {
    if (!dataProvider) {
      buildHasuraProvider({
        clientOptions: { uri: apiUrl },
      }).then((newProvider: any) => setDataProvider(() => newProvider));
    }
  });
  if (!dataProvider) {
    return <div>Loading</div>;
  }
  return (
    <Admin dataProvider={dataProvider}>
      <Resource name="user" list={UserList} edit={UserEdit} show={UserShow} />
      <Resource
        name="org"
        list={OrgList}
        edit={OrgEdit}
        create={OrgCreate}
        show={OrgShow}
      />
      <Resource
        name="policy"
        list={PolicyList}
        edit={PolicyEdit}
        create={PolicyCreate}
      />
      <Resource name="role" list={RoleList} />
      <Resource
        name="service"
        list={ServiceList}
        edit={ServiceEdit}
        create={ServiceCreate}
      />
      <Resource
        name="identity"
        list={IdentityList}
        edit={IdentityEdit}
        create={IdentityCreate}
      />
      <Resource
        name="identityType"
        list={IdentityTypeList}
        edit={IdentityTypeEdit}
        create={IdentityTypeCreate}
      />
      <Resource name="rolePolicyMembers" />
      <Resource name="orgPermissions" />
      <Resource name="userPermissions" />
      <Resource name="userOrgMember" />
    </Admin>
  );
};

export default App;
