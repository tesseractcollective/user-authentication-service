import React from "react";
import {
  Create,
  Datagrid,
  DateField,
  Edit,
  List,
  Record,
  SimpleForm,
  TextField,
  TextInput,
  UrlField,
} from "react-admin";

const ServiceTitle = ({ record }: { record: Record }) => {
  return <span>Service {record ? `"${record.name}"` : ""}</span>;
};

export const ServiceList = (props: any) => (
  <List title={<ServiceTitle {...props} />} {...props}>
    <Datagrid rowClick="edit">
      <TextField source="name" />
      <UrlField source="url" />
      <TextField source="namespace" />
      <DateField source="createdAt" />
      <DateField source="updatedAt" />
    </Datagrid>
  </List>
);

export const ServiceEdit = (props: any) => (
  <Edit title={<ServiceTitle {...props} />} {...props}>
    <SimpleForm>
      <TextInput source="name" />
      <TextInput source="url" />
      <TextInput source="namespace" />
      <DateField source="createdAt" />
      <DateField source="updatedAt" />
      <TextField source="id" />
    </SimpleForm>
  </Edit>
);

export const ServiceCreate = (props: any) => (
  <Create {...props}>
    <SimpleForm>
      <TextInput source="name" />
      <TextInput source="url" />
      <TextInput source="namespace" />
    </SimpleForm>
  </Create>
);
