import React from 'react';
import { SingleFieldList } from 'react-admin';
import { 
    List,
    Datagrid,
    DateField,
    TextField,
    ReferenceManyField,
    ChipField,
    ReferenceField,
    Edit,
    SimpleForm,
    TextInput,
    DateInput,
    ReferenceInput,
    SelectInput,
    Create
} from 'react-admin';

export const RoleList = (props: any) => (
    <List {...props}>
        <Datagrid rowClick="edit">
            <TextField source="name" />
            <ReferenceManyField reference="rolePolicyMembers" target="roleId">
                <SingleFieldList>
                    <ChipField source="policy.name" />
                </SingleFieldList>
            </ReferenceManyField>
            <DateField source="createdAt" />
            <DateField source="updatedAt" />
        </Datagrid>
    </List>
);
