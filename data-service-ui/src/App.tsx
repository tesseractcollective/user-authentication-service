import React, { useEffect, useState } from "react";
import buildHasuraProvider from "ra-data-hasura-graphql";
import { Admin, Resource, Loading } from "react-admin";

import {
  DataTypeList,
  DataTypeCreate,
  DataTypeEdit,
} from "./component/dataTypes";
import {
  TimeSeriesDataCreate,
  TimeSeriesDataEdit,
  TimeSeriesDataList,
} from "./component/timeseriesData";
import { GrantCreate, GrantEdit, GrantList } from "./component/grants";

const apiUrl = "https://composed-mackerel-44.hasura.app/v1/graphql";

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
    return <Loading loadingPrimary="Loading" loadingSecondary="" />;
  }
  return (
    <Admin dataProvider={dataProvider}>
      <Resource
        name="dataTypes"
        list={DataTypeList}
        create={DataTypeCreate}
        edit={DataTypeEdit}
      />
      <Resource
        name="timeseriesData"
        list={TimeSeriesDataList}
        create={TimeSeriesDataCreate}
        edit={TimeSeriesDataEdit}
      />
      <Resource
        name="grants"
        list={GrantList}
        create={GrantCreate}
        edit={GrantEdit}
      />
    </Admin>
  );
};

export default App;
