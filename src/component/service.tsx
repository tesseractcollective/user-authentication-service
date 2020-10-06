import React from 'react';
import {
    Create,
    Datagrid,
    DateField,
    Edit,
    List,
    SimpleForm,
    TextField,
    TextInput,
    UrlField
} from 'react-admin';

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
