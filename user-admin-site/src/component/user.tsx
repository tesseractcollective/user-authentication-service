import React, { FunctionComponent, ReactNode, ReactElement } from "react";
import {
  BooleanField,
  BooleanInput,
  ChipField,
  Datagrid,
  DateField,
  Edit,
  List,
  Record,
  ReferenceManyField,
  Show,
  SingleFieldList,
  SimpleForm,
  Tab,
  TabbedShowLayout,
  TextField,
  TextInput,
} from "react-admin";
import { UserIdentitiesList } from "./userIdentities";

const UserTitle = ({ record }: { record: Record }) => {
  return <span>User {record ? `"${record.name}"` : ""}</span>;
};

export const UserList = (props: any) => (
  <List {...props}>
    <Datagrid rowClick="edit">
      <TextField source="name" />
      <TextField source="email" />
      <DateField source="createdAt" />
      <DateField source="updatedAt" />
      <BooleanField source="enabled" />
    </Datagrid>
  </List>
);

export const UserEdit = (props: any) => (
  <Edit title={<UserTitle {...props} />} {...props}>
    <SimpleForm>
      <TextInput source="name" />
      <BooleanInput source="enabled" />
      <TextField source="email" />

      <ReferenceManyField
        label="Authentication identities"
        reference="identity"
        target="userId"
      >
        <SingleFieldList>
          <ChipField source="identityTypeId" />
        </SingleFieldList>
      </ReferenceManyField>

      <DateField source="createdAt" />
      <DateField source="updatedAt" />
      <TextField source="id" />
    </SimpleForm>
  </Edit>
);

export const UserShow = (props: any) => {
  return (
    <Show title={<UserTitle {...props} />} {...props}>
      <TabbedShowLayout>
        <Tab label="Identities">
          <UserIdentitiesList />
        </Tab>
        {/* <Tab label="Organizations">
          <UserList />
        </Tab> */}
        <Tab label="User Permissions">
          <UserList />
        </Tab>
      </TabbedShowLayout>
    </Show>
  );
};
