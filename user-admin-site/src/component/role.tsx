import React from "react";
import { Datagrid, DateField, List, Record, TextField } from "react-admin";

const RoleTitle = ({ record }: { record: Record }) => {
  return <span>Role {record ? `"${record.name}"` : ""}</span>;
};

export const RoleList = (props: any) => (
  <List title={<RoleTitle {...props} />} {...props}>
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
