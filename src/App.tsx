import React, { useEffect, useState } from 'react';
import buildHasuraProvider from 'ra-data-hasura-graphql';
import { Admin, ListGuesser, EditGuesser, Resource } from 'react-admin';
import './App.css';
import { UserList } from './component/user';
import { ServiceList, ServiceEdit, ServiceCreate } from './component/service';
import { IdentityTypeList, IdentityTypeEdit, IdentityTypeCreate } from './component/identity_type';
import { IdentityCreate, IdentityEdit, IdentityList } from './component/identity';

const apiUrl = 'https://needed-pony-62.hasura.app/v1/graphql'

const App = () => {
  const [dataProvider, setDataProvider] = useState<any>(undefined)
  useEffect(() => {
    if (!dataProvider) {
      buildHasuraProvider({
        clientOptions: {uri: apiUrl}
      }).then((newProvider: any) => setDataProvider(() => newProvider))
    }
  })
  if (!dataProvider) {
    return <div>Loading</div>;
  }
  return (
    <Admin dataProvider={dataProvider}>
      <Resource name="user" list={UserList} edit={EditGuesser} />
      <Resource name="policy" list={ListGuesser} edit={EditGuesser} />
      <Resource name="service" list={ServiceList} edit={ServiceEdit} create={ServiceCreate} />
      <Resource name="identity" list={IdentityList} edit={IdentityEdit} create={IdentityCreate} />
      <Resource name="identity_type" list={IdentityTypeList} edit={IdentityTypeEdit} create={IdentityTypeCreate} />
    </Admin>
  );
}

export default App;
