import React from 'react';
import { ReferenceManyField } from 'react-admin';
import { ChipField } from 'react-admin';
import { SelectArrayInput } from 'react-admin';
import { ReferenceFieldController } from 'react-admin';
import { SingleFieldList } from 'react-admin';
import { DateInput } from 'react-admin';
import { TextInput } from 'react-admin';
import { List, Datagrid, TextField, DateField, Edit, SimpleForm, Create } from 'react-admin';

export const UserList = (props: any) => (
    <List {...props}>
        <Datagrid rowClick="edit">
            <TextField source="id" />
            <DateField source="createdAt" />
            <DateField source="updatedAt" />
        </Datagrid>
    </List>
);

export const UserEdit = (props: any) => (
    <Edit {...props}>
        <SimpleForm>
            <ReferenceManyField
                label="Authentication identities"
                reference="identity" 
                target="userId"
            >
                <SingleFieldList>
                    <ChipField source="identityTypeId" />
                </SingleFieldList>
            </ReferenceManyField>
            {/* <ReferenceFieldController
                label="Identity"
                reference="identity"
                source="userId"
            >
                {({ referenceRecord }: { referenceRecord: any}) => {
                    console.log("Printing")
                    console.log(JSON.stringify(referenceRecord))
                    return (
                    <SelectArrayInput
                        choice={referenceRecord ? referenceRecord.identityTypeId: []}
                        source="id"
                    />
                )}}
            </ReferenceFieldController> */}
            <TextInput disabled source="id" />
            <DateInput disabled source="createdAt" />
            <DateInput disabled source="updatedAt" />
        </SimpleForm>
    </Edit>
);
