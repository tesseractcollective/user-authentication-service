import React from "react";
import {
  BooleanField,
  BooleanInput,
  Create,
  Datagrid,
  DateField,
  Edit,
  List,
  Record,
  Show,
  SimpleForm,
  Tab,
  TabbedShowLayout,
  TextField,
  TextInput,
} from "react-admin";
import { UserOrgMemberList } from "./userOrgMember";
import { OrgPermissionsList } from "./orgPermissions";

const OrgTitle = ({ record }: { record: Record }) => {
  return <span>Org {record ? `"${record.name}"` : ""}</span>;
};

export const OrgList = (props: any) => (
  <List title={<OrgTitle {...props} />} {...props}>
    <Datagrid rowClick="edit">
      <TextField source="name" />
      <DateField source="createdAt" />
      <DateField source="updatedAt" />
      <BooleanField source="enabled" />
    </Datagrid>
  </List>
);

export const OrgEdit = (props: any) => (
  <Edit title={<OrgTitle {...props} />} {...props}>
    <SimpleForm>
      <TextInput source="name" />
      <BooleanInput source="enabled" />
      <DateField source="createdAt" />
      <DateField source="updatedAt" />
      <TextField source="id" />
    </SimpleForm>
  </Edit>
);

export const OrgCreate = (props: any) => (
  <Create {...props}>
    <SimpleForm>
      <TextInput source="name" />
    </SimpleForm>
  </Create>
);

export const OrgShow = (props: any) => {
  return (
    <Show title={<OrgTitle {...props} />} {...props}>
      <TabbedShowLayout>
        <Tab label="Members">
          <UserOrgMemberList />
        </Tab>
        <Tab label="Org Roles">
          <OrgPermissionsList />
        </Tab>
      </TabbedShowLayout>
    </Show>
  );
};
