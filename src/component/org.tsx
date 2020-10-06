import React from 'react';
import {
    BooleanField,
    BooleanInput,
    Create,
    Datagrid,
    DateField,
    Edit,
    List,
    SimpleForm,
    TextField,
    TextInput
} from 'react-admin';

export const OrgList = (props: any) => (
    <List {...props}>
        <Datagrid rowClick="edit">
            <TextField source="name" />
            <DateField source="createdAt" />
            <DateField source="updatedAt" />
            <BooleanField source="enabled" />
        </Datagrid>
    </List>
);

export const OrgEdit = (props: any) => (
    <Edit {...props}>
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
