import React, { useState } from "react";
import {
  Create,
  Datagrid,
  List,
  ReferenceField,
  ReferenceInput,
  SelectInput,
  SimpleForm,
  TextField,
  TopToolbar,
  useRefresh,
} from "react-admin";
import Drawer from "@material-ui/core/Drawer";
import Button from "@material-ui/core/Button";
import AddIcon from "@material-ui/icons/Add";
import Typography from "@material-ui/core/Typography";

export const UserOrgMemberList = (props: any) => {
  // TODO: delete poll option still redirects to an assumed route
  const [editItem, setEditItem] = useState<any>(null);
  const [showCreate, setShowCreate] = useState(false);
  const onCreateCancel = () => {
    setShowCreate(false);
  };
  const onEditCancel = () => {
    setEditItem(null);
  };

  const onRowClick = (id: string, basePath: string, record: any) => {
    setEditItem({ id, basePath, record });
  };

  const overrides = {
    basePath: "/userOrgMember",
    resource: "userOrgMember",
    hasList: true,
    hasEdit: true,
    hasShow: true,
    hasCreate: true,
  };

  const orgId = props.record?.id;

  // override create button so it doesn't follow a route
  const Actions = () => (
    <TopToolbar>
      <Button color="primary" onClick={() => setShowCreate(true)}>
        <AddIcon />
        <Typography>Add</Typography>
      </Button>
    </TopToolbar>
  );

  return (
    <>
      <List
        {...props}
        {...overrides}
        title="Org Members"
        filter={{ orgId }}
        actions={<Actions />}
      >
        <Datagrid>
          <ReferenceField label="Members" source="userId" reference="user">
            <TextField source="name" />
          </ReferenceField>
        </Datagrid>
      </List>

      <Drawer open={showCreate} anchor="right" onClose={onCreateCancel}>
        <UserOrgMemberCreate
          {...props}
          onCancel={onCreateCancel}
          orgId={orgId}
        />
      </Drawer>
    </>
  );
};

export const UserOrgMemberCreate = (props: any) => {
  const { orgId, record, onCancel, ...rest } = props;
  const refresh = useRefresh();
  const overrides = {
    basePath: "/userOrgMember",
    resource: "userOrgMember",
    onSuccess: () => {
      refresh();
      onCancel();
    },
  };

  return (
    <Create {...rest} {...overrides}>
      <SimpleForm>
        <ReferenceInput
          disabled
          label="Org"
          source="orgId"
          reference="org"
          initialValue={orgId}
        >
          <SelectInput />
        </ReferenceInput>
        <ReferenceInput label="User" source="userId" reference="user">
          <SelectInput />
        </ReferenceInput>
      </SimpleForm>
    </Create>
  );
};
