import React from 'react';
import { List, Datagrid, DateField, TextField, UrlField, Edit, SimpleForm, DateInput, TextInput, Create} from 'react-admin';

export const ServiceList = (props: any) => (
    <List {...props}>
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
    <Edit {...props}>
        <SimpleForm>
            <TextInput disabled source="id" />
            <TextInput source="name" />
            <TextInput source="url" />
            <TextInput source="namespace" />
            <DateInput source="createdAt" />
            <DateInput source="updatedAt" />
        </SimpleForm>
    </Edit>
);

export const ServiceCreate = (props: any) => (
    <Create {...props}>
        <SimpleForm>
            <TextInput source="name" />
            <TextInput source="url" />
            <TextInput source="namespace" />
            <DateInput source="createdAt" />
            <DateInput source="updatedAt" />
        </SimpleForm>
    </Create>
);
