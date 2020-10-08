import React, { useState } from "react";
import {
  TopToolbar,
  List,
  Datagrid,
  TextField,
  Create,
  SimpleForm,
  ReferenceInput,
  SelectInput,
  ReferenceField,
  useRefresh,
} from "react-admin";
import Drawer from "@material-ui/core/Drawer";
import Button from "@material-ui/core/Button";
import AddIcon from "@material-ui/icons/Add";
import Typography from "@material-ui/core/Typography";

export const OrgPermissionsList = (props: any) => {
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
    basePath: "/orgPermissions",
    resource: "orgPermissions",
    hasList: true,
    hasEdit: false,
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
        title="Org Roles"
        filter={{ orgId }}
        actions={<Actions />}
      >
        <Datagrid>
          <ReferenceField label="Role name" source="roleId" reference="role">
            <TextField source="name" />
          </ReferenceField>
        </Datagrid>
      </List>

      <Drawer open={showCreate} anchor="right" onClose={onCreateCancel}>
        <OrgPermissionsCreate
          {...props}
          onCancel={onCreateCancel}
          orgId={orgId}
        />
      </Drawer>
    </>
  );
};

export const OrgPermissionsCreate = (props: any) => {
  const { orgId, record, onCancel, ...rest } = props;
  const refresh = useRefresh();
  const overrides = {
    basePath: "/orgPermissions",
    resource: "orgPermissions",
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
        <ReferenceInput label="Role" source="roleId" reference="role">
          <SelectInput />
        </ReferenceInput>
      </SimpleForm>
    </Create>
  );
};
