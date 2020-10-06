import React from 'react';
import { List, Datagrid, TextField } from 'react-admin';

export const UserList = (props: any) => (
    <List {...props}>
        <Datagrid rowClick="edit">
            <TextField disabled source="id" />
        </Datagrid>
    </List>
);
