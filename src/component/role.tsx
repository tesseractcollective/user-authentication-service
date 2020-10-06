import React from 'react';
import { 
    ChipField,
    Create,
    Datagrid,
    DateField,
    Edit,
    List,
    ReferenceField,
    ReferenceInput,
    ReferenceManyField,
    SelectInput,
    SimpleForm,
    SingleFieldList,
    TextField,
} from 'react-admin';

export const RoleList = (props: any) => (
    <List {...props}>
        <Datagrid rowClick="edit">
            <TextField source="name" />
            {/* <ReferenceManyField reference="rolePolicyMembers" target="roleId">
                <SingleFieldList>
                    <ChipField source="policy.name" />
                </SingleFieldList>
            </ReferenceManyField> */}
            <DateField source="createdAt" />
            <DateField source="updatedAt" />
        </Datagrid>
    </List>
);
