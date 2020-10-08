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
import { JsonField } from "./JsonField";

export const IdentityTypeList = (props: any) => (
  <List {...props}>
    <Datagrid rowClick="edit">
      <TextField source="name" />
      <JsonField {...props} source="meta" maxLength={30} />
      <DateField source="createdAt" />
      <DateField source="updatedAt" />
    </Datagrid>
  </List>
);

export const IdentityTypeEdit = (props: any) => (
  <Edit {...props}>
    <SimpleForm>
      <TextInput source="name" />
      <TextInput source="meta" />
      <DateField source="createdAt" />
      <DateField source="updatedAt" />
      <TextField source="id" />
    </SimpleForm>
  </Edit>
);

export const IdentityTypeCreate = (props: any) => (
  <Create {...props}>
    <SimpleForm>
      <TextInput source="name" />
      <TextInput source="meta" />
      <DateField source="createdAt" />
      <DateField source="updatedAt" />
    </SimpleForm>
  </Create>
);
