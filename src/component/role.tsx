import React from 'react';
import { 
    Datagrid,
    DateField,
    List,
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
