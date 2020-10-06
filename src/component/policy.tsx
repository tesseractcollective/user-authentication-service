import React from 'react';
import { List, Datagrid, DateField, TextField, UrlField } from 'react-admin';

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
