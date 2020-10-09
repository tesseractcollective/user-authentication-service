import React from "react";
import {
  Create,
  Datagrid,
  DateField,
  DateTimeInput,
  Edit,
  List,
  ReferenceField,
  ReferenceInput,
  SelectInput,
  SimpleForm,
  TextField,
  TextInput,
} from "react-admin";

import { JsonField } from "./JsonField";
import YamlEditor from "./YamlEditor";

export const TimeSeriesDataList = (props: any) => (
  <List {...props}>
    <Datagrid rowClick="edit">
      <ReferenceField label="Type" source="typeId" reference="dataTypes">
        <TextField source="name" />
      </ReferenceField>
      <JsonField source="data" maxLength={20} />
      <DateField source="timestamp" showTime />
    </Datagrid>
  </List>
);

export const TimeSeriesDataEdit = (props: any) => (
  <Edit {...props}>
    <SimpleForm>
      <TextInput source="ownerId" name="ownerId" />
      <ReferenceInput label="Type" source="typeId" reference="dataTypes">
        <SelectInput optionText="name" />
      </ReferenceInput>
      <DateTimeInput source="timestamp" />
      <YamlEditor source="data" isJson />
    </SimpleForm>
  </Edit>
);

export const TimeSeriesDataCreate = (props: any) => (
  <Create {...props}>
    <SimpleForm>
      <TextInput source="ownerId" name="ownerId" />
      <ReferenceInput label="Type" source="typeId" reference="dataTypes">
        <SelectInput optionText="name" />
      </ReferenceInput>
      <DateTimeInput source="timestamp" />
      <YamlEditor source="data" isJson />
    </SimpleForm>
  </Create>
);
