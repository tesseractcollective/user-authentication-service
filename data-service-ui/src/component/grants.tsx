import React from "react";
import {
  Create,
  Datagrid,
  DateField,
  Edit,
  List,
  SimpleForm,
  TextField,
  TextInput,
} from "react-admin";

export const GrantList = (props: any) => (
  <List {...props}>
    <Datagrid rowClick="edit">
      <TextField source="ownerId" />
      <TextField source="granteeId" />
      <TextField source="actions" />
      <TextField source="tables" />
      <DateField source="createdAt" />
      <DateField source="updatedAt" />
    </Datagrid>
  </List>
);

export const GrantEdit = (props: any) => (
  <Edit {...props}>
    <SimpleForm>
      <TextInput source="ownerId" />
      <TextInput source="granteeId" />
      <TextInput source="actions" />
      <TextInput source="tables" />
      <DateField source="createdAt" />
      <DateField source="updatedAt" />
      <TextField source="id" />
    </SimpleForm>
  </Edit>
);

export const GrantCreate = (props: any) => (
  <Create {...props}>
    <SimpleForm>
      <TextInput source="ownerId" />
      <TextInput source="granteeId" />
      <TextInput source="actions" />
      <TextInput source="tables" />
    </SimpleForm>
  </Create>
);
