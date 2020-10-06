import React from 'react';
import { List, Datagrid, DateField, TextField, UrlField, Edit, SimpleForm, DateInput, TextInput, Create} from 'react-admin';

export const OrgList = (props: any) => (
    <List {...props}>
        <Datagrid rowClick="edit">
            <TextField source="name" />
            <DateField source="createdAt" />
            <DateField source="updatedAt" />
        </Datagrid>
    </List>
);

export const OrgEdit = (props: any) => (
    <Edit {...props}>
        <SimpleForm>
            <TextInput disabled source="id" />
            <TextInput source="name" />
            <DateInput disabled source="createdAt" />
            <DateInput disabled source="updatedAt" />
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
