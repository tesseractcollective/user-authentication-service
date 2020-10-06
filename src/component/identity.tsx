import React from 'react';
import {
    Create,
    Datagrid,
    DateField,
    Edit,
    List,
    ReferenceField,
    ReferenceInput,
    SelectInput,
    SimpleForm,
    TextField,
    TextInput
} from 'react-admin';
import { JsonField } from './JsonField';

export const IdentityList = (props: any) => (
    <List {...props}>
        <Datagrid rowClick="edit">
            <ReferenceField source="userId" reference="user">
                <TextField source="name" />
            </ReferenceField>
            <ReferenceField source="identityTypeId" reference="identityType">
                <TextField source="name" />
            </ReferenceField>
            <JsonField {...props} source="data" maxLength={30} />
            <DateField disabled source="createdAt" />
            <DateField disabled source="updatedAt" />
        </Datagrid>
    </List>
);

export const IdentityEdit = (props: any) => {
    return (
    <Edit {...props}>
        <SimpleForm>
            <ReferenceInput source="userId" reference="user">
                <SelectInput optionText="name" />
            </ReferenceInput>
            <ReferenceInput source="identityTypeId" reference="identityType">
                <SelectInput optionText="name" />
            </ReferenceInput>
            <TextInput source="data" />
            <TextField disabled source="id" />
            <DateField disabled source="createdAt" />
            <DateField disabled source="updatedAt" />
        </SimpleForm>
    </Edit>
)};

export const IdentityCreate = (props: any) => {
    return (
    <Create {...props}>
        <SimpleForm>
            <ReferenceInput source="userId" reference="user">
                <SelectInput optionText="name" />
            </ReferenceInput>
            <ReferenceInput source="identityTypeId" reference="identityType">
                <SelectInput optionText="name" />
            </ReferenceInput>
            <TextInput source="data" />
        </SimpleForm>
    </Create>
)};
