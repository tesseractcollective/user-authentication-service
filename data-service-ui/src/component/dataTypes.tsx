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
import YamlEditor from "./YamlEditor";

export const DataTypeList = (props: any) => (
  <List {...props}>
    <Datagrid rowClick="edit">
      <TextField source="name" />
      <JsonField source="meta" maxLength={20} />
      <DateField source="createdAt" />
      <DateField source="updatedAt" />
    </Datagrid>
  </List>
);

export const DataTypeEdit = (props: any) => (
  <Edit {...props}>
    <SimpleForm>
      <TextInput source="ownerId" name="ownerId" />
      <TextInput source="name" />
      <YamlEditor source="meta" isJson />
      <DateField source="createdAt" />
      <DateField source="updatedAt" />
      <TextField source="id" />
    </SimpleForm>
  </Edit>
);

export const DataTypeCreate = (props: any) => (
  <Create {...props}>
    <SimpleForm>
      <TextInput source="ownerId" name="ownerId" />
      <TextInput source="name" />
      <YamlEditor source="meta" isJson />
    </SimpleForm>
  </Create>
);
