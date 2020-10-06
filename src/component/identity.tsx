import React from 'react';
import { List, Datagrid, TextField, ReferenceField, Edit, SimpleForm, TextInput, ReferenceInput, SelectInput, Create } from 'react-admin';

export const IdentityList = (props: any) => (
    <List {...props}>
        <Datagrid rowClick="edit">
            <ReferenceField source="userId" reference="user">
                <TextField source="id" />
            </ReferenceField>
            <ReferenceField source="identityTypeId" reference="identityType">
                <TextField source="name" />
            </ReferenceField>
            <TextField source="data" />
        </Datagrid>
    </List>
);

export const IdentityEdit = (props: any) => {
    return (
    <Edit {...props}>
        <SimpleForm>
            <TextInput disabled source="id" />
            <ReferenceInput source="userId" reference="user">
                <SelectInput optionText="id" />
            </ReferenceInput>
            <ReferenceInput source="identityTypeId" reference="identityType">
                <SelectInput optionText="name" />
            </ReferenceInput>
            <TextInput source="data" />
        </SimpleForm>
    </Edit>
)};

export const IdentityCreate = (props: any) => {
    console.log("props!");
    console.log(JSON.stringify(props));
    return (
    <Create {...props}>
        <SimpleForm>
            <ReferenceInput source="userId" reference="user">
                <SelectInput optionText="id" />
            </ReferenceInput>
            <ReferenceInput source="identityTypeId" reference="identityType">
                <SelectInput optionText="name" />
            </ReferenceInput>
            <TextInput source="data" />
        </SimpleForm>
    </Create>
)};