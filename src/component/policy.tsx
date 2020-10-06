import React from 'react';
import { 
    Create,
    Datagrid,
    DateField,
    Edit,
    List,
    ReferenceField,
    ReferenceInput,
    SimpleForm,
    SelectInput,
    TextField,
    TextInput
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
            <TextInput source="name" />
            <ReferenceInput source="serviceId" reference="service">
                <SelectInput optionText="name" />
            </ReferenceInput>
            <TextInput source="actions" />
            <TextInput source="tables" />
            <TextInput source="hasuraServiceRole" />
            <DateField source="createdAt" />
            <DateField source="updatedAt" />
            <TextField source="id" />
        </SimpleForm>
    </Edit>
);

export const PolicyCreate = (props: any) => (
    <Create {...props}>
        <SimpleForm>
            <TextInput source="name" />
            <ReferenceInput source="serviceId" reference="service">
                <SelectInput optionText="name" />
            </ReferenceInput>
            <TextInput source="actions" />
            <TextInput source="tables" />
            <TextInput source="hasuraServiceRole" />
            <DateField source="createdAt" />
            <DateField source="updatedAt" />
            <TextField source="id" />
        </SimpleForm>
    </Create>
);
