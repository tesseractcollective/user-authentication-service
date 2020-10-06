import React from 'react';
import { 
    List,
    Datagrid,
    DateField,
    TextField,
    ReferenceField,
    Edit,
    SimpleForm,
    TextInput,
    DateInput,
    ReferenceInput,
    SelectInput,
    Create
} from 'react-admin';

export const PolicyList = (props: any) => (
    <List {...props}>
        <Datagrid rowClick="edit">
            <TextField source="name" />
            <ReferenceField source="serviceId" reference="service">
                <TextField source="name" />
            </ReferenceField>
            <TextField source="actions" />
            <TextField source="tables" />
            <TextField source="hasuraServiceRole" />
            <DateField source="createdAt" />
            <DateField source="updatedAt" />
        </Datagrid>
    </List>
);

export const PolicyEdit = (props: any) => (
    <Edit {...props}>
        <SimpleForm>
            <TextInput disabled source="id" />
            <TextInput source="name" />
            <ReferenceInput source="serviceId" reference="service">
                <SelectInput optionText="name" />
            </ReferenceInput>
            <TextInput source="actions" />
            <TextInput source="tables" />
            <TextInput source="hasuraServiceRole" />
            <DateInput disabled source="createdAt" />
            <DateInput disabled source="updatedAt" />
        </SimpleForm>
    </Edit>
);

export const PolicyCreate = (props: any) => (
    <Create {...props}>
        <SimpleForm>
            <TextInput disabled source="id" />
            <TextInput source="name" />
            <ReferenceInput source="serviceId" reference="service">
                <SelectInput optionText="name" />
            </ReferenceInput>
            <TextInput source="actions" />
            <TextInput source="tables" />
            <TextInput source="hasuraServiceRole" />
            <DateInput disabled source="createdAt" />
            <DateInput disabled source="updatedAt" />
        </SimpleForm>
    </Create>
);
